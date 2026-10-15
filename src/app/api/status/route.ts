import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const [system, modules, proposals] = await Promise.all([
    prisma.systemState.findUnique({ where: { id: 1 } }),
    prisma.moduleState.findMany({ select: { id: true, name: true, status: true, phase: true } }),
    prisma.governanceProposal.findMany({ select: { id: true, status: true, merged: true, kind: true } }),
  ]);
  return NextResponse.json({
    killSwitch: system?.killSwitch,
    fitness: system?.fitness,
    tick: system?.tick,
    catalogSize: system?.catalogSize,
    attackerCost: system?.attackerCost,
    businessLoss: system?.businessLoss,
    physicalRisk: system?.physicalRisk,
    pendingGovernance: proposals.filter((item) => item.status === "pending").length,
    proposals,
    modules,
  });
}
