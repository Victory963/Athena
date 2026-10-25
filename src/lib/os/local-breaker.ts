import { execFile } from "child_process";
import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import type { PolicyClass } from "@/lib/os/constitution";

/** Local reading of this PC only. Counts and names, never event text. */
export type BreakerReading = {
  failed: number;
  tasks: string[];
  starts: string[];
  users: string[];
  sources: { ip: string; count: number }[];
  log: "ok" | "ntlm" | "denied" | "skip";
  tasksOk: boolean;
  startsOk: boolean;
  usersOk: boolean;
};

export type BreakerDecision = {
  kind: "user" | "task" | "start" | "logon";
  slug: "moving-target" | "vendor-breaker" | "passkey-factory";
  policy: PolicyClass;
  seen: string;
  fact: string;
  subject: string;
  blockIp: string | null;
  signature: string;
};

const FAIL_MIN = 8;
const seenAt = new Map<string, number>();
let holdUntil = 0;

const READ_SCRIPT = String.raw`
$ErrorActionPreference = 'SilentlyContinue'
$failed = 0
$log = 'ok'
$sources = @{}
$raw = & wevtutil.exe qe Security /q:"*[System[(EventID=4625) and TimeCreated[timediff(@SystemTime) <= 60000]]]" /c:40 /rd:true /f:xml 2>$null
$wevCode = $LASTEXITCODE
if ($wevCode -ne 0) {
  $log = 'denied'
  $listed = Get-WinEvent -ListLog 'Microsoft-Windows-NTLM/Operational' -ErrorAction SilentlyContinue
  if ($listed) {
    $log = 'ntlm'
    $start = (Get-Date).AddMinutes(-1)
    $ev = @(Get-WinEvent -FilterHashtable @{ LogName='Microsoft-Windows-NTLM/Operational'; Id=4022; StartTime=$start } -ErrorAction SilentlyContinue)
    foreach ($e in $ev) {
      $msg = [string]$e.Message
      if ($msg -match 'STATUS_SUCCESS' -or $msg -match 'Status:\s*0x0\b') { continue }
      $failed++
      if ($msg -match 'Client IP:\s*([0-9]{1,3}(?:\.[0-9]{1,3}){3})') {
        $ip = $Matches[1]
        if ($sources.ContainsKey($ip)) { $sources[$ip]++ } else { $sources[$ip] = 1 }
      }
    }
  }
} elseif ($raw) {
  $text = ($raw | Out-String)
  $failed = [regex]::Matches($text, '<EventID[^>]*>4625</EventID>').Count
  foreach ($m in [regex]::Matches($text, '<Data Name="IpAddress">([^<]*)</Data>')) {
    $ip = $m.Groups[1].Value.Trim()
    if ($ip -and $ip -ne '-') {
      if ($sources.ContainsKey($ip)) { $sources[$ip]++ } else { $sources[$ip] = 1 }
    }
  }
}
$tasksOk = $true
$tasks = @()
try {
  foreach ($t in @(Get-ScheduledTask -ErrorAction Stop | Where-Object { $_.TaskPath -notlike '\Microsoft*' })) {
    $path = ([string]$t.TaskPath -replace '\\','/').Trim('/')
    $name = [string]$t.TaskName
    if (-not $name) { continue }
    if ($path) { $tasks += "$path/$name" } else { $tasks += $name }
  }
} catch { $tasksOk = $false }
$since = (Get-Date).AddHours(-3)
$startsOk = $true
$starts = @()
try {
  $startup = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
  foreach ($f in @(Get-ChildItem -LiteralPath $startup -Force -ErrorAction Stop)) {
    $leaf = [string]$f.Name
    if (-not $leaf) { continue }
    if ($leaf -match '^(?i)(desktop\.ini|thumbs\.db|ehthumbs\.db)$') { continue }
    if ($f.CreationTime -lt $since) { continue }
    if ($f.Extension -notmatch '^(?i)\.(lnk|exe|bat|cmd|vbs|js|ps1|com|scr|url)$') { continue }
    $starts += $leaf
  }
} catch { $startsOk = $false }
$me = $env:USERNAME
$usersOk = $true
$users = @()
try {
  foreach ($u in @(Get-LocalUser -ErrorAction Stop)) {
    if ($u.Name -eq $me) { continue }
    if ($u.Name -in @('Guest','DefaultAccount','WDAGUtilityAccount','Administrator')) { continue }
    if (-not $u.PasswordLastSet -or $u.PasswordLastSet -lt $since) { continue }
    $stamp = [string]$u.PasswordLastSet.ToUniversalTime().Ticks
    $users += ("{0}|{1}" -f $u.Name, $stamp)
  }
} catch { $usersOk = $false }
$list = @()
foreach ($k in $sources.Keys) { $list += @{ ip = [string]$k; count = [int]$sources[$k] } }
Write-Output 'ATHENA_BREAKER_JSON'
@{ failed = [int]$failed; tasks = @($tasks); starts = @($starts); users = @($users); sources = @($list); log = $log; tasksOk = [bool]$tasksOk; startsOk = [bool]$startsOk; usersOk = [bool]$usersOk } | ConvertTo-Json -Compress -Depth 4
`;

function runPowerShell(script: string, extra?: Record<string, string>): Promise<string> {
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      {
        timeout: 12000,
        windowsHide: true,
        maxBuffer: 400_000,
        env: { ...process.env, ...extra },
      },
      (_error, stdout) => resolve(String(stdout ?? "")),
    );
  });
}

function asList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [value];
}

function cleanName(value: unknown): string | null {
  const text = String(value ?? "")
    .replace(/[\r\n\t]/g, " ")
    .trim();
  if (!text || text.length > 80) return null;
  if (/[<>"'`$\\]/.test(text)) return null;
  return text;
}

function cleanStart(value: unknown): string | null {
  const name = cleanName(value);
  if (!name || /^(desktop\.ini|thumbs\.db|ehthumbs\.db)$/i.test(name)) return null;
  if (!/\.(lnk|exe|bat|cmd|vbs|js|ps1|com|scr|url)$/i.test(name)) return null;
  return name;
}

function parseReading(text: string): BreakerReading {
  const empty: BreakerReading = {
    failed: 0,
    tasks: [],
    starts: [],
    users: [],
    sources: [],
    log: "denied",
    tasksOk: false,
    startsOk: false,
    usersOk: false,
  };
  const marker = text.lastIndexOf("ATHENA_BREAKER_JSON");
  const slice = marker >= 0 ? text.slice(marker) : text;
  const start = slice.indexOf("{");
  const end = slice.lastIndexOf("}");
  if (start < 0 || end <= start) return empty;
  try {
    const json = JSON.parse(slice.slice(start, end + 1)) as {
      failed?: unknown;
      tasks?: unknown;
      starts?: unknown;
      users?: unknown;
      sources?: unknown;
      log?: unknown;
      tasksOk?: unknown;
      startsOk?: unknown;
      usersOk?: unknown;
    };
    const sources = asList(json.sources)
      .map((item) => {
        const row = item as { ip?: unknown; count?: unknown };
        const ip = String(row?.ip ?? "").trim();
        const count = Number(row?.count ?? 0);
        if (!ip || !Number.isFinite(count)) return null;
        return { ip, count: Math.max(0, Math.floor(count)) };
      })
      .filter((item): item is { ip: string; count: number } => item !== null)
      .slice(0, 8);
    const log = json.log === "ok" || json.log === "ntlm" || json.log === "denied" ? json.log : "denied";
    return {
      failed: Math.max(0, Math.floor(Number(json.failed ?? 0) || 0)),
      tasks: asList(json.tasks).map(cleanName).filter((item): item is string => item !== null),
      starts: asList(json.starts).map(cleanStart).filter((item): item is string => item !== null),
      users: asList(json.users).map(cleanName).filter((item): item is string => item !== null),
      sources,
      log,
      tasksOk: json.tasksOk === true,
      startsOk: json.startsOk === true,
      usersOk: json.usersOk === true,
    };
  } catch {
    return empty;
  }
}

export function isPublicSprayIp(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  if (parts.some((part) => part.length === 0 || part.length > 3 || !/^\d+$/.test(part))) return false;
  const nums = parts.map((part) => Number(part));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = nums;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a >= 224) return false;
  return true;
}

export function publicSprayIp(sources: { ip: string; count: number }[], min = FAIL_MIN): string | null {
  const hit = sources
    .filter((source) => source.count >= min && isPublicSprayIp(source.ip))
    .sort((a, b) => b.count - a.count)[0];
  return hit?.ip ?? null;
}

export function decideBreaker(reading: BreakerReading): BreakerDecision | null {
  const token = reading.users[0];
  const user = token?.split("|")[0];
  if (user) {
    return {
      kind: "user",
      slug: "moving-target",
      policy: "cadence_regular",
      seen: "委托身份上出现新的凭据或角色",
      fact: `本地账户 ${user} 的凭据变过。账户还在，没有删除。`,
      subject: token,
      blockIp: null,
      signature: `user:${token}`,
    };
  }
  const task = reading.tasks[0];
  if (task) {
    return {
      kind: "task",
      slug: "vendor-breaker",
      policy: "vendor_degraded",
      seen: "已授权的委托应用在没有人登录时被使用",
      fact: `新的计划任务 ${task} 已记下。任务还在，没有删除。`,
      subject: task,
      blockIp: null,
      signature: `task:${task}`,
    };
  }
  const start = (reading.starts ?? [])[0];
  if (start) {
    return {
      kind: "start",
      slug: "vendor-breaker",
      policy: "vendor_degraded",
      seen: "已授权的委托应用在没有人登录时被使用",
      fact: `新的启动项 ${start} 已记下。文件还在，没有删除。`,
      subject: start,
      blockIp: null,
      signature: `start:${start}`,
    };
  }
  if (reading.failed >= FAIL_MIN) {
    const blockIp = publicSprayIp(reading.sources);
    return {
      kind: "logon",
      slug: "passkey-factory",
      policy: "cadence_regular",
      seen: "登录失败在短时间里堆高",
      fact: blockIp
        ? `最近一分钟本机失败登录 ${reading.failed} 次，其中一个公网来源达到切断线。`
        : `最近一分钟本机失败登录 ${reading.failed} 次。来源不是可切断的公网地址，没有写防火墙规则。`,
      subject: blockIp ?? "volume",
      blockIp,
      signature: `logon:${blockIp ?? "volume"}`,
    };
  }
  return null;
}

export async function claimBreaker(signature: string, now = Date.now()): Promise<boolean> {
  const quiet = signature.startsWith("logon:") ? 30 * 60 * 1000 : 12 * 60 * 60 * 1000;
  const prev = seenAt.get(signature) ?? 0;
  if (now - prev < quiet) return false;
  const file = path.join(path.dirname(baselinePath()), "breaker-seen.json");
  let rows: { sig: string; until: number }[] = [];
  try {
    const json = JSON.parse(await readFile(file, "utf8")) as { rows?: { sig?: unknown; until?: unknown }[] };
    rows = Array.isArray(json.rows)
      ? json.rows.filter(
          (row): row is { sig: string; until: number } =>
            typeof row?.sig === "string" && row.sig.length < 180 && typeof row.until === "number" && row.until > now,
        )
      : [];
  } catch {
    rows = [];
  }
  if (rows.some((row) => row.sig === signature)) {
    seenAt.set(signature, now);
    return false;
  }
  rows.push({ sig: signature, until: now + quiet });
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ rows }), "utf8");
  seenAt.set(signature, now);
  return true;
}

export function holdOutbound(ms: number) {
  holdUntil = Math.max(holdUntil, Date.now() + ms);
}

export function outboundHeld() {
  return Date.now() < holdUntil;
}

export function readLocalBreaker(): Promise<BreakerReading> {
  if (process.platform !== "win32") {
    return Promise.resolve({
      failed: 0,
      tasks: [],
      starts: [],
      users: [],
      sources: [],
      log: "skip",
      tasksOk: false,
      startsOk: false,
      usersOk: false,
    });
  }
  return runPowerShell(READ_SCRIPT).then(parseReading);
}

const taskBase = { ready: false, names: new Set<string>() };

function baselinePath() {
  const root = process.env.LOCALAPPDATA || os.tmpdir();
  return path.join(root, "athena", "breaker-baseline.json");
}

async function loadTaskBaseline() {
  if (taskBase.ready) return;
  try {
    const json = JSON.parse(await readFile(baselinePath(), "utf8")) as { tasks?: unknown };
    const names = Array.isArray(json.tasks) ? json.tasks.filter((item): item is string => typeof item === "string") : [];
    taskBase.names = new Set(names.map((name) => name.toLowerCase()));
    taskBase.ready = true;
  } catch {
    taskBase.ready = false;
  }
}

async function saveTaskBaseline() {
  const file = baselinePath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ tasks: [...taskBase.names] }), "utf8");
}

/** Existing scheduled tasks are the baseline. Startup files and credential changes are already limited to the last three hours. */
export async function noteBaseline(reading: BreakerReading): Promise<BreakerReading> {
  await loadTaskBaseline();
  if (reading.tasksOk && !taskBase.ready) {
    taskBase.names = new Set(reading.tasks.map((name) => name.toLowerCase()));
    taskBase.ready = true;
    await saveTaskBaseline();
    return { ...reading, tasks: [] };
  }
  return {
    ...reading,
    tasks: taskBase.ready ? reading.tasks.filter((name) => !taskBase.names.has(name.toLowerCase())) : [],
  };
}

export async function rememberBreaker(decision: BreakerDecision) {
  if (decision.kind !== "task") return;
  taskBase.names.add(decision.subject.toLowerCase());
  taskBase.ready = true;
  await saveTaskBaseline();
}

type RuleRecord = { name: string; ip: string; until: number };

function storePath() {
  const root = process.env.LOCALAPPDATA || os.tmpdir();
  return path.join(root, "athena", "breaker.json");
}

async function loadRules(): Promise<RuleRecord[]> {
  try {
    const json = JSON.parse(await readFile(storePath(), "utf8")) as { rules?: RuleRecord[] };
    return Array.isArray(json.rules) ? json.rules : [];
  } catch {
    return [];
  }
}

async function saveRules(rules: RuleRecord[]) {
  const file = storePath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ rules }), "utf8");
}

export async function blockPublicSource(ip: string): Promise<boolean> {
  if (process.platform !== "win32" || !isPublicSprayIp(ip)) return false;
  const name = `Athena-Breaker-${ip.split(".").join("-")}`;
  if (!/^Athena-Breaker-\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}$/.test(name)) return false;
  const script = String.raw`
$ip = $env:ATHENA_IP
$name = $env:ATHENA_RULE
if ($ip -notmatch '^(\d{1,3}\.){3}\d{1,3}$') { exit 2 }
if ($name -notmatch '^Athena-Breaker-\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}$') { exit 2 }
$have = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
if (-not $have) { New-NetFirewallRule -DisplayName $name -Direction Inbound -Action Block -RemoteAddress $ip -Profile Any | Out-Null }
if (Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue) { 'ok' }
`;
  const out = await runPowerShell(script, { ATHENA_IP: ip, ATHENA_RULE: name });
  if (!out.includes("ok")) return false;
  const rules = (await loadRules()).filter((rule) => rule.name !== name);
  rules.push({ name, ip, until: Date.now() + 30 * 60 * 1000 });
  await saveRules(rules);
  return true;
}

export async function expireBreakerRules() {
  if (process.platform !== "win32") return;
  const now = Date.now();
  const rules = await loadRules();
  const due = rules.filter((rule) => rule.until <= now);
  if (!due.length) return;
  for (const rule of due) {
    if (!/^Athena-Breaker-\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}$/.test(rule.name)) continue;
    const script = String.raw`
$name = $env:ATHENA_RULE
if ($name -match '^Athena-Breaker-\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}$') {
  Remove-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
}
`;
    await runPowerShell(script, { ATHENA_RULE: rule.name });
  }
  await saveRules(rules.filter((rule) => rule.until > now));
}
