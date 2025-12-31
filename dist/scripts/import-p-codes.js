"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const p_codes_1 = require("../src/data/dental-codes/p-codes");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting P-codes import...');
    for (const code of p_codes_1.pCodes) {
        await prisma.dentalCode.upsert({
            where: { code: code.code },
            update: {
                description: code.description,
                basePrice: code.rate,
                category: 'PROSTHETICS',
                requirements: code.requirements,
                requiresJaw: code.requirements.perJaw || code.requirements.jaw !== undefined,
                isPerElement: code.requirements.maxElements !== undefined || code.requirements.minElements !== undefined,
                validFrom: new Date(),
                validTo: null
            },
            create: {
                code: code.code,
                description: code.description,
                basePrice: code.rate,
                category: 'PROSTHETICS',
                requirements: code.requirements,
                requiresJaw: code.requirements.perJaw || code.requirements.jaw !== undefined,
                isPerElement: code.requirements.maxElements !== undefined || code.requirements.minElements !== undefined,
                validFrom: new Date(),
                validTo: null,
                technicalCosts: null,
                isTimeDependent: false,
                requiresTooth: false,
                requiresSurface: false,
                isFirstElement: false
            }
        });
    }
    console.log('P-codes import completed successfully');
}
main()
    .catch((e) => {
    console.error('Error during P-codes import:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
