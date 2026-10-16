import { PrismaClient } from "@prisma/client";
import { rankGuards } from "../src/lib/os/guard-rank";

async function main() {
  const prisma = new PrismaClient();
  const pin = await rankGuards(prisma, true);
  console.log(
    JSON.stringify(
      {
        activeId: pin.activeId,
        label: pin.label,
        score: pin.score,
        board: pin.board.map((row) => ({ id: row.id, score: row.score, loaded: row.loaded, note: row.note })),
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main();
