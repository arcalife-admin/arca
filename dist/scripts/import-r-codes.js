"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const r_codes_1 = require("../src/data/dental-codes/r-codes");
const prisma = new client_1.PrismaClient();
async function importRCodes() {
    console.log('Starting import of R-codes (Crowns and Bridges)...');
    try {
        // Delete existing R-codes
        await prisma.dentalCode.deleteMany({
            where: {
                code: {
                    startsWith: 'R'
                }
            }
        });
        console.log('Existing R-codes deleted.');
        // Import new R-codes
        const createdCodes = await prisma.dentalCode.createMany({
            data: r_codes_1.R_CODES.map(code => ({
                code: code.code,
                description: code.description,
                basePrice: code.rate,
                technicalCosts: null,
                isTimeDependent: false,
                timeUnit: null,
                requiresTooth: code.requiresTeethNumbers || false,
                requiresJaw: code.requiresJawSide || false,
                requiresSurface: code.requiresSurfaceNumbers || false,
                maxSurfaces: code.maxSurfaces || null,
                isPerElement: true,
                isFirstElement: code.code === 'R40' || code.code === 'R60' || code.code === 'R61',
                followUpCode: code.code === 'R40' ? 'R45' : (code.code === 'R60' || code.code === 'R61' ? 'R65' : null),
                category: 'R',
                allowedCombinations: code.validWithCodes ? JSON.stringify(code.validWithCodes) : null,
                forbiddenCombinations: code.incompatibleCodes ? JSON.stringify(code.incompatibleCodes) : null,
                requirements: code.explanation ? JSON.stringify({
                    notes: [code.explanation],
                    conditions: [
                        ...(code.requiresElements ? [`Requires exactly ${code.requiresElements} elements`] : []),
                        ...(code.maxElements ? [`Maximum ${code.maxElements} elements`] : []),
                        ...(code.minElements ? [`Minimum ${code.minElements} elements`] : []),
                        ...(code.requiresImplant ? ['Requires implant'] : []),
                        ...(code.isPontic ? ['Is pontic element'] : []),
                        ...(code.canBeUsedAsPontic ? ['Can be used as pontic'] : [])
                    ]
                }) : null
            }))
        });
        console.log(`Successfully imported ${createdCodes.count} R-codes.`);
    }
    catch (error) {
        console.error('Error importing R-codes:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
// Run the import if this script is executed directly
if (require.main === module) {
    importRCodes()
        .then(() => console.log('R-codes import completed.'))
        .catch(error => {
        console.error('Failed to import R-codes:', error);
        process.exit(1);
    });
}
