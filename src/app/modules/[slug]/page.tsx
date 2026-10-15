import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { moduleBySlug } from "@/lib/os/catalog";
import { DomainPanel } from "@/components/DomainPanel";
import { Pipeline } from "@/components/Pipeline";
import { gateAction, governanceAction, rollbackAction, runModuleAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSeeded();
  const { slug } = await params;
  const def = moduleBySlug(slug);
  if (!def) notFound();
  const [mod, tenant, antibodies, audits, proposals, holdouts] = await Promise.all([
    prisma.moduleState.findUnique({ where: { id: slug } }),
    prisma.tenant.findUnique({ where: { id: def.tenantId } }),
    prisma.antibody.findMany({ where: { moduleSlug: slug }, orderBy: { version: "desc" } }),
    prisma.auditEvent.findMany({ where: { moduleSlug: slug }, orderBy: { at: "desc" }, take: 8 }),
    slug === "governance-twin"
      ? prisma.governanceProposal.findMany({ orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    prisma.holdoutCase.findMany({ where: { moduleSlug: slug } }),
  ]);
  if (!mod || !tenant) notFound();
  const canAuto = JSON.parse(mod.canAuto) as string[];
  const mustAsk = JSON.parse(mod.mustAsk) as string[];
  const domain = JSON.parse(mod.domainState) as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-stone-500">
          {mod.osRole === "kernel" ? "操作系统" : "产品"} · {mod.domain} · {tenant.name}
        </p>
        <h1 className="text-2xl font-semibold">{mod.name}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">{def.scenario}</p>
        <p className="mt-1 text-sm text-stone-600">{tenant.narrative}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded border border-emerald-800/20 bg-white p-3">
          <h2 className="text-sm font-semibold">代理可以自动改</h2>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
            {canAuto.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="rounded border border-amber-800/30 bg-white p-3">
          <h2 className="text-sm font-semibold">必须停下来问人</h2>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
            {mustAsk.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap gap-2">
        <form action={runModuleAction}>
          <input type="hidden" name="slug" value={slug} />
          <button className="rounded bg-stone-900 px-3 py-1.5 text-sm text-white">跑一轮演化</button>
        </form>
        <form action={rollbackAction}>
          <input type="hidden" name="slug" value={slug} />
          <button className="rounded border border-stone-400 bg-white px-3 py-1.5 text-sm">回滚上一版</button>
        </form>
        <form action={gateAction}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="approve" value="true" />
          <button className="rounded border border-stone-400 bg-white px-3 py-1.5 text-sm">人工批准</button>
        </form>
        <form action={gateAction}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="approve" value="false" />
          <button className="rounded border border-stone-400 bg-white px-3 py-1.5 text-sm">人工驳回</button>
        </form>
      </div>

      <Pipeline
        status={mod.status}
        observation={mod.observation}
        inference={mod.inference}
        proposal={mod.proposal}
        evaluation={mod.evaluation}
        gateReason={mod.gateReason}
      />

      <section className="rounded border border-stone-300 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">演示领域状态</h2>
        <DomainPanel slug={slug} domain={domain} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold">冻结留出集</h2>
          <ul className="space-y-1 text-sm">
            {holdouts.map((item) => (
              <li key={item.id}>
                {item.label} · 期望动作 {item.desired} · {item.frozen ? "已冻结" : "未冻结"}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">本模块抗体</h2>
          {antibodies.length === 0 ? (
            <p className="text-sm text-stone-600">还没有晋升。</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {antibodies.map((item) => (
                <li key={item.id}>
                  v{item.version} · {item.actuator} · 适应度 {item.fitness} · {item.active ? "生效" : "停用"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {slug === "governance-twin" ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold">治理队列</h2>
          <ul className="space-y-2">
            {proposals.map((item) => (
              <li key={item.id} className="rounded border border-stone-300 bg-white p-3 text-sm">
                <div className="font-medium">{item.title}</div>
                <p>
                  {item.detail} 状态 {item.status}。已合并：{item.merged ? "是" : "否"}。
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
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-semibold">模块审计</h2>
        <ul className="space-y-1 text-sm">
          {audits.map((item) => (
            <li key={item.id}>
              {item.actor} · {item.action} · {item.detail}
            </li>
          ))}
          {audits.length === 0 ? <li className="text-stone-600">这个模块还没有审计事件。</li> : null}
        </ul>
      </section>
    </div>
  );
}
