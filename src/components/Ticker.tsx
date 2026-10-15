"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function Ticker() {
  const router = useRouter();
  const [on, setOn] = useState(false);
  const [note, setNote] = useState("节拍停止");

  useEffect(() => {
    if (!on) return;
    const timer = setInterval(async () => {
      const response = await fetch("/api/tick", { method: "POST" });
      const body = (await response.json()) as { refused?: boolean; tick?: number; status?: string };
      setNote(body.refused ? `节拍 ${body.tick} 被杀开关拒绝` : `节拍 ${body.tick} · ${body.status ?? ""}`);
      router.refresh();
    }, 4000);
    return () => clearInterval(timer);
  }, [on, router]);

  return (
    <button
      type="button"
      onClick={() => setOn((value) => !value)}
      className="rounded border border-stone-400 bg-white px-3 py-1.5"
    >
      {on ? `连续节拍开 · ${note}` : "打开连续节拍"}
    </button>
  );
}
