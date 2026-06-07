export type CodeRequirements = {
  bodyArea?: string;
  procedureType?: string;
  anesthesiaType?: string;
};

const CATEGORY_BODY_AREA: Record<string, string> = {
  facial: 'face',
  breast: 'breast',
  body: 'body',
  combo: 'other',
  anesthesia: 'other',
  'non-surgical': 'other',
  other: 'other',
};

/** Parse requirements whether Prisma returns an object or a JSON string. */
export function parseCodeRequirements(requirements: unknown): CodeRequirements {
  if (!requirements) return {};
  if (typeof requirements === 'string') {
    try {
      return JSON.parse(requirements) as CodeRequirements;
    } catch {
      return {};
    }
  }
  if (typeof requirements === 'object') {
    return requirements as CodeRequirements;
  }
  return {};
}

export function getBodyAreaFromCode(code: {
  requirements?: unknown;
  category?: string;
}): string | null {
  const req = parseCodeRequirements(code.requirements);
  if (req.bodyArea) return req.bodyArea;
  if (code.category && CATEGORY_BODY_AREA[code.category]) {
    return CATEGORY_BODY_AREA[code.category];
  }
  return null;
}

export function getAnesthesiaFromCode(code: {
  requirements?: unknown;
}): string | null {
  const req = parseCodeRequirements(code.requirements);
  return req.anesthesiaType ?? null;
}

export function getProcedureTypeFromCode(code: {
  requirements?: unknown;
}): string | null {
  const req = parseCodeRequirements(code.requirements);
  return req.procedureType ?? null;
}

export function applyCodeDefaults(code: {
  requirements?: unknown;
  category?: string;
}): { bodyArea: string | null; anesthesiaType: string | null } {
  return {
    bodyArea: getBodyAreaFromCode(code),
    anesthesiaType: getAnesthesiaFromCode(code),
  };
}

export function resolveFormDefaults(
  procedure?: { bodyArea?: string | null; anesthesiaType?: string | null; code?: { requirements?: unknown; category?: string } | null } | null,
  initialCode?: { requirements?: unknown; category?: string } | null
): { bodyArea: string | null; anesthesiaType: string | null } {
  if (procedure?.bodyArea) {
    return {
      bodyArea: procedure.bodyArea,
      anesthesiaType:
        procedure.anesthesiaType ??
        (procedure.code ? getAnesthesiaFromCode(procedure.code) : null),
    };
  }

  const code = initialCode ?? procedure?.code;
  if (code) {
    return applyCodeDefaults(code);
  }

  return { bodyArea: null, anesthesiaType: null };
}
