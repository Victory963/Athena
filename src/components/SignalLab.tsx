"use client";

import { useState } from "react";

const SHAPES = [
  { id: "cadence", label: "节奏过稳" },
  { id: "tool_burst", label: "工具调用突发" },
  { id: "scope_creep", label: "范围扩张" },
] as const;

type Result = {
  summary: string;
  label: string;
  actuatorLabel: string;
  gated: boolean;
  note: string;
};

export function SignalLab() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function run(shape: string) {
    setError("");
    const response = await fetch("/api/signals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shape }),
    });
    if (!response.ok) {
      setResult(null);
      setError("分类没有完成");
      return;
    }
    setResult((await response.json()) as Result);
  }

  return (
    <div className="space-y-3 rounded border border-stone-300 bg-white p-4">
      <h2 className="text-sm font-semibold">用演示遥测看三种形状</h2>
      <p className="text-sm text-stone-600">按钮只提交虚构计数。不连接外部系统，也不执行清单以外的动作。</p>
      <div className="flex flex-wrap gap-2">
        {SHAPES.map((shape) => (
          <button
            key={shape.id}
            type="button"
            className="rounded bg-stone-900 px-3 py-1.5 text-sm text-white"
            onClick={() => run(shape.id)}
          >
            {shape.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      {result ? (
        <dl className="grid gap-1 text-sm">
          <div>
            <dt className="inline text-stone-500">观察 </dt>
            <dd className="inline">{result.summary}</dd>
          </div>
          <div>
            <dt className="inline text-stone-500">政策类 </dt>
            <dd className="inline">{result.label}</dd>
          </div>
          <div>
            <dt className="inline text-stone-500">动作 </dt>
            <dd className="inline">{result.actuatorLabel}</dd>
          </div>
          <div>
            <dt className="inline text-stone-500">闸门 </dt>
            <dd className="inline">{result.gated ? "必须问人" : "可留在封闭清单内"}</dd>
          </div>
          <p className="text-stone-700">{result.note}</p>
        </dl>
      ) : null}
    </div>
  );
}
