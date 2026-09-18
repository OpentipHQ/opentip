import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
await p.indexerState.update({
  where: { id: "singleton" },
  data: { last_block: 46939256 },
});
await p.tip.deleteMany();
console.log("Reset last_block to 46939256 and cleared all tips");
await p.$disconnect();
