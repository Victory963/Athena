import { prisma } from "./prisma";
import { seedAll } from "./os/seed-all";

export async function ensureSeeded() {
  await seedAll(prisma);
}
