"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
// Import all code sets
const a_codes_js_1 = require("../src/data/dental-codes/a-codes.js");
const b_codes_js_1 = require("../src/data/dental-codes/b-codes.js");
const e_codes_js_1 = require("../src/data/dental-codes/e-codes.js");
const f_codes_js_1 = require("../src/data/dental-codes/f-codes.js");
const g_codes_js_1 = require("../src/data/dental-codes/g-codes.js");
const h_codes_js_1 = require("../src/data/dental-codes/h-codes.js");
const j_codes_js_1 = require("../src/data/dental-codes/j-codes.js");
const p_codes_js_1 = require("../src/data/dental-codes/p-codes.js");
const r_codes_js_1 = require("../src/data/dental-codes/r-codes.js");
const t_codes_js_1 = require("../src/data/dental-codes/t-codes.js");
const u_codes_js_1 = require("../src/data/dental-codes/u-codes.js");
const v_codes_js_1 = require("../src/data/dental-codes/v-codes.js");
const y_codes_js_1 = require("../src/data/dental-codes/y-codes.js");
const prisma = new client_1.PrismaClient();
function mapCodeToDbFormat(code) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6;
    // Handle both old and new format requirements
    const requirements = {
        category: ((_a = code.requirements) === null || _a === void 0 ? void 0 : _a.category) || code.category || 'GENERAL',
        isTimeDependent: ((_b = code.requirements) === null || _b === void 0 ? void 0 : _b.isTimeDependent) || code.isTimeDependent || false,
        perElement: ((_c = code.requirements) === null || _c === void 0 ? void 0 : _c.perElement) || code.isPerElement || false,
        perJaw: ((_d = code.requirements) === null || _d === void 0 ? void 0 : _d.perJaw) || false,
        jaw: ((_e = code.requirements) === null || _e === void 0 ? void 0 : _e.jaw) || null,
        timeUnit: ((_f = code.requirements) === null || _f === void 0 ? void 0 : _f.timeUnit) || null,
        minElements: ((_g = code.requirements) === null || _g === void 0 ? void 0 : _g.minElements) || null,
        maxElements: ((_h = code.requirements) === null || _h === void 0 ? void 0 : _h.maxElements) || null,
        includes: ((_j = code.requirements) === null || _j === void 0 ? void 0 : _j.includes) || ((_k = code.requirements) === null || _k === void 0 ? void 0 : _k.includedServices) || [],
        excludes: ((_l = code.requirements) === null || _l === void 0 ? void 0 : _l.excludes) || [],
        applicableWith: ((_m = code.requirements) === null || _m === void 0 ? void 0 : _m.applicableWith) || code.allowedCombinations || code.validWithCodes || [],
        incompatibleWith: ((_o = code.requirements) === null || _o === void 0 ? void 0 : _o.incompatibleWith) || code.forbiddenCombinations || code.incompatibleCodes || [],
        mustCombineWithOthers: ((_p = code.requirements) === null || _p === void 0 ? void 0 : _p.mustCombineWithOthers) || false,
        patientTypes: ((_q = code.requirements) === null || _q === void 0 ? void 0 : _q.patientTypes) || [],
        patientAge: ((_r = code.requirements) === null || _r === void 0 ? void 0 : _r.patientAge) || null,
        location: ((_s = code.requirements) === null || _s === void 0 ? void 0 : _s.location) || null,
        braceCategory: ((_t = code.requirements) === null || _t === void 0 ? void 0 : _t.braceCategory) || null,
        perMonth: ((_u = code.requirements) === null || _u === void 0 ? void 0 : _u.perMonth) || false,
        consultationType: ((_v = code.requirements) === null || _v === void 0 ? void 0 : _v.consultationType) || null,
        applianceType: ((_w = code.requirements) === null || _w === void 0 ? void 0 : _w.applianceType) || null,
        hasElectronicChip: ((_x = code.requirements) === null || _x === void 0 ? void 0 : _x.hasElectronicChip) || false,
        type: ((_y = code.requirements) === null || _y === void 0 ? void 0 : _y.type) || null,
        generalRules: ((_z = code.requirements) === null || _z === void 0 ? void 0 : _z.generalRules) || [],
        calendarMonth: ((_0 = code.requirements) === null || _0 === void 0 ? void 0 : _0.calendarMonth) || null,
        materialCosts: ((_1 = code.requirements) === null || _1 === void 0 ? void 0 : _1.materialCosts) || null,
        maxRates: ((_2 = code.requirements) === null || _2 === void 0 ? void 0 : _2.maxRates) || null,
        notes: [...(((_3 = code.requirements) === null || _3 === void 0 ? void 0 : _3.notes) || []), ...(code.explanation ? [code.explanation] : [])],
        requiresTeethNumbers: code.requiresTeethNumbers || false,
        followUpCode: code.followUpCode || null,
        requiresTooth: ((_4 = code.requirements) === null || _4 === void 0 ? void 0 : _4.requiresTooth) || code.requiresTooth || false,
        requiresJaw: ((_5 = code.requirements) === null || _5 === void 0 ? void 0 : _5.requiresJaw) || code.requiresJaw || false,
        requiresSurface: ((_6 = code.requirements) === null || _6 === void 0 ? void 0 : _6.requiresSurface) || code.requiresSurface || false
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
        // Delete existing codes for this section
        await prisma.dentalCode.deleteMany({
            where: {
                code: {
                    startsWith: section
                }
            }
        });
        // Import all codes for this section
        for (const code of codes) {
            const dbCode = mapCodeToDbFormat(code);
            await prisma.dentalCode.create({
                data: dbCode
            });
        }
        console.log(`${section}-codes import completed successfully`);
    }
    catch (error) {
        console.error(`Error importing ${section}-codes:`, error);
        throw error;
    }
}
async function importAllCodes() {
    try {
        // Import all code sets in sequence
        await importCodes(a_codes_js_1.ACodes, 'A');
        await importCodes(b_codes_js_1.BCodes, 'B');
        await importCodes(e_codes_js_1.ECodes, 'E');
        await importCodes(f_codes_js_1.fCodes, 'F');
        await importCodes(g_codes_js_1.G_CODES, 'G');
        await importCodes(h_codes_js_1.H_CODES, 'H');
        await importCodes(j_codes_js_1.jCodes, 'J');
        await importCodes(p_codes_js_1.pCodes, 'P');
        await importCodes(r_codes_js_1.R_CODES, 'R');
        await importCodes(t_codes_js_1.tCodes, 'T');
        await importCodes(u_codes_js_1.uCodes, 'U');
        await importCodes(v_codes_js_1.VCodes, 'V');
        await importCodes(y_codes_js_1.yCodes, 'Y');
        console.log('All dental codes imported successfully!');
    }
    catch (error) {
        console.error('Error during import:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
importAllCodes()
    .catch(console.error);
