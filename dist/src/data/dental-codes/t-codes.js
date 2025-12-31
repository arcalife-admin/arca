"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tCodes = void 0;
exports.tCodes = [
    // Section A: Treatments for patients with periodontal conditions
    {
        code: 'T012',
        description: 'Periodontal examination with periodontium status',
        points: 29,
        rate: 220.01,
        requirements: {
            ppsScore: { min: 2, max: 3 },
            includes: [
                'general patient information',
                'oral hygiene self-care importance',
                'referral consultation if needed'
            ],
            incompatibleCodes: ['C001', 'C002', 'C003', 'C010', 'C011', 'C012', 'M40'],
            exceptionalCombinations: ['T042', 'T043', 'T044']
        }
    },
    {
        code: 'T021',
        description: 'Complex root cleaning',
        points: 5.4,
        rate: 40.97,
        requirements: {
            ppsScore: { min: 2, max: 3 },
            pocketDepth: {
                singleRoot: '≥8mm',
                multiRoot: '≥6mm'
            },
            excludesAnesthesia: true,
            onlyAfter: ['T012', 'T032'],
            recallTreatment: true
        }
    },
    {
        code: 'T022',
        description: 'Standard root cleaning',
        points: 4,
        rate: 30.35,
        requirements: {
            ppsScore: { min: 2, max: 3 },
            pocketDepth: {
                singleRoot: '4-7mm',
                multiRoot: '4-5mm'
            },
            excludesAnesthesia: true,
            onlyAfter: ['T012', 'T032'],
            recallTreatment: true
        }
    },
    {
        code: 'T032',
        description: 'Evaluation of initial treatment/surgery or reassessment with periodontium status',
        points: 18,
        rate: 136.56,
        requirements: {
            ppsScore: { min: 2, max: 3 },
            purpose: 'evaluation after initial treatment/surgery or periodic reassessment',
            regardlessOfSessions: true
        }
    },
    {
        code: 'T033',
        description: 'Discussion of follow-up treatment after evaluation or reassessment',
        points: 11,
        rate: 83.45,
        requirements: {
            ppsScore: { min: 2, max: 3 },
            onlyWith: ['T032'],
            onlyForNewOrModifiedPlan: true
        }
    },
    {
        code: 'T042',
        description: 'Periodontal follow-up consultation',
        points: 15.2,
        rate: 115.31,
        requirements: {
            ppsScore: { min: 2, max: 3 },
            applicableAfter: ['T032'],
            applicableBefore: ['T021', 'T022', 'T032'],
            purpose: 'interim check or aftercare'
        }
    },
    {
        code: 'T043',
        description: 'Extended periodontal follow-up consultation',
        points: 20.2,
        rate: 153.25,
        requirements: {
            ppsScore: { min: 2, max: 3 },
            applicableAfter: ['T032'],
            applicableBefore: ['T021', 'T022', 'T032'],
            pocketDepth: '≥5mm',
            noComplicatingFactors: true,
            purpose: 'extensive instruction and clinical treatment'
        }
    },
    {
        code: 'T044',
        description: 'Complex periodontal follow-up consultation',
        points: 26.9,
        rate: 204.08,
        requirements: {
            ppsScore: { min: 2, max: 3 },
            applicableAfter: ['T032'],
            applicableBefore: ['T021', 'T022', 'T032'],
            complicatingFactors: [
                'multi-rooted element',
                'furcation defect',
                'angular defect',
                'infrabony defect'
            ]
        }
    },
    // Section B.1: Periodontal surgery
    {
        code: 'T070',
        description: 'Flap operation between two elements',
        points: 32.5,
        rate: 246.56,
        requirements: {
            includes: [
                'practice preparation',
                'patient preparation',
                'anesthesia',
                'flap operation',
                'patient instruction',
                'medication if needed',
                'operation report'
            ]
        }
    },
    {
        code: 'T071',
        description: 'Flap operation per sextant',
        points: 50,
        rate: 379.32,
        requirements: {
            perSextant: true,
            includes: [
                'practice preparation',
                'patient preparation',
                'anesthesia',
                'flap operation',
                'patient instruction',
                'medication if needed',
                'operation report'
            ]
        }
    },
    {
        code: 'T072',
        description: 'Extended flap operation per sextant',
        points: 60,
        rate: 455.19,
        requirements: {
            perSextant: true,
            includes: [
                'practice preparation',
                'patient preparation',
                'anesthesia',
                'flap operation',
                'patient instruction',
                'medication if needed',
                'operation report',
                'vestibular extension if needed'
            ],
            conditions: {
                pocketDepth: '>6mm',
                complicatingFactors: [
                    'attachment loss >4mm',
                    'furcation involvement',
                    'irregular bone contour',
                    'special gingival anatomy',
                    'deviating tooth position'
                ]
            }
        }
    },
    // Section B.2: Regeneration techniques
    {
        code: 'T111',
        description: 'Application of periodontal regeneration material for bone repair as independent procedure, per sextant',
        points: 60,
        rate: 455.19,
        requirements: {
            perSextant: true,
            independentProcedure: true,
            includes: [
                'practice preparation',
                'anesthesia',
                'oral hygiene instruction'
            ],
            materialCostsSeparate: true
        }
    },
    {
        code: 'T112',
        description: 'Application of periodontal regeneration material for bone repair as non-independent procedure with flap operation in same sextant, per element',
        points: 20,
        rate: 151.73,
        requirements: {
            perElement: true,
            onlyWith: ['T070', 'T071', 'T072', 'J048'],
            includes: ['anesthesia', 'oral hygiene instruction'],
            materialCostsSeparate: true
        }
    },
    {
        code: 'T113',
        description: 'Operative removal of regeneration material',
        points: 32.5,
        rate: 246.56,
        requirements: {
            includes: [
                'practice preparation',
                'anesthesia',
                'oral hygiene instruction'
            ]
        }
    },
    // Section B.3: Crown lengthening procedures
    {
        code: 'T121',
        description: 'Crown lengthening, single element',
        points: 32.5,
        rate: 246.56,
        requirements: {
            singleElement: true,
            includes: [
                'flap operation',
                'cervical bone level correction',
                'practice preparation',
                'anesthesia',
                'oral hygiene instruction'
            ],
            purpose: 'preparation for later restoration'
        }
    },
    {
        code: 'T122',
        description: 'Crown lengthening, two to six elements',
        points: 60,
        rate: 455.19,
        requirements: {
            minElements: 2,
            maxElements: 6,
            includes: [
                'flap operation',
                'cervical bone level correction',
                'practice preparation',
                'anesthesia',
                'oral hygiene instruction'
            ],
            purpose: 'preparation for later restoration'
        }
    },
    // Section B.4: Mucogingival surgery
    {
        code: 'T141',
        description: 'Gingival transplant',
        points: 19,
        rate: 144.14,
        requirements: {
            includes: [
                'anesthesia',
                'oral hygiene instruction'
            ],
            tissueType: 'palatal gingiva'
        }
    },
    {
        code: 'T142',
        description: 'Recession coverage with relocated flap',
        points: 60,
        rate: 455.19,
        requirements: {
            perSextant: true,
            includes: [
                'practice preparation',
                'anesthesia',
                'oral hygiene instruction'
            ],
            onlyWith: ['T141'],
            materialCostsSeparate: true
        }
    },
    // Section B.5: Direct postoperative care
    {
        code: 'T151',
        description: 'First postoperative check-up',
        points: 10,
        rate: 75.86,
        requirements: {
            firstSession: true,
            includes: [
                'wound healing check',
                'suture removal',
                'dressing removal',
                'plaque removal',
                'local disinfection if needed',
                'oral hygiene instruction'
            ]
        }
    },
    {
        code: 'T152',
        description: 'Subsequent postoperative check-up',
        points: 26.9,
        rate: 204.08,
        requirements: {
            followUpSession: true,
            includes: [
                'wound healing check',
                'oral hygiene check',
                'plaque removal',
                'calculus removal',
                'root planing if needed',
                'chlorhexidine removal',
                'local disinfection if needed',
                'oral hygiene instruction',
                'plaque score measurement'
            ]
        }
    },
    // Section B.6: Miscellaneous
    {
        code: 'T161',
        description: 'Bacteriological examination for periodontal treatment',
        points: 7,
        rate: 53.11,
        requirements: {
            includes: [
                'localized parostatus',
                'minimum three plaque samples',
                'bacteriological data discussion'
            ],
            incompatibleWith: ['M32']
        }
    },
    {
        code: 'T162',
        description: 'Treatment of periodontal abscess',
        points: 13.5,
        rate: 102.42,
        requirements: {
            includes: [
                'examination',
                'anesthesia',
                'root planing',
                'oral hygiene instruction',
                'alternative oral hygiene measures'
            ]
        }
    },
    {
        code: 'T163',
        description: 'Application of local medication',
        points: 10.8,
        rate: 81.93,
        requirements: {
            oncePerSession: true,
            regardlessOfElements: true,
            materialCostsSeparate: true
        }
    },
    {
        code: 'T164',
        description: 'Wire/thread splint',
        points: 4,
        rate: 30.35,
        requirements: {
            perConnection: true,
            includesWire: true,
            notForOrthodontics: true
        }
    },
    {
        code: 'T165',
        description: 'Extensive dietary analysis',
        points: 10,
        rate: 75.86,
        requirements: {
            basedOn: 'written patient report',
            includes: ['eating habits discussion'],
            onlyAsPartOf: 'periodontal treatment'
        }
    }
];
