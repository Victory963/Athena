import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { setKill } from "@/lib/os/engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json()) as { on?: boolean };
  await setKill(prisma, Boolean(body.on));
  const system = await prisma.systemState.findUnique({ where: { id: 1 } });
  return NextResponse.json({ killSwitch: system?.killSwitch, catalogSize: system?.catalogSize });
}
