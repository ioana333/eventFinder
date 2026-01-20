import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  const events = [
    { title: "Concert Rock", city: "Cluj", startDate: new Date("2025-12-05"), category: "Muzică", venue: "Form Space" },
    { title: "Stand-up", city: "București", startDate: new Date("2025-12-06"), category: "Comedie", venue: "Sala Gloria" },
    { title: "Târg de Crăciun", city: "Brașov", startDate: new Date("2025-12-07"), category: "Târg", venue: "Piața Sfatului" },
  ];
  await prisma.event.createMany({ data: events, skipDuplicates: true });
  console.log("Seed OK");
}
main().finally(() => prisma.$disconnect());
