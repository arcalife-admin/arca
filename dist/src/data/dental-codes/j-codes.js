"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jCodes = void 0;
exports.jCodes = [
    // General overhead costs
    {
        code: 'J001',
        description: 'Overhead costs implants, autotransplants and peri-implantitis surgery',
        points: null,
        rate: 220.32,
        requirements: {
            oncePerImplant: true,
            applicableWith: ['J040', 'J046', 'J048', 'H38', 'U05', 'U06', 'U25', 'U35']
        }
    },
    {
        code: 'J002',
        description: 'Overhead costs pre-implantological surgery',
        points: null,
        rate: 124.69,
        requirements: {
            oncePerTreatment: true,
            applicableWith: ['J020', 'J022', 'U05', 'U06', 'U25', 'U35']
        }
    },
    // Section A: Research, diagnostics and treatment planning
    {
        code: 'J010',
        description: 'Initial implant consultation',
        points: 13,
        rate: 83.23,
        requirements: {
            regardlessOfSessions: true,
            includes: [
                'complaint registration',
                'dental, prosthetic and psychosocial anamnesis'
            ]
        }
    },
    {
        code: 'J011',
        description: 'Examination for implantological treatment',
        points: 20,
        rate: 128.04,
        requirements: {
            oncePerTreatment: true,
            includes: [
                'extensive medical anamnesis',
                'determining trial setup indication',
                'drill template',
                'bone height and thickness measurements',
                'implant diagnostics',
                'study models if needed',
                'x-ray template if needed',
                'treatment plan discussion'
            ],
            notForReplacement: ['J046', 'J047'],
            incompatibleWith: ['J049']
        }
    },
    {
        code: 'J012',
        description: 'Implant trial setup, 1-4 elements',
        points: 15,
        rate: 96.03,
        requirements: {
            maxElements: 4,
            includes: [
                'digital impressions',
                'bite registration',
                'trial setup adjustments',
                'drill template or dynamic navigation'
            ],
            notForReplacement: ['J046', 'J047']
        }
    },
    {
        code: 'J013',
        description: 'Implant trial setup, 5 or more elements',
        points: 30,
        rate: 192.07,
        requirements: {
            minElements: 5,
            includes: [
                'digital impressions',
                'bite registration',
                'trial setup adjustments',
                'drill template or dynamic navigation'
            ],
            notForReplacement: ['J046', 'J047']
        }
    },
    {
        code: 'J014',
        description: 'CT scan-based implant positioning',
        points: 9,
        rate: 57.62,
        requirements: {
            oncePerTreatment: true,
            includes: ['implant type determination', 'length', 'cross-section', 'direction', 'depth', 'patient consultation'],
            notForReplacement: ['J046', 'J047'],
            applicableWith: ['H38']
        }
    },
    // Section B: Pre-implant bone volume increase
    {
        code: 'J020',
        description: 'Sinus floor elevation first jaw half',
        points: 48,
        rate: 307.30,
        requirements: {
            perJawHalf: true,
            purpose: 'sinus floor elevation',
            includes: ['autologous bone', 'bone substitute material'],
            separateSession: true,
            notWithSameJaw: ['J040'],
            followUpCode: 'J021'
        }
    },
    {
        code: 'J021',
        description: 'Sinus floor elevation second jaw half within three months',
        points: 30,
        rate: 192.07,
        requirements: {
            perJawHalf: true,
            withinMonths: 3,
            afterCode: 'J020'
        }
    },
    {
        code: 'J022',
        description: 'Jaw expansion and/or elevation in separate session before implantation',
        points: 29,
        rate: 185.66,
        requirements: {
            perJaw: true,
            separateSession: true,
            notWithSameJaw: ['J040', 'J046', 'J049'],
            excludesOtherCodes: ['sections C and D']
        }
    },
    // Section C: Bone volume increase during implantation
    {
        code: 'J030',
        description: 'Jaw expansion and/or elevation during implantation',
        points: 17,
        rate: 108.84,
        requirements: {
            perSextant: true,
            sameSession: true,
            onlyWith: ['J040', 'J041', 'J046', 'J047', 'J049']
        }
    },
    {
        code: 'J031',
        description: 'Sinus floor elevation during implantation',
        points: 26,
        rate: 166.46,
        requirements: {
            perJawHalf: true,
            sameSession: true,
            onlyWith: ['J040', 'J041', 'J046', 'J047']
        }
    },
    {
        code: 'J032',
        description: 'Orthogonal sinus floor elevation during implantation',
        points: 12,
        rate: 76.83,
        requirements: {
            throughImplantBed: true,
            sameSession: true,
            onlyWith: ['J040', 'J041', 'J046', 'J047'],
            excludesImplantMaterial: true,
            applicableWith: ['H38', 'H39']
        }
    },
    // Section D: Implantological surgery
    {
        code: 'J040',
        description: 'Place first implant',
        points: 45.8,
        rate: 293.22,
        requirements: {
            perJaw: true,
            includes: ['foramen exposure if needed'],
            implantCosts: 'J057',
            forDenture: 'J049'
        }
    },
    {
        code: 'J041',
        description: 'Place subsequent implant in same jaw',
        points: 18.9,
        rate: 121.00,
        requirements: {
            sameJaw: true,
            onlyWith: ['J040', 'J046', 'J049'],
            implantCosts: 'J057'
        }
    },
    {
        code: 'J042',
        description: 'Place first tissue former',
        points: 15,
        rate: 96.03,
        requirements: {
            twoPhase: true,
            phase1: 'submucosal implant placement',
            phase2: 'tissue former and crown'
        }
    },
    {
        code: 'J043',
        description: 'Place subsequent tissue former',
        points: 7.1,
        rate: 45.46,
        requirements: {
            onlyWith: ['J041', 'J042'],
            twoPhase: true
        }
    },
    {
        code: 'J044',
        description: 'Remove implant',
        points: 6.6,
        rate: 42.25,
        requirements: {
            includes: ['sutures', 'wound toilet'],
            notWithinMonths: 6
        }
    },
    {
        code: 'J045',
        description: 'Difficult implant removal',
        points: 33,
        rate: 211.27,
        requirements: {
            includes: ['mucoperiosteal flap', 'bone removal'],
            notWithinMonths: 6,
            simpleRemoval: 'J044'
        }
    },
    {
        code: 'J046',
        description: 'Replace first implant',
        points: 45.7,
        rate: 292.58,
        requirements: {
            includes: ['surgery', 'aftercare', 'foramen exposure'],
            notWithinMonths: 6,
            excludesWith: ['J010-J014'],
            implantCosts: 'J057',
            followUpCode: 'J047'
        }
    },
    {
        code: 'J047',
        description: 'Replace subsequent implant',
        points: 18.9,
        rate: 121.00,
        requirements: {
            onlyWith: ['J046'],
            includes: ['surgery', 'aftercare'],
            notWithinMonths: 6,
            excludesWith: ['J010-J014'],
            implantCosts: 'J057'
        }
    },
    {
        code: 'J048',
        description: 'Surgical treatment of peri-implantitis',
        points: 34.9,
        rate: 223.44,
        requirements: {
            perSextant: true,
            includes: ['instruction', 'oral hygiene']
        }
    },
    {
        code: 'J049',
        description: 'Place two implants for edentulous lower jaw click denture',
        points: 101.9,
        rate: 652.38,
        requirements: {
            completeTreatment: true,
            includes: [
                'diagnostics',
                'indication',
                'two implants',
                'six months aftercare',
                'J011',
                'J001',
                'J040',
                'J041'
            ],
            exceptions: ['J010', 'J030', 'J041'],
            implantCosts: 'J057'
        }
    },
    // Section E: Miscellaneous
    {
        code: 'J050',
        description: 'Surcharge for drills and insertion tools',
        points: null,
        rate: 'cost price',
        requirements: {
            onlyWith: ['J040', 'J046', 'J048', 'J049', 'J052', 'H38', 'U05', 'U06', 'U25', 'U35'],
            singleUse: true,
            removalTools: ['J044', 'J045', 'U05', 'U06', 'U25', 'U35']
        }
    },
    {
        code: 'J051',
        description: 'Apply bone substitutes in extraction socket',
        points: 4,
        rate: 25.61,
        requirements: {
            purpose: 'prevent jaw resorption',
            notWith: ['J022', 'J030']
        }
    },
    {
        code: 'J052',
        description: 'Prepare donor site',
        points: 27,
        rate: 172.86,
        requirements: {
            purpose: 'autologous bone transplant',
            onlyWith: ['J020', 'J021', 'J022', 'J030', 'J031', 'J032']
        }
    },
    {
        code: 'J053',
        description: 'Aesthetic zone surcharge',
        points: 13.5,
        rate: 86.43,
        requirements: {
            perJawHalf: true,
            elements: '14-24',
            purpose: 'crown and bridge work',
            applicableWith: ['H38', 'H39']
        }
    },
    {
        code: 'J054',
        description: 'Connective tissue transplant per donor site',
        points: 21,
        rate: 134.45,
        requirements: {
            purpose: 'thicken gingiva around implant'
        }
    },
    {
        code: 'J055',
        description: 'Obtain and process blood for PRF',
        points: 22.5,
        rate: 144.05,
        requirements: {
            perSession: true,
            includes: ['venipuncture', 'centrifuge', 'processing']
        }
    },
    {
        code: 'J056',
        description: 'Remove fractured abutment/occlusal screw',
        points: 23,
        rate: 147.25,
        requirements: {
            perImplant: true,
            includes: ['replacement', 'adjustments'],
            notWithinMonths: 6
        }
    },
    {
        code: 'J057',
        description: 'Implant costs',
        points: null,
        rate: 404.40,
        requirements: {
            includes: ['cover screw', 'healing abutment'],
            onlyWith: ['J040', 'J041', 'J046', 'J047', 'J049', 'U05', 'U06', 'U25', 'U35']
        }
    },
    {
        code: 'J058',
        description: 'Determine implant stability via ISQ measurement',
        points: 2,
        rate: 12.80,
        requirements: {
            oncePerImplant: true
        }
    },
    {
        code: 'J059',
        description: 'Thorough submucosal implant cleaning',
        points: 4.7,
        rate: 30.09,
        requirements: {
            perImplant: true,
            purpose: 'peri-implantitis treatment',
            alternatives: {
                mucositis: 'M03',
                surgery: 'J048'
            }
        }
    },
    {
        code: 'J060',
        description: 'Temporary crown on immediate implant',
        points: 52,
        rate: 332.91,
        requirements: {
            aestheticZone: '14-24',
            sameSession: true,
            IIPP: true,
            includes: [
                'impressions',
                'bite registration',
                'color determination',
                'temporary crown',
                'aftercare',
                'tissue corrections'
            ],
            aftercare: [
                'occlusion check',
                'soft tissue healing',
                'emergence profile optimization'
            ],
            notWith: ['section B']
        }
    },
    // Section F: Mesostructure
    {
        code: 'J070',
        description: 'Place first press button',
        points: 24,
        rate: 153.65,
        requirements: {
            includes: ['abutments']
        }
    },
    {
        code: 'J071',
        description: 'Place each subsequent press button',
        points: 7,
        rate: 44.82,
        requirements: {
            sameJaw: true,
            sameConstruction: true,
            onlyWith: ['J070']
        }
    },
    {
        code: 'J072',
        description: 'Bar between two implants in same jaw',
        points: 41,
        rate: 262.49,
        requirements: {
            perJaw: true,
            completeConstruction: true,
            includes: ['abutments']
        }
    },
    {
        code: 'J073',
        description: 'Each subsequent bar between implants in same jaw',
        points: 13,
        rate: 83.23,
        requirements: {
            sameJaw: true,
            after: ['J072']
        }
    },
    // Section G: Prosthetic treatment after implants
    {
        code: 'J080',
        description: 'Place complete denture and click denture simultaneously',
        points: 103,
        rate: 659.42,
        requirements: {
            opposingJaw: true,
            replacementProsthesis: true
        }
    },
    {
        code: 'J081',
        description: 'Click denture in lower jaw',
        points: 67,
        rate: 428.95,
        requirements: {
            lowerJaw: true,
            onMesostructure: true,
            replacementProsthesis: true
        }
    },
    {
        code: 'J082',
        description: 'Click denture in upper jaw',
        points: 67,
        rate: 428.95,
        requirements: {
            upperJaw: true,
            onMesostructure: true,
            replacementProsthesis: true
        }
    },
    {
        code: 'J083',
        description: 'Convert to click denture',
        points: 20,
        rate: 128.04,
        requirements: {
            perJaw: true,
            finalProsthetic: true,
            excludesMesostructure: true
        }
    },
    {
        code: 'J084',
        description: 'Convert to click denture with bar between two implants',
        points: 26,
        rate: 166.46,
        requirements: {
            perJaw: true,
            finalProsthetic: true,
            excludesMesostructure: true
        }
    },
    {
        code: 'J085',
        description: 'Convert to click denture with bar between three or four implants',
        points: 30,
        rate: 192.07,
        requirements: {
            perJaw: true,
            finalProsthetic: true,
            excludesMesostructure: true
        }
    },
    {
        code: 'J086',
        description: 'Convert to click denture with bar between more than four implants',
        points: 35,
        rate: 224.08,
        requirements: {
            perJaw: true,
            finalProsthetic: true,
            excludesMesostructure: true
        }
    },
    {
        code: 'J087',
        description: 'Replacement click denture on existing bars between two implants',
        points: 17,
        rate: 108.84,
        requirements: {
            perJaw: true,
            onlyWith: ['J080', 'J081', 'J082']
        }
    },
    {
        code: 'J088',
        description: 'Replacement click denture on existing bars between three or four implants',
        points: 22,
        rate: 140.85,
        requirements: {
            perJaw: true,
            onlyWith: ['J080', 'J081', 'J082']
        }
    },
    {
        code: 'J089',
        description: 'Replacement click denture on existing bars between more than four implants',
        points: 27,
        rate: 172.86,
        requirements: {
            perJaw: true,
            onlyWith: ['J080', 'J081', 'J082']
        }
    },
    // Section H: Implantology aftercare
    {
        code: 'J090',
        description: 'Specific implant consultation',
        points: 11,
        rate: 70.42,
        requirements: {
            periodicCheck: true,
            specifics: ['implants', 'mesostructure'],
            excludes: ['cleaning', 'J059'],
            notWithinMonths: 6,
            incompatibleWith: ['C002', 'C003', 'J091']
        }
    },
    {
        code: 'J091',
        description: 'Extended implant consultation',
        points: 18,
        rate: 115.24,
        requirements: {
            periodicCheck: true,
            includes: [
                'mesostructure removal',
                'bar removal',
                'abutments',
                'ultrasonic cleaning',
                'reassembly'
            ],
            pathologySpecific: true,
            notWithinMonths: 6,
            incompatibleWith: ['C002', 'C003', 'J090']
        }
    },
    // Section I: Prosthetic aftercare
    {
        code: 'J100',
        description: 'Reline click denture without bar removal',
        points: 28,
        rate: 179.26,
        requirements: {
            perJaw: true,
            includes: ['clips', 'matrices'],
            regardlessOfImplants: true,
            notWithOtherCodes: true,
            exceptWith: ['J109']
        }
    },
    {
        code: 'J101',
        description: 'Reline click denture with bar removal on two implants',
        points: 35,
        rate: 224.08,
        requirements: {
            perJaw: true,
            includes: ['clips'],
            notWithOtherCodes: true,
            exceptWith: ['J109']
        }
    },
    {
        code: 'J102',
        description: 'Reline click denture with bar removal on three or four implants',
        points: 40,
        rate: 256.09,
        requirements: {
            perJaw: true,
            includes: ['clips'],
            notWithOtherCodes: true,
            exceptWith: ['J109']
        }
    },
    {
        code: 'J103',
        description: 'Reline click denture with bar removal on more than four implants',
        points: 45,
        rate: 288.10,
        requirements: {
            perJaw: true,
            includes: ['clips'],
            notWithOtherCodes: true,
            exceptWith: ['J109']
        }
    },
    {
        code: 'J104',
        description: 'Simple click denture repair without bar removal',
        points: null,
        rate: 22.76,
        requirements: {
            perJaw: true,
            simpleRepair: true,
            includes: ['retention insert'],
            regardlessOfImplants: true,
            notWithOtherCodes: true,
            exceptWith: ['J109'],
            includesAftercare: true
        }
    },
    {
        code: 'J105',
        description: 'Click denture repair without bar removal',
        points: 11,
        rate: 70.42,
        requirements: {
            perJaw: true,
            needsOne: ['impression', 'clip repair', 'matrix repair'],
            regardlessOfImplants: true,
            notWithOtherCodes: true,
            exceptWith: ['J109'],
            includesAftercare: true
        }
    },
    {
        code: 'J106',
        description: 'Click denture repair with bar removal on two implants',
        points: 21,
        rate: 134.45,
        requirements: {
            perJaw: true,
            includes: ['clips'],
            notWithOtherCodes: true,
            exceptWith: ['J109'],
            includesAftercare: true
        }
    },
    {
        code: 'J107',
        description: 'Click denture repair with bar removal on three or four implants',
        points: 26,
        rate: 166.46,
        requirements: {
            perJaw: true,
            includes: ['clips'],
            notWithOtherCodes: true,
            exceptWith: ['J109'],
            includesAftercare: true
        }
    },
    {
        code: 'J108',
        description: 'Click denture repair with bar removal on more than four implants',
        points: 31,
        rate: 198.47,
        requirements: {
            perJaw: true,
            includes: ['clips'],
            notWithOtherCodes: true,
            exceptWith: ['J109'],
            includesAftercare: true
        }
    },
    {
        code: 'J109',
        description: 'Remove and replace press button',
        points: 5,
        rate: 32.01,
        requirements: {
            perButton: true,
            includes: ['abutment']
        }
    },
    {
        code: 'J110',
        description: 'Reline partial click denture',
        points: 28,
        rate: 179.26,
        requirements: {
            perJaw: true,
            includes: ['clips', 'matrices'],
            regardlessOfImplants: true,
            notWithOtherCodes: true,
            exceptWith: ['J109']
        }
    },
    {
        code: 'J111',
        description: 'Simple partial click denture repair without impression',
        points: null,
        rate: 22.76,
        requirements: {
            perJaw: true,
            simpleRepair: true,
            includes: ['retention insert'],
            notWithOtherCodes: true,
            exceptWith: ['J109'],
            includesAftercare: true
        }
    },
    {
        code: 'J112',
        description: 'Partial click denture repair',
        points: 11,
        rate: 70.42,
        requirements: {
            perJaw: true,
            needsOne: ['impression', 'clip repair', 'matrix repair'],
            regardlessOfImplants: true,
            notWithOtherCodes: true,
            exceptWith: ['J109'],
            includesAftercare: true
        }
    }
];
