import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { tickSim } from "@/lib/os/engine";

export const dynamic = "force-dynamic";

export async function POST() {
  await ensureSeeded();
  const result = await tickSim(prisma);
  return NextResponse.json(result);
}
