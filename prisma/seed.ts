import { PrismaClient } from "@prisma/client";
import { seedAll } from "../src/lib/os/seed-all";

const prisma = new PrismaClient();

seedAll(prisma)
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
