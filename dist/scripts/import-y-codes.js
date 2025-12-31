"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const y_codes_1 = require("../src/data/dental-codes/y-codes");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting Y-codes import...');
    for (const code of y_codes_1.yCodes) {
        await prisma.dentalCode.upsert({
            where: { code: code.code },
            update: {
                description: code.description,
                basePrice: typeof code.rate === 'number' ? code.rate : null,
                category: 'INFORMATION_SERVICES',
                requirements: code.requirements,
                isTimeDependent: code.requirements.isTimeDependent || false,
                timeUnit: code.requirements.timeUnit || null,
                validFrom: new Date(),
                validTo: null,
                technicalCosts: null,
                requiresJaw: false,
                requiresTooth: false,
                requiresSurface: false,
                isPerElement: false
            },
            create: {
                code: code.code,
                description: code.description,
                basePrice: typeof code.rate === 'number' ? code.rate : null,
                category: 'INFORMATION_SERVICES',
                requirements: code.requirements,
                isTimeDependent: code.requirements.isTimeDependent || false,
                timeUnit: code.requirements.timeUnit || null,
                validFrom: new Date(),
                validTo: null,
                technicalCosts: null,
                requiresJaw: false,
                requiresTooth: false,
                requiresSurface: false,
                isPerElement: false
            }
        });
    }
    console.log('Y-codes import completed successfully');
}
main()
    .catch((e) => {
    console.error('Error during Y-codes import:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
