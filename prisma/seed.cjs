const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

// Import dental codes from the data files
const dentalCodes = {
  ACodes: require('../dist/data/dental-codes/a-codes.js').ACodes,
  BCodes: require('../dist/data/dental-codes/b-codes.js').BCodes,
  cCodes: require('../dist/data/dental-codes/c-codes.js').cCodes,
  ECodes: require('../dist/data/dental-codes/e-codes.js').ECodes,
  fCodes: require('../dist/data/dental-codes/f-codes.js').fCodes,
  mCodes: require('../dist/data/dental-codes/m-codes.js').mCodes,
  G_CODES: require('../dist/data/dental-codes/g-codes.js').G_CODES,
  H_CODES: require('../dist/data/dental-codes/h-codes.js').H_CODES,
  jCodes: require('../dist/data/dental-codes/j-codes.js').jCodes,
  pCodes: require('../dist/data/dental-codes/p-codes.js').pCodes,
  R_CODES: require('../dist/data/dental-codes/r-codes.js').R_CODES,
  tCodes: require('../dist/data/dental-codes/t-codes.js').tCodes,
  uCodes: require('../dist/data/dental-codes/u-codes.js').uCodes,
  VCodes: require('../dist/data/dental-codes/v-codes.js').VCodes,
  yCodes: require('../dist/data/dental-codes/y-codes.js').yCodes,
  xCodes: require('../dist/data/dental-codes/x-codes.js').xCodes,
};

// Instruction videos data
const INSTRUCTION_VIDEOS = [
  {
    title: "How Braces Work",
    embedUrl: "https://www.youtube.com/embed/l2uQyBCmj9I",
    order: 1,
    isCustom: false,
  },
  {
    title: "Dry Socket",
    embedUrl: "https://www.youtube.com/embed/--qFp9nEV2s",
    order: 2,
    isCustom: false,
  },
  {
    title: "Wisdom Tooth Extraction",
    embedUrl: "https://www.youtube.com/embed/oBQYKYMyP9U",
    order: 3,
    isCustom: false,
  },
  {
    title: "Root Canal Treatment",
    embedUrl: "https://www.youtube.com/embed/UQH3GWsCmr8",
    order: 4,
    isCustom: false,
  },
  {
    title: "Dental Veneers",
    embedUrl: "https://www.youtube.com/embed/cQgpHufB-5k",
    order: 5,
    isCustom: false,
  },
  {
    title: "3D Printed Nightguards - Step by Step Tutorial",
    embedUrl: "https://www.youtube.com/embed/6wvwBK-iiwg",
    order: 6,
    isCustom: false,
  },
  {
    title: "Night Guard for Teeth - How It's Made and Fitted",
    embedUrl: "https://www.youtube.com/embed/R12FYIeKVyw",
    order: 7,
    isCustom: false,
  },
  {
    title: "Overdenture with Dental Implants (3D Animation)",
    embedUrl: "https://www.youtube.com/embed/vXL1ZGn7QVI",
    order: 8,
    isCustom: false,
  },
];

// Instruction images data
const INSTRUCTION_IMAGES = [
  {
    title: "Crowns",
    imageUrl: "https://www.dentalclinicdelhi.com/wp-content/uploads/2023/10/different-types-of-dental-crowns.jpg",
    order: 1,
    isCustom: false,
  },
  {
    title: "Implants",
    imageUrl: "https://qualitydentalcare.com.au/wp-content/uploads/2022/03/type-of-dental-implants-5-640x264.jpg",
    order: 2,
    isCustom: false,
  },
  {
    title: "Tooth Extraction",
    imageUrl: "https://my.clevelandclinic.org/-/scassets/images/org/health/articles/tooth-extraction",
    order: 3,
    isCustom: false,
  },
  {
    title: "Fillings",
    imageUrl: "https://ashforddentalcentre.com.sg/wp-content/uploads/2024/06/steps-of-dental-filling-singapore.jpg",
    order: 4,
    isCustom: false,
  },
  {
    title: "Braces",
    imageUrl: "https://www.amddentalclinic.com/static/assets/img/blogs/blog_mili18.png",
    order: 5,
    isCustom: false,
  },
  {
    title: "Dentures",
    imageUrl: "https://d3b3by4navws1f.cloudfront.net/shutterstock_387007633.jpg",
    order: 6,
    isCustom: false,
  },
  {
    title: "Partial Dentures",
    imageUrl: "https://www.kalonsandglidewell.com/wp-content/uploads/sites/2873/2014/05/VALPLAST3.jpg?v=3",
    order: 7,
    isCustom: false,
  },
  {
    title: "Frame Prosthesis",
    imageUrl: "https://www.dentallxs.nl/local/userfiles/frameprothesepartiele.jpg",
    order: 8,
    isCustom: false,
  },
  {
    title: "Splints",
    imageUrl: "https://alpine-biodental.ch/wp-content/uploads/cmd-schienen-1080x608.jpg",
    order: 9,
    isCustom: false,
  },
];

function parseRate(rate) {
  if (rate === undefined || rate === null) return null;
  if (typeof rate === 'number') return rate;
  if (typeof rate === 'string') {
    const numericRate = parseFloat(rate.replace(/[^0-9.-]+/g, ''));
    return isNaN(numericRate) ? null : numericRate;
  }
  return null;
}

function mapCodeToDbFormat(code) {
  const requirements = {
    category: code.requirements?.category || code.category || 'GENERAL',
    isTimeDependent: code.requirements?.isTimeDependent || code.isTimeDependent || false,
    perElement: code.requirements?.perElement || code.isPerElement || false,
    perJaw: code.requirements?.perJaw || false,
    jaw: code.requirements?.jaw || null,
    timeUnit: code.requirements?.timeUnit || null,
    minElements: code.requirements?.minElements || null,
    maxElements: code.requirements?.maxElements || null,
    includes: code.requirements?.includes || code.requirements?.includedServices || [],
    excludes: code.requirements?.excludes || [],
    applicableWith: code.requirements?.applicableWith || code.allowedCombinations || code.validWithCodes || [],
    incompatibleWith: code.requirements?.incompatibleWith || code.forbiddenCombinations || code.incompatibleCodes || [],
    mustCombineWithOthers: code.requirements?.mustCombineWithOthers || false,
    patientTypes: code.requirements?.patientTypes || [],
    patientAge: code.requirements?.patientAge || null,
    location: code.requirements?.location || null,
    braceCategory: code.requirements?.braceCategory || null,
    perMonth: code.requirements?.perMonth || false,
    consultationType: code.requirements?.consultationType || null,
    applianceType: code.requirements?.applianceType || null,
    hasElectronicChip: code.requirements?.hasElectronicChip || false,
    type: code.requirements?.type || null,
    generalRules: code.requirements?.generalRules || [],
    calendarMonth: code.requirements?.calendarMonth || null,
    materialCosts: code.requirements?.materialCosts || null,
    maxRates: code.requirements?.maxRates || null,
    notes: [...(code.requirements?.notes || []), ...(code.explanation ? [code.explanation] : [])],
    requiresTeethNumbers: code.requiresTeethNumbers || false,
    followUpCode: code.followUpCode || null,
    requiresTooth: code.requirements?.requiresTooth || code.requiresTooth || false,
    requiresJaw: code.requirements?.requiresJaw || code.requiresJaw || false,
    requiresSurface: code.requirements?.requiresSurface || code.requiresSurface || false
  };

  return {
    code: code.code,
    description: code.description,
    points: code.points || null,
    rate: parseRate(code.rate) || parseRate(code.tariff),
    category: requirements.category,
    requirements,
    section: code.section || code.code.charAt(0),
    subSection: code.subSection || 'GENERAL',
    patientType: code.patientType || 'ALL'
  };
}

async function seedDentalCodes() {
  console.log('🦷 Seeding dental codes...');

  let totalImported = 0;
  let totalFailed = 0;

  const codeSets = [
    { codes: dentalCodes.ACodes, section: 'A' },
    { codes: dentalCodes.BCodes, section: 'B' },
    { codes: dentalCodes.cCodes, section: 'C' },
    { codes: dentalCodes.ECodes, section: 'E' },
    { codes: dentalCodes.fCodes, section: 'F' },
    { codes: dentalCodes.mCodes, section: 'M' },
    { codes: dentalCodes.G_CODES, section: 'G' },
    { codes: dentalCodes.H_CODES, section: 'H' },
    { codes: dentalCodes.jCodes, section: 'J' },
    { codes: dentalCodes.pCodes, section: 'P' },
    { codes: dentalCodes.R_CODES, section: 'R' },
    { codes: dentalCodes.tCodes, section: 'T' },
    { codes: dentalCodes.uCodes, section: 'U' },
    { codes: dentalCodes.xCodes, section: 'X' },
    { codes: dentalCodes.VCodes, section: 'V' },
    { codes: dentalCodes.yCodes, section: 'Y' }
  ];

  for (const { codes, section } of codeSets) {
    if (!codes || !Array.isArray(codes)) {
      console.log(`⚠️  Skipping ${section}-codes: No data found`);
      continue;
    }

    console.log(`📋 Importing ${section}-codes (${codes.length} codes)...`);

    let sectionImported = 0;
    let sectionFailed = 0;

    for (const code of codes) {
      try {
        if (!code.code || !code.description) {
          sectionFailed++;
          continue;
        }

        const dbCode = mapCodeToDbFormat(code);
        await prisma.dentalCode.upsert({
          where: { code: dbCode.code },
          update: dbCode,
          create: dbCode
        });
        sectionImported++;
      } catch (error) {
        sectionFailed++;
        console.error(`❌ Failed to import ${code.code || 'UNKNOWN'}: ${error.message}`);
      }
    }

    console.log(`✅ ${section}-codes: ${sectionImported} imported, ${sectionFailed} failed`);
    totalImported += sectionImported;
    totalFailed += sectionFailed;
  }

  // Add special dental code for disabled teeth
  await prisma.dentalCode.upsert({
    where: { code: 'DISABLED' },
    update: {},
    create: {
      code: 'DISABLED',
      description: 'Tooth Disabled',
      points: 0,
      rate: 0,
      category: 'Special',
      requirements: {},
      section: 'Special',
      subSection: 'Disabled',
      patientType: 'All'
    }
  });

  console.log(`🎉 Dental codes seeding completed: ${totalImported} imported, ${totalFailed} failed`);
}

async function seedInstructionVideos() {
  console.log('🎬 Seeding instruction videos...');

  let imported = 0;
  let failed = 0;

  for (const video of INSTRUCTION_VIDEOS) {
    try {
      await prisma.instructionVideo.upsert({
        where: {
          title_embedUrl: {
            title: video.title,
            embedUrl: video.embedUrl
          }
        },
        update: video,
        create: video
      });
      imported++;
    } catch (error) {
      // If compound unique constraint doesn't exist, try with just embedUrl
      try {
        const existing = await prisma.instructionVideo.findFirst({
          where: { embedUrl: video.embedUrl }
        });

        if (existing) {
          await prisma.instructionVideo.update({
            where: { id: existing.id },
            data: video
          });
        } else {
          await prisma.instructionVideo.create({
            data: video
          });
        }
        imported++;
      } catch (error2) {
        failed++;
        console.error(`❌ Failed to import video "${video.title}": ${error2.message}`);
      }
    }
  }

  console.log(`✅ Instruction videos: ${imported} imported, ${failed} failed`);
}

async function seedInstructionImages() {
  console.log('🖼️  Seeding instruction images...');

  let imported = 0;
  let failed = 0;

  for (const image of INSTRUCTION_IMAGES) {
    try {
      await prisma.instructionImage.upsert({
        where: {
          title_imageUrl: {
            title: image.title,
            imageUrl: image.imageUrl
          }
        },
        update: image,
        create: image
      });
      imported++;
    } catch (error) {
      // If compound unique constraint doesn't exist, try with just imageUrl
      try {
        const existing = await prisma.instructionImage.findFirst({
          where: { imageUrl: image.imageUrl }
        });

        if (existing) {
          await prisma.instructionImage.update({
            where: { id: existing.id },
            data: image
          });
        } else {
          await prisma.instructionImage.create({
            data: image
          });
        }
        imported++;
      } catch (error2) {
        failed++;
        console.error(`❌ Failed to import image "${image.title}": ${error2.message}`);
      }
    }
  }

  console.log(`✅ Instruction images: ${imported} imported, ${failed} failed`);
}

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    await seedDentalCodes();
    await seedInstructionVideos();
    await seedInstructionImages();
    console.log('✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('💥 Database seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 