"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const g_codes_1 = require("../src/data/dental-codes/g-codes");
const prisma = new client_1.PrismaClient();
async function importGCodes() {
    console.log('Starting import of G-codes (Jaw Treatment)...');
    try {
        // Delete existing G-codes
        await prisma.dentalCode.deleteMany({
            where: {
                code: {
                    startsWith: 'G'
                }
            }
        });
        console.log('Existing G-codes deleted.');
        // Import new G-codes
        const createdCodes = await prisma.dentalCode.createMany({
            data: g_codes_1.G_CODES.map(code => {
                var _a;
                return ({
                    code: code.code,
                    description: code.description,
                    basePrice: code.rate,
                    technicalCosts: null,
                    isTimeDependent: code.isTimeDependent || false,
                    timeUnit: null,
                    requiresTooth: false,
                    requiresJaw: code.code === 'G74' || code.code === 'G76',
                    requiresSurface: false,
                    maxSurfaces: null,
                    isPerElement: false,
                    isFirstElement: false,
                    followUpCode: code.code === 'G71' ? 'G72' : null,
                    category: 'G',
                    allowedCombinations: code.validWithCodes ? JSON.stringify(code.validWithCodes) : null,
                    forbiddenCombinations: code.incompatibleCodes ? JSON.stringify(code.incompatibleCodes) : null,
                    requirements: code.explanation ? JSON.stringify({
                        notes: [code.explanation],
                        conditions: [
                            ...(((_a = code.requirements) === null || _a === void 0 ? void 0 : _a.conditions) || [])
                        ],
                        includedServices: [
                            // Add specific included services based on the code
                            ...(code.code === 'G21' ? [
                                'Registration of complaint',
                                'Medical, dental and psychosocial anamnesis',
                                'Movement examination',
                                'Documentation of findings',
                                'Work diagnosis formulation'
                            ] : []),
                            ...(code.code === 'G22' ? [
                                'Dentoalveolar cause investigation',
                                'Complete DC-TMD as1 examination',
                                'DC-TMD as2 questionnaires',
                                'Medical consultation if needed',
                                'Diagnosis and treatment planning'
                            ] : []),
                            ...(code.code === 'G62' ? [
                                'Digital impressions',
                                'Bite registration',
                                'Splint placement',
                                'Minor corrections',
                                'Usage instructions'
                            ] : []),
                            ...(code.code === 'G71' ? [
                                'Digital impressions',
                                'Registration',
                                'Device placement',
                                'Minor corrections',
                                'Usage instructions',
                                'Two months aftercare'
                            ] : [])
                        ]
                    }) : null
                });
            })
        });
        console.log(`Successfully imported ${createdCodes.count} G-codes.`);
    }
    catch (error) {
        console.error('Error importing G-codes:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
// Run the import if this script is executed directly
if (require.main === module) {
    importGCodes()
        .then(() => console.log('G-codes import completed.'))
        .catch(error => {
        console.error('Failed to import G-codes:', error);
        process.exit(1);
    });
}
