const fs = require('fs');
const path = require('path');

// Function to transform old dental code structure to new structure
function transformDentalCode(oldCode) {
  return {
    code: oldCode.code,
    description: oldCode.description,
    category: oldCode.category,
    requirements: oldCode.requirements || {},
    section: oldCode.section || "General",
    subSection: oldCode.subSection || "General",
    patientType: oldCode.patientType || "Adult",
    points: oldCode.points || null,
    rate: oldCode.rate || null
  };
}

// Function to update a single import file
function updateImportFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Find the dental codes array
  const codesMatch = content.match(/(const \w+Codes = \[[\s\S]*?\];)/);
  if (!codesMatch) {
    console.log(`No dental codes array found in: ${filePath}`);
    return;
  }

  const oldCodesString = codesMatch[1];

  // Extract the codes array
  const codesArrayMatch = oldCodesString.match(/\[([\s\S]*)\]/);
  if (!codesArrayMatch) {
    console.log(`Could not parse codes array in: ${filePath}`);
    return;
  }

  // This is a simplified approach - we'll need to manually fix each file
  // For now, let's just add the missing required fields
  let newContent = content.replace(
    /(code: "[^"]+",\s*description: "[^"]+",\s*basePrice: [^,]+,\s*category: "[^"]+")/g,
    '$1,\n    section: "General",\n    subSection: "General",\n    patientType: "Adult"'
  );

  // Remove old fields that are no longer in schema
  newContent = newContent.replace(/,\s*basePrice: [^,}]+/g, '');
  newContent = newContent.replace(/,\s*isTimeDependent: [^,}]+/g, '');
  newContent = newContent.replace(/,\s*requiresTooth: [^,}]+/g, '');
  newContent = newContent.replace(/,\s*requiresJaw: [^,}]+/g, '');
  newContent = newContent.replace(/,\s*requiresSurface: [^,}]+/g, '');
  newContent = newContent.replace(/,\s*isPerElement: [^,}]+/g, '');
  newContent = newContent.replace(/,\s*isFirstElement: [^,}]+/g, '');
  newContent = newContent.replace(/,\s*forbiddenCombinations: [^}]+}/g, '');

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
}

// List of import files to update
const importFiles = [
  'scripts/import-a-codes.ts',
  'scripts/import-b-codes.ts',
  'scripts/import-c-codes.ts',
  'scripts/import-e-codes.ts',
  'scripts/import-f-codes.ts',
  'scripts/import-g-codes.ts',
  'scripts/import-h-codes.ts',
  'scripts/import-j-codes.ts',
  'scripts/import-m-codes.ts',
  'scripts/import-p-codes.ts',
  'scripts/import-r-codes.ts',
  'scripts/import-t-codes.ts',
  'scripts/import-u-codes.ts',
  'scripts/import-v-codes.ts',
  'scripts/import-y-codes.ts'
];

console.log('Updating dental code import scripts to match new schema...');
importFiles.forEach(updateImportFile);
console.log('Done!'); 