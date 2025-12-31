const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const organizations = await prisma.organization.findMany();

  for (const org of organizations) {
    // 1. Ensure global chat exists for this org
    let globalChat = await prisma.chatRoom.findFirst({
      where: { organizationId: org.id, isGlobal: true },
    });
    if (!globalChat) {
      globalChat = await prisma.chatRoom.create({
        data: {
          name: org.name,
          type: 'GROUP',
          isGlobal: true,
          organizationId: org.id,
        },
      });
      console.log(`Created global chat for org: ${org.name}`);
    }

    // 2. Ensure every user is a participant
    const users = await prisma.user.findMany({
      where: { organizationId: org.id },
    });
    for (const user of users) {
      const isParticipant = await prisma.chatParticipant.findFirst({
        where: { chatRoomId: globalChat.id, userId: user.id },
      });
      if (!isParticipant) {
        await prisma.chatParticipant.create({
          data: {
            chatRoomId: globalChat.id,
            userId: user.id,
          },
        });
        console.log(`Added user ${user.name} to global chat for org: ${org.name}`);
      }
    }
  }
  console.log('Backfill complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
