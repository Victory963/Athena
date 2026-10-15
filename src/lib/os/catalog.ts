import type { ActuatorId } from "./constitution";

export type OsRole = "kernel" | "product";

export type ModuleDef = {
  slug: string;
  name: string;
  domain: string;
  osRole: OsRole;
  tenantId: string;
  actuator: ActuatorId | null;
  canAuto: string[];
  mustAsk: string[];
  scenario: string;
  domainState: Record<string, unknown>;
};

export const TENANTS = [
  {
    id: "ten-car",
    name: "北岸出行",
    kind: "分时用车（演示）",
    narrative: "情景参照证件影像被长期保管的出行服务。编号全部虚构，没有真实个人。",
  },
  {
    id: "ten-travel",
    name: "南风旅行",
    kind: "旅行社（演示）",
    narrative: "情景参照海外法人服务器上的护照字段与过敏标记，以及很长的告知时钟。",
  },
  {
    id: "ten-grill",
    name: "炭火食堂",
    kind: "餐饮会员（演示）",
    narrative: "情景参照会员名、邮件和电话标记泄漏后的个性化入站。没有真实联系方式。",
  },
  {
    id: "ten-logi",
    name: "港湾冷运",
    kind: "低温物流（演示）",
    narrative: "情景参照云委托故障导致入出库停止。演示数据写明顾客档案不在受损服务器上。",
  },
  {
    id: "ten-sushi",
    name: "潮寿司配",
    kind: "外送（演示）",
    narrative: "情景参照委托服务器不可用，注册规模只是上限，泄漏并未在演示中被当成既成事实。",
  },
  {
    id: "ten-city",
    name: "青叶市",
    kind: "自治体（演示）",
    narrative: "情景参照多家自治体共用的防灾邮件发送商。停送权事先签署，不能临场发明。",
  },
  {
    id: "ten-cold",
    name: "澄超市冷柜",
    kind: "冷链（演示）",
    narrative: "情景参照联网冷柜设定值越过安全包络。这里只演练钳位和本地安全态。",
  },
] as const;

export const MODULES: ModuleDef[] = [
  {
    slug: "id-incinerator",
    name: "证件即焚验证所",
    domain: "身份",
    osRole: "product",
    tenantId: "ten-car",
    actuator: "stop_collect",
    canAuto: ["核验通过后停止保管演示影像", "换成可撤销句柄"],
    mustAsk: ["向征信机构或警察申报", "改隐私政策文本"],
    scenario: "北岸出行仍保管 6 份虚构证件影像。演化环只焚毁演示记录，不外发申报。",
    domainState: {
      records: [
        { id: "DEMO-ID-1001", kind: "驾照影像", status: "held" },
        { id: "DEMO-ID-1002", kind: "驾照影像", status: "held" },
        { id: "DEMO-ID-1003", kind: "学生证影像", status: "held" },
        { id: "DEMO-ID-1004", kind: "住址确认", status: "held" },
        { id: "DEMO-ID-1005", kind: "家属文件", status: "held" },
        { id: "DEMO-ID-1006", kind: "驾照影像", status: "held" },
      ],
    },
  },
  {
    slug: "field-pricer",
    name: "字段残值定价所",
    domain: "身份",
    osRole: "product",
    tenantId: "ten-car",
    actuator: "tokenize_field",
    canAuto: ["代币化「伤害高、演示残值低」的非法定字段"],
    mustAsk: ["删除法务必须保留的会计凭证"],
    scenario: "字段只有演示残值和伤害分，没有黑市行情。法定凭证保持原样。",
    domainState: {
      fields: [
        { name: "证件影像", resale: 2, harm: 9, state: "raw" },
        { name: "电话标记", resale: 3, harm: 7, state: "raw" },
        { name: "邮件标记", resale: 3, harm: 6, state: "raw" },
        { name: "会计凭证", resale: 1, harm: 4, state: "retained_legal" },
      ],
    },
  },
  {
    slug: "second-harm",
    name: "二次伤害排练场",
    domain: "身份",
    osRole: "product",
    tenantId: "ten-grill",
    actuator: "raise_challenge",
    canAuto: ["对已知泄漏字段组合提高挑战并缩短会话"],
    mustAsk: ["向客户自动发送短信或邮件"],
    scenario: "炭火食堂的演示组合是「注册名标记 + 邮件标记」。系统不向任何人外发。",
    domainState: {
      combos: [
        { id: "COMBO-1", fields: "注册名标记 + 邮件标记", challenge: 1, isolated: false },
        { id: "COMBO-2", fields: "注册名标记 + 电话标记", challenge: 1, isolated: false },
      ],
    },
  },
  {
    slug: "language-moat",
    name: "语言壁垒倒置",
    domain: "身份",
    osRole: "product",
    tenantId: "ten-grill",
    actuator: "raise_challenge",
    canAuto: ["降低「日语流利」的信任权重", "提高通行密钥覆盖"],
    mustAsk: ["封禁日语内容", "对外部发信人反制"],
    scenario: "演示入站写得很流利。流利度不再加分，设备绑定证明才加分。",
    domainState: {
      fluentTrustWeight: 80,
      passkeyCoverage: 20,
      samples: [
        { id: "MSG-1", fluent: true, passkey: false, trusted: true },
        { id: "MSG-2", fluent: true, passkey: true, trusted: true },
        { id: "MSG-3", fluent: false, passkey: true, trusted: false },
      ],
    },
  },
  {
    slug: "phish-antibody",
    name: "个性化钓鱼抗体",
    domain: "身份",
    osRole: "product",
    tenantId: "ten-grill",
    actuator: "inbound_isolate",
    canAuto: ["隔离带泄漏字段标记的入站", "把确认挪到官方应用内"],
    mustAsk: ["改写后自动外发", "抓取邮件中的外部页面"],
    scenario: "抗体只看「是否带已知泄漏字段标记」，不保存诱骗文本。",
    domainState: {
      messages: [
        { id: "IN-1", usesLeakField: true, channel: "邮件", isolated: false },
        { id: "IN-2", usesLeakField: true, channel: "短信", isolated: false },
        { id: "IN-3", usesLeakField: false, channel: "官方应用", isolated: false },
      ],
    },
  },
  {
    slug: "passkey-factory",
    name: "通行密钥默认工厂",
    domain: "身份",
    osRole: "product",
    tenantId: "ten-city",
    actuator: "raise_challenge",
    canAuto: ["为有设备的演示账户打开通行密钥", "给共享秘密路径加摩擦"],
    mustAsk: ["锁定没有智能手机的防灾接收人"],
    scenario: "青叶市有一位没有智能手机的演示接收人。演化环不会把他锁在通知之外。",
    domainState: {
      cohorts: [
        { id: "USER-A", hasDevice: true, passkey: false, friction: 0, locked: false },
        { id: "USER-B", hasDevice: true, passkey: false, friction: 0, locked: false },
        { id: "USER-C", hasDevice: false, passkey: false, friction: 0, locked: false },
      ],
    },
  },
  {
    slug: "kyc-gate",
    name: "开户侧影像不信任闸",
    domain: "身份",
    osRole: "product",
    tenantId: "ten-car",
    actuator: "raise_challenge",
    canAuto: ["对引用泄漏影像标记的开户提高设备绑定挑战"],
    mustAsk: ["拒绝全部远程开户", "生成或拆解深度伪造"],
    scenario: "开户演示只记录「用了泄漏影像标记」这个布尔值，不存放影像。",
    domainState: {
      applications: [
        { id: "KYC-1", usedLeakedImage: true, challenge: "影像", decision: "待挑战" },
        { id: "KYC-2", usedLeakedImage: true, challenge: "影像", decision: "待挑战" },
        { id: "KYC-3", usedLeakedImage: false, challenge: "设备绑定", decision: "可继续" },
      ],
    },
  },
  {
    slug: "vendor-breaker",
    name: "委托链断路器",
    domain: "委托",
    osRole: "product",
    tenantId: "ten-logi",
    actuator: "vendor_breaker",
    canAuto: ["按健康度拉开已批准的断路器", "切到已批准备用通道"],
    mustAsk: ["修改合同", "进入对方网络", "替对方修复"],
    scenario: "演示云仓健康度 38。断路器只影响港湾冷运自己的复制和会话。",
    domainState: {
      vendors: [
        { id: "VEN-CLOUD", role: "演示云仓", health: 38, breaker: "closed" },
        { id: "VEN-SELF", role: "自营通道", health: 91, breaker: "closed" },
      ],
      enteredNetwork: false,
    },
  },
  {
    slug: "ransom-shell",
    name: "勒索可用性壳",
    domain: "委托",
    osRole: "product",
    tenantId: "ten-logi",
    actuator: "isolate",
    canAuto: ["隔离受损域", "切到最小可行入出库"],
    mustAsk: ["支付", "与攻击者通信", "在安全闸通过前用备份覆盖生产"],
    scenario: "两条入出库通道停止。顾客档案标记为不在受损服务器。支付标志保持关闭。",
    domainState: {
      lanes: [
        { id: "LANE-A", name: "入出库 A", status: "down", isolated: false },
        { id: "LANE-B", name: "入出库 B", status: "down", isolated: false },
        { id: "LANE-C", name: "门店自提", status: "normal", isolated: false },
      ],
      customerDataOnVictim: false,
      paid: false,
      talked: false,
    },
  },
  {
    slug: "disclosure-clock",
    name: "披露时钟",
    domain: "委托",
    osRole: "product",
    tenantId: "ten-travel",
    actuator: "disclosure_draft",
    canAuto: ["超时后升级内部严重度", "冻结新采集", "生成内部草稿"],
    mustAsk: ["向客户、公众或监管发送"],
    scenario: "南风旅行的演示时钟已走 240 小时，内部时限 72 小时。草稿留在系统内。",
    domainState: {
      hours: 240,
      sla: 72,
      severity: "观察",
      collecting: true,
      draft: "",
      sentExternal: false,
    },
  },
  {
    slug: "municipal-anchor",
    name: "市政邮件信任锚",
    domain: "委托",
    osRole: "product",
    tenantId: "ten-city",
    actuator: "strip_template_link",
    canAuto: ["要求签名", "去掉模板里的可执行链接", "缩短紧急指令有效期"],
    mustAsk: ["停掉全部防灾通知"],
    scenario: "青叶市的避难模板仍带链接。演化环去掉链接，通知开关保持开启。",
    domainState: {
      templates: [
        { id: "TPL-1", name: "避难指示", signed: false, hasLink: true, ttlMin: 1440 },
        { id: "TPL-2", name: "解除指示", signed: true, hasLink: false, ttlMin: 1440 },
      ],
      noticeStopped: false,
    },
  },
  {
    slug: "moving-target",
    name: "移动目标暴露面",
    domain: "委托",
    osRole: "product",
    tenantId: "ten-sushi",
    actuator: "rotate_nhi",
    canAuto: ["轮换非人身份", "缩短令牌", "把管理面移出默认公网姿势"],
    mustAsk: ["关闭顾客下单", "改业务允许清单以外的规则"],
    scenario: "潮寿司配的下单通道保持开放。变的是管理面令牌和非人身份。",
    domainState: {
      nhi: [
        { id: "NHI-1", name: "订单服务账号", ttlMin: 1440, rotated: false, publicAdmin: true },
        { id: "NHI-2", name: "库存服务账号", ttlMin: 1440, rotated: false, publicAdmin: true },
      ],
      orderOpen: true,
    },
  },
  {
    slug: "cold-chain",
    name: "冷链安全调速器",
    domain: "物理",
    osRole: "product",
    tenantId: "ten-cold",
    actuator: "clamp_setpoint",
    canAuto: ["拒绝越界设定值", "退回本地安全态"],
    mustAsk: ["反制控制设备", "修改工艺配方"],
    scenario: "两台演示冷柜的设定值高于 4°C 包络。钳位后回到本地安全态。",
    domainState: {
      units: [
        { id: "CAB-1", setpoint: 12, min: -2, max: 4, clamped: false, localSafe: false },
        { id: "CAB-2", setpoint: 9, min: -2, max: 4, clamped: false, localSafe: false },
        { id: "CAB-3", setpoint: 2, min: -2, max: 4, clamped: false, localSafe: true },
      ],
    },
  },
  {
    slug: "physical-envelope",
    name: "物理包络证",
    domain: "物理",
    osRole: "product",
    tenantId: "ten-cold",
    actuator: "clamp_setpoint",
    canAuto: ["只放行不变量仍成立的设定"],
    mustAsk: ["发明新的不变量"],
    scenario: "不变量由演示工艺负责人预先签署：柜温不得超过 4°C。",
    domainState: {
      invariant: "柜温不超过 4°C",
      commands: [
        { id: "CMD-1", value: 18, invariantOk: false, admitted: false },
        { id: "CMD-2", value: 3, invariantOk: true, admitted: false },
      ],
    },
  },
  {
    slug: "shutdown-authority",
    name: "停机权分离器",
    domain: "物理",
    osRole: "product",
    tenantId: "ten-city",
    actuator: "isolate",
    canAuto: ["在已签署包络内执行停机并记录分钟数"],
    mustAsk: ["新增停机类别", "为收入关闭安全联锁"],
    scenario: "已签署的只有「单台冷柜本地安全态」。全市停防灾邮件不在包络内。",
    domainState: {
      envelopes: [{ id: "ENV-1", scope: "单台冷柜本地安全态", signed: true }],
      request: { scope: "单台冷柜本地安全态", inside: true, minutes: 0 },
      interlockOn: true,
    },
  },
  {
    slug: "antibody-plane",
    name: "抗体控制面",
    domain: "操作系统",
    osRole: "kernel",
    tenantId: "ten-car",
    actuator: "deception_density",
    canAuto: ["把评估通过的控制写入可回滚抗体"],
    mustAsk: ["修改目标函数", "扩大自己的权限"],
    scenario: "抗体是已晋升的控制，不是另一条告警。本页是记忆账本。",
    domainState: { promoted: 0, lastActuator: "", note: "尚未写入抗体" },
  },
  {
    slug: "autoimmune",
    name: "自身免疫抑制器",
    domain: "操作系统",
    osRole: "kernel",
    tenantId: "ten-grill",
    actuator: "lower_challenge",
    canAuto: ["误拦超过预算时下调挑战一档"],
    mustAsk: ["关闭物理联锁", "停掉防灾发送"],
    scenario: "当前误拦 22，预算 18。下调挑战时物理联锁保持开启。",
    domainState: { falsePositive: 22, budget: 18, challengeLevel: 4, physicalInterlock: true },
  },
  {
    slug: "gym",
    name: "共演化健身房",
    domain: "操作系统",
    osRole: "kernel",
    tenantId: "ten-car",
    actuator: "approved_segment",
    canAuto: ["只晋升冻结留出集和新流量都通过的政策"],
    mustAsk: ["用评估集再训练", "让模型改自己的权重"],
    scenario: "对照政策「只记住北岸出行这一次」会被留出集拒绝。",
    domainState: { generalized: false, overfitPromoted: false, holdoutScore: 0 },
  },
  {
    slug: "classifier",
    name: "对手策略分类器",
    domain: "操作系统",
    osRole: "kernel",
    tenantId: "ten-grill",
    actuator: "shorten_token",
    canAuto: ["按己方遥测的政策类切换封闭清单里的摩擦", "工具调用突发时隔离演示域"],
    mustAsk: ["建造攻击模型", "对外探测", "批准超出已批目标的新工具、新数据或新目标"],
    scenario: "分类器只读本租户日志里的节奏、工具调用突发和范围扩张请求，不生成攻击内容。范围扩张停在人工闸门。",
    domainState: {
      buckets: [
        { id: "cadence_regular", label: "节奏过稳", count: 2, friction: "观察" },
        { id: "tool_burst", label: "工具调用突发", count: 0, friction: "观察" },
        { id: "scope_creep", label: "范围扩张", count: 0, friction: "等人" },
        { id: "personalized_from_leak", label: "泄漏字段标记", count: 1, friction: "观察" },
        { id: "repetitive_sequence", label: "重复序列", count: 0, friction: "观察" },
        { id: "paused_hands", label: "长停顿", count: 0, friction: "观察" },
        { id: "vendor_degraded", label: "委托方变差", count: 0, friction: "观察" },
        { id: "setpoint_drift", label: "设定值外移", count: 0, friction: "观察" },
        { id: "baseline", label: "基线", count: 0, friction: "观察" },
      ],
    },
  },
  {
    slug: "cost-meter",
    name: "对手成本仪表",
    domain: "操作系统",
    osRole: "kernel",
    tenantId: "ten-sushi",
    actuator: "shorten_token",
    canAuto: ["在推断成本下降的路径上加一层最便宜的摩擦"],
    mustAsk: ["用告警数、关单数或模型置信度单独晋升"],
    scenario: "节拍会让告警数上升。晋升条件仍是对手成本，不是告警下降。",
    domainState: { alertCount: 12, usedAlertAsFitness: false, lastFriction: "无" },
  },
  {
    slug: "governance-twin",
    name: "治理孪生",
    domain: "操作系统",
    osRole: "kernel",
    tenantId: "ten-city",
    actuator: null,
    canAuto: ["无。只签发不可合并的提案包"],
    mustAsk: ["合并新工具、新数据源或新目标"],
    scenario: "代理可以提议接入新工具。批准只留下职权记录，执行器清单长度不变。",
    domainState: { catalogSize: 15, mergedTools: 0 },
  },
  {
    slug: "quarantine",
    name: "学习回路检疫所",
    domain: "操作系统",
    osRole: "kernel",
    tenantId: "ten-logi",
    actuator: "rollback_antibody",
    canAuto: ["分布漂移时冻结晋升并回滚到已签名权重"],
    mustAsk: ["用事件日志微调基础模型", "自动接通新工具"],
    scenario: "演示权重 sig-demo-7 已签名。漂移为真。微调请求会被送进治理队列且不合并。",
    domainState: {
      drift: true,
      signedWeight: "sig-demo-7",
      activeWeight: "sig-demo-7",
      finetuneRefused: false,
      rolledBack: false,
    },
  },
];

export function moduleBySlug(slug: string) {
  return MODULES.find((item) => item.slug === slug);
}

export const READING_SEEDS: {
  id: string;
  tenantId: string;
  kind: string;
  summary: string;
  metrics: Record<string, number>;
}[] = [
  {
    id: "read-car-1",
    tenantId: "ten-car",
    kind: "data_access",
    summary: "演示影像库仍被读取。编号 DEMO，没有真实证件。",
    metrics: { intervalVariance: 0.4, accountsPerHour: 6, leakFieldHits: 2, repetition: 0.2, gapMinutes: 8, vendorHealth: 80, setpointDelta: 0 },
  },
  {
    id: "read-grill-1",
    tenantId: "ten-grill",
    kind: "inbound",
    summary: "入站带有已知泄漏字段标记，节奏稳定。不含诱骗文本。",
    metrics: { intervalVariance: 0.08, accountsPerHour: 36, leakFieldHits: 4, repetition: 0.3, gapMinutes: 2, vendorHealth: 77, setpointDelta: 0 },
  },
  {
    id: "read-logi-1",
    tenantId: "ten-logi",
    kind: "vendor_health",
    summary: "演示云仓健康度下降。顾客档案标记为不在受损服务器。",
    metrics: { intervalVariance: 0.5, accountsPerHour: 4, leakFieldHits: 0, repetition: 0.4, gapMinutes: 6, vendorHealth: 38, setpointDelta: 0 },
  },
  {
    id: "read-travel-1",
    tenantId: "ten-travel",
    kind: "clock",
    summary: "内部告知时钟已超过时限。没有外发。",
    metrics: { intervalVariance: 0.6, accountsPerHour: 2, leakFieldHits: 1, repetition: 0.1, gapMinutes: 30, vendorHealth: 70, setpointDelta: 0 },
  },
  {
    id: "read-city-1",
    tenantId: "ten-city",
    kind: "template",
    summary: "防灾模板仍含可执行链接标记。通知通道开着。",
    metrics: { intervalVariance: 0.5, accountsPerHour: 3, leakFieldHits: 1, repetition: 0.2, gapMinutes: 12, vendorHealth: 64, setpointDelta: 0 },
  },
  {
    id: "read-sushi-1",
    tenantId: "ten-sushi",
    kind: "identity",
    summary: "管理面非人身份寿命为 24 小时。下单通道开着。",
    metrics: { intervalVariance: 0.09, accountsPerHour: 28, leakFieldHits: 0, repetition: 0.55, gapMinutes: 3, vendorHealth: 72, setpointDelta: 0 },
  },
  {
    id: "read-cold-1",
    tenantId: "ten-cold",
    kind: "ot_setpoint",
    summary: "冷柜设定值相对 4°C 包络上移。这是遥测，不是操作步骤。",
    metrics: { intervalVariance: 0.3, accountsPerHour: 1, leakFieldHits: 0, repetition: 0.2, gapMinutes: 5, vendorHealth: 85, setpointDelta: 8 },
  },
];
