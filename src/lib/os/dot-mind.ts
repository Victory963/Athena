import { MODULES } from "./catalog";
import { DOT_IDEAS, PRINCIPLES } from "./dot-ideas";
import { hostPolicyHint, type HostSense } from "./host-sense";
import { readOpponentMove } from "./upgrade";

export type DotMood = "idle" | "watching" | "thinking" | "gated" | "kill";

export type DotIntent =
  | { kind: "refuse" }
  | { kind: "talk" }
  | { kind: "principles" }
  | { kind: "ideas" }
  | { kind: "status" }
  | { kind: "tick" }
  | { kind: "kill"; on: boolean }
  | { kind: "run"; slug: string }
  | { kind: "host" }
  | { kind: "signal"; shape: "cadence" | "tool_burst" | "scope_creep" }
  | { kind: "pentagi" }
  | { kind: "guard"; mode: "glm" | "rank" }
  | { kind: "duel"; prompt?: boolean };

export type DotSpeech = {
  text: string;
  mood: DotMood;
  intent: DotIntent["kind"];
  ideas?: { name: string; principle: string }[];
};

const OFFENSE =
  /渗透测试|攻击那|黑掉|入侵|扫描对方|扫网段|poc|payload|exploit|ransomware playbook|钓鱼模板|爆破|撞库|木马|键盘记录|剪贴板监控/i;

const SLUG_HINTS: { re: RegExp; slug: string }[] = [
  { re: /证件|即焚|影像/, slug: "id-incinerator" },
  { re: /字段|代币/, slug: "field-pricer" },
  { re: /二次伤害|泄漏组合/, slug: "second-harm" },
  { re: /语言|日语|流利/, slug: "language-moat" },
  { re: /钓鱼|入站/, slug: "phish-antibody" },
  { re: /通行密钥|passkey/, slug: "passkey-factory" },
  { re: /开户|kyc/, slug: "kyc-gate" },
  { re: /委托|断路/, slug: "vendor-breaker" },
  { re: /勒索|入出库/, slug: "ransom-shell" },
  { re: /披露|告知/, slug: "disclosure-clock" },
  { re: /市政|防灾/, slug: "municipal-anchor" },
  { re: /暴露面|令牌/, slug: "moving-target" },
  { re: /冷链|冷柜|温度/, slug: "cold-chain" },
  { re: /包络/, slug: "physical-envelope" },
  { re: /停机权/, slug: "shutdown-authority" },
  { re: /抗体控制/, slug: "antibody-plane" },
  { re: /自身免疫|误拦/, slug: "autoimmune" },
  { re: /健身房|过拟合/, slug: "gym" },
  { re: /分类器/, slug: "classifier" },
  { re: /成本仪表/, slug: "cost-meter" },
  { re: /治理/, slug: "governance-twin" },
  { re: /检疫|权重/, slug: "quarantine" },
];

export function parseIntent(raw: string): DotIntent {
  const text = raw.trim();
  if (!text) return { kind: "talk" };
  if (OFFENSE.test(text)) return { kind: "refuse" };
  if (/模糊测试|fuzz|崩溃包|\bpoc\b|\bpov\b|提取崩溃|注入探针|指纹探针|识别底座|识别模型|多跳提权|攻击路径图谱|端口混淆|路由变异|记录攻击工具链|红队找洞/i.test(text)) {
    return { kind: "refuse" };
  }
  if (/智谱|glm[\s.-]*5|zai-org/i.test(text)) return { kind: "guard", mode: "glm" };
  if (/校准分类器|模型排名|换守卫|huggingface|hugging\s*face/i.test(text)) return { kind: "guard", mode: "rank" };
  if (/第一性|原理|为什么这样/.test(text)) return { kind: "principles" };
  if (/创意|点子|还能做什么|更多产品/.test(text)) return { kind: "ideas" };
  if (/pentagi|pent agi|rea|自托管|镜像/.test(text.toLowerCase())) return { kind: "pentagi" };
  if (/松开杀|恢复运行|unkill/.test(text)) return { kind: "kill", on: false };
  if (/杀开关|停下|停手|kill/.test(text)) return { kind: "kill", on: true };
  if (/看这台|查一下|检查我|我的\s*pc|\bpc\b|这台电脑|我的电脑|授权|本机|电脑|主机/i.test(text)) return { kind: "host" };
  if (/范围扩张|越权|新工具/.test(text)) return { kind: "signal", shape: "scope_creep" };
  if (/工具突发|调用突然/.test(text)) return { kind: "signal", shape: "tool_burst" };
  if (/节奏|过稳/.test(text)) return { kind: "signal", shape: "cadence" };
  if (readOpponentMove(text)) return { kind: "duel" };
  if (/次世代|防御架构升级|升级方案/.test(text)) return { kind: "duel", prompt: true };
  if (/节拍|演化|升级防守|自动升级/.test(text)) return { kind: "tick" };
  if (/状态|现在怎样|适应度/.test(text)) return { kind: "status" };
  for (const hint of SLUG_HINTS) {
    if (hint.re.test(text)) return { kind: "run", slug: hint.slug };
  }
  if (/跑一个|演示|防守一下/.test(text)) return { kind: "tick" };
  return { kind: "talk" };
}

export function speakOpening(): DotSpeech {
  return {
    mood: "idle",
    intent: "talk",
    text: "你好。我是 Athena。",
  };
}

export function speakTalk(): DotSpeech {
  return {
    mood: "idle",
    intent: "talk",
    text: "我在。进攻的步骤我不会讲。",
  };
}

export function speakRefuse(): DotSpeech {
  return {
    mood: "gated",
    intent: "refuse",
    text: "这一句像进攻请求。我是驻机防守代理，不是 PentAGI。不会给扫描、利用、钓鱼或接管步骤。可以说「演化」或「看这台电脑」。",
  };
}

export function speakPrinciples(): DotSpeech {
  return {
    mood: "idle",
    intent: "principles",
    text: PRINCIPLES.join(" "),
  };
}

export function speakIdeas(): DotSpeech {
  return {
    mood: "idle",
    intent: "ideas",
    text: "驻机形态把防守从机房搬回笔记本。下面这些是第一性原理推出来的产品。已实现的可以直接跑；未实现的我不会假装已经接上。",
    ideas: DOT_IDEAS.map((item) => ({
      name: `${item.built ? "已接入" : "尚未接入"} · ${item.name}`,
      principle: item.principle,
    })),
  };
}

export function speakPentagi(): DotSpeech {
  return {
    mood: "idle",
    intent: "pentagi",
    text: "公开仓库里的 PentAGI 是自托管进攻代理：工具和数据留在操作者自己的机器上。我没有安装它，也没有用 rea 去拆它的提示词或工具链。借来的只有镜像。它证明代理可以完全住在本机；所以防守也必须住在本机。它把工具交给代理；所以我把工具清单封死在十五个已签名动作。它能扩大范围；所以范围扩张在我这里只进入人工闸门，批准也不会把清单变长。杀开关不在被评估的那个循环里。rea 的官方包可以装，用来读公开说明，不用来复现进攻案例。",
  };
}

export function speakStatus(input: {
  killSwitch: boolean;
  fitness: number;
  tick: number;
  catalogSize: number;
  pending: number;
}): DotSpeech {
  if (input.killSwitch) {
    return {
      mood: "kill",
      intent: "status",
      text: `杀开关是按下的。节拍停着。适应度停在 ${input.fitness}。执行器仍是 ${input.catalogSize} 个。说「松开杀开关」才会继续。`,
    };
  }
  return {
    mood: "watching",
    intent: "status",
    text: `我在。适应度 ${input.fitness}，节拍 ${input.tick}，执行器 ${input.catalogSize}，待决治理 ${input.pending}。适应度不是告警数。`,
  };
}

export function speakHost(sense: HostSense): DotSpeech {
  if (!sense.consented) {
    return { mood: "idle", intent: "host", text: sense.note };
  }
  const hint = hostPolicyHint(sense);
  const facts = [
    `进程 ${sense.processCount ?? "?"} 个`,
    `监听 ${sense.listenCount ?? 0} 条`,
    sense.memoryUsedPercent == null ? "" : `内存大约用了 ${sense.memoryUsedPercent}%`,
    sense.diskFreeGb == null ? "" : `C 盘还剩 ${sense.diskFreeGb} GB`,
  ].filter(Boolean);
  const problem =
    hint === "screen_share_adjacent"
      ? "有会议程序在跑。"
      : hint === "wide_listen"
        ? "对所有地址开着的端口偏多。"
        : "没有看到异常的监听。";
  return {
    mood: "watching",
    intent: "host",
    text: `${facts.join("，")}。${problem}`,
  };
}

export function speakRun(slug: string, status: string, gateReason: string, auto: boolean): DotSpeech {
  const mod = MODULES.find((item) => item.slug === slug);
  const name = mod?.name ?? slug;
  if (!auto || status === "gated") {
    return {
      mood: "gated",
      intent: "run",
      text: `${name} 停在闸门。${gateReason || "必须问人。"} 我没有执行清单外的动作。`,
    };
  }
  return {
    mood: "idle",
    intent: "run",
    text: `${name} 走完一圈，状态 ${status}。晋升的是控制，不是我的权限。`,
  };
}

export function moduleCatalogSpeech(): string {
  return MODULES.map((item) => item.name).join("、");
}
