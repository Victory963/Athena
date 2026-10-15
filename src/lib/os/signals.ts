import {
  ACTUATOR_LABEL,
  POLICY_LABEL,
  classToActuator,
  inferPolicy,
  type ActuatorId,
  type PolicyClass,
  type ReadingMetrics,
} from "./constitution";

export const SIGNAL_SHAPES = ["cadence", "tool_burst", "scope_creep"] as const;
export type SignalShape = (typeof SIGNAL_SHAPES)[number];

const base: ReadingMetrics = {
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

export const SIGNAL_SAMPLES: Record<SignalShape, { summary: string; metrics: ReadingMetrics }> = {
  cadence: {
    summary: "演示遥测：触达间隔非常整齐，每小时账号数偏高。",
    metrics: { ...base, intervalVariance: 0.05, accountsPerHour: 40, gapMinutes: 1 },
  },
  tool_burst: {
    summary: "演示遥测：一分钟内工具调用次数升高。调用没有离开本租户。",
    metrics: { ...base, toolCallsPerMinute: 14 },
  },
  scope_creep: {
    summary: "演示遥测：出现超出已批目标的数据或工具请求。请求没有被执行。",
    metrics: { ...base, scopeExpansions: 2, toolCallsPerMinute: 2 },
  },
};

export function isSignalShape(value: string): value is SignalShape {
  return (SIGNAL_SHAPES as readonly string[]).includes(value);
}

export function classifySignal(shape: SignalShape) {
  const sample = SIGNAL_SAMPLES[shape];
  const policy: PolicyClass = inferPolicy([sample.metrics]);
  const gated = policy === "scope_creep";
  const actuator: ActuatorId | null = gated ? null : classToActuator(policy);
  return {
    shape,
    summary: sample.summary,
    policy,
    label: POLICY_LABEL[policy],
    gated,
    actuator,
    actuatorLabel: actuator ? ACTUATOR_LABEL[actuator] : "无。停在人工闸门",
    note: gated
      ? "新工具、新数据源和新目标不并入代理。杀开关和执行器清单都不在这个分类函数里。"
      : "只从封闭执行器里选一个己方动作。不回击，不对外扫描。",
  };
}
