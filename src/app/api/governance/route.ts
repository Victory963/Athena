import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { decideGovernance } from "@/lib/os/engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json()) as { id?: string; verdict?: string };
  if (!body.id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const verdict = body.verdict === "approved_by_human" ? "approved_by_human" : "rejected";
  await decideGovernance(prisma, body.id, verdict);
  const proposal = await prisma.governanceProposal.findUnique({ where: { id: body.id } });
  const system = await prisma.systemState.findUnique({ where: { id: 1 } });
  return NextResponse.json({
    status: proposal?.status,
    merged: proposal?.merged,
    catalogSize: system?.catalogSize,
  });
}
