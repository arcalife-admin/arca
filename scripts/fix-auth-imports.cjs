const fs = require('fs');
const path = require('path');

// Files that need to be fixed
const filesToFix = [
  'src/lib/auth.ts',
  'src/app/api/user/organization/route.ts',
  'src/app/api/user/profile/route.ts',
  'src/app/api/practitioners/route.ts',
  'src/app/api/patients/route.ts',
  'src/app/api/patients/[id]/status/route.ts',
  'src/app/api/patients/[id]/notes/route.ts',
  'src/app/api/patients/[id]/route.ts',
  'src/app/api/patients/[id]/note-folders/route.ts',
  'src/app/api/patients/[id]/images/[imageId]/calibration/route.ts',
  'src/app/api/patients/[id]/files/route.ts',
  'src/app/api/patients/[id]/images/[imageId]/annotations/route.ts',
  'src/app/api/patients/[id]/images/route.ts',
  'src/app/api/patients/[id]/care-plan/route.ts',
  'src/app/api/chat/[id]/messages/route.ts',
  'src/app/api/chat/[id]/info/route.ts',
  'src/app/api/chat/route.ts',
  'src/app/api/doctors/route.ts',
  'src/app/api/calendar-settings/personal/route.ts',
  'src/app/api/calendar-settings/route.ts'
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix different import patterns
  const patterns = [
    {
      from: "import { authOptions } from '@/app/api/auth/[...nextauth]/route'",
      to: "import { authOptions } from '@/lib/auth-config'"
    },
    {
      from: "import { authOptions } from '../../auth/[...nextauth]/route'",
      to: "import { authOptions } from '@/lib/auth-config'"
    },
    {
      from: "import { authOptions } from '../auth/[...nextauth]/route'",
      to: "import { authOptions } from '@/lib/auth-config'"
    },
    {
      from: "import { authOptions } from '../../../auth/[...nextauth]/route'",
      to: "import { authOptions } from '@/lib/auth-config'"
    }
  ];

  patterns.forEach(pattern => {
    if (content.includes(pattern.from)) {
      content = content.replace(new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), pattern.to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
}

console.log('Fixing authOptions imports...');
filesToFix.forEach(fixFile);
console.log('Done!'); 