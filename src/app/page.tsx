import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { MODULES } from "@/lib/os/catalog";
import { governanceAction, tickAction } from "./actions";
import { Ticker } from "@/components/Ticker";

const STATUS: Record<string, string> = {
  idle: "待运行",
  promoted: "已晋升",
  gated: "等人",
  rejected: "未通过",
  killed: "已阻断",
  rolled_back: "已回滚",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeeded();
  const [system, modules, proposals, audits, antibodies] = await Promise.all([
    prisma.systemState.findUnique({ where: { id: 1 } }),
    prisma.moduleState.findMany(),
    prisma.governanceProposal.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.auditEvent.findMany({ orderBy: { at: "desc" }, take: 8 }),
    prisma.antibody.count({ where: { active: true } }),
  ]);
  const byId = new Map(modules.map((item) => [item.id, item]));

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Athena 控制面</h1>
        <p className="max-w-3xl text-sm leading-6 text-stone-700">
          二十二个模块共用一条演化环：观察己方遥测，推断政策类，从 15 个封闭执行器里提案，用冻结留出集评估，适应度上升且业务和物理回归在预算内才晋升。杀开关、新工具、新数据源和新目标不在这条环里。数据是虚构的。这不是上市公司披露。
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <form action={tickAction}>
            <button className="rounded bg-stone-900 px-3 py-1.5 text-white">推进一个节拍</button>
          </form>
          <Ticker />
          <span>活跃抗体 {antibodies}</span>
          <span>待决治理 {proposals.filter((item) => item.status === "pending").length}</span>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">操作系统内核</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.filter((item) => item.osRole === "kernel").map((item) => {
            const state = byId.get(item.slug);
            return (
              <Link key={item.slug} href={`/modules/${item.slug}`} className="rounded border border-stone-300 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">{item.name}</h3>
                  <span className="text-xs text-stone-500">{STATUS[state?.status ?? "idle"]}</span>
                </div>
                <p className="mt-2 text-sm text-stone-600">{item.scenario}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">接入的十五个产品</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.filter((item) => item.osRole === "product").map((item) => {
            const state = byId.get(item.slug);
            return (
              <Link key={item.slug} href={`/modules/${item.slug}`} className="rounded border border-stone-300 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">{item.name}</h3>
                  <span className="text-xs text-stone-500">{STATUS[state?.status ?? "idle"]}</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">{item.domain}</p>
                <p className="mt-2 text-sm text-stone-600">{item.scenario}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-semibold">待决治理</h2>
          <ul className="space-y-2">
            {proposals.map((item) => (
              <li key={item.id} className="rounded border border-stone-300 bg-white p-3 text-sm">
                <div className="font-medium">{item.title}</div>
                <p className="text-stone-600">
                  {item.kind} · {item.status} · 已合并 {item.merged ? "是" : "否"}
                </p>
                {item.status === "pending" ? (
                  <div className="mt-2 flex gap-2">
                    <form action={governanceAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="verdict" value="approved_by_human" />
                      <button className="rounded border border-stone-400 px-2 py-1">人批准但不合并</button>
                    </form>
                    <form action={governanceAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="verdict" value="rejected" />
                      <button className="rounded border border-stone-400 px-2 py-1">驳回</button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold">节拍与审计</h2>
          <ul className="space-y-2 text-sm">
            {audits.map((item) => (
              <li key={item.id} className="rounded border border-stone-200 bg-white px-3 py-2">
                <span className="text-stone-500">{item.actor}</span> · {item.moduleSlug} · {item.action}
                <div>{item.detail}</div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-stone-500">清单长度保持 {system?.catalogSize}。适应度当前 {system?.fitness}。</p>
        </div>
      </section>
    </div>
  );
}
