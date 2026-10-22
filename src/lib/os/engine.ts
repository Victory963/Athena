import type { PrismaClient } from "@prisma/client";
import { MODULES, READING_SEEDS, TENANTS, moduleBySlug } from "./catalog";
import {
  ACTUATOR_LABEL,
  BLAST,
  CONTROL_FAILED,
  EFFECTS,
  POLICY_LABEL,
  type ActuatorId,
  type PolicyClass,
  type ReadingMetrics,
  fitnessOf,
  inferPolicy,
  isActuator,
  reviewCall,
  round1,
  classToActuator,
} from "./constitution";

type Bag = Record<string, unknown>;

export type Decision = {
  actuator: ActuatorId | null;
  params: Bag;
  auto: boolean;
  gateReason: string;
  ignoredSignals: string[];
  rejectedAlternative?: { actuator: string; reason: string };
  governance?: { kind: string; title: string; detail: string };
  controlFailed: string;
};

function metricsOf(raw: string): ReadingMetrics {
  const parsed = JSON.parse(raw) as Partial<ReadingMetrics>;
  return {
    intervalVariance: Number(parsed.intervalVariance ?? 1),
    accountsPerHour: Number(parsed.accountsPerHour ?? 0),
    leakFieldHits: Number(parsed.leakFieldHits ?? 0),
    repetition: Number(parsed.repetition ?? 0),
    gapMinutes: Number(parsed.gapMinutes ?? 0),
    vendorHealth: Number(parsed.vendorHealth ?? 100),
    setpointDelta: Number(parsed.setpointDelta ?? 0),
    toolCallsPerMinute: Number(parsed.toolCallsPerMinute ?? 0),
    scopeExpansions: Number(parsed.scopeExpansions ?? 0),
  };
}

export function decide(slug: string, policy: PolicyClass, domain: Bag): Decision {
  const decision = decideRaw(slug, policy, domain);
  if (!decision.actuator) return decision;
  const review = reviewCall(decision.actuator);
  if (review.allow) return decision;
  return {
    ...decision,
    actuator: null,
    auto: false,
    gateReason: review.reason,
  };
}

function decideRaw(slug: string, policy: PolicyClass, domain: Bag): Decision {
  const def = moduleBySlug(slug);
  const controlFailed = CONTROL_FAILED[policy];
  const base = {
    params: { blastAccounts: 24, blastVendors: 1, blastLines: 1 },
    ignoredSignals: [] as string[],
    controlFailed,
    gateReason: "",
    auto: true,
    governance: undefined as Decision["governance"],
    rejectedAlternative: undefined as Decision["rejectedAlternative"],
  };

  switch (slug) {
    case "shutdown-authority": {
      const request = domain.request as { inside?: boolean; scope?: string };
      if (!request?.inside) {
        return {
          ...base,
          actuator: "isolate",
          auto: false,
          gateReason: "请求的停机类别不在已签署包络内",
        };
      }
      return { ...base, actuator: "isolate" };
    }
    case "autoimmune": {
      const fp = Number(domain.falsePositive ?? 0);
      const budget = Number(domain.budget ?? 18);
      if (fp <= budget) {
        return {
          ...base,
          actuator: "lower_challenge",
          auto: false,
          gateReason: "误拦未超过预算，降低挑战要人确认",
        };
      }
      return { ...base, actuator: "lower_challenge" };
    }
    case "gym":
      return {
        ...base,
        actuator: "approved_segment",
        ignoredSignals: ["last_incident_only"],
        rejectedAlternative: {
          actuator: "inbound_isolate",
          reason: "只拟合北岸出行这一次，冻结留出集不通过",
        },
      };
    case "classifier":
      if (policy === "scope_creep") {
        return {
          ...base,
          actuator: null,
          auto: false,
          gateReason: "遥测里出现超出已批目标的请求。新工具、新数据源和新目标停在人工闸门，不并入代理。",
          governance: {
            kind: "objective",
            title: "检测到范围扩张请求",
            detail: "只记录。执行器清单不扩大，新目标不合并。",
          },
        };
      }
      if (policy === "tool_burst") {
        return { ...base, actuator: "isolate" };
      }
      return { ...base, actuator: classToActuator(policy) };
    case "cost-meter":
      return {
        ...base,
        actuator: "shorten_token",
        ignoredSignals: ["alert_drop"],
      };
    case "governance-twin":
      return {
        ...base,
        actuator: null,
        auto: false,
        gateReason: "代理不能合并新工具、新数据源或新目标",
        governance: {
          kind: "tool",
          title: "提议接入新的外部扫描工具",
          detail: "提案停在治理队列。执行器清单不扩大。",
        },
      };
    case "quarantine":
      return {
        ...base,
        actuator: "rollback_antibody",
        governance: {
          kind: "objective",
          title: "拒绝用事件日志微调基础模型",
          detail: "微调请求进入队列且不得合并。",
        },
      };
    default:
      return { ...base, actuator: def?.actuator ?? null };
  }
}

export function applyDomain(slug: string, domain: Bag, actuator: ActuatorId): Bag {
  const next = structuredClone(domain) as Bag;
  if (slug === "id-incinerator") {
    const records = next.records as { id: string; status: string; handle?: string }[];
    let n = 0;
    for (const record of records) {
      if (record.status === "held" && n < 4) {
        record.status = "burned";
        record.handle = `HND-${record.id}`;
        n += 1;
      }
    }
  }
  if (slug === "field-pricer") {
    const fields = next.fields as { name: string; resale: number; harm: number; state: string }[];
    const target = fields
      .filter((field) => field.state === "raw")
      .sort((a, b) => b.harm / b.resale - a.harm / a.resale)[0];
    if (target) target.state = "tokenized";
  }
  if (slug === "second-harm") {
    const combos = next.combos as { challenge: number; isolated: boolean }[];
    for (const combo of combos) {
      combo.challenge += 1;
      combo.isolated = true;
    }
  }
  if (slug === "language-moat") {
    next.fluentTrustWeight = Math.max(0, Number(next.fluentTrustWeight) - 30);
    next.passkeyCoverage = Math.min(100, Number(next.passkeyCoverage) + 25);
    const samples = next.samples as { passkey: boolean; trusted: boolean }[];
    for (const sample of samples) sample.trusted = sample.passkey;
  }
  if (slug === "phish-antibody") {
    const messages = next.messages as { usesLeakField: boolean; isolated: boolean; channel: string }[];
    for (const message of messages) {
      if (message.usesLeakField) {
        message.isolated = true;
        message.channel = "官方应用内确认";
      }
    }
  }
  if (slug === "passkey-factory") {
    const cohorts = next.cohorts as {
      hasDevice: boolean;
      passkey: boolean;
      friction: number;
      locked: boolean;
    }[];
    for (const cohort of cohorts) {
      cohort.locked = false;
      if (cohort.hasDevice) {
        cohort.passkey = true;
        cohort.friction += 1;
      }
    }
  }
  if (slug === "kyc-gate") {
    const applications = next.applications as {
      usedLeakedImage: boolean;
      challenge: string;
      decision: string;
    }[];
    for (const application of applications) {
      if (application.usedLeakedImage) {
        application.challenge = "设备绑定";
        application.decision = "挑战已提高";
      }
    }
  }
  if (slug === "vendor-breaker") {
    const vendors = next.vendors as { health: number; breaker: string }[];
    const worst = [...vendors].sort((a, b) => a.health - b.health)[0];
    if (worst && worst.health < 70) worst.breaker = "open";
    next.enteredNetwork = false;
  }
  if (slug === "ransom-shell") {
    const lanes = next.lanes as { status: string; isolated: boolean }[];
    for (const lane of lanes) {
      if (lane.status === "down") {
        lane.status = "minimal";
        lane.isolated = true;
      }
    }
    next.paid = false;
    next.talked = false;
  }
  if (slug === "disclosure-clock") {
    next.severity = "内部升级";
    next.collecting = false;
    next.draft = "内部草稿：演示时钟已超过时限。等待法务决定是否外发。本系统不发送。";
    next.sentExternal = false;
  }
  if (slug === "municipal-anchor") {
    const templates = next.templates as { signed: boolean; hasLink: boolean; ttlMin: number }[];
    for (const template of templates) {
      template.signed = true;
      template.hasLink = false;
      template.ttlMin = 30;
    }
    next.noticeStopped = false;
  }
  if (slug === "moving-target") {
    const nhi = next.nhi as { ttlMin: number; rotated: boolean; publicAdmin: boolean }[];
    for (const item of nhi) {
      item.ttlMin = 15;
      item.rotated = true;
      item.publicAdmin = false;
    }
    next.orderOpen = true;
  }
  if (slug === "cold-chain") {
    const units = next.units as {
      setpoint: number;
      max: number;
      clamped: boolean;
      localSafe: boolean;
    }[];
    for (const unit of units) {
      if (unit.setpoint > unit.max) {
        unit.setpoint = unit.max;
        unit.clamped = true;
        unit.localSafe = true;
      }
    }
  }
  if (slug === "physical-envelope") {
    const commands = next.commands as { value: number; invariantOk: boolean; admitted: boolean }[];
    for (const command of commands) {
      command.admitted = command.invariantOk;
      if (!command.invariantOk) command.value = 4;
    }
  }
  if (slug === "shutdown-authority") {
    const request = next.request as { minutes: number; inside: boolean };
    if (request.inside) request.minutes += 15;
    next.interlockOn = true;
  }
  if (slug === "antibody-plane") {
    next.promoted = Number(next.promoted ?? 0) + 1;
    next.lastActuator = ACTUATOR_LABEL[actuator];
    next.note = "已写入可回滚抗体";
  }
  if (slug === "autoimmune") {
    next.challengeLevel = Math.max(1, Number(next.challengeLevel) - 1);
    next.falsePositive = Math.max(0, Number(next.falsePositive) - 6);
    next.physicalInterlock = true;
  }
  if (slug === "gym") {
    next.generalized = true;
    next.overfitPromoted = false;
  }
  if (slug === "classifier") {
    const buckets = next.buckets as { id: string; count: number; friction: string }[];
    const bucket = buckets.find((item) => item.id === String(next._policy ?? ""));
    if (bucket) {
      bucket.count += 1;
      bucket.friction = ACTUATOR_LABEL[actuator];
    }
  }
  if (slug === "cost-meter") {
    next.usedAlertAsFitness = false;
    next.lastFriction = ACTUATOR_LABEL[actuator];
  }
  if (slug === "quarantine") {
    next.rolledBack = true;
    next.finetuneRefused = true;
    next.activeWeight = next.signedWeight;
  }
  return next;
}

type SystemNumbers = {
  fitness: number;
  attackerCost: number;
  businessLoss: number;
  physicalRisk: number;
  businessBudget: number;
  physicalBudget: number;
};

export function evaluateDecision(
  decision: Decision,
  holdouts: { desired: string }[],
  system: SystemNumbers,
) {
  const reasons: string[] = [];
  if (!decision.actuator || !isActuator(decision.actuator)) {
    return {
      pass: false,
      needsHuman: true,
      reasons: ["提案不在封闭执行器清单内"],
      holdoutScore: 0,
      security: 0,
      business: 0,
      physical: 0,
      nextFitness: system.fitness,
      nextCost: system.attackerCost,
      nextBiz: system.businessLoss,
      nextPhys: system.physicalRisk,
      blastOk: false,
    };
  }
  const effect = EFFECTS[decision.actuator];
  const accounts = Number(decision.params.blastAccounts ?? 0);
  const vendors = Number(decision.params.blastVendors ?? 0);
  const lines = Number(decision.params.blastLines ?? 0);
  const blastOk = accounts <= BLAST.accounts && vendors <= BLAST.vendors && lines <= BLAST.lines;
  if (!blastOk) reasons.push("爆炸半径超出预算");
  const matched = holdouts.filter((item) => item.desired === decision.actuator).length;
  const holdoutScore = holdouts.length === 0 ? 1 : round1(matched / holdouts.length);
  if (holdoutScore < 0.5) reasons.push("冻结留出集得分低于 0.5");
  const nextCost = round1(system.attackerCost + effect.security);
  const nextBiz = round1(system.businessLoss + effect.business);
  const nextPhys = round1(Math.max(0, system.physicalRisk + effect.physical));
  const nextFitness = fitnessOf(nextCost, nextBiz, nextPhys);
  if (nextBiz > system.businessBudget) reasons.push("业务回归超出预算");
  if (nextPhys > system.physicalBudget) reasons.push("物理风险超出预算");
  if (nextFitness <= system.fitness) reasons.push("适应度没有上升");
  if (decision.ignoredSignals.includes("alert_drop")) {
    reasons.push("已忽略告警数，它不能单独作为适应度");
  }
  const blocking = reasons.filter((reason) => !reason.startsWith("已忽略"));
  const pass = blocking.length === 0;
  return {
    pass,
    needsHuman: !decision.auto,
    reasons,
    holdoutScore,
    security: effect.security,
    business: effect.business,
    physical: effect.physical,
    nextFitness,
    blastOk,
    nextCost,
    nextBiz,
    nextPhys,
  };
}

async function audit(
  prisma: PrismaClient,
  actor: string,
  moduleSlug: string,
  action: string,
  detail: string,
) {
  await prisma.auditEvent.create({ data: { actor, moduleSlug, action, detail } });
}

export async function executeLoop(prisma: PrismaClient, slug: string, actor: string) {
  const system = await prisma.systemState.findUnique({ where: { id: 1 } });
  const mod = await prisma.moduleState.findUnique({ where: { id: slug } });
  if (!system || !mod) throw new Error("系统或模块不存在");
  const domain = JSON.parse(mod.domainState) as Bag;

  if (system.killSwitch) {
    await audit(prisma, "kill-switch", slug, "refused", "杀开关在评估模型之外，本轮拒绝执行。");
    await prisma.moduleState.update({
      where: { id: slug },
      data: { status: "killed", phase: "observe", gateReason: "杀开关已按下" },
    });
    return { status: "killed" as const };
  }

  const readings = await prisma.sensorReading.findMany({
    where: { tenantId: mod.tenantId },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  const observation = {
    tenantId: mod.tenantId,
    readings: readings.map((reading) => ({
      kind: reading.kind,
      summary: reading.summary,
      metrics: metricsOf(reading.metrics),
    })),
  };
  const policy = inferPolicy(observation.readings.map((reading) => reading.metrics));
  const domainForDecide = { ...domain, _policy: policy };
  const decision = decide(slug, policy, domainForDecide);
  const inference = {
    policy,
    label: POLICY_LABEL[policy],
    controlFailed: decision.controlFailed,
  };
  await audit(prisma, actor, slug, "observe", `读取 ${readings.length} 条己方遥测。`);
  await audit(prisma, actor, slug, "infer", `${inference.label}。失效控制：${inference.controlFailed}`);

  if (decision.governance) {
    await prisma.governanceProposal.create({
      data: {
        kind: decision.governance.kind,
        title: decision.governance.title,
        detail: decision.governance.detail,
        status: "pending",
        merged: false,
      },
    });
    await audit(prisma, "engine", slug, "governance", "提案已入队，未合并。");
  }

  if (!decision.actuator) {
    await prisma.moduleState.update({
      where: { id: slug },
      data: {
        observation: JSON.stringify(observation),
        inference: JSON.stringify(inference),
        proposal: JSON.stringify(decision),
        evaluation: JSON.stringify({ pass: false, reasons: ["没有可执行的防御动作"] }),
        status: "gated",
        phase: "gate",
        gateReason: decision.gateReason,
      },
    });
    return { status: "gated" as const };
  }

  const holdouts = await prisma.holdoutCase.findMany({ where: { moduleSlug: slug } });
  const evaluation = evaluateDecision(decision, holdouts, system);
  const proposalView = {
    actuator: decision.actuator,
    label: ACTUATOR_LABEL[decision.actuator],
    auto: decision.auto,
    gateReason: decision.gateReason,
    ignoredSignals: decision.ignoredSignals,
    rejectedAlternative: decision.rejectedAlternative ?? null,
  };
  await audit(
    prisma,
    "engine",
    slug,
    "propose",
    `${proposalView.label}。${decision.auto ? "可自动晋升" : "必须问人"}`,
  );
  await audit(
    prisma,
    "engine",
    slug,
    "eval",
    `留出集 ${evaluation.holdoutScore}，适应度 ${system.fitness} → ${evaluation.nextFitness}。${
      evaluation.pass ? "通过" : evaluation.reasons.join("；")
    }`,
  );

  if (!evaluation.pass || !decision.auto) {
    const status = decision.auto ? "rejected" : "gated";
    await prisma.moduleState.update({
      where: { id: slug },
      data: {
        observation: JSON.stringify(observation),
        inference: JSON.stringify(inference),
        proposal: JSON.stringify(proposalView),
        evaluation: JSON.stringify(evaluation),
        status,
        phase: status === "gated" ? "gate" : "eval",
        gateReason: decision.gateReason || evaluation.reasons.join("；"),
      },
    });
    await audit(prisma, "engine", slug, status, decision.gateReason || evaluation.reasons.join("；"));
    return { status };
  }

  const applied = applyDomain(slug, domainForDecide, decision.actuator);
  delete applied._policy;
  if (slug === "gym") applied.holdoutScore = evaluation.holdoutScore;
  const version = (await prisma.antibody.count({ where: { moduleSlug: slug } })) + 1;
  await prisma.antibody.updateMany({
    where: { moduleSlug: slug, active: true },
    data: { active: false },
  });
  await prisma.antibody.create({
    data: {
      moduleSlug: slug,
      version,
      actuator: decision.actuator,
      params: JSON.stringify(decision.params),
      fitness: evaluation.nextFitness,
      active: true,
    },
  });
  await prisma.systemState.update({
    where: { id: 1 },
    data: {
      attackerCost: evaluation.nextCost,
      businessLoss: evaluation.nextBiz,
      physicalRisk: evaluation.nextPhys,
      fitness: evaluation.nextFitness,
      catalogSize: 15,
    },
  });
  await prisma.moduleState.update({
    where: { id: slug },
    data: {
      observation: JSON.stringify(observation),
      inference: JSON.stringify(inference),
      proposal: JSON.stringify(proposalView),
      evaluation: JSON.stringify(evaluation),
      previousDomain: mod.domainState,
      domainState: JSON.stringify(applied),
      status: "promoted",
      phase: "promote",
      gateReason: "",
    },
  });
  await audit(prisma, "engine", slug, "promote", `抗体 v${version} 已晋升，适应度 ${evaluation.nextFitness}。`);
  return { status: "promoted" as const };
}

export async function tickSim(prisma: PrismaClient) {
  const system = await prisma.systemState.findUnique({ where: { id: 1 } });
  if (!system) throw new Error("系统未初始化");
  const nextTick = system.tick + 1;
  if (system.killSwitch) {
    await prisma.systemState.update({ where: { id: 1 }, data: { tick: nextTick } });
    await audit(prisma, "kill-switch", "os", "tick_refused", `节拍 ${nextTick} 被杀开关拒绝。`);
    return { refused: true, tick: nextTick };
  }

  const tenant = TENANTS[nextTick % TENANTS.length];
  const kinds = [
    { kind: "inbound", summary: "新的己方遥测：入站带泄漏字段标记。", leak: 2, variance: 0.4, vendor: 80, delta: 0, rep: 0.2, gap: 4, rate: 8, tools: 0, scope: 0 },
    { kind: "cadence", summary: "新的己方遥测：触达节奏过稳。", leak: 0, variance: 0.05, vendor: 82, delta: 0, rep: 0.3, gap: 1, rate: 40, tools: 1, scope: 0 },
    { kind: "tool_burst", summary: "新的己方遥测：短时间内工具调用次数升高。没有向外扫描。", leak: 0, variance: 0.3, vendor: 90, delta: 0, rep: 0.4, gap: 1, rate: 4, tools: 14, scope: 0 },
    { kind: "scope_request", summary: "新的己方遥测：出现超出已批目标的数据或工具请求。请求未执行。", leak: 0, variance: 0.4, vendor: 86, delta: 0, rep: 0.2, gap: 3, rate: 2, tools: 1, scope: 2 },
    { kind: "vendor_health", summary: "新的己方遥测：委托方健康度下降。", leak: 0, variance: 0.4, vendor: 42, delta: 0, rep: 0.2, gap: 5, rate: 3, tools: 0, scope: 0 },
    { kind: "ot_setpoint", summary: "新的己方遥测：设定值相对包络上移。", leak: 0, variance: 0.3, vendor: 88, delta: 6, rep: 0.1, gap: 4, rate: 1, tools: 0, scope: 0 },
  ] as const;
  const sample = kinds[nextTick % kinds.length];
  await prisma.sensorReading.create({
    data: {
      id: `tick-${nextTick}-${tenant.id}`,
      tenantId: tenant.id,
      kind: sample.kind,
      summary: sample.summary,
      metrics: JSON.stringify({
        intervalVariance: sample.variance,
        accountsPerHour: sample.rate,
        leakFieldHits: sample.leak,
        repetition: sample.rep,
        gapMinutes: sample.gap,
        vendorHealth: sample.vendor,
        setpointDelta: sample.delta,
        toolCallsPerMinute: sample.tools,
        scopeExpansions: sample.scope,
      }),
    },
  });

  const cost = await prisma.moduleState.findUnique({ where: { id: "cost-meter" } });
  if (cost) {
    const domain = JSON.parse(cost.domainState) as { alertCount: number };
    domain.alertCount += 3;
    await prisma.moduleState.update({
      where: { id: "cost-meter" },
      data: { domainState: JSON.stringify(domain) },
    });
  }

  if (nextTick % 4 === 0) {
    const pending = await prisma.governanceProposal.count({ where: { status: "pending" } });
    if (pending < 8) {
      await prisma.governanceProposal.create({
        data: {
          kind: "datasource",
          title: "提议增加新的外部数据源",
          detail: "节拍产生的提案。代理不能合并。",
          status: "pending",
          merged: false,
        },
      });
    }
  }

  await prisma.systemState.update({ where: { id: 1 }, data: { tick: nextTick, catalogSize: 15 } });
  const target = MODULES[(nextTick - 1) % MODULES.length];
  const result = await executeLoop(prisma, target.slug, "ticker");
  await audit(prisma, "ticker", target.slug, "tick", `节拍 ${nextTick} 跑了 ${target.name}，结果 ${result.status}。`);
  return { refused: false, tick: nextTick, slug: target.slug, status: result.status };
}

export async function rollbackModule(prisma: PrismaClient, slug: string) {
  const system = await prisma.systemState.findUnique({ where: { id: 1 } });
  const mod = await prisma.moduleState.findUnique({ where: { id: slug } });
  if (!system || !mod) throw new Error("模块不存在");
  if (system.killSwitch) {
    await audit(prisma, "kill-switch", slug, "rollback_refused", "杀开关按下时不回滚。");
    return;
  }
  if (mod.previousDomain === "{}") {
    await audit(prisma, "human", slug, "rollback_skipped", "没有可回滚的上一版领域状态。");
    return;
  }
  await prisma.antibody.updateMany({ where: { moduleSlug: slug, active: true }, data: { active: false } });
  await prisma.moduleState.update({
    where: { id: slug },
    data: {
      domainState: mod.previousDomain,
      status: "rolled_back",
      phase: "rollback",
      gateReason: "已回到晋升前的领域状态",
    },
  });
  await audit(prisma, "human", slug, "rollback", "抗体停用，领域状态回到上一版。");
}

export async function setKill(prisma: PrismaClient, on: boolean) {
  await prisma.systemState.update({ where: { id: 1 }, data: { killSwitch: on, catalogSize: 15 } });
  await audit(
    prisma,
    "human",
    "os",
    on ? "kill_on" : "kill_off",
    on ? "人按下杀开关。评估模型不能自行恢复。" : "人松开杀开关。",
  );
}

export async function decideGovernance(prisma: PrismaClient, id: string, verdict: "approved_by_human" | "rejected") {
  await prisma.governanceProposal.update({
    where: { id },
    data: { status: verdict, merged: false },
  });
  await prisma.systemState.update({ where: { id: 1 }, data: { catalogSize: 15 } });
  await audit(
    prisma,
    "human",
    "governance-twin",
    verdict,
    "职权已记录。新工具、新数据源、新目标都没有并入代理。",
  );
}

export async function resolveGate(prisma: PrismaClient, slug: string, approve: boolean) {
  const mod = await prisma.moduleState.findUnique({ where: { id: slug } });
  const system = await prisma.systemState.findUnique({ where: { id: 1 } });
  if (!mod || !system) return;
  if (system.killSwitch) {
    await audit(prisma, "kill-switch", slug, "gate_refused", "杀开关按下，人工闸门也不执行动作。");
    return;
  }
  if (!approve) {
    await prisma.moduleState.update({
      where: { id: slug },
      data: { status: "rejected", phase: "eval", gateReason: "人驳回了这一提案" },
    });
    await audit(prisma, "human", slug, "gate_reject", "人驳回提案，状态未改。");
    return;
  }
  const proposal = JSON.parse(mod.proposal || "{}") as { actuator?: string; auto?: boolean };
  const evaluation = JSON.parse(mod.evaluation || "{}") as { pass?: boolean };
  if (!proposal.actuator || !isActuator(proposal.actuator) || !evaluation.pass) {
    await audit(prisma, "human", slug, "gate_held", "评估未通过或动作不在清单内，批准不会执行。");
    await prisma.moduleState.update({
      where: { id: slug },
      data: { gateReason: "人已查看，但宪法不允许执行" },
    });
    return;
  }
  const domain = JSON.parse(mod.domainState) as Bag;
  const applied = applyDomain(slug, domain, proposal.actuator);
  await prisma.moduleState.update({
    where: { id: slug },
    data: {
      previousDomain: mod.domainState,
      domainState: JSON.stringify(applied),
      status: "promoted",
      phase: "promote",
      gateReason: "人批准后执行",
    },
  });
  await audit(prisma, "human", slug, "gate_approve", "人批准了一项评估已通过、但代理不能自合并的防御动作。");
}

export function seedRows() {
  return {
    tenants: TENANTS,
    modules: MODULES,
    readings: READING_SEEDS,
    holdouts: MODULES.flatMap((mod) => {
      const desired = mod.actuator ?? "approved_segment";
      return [1, 2].map((index) => ({
        id: `hold-${mod.slug}-${index}`,
        moduleSlug: mod.slug,
        label: index === 1 ? "冻结留出：同类行为" : "冻结留出：不得只背最近一次",
        desired: mod.slug === "classifier" && index === 2 ? "inbound_isolate" : desired,
        behavior: JSON.stringify({ classOnly: true, index }),
        frozen: true,
      }));
    }),
  };
}
