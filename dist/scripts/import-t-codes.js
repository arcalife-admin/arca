"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const t_codes_1 = require("../src/data/dental-codes/t-codes");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting T-codes import...');
    for (const code of t_codes_1.tCodes) {
        await prisma.dentalCode.upsert({
            where: { code: code.code },
            update: {
                description: code.description,
                basePrice: code.rate,
                category: 'PERIODONTAL',
                requirements: code.requirements,
                requiresJaw: false,
                isPerElement: code.requirements.perElement || code.requirements.singleElement ||
                    (code.requirements.minElements !== undefined && code.requirements.maxElements !== undefined),
                validFrom: new Date(),
                validTo: null,
                technicalCosts: null,
                isTimeDependent: false,
                requiresTooth: false,
                requiresSurface: false,
                isFirstElement: false
            },
            create: {
                code: code.code,
                description: code.description,
                basePrice: code.rate,
                category: 'PERIODONTAL',
                requirements: code.requirements,
                requiresJaw: false,
                isPerElement: code.requirements.perElement || code.requirements.singleElement ||
                    (code.requirements.minElements !== undefined && code.requirements.maxElements !== undefined),
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
    console.log('T-codes import completed successfully');
}
main()
    .catch((e) => {
    console.error('Error during T-codes import:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
