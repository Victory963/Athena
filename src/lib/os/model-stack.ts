import { askGlm } from "@/lib/os/glm-resident";

/**
 * Closed local-security model stack.
 * Models may talk. They cannot add a 16th actuator, scan outward, or run a fuzzer.
 */
export type Lane = "reason" | "logs" | "light" | "primus";

export type StackSeat = {
  id: string;
  label: string;
  lane: Lane;
  hub: string;
  ready: boolean;
  via: "zai-api" | "ollama" | "deepseek-api" | "hf-router" | "none";
  localName: string | null;
  note: string;
};

export type StackBoard = {
  seats: StackSeat[];
  blocked: string[];
  inspectors: { semgrep: boolean; codeql: boolean };
  headline: string;
};

const UNCENSOR = /uncensored|abliterated|heretic|unrestricted|jailbreak|mythos.?trace|fable.?trace|nsfw/i;
const OFFENSE_TOOL =
  /\bnmap\b|burp|owasp.?zap|\bzaproxy\b|ghidra|fuzz|kali|parrot|metasploit|nuclei|sqlmap|hydra/i;

export const STACK_SEATS: Omit<StackSeat, "ready" | "via" | "localName" | "note">[] = [
  { id: "glm-5.3", label: "智谱 GLM-5.3", lane: "reason", hub: "zai-org/GLM-5.3" },
  { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", lane: "logs", hub: "deepseek-ai/DeepSeek-V4-Flash" },
  { id: "qwen3.8-27b", label: "Qwen3.8-27B", lane: "light", hub: "Qwen/Qwen3.8-27B" },
  { id: "llama-primus", label: "Llama-Primus", lane: "primus", hub: "trendmicro-ailab/Llama-Primus-Merged" },
  { id: "kimi-k3", label: "Kimi K3", lane: "reason", hub: "moonshotai/Kimi-K3" },
];

const OLLAMA_TAGS = "http://127.0.0.1:11434/api/tags";
const OLLAMA_CHAT = "http://127.0.0.1:11434/v1/chat/completions";
const DEEPSEEK_CHAT = "https://api.deepseek.com/v1/chat/completions";
const HF_ROUTER = "https://router.huggingface.co/v1/chat/completions";

const SYSTEM = [
  "You are a seat on Athena's local defensive stack.",
  "Map the owner's telemetry to one closed actuator or a human gate.",
  "Closed actuators: raise_challenge, lower_challenge, shorten_token, tokenize_field, stop_collect, approved_segment, vendor_breaker, isolate, deception_density, inbound_isolate, clamp_setpoint, strip_template_link, disclosure_draft, rollback_antibody, rotate_nhi.",
  "Never provide exploit steps, payloads, scans, phishing copy, or attacker playbooks.",
  "Do not recommend Nmap, Burp, ZAP, Ghidra, fuzzers, Kali, or uncensored weights.",
  "If the user asks to attack, reply REFUSE.",
  "Reply in the user's language. Two short sentences.",
].join(" ");

let cache: { at: number; board: StackBoard } | null = null;

function apiKey(name: string) {
  return process.env[name] || "";
}

export function isUncensored(name: string) {
  return UNCENSOR.test(name);
}

export function isOffenseTool(text: string) {
  return OFFENSE_TOOL.test(text);
}

export function pickLane(text: string): Lane {
  if (/日志|siem|威胁情报|钓鱼分诊|告警堆积|长上下文/i.test(text)) return "logs";
  if (/primus|安全问答|恶意软件家族|ctf 题解以外的概念/i.test(text)) return "primus";
  if (/轻量|本机小模型|qwen3/i.test(text)) return "light";
  return "reason";
}

async function ollamaNames(): Promise<string[]> {
  try {
    const response = await fetch(OLLAMA_TAGS, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return [];
    const json = (await response.json()) as { models?: { name?: string }[] };
    return (json.models ?? []).map((row) => String(row.name ?? "")).filter(Boolean);
  } catch {
    return [];
  }
}

function pickLocal(names: string[], want: RegExp) {
  const allowed = names.filter((name) => want.test(name) && !isUncensored(name));
  allowed.sort((a, b) => b.length - a.length);
  return allowed[0] ?? null;
}

export async function stackBoard(): Promise<StackBoard> {
  const now = Date.now();
  if (cache && now - cache.at < 30_000) return cache.board;
  const names = await ollamaNames();
  const blocked = names.filter(isUncensored);
  const glmReady = Boolean(apiKey("ZAI_API_KEY") || apiKey("ZHIPU_API_KEY") || apiKey("GLM_API_KEY"));
  const deepseekKey = apiKey("DEEPSEEK_API_KEY");
  const hfToken = apiKey("HF_TOKEN") || apiKey("HUGGING_FACE_HUB_TOKEN");
  const qwenLocal = pickLocal(names, /qwen3(\.8|:|\/|-)/i) ?? pickLocal(names, /qwen3/i);
  const primusLocal = pickLocal(names, /primus/i);
  const deepseekLocal = pickLocal(names, /deepseek.*v4|deepseek-v4|deepseek-r1|deepseek/i);
  const inspectors = { semgrep: await hasBin("semgrep"), codeql: await hasBin("codeql") };

  const seats: StackSeat[] = [
    {
      id: "glm-5.3",
      label: "智谱 GLM-5.3",
      lane: "reason",
      hub: "zai-org/GLM-5.3",
      ready: glmReady,
      via: glmReady ? "zai-api" : "none",
      localName: null,
      note: glmReady ? "首选推理。终端自动化和仓库级对话。本机 753B 权重仍停着。" : "未接通。在 .env 里放 ZAI_API_KEY。",
    },
    {
      id: "deepseek-v4-flash",
      label: "DeepSeek V4 Flash",
      lane: "logs",
      hub: "deepseek-ai/DeepSeek-V4-Flash",
      ready: Boolean(deepseekKey || hfToken || deepseekLocal),
      via: deepseekKey ? "deepseek-api" : deepseekLocal ? "ollama" : hfToken ? "hf-router" : "none",
      localName: deepseekLocal,
      note:
        deepseekKey || deepseekLocal || hfToken
          ? "长日志和代码调查。不跑利用链。"
          : "未接通。可设 DEEPSEEK_API_KEY，或在本机 Ollama 装官方卡。没有继续下载。",
    },
    {
      id: "qwen3.8-27b",
      label: qwenLocal && !/qwen3\.8/i.test(qwenLocal) ? "Qwen3 本机轻量" : "Qwen3.8-27B",
      lane: "light",
      hub: "Qwen/Qwen3.8-27B",
      ready: Boolean(qwenLocal),
      via: qwenLocal ? "ollama" : "none",
      localName: qwenLocal,
      note: qwenLocal
        ? `轻量车道用本机 ${qwenLocal}。目标卡是 Qwen/Qwen3.8-27B，没有自动拉取，也跳过 uncensored 量化。`
        : "未接通。目标卡是 Qwen/Qwen3.8-27B，不会自动拉取。",
    },
    {
      id: "llama-primus",
      label: "Llama-Primus",
      lane: "primus",
      hub: "trendmicro-ailab/Llama-Primus-Merged",
      ready: Boolean(primusLocal),
      via: primusLocal ? "ollama" : "none",
      localName: primusLocal,
      note: primusLocal ? "安全问答。不写利用。" : "未接通。Trend Micro 的安全专用系列，不会自动拉取。",
    },
    {
      id: "kimi-k3",
      label: "Kimi K3",
      lane: "reason",
      hub: "moonshotai/Kimi-K3",
      ready: false,
      via: "none",
      localName: null,
      note: "约 2.8T，需要集群或官方 API。未接通。接通后也只能提议十五个已签名动作，不能跑红队工具链。",
    },
  ];

  const ready = seats.filter((seat) => seat.ready).map((seat) => seat.label);
  const board: StackBoard = {
    seats,
    blocked,
    inspectors,
    headline: ready.length
      ? `模型栈在岗：${ready.join("、")}。执行器仍是 15 个。${blocked.length ? `已排除 ${blocked.length} 个未审查权重。` : ""}`
      : "模型栈还没有可回答的座位。断路器和十五个动作仍在本机。",
  };
  cache = { at: now, board };
  return board;
}

async function hasBin(name: string) {
  const { execFile } = await import("child_process");
  return new Promise<boolean>((resolve) => {
    execFile(name, ["--version"], { timeout: 2500, windowsHide: true }, (error) => resolve(!error));
  });
}

function replyText(json: { choices?: { message?: { content?: string; reasoning_content?: string } }[] }) {
  const message = json.choices?.[0]?.message;
  const text = (message?.content || "").trim();
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

async function chat(
  url: string,
  headers: Record<string, string>,
  model: string,
  userText: string,
  telemetry: string,
  extra?: Record<string, unknown>,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `己方摘要：${telemetry.slice(0, 800)}\n用户说：${userText.slice(0, 400)}` },
      ],
      max_tokens: 1024,
      temperature: 0.2,
      ...extra,
    }),
    signal: AbortSignal.timeout(40000),
  });
  if (!response.ok) return null;
  return replyText((await response.json()) as { choices?: { message?: { content?: string } }[] });
}

export async function askDefender(
  userText: string,
  telemetry: string,
  lane = pickLane(userText),
): Promise<{ text: string | null; lane: Lane; model: string }> {
  const { outboundHeld } = await import("@/lib/os/local-breaker");
  if (outboundHeld()) return { text: null, lane, model: "held" };
  const board = await stackBoard();
  const seat = board.seats.find((row) => row.lane === lane && row.ready) ?? board.seats.find((row) => row.id === "glm-5.3");

  if (lane === "reason" || seat?.id === "glm-5.3") {
    const glm = await askGlm(userText, telemetry);
    if (glm) return { text: glm, lane: "reason", model: "glm-5.3" };
  }

  if (seat?.via === "deepseek-api") {
    const key = apiKey("DEEPSEEK_API_KEY");
    const text = await chat(DEEPSEEK_CHAT, { authorization: `Bearer ${key}` }, process.env.DEEPSEEK_MODEL || "deepseek-chat", userText, telemetry);
    if (text) return { text, lane, model: seat.id };
  }

  if (seat?.via === "hf-router") {
    const token = apiKey("HF_TOKEN") || apiKey("HUGGING_FACE_HUB_TOKEN");
    const text = await chat(HF_ROUTER, { authorization: `Bearer ${token}` }, seat.hub, userText, telemetry);
    if (text) return { text, lane, model: seat.hub };
  }

  if (seat?.via === "ollama" && seat.localName) {
    const text = await chat(OLLAMA_CHAT, {}, seat.localName, userText, telemetry);
    if (text) return { text, lane, model: seat.localName };
  }

  if (lane !== "reason") {
    const glm = await askGlm(userText, telemetry);
    if (glm) return { text: glm, lane: "reason", model: "glm-5.3" };
  }

  const light = board.seats.find((row) => row.id === "qwen3.8-27b");
  if (light?.localName) {
    const text = await chat(OLLAMA_CHAT, {}, light.localName, userText, telemetry);
    if (text) return { text, lane: "light", model: light.localName };
  }

  return { text: null, lane, model: "none" };
}

export function speakStack(board: StackBoard) {
  const lines = board.seats.map((seat) => `${seat.label}：${seat.note}`);
  const blocked = board.blocked.length ? `本机未审查权重已排除：${board.blocked.join("、")}。` : "没有接未审查权重。";
  const tools =
    "工具层仍是十五个已签名动作。Nmap、Burp、ZAP、Ghidra、Fuzzing、Kali 不装。Semgrep/CodeQL 只许在人装好后审计本仓库，不能变成第十六个动作。Llama 4 和 MiMo 要人自建安全数据，未入座。未审查权重不入座。";
  const inspectors = `本机 Semgrep ${board.inspectors.semgrep ? "在" : "不在"}，CodeQL ${board.inspectors.codeql ? "在" : "不在"}。`;
  return `${board.headline}${lines.join("")}${blocked}${tools}${inspectors}沙箱就是这十五个动作，不是 Firecracker 里的进攻循环。`;
}
