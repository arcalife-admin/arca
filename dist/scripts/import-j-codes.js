"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const j_codes_1 = require("../src/data/dental-codes/j-codes");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting J-codes import...');
    for (const code of j_codes_1.jCodes) {
        await prisma.dentalCode.upsert({
            where: { code: code.code },
            update: {
                description: code.description,
                basePrice: code.rate,
                category: 'IMPLANTS',
                requirements: code.requirements,
                requiresJaw: code.requirements.perJaw || code.requirements.perJawHalf ||
                    code.requirements.upperJaw || code.requirements.lowerJaw ||
                    code.requirements.sameJaw,
                isPerElement: code.requirements.perImplant || code.requirements.perButton ||
                    (code.requirements.minElements !== undefined && code.requirements.maxElements !== undefined),
                validFrom: new Date(),
                validTo: null,
                technicalCosts: null,
                isTimeDependent: false,
                requiresTooth: false,
                requiresSurface: false,
                isFirstElement: code.code === 'J040' || code.code === 'J042' || code.code === 'J046' || code.code === 'J070'
            },
            create: {
                code: code.code,
                description: code.description,
                basePrice: code.rate,
                category: 'IMPLANTS',
                requirements: code.requirements,
                requiresJaw: code.requirements.perJaw || code.requirements.perJawHalf ||
                    code.requirements.upperJaw || code.requirements.lowerJaw ||
                    code.requirements.sameJaw,
                isPerElement: code.requirements.perImplant || code.requirements.perButton ||
                    (code.requirements.minElements !== undefined && code.requirements.maxElements !== undefined),
                validFrom: new Date(),
                validTo: null,
                technicalCosts: null,
                isTimeDependent: false,
                requiresTooth: false,
                requiresSurface: false,
                isFirstElement: code.code === 'J040' || code.code === 'J042' || code.code === 'J046' || code.code === 'J070'
            }
        });
    }
    console.log('J-codes import completed successfully');
}
main()
    .catch((e) => {
    console.error('Error during J-codes import:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
