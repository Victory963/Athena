import path from "path";
import type { PrismaClient } from "@prisma/client";
import {
  GUARD_HOLDOUT,
  GUARD_LABEL,
  HORIZON_ID,
  LEXICON_ID,
  admitRepo,
  emptyPin,
  lexiconLabel,
  rankDue,
  readPin,
  scoreLabels,
  writePin,
  type GuardExpect,
  type GuardPin,
} from "./guard-roster";

type PipelineFn = (text: string, options?: { top_k?: number }) => Promise<unknown>;

let warm: { id: string; run: PipelineFn } | null = null;
let loading: Promise<PipelineFn | null> | null = null;

function readLabel(output: unknown): GuardExpect {
  const row = Array.isArray(output) ? output[0] : output;
  const label = String((row as { label?: string } | undefined)?.label ?? "");
  const score = Number((row as { score?: number } | undefined)?.score ?? 0);
  if (/INJECTION|LABEL_1/i.test(label)) return score >= 0.5 ? "INJECTION" : "SAFE";
  return "SAFE";
}

async function horizonPipe(): Promise<PipelineFn | null> {
  if (warm?.id === HORIZON_ID) return warm.run;
  if (!loading) {
    loading = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.cacheDir = path.join(process.cwd(), ".cache", "hf");
      env.allowRemoteModels = true;
      const pipe = (await pipeline("text-classification", HORIZON_ID, {
        dtype: "q8",
        device: "cpu",
      })) as PipelineFn;
      warm = { id: HORIZON_ID, run: pipe };
      return pipe;
    })().catch((error) => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

async function labelWith(pipe: PipelineFn, text: string): Promise<GuardExpect> {
  const output = await pipe(text, { top_k: 1 });
  return readLabel(output);
}

async function ensureHorizon() {
  if (warm?.id === HORIZON_ID) return warm.run;
  return horizonPipe();
}

export async function activeGuardLabel(text: string): Promise<GuardExpect> {
  if (lexiconLabel(text) === "INJECTION") return "INJECTION";
  const pin = readPin();
  if (pin.activeId !== HORIZON_ID) return "SAFE";
  try {
    const pipe = await ensureHorizon();
    if (!pipe) return "SAFE";
    return await labelWith(pipe, text.slice(0, 1500));
  } catch {
    return "SAFE";
  }
}

async function discover(prisma: PrismaClient) {
  const response = await fetch(
    "https://huggingface.co/api/models?search=prompt-injection&filter=text-classification&sort=downloads&direction=-1&limit=8",
    { signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) return;
  const models = (await response.json()) as { id?: string; pipeline_tag?: string; downloads?: number }[];
  for (const model of models) {
    const id = String(model.id ?? "");
    if (!id) continue;
    const admission = admitRepo(id, model.pipeline_tag);
    if (admission === "closed") continue;
    const title =
      admission === "refuse-generative" ? `拒绝生成式模型 ${id}` : `未并入的分类器 ${id}`;
    const existing = await prisma.governanceProposal.findFirst({
      where: { title, status: "pending" },
    });
    if (existing) continue;
    const why =
      admission === "refuse-generative"
        ? "生成式模型不进入防守分类器，也不下载。"
        : "新的文本分类器只进入人工闸门，不下载、不并入。";
    await prisma.governanceProposal.create({
      data: {
        kind: "guard-model",
        title,
        detail: `${why} Hub 下载量 ${model.downloads ?? "?"} 不是晋升条件。执行器清单仍是 15 个。`,
        status: "pending",
        merged: false,
      },
    });
  }
}

export async function rankGuards(prisma: PrismaClient, force = false): Promise<GuardPin & { skipped: boolean; announce: string | null }> {
  const current = readPin();
  if (!force && !rankDue(current)) {
    if (current.activeId === HORIZON_ID) {
      try {
        await ensureHorizon();
      } catch {
        // Cached weights can be read on the next utterance. Explicit overrides still hit the lexicon.
      }
    }
    return { ...current, skipped: true, announce: null };
  }

  const lexicon = scoreLabels(GUARD_HOLDOUT.map((row) => lexiconLabel(row.text)));
  const board = [
    {
      id: LEXICON_ID,
      label: GUARD_LABEL[LEXICON_ID],
      score: lexicon.score,
      loaded: true,
      note: `${lexicon.correct}/${lexicon.total}，误拦 ${lexicon.falseRejects}`,
    },
  ];

  let horizonNote = "未加载";
  let horizonScore = -1;
  let horizonLoaded = false;
  try {
    const pipe = await horizonPipe();
    if (!pipe) throw new Error("分类器没有返回");
    const got: GuardExpect[] = [];
    for (const row of GUARD_HOLDOUT) {
      got.push(await labelWith(pipe, row.text));
    }
    const scored = scoreLabels(got);
    horizonScore = scored.score;
    horizonLoaded = true;
    horizonNote = `${scored.correct}/${scored.total}，误拦 ${scored.falseRejects}`;
  } catch (error) {
    horizonNote = error instanceof Error ? error.message.slice(0, 180) : "加载失败";
  }

  board.push({
    id: HORIZON_ID,
    label: GUARD_LABEL[HORIZON_ID],
    score: horizonScore,
    loaded: horizonLoaded,
    note: horizonNote,
  });

  const previous = current.activeId;
  const promoteHub = horizonLoaded && horizonScore > lexicon.score;
  const activeId = promoteHub ? HORIZON_ID : LEXICON_ID;
  const active = board.find((row) => row.id === activeId) ?? board[0];
  const pin: GuardPin = {
    activeId,
    label: active.label,
    score: active.score,
    rankedAt: new Date().toISOString(),
    board,
  };
  writePin(pin);

  try {
    await discover(prisma);
  } catch {
    // Hub listing is optional. The local holdout still stands.
  }

  const changed = previous !== activeId || !current.rankedAt;
  const announce = changed
    ? `守卫换岗完成。在岗的是${active.label}，留出集 ${active.score}。下载量不晋升。生成式模型不进名单。执行器仍是 15 个。`
    : `守卫复核过了，仍是${active.label}，留出集 ${active.score}。`;

  return { ...pin, skipped: false, announce };
}

export function guardStatus() {
  const pin = readPin();
  if (!pin.rankedAt) return emptyPin();
  return pin;
}
