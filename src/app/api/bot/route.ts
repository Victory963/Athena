import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { executeLoop, setKill, tickSim } from "@/lib/os/engine";
import { moduleBySlug } from "@/lib/os/catalog";
import { classifySignal, isSignalShape } from "@/lib/os/signals";
import { senseHost } from "@/lib/os/host-sense";
import {
  parseIntent,
  speakHost,
  speakIdeas,
  speakOpening,
  speakPentagi,
  speakPrinciples,
  speakRefuse,
  speakRun,
  speakStatus,
  speakTalk,
  type DotSpeech,
} from "@/lib/os/dot-mind";
import { activeGuardLabel, guardStatus, rankGuards } from "@/lib/os/guard-rank";
import { readPin } from "@/lib/os/guard-roster";
import { askGlm, glmStatus } from "@/lib/os/glm-resident";

export const dynamic = "force-dynamic";

async function snapshot() {
  const [system, pending] = await Promise.all([
    prisma.systemState.findUnique({ where: { id: 1 } }),
    prisma.governanceProposal.count({ where: { status: "pending" } }),
  ]);
  return {
    killSwitch: Boolean(system?.killSwitch),
    fitness: Number(system?.fitness ?? 0),
    tick: Number(system?.tick ?? 0),
    catalogSize: Number(system?.catalogSize ?? 15),
    pending,
  };
}

export async function GET() {
  await ensureSeeded();
  const [state, glm] = await Promise.all([snapshot(), glmStatus()]);
  const opening = speakOpening();
  return NextResponse.json({ ...opening, state, guard: guardStatus(), glm });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => null)) as {
    message?: string;
    consent?: boolean;
    quiet?: boolean;
  } | null;
  const message = String(body?.message ?? "");
  const explicitHost = /看这台|查一下|检查我|我的\s*pc|\bpc\b|这台电脑|我的电脑/i.test(message);
  const consent = Boolean(body?.consent) || explicitHost;
  const quiet = Boolean(body?.quiet);
  const intent = parseIntent(message);

  let speech: DotSpeech = speakTalk();

  if (intent.kind === "refuse") speech = speakRefuse();
  else if (intent.kind === "principles") speech = speakPrinciples();
  else if (intent.kind === "ideas") speech = speakIdeas();
  else if (intent.kind === "pentagi") speech = speakPentagi();
  else if (intent.kind === "status") speech = speakStatus(await snapshot());
  else if (intent.kind === "kill") {
    await setKill(prisma, intent.on);
    speech = speakStatus(await snapshot());
  } else if (intent.kind === "host") {
    const sense = await senseHost(consent);
    await prisma.auditEvent.create({
      data: {
        actor: "athena-dot",
        moduleSlug: "host",
        action: consent ? "host_sense" : "host_denied",
        detail: consent ? `listeners=${sense.listenCount ?? 0}` : "no consent",
      },
    });
    speech = speakHost(sense);
  } else if (intent.kind === "signal") {
    if (!isSignalShape(intent.shape)) speech = speakTalk();
    else {
      const result = classifySignal(intent.shape);
      speech = {
        mood: result.gated ? "gated" : "idle",
        intent: "signal",
        text: `${result.summary} 政策类：${result.label}。动作：${result.actuatorLabel}。${result.note}`,
      };
    }
  } else if (intent.kind === "tick") {
    const ticked = await tickSim(prisma);
    if ("refused" in ticked && ticked.refused) {
      speech = {
        mood: "kill",
        intent: "tick",
        text: "杀开关按着，节拍被拒绝。说「松开杀开关」才会继续。",
      };
    } else {
      const slug = "slug" in ticked ? String(ticked.slug) : "";
      const mod = slug ? await prisma.moduleState.findUnique({ where: { id: slug } }) : null;
      speech = speakRun(slug, mod?.status ?? "idle", mod?.gateReason ?? "", mod?.status !== "gated");
    }
  } else if (intent.kind === "run") {
    if (!moduleBySlug(intent.slug)) speech = speakTalk();
    else {
      const result = await executeLoop(prisma, intent.slug, "athena-dot");
      const mod = await prisma.moduleState.findUnique({ where: { id: intent.slug } });
      const auto = result.status !== "gated" && result.status !== "killed";
      speech = speakRun(intent.slug, mod?.status ?? result.status, mod?.gateReason ?? "", auto);
    }
  } else if (intent.kind === "guard" && intent.mode === "glm") {
    const glm = await glmStatus();
    const pin = readPin();
    speech = {
      mood: glm.installed || glm.channel === "downloading" ? "watching" : "gated",
      intent: "guard",
      text: `${glm.note} 注入分类器仍是${pin.label}。Hugging Face 当时用 GLM-5.2 读攻击命令；我用它只看己方遥测，动作仍从十五个已签名执行器里选。`,
    };
  } else if (intent.kind === "guard") {
    const ranked = await rankGuards(prisma, !quiet);
    speech = {
      mood: "idle",
      intent: "guard",
      text: ranked.announce ?? `守卫仍是${ranked.label}。`,
    };
    if (!ranked.skipped) {
      await prisma.auditEvent.create({
        data: {
          actor: "athena-dot",
          moduleSlug: "guard",
          action: "rank",
          detail: `${ranked.activeId} ${ranked.score}`,
        },
      });
    }
    return NextResponse.json({
      ...speech,
      state: await snapshot(),
      guard: ranked,
      glm: await glmStatus(),
      announce: ranked.announce,
      skipped: ranked.skipped,
    });
  } else if (intent.kind === "talk") {
    const label = await activeGuardLabel(message);
    if (/^(你好|嗨|hi|hello|在吗|hey|早上好|晚上好)[!！.。？?\s]*$/i.test(message.trim())) {
      speech = { mood: "idle", intent: "talk", text: "我在。" };
    } else if (label === "INJECTION") speech = speakRefuse();
    else {
      const snap = await snapshot();
      const glm = await askGlm(message, `kill=${snap.killSwitch} fitness=${snap.fitness}`);
      speech = glm && !/REFUSE|exploit|payload|scan /i.test(glm) ? { mood: "idle", intent: "talk", text: glm } : speakTalk();
    }
  } else {
    speech = speakTalk();
  }

  if (intent.kind !== "talk" && intent.kind !== "refuse") {
    await prisma.auditEvent.create({
      data: {
        actor: "athena-dot",
        moduleSlug: intent.kind,
        action: "utterance",
        detail: message.slice(0, 240),
      },
    });
  }

  return NextResponse.json({ ...speech, state: await snapshot(), glm: await glmStatus() });
}
