import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await ensureSeeded();
  const events = await prisma.auditEvent.findMany({ orderBy: { at: "desc" }, take: 200 });
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">审计账本</h1>
      <p className="text-sm text-stone-600">
        观察、推断、提案、评估、晋升、闸门、回滚和杀开关都写在这里。
        <a className="ml-2 underline" href="/api/audit/export">
          导出演示 JSON
        </a>
      </p>
      <ul className="space-y-2">
        {events.map((event) => (
          <li key={event.id} className="rounded border border-stone-300 bg-white px-3 py-2 text-sm">
            <div className="text-xs text-stone-500">
              {event.at.toISOString()} · {event.actor} · {event.moduleSlug} · {event.action}
            </div>
            <div>{event.detail}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
