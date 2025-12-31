"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const f_codes_1 = require("../src/data/dental-codes/f-codes");
const prisma = new client_1.PrismaClient();
async function importFCodes() {
    console.log('Starting F-codes import...');
    try {
        // Delete existing F codes
        await prisma.dentalCode.deleteMany({
            where: {
                code: {
                    startsWith: 'F'
                }
            }
        });
        // Import all F codes
        for (const code of f_codes_1.fCodes) {
            await prisma.dentalCode.create({
                data: {
                    code: code.code,
                    description: code.description,
                    points: code.points,
                    rate: code.rate ? Number(code.rate) : null,
                    category: code.requirements.category || 'ORTHODONTICS',
                    requirements: code.requirements,
                    section: 'F',
                    subSection: getSubSection(code.code),
                    patientType: getPatientType(code.code)
                }
            });
        }
        console.log('F-codes import completed successfully');
    }
    catch (error) {
        console.error('Error importing F-codes:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
function getSubSection(code) {
    var _a;
    // Extract subsection based on code pattern
    if (code === 'F_GENERAL_RULES')
        return 'GENERAL';
    const numericPart = (_a = code.match(/F(\d+)/)) === null || _a === void 0 ? void 0 : _a[1];
    if (!numericPart)
        return 'OTHER';
    const firstDigit = parseInt(numericPart[0]);
    switch (firstDigit) {
        case 1: return 'CONSULTATION';
        case 2: return 'DIAGNOSTICS';
        case 3: return 'TREATMENT_PLANNING';
        case 4: return 'BRACE_PLACEMENT';
        case 5: return 'MONTHLY_CONSULTATION';
        case 6: return 'DOCUMENTATION';
        case 7: return 'PROCEDURES';
        case 8: return 'REPAIRS';
        case 9: return 'INFORMATION';
        default: return 'OTHER';
    }
}
function getPatientType(code) {
    // Extract patient type based on code suffix
    if (code === 'F_GENERAL_RULES')
        return 'ALL';
    const suffix = code.slice(-1);
    switch (suffix) {
        case 'A': return 'REGULAR';
        case 'B': return 'SCHISIS';
        case 'C': return 'CLEFT';
        default: return 'ALL';
    }
}
importFCodes()
    .catch(console.error);
