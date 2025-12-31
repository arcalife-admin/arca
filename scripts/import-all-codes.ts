import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import all code sets
import { ACodes } from '../src/data/dental-codes/a-codes.js';
import { BCodes } from '../src/data/dental-codes/b-codes.js';
import { cCodes } from '../src/data/dental-codes/c-codes.js';
import { ECodes } from '../src/data/dental-codes/e-codes.js';
import { fCodes } from '../src/data/dental-codes/f-codes.js';
import { mCodes } from '../src/data/dental-codes/m-codes.js';
import { G_CODES } from '../src/data/dental-codes/g-codes.js';
import { H_CODES } from '../src/data/dental-codes/h-codes.js';
import { jCodes } from '../src/data/dental-codes/j-codes.js';
import { pCodes } from '../src/data/dental-codes/p-codes.js';
import { R_CODES } from '../src/data/dental-codes/r-codes.js';
import { tCodes } from '../src/data/dental-codes/t-codes.js';
import { uCodes } from '../src/data/dental-codes/u-codes.js';
import { VCodes } from '../src/data/dental-codes/v-codes.js';
import { yCodes } from '../src/data/dental-codes/y-codes.js';
import { xCodes } from '../src/data/dental-codes/x-codes.js';

const prisma = new PrismaClient();

interface ImportStats {
  section: string;
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ code: string; error: string }>;
}

function validateCode(code: any): { isValid: boolean; error?: string } {
  if (!code.code) return { isValid: false, error: 'Missing code' };
  if (!code.description) return { isValid: false, error: 'Missing description' };

  // Validate rate/tariff format
  const rate = code.rate ?? code.tariff;
  if (rate !== undefined && rate !== null) {
    if (typeof rate === 'string') {
      const numericRate = parseFloat(rate.replace(/[^0-9.-]+/g, ''));
      if (isNaN(numericRate)) {
        return { isValid: false, error: `Invalid rate format: ${rate}` };
      }
    } else if (typeof rate !== 'number') {
      return { isValid: false, error: `Invalid rate type: ${typeof rate}` };
    }
  }

  return { isValid: true };
}

function parseRate(rate: any): number | null {
  if (rate === undefined || rate === null) return null;
  if (typeof rate === 'number') return rate;
  if (typeof rate === 'string') {
    // Remove any non-numeric characters except decimal point and minus
    const numericRate = parseFloat(rate.replace(/[^0-9.-]+/g, ''));
    return isNaN(numericRate) ? null : numericRate;
  }
  return null;
}

function mapCodeToDbFormat(code: any) {
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
    rate: parseRate(code.rate) ?? parseRate(code.tariff),
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

async function importCodes(codes: any[], section: string): Promise<ImportStats> {
  console.log(`Starting ${section}-codes import...`);
  const stats: ImportStats = {
    section,
    total: codes.length,
    imported: 0,
    failed: 0,
    errors: []
  };

  try {
    // Upsert codes to preserve references and avoid FK errors
    for (const code of codes) {
      try {
        // Validate the code
        const validation = validateCode(code);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        const dbCode = mapCodeToDbFormat(code);
        await prisma.dentalCode.upsert({
          where: {
            code: dbCode.code
          },
          update: dbCode,
          create: dbCode
        });
        stats.imported++;
      } catch (error) {
        stats.failed++;
        stats.errors.push({
          code: code.code || 'UNKNOWN',
          error: error.message
        });
      }
    }

    console.log(`${section}-codes import completed:`, {
      imported: stats.imported,
      failed: stats.failed,
      total: stats.total
    });

    return stats;
  } catch (error) {
    console.error(`Error importing ${section}-codes:`, error);
    throw error;
  }
}

async function importAllCodes() {
  const allStats: ImportStats[] = [];
  let hasErrors = false;

  try {
    // Import all code sets in sequence
    const codeSets = [
      { codes: ACodes, section: 'A' },
      { codes: BCodes, section: 'B' },
      { codes: cCodes, section: 'C' },
      { codes: ECodes, section: 'E' },
      { codes: fCodes, section: 'F' },
      { codes: mCodes, section: 'M' },
      { codes: G_CODES, section: 'G' },
      { codes: H_CODES, section: 'H' },
      { codes: jCodes, section: 'J' },
      { codes: pCodes, section: 'P' },
      { codes: R_CODES, section: 'R' },
      { codes: tCodes, section: 'T' },
      { codes: uCodes, section: 'U' },
      { codes: xCodes, section: 'X' },
      { codes: VCodes, section: 'V' },
      { codes: yCodes, section: 'Y' }
    ];

    for (const { codes, section } of codeSets) {
      try {
        const stats = await importCodes(codes, section);
        allStats.push(stats);
        if (stats.failed > 0) hasErrors = true;
      } catch (error) {
        console.error(`Failed to import ${section}-codes:`, error);
        hasErrors = true;
      }
    }

    // Print final summary
    console.log('\nImport Summary:');
    console.log('---------------');
    for (const stats of allStats) {
      console.log(`${stats.section}-codes:`, {
        total: stats.total,
        imported: stats.imported,
        failed: stats.failed
      });
      if (stats.errors.length > 0) {
        console.log(`Errors in ${stats.section}-codes:`);
        stats.errors.forEach(err => {
          console.log(`  ${err.code}: ${err.error}`);
        });
      }
    }

    if (hasErrors) {
      console.log('\nWarning: Some codes failed to import. Check the logs above for details.');
    } else {
      console.log('\nAll dental codes imported successfully!');
    }
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importAllCodes()
  .catch(console.error); 