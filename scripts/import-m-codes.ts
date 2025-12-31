import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mCodes = [
  {
    code: "M01",
    description: "Preventive guidance and/or instruction, per five minutes",
    category: "Preventive",
    section: "General",
    subSection: "General",
    patientType: "Adult",
    timeUnit: 5,
    requirements: {
      conditions: [
        "Time must be rounded to nearest 5 minutes",
        "Can be combined with C002 if preventive guidance takes more than 5 minutes"
      ],
      includes: [
        "Plaque coloring",
        "Recording plaque score",
        "Providing dietary advice",
        "Taking dietary history",
        "Providing guidance about breaking negative habit(s)",
        "Recording and analyzing QLF images with patient/parent(s)/caregiver(s)"
      ],
      excludes: [
        "Cannot be declared for myofunctional apparatus therapy (use G76 instead)"
      ]
    }
  },
  {
    code: "M02",
    description: "Prevention evaluation consultation, per five minutes",
    category: "Preventive",
    section: "General",
    subSection: "General",
    patientType: "Adult",
    timeUnit: 5,
    requirements: {
      conditions: [
        "Time must be rounded to nearest 5 minutes"
      ],
      includes: [
        "(Re)coloring of plaque",
        "(Re)recording plaque score",
        "Adjusting patient guidance based on previous instructions"
      ]
    }
  },
  {
    code: "M03",
    description: "Dental cleaning, per five minutes",
    category: "Preventive",
    section: "General",
    subSection: "General",
    patientType: "Adult",
    timeUnit: 5,
    requirements: {
      conditions: [
        "Time must be rounded to nearest 5 minutes"
      ],
      includes: [
        "Removing plaque or tartar",
        "Polishing teeth, molars, implants or prosthesis"
      ]
    }
  },
  {
    code: "M05",
    description: "Non-restorative caries treatment in primary dentition",
    category: "Preventive",
    section: "General",
    subSection: "General",
    patientType: "Adult",
    requirements: {
      includes: [
        "Grinding or making cavity accessible",
        "Treating carious dentin with caries-preserving agents",
        "Applying protective layer",
        "Fluoride treatment of milk tooth",
        "Recording and monitoring caries lesion",
        "Communication with or guidance of parents/caregivers"
      ],
      notes: [
        "Includes NRCT (Non-Restorative Cavity Treatment) and UCT (Ultra Conservative Treatment)",
        "Preventive measure to prevent further progression of caries"
      ]
    }
  },
  {
    code: "M30",
    description: "Treatment of sensitive tooth necks and preventive medication application",
    category: "Preventive",
    section: "General",
    subSection: "General",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Per element",
        "Maximum 5 elements with fluoride or chlorhexidine",
        "For more than 5 elements use M40"
      ],
      excludes: [
        "Not intended for caries detector",
        "Not for retraction cord/gel",
        "Not for hemostatic materials"
      ]
    }
  },
  {
    code: "M32",
    description: "Simple bacteriological or enzymatic test",
    category: "Preventive",
    section: "General",
    subSection: "General",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Can only be charged if test is performed in practice with patient present"
      ],
      includes: [
        "Taking simple plaque or saliva sample",
        "Interpreting bacteriological or enzymatic data"
      ]
    }
  },
  {
    code: "M40",
    description: "Fluoride treatment",
    category: "Preventive",
    section: "General",
    subSection: "General",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Per jaw",
        "Includes polishing",
        "For treating more than 5 elements with fluoride or chlorhexidine",
        "For 5 or fewer elements use M30"
      ]
    }
  },
  {
    code: "M61",
    description: "Mouthguard or fluoride tray",
    category: "Preventive",
    section: "General",
    subSection: "General",
    patientType: "Adult",
    requirements: {
      includes: [
        "Taking impressions and placement",
        "Including any needed lower jaw impression for occlusion fixation",
        "Including individually fitted mouthguards for sports activities"
      ]
    }
  },
  {
    code: "M80",
    description: "Treatment of white spots, first element",
    category: "Preventive",
    section: "General",
    subSection: "General",
    patientType: "Adult",
    followUpCode: "M81",
    requirements: {
      conditions: [
        "Per element",
        "Treatment of fluorosis or cariogenic spots using micro-invasive infiltration technique",
        "Including etching and finishing"
      ],
      notes: [
        "Material costs for invasive fluid can be charged separately as material and technical costs"
      ]
    }
  },
  {
    code: "M81",
    description: "Treatment of white spots, subsequent element",
    category: "Preventive",
    section: "General",
    subSection: "General",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Per element",
        "Treatment of fluorosis or cariogenic spots using micro-invasive infiltration technique",
        "Including etching and finishing"
      ],
      notes: [
        "Material costs for invasive fluid can be charged separately as material and technical costs"
      ]
    }
  }
];

async function importMCodes() {
  try {
    for (const code of mCodes) {
      await prisma.dentalCode.upsert({
        where: { code: code.code },
        update: code,
        create: code,
      });
    }
    console.log('Successfully imported M-codes');
  } catch (error) {
    console.error('Error importing M-codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importMCodes(); 