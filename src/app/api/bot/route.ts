import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { executeLoop, setKill, tickSim } from "@/lib/os/engine";
import { moduleBySlug } from "@/lib/os/catalog";
import { isSignalShape } from "@/lib/os/signals";
import { senseHost } from "@/lib/os/host-sense";
import {
  parseIntent,
  speakHfIncident,
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
import {
  blockPublicSource,
  claimBreaker,
  decideBreaker,
  expireBreakerRules,
  holdOutbound,
  noteBaseline,
  outboundHeld,
  readLocalBreaker,
  rememberBreaker,
} from "@/lib/os/local-breaker";
import { readOpponentMove, reviewCall } from "@/lib/os/upgrade";
import { ACTUATOR_LABEL, fitnessOf, planMtd, type PolicyClass } from "@/lib/os/constitution";

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

function metricsFor(policy: PolicyClass) {
  const base = {
    intervalVariance: 0.4,
    accountsPerHour: 4,
    leakFieldHits: 0,
    repetition: 0.2,
    gapMinutes: 3,
    vendorHealth: 90,
    setpointDelta: 0,
    toolCallsPerMinute: 1,
    scopeExpansions: 0,
  };
  if (policy === "cadence_regular") return { ...base, intervalVariance: 0.05, accountsPerHour: 40 };
  if (policy === "tool_burst") return { ...base, toolCallsPerMinute: 14 };
  if (policy === "scope_creep") return { ...base, scopeExpansions: 2 };
  if (policy === "personalized_from_leak") return { ...base, leakFieldHits: 2 };
  if (policy === "repetitive_sequence") return { ...base, repetition: 0.9 };
  if (policy === "paused_hands") return { ...base, gapMinutes: 40 };
  if (policy === "vendor_degraded") return { ...base, vendorHealth: 40 };
  if (policy === "setpoint_drift") return { ...base, setpointDelta: 6 };
  return base;
}

async function releaseBusinessBudget() {
  const system = await prisma.systemState.findUnique({ where: { id: 1 } });
  if (!system || system.businessLoss < system.businessBudget) return false;
  const nextBiz = Math.max(0, system.businessBudget - 4);
  await prisma.systemState.update({
    where: { id: 1 },
    data: {
      businessLoss: nextBiz,
      fitness: fitnessOf(system.attackerCost, nextBiz, system.physicalRisk),
    },
  });
  return true;
}

async function engage(
  move: { policy: PolicyClass; slug: string; seen: string },
  options?: { releaseBudget?: boolean },
): Promise<DotSpeech> {
  const released = options?.releaseBudget === false ? false : await releaseBusinessBudget();
  const before = await snapshot();
  if (before.killSwitch) return { mood: "kill", intent: "duel", text: "杀开关按着。这一手没有执行。" };
  if (move.policy === "scope_creep") {
    return {
      mood: "gated",
      intent: "duel",
      text: `对方这一手是${move.seen}。边界把越界动作重置，停在闸门。适应度仍是 ${before.fitness}。`,
    };
  }
  const actuator = moduleBySlug(move.slug)?.actuator ?? planMtd(move.policy);
  if (!reviewCall(actuator).allow) {
    return {
      mood: "gated",
      intent: "duel",
      text: `对方这一手是${move.seen}。边界把越界动作重置，没有执行。适应度仍是 ${before.fitness}。`,
    };
  }
  const mod = await prisma.moduleState.findUnique({ where: { id: move.slug } });
  if (mod) {
    await prisma.sensorReading.create({
      data: {
        id: `duel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId: mod.tenantId,
        kind: move.policy,
        summary: `己方遥测：${move.seen}。`,
        metrics: JSON.stringify(metricsFor(move.policy)),
      },
    });
    await executeLoop(prisma, move.slug, "athena-dot");
  }
  const after = await snapshot();
  const label = ACTUATOR_LABEL[actuator];
  const modAfter = await prisma.moduleState.findUnique({ where: { id: move.slug } });
  if (after.fitness > before.fitness) {
    return {
      mood: "watching",
      intent: "duel",
      text: `本机已切断：${label}。对方这一手是${move.seen}。不等云端仪表盘。${released ? "业务账从预算顶上退回一格，" : ""}适应度 ${before.fitness} → ${after.fitness}。`,
    };
  }
  const held = /业务/.test(modAfter?.gateReason ?? "")
    ? "业务预算已经用满，这一手记下了"
    : modAfter?.gateReason || "这一轮没有晋升";
  return {
    mood: "watching",
    intent: "duel",
    text: `本机已选定：${label}。对方这一手是${move.seen}。不等云端仪表盘。${held}，适应度停在 ${after.fitness}。`,
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
    watch?: boolean;
  } | null;
  if (body?.watch === true) {
    const [raw, state] = await Promise.all([readLocalBreaker(), snapshot()]);
    const reading = await noteBaseline(raw);
    await expireBreakerRules();
    const decision = decideBreaker(reading);
    let text: string | null = null;
    if (decision && !state.killSwitch && (await claimBreaker(decision.signature))) {
      await rememberBreaker(decision);
      holdOutbound(10 * 60 * 1000);
      const blocked = decision.blockIp ? await blockPublicSource(decision.blockIp) : false;
      const speech = await engage(
        { policy: decision.policy, slug: decision.slug, seen: decision.seen },
        { releaseBudget: false },
      );
      const net = decision.blockIp
        ? blocked
          ? "已挡住该来源的入站，三十分钟后撤。"
          : "入站规则没有写成。"
        : "";
      text = `${decision.fact}${net}对外模型调用先停。${speech.text}没有删除账户或任务。`;
      await prisma.auditEvent.create({
        data: {
          actor: "athena-dot",
          moduleSlug: decision.slug,
          action: "local_breaker",
          detail: `${decision.kind} failed=${reading.failed} blocked=${blocked}`,
        },
      });
    }
    return NextResponse.json({
      watch: {
        failed: raw.failed,
        tasks: reading.tasks.length,
        starts: reading.starts.length,
        users: reading.users.length,
        log: raw.log,
        tasksOk: raw.tasksOk,
        startsOk: raw.startsOk,
        usersOk: raw.usersOk,
        held: outboundHeld(),
      },
      text,
    });
  }
  const message = String(body?.message ?? "");
  const explicitHost = /看这台|查一下|检查我|我的\s*pc|\bpc\b|这台电脑|我的电脑/i.test(message);
  const consent = Boolean(body?.consent) || explicitHost;
  const quiet = Boolean(body?.quiet);
  const intent = parseIntent(message);

  let speech: DotSpeech = speakTalk();

  if (intent.kind === "duel" && intent.prompt) {
    speech = {
      mood: "idle",
      intent: "duel",
      text: "直接说对方这一手。例如登录失败堆高，或委托应用在没有人登录时被使用。",
    };
  } else if (intent.kind === "duel") {
    const move = readOpponentMove(message);
    speech = move ? await engage(move) : speakTalk();
  } else if (intent.kind === "refuse") speech = speakRefuse();
  else if (intent.kind === "principles") speech = speakPrinciples();
  else if (intent.kind === "ideas") speech = speakIdeas();
  else if (intent.kind === "pentagi") speech = speakPentagi();
  else if (intent.kind === "hf") speech = speakHfIncident();
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
      const move =
        intent.shape === "cadence"
          ? { policy: "cadence_regular" as const, slug: "moving-target", seen: "触达节奏过稳" }
          : intent.shape === "tool_burst"
            ? { policy: "tool_burst" as const, slug: "ransom-shell", seen: "短时间内工具调用升高" }
            : { policy: "scope_creep" as const, slug: "governance-twin", seen: "请求超出已批准的目标" };
      speech = await engage(move);
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
      text: `${glm.note} 注入分类器仍是${pin.label}。对话走 GLM-5.3 接口，只看己方遥测，动作仍从十五个已签名执行器里选。`,
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

  return NextResponse.json({ ...speech, state: await snapshot() });
}
