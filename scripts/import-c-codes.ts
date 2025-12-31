import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cCodes = [
  {
    code: "C001",
    description: "Initial consultation for intake, including determining and discussing care goal",
    category: "Consultation",
    section: "C",
    subSection: "Consultation",
    patientType: "Adult",
    requirements: {
      conditions: [
        "First consultation for new patient",
        "Once per care provider for a (partially) dentate patient"
      ],
      includes: [
        "Creating patient card",
        "Registering dental status",
        "Medical history",
        "Discussing follow-up trajectory",
        "Determining and discussing care goal"
      ]
    }
  },
  {
    code: "C002",
    description: "Periodic check-up consultation",
    category: "Consultation",
    section: "C",
    subSection: "Consultation",
    patientType: "Adult",
    requirements: {
      conditions: [
        "General periodic oral examination",
        "Assessment of dentition and gums condition"
      ],
      includes: [
        "Examining dental health with PPS score",
        "Providing guidance and advice about preventive behavior (max 5 minutes)",
        "Performing small procedures not listed separately",
        "Referral to another care provider if needed"
      ]
    }
  },
  {
    code: "C003",
    description: "Consultation, not being a periodic check-up",
    category: "Consultation",
    section: "C",
    subSection: "Consultation",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Separate consultation based on patient complaint/question",
        "Follow-up consultation for previous issue",
        "Cannot be declared if problem stems from treatment by same provider in last 2 months",
        "Exception: can be declared after aftercare period for treatments including aftercare"
      ],
      includes: [
        "Examining dental health with PPS score",
        "Determining DETI score and discussing treatment plan",
        "Providing guidance about preventive behavior (max 5 minutes)"
      ]
    }
  },
  {
    code: "C010",
    description: "Additional medical history after (written) routine questions",
    category: "Diagnostic",
    section: "C",
    subSection: "Diagnostic",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Only applicable when additional medical information is needed after routine questions"
      ],
      includes: [
        "Discussion with patient",
        "Consultation with care provider (GP/specialist)"
      ]
    }
  },
  {
    code: "C011",
    description: "Extensive examination for second opinion",
    category: "Diagnostic",
    section: "C",
    subSection: "Diagnostic",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Regardless of number of sessions",
        "For forming opinion about diagnosis/treatment plan"
      ],
      includes: [
        "Consultation(s)",
        "Extensive non-routine examination",
        "Describing relevant deviations",
        "Written assessment",
        "Medical/dental/psychosocial history if needed",
        "Providing advice"
      ]
    }
  },
  {
    code: "C012",
    description: "Extensive examination for comprehensive treatment plan",
    category: "Diagnostic",
    section: "C",
    subSection: "Diagnostic",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Regardless of number of sessions",
        "Comprehensive oral examination"
      ],
      includes: [
        "Examination of hard dental tissues",
        "Examination of dental work",
        "Examination of soft oral tissues",
        "Written comprehensive treatment plan",
        "Medical/dental/psychosocial history if needed"
      ]
    }
  },
  {
    code: "C013",
    description: "Study models",
    category: "Diagnostic",
    section: "C",
    subSection: "Diagnostic",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Impression of upper and lower jaw",
        "Can be declared for treatment planning",
        "Can be declared for bite wear monitoring",
        "Can be declared for temporary mock-up"
      ]
    }
  },
  {
    code: "C014",
    description: "Pocket registration",
    category: "Diagnostic",
    section: "C",
    subSection: "Diagnostic",
    patientType: "Adult",
    requirements: {
      includes: [
        "Exploratory probing around all present teeth",
        "Recording pockets deeper than 3mm",
        "Recording bleeding tendency locations"
      ]
    }
  },
  {
    code: "C015",
    description: "Periodontal registration",
    category: "Diagnostic",
    section: "C",
    subSection: "Diagnostic",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Includes pocket registration (C014)"
      ],
      includes: [
        "Measuring probe depth/attachment loss",
        "Recording tooth mobility",
        "Recording furcation involvement",
        "Discussing gum health with patient"
      ]
    }
  },
  {
    code: "C016",
    description: "Making and discussing restorative test setup",
    category: "Diagnostic",
    section: "C",
    subSection: "Diagnostic",
    patientType: "Adult",
    requirements: {
      conditions: [
        "For analog or digital diagnostic test setup",
        "Only declarable for 4 or more elements",
        "Only for changing bite form",
        "Only following C012"
      ],
      includes: [
        "Digital visualization of intended result",
        "Study models",
        "Photos",
        "Bite registrations",
        "Discussion with patient"
      ]
    }
  },
  {
    code: "C020",
    description: "Home dental care surcharge",
    category: "Miscellaneous",
    section: "C",
    subSection: "Miscellaneous",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Once per home visit per patient",
        "Not applicable for mobile dental practice",
        "Not for more than two residents at same address on same day"
      ]
    }
  },
  {
    code: "C021",
    description: "Evening, night and weekend hours surcharge",
    category: "Miscellaneous",
    section: "C",
    subSection: "Miscellaneous",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Between 18:00 and 08:00",
        "Between 08:00 and 18:00 on Saturday/Sunday",
        "Between 08:00 and 18:00 on public holidays",
        "Must be combined with another service",
        "Not for regular practice hours"
      ]
    }
  },
  {
    code: "C022",
    description: "Element isolation using rubber dam",
    category: "Miscellaneous",
    section: "C",
    subSection: "Miscellaneous",
    patientType: "Adult",
    requirements: {
      conditions: [
        "Per rubber dam application",
        "Regardless of number of elements"
      ],
      allowedCombinations: [
        "E-chapter procedures",
        "V-chapter procedures",
        "R-chapter procedures",
        "M80 and M81"
      ]
    }
  },
  {
    code: "C023",
    description: "Special home dental care surcharge",
    category: "Miscellaneous",
    section: "C",
    subSection: "Miscellaneous",
    patientType: "Adult",
    requirements: {
      conditions: [
        "For collecting and packing necessary materials",
        "For home treatment setup",
        "Once per home visit per patient",
        "Not for mobile dental practice",
        "Not for more than two residents at same address",
        "Must be combined with specific procedures from V, E, H, P, or J chapters"
      ],
      includes: [
        "Assistant deployment if needed",
        "Installation at home",
        "Responsible disposal after treatment"
      ]
    }
  }
];

async function importCCodes() {
  try {
    for (const code of cCodes) {
      await prisma.dentalCode.upsert({
        where: { code: code.code },
        update: code,
        create: code,
      });
    }
    console.log('Successfully imported C-codes');
  } catch (error) {
    console.error('Error importing C-codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importCCodes(); 