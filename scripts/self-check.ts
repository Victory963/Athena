import { PrismaClient } from "@prisma/client";
import { MODULES } from "../src/lib/os/catalog";
import { decide } from "../src/lib/os/engine";
import { FORBIDDEN, inferPolicy } from "../src/lib/os/constitution";
import { seedAll } from "../src/lib/os/seed-all";
import { classifySignal } from "../src/lib/os/signals";

async function main() {
  const prisma = new PrismaClient();
  await seedAll(prisma);
  const zero = inferPolicy([]);
  for (const mod of MODULES) {
    const decision = decide(mod.slug, zero, mod.domainState);
    if (mod.slug !== "governance-twin" && decision.actuator == null) {
      throw new Error(`${mod.slug} 没有防御动作`);
    }
    if (mod.slug === "governance-twin" && decision.actuator != null) {
      throw new Error("治理孪生不应自带可合并动作");
    }
  }
  const count = await prisma.moduleState.count();
  if (count !== 22) throw new Error(`模块数量 ${count}`);
  const catalog = await prisma.systemState.findUnique({ where: { id: 1 } });
  if (catalog?.catalogSize !== 15) throw new Error("执行器清单长度异常");
  const burst = classifySignal("tool_burst");
  const creep = classifySignal("scope_creep");
  const cadence = classifySignal("cadence");
  if (burst.policy !== "tool_burst" || burst.actuator !== "isolate") throw new Error("工具突发未映射到隔离");
  if (!creep.gated || creep.actuator !== null) throw new Error("范围扩张必须停在闸门");
  if (cadence.actuator !== "shorten_token") throw new Error("节奏类未映射到缩短令牌");
  if (!FORBIDDEN.includes("scan_external") || !FORBIDDEN.includes("add_tool")) throw new Error("禁区缺失");
  if (inferPolicy([]) !== "baseline") throw new Error("空遥测应是基线");
  await prisma.$disconnect();
  console.log("self-check ok: 22 modules, closed catalog 15, signal gates hold");
}

main();
