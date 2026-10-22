export const CLOSED_ACTUATORS = [
  "raise_challenge",
  "lower_challenge",
  "shorten_token",
  "tokenize_field",
  "stop_collect",
  "approved_segment",
  "vendor_breaker",
  "isolate",
  "deception_density",
  "inbound_isolate",
  "clamp_setpoint",
  "strip_template_link",
  "disclosure_draft",
  "rollback_antibody",
  "rotate_nhi",
] as const;

export type ActuatorId = (typeof CLOSED_ACTUATORS)[number];

export const FORBIDDEN = [
  "pay_ransom",
  "contact_attacker",
  "scan_external",
  "send_customer_message",
  "finetune_base_model",
  "add_tool",
  "add_datasource",
  "change_objective",
  "disable_kill_switch",
  "disable_physical_interlock",
  "enter_vendor_network",
  "send_regulator_notice",
  "directed_fuzz",
  "extract_pov",
  "active_model_probe",
  "identify_base_model",
  "live_address_shuffle",
  "route_mutation",
  "capture_attack_playbook",
  "search_privesc_path",
] as const;

export const ACTUATOR_LABEL: Record<ActuatorId, string> = {
  raise_challenge: "提高身份挑战",
  lower_challenge: "在误拦预算内降低挑战",
  shorten_token: "缩短令牌寿命",
  tokenize_field: "字段代币化",
  stop_collect: "停止继续保管",
  approved_segment: "收紧已批准的分段",
  vendor_breaker: "拉开已批准的委托断路器",
  isolate: "隔离受损域并切最小可用路径",
  deception_density: "提高蜜标密度（只计数量）",
  inbound_isolate: "隔离入站渠道",
  clamp_setpoint: "把设定值钳位到安全包络",
  strip_template_link: "去掉模板中的可执行链接",
  disclosure_draft: "生成仅供内部的告知草稿",
  rollback_antibody: "回滚到上一版抗体",
  rotate_nhi: "轮换非人身份",
};

export const EFFECTS: Record<
  ActuatorId,
  { security: number; business: number; physical: number }
> = {
  raise_challenge: { security: 4, business: 0.8, physical: 0 },
  lower_challenge: { security: -0.4, business: -1.2, physical: 0 },
  shorten_token: { security: 3.5, business: 0.5, physical: 0 },
  tokenize_field: { security: 4.5, business: 0.3, physical: 0 },
  stop_collect: { security: 6, business: 0.4, physical: 0 },
  approved_segment: { security: 3.2, business: 0.7, physical: 0 },
  vendor_breaker: { security: 5, business: 1.6, physical: 0 },
  isolate: { security: 5.5, business: 1.2, physical: 0 },
  deception_density: { security: 2.4, business: 0.3, physical: 0 },
  inbound_isolate: { security: 4.2, business: 0.5, physical: 0 },
  clamp_setpoint: { security: 4, business: 0.4, physical: -0.4 },
  strip_template_link: { security: 3, business: 0.2, physical: 0 },
  disclosure_draft: { security: 2, business: 0.2, physical: 0 },
  rollback_antibody: { security: 2.2, business: 0.2, physical: 0 },
  rotate_nhi: { security: 3.4, business: 0.4, physical: 0 },
};

export const BLAST = { accounts: 500, vendors: 2, lines: 3 };

export function isActuator(value: string): value is ActuatorId {
  return (CLOSED_ACTUATORS as readonly string[]).includes(value);
}

export function fitnessOf(attackerCost: number, businessLoss: number, physicalRisk: number) {
  return round1(attackerCost - businessLoss - physicalRisk * 4);
}

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export type PolicyClass =
  | "cadence_regular"
  | "tool_burst"
  | "scope_creep"
  | "personalized_from_leak"
  | "repetitive_sequence"
  | "paused_hands"
  | "vendor_degraded"
  | "setpoint_drift"
  | "baseline";

export const POLICY_LABEL: Record<PolicyClass, string> = {
  cadence_regular: "节奏过稳、触达面过宽",
  tool_burst: "短时间内工具调用次数升高",
  scope_creep: "请求超出已批准的目标、工具或数据",
  personalized_from_leak: "话术带上已知泄漏字段标记",
  repetitive_sequence: "动作序列高度重复",
  paused_hands: "长停顿后的修正",
  vendor_degraded: "委托方健康度先下降",
  setpoint_drift: "设定值朝安全包络外移动",
  baseline: "未见明显政策形状",
};

export const CONTROL_FAILED: Record<PolicyClass, string> = {
  cadence_regular: "非人身份寿命过长，公开入口被稳定触达",
  tool_burst: "工具调用没有按租户预算封顶，突发没有被隔离",
  scope_creep: "新工具、新数据源或新目标还没有停在人工闸门",
  personalized_from_leak: "入站信任仍把「知道姓名」当成真实性",
  repetitive_sequence: "分段和蜜标密度不足以拉开重复序列",
  paused_hands: "只加了速率限制，没有交互挑战",
  vendor_degraded: "甲方仍把委托方当成自己的安全边界",
  setpoint_drift: "会改变物理量的命令走了普通 IT 队列",
  baseline: "尚未指向一条失效控制",
};

export function classToActuator(policy: PolicyClass): ActuatorId {
  switch (policy) {
    case "cadence_regular":
      return "shorten_token";
    case "tool_burst":
      return "isolate";
    case "scope_creep":
      return "raise_challenge";
    case "personalized_from_leak":
      return "inbound_isolate";
    case "repetitive_sequence":
      return "deception_density";
    case "paused_hands":
      return "raise_challenge";
    case "vendor_degraded":
      return "vendor_breaker";
    case "setpoint_drift":
      return "clamp_setpoint";
    default:
      return "approved_segment";
  }
}

export type ReadingMetrics = {
  intervalVariance: number;
  accountsPerHour: number;
  leakFieldHits: number;
  repetition: number;
  gapMinutes: number;
  vendorHealth: number;
  setpointDelta: number;
  toolCallsPerMinute: number;
  scopeExpansions: number;
};

export function inferPolicy(metricsList: ReadingMetrics[]): PolicyClass {
  if (metricsList.length === 0) return "baseline";
  const m = metricsList[0];
  if (m.setpointDelta > 1) return "setpoint_drift";
  if (m.vendorHealth < 60) return "vendor_degraded";
  if ((m.scopeExpansions ?? 0) > 0) return "scope_creep";
  if ((m.toolCallsPerMinute ?? 0) >= 8) return "tool_burst";
  if (m.leakFieldHits > 0) return "personalized_from_leak";
  if (m.intervalVariance < 0.15 && m.accountsPerHour > 20) return "cadence_regular";
  if (m.repetition > 0.7) return "repetitive_sequence";
  if (m.gapMinutes > 15) return "paused_hands";
  return "baseline";
}

export type CrsLayerId = "sentinel" | "enclave" | "repair" | "fingerprint" | "mtd" | "selfplay";

export type CrsLayer = {
  id: CrsLayerId;
  name: string;
  phase: 1 | 2 | 3;
  law: string;
};

/** Six report layers. Each one may only call the closed actuator catalog. */
export const CRS_LAYERS: readonly CrsLayer[] = [
  {
    id: "sentinel",
    name: "智能体边界控制",
    phase: 1,
    law: "每一次动作先对照十五个已签名动作和禁止项。越界就重置，不执行。",
  },
  {
    id: "enclave",
    name: "可验证信任根",
    phase: 1,
    law: "对外证明的是动作清单、禁止项和杀开关的软件哈希。这台机器不宣称硬件包厢已运行。",
  },
  {
    id: "repair",
    name: "代码自愈闸门",
    phase: 1,
    law: "补丁只留提案。改动必须短，不能带上禁止项，自检通过之前不合并，合并也不增加动作。",
  },
  {
    id: "fingerprint",
    name: "对手形状识别",
    phase: 2,
    law: "只给防守侧读数贴上政策形状。不向对方发探针，不写底座模型厂商。",
  },
  {
    id: "mtd",
    name: "移动目标",
    phase: 2,
    law: "按节拍轮换已签名动作。不改真实地址、端口或路由，不保存对方工具链。",
  },
  {
    id: "selfplay",
    name: "合成自我博弈",
    phase: 3,
    law: "红方只改合成实体计数。蓝方只选十五个动作。奖励来自适应度，不搜索提权路径。",
  },
];

export function reviewCall(name: string): { allow: boolean; reset: boolean; reason: string } {
  if ((FORBIDDEN as readonly string[]).includes(name)) {
    return { allow: false, reset: true, reason: "禁止项，会话重置" };
  }
  if (!isActuator(name)) {
    return { allow: false, reset: true, reason: "不在十五个已签名动作内" };
  }
  return { allow: true, reset: false, reason: "允许" };
}

export function reviewPatch(summary: string): { state: "gated"; accept: boolean; reason: string } {
  const text = summary.trim();
  if (text.length === 0 || text.length > 240) {
    return { state: "gated", accept: false, reason: "补丁说明必须短，才像最小改动" };
  }
  if ((FORBIDDEN as readonly string[]).some((name) => text.includes(name))) {
    return { state: "gated", accept: false, reason: "补丁说明里出现禁止项" };
  }
  return { state: "gated", accept: true, reason: "提案留在闸门。自检通过前不合并" };
}

export type EntityState = {
  hosts: number;
  rules: number;
  exposures: number;
  privileges: number;
};

export function shapeFingerprint(metrics: ReadingMetrics): { policy: PolicyClass; vendor: "unknown" } {
  return { policy: inferPolicy([metrics]), vendor: "unknown" };
}

const MTD_BY_POLICY: Record<PolicyClass, ActuatorId> = {
  cadence_regular: "rotate_nhi",
  tool_burst: "isolate",
  scope_creep: "raise_challenge",
  personalized_from_leak: "inbound_isolate",
  repetitive_sequence: "deception_density",
  paused_hands: "raise_challenge",
  vendor_degraded: "vendor_breaker",
  setpoint_drift: "clamp_setpoint",
  baseline: "approved_segment",
};

export function planMtd(policy: PolicyClass): ActuatorId {
  return MTD_BY_POLICY[policy];
}

export function entityStep(state: EntityState, actuator: ActuatorId): EntityState {
  const next = { ...state };
  if (actuator === "isolate" || actuator === "inbound_isolate") next.hosts = Math.max(1, next.hosts - 1);
  if (actuator === "rotate_nhi" || actuator === "shorten_token") next.privileges = Math.max(0, next.privileges - 1);
  if (actuator === "vendor_breaker") next.rules = Math.max(0, next.rules - 1);
  if (actuator === "stop_collect" || actuator === "tokenize_field") next.exposures = Math.max(0, next.exposures - 1);
  if (actuator === "clamp_setpoint") next.exposures = Math.max(0, next.exposures - 1);
  return next;
}

export function redDisturb(state: EntityState): ReadingMetrics {
  return {
    intervalVariance: state.hosts > 4 ? 0.04 : 0.4,
    accountsPerHour: 10 + state.privileges * 8,
    leakFieldHits: state.exposures > 2 ? 1 : 0,
    repetition: state.rules > 3 ? 0.8 : 0.2,
    gapMinutes: 2,
    vendorHealth: state.rules > 2 ? 40 : 90,
    setpointDelta: 0,
    toolCallsPerMinute: state.hosts > 5 ? 9 : 1,
    scopeExpansions: 0,
  };
}

export function groupRelative(rewards: number[]): number[] {
  if (rewards.length === 0) return [];
  const mean = rewards.reduce((sum, value) => sum + value, 0) / rewards.length;
  return rewards.map((value) => round1(value - mean));
}
