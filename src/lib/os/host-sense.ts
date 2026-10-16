import { execFile } from "child_process";

export type HostSense = {
  consented: boolean;
  capturedAt: string;
  platform: string;
  hostname: string;
  processCount: number | null;
  listenCount: number | null;
  listeners: { port: number; local: string }[];
  memoryUsedPercent: number | null;
  diskFreeGb: number | null;
  meetingApps: string[];
  nodePresent: boolean;
  note: string;
};

const EMPTY: HostSense = {
  consented: false,
  capturedAt: new Date().toISOString(),
  platform: process.platform,
  hostname: "",
  processCount: null,
  listenCount: null,
  listeners: [],
  memoryUsedPercent: null,
  diskFreeGb: null,
  meetingApps: [],
  nodePresent: false,
  note: "未授权。Athena 不会在你按「看这台电脑」之前读取本机端口或进程名。",
};

function run(command: string, args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: timeoutMs, windowsHide: true, maxBuffer: 200_000 }, (error, stdout) => {
      if (error) reject(error);
      else resolve(String(stdout ?? ""));
    });
  });
}

function parseJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("[");
    const end = trimmed.lastIndexOf("]");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    return null;
  }
}

export async function senseHost(consented: boolean): Promise<HostSense> {
  if (!consented) return { ...EMPTY, capturedAt: new Date().toISOString() };

  const base: HostSense = {
    ...EMPTY,
    consented: true,
    capturedAt: new Date().toISOString(),
    hostname: "local",
    note: "只读进程数、监听端口、内存占用和 C 盘剩余空间。不读剪贴板、键盘、摄像头、磁盘文件或命令行参数。",
  };

  if (process.platform !== "win32") {
    return { ...base, note: `${base.note} 当前不是 Windows，跳过探测。` };
  }

  try {
    const script = [
      "$ErrorActionPreference='SilentlyContinue'",
      "$hn = $env:COMPUTERNAME",
      "$pc = (Get-Process | Measure-Object).Count",
      "$listen = @(Get-NetTCPConnection -State Listen | Select-Object -First 24 LocalAddress,LocalPort)",
      "$os = Get-CimInstance Win32_OperatingSystem",
      "$mem = if ($os.TotalVisibleMemorySize) { [int](($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) * 100 / $os.TotalVisibleMemorySize) } else { $null }",
      "$disk = Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='C:'\"",
      "$free = if ($disk) { [math]::Round($disk.FreeSpace/1GB,1) } else { $null }",
      "$apps = @('Zoom','Teams','ms-teams','Slack','Discord')",
      "$meet = @(Get-Process | Where-Object { $apps -contains $_.ProcessName } | Select-Object -ExpandProperty ProcessName -Unique)",
      "$node = [bool](Get-Process -Name node -ErrorAction SilentlyContinue)",
      "@{ hostname=$hn; processCount=$pc; node=$node; meet=$meet; memory=$mem; diskFreeGb=$free; listen=@($listen | ForEach-Object { @{ local=$_.LocalAddress; port=$_.LocalPort } }) } | ConvertTo-Json -Compress",
    ].join("; ");
    const raw = await run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], 8000);
    const parsed = parseJson(raw) as {
      hostname?: string;
      processCount?: number;
      node?: boolean;
      meet?: string[] | string;
      memory?: number | null;
      diskFreeGb?: number | null;
      listen?: { local?: string; port?: number }[];
    } | null;
    if (!parsed) return { ...base, note: `${base.note} 本机摘要解析失败，没有写入细节。` };
    const listeners = (parsed.listen ?? [])
      .map((item) => ({ local: String(item.local ?? ""), port: Number(item.port ?? 0) }))
      .filter((item) => item.port > 0 && item.port < 65536)
      .slice(0, 16);
    const meet = Array.isArray(parsed.meet) ? parsed.meet : parsed.meet ? [parsed.meet] : [];
    return {
      ...base,
      hostname: String(parsed.hostname ?? "local").slice(0, 64),
      processCount: Number(parsed.processCount ?? 0),
      listenCount: listeners.length,
      listeners,
      meetingApps: meet.map((name) => String(name).slice(0, 32)),
      nodePresent: Boolean(parsed.node),
      memoryUsedPercent: parsed.memory == null || Number.isNaN(Number(parsed.memory)) ? null : Number(parsed.memory),
      diskFreeGb: parsed.diskFreeGb == null || Number.isNaN(Number(parsed.diskFreeGb)) ? null : Number(parsed.diskFreeGb),
    };
  } catch {
    return { ...base, note: `${base.note} 本机探测超时或被拒绝，没有扩大权限。` };
  }
}

export function hostPolicyHint(sense: HostSense): string {
  if (!sense.consented) return "host_unauthorized";
  if (sense.meetingApps.length > 0) return "screen_share_adjacent";
  const publicListen = sense.listeners.filter((item) => item.local === "0.0.0.0" || item.local === "::").length;
  if (publicListen >= 8) return "wide_listen";
  return "host_quiet";
}
