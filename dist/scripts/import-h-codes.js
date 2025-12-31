"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const h_codes_1 = require("../src/data/dental-codes/h-codes");
const prisma = new client_1.PrismaClient();
async function importHCodes() {
    console.log('Starting import of H-codes (Surgical Procedures)...');
    try {
        // Delete existing H-codes
        await prisma.dentalCode.deleteMany({
            where: {
                code: {
                    startsWith: 'H'
                }
            }
        });
        console.log('Existing H-codes deleted.');
        // Import new H-codes
        const createdCodes = await prisma.dentalCode.createMany({
            data: h_codes_1.H_CODES.map(code => ({
                code: code.code,
                description: code.description,
                basePrice: code.rate,
                technicalCosts: code.code === 'H38' ? 150.00 : null, // Standard technical cost for autotransplant
                isTimeDependent: code.isTimeDependent || false,
                timeUnit: null,
                requiresTooth: code.requiresTeethNumbers || false,
                requiresJaw: code.requiresJaw || false,
                requiresSurface: false,
                maxSurfaces: null,
                isPerElement: true,
                isFirstElement: code.isFirstElement || false,
                followUpCode: code.followUpCode || null,
                category: 'H',
                allowedCombinations: code.validWithCodes ? JSON.stringify(code.validWithCodes) : null,
                forbiddenCombinations: code.incompatibleCodes ? JSON.stringify(code.incompatibleCodes) : null,
                requirements: code.explanation ? JSON.stringify({
                    notes: [code.explanation],
                    conditions: [
                        ...(code.maxRoots ? [`Maximum ${code.maxRoots} roots per element`] : []),
                        ...(code.requiresQuadrant ? ['Must be in same quadrant as previous extraction'] : [])
                    ],
                    includedServices: [
                        // Add specific included services based on the code
                        ...(code.code === 'H38' ? [
                            'Removal of receptor tooth/teeth if needed',
                            'Wound bed preparation',
                            'Transplantation and suturing',
                            'Anesthesia',
                            'Foramen mentale exposure if needed',
                            'Oral hygiene instructions',
                            'Two weeks post-operative care'
                        ] : []),
                        ...(code.code === 'H39' ? [
                            'Removal of receptor tooth/teeth if needed',
                            'Wound bed preparation',
                            'Transplantation and suturing',
                            'Anesthesia',
                            'Two weeks post-operative care'
                        ] : []),
                        ...(code.code === 'H36' ? [
                            'Complaint registration',
                            'Medical history taking',
                            'Prosthetic assessment',
                            'Documentation of findings'
                        ] : []),
                        ...(code.code === 'H37' ? [
                            'Extensive medical history',
                            'Bone measurements',
                            'Study model impressions if needed',
                            'Template/guide fabrication if needed',
                            'Treatment planning'
                        ] : [])
                    ]
                }) : null
            }))
        });
        console.log(`Successfully imported ${createdCodes.count} H-codes.`);
    }
    catch (error) {
        console.error('Error importing H-codes:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
// Run the import if this script is executed directly
if (require.main === module) {
    importHCodes()
        .then(() => console.log('H-codes import completed.'))
        .catch(error => {
        console.error('Failed to import H-codes:', error);
        process.exit(1);
    });
}
