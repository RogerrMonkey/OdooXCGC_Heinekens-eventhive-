import prisma from "../lib/prisma";

async function main() {
  const organizer = await prisma.user.upsert({
    where: { email: "organizer@example.com" },
    update: {},
    create: { name: "Organizer", email: "organizer@example.com", role: "ORGANIZER" },
  });

  const event = await prisma.event.create({
    data: {
      organizerId: organizer.id,
      title: "Demo Event",
      description: "This is a test event",
      category: "workshop",
      location: "Mumbai",
      startAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      status: "PUBLISHED",
      ticketTypes: {
        create: [
          { name: "General", price: 300, maxQuantity: 100 },
          { name: "VIP", price: 1000, maxQuantity: 20 },
        ],
      },
    },
    include: { ticketTypes: true }
});

  console.log("Seed created:", event.id);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => {
  await prisma.$disconnect();
});
