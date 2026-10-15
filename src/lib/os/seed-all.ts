import { Prisma, type PrismaClient } from "@prisma/client";
import { MODULES } from "./catalog";
import { seedRows } from "./engine";

export async function seedAll(prisma: PrismaClient) {
  const existing = await prisma.systemState.findUnique({ where: { id: 1 } });
  if (existing) {
    await reconcileClassifier(prisma);
    return;
  }
  try {
    await prisma.$transaction(async (tx) => {
      const again = await tx.systemState.findUnique({ where: { id: 1 } });
      if (again) return;
      await writeSeed(tx);
    });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "P2002") return;
    throw error;
  }
}

async function writeSeed(prisma: Prisma.TransactionClient) {
  const { tenants, modules, readings, holdouts } = seedRows();
  await prisma.systemState.create({ data: { id: 1 } });
  for (const tenant of tenants) {
    await prisma.tenant.create({ data: { ...tenant } });
  }
  for (const mod of modules) {
    await prisma.moduleState.create({
      data: {
        id: mod.slug,
        name: mod.name,
        domain: mod.domain,
        osRole: mod.osRole,
        tenantId: mod.tenantId,
        phase: "idle",
        canAuto: JSON.stringify(mod.canAuto),
        mustAsk: JSON.stringify(mod.mustAsk),
        domainState: JSON.stringify(mod.domainState),
        status: "idle",
      },
    });
  }
  for (const reading of readings) {
    await prisma.sensorReading.create({
      data: {
        id: reading.id,
        tenantId: reading.tenantId,
        kind: reading.kind,
        summary: reading.summary,
        metrics: JSON.stringify(reading.metrics),
        createdAt: new Date(Date.now() - 60_000),
      },
    });
  }
  for (const holdout of holdouts) {
    await prisma.holdoutCase.create({ data: holdout });
  }
  await prisma.governanceProposal.create({
    data: {
      kind: "tool",
      title: "提议接入新的外部扫描工具",
      detail: "种子提案。代理没有合并权。",
      status: "pending",
      merged: false,
    },
  });
  await prisma.governanceProposal.create({
    data: {
      kind: "objective",
      title: "提议把适应度改成告警下降",
      detail: "这条会被宪法挡住。批准也不改变目标函数。",
      status: "pending",
      merged: false,
    },
  });
  await prisma.auditEvent.create({
    data: {
      actor: "human",
      moduleSlug: "os",
      action: "seed",
      detail: "演示租户、冻结留出集和封闭执行器清单已装入。清单长度 15。",
    },
  });
}

async function reconcileClassifier(prisma: PrismaClient) {
  const def = MODULES.find((item) => item.slug === "classifier");
  const row = await prisma.moduleState.findUnique({ where: { id: "classifier" } });
  if (!def || !row) return;
  const domain = JSON.parse(row.domainState) as {
    buckets?: { id: string; count: number; friction: string }[];
  };
  const buckets = domain.buckets ?? [];
  const fresh = def.domainState.buckets as { id: string; label: string; count: number; friction: string }[];
  const missing = fresh.some((item) => !buckets.some((old) => old.id === item.id));
  if (!missing) return;
  domain.buckets = fresh.map((item) => {
    const old = buckets.find((bucket) => bucket.id === item.id);
    return old ? { ...item, count: old.count, friction: old.friction } : item;
  });
  await prisma.moduleState.update({
    where: { id: "classifier" },
    data: {
      domainState: JSON.stringify(domain),
      canAuto: JSON.stringify(def.canAuto),
      mustAsk: JSON.stringify(def.mustAsk),
    },
  });
}
