"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const u_codes_1 = require("../src/data/dental-codes/u-codes");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting U-codes import...');
    for (const code of u_codes_1.uCodes) {
        await prisma.dentalCode.upsert({
            where: { code: code.code },
            update: {
                description: code.description,
                basePrice: code.rate,
                category: 'SPECIAL_CARE',
                requirements: code.requirements,
                isTimeDependent: true,
                timeUnit: 5,
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
                basePrice: code.rate,
                category: 'SPECIAL_CARE',
                requirements: code.requirements,
                isTimeDependent: true,
                timeUnit: 5,
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
    console.log('U-codes import completed successfully');
}
main()
    .catch((e) => {
    console.error('Error during U-codes import:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
