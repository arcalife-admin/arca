export const fCodes = [
    // General rules as requirements object that can be referenced by specific codes
    {
        code: 'F_GENERAL_RULES',
        description: 'General orthodontic rules',
        points: null,
        rate: null,
        requirements: {
            generalRules: [
                'Only orthodontic care regulation codes allowed',
                'Dental codes not applicable except MRA treatments',
                'Brace treatments include making, fitting and placement',
                'Preventive consultations under 10 minutes included in treatment',
                'Repair costs included unless lost/damaged by patient',
                'Interceptive treatment for young patients typically 4-6 months',
                'Most expensive category applies for dual category consultations',
                'No simultaneous consultation with new brace placement',
                'Material costs charged separately for categories 5,6,8,9',
                'Includes bite models except insurance requested models',
                'Treatment ends with F492 or when no more consultations needed',
            ],
            calendarMonth: {
                definition: 'First to last day of named month',
                treatmentMonth: 'Calendar month of visit or remote consultation'
            },
            materialCosts: {
                separate: true,
                regulation: 'Orthodontic care policy rules',
                specification: 'Required for self-manufactured items',
                transparency: 'See Dental Care Regulation'
            },
            maxRates: {
                increase: '10% with written insurance agreement',
                billing: 'To insurance or patient per agreement'
            }
        }
    },
    // Section A: Regular Patient Treatment
    // Consultation and Diagnostics
    {
        code: 'F121A',
        description: 'First consultation',
        points: null,
        rate: 28.83,
        requirements: {
            category: 'regular_patient'
        }
    },
    {
        code: 'F122A',
        description: 'Follow-up consultation',
        points: null,
        rate: 28.83,
        requirements: {
            category: 'regular_patient'
        }
    },
    {
        code: 'F123A',
        description: 'Control visit',
        points: null,
        rate: 17.47,
        requirements: {
            category: 'regular_patient'
        }
    },
    {
        code: 'F124A',
        description: 'Second opinion',
        points: null,
        rate: 136.56,
        requirements: {
            category: 'regular_patient'
        }
    },
    {
        code: 'F125A',
        description: 'Make dental models',
        points: null,
        rate: 21.38,
        requirements: {
            category: 'regular_patient'
        }
    },
    {
        code: 'F126A',
        description: 'Assess dental models including treatment plan discussion',
        points: null,
        rate: 77.17,
        requirements: {
            category: 'regular_patient',
            includes: ['treatment plan discussion']
        }
    },
    {
        code: 'F127A',
        description: 'Multidisciplinary consultation, per 5 minutes',
        points: null,
        rate: 14.43,
        requirements: {
            category: 'regular_patient',
            isTimeDependent: true,
            timeUnit: 5
        }
    },
    // Section B: Patients with Schisis-like Conditions
    {
        code: 'F121B',
        description: 'First consultation - schisis',
        points: null,
        rate: 28.83,
        requirements: {
            category: 'schisis_patient'
        }
    },
    {
        code: 'F122B',
        description: 'Follow-up consultation - schisis',
        points: null,
        rate: 28.83,
        requirements: {
            category: 'schisis_patient'
        }
    },
    {
        code: 'F123B',
        description: 'Control visit - schisis',
        points: null,
        rate: 25.98,
        requirements: {
            category: 'schisis_patient'
        }
    },
    {
        code: 'F124B',
        description: 'Second opinion - schisis',
        points: null,
        rate: 136.56,
        requirements: {
            category: 'schisis_patient'
        }
    },
    {
        code: 'F125B',
        description: 'Make dental models - schisis',
        points: null,
        rate: 39.48,
        requirements: {
            category: 'schisis_patient'
        }
    },
    // Section C: Patients with Cheilo-/Gnatho-/Palatoschisis
    {
        code: 'F121C',
        description: 'First consultation - CCP',
        points: null,
        rate: 28.83,
        requirements: {
            category: 'cleft_patient'
        }
    },
    {
        code: 'F122C',
        description: 'Follow-up consultation - CCP',
        points: null,
        rate: 28.83,
        requirements: {
            category: 'cleft_patient'
        }
    },
    {
        code: 'F123C',
        description: 'Control visit - CCP',
        points: null,
        rate: 25.98,
        requirements: {
            category: 'cleft_patient'
        }
    },
    {
        code: 'F128C',
        description: 'Prenatal consultation, per 5 minutes',
        points: null,
        rate: 14.43,
        requirements: {
            category: 'cleft_patient',
            isTimeDependent: true,
            timeUnit: 5,
            consultationType: 'prenatal'
        }
    },
    {
        code: 'F129C',
        description: 'Orthodontics in first two years of life',
        points: null,
        rate: 1767.69,
        requirements: {
            category: 'cleft_patient',
            patientAge: {
                max: 2,
                unit: 'years'
            }
        }
    },
    // Brace Categories (for all patient types)
    {
        code: 'F411A',
        description: 'Place brace category 1',
        points: null,
        rate: 144.17,
        requirements: {
            category: 'regular_patient',
            braceCategory: 1
        }
    },
    // Add similar entries for F411B and F411C with different rates
    {
        code: 'F411B',
        description: 'Place brace category 1 - schisis',
        points: null,
        rate: 250.92,
        requirements: {
            category: 'schisis_patient',
            braceCategory: 1
        }
    },
    {
        code: 'F411C',
        description: 'Place brace category 1 - CCP',
        points: null,
        rate: 470.89,
        requirements: {
            category: 'cleft_patient',
            braceCategory: 1
        }
    },
    // Continue with other categories...
    // Monthly Consultations
    {
        code: 'F511A',
        description: 'Monthly brace consultation category 1',
        points: null,
        rate: 36.50,
        requirements: {
            category: 'regular_patient',
            braceCategory: 1,
            perMonth: true
        }
    },
    {
        code: 'F511B',
        description: 'Monthly brace consultation category 1 - schisis',
        points: null,
        rate: 77.56,
        requirements: {
            category: 'schisis_patient',
            braceCategory: 1,
            perMonth: true
        }
    },
    {
        code: 'F511C',
        description: 'Monthly brace consultation category 1 - CCP',
        points: null,
        rate: 77.56,
        requirements: {
            category: 'cleft_patient',
            braceCategory: 1,
            perMonth: true
        }
    },
    // Miscellaneous
    {
        code: 'F611A',
        description: 'Document and discuss electronic chip data in removable appliance',
        points: null,
        rate: 153.29,
        requirements: {
            category: 'regular_patient',
            applianceType: 'removable',
            hasElectronicChip: true
        }
    },
    {
        code: 'F721A',
        description: 'Extract tooth or molar',
        points: null,
        rate: 56.90,
        requirements: {
            category: 'regular_patient'
        }
    },
    {
        code: 'F724A',
        description: 'Preventive information and/or instruction',
        points: null,
        rate: 17.01,
        requirements: {
            category: 'regular_patient',
            type: 'preventive'
        }
    },
    {
        code: 'F815A',
        description: 'Remove splint, per element',
        points: null,
        rate: 7.59,
        requirements: {
            category: 'regular_patient',
            perElement: true,
            type: 'splint_removal'
        }
    },
    // Information Services
    {
        code: 'F900A',
        description: 'Information provision, per five minutes',
        points: null,
        rate: 17.28,
        requirements: {
            isTimeDependent: true,
            timeUnit: 5,
            category: 'regular_patient'
        }
    },
    {
        code: 'F900B',
        description: 'Information provision, per five minutes - schisis',
        points: null,
        rate: 17.28,
        requirements: {
            isTimeDependent: true,
            timeUnit: 5,
            category: 'schisis_patient'
        }
    },
    {
        code: 'F900C',
        description: 'Information provision, per five minutes - CCP',
        points: null,
        rate: 17.28,
        requirements: {
            isTimeDependent: true,
            timeUnit: 5,
            category: 'cleft_patient'
        }
    }
];
