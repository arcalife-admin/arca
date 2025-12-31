"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uCodes = void 0;
exports.uCodes = [
    {
        code: 'U05',
        description: 'Time rate guidance and treatment of difficult treatable patients in units of five minutes',
        points: null,
        rate: 19.93,
        requirements: {
            isTimeDependent: true,
            timeUnit: 5,
            patientTypes: [
                'mental disability',
                'physical disability',
                'extreme anxiety'
            ],
            includes: ['extended treatment duration'],
            applicableWith: ['C020', 'C021', 'J057', 'A20', 'X10-X34', 'B12', 'H21', 'E04', 'J001', 'J002', 'J050'],
            incompatibleWith: ['U06'],
            fullTreatmentCharge: true
        }
    },
    {
        code: 'U06',
        description: 'Extra time guidance difficult treatable patients in units of five minutes',
        points: null,
        rate: 19.93,
        requirements: {
            isTimeDependent: true,
            timeUnit: 5,
            patientTypes: [
                'mental disability',
                'physical disability',
                'extreme anxiety'
            ],
            includes: ['extended treatment duration'],
            mustCombineWithOthers: true,
            incompatibleWith: ['U05']
        }
    },
    {
        code: 'U25',
        description: 'Time rate dental care for patients treated in WLZ institution in units of five minutes',
        points: null,
        rate: 17.28,
        requirements: {
            isTimeDependent: true,
            timeUnit: 5,
            location: 'WLZ institution',
            excludes: [
                'patient transfer',
                'daily oral care'
            ],
            allowedWith: [
                'J057',
                'A20',
                'X10-X34',
                'B12',
                'H21',
                'E04',
                'J001',
                'J002',
                'J050'
            ]
        }
    },
    {
        code: 'U35',
        description: 'Time rate dental care for WLZ patients treated in provider practice in units of five minutes',
        points: null,
        rate: 19.93,
        requirements: {
            isTimeDependent: true,
            timeUnit: 5,
            location: 'provider practice',
            patientType: 'WLZ institution resident',
            allowedWith: [
                'J057',
                'A20',
                'X10-X34',
                'B12',
                'H21',
                'E04',
                'J001',
                'J002',
                'J050'
            ]
        }
    }
];
