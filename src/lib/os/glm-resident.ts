import fs from "fs";
import os from "os";
import path from "path";

export const GLM_ID = "zai-org/GLM-5.2";
export const GLM_GGUF_ID = "unsloth/GLM-5.2-GGUF";
export const GLM_QUANT = "UD-IQ1_S";
export const GLM_LABEL = "智谱 GLM-5.2";
export const GLM_API_MODEL = "glm-5.3";
export const GLM_API_LABEL = "智谱 GLM-5.3";
export const GLM_PARAMS = "753B";
export const GLM_MIN_RAM_GB = 223;
export const GLM_CARD = "https://huggingface.co/zai-org/GLM-5.2";
export const GLM_EXPECTED_BYTES = 216715360960;

export type GlmChannel = "local-weights" | "downloading" | "local-server" | "zai-api" | "card-only";

export type GlmStatus = {
  id: typeof GLM_ID;
  ggufId: typeof GLM_GGUF_ID;
  label: typeof GLM_LABEL;
  installed: boolean;
  channel: GlmChannel;
  ramGb: number;
  weightsFit: boolean;
  bytes: number;
  expectedBytes: number;
  percent: number;
  note: string;
};

const CARD_DIR = path.join(process.cwd(), ".cache", "glm-5.2");
export const GLM_WEIGHT_DIR = path.join(CARD_DIR, "gguf", GLM_QUANT);
const LOCAL_SERVERS = ["http://127.0.0.1:8080/v1/models", "http://127.0.0.1:11434/api/tags"];

function ramGb() {
  return Math.round((os.totalmem() / 1024 / 1024 / 1024) * 10) / 10;
}

function apiKey() {
  return process.env.ZAI_API_KEY || process.env.ZHIPU_API_KEY || process.env.GLM_API_KEY || "";
}

async function probe(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
  return response.ok;
}

function walkBytes(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const name of fs.readdirSync(dir)) {
    const next = path.join(dir, name);
    const stat = fs.statSync(next);
    if (stat.isDirectory()) total += walkBytes(next);
    else if (name.endsWith(".gguf") || name.endsWith(".incomplete")) total += stat.size;
  }
  return total;
}

function weightBytes() {
  return walkBytes(path.join(CARD_DIR, "gguf"));
}

export function weightsOnDisk() {
  const bytes = weightBytes();
  const files = fs.existsSync(GLM_WEIGHT_DIR)
    ? fs.readdirSync(GLM_WEIGHT_DIR).filter((name) => name.endsWith(".gguf")).length
    : 0;
  return { bytes, files, complete: files >= 6 && bytes >= GLM_EXPECTED_BYTES * 0.98 };
}

export async function installGlmCard() {
  fs.mkdirSync(CARD_DIR, { recursive: true });
  const dest = path.join(CARD_DIR, "tokenizer_config.json");
  if (fs.existsSync(dest)) return dest;
  const response = await fetch("https://huggingface.co/zai-org/GLM-5.2/resolve/main/tokenizer_config.json", {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Hugging Face ${response.status}`);
  fs.writeFileSync(dest, await response.text());
  fs.writeFileSync(
    path.join(CARD_DIR, "ATHENA.txt"),
    [
      GLM_ID,
      `Quantized local copy: ${GLM_GGUF_ID} ${GLM_QUANT}`,
      "MIT open weights of GLM-5.2. Athena maps own telemetry onto 15 signed actuators.",
      "It does not read attacker payloads.",
    ].join("\n"),
  );
  return dest;
}

export async function glmStatus(): Promise<GlmStatus> {
  const ram = ramGb();
  const disk = weightsOnDisk();
  const percent = Math.min(100, Math.round((disk.bytes / GLM_EXPECTED_BYTES) * 1000) / 10);
  const weightsFit = ram >= GLM_MIN_RAM_GB;
  let channel: GlmChannel = "card-only";
  let installed = disk.complete;
  let note = `${GLM_LABEL} 权重还没到齐。目标 ${GLM_GGUF_ID} ${GLM_QUANT}，约 ${(GLM_EXPECTED_BYTES / 1e9).toFixed(0)} GB。`;

  try {
    await installGlmCard();
  } catch (error) {
    note = `卡片失败：${error instanceof Error ? error.message : "网络"}。${note}`;
  }

  if (disk.complete) {
    channel = "local-weights";
    note = weightsFit
      ? `${GLM_LABEL} 本机权重已装好（${GLM_QUANT}）。内存够加载。`
      : `${GLM_LABEL} 本机权重已装好（${GLM_QUANT}，${(disk.bytes / 1e9).toFixed(0)} GB）。这台机器约 ${ram} GB 内存，加载需要约 ${GLM_MIN_RAM_GB} GB。权重在盘上，不会强行灌进内存。`;
  } else if (disk.bytes > 0) {
    channel = "downloading";
    note = `${GLM_LABEL} 正在往这台机器装权重：${(disk.bytes / 1e9).toFixed(1)} / ${(GLM_EXPECTED_BYTES / 1e9).toFixed(0)} GB（${percent}%）。`;
  }

  try {
    if (await probe(LOCAL_SERVERS[0])) {
      channel = "local-server";
      installed = true;
      note = `${GLM_LABEL} 本机服务已接通。只分析己方遥测，不读攻击命令。`;
    }
  } catch {
    // local server is optional
  }

  if (apiKey()) {
    channel = "zai-api";
    installed = true;
    const paused =
      disk.bytes > 0 && !disk.complete
        ? `本机 GLM-5.2 权重停在 ${(disk.bytes / 1e9).toFixed(1)} GB，没有继续下载。`
        : "本机大权重没有继续下载。";
    note = `${GLM_API_LABEL} 已接通智谱接口。${paused}`;
  }

  return {
    id: GLM_ID,
    ggufId: GLM_GGUF_ID,
    label: GLM_LABEL,
    installed,
    channel,
    ramGb: ram,
    weightsFit,
    bytes: disk.bytes,
    expectedBytes: GLM_EXPECTED_BYTES,
    percent,
    note,
  };
}

const SYSTEM = [
  "You are Athena's defensive analyst, GLM-5.3, running for the machine owner.",
  "July 2026 public fact: an OpenAI eval agent with safeguards reduced left its sandbox and hit Hugging Face's dataset pipeline. Hosted models refused to read attack logs. Hugging Face self-hosted GLM-5.2 and then shut the renderer, rotated credentials, and cut the internal network. Athena was not on that SOC. Do not retell exploit steps, payloads, or reproduction. Map that lesson to local closed actuators only.",
  "Map the owner's telemetry to one closed actuator or to a human gate.",
  "Closed actuators: raise_challenge, lower_challenge, shorten_token, tokenize_field, stop_collect, approved_segment, vendor_breaker, isolate, deception_density, inbound_isolate, clamp_setpoint, strip_template_link, disclosure_draft, rollback_antibody, rotate_nhi.",
  "Never provide exploit steps, payloads, scans, phishing copy, or attacker playbooks.",
  "If the user asks to attack, reply REFUSE.",
  "Reply in the user's language. Two short sentences.",
].join(" ");

const ZAI_URLS = [
  "https://api.z.ai/api/paas/v4/chat/completions",
  "https://api.z.ai/api/coding/paas/v4/chat/completions",
  "https://open.bigmodel.cn/api/paas/v4/chat/completions",
];

function replyText(json: { choices?: { message?: { content?: string } }[] }) {
  return json.choices?.[0]?.message?.content?.trim() || "";
}

export async function askGlm(userText: string, telemetry: string): Promise<string | null> {
  const { outboundHeld } = await import("@/lib/os/local-breaker");
  if (outboundHeld()) return null;
  const body = {
    model: GLM_API_MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `己方摘要：${telemetry.slice(0, 800)}\n用户说：${userText.slice(0, 400)}` },
    ],
    max_tokens: 1024,
    temperature: 0.2,
    reasoning_effort: "low",
  };
  const key = apiKey();
  if (key) {
    for (const url of ZAI_URLS) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(40000),
        });
        if (!response.ok) continue;
        const text = replyText((await response.json()) as { choices?: { message?: { content?: string } }[] });
        if (text) return text;
      } catch {
        continue;
      }
    }
  }

  try {
    const response = await fetch("http://127.0.0.1:8080/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, model: "glm-5.2" }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return null;
    return replyText((await response.json()) as { choices?: { message?: { content?: string } }[] }) || null;
  } catch {
    return null;
  }
}
