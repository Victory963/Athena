import { execFile } from "child_process";
import path from "path";

export type OwnerFinding = { check: string; path: string };

function run(command: string, args: string[], cwd: string, timeoutMs: number): Promise<{ ok: boolean; text: string }> {
  return new Promise((resolve) => {
    execFile(command, args, { cwd, timeout: timeoutMs, windowsHide: true, maxBuffer: 800_000 }, (error, stdout, stderr) => {
      resolve({ ok: !error || Boolean(stdout), text: String(stdout || stderr || "") });
    });
  });
}

function cleanPath(file: string) {
  const rel = file.replace(/\\/g, "/");
  const idx = rel.toLowerCase().lastIndexOf("/src/");
  const cut = idx >= 0 ? rel.slice(idx + 1) : rel.split("/").slice(-3).join("/");
  return cut.replace(/^\.+/, "").slice(0, 80);
}

/** Read-only static review of this repo. No network scan. No exploit payload. */
export async function auditOwnerRepo(): Promise<{ ready: boolean; findings: OwnerFinding[]; note: string }> {
  const cwd = process.cwd();
  const probe = await run("semgrep", ["--version"], cwd, 4000);
  if (!probe.ok && !/semgrep/i.test(probe.text)) {
    return {
      ready: false,
      findings: [],
      note: "代码审计停在闸门。Semgrep 要人装到这台机器上。我不会自己加工具，也不会改成 Nmap 或 Fuzzing。",
    };
  }
  const result = await run(
    "semgrep",
    ["--config=p/typescript", "--json", "--quiet", "--timeout=8", "--max-target-bytes=400000", "src/lib/os", "src/app/api/bot"],
    cwd,
    25000,
  );
  const start = result.text.indexOf("{");
  const end = result.text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return { ready: true, findings: [], note: "Semgrep 在，这一轮没有可读的静态结果。" };
  }
  try {
    const json = JSON.parse(result.text.slice(start, end + 1)) as {
      results?: { check_id?: string; path?: string }[];
    };
    const findings = (json.results ?? [])
      .map((row) => ({
        check: String(row.check_id ?? "rule").slice(0, 80),
        path: cleanPath(String(row.path ?? "")).slice(0, 80),
      }))
      .filter((row) => row.path && !row.path.includes(".env") && !row.path.includes("node_modules"))
      .slice(0, 8);
    return {
      ready: true,
      findings,
      note: findings.length
        ? `本仓库静态规则命中 ${findings.length} 条。只报路径和规则名，不写利用。`
        : "本仓库这一轮没有静态规则命中。",
    };
  } catch {
    return { ready: true, findings: [], note: "Semgrep 输出读不出来。没有执行清单外的动作。" };
  }
}

export function auditSpeech(result: Awaited<ReturnType<typeof auditOwnerRepo>>) {
  const hits = result.findings.map((row) => `${row.path} · ${row.check}`).join("；");
  return `${result.note}${hits ? ` ${hits}。` : " "}动作仍从十五个已签名执行器里选。Nmap、Burp、Fuzzing 没有装。`;
}

export function auditRoot() {
  return path.basename(process.cwd());
}
