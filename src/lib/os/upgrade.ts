import { createHash } from "crypto";
import {
  ACTUATOR_LABEL,
  CLOSED_ACTUATORS,
  CRS_LAYERS,
  FORBIDDEN,
  POLICY_LABEL,
  entityStep,
  fitnessOf,
  groupRelative,
  planMtd,
  redDisturb,
  reviewCall,
  reviewPatch,
  shapeFingerprint,
  type ActuatorId,
  type EntityState,
  type PolicyClass,
} from "./constitution";

export { CRS_LAYERS as UPGRADE_LAYERS, planMtd, reviewCall, reviewPatch };

export function attest(killSwitch: boolean) {
  const body = JSON.stringify({
    actuators: CLOSED_ACTUATORS,
    forbidden: FORBIDDEN,
    layers: CRS_LAYERS.map((layer) => layer.id),
    catalogSize: CLOSED_ACTUATORS.length,
    killSwitch,
  });
  return {
    hardware: "none" as const,
    mode: "software-root" as const,
    digest: createHash("sha256").update(body).digest("hex"),
    catalogSize: CLOSED_ACTUATORS.length,
    killSwitch,
  };
}

export function planRepair(summary = "收紧令牌校验，不新增动作") {
  return reviewPatch(summary);
}

const ARENA: EntityState = { hosts: 6, rules: 4, exposures: 3, privileges: 4 };

export function selfPlay(rounds = 3): {
  policy: PolicyClass;
  actuator: ActuatorId;
  fitness: number;
  advantage: number;
} {
  let state = { ...ARENA };
  const rewards: number[] = [];
  const trace: { policy: PolicyClass; actuator: ActuatorId; fitness: number }[] = [];
  for (let i = 0; i < rounds; i += 1) {
    const metrics = redDisturb(state);
    const finger = shapeFingerprint(metrics);
    const actuator = planMtd(finger.policy);
    const review = reviewCall(actuator);
    const chosen = review.allow ? actuator : "approved_segment";
    const physical = chosen === "clamp_setpoint" ? 0.5 : 0;
    const fitness = fitnessOf(4, 0.5, physical);
    rewards.push(fitness);
    trace.push({ policy: finger.policy, actuator: chosen, fitness });
    state = entityStep(state, chosen);
  }
  const advantage = groupRelative(rewards);
  const last = trace[trace.length - 1];
  return {
    policy: last.policy,
    actuator: last.actuator,
    fitness: last.fitness,
    advantage: advantage[advantage.length - 1] ?? 0,
  };
}

export type UpgradeRow = { phase: 1 | 2 | 3; name: string; result: string };

export type UpgradeBoard = {
  headline: string;
  catalogSize: number;
  rows: UpgradeRow[];
};

export function upgradeBoard(killSwitch: boolean): UpgradeBoard {
  const proof = attest(killSwitch);
  const repair = planRepair();
  const round = selfPlay();
  const byId = new Map(CRS_LAYERS.map((layer) => [layer.id, layer]));
  const row = (id: (typeof CRS_LAYERS)[number]["id"], result: string): UpgradeRow => {
    const layer = byId.get(id)!;
    return { phase: layer.phase, name: layer.name, result };
  };
  return {
    headline: `次世代六层已接上。动作仍是 ${proof.catalogSize} 个。信任根是软件证明。`,
    catalogSize: proof.catalogSize,
    rows: [
      row("sentinel", reviewCall("isolate").allow ? "越界即重置" : "未接入"),
      row("enclave", `${proof.digest.slice(0, 12)} · 无硬件包厢`),
      row("repair", repair.accept ? "提案在闸门" : repair.reason),
      row("fingerprint", POLICY_LABEL[round.policy]),
      row("mtd", ACTUATOR_LABEL[round.actuator]),
      row("selfplay", `适应度 ${round.fitness}`),
    ],
  };
}

export function upgradeSpeech(killSwitch: boolean): string {
  const board = upgradeBoard(killSwitch);
  return [board.headline, ...board.rows.map((item) => `${item.phase} ${item.name}  ${item.result}`)].join("\n");
}

const OPPONENT_MOVES: { re: RegExp; policy: PolicyClass; slug: string; seen: string }[] = [
  { re: /范围扩张|越权|新工具|新数据源|新目标/, policy: "scope_creep", slug: "governance-twin", seen: "请求超出已批准的目标" },
  { re: /工具突发|调用突然|工具调用|大量调用/, policy: "tool_burst", slug: "ransom-shell", seen: "短时间内工具调用升高" },
  { re: /节奏|过稳|稳定触达|令牌寿命/, policy: "cadence_regular", slug: "moving-target", seen: "触达节奏过稳" },
  { re: /泄漏|知道姓名|个性化/, policy: "personalized_from_leak", slug: "phish-antibody", seen: "话术带上已知泄漏字段" },
  { re: /重复序列|高度重复/, policy: "repetitive_sequence", slug: "antibody-plane", seen: "动作序列高度重复" },
  { re: /长停顿|隔了很久/, policy: "paused_hands", slug: "passkey-factory", seen: "长停顿后的修正" },
  { re: /委托方|供应商|健康度下降/, policy: "vendor_degraded", slug: "vendor-breaker", seen: "委托方健康度下降" },
  { re: /设定值|温度上|包络外/, policy: "setpoint_drift", slug: "cold-chain", seen: "设定值朝包络外移动" },
  { re: /对方|对手|黑客|出招|对战|防守/, policy: "tool_burst", slug: "ransom-shell", seen: "短时间内工具调用升高" },
];

export function readOpponentMove(text: string): { policy: PolicyClass; slug: string; seen: string } | null {
  const found = OPPONENT_MOVES.find((move) => move.re.test(text));
  return found ? { policy: found.policy, slug: found.slug, seen: found.seen } : null;
}

export function refusesActiveProbe(text: string): boolean {
  return /模糊测试|fuzz|崩溃包|\bpoc\b|\bpov\b|提取崩溃|注入探针|指纹探针|识别底座|识别模型|多跳提权|攻击路径图谱|端口混淆|路由变异|记录攻击工具链|红队找洞/i.test(
    text,
  );
}
