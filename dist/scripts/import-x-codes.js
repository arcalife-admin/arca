"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const xCodes = [
    {
        code: "X10",
        description: "Making and assessing small X-ray",
        basePrice: 21.24,
        category: "Radiology",
        isTimeDependent: false,
        requiresTooth: false,
        requiresJaw: false,
        requiresSurface: false,
        isPerElement: false,
        requirements: {
            conditions: ["Per image"]
        }
    },
    {
        code: "X11",
        description: "Assessing small X-ray",
        basePrice: 15.93,
        category: "Radiology",
        isTimeDependent: false,
        requiresTooth: false,
        requiresJaw: false,
        requiresSurface: false,
        isPerElement: false,
        requirements: {
            conditions: ["Cannot be charged by same dental care provider (practice) as X10"]
        }
    },
    {
        code: "X21",
        description: "Making and assessing jaw overview X-ray",
        basePrice: 91.04,
        category: "Radiology",
        isTimeDependent: false,
        requiresTooth: false,
        requiresJaw: true,
        requiresSurface: false,
        isPerElement: false,
        requirements: {
            conditions: ["Not for implantology in edentulous jaw (see X22)"]
        }
    },
    {
        code: "X22",
        description: "Making and assessing jaw overview X-ray for implantology in edentulous jaw",
        basePrice: 91.04,
        category: "Radiology",
        isTimeDependent: false,
        requiresTooth: false,
        requiresJaw: true,
        requiresSurface: false,
        isPerElement: false
    },
    {
        code: "X23",
        description: "Assessing jaw overview X-ray",
        basePrice: 33.38,
        category: "Radiology",
        isTimeDependent: false,
        requiresTooth: false,
        requiresJaw: true,
        requiresSurface: false,
        isPerElement: false,
        requirements: {
            conditions: [
                "For assessing jaw overview X-ray made with X21 or X22",
                "Cannot be charged by same dental care provider (practice) as X21 and X22"
            ]
        }
    },
    {
        code: "X24",
        description: "Making and assessing skull X-ray",
        basePrice: 40.97,
        category: "Radiology",
        isTimeDependent: false,
        requiresTooth: false,
        requiresJaw: false,
        requiresSurface: false,
        isPerElement: false
    },
    {
        code: "X34",
        description: "Assessing skull X-ray",
        basePrice: 30.35,
        category: "Radiology",
        isTimeDependent: false,
        requiresTooth: false,
        requiresJaw: false,
        requiresSurface: false,
        isPerElement: false,
        requirements: {
            conditions: ["Cannot be charged by same dental care provider (practice) as X24"]
        }
    },
    {
        code: "X25",
        description: "Making and assessing multidimensional jaw X-ray",
        basePrice: 257.94,
        category: "Radiology",
        isTimeDependent: false,
        requiresTooth: false,
        requiresJaw: true,
        requiresSurface: false,
        isPerElement: false,
        requirements: {
            conditions: [
                "Making and assessing a multidimensional jaw X-ray (e.g., with CT scanner)",
                "Only to be taken if such an image has added value compared to conventional X-ray diagnostics"
            ]
        }
    },
    {
        code: "X26",
        description: "Assessing multidimensional jaw X-ray",
        basePrice: 75.86,
        category: "Radiology",
        isTimeDependent: false,
        requiresTooth: false,
        requiresJaw: true,
        requiresSurface: false,
        isPerElement: false,
        requirements: {
            conditions: [
                "Assessing multidimensional jaw X-ray and discussing with patient",
                "Cannot be charged by same dental care provider (practice) as X25"
            ]
        }
    }
];
async function importXCodes() {
    try {
        for (const code of xCodes) {
            await prisma.dentalCode.upsert({
                where: { code: code.code },
                update: code,
                create: code,
            });
        }
        console.log('Successfully imported X-codes');
    }
    catch (error) {
        console.error('Error importing X-codes:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
importXCodes();
