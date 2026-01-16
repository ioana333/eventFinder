import { PrismaClient } from "@prisma/client";

/**
 * Fix legacy DB rows where Event.startDate is NULL.
 *
 * Why this exists:
 * - Older DB snapshots / scripts may have inserted events without startDate.
 * - If your Prisma client was generated with startDate as non-nullable, ANY query
 *   that reads such a row will crash with:
 *   "Error converting field 'startDate' ... found incompatible value of 'null'".
 *
 * Run:
 *   npm run db:fix-startdates
 */

const prisma = new PrismaClient();

async function main() {
  // Use raw SQL so it works even if the generated client types mismatch.
  const updated = await prisma.$executeRawUnsafe(`
    UPDATE "Event"
    SET "startDate" = NOW()
    WHERE "startDate" IS NULL
  `);

  console.log(`Updated rows: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
