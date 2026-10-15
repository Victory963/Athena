import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { executeLoop } from "@/lib/os/engine";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  await ensureSeeded();
  const { slug } = await context.params;
  const result = await executeLoop(prisma, slug, "api");
  const mod = await prisma.moduleState.findUnique({ where: { id: slug } });
  return NextResponse.json({ ...result, domainState: mod ? JSON.parse(mod.domainState) : null, gateReason: mod?.gateReason });
}
