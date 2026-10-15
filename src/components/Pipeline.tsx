export function Pipeline({
  status,
  observation,
  inference,
  proposal,
  evaluation,
  gateReason,
}: {
  status: string;
  observation: string;
  inference: string;
  proposal: string;
  evaluation: string;
  gateReason: string;
}) {
  const obs = JSON.parse(observation || "{}") as { readings?: { summary: string }[] };
  const inf = JSON.parse(inference || "{}") as { label?: string; controlFailed?: string };
  const prop = JSON.parse(proposal || "{}") as {
    label?: string;
    auto?: boolean;
    gateReason?: string;
    ignoredSignals?: string[];
    rejectedAlternative?: { actuator: string; reason: string } | null;
  };
  const ev = JSON.parse(evaluation || "{}") as {
    pass?: boolean;
    holdoutScore?: number;
    nextFitness?: number;
    reasons?: string[];
  };
  const steps = [
    {
      name: "观察",
      body: obs.readings?.length
        ? obs.readings.map((item) => item.summary).join(" / ")
        : "跑一轮后，这里只显示己方遥测摘要。",
    },
    {
      name: "推断",
      body: inf.label ? `${inf.label}。${inf.controlFailed ?? ""}` : "尚未从日志推断政策类。",
    },
    {
      name: "提案",
      body: prop.label
        ? `${prop.label}。${prop.auto ? "代理可以自动改" : "必须停下来问人"}${
            prop.rejectedAlternative ? `。被拒绝的对照：${prop.rejectedAlternative.reason}` : ""
          }${prop.ignoredSignals?.length ? `。忽略信号：${prop.ignoredSignals.join("、")}` : ""}`
        : "尚未提案。",
    },
    {
      name: "评估",
      body:
        ev.holdoutScore == null
          ? "冻结留出集还没打分。"
          : `留出集 ${ev.holdoutScore}，下一适应度 ${ev.nextFitness ?? "—"}。${ev.pass ? "通过" : "未通过"}。${(ev.reasons ?? []).join("；")}`,
    },
    {
      name: status === "rolled_back" ? "回滚" : status === "gated" || status === "killed" ? "闸门" : "晋升",
      body: gateReason || (status === "promoted" ? "已写入抗体记忆。" : "还没有晋升或闸门记录。"),
    },
  ];
  return (
    <ol className="grid gap-2 md:grid-cols-5">
      {steps.map((step) => (
        <li key={step.name} className="rounded border border-stone-300 bg-white p-3">
          <div className="text-xs font-semibold text-stone-500">{step.name}</div>
          <p className="mt-1 text-sm leading-5">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
