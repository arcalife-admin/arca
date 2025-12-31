export const ACodes = [
    {
        code: 'A10',
        description: 'Geleidings-, infiltratie- en/of intraligamentaire verdoving',
        points: 2.5,
        rate: 18.97,
        requirements: {
            category: 'INFORMATION_SERVICES',
            isTimeDependent: false,
            requiresTooth: false,
            requiresJaw: true,
            perElement: true,
            notes: [
                'Niet in rekening te brengen bij chirurgische verrichtingen (Hoofdstuk X, H-codes)',
                'In de onderkaak per blok gedeclareerd',
                'In de bovenkaak per twee naast elkaar liggende elementen gedeclareerd',
                'In de onderkaak (front) per twee naast elkaar liggende elementen gedeclareerd',
                'Intraligamentaire, intraossale of intrapulpaire verdoving is per element declarabel'
            ]
        }
    },
    {
        code: 'A15',
        description: 'Oppervlakte verdoving',
        points: 1.3,
        rate: 9.86,
        requirements: {
            category: 'INFORMATION_SERVICES',
            isTimeDependent: false,
            requiresTooth: false,
            requiresJaw: true,
            perElement: true,
            notes: [
                'Per kaakhelft in rekening te brengen',
                'Alleen in rekening te brengen indien niet gevolgd door A10'
            ]
        }
    },
    {
        code: 'A20',
        description: 'Behandeling onder algehele anesthesie of sedatie',
        points: 0,
        rate: 0,
        requirements: {
            category: 'INFORMATION_SERVICES',
            isTimeDependent: false,
            requiresTooth: false,
            requiresJaw: false,
            perElement: false,
            notes: [
                'Kostprijs',
                'Inclusief voorlichting aan de patiënt',
                'Inclusief bespreking van risico\'s',
                'Inclusief bespreking van kindvriendelijke innovaties',
                'De tandheelkundige behandeling zelf kan niet in rekening worden gebracht met deze prestatie'
            ]
        }
    },
    {
        code: 'A30',
        description: 'Voorbereiding behandeling onder algehele anesthesie',
        points: 8,
        rate: 60.69,
        requirements: {
            category: 'INFORMATION_SERVICES',
            isTimeDependent: false,
            requiresTooth: false,
            requiresJaw: false,
            perElement: false,
            notes: [
                'Bedoeld voor de organisatie van de behandeling onder algehele anesthesie in een instelling voor medisch specialistische zorg',
                'A30 mag niet in combinatie met A20 gedeclareerd worden'
            ]
        }
    }
];
