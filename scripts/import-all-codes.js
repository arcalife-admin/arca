import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { ACodes } from '../dist/data/dental-codes/a-codes.js';
import { BCodes } from '../dist/data/dental-codes/b-codes.js';
import { cCodes } from '../dist/data/dental-codes/c-codes.js';
import { ECodes } from '../dist/data/dental-codes/e-codes.js';
import { fCodes } from '../dist/data/dental-codes/f-codes.js';
import { mCodes } from '../dist/data/dental-codes/m-codes.js';
import { G_CODES } from '../dist/data/dental-codes/g-codes.js';
import { H_CODES } from '../dist/data/dental-codes/h-codes.js';
import { jCodes } from '../dist/data/dental-codes/j-codes.js';
import { pCodes } from '../dist/data/dental-codes/p-codes.js';
import { R_CODES } from '../dist/data/dental-codes/r-codes.js';
import { tCodes } from '../dist/data/dental-codes/t-codes.js';
import { uCodes } from '../dist/data/dental-codes/u-codes.js';
import { VCodes } from '../dist/data/dental-codes/v-codes.js';
import { yCodes } from '../dist/data/dental-codes/y-codes.js';
import { xCodes } from '../dist/data/dental-codes/x-codes.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

function mapCodeToDbFormat(code) {
  // Handle both old and new format requirements
  const requirements = {
    category: code.requirements?.category || code.category || 'GENERAL',
    isTimeDependent: code.requirements?.isTimeDependent || code.isTimeDependent || false,
    perElement: code.requirements?.perElement || code.isPerElement || false,
    perJaw: code.requirements?.perJaw || false,
    jaw: code.requirements?.jaw || null,
    timeUnit: code.requirements?.timeUnit || null,
    minElements: code.requirements?.minElements || null,
    maxElements: code.requirements?.maxElements || null,
    includes: code.requirements?.includes || code.requirements?.includedServices || [],
    excludes: code.requirements?.excludes || [],
    applicableWith: code.requirements?.applicableWith || code.allowedCombinations || code.validWithCodes || [],
    incompatibleWith: code.requirements?.incompatibleWith || code.forbiddenCombinations || code.incompatibleCodes || [],
    mustCombineWithOthers: code.requirements?.mustCombineWithOthers || false,
    patientTypes: code.requirements?.patientTypes || [],
    patientAge: code.requirements?.patientAge || null,
    location: code.requirements?.location || null,
    braceCategory: code.requirements?.braceCategory || null,
    perMonth: code.requirements?.perMonth || false,
    consultationType: code.requirements?.consultationType || null,
    applianceType: code.requirements?.applianceType || null,
    hasElectronicChip: code.requirements?.hasElectronicChip || false,
    type: code.requirements?.type || null,
    generalRules: code.requirements?.generalRules || [],
    calendarMonth: code.requirements?.calendarMonth || null,
    materialCosts: code.requirements?.materialCosts || null,
    maxRates: code.requirements?.maxRates || null,
    notes: [...(code.requirements?.notes || []), ...(code.explanation ? [code.explanation] : [])],
    requiresTeethNumbers: code.requiresTeethNumbers || false,
    followUpCode: code.followUpCode || null,
    requiresTooth: code.requirements?.requiresTooth || code.requiresTooth || false,
    requiresJaw: code.requirements?.requiresJaw || code.requiresJaw || false,
    requiresSurface: code.requirements?.requiresSurface || code.requiresSurface || false
  };

  // Create a new object without the type-specific fields
  const { tariff, isTimeDependent, requiresTooth, requiresJaw, requiresSurface, isPerElement, isFirstElement, category, forbiddenCombinations, allowedCombinations, explanation, validWithCodes, incompatibleCodes, requiresTeethNumbers, followUpCode, requirements: oldRequirements, ...rest } = code;

  // Remove any fields that aren't in the Prisma schema
  const dbCode = {
    ...rest,
    rate: typeof code.rate === 'number' ? code.rate : typeof code.tariff === 'number' ? code.tariff : null,
    category: requirements.category,
    requirements,
    section: code.section || code.code.charAt(0),
    subSection: code.subSection || 'GENERAL',
    patientType: code.patientType || 'ALL'
  };

  // Only include fields that are in the Prisma schema
  const { code: codeId, description, points, rate, category: cat, requirements: reqs, section, subSection, patientType } = dbCode;
  return { code: codeId, description, points, rate, category: cat, requirements: reqs, section, subSection, patientType };
}

async function importCodes(codes, section) {
  console.log(`Starting ${section}-codes import...`);

  try {
    // Upsert codes instead of deleting to avoid foreign key constraints
    for (const code of codes) {
      const dbCode = mapCodeToDbFormat(code);
      await prisma.dentalCode.upsert({
        where: {
          code: dbCode.code
        },
        update: dbCode,
        create: dbCode
      });
    }

    console.log(`${section}-codes import completed successfully`);
  } catch (error) {
    console.error(`Error importing ${section}-codes:`, error);
    throw error;
  }
}

async function importAllCodes() {
  try {
    // Import all code sets in sequence
    await importCodes(ACodes, 'A');
    await importCodes(BCodes, 'B');
    await importCodes(cCodes, 'C');
    await importCodes(ECodes, 'E');
    await importCodes(fCodes, 'F');
    await importCodes(mCodes, 'M');
    await importCodes(G_CODES, 'G');
    await importCodes(H_CODES, 'H');
    await importCodes(jCodes, 'J');
    await importCodes(pCodes, 'P');
    await importCodes(R_CODES, 'R');
    await importCodes(tCodes, 'T');
    await importCodes(uCodes, 'U');
    await importCodes(xCodes, 'X');
    await importCodes(VCodes, 'V');
    await importCodes(yCodes, 'Y');

    console.log('All dental codes imported successfully!');
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importAllCodes()
  .catch(console.error); 