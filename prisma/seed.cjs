const { PrismaClient } = require('@prisma/client');
const { SURGICAL_PROCEDURES } = require('./surgical-procedures-data.cjs');

const prisma = new PrismaClient();

const DEFAULT_VIDEOS = [
  { id: 'default-video-tummy-tuck-mini', title: 'Tummy Tuck - Mini', file: 'Tummy Tuck - Mini.mp4', order: 0 },
  { id: 'default-video-tummy-tuck-full', title: 'Tummy Tuck - Full', file: 'Tummy Tuck - Full.mp4', order: 1 },
  { id: 'default-video-liposuction', title: 'Liposuction', file: 'Liposuction.mp4', order: 2 },
  { id: 'default-video-lip-augmentation', title: 'Lip Augmentation', file: 'Lip Augmentation.mp4', order: 3 },
];

const DEFAULT_IMAGES = [
  { id: 'default-image-liposuction-neck', title: 'Liposuction Neck', file: 'Liposuction Neck.png', order: 0 },
  { id: 'default-image-arm-lift', title: 'Arm Lift', file: 'Arm Lift.png', order: 1 },
  { id: 'default-image-liposuction-tummy', title: 'Liposuction Tummy', file: 'Liposuction Tummy.png', order: 2 },
  { id: 'default-image-lip-augmentation', title: 'Lip Augmentation', file: 'Lip Augmentation.png', order: 3 },
  { id: 'default-image-area-liposuction', title: 'Area Liposuction', file: 'Area Liposuction.jpg', order: 4 },
];

async function seedInstructionVideos() {
  console.log('📹 Seeding instruction videos...');

  for (const video of DEFAULT_VIDEOS) {
    const embedUrl = `/instructions/videos/${encodeURIComponent(video.file)}`;

    await prisma.instructionVideo.upsert({
      where: { id: video.id },
      update: {
        title: video.title,
        embedUrl,
        order: video.order,
        isCustom: false,
      },
      create: {
        id: video.id,
        title: video.title,
        embedUrl,
        order: video.order,
        isCustom: false,
      },
    });

    console.log(`  ✓ ${video.title}`);
  }
}

async function seedInstructionImages() {
  console.log('🖼️  Seeding instruction images...');

  for (const image of DEFAULT_IMAGES) {
    const imageUrl = `/instructions/images/${encodeURIComponent(image.file)}`;

    await prisma.instructionImage.upsert({
      where: { id: image.id },
      update: {
        title: image.title,
        imageUrl,
        order: image.order,
        isCustom: false,
      },
      create: {
        id: image.id,
        title: image.title,
        imageUrl,
        order: image.order,
        isCustom: false,
      },
    });

    console.log(`  ✓ ${image.title}`);
  }
}

async function seedSurgicalProcedures() {
  console.log('🏥 Seeding surgical procedure catalog...');

  for (const procedure of SURGICAL_PROCEDURES) {
    await prisma.surgicalProcedureCode.upsert({
      where: { code: procedure.code },
      update: {
        description: procedure.description,
        price: procedure.price,
        currency: procedure.currency,
        category: procedure.category,
        section: procedure.section,
        subSection: procedure.subSection,
        requirements: procedure.requirements,
        duration: procedure.duration,
      },
      create: {
        code: procedure.code,
        description: procedure.description,
        price: procedure.price,
        currency: procedure.currency,
        category: procedure.category,
        section: procedure.section,
        subSection: procedure.subSection,
        requirements: procedure.requirements,
        duration: procedure.duration,
      },
    });
    console.log(`  ✓ ${procedure.code} - ${procedure.description}`);
  }
}

async function main() {
  console.log('🌱 Starting database seeding...');
  await seedInstructionVideos();
  await seedInstructionImages();
  await seedSurgicalProcedures();
  console.log('✨ Database seeding completed.');
}

main()
  .catch((error) => {
    console.error('💥 Database seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
