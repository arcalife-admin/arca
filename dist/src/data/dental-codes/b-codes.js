"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BCodes = void 0;
exports.BCodes = [
    {
        code: 'B10',
        description: 'Beperkt onderzoek',
        points: 5,
        rate: 37.93,
        requirements: {
            category: 'INFORMATION_SERVICES',
            isTimeDependent: false,
            perElement: false,
            notes: [
                'Eenvoudig diagnostisch onderzoek',
                'Het eenvoudig diagnostisch onderzoek bestaat uit het beoordelen van het gebit met eventuele afwijkingen',
                'Maximaal twee keer per kalenderjaar in rekening te brengen'
            ]
        }
    },
    {
        code: 'B11',
        description: 'Periodieke controle',
        points: 5,
        rate: 37.93,
        requirements: {
            category: 'INFORMATION_SERVICES',
            isTimeDependent: false,
            perElement: false,
            notes: [
                'Maximaal twee keer per kalenderjaar in rekening te brengen'
            ]
        }
    },
    {
        code: 'B12',
        description: 'Uitgebreid onderzoek',
        points: 6.05,
        rate: 45.86,
        requirements: {
            category: 'INFORMATION_SERVICES',
            isTimeDependent: false,
            perElement: false,
            notes: [
                'Maximaal één keer per kalenderjaar in rekening te brengen'
            ]
        }
    }
];
