export const cCodes = [
    {
        code: 'C001',
        description: 'Consult ten behoeve van een intake, inclusief bepalen en bespreken zorgdoel',
        points: 7.6,
        rate: 57.66,
        requirements: {
            includes: [
                'Aanmaken patiëntendossier',
                'Registreren status gebit',
                'Medische anamnese',
                'Bespreken vervolgtraject',
                'Bepalen en bespreken zorgdoel'
            ],
            excludes: [
                'Niet combineren in zelfde zitting met eerste-consult prestaties (E02, E03, G21, T012, J010)',
                'C002', 'C003', 'C012', 'C014', 'C015'
            ]
        }
    },
    {
        code: 'C002',
        description: 'Consult voor een periodieke controle',
        points: 3.8,
        rate: 28.83,
        requirements: {
            includes: [
                'Algemeen periodiek mondonderzoek',
                'Onderzoeken PPS-score indien van toepassing',
                'Kleine niet-tarieflijstverrichtingen',
                'Verwijzen naar andere zorgaanbieder indien nodig'
            ]
        }
    },
    {
        code: 'C003',
        description: 'Consult, niet zijnde periodieke controle',
        points: 3.8,
        rate: 28.83,
        requirements: {
            notes: [
                'Mag niet in combinatie met C002',
                'Mag niet gedeclareerd worden indien probleem voortkomt uit verrichting binnen afgelopen 2 maanden tenzij nazorg'
            ]
        }
    },
    {
        code: 'C010',
        description: 'Aanvullende medische anamnese na (schriftelijke) routinevragen',
        points: 3.8,
        rate: 28.83,
        requirements: {
            includes: [
                'Bespreking met patiënt',
                'Overleg met huisarts/specialist indien nodig'
            ]
        }
    },
    {
        code: 'C011',
        description: 'Uitgebreid onderzoek ten behoeve van een second opinion',
        points: 18,
        rate: 136.56
    },
    {
        code: 'C012',
        description: 'Uitgebreid onderzoek ten behoeve van het integrale behandelplan',
        points: 18,
        rate: 136.56,
        requirements: {
            excludes: ['C001', 'C002', 'C003', 'C010']
        }
    },
    {
        code: 'C013',
        description: 'Studiemodellen',
        points: 5,
        rate: 37.93
    },
    {
        code: 'C014',
        description: 'Pocketregistratie',
        points: 6,
        rate: 45.52
    },
    {
        code: 'C015',
        description: 'Parodontiumregistratie',
        points: 12,
        rate: 91.04
    },
    {
        code: 'C016',
        description: 'Maken en bespreken van een restauratieve proef-opstelling',
        points: 30,
        rate: 227.59,
        requirements: {
            excludes: ['C013', 'G10']
        }
    },
    {
        code: 'C020',
        description: 'Toeslag mondzorg aan huis',
        points: 3,
        rate: 22.76
    },
    {
        code: 'C021',
        description: 'Toeslag avond, nacht en weekend uren (anw-uren)',
        points: 4.2,
        rate: 31.86,
        requirements: {
            notes: ['Alleen in combinatie met andere prestatie']
        }
    },
    {
        code: 'C022',
        description: 'Droogleggen van elementen door middel van een rubberen lapje',
        points: 2,
        rate: 15.17,
        requirements: {
            notes: ['Mag enkel gedeclareerd worden in combinatie met prestaties uit E-, H-, P-, R-, V-hoofdstuk en M80/M81']
        }
    },
    {
        code: 'C023',
        description: 'Toeslag specifieke mondzorg aan huis',
        points: 13,
        rate: 98.62
    }
];
