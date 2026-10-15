import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const [system, events] = await Promise.all([
    prisma.systemState.findUnique({ where: { id: 1 } }),
    prisma.auditEvent.findMany({ orderBy: { at: "asc" }, take: 500 }),
  ]);
  return NextResponse.json({
    product: "Athena",
    disclaimer:
      "这是本机 SQLite 里的演示账本，不是合规导出。没有签名、没有保留策略、没有 SIEM 投递。数据是虚构的。",
    exportedAt: new Date().toISOString(),
    catalogSize: system?.catalogSize ?? null,
    killSwitch: system?.killSwitch ?? null,
    events: events.map((event) => ({
      id: event.id,
      at: event.at.toISOString(),
      actor: event.actor,
      moduleSlug: event.moduleSlug,
      action: event.action,
      detail: event.detail,
    })),
  });
}
