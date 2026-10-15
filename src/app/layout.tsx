import { MODULES } from "@/lib/os/catalog";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { killAction } from "./actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Athena · 有界自演化防守 OS",
  description: "Local defensive demo. Closed actuators, human gate, kill switch, synthetic data only.",
};

const STATUS: Record<string, string> = {
  idle: "待运行",
  promoted: "已晋升",
  gated: "等人",
  rejected: "未通过",
  killed: "已阻断",
  rolled_back: "已回滚",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await ensureSeeded();
  const [system, modules] = await Promise.all([
    prisma.systemState.findUnique({ where: { id: 1 } }),
    prisma.moduleState.findMany(),
  ]);
  const order = new Map(MODULES.map((item, index) => [item.slug, index]));
  const sorted = [...modules].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return (
    <html lang="zh-CN">
      <body className="font-sans">
        <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
          <aside className="border-b border-stone-300 bg-[#ebe6dc] md:min-h-screen md:border-b-0 md:border-r">
            <div className="px-4 py-4">
              <Link href="/" className="text-sm font-semibold tracking-wide">
                Athena
              </Link>
              <p className="mt-1 text-xs text-stone-600">有界自演化防守 OS · 封闭执行器 {system?.catalogSize ?? 15}</p>
            </div>
            <nav className="max-h-80 overflow-auto px-2 pb-4 md:max-h-none">
              <Link href="/overview" className="block rounded px-2 py-1.5 text-sm hover:bg-stone-200/70">
                概览
              </Link>
              <Link href="/architecture" className="block rounded px-2 py-1.5 text-sm hover:bg-stone-200/70">
                防守架构
              </Link>
              <Link href="/swot" className="block rounded px-2 py-1.5 text-sm hover:bg-stone-200/70">
                SWOT
              </Link>
              <Link href="/roadmap" className="block rounded px-2 py-1.5 text-sm hover:bg-stone-200/70">
                上市缺口
              </Link>
              {sorted.map((mod) => (
                <Link
                  key={mod.id}
                  href={`/modules/${mod.id}`}
                  className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-stone-200/70"
                >
                  <span className="truncate">{mod.name}</span>
                  <span className="shrink-0 text-[11px] text-stone-500">{STATUS[mod.status] ?? mod.status}</span>
                </Link>
              ))}
              <Link href="/audit" className="mt-2 block px-2 py-1.5 text-sm text-stone-700">
                审计账本
              </Link>
            </nav>
          </aside>
          <div>
            <header className="flex flex-wrap items-center gap-3 border-b border-stone-300 px-4 py-3 md:px-6">
              <div>
                <div className="text-xs text-stone-500">适应度 = 对手成本 − 业务损失 − 4×物理风险</div>
                <div className="text-lg font-semibold">{system?.fitness ?? "—"}</div>
              </div>
              <div className="text-xs text-stone-600">
                成本 {system?.attackerCost} · 业务 {system?.businessLoss}/{system?.businessBudget} · 物理{" "}
                {system?.physicalRisk}/{system?.physicalBudget}
              </div>
              <div className="text-xs text-stone-600">节拍 {system?.tick ?? 0}</div>
              <form action={killAction} className="ml-auto">
                <input type="hidden" name="on" value={system?.killSwitch ? "false" : "true"} />
                <button
                  className={`rounded px-3 py-1.5 text-sm font-medium text-white ${
                    system?.killSwitch ? "bg-stone-700" : "bg-red-700"
                  }`}
                >
                  {system?.killSwitch ? "松开杀开关" : "按下杀开关"}
                </button>
              </form>
            </header>
            {system?.killSwitch ? (
              <div className="bg-red-800 px-4 py-2 text-sm text-white md:px-6">
                杀开关已按下。节拍、晋升、回滚和闸门执行都会停止。开关不在被评估的模型里。
              </div>
            ) : null}
            <main className="px-4 py-6 md:px-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
