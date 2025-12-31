// Section H - Surgical Procedures (Chirurgische ingrepen)
// All procedures in this section include anesthesia
// A. Basic Extractions and Procedures
export const BASIC_PROCEDURES = [
    {
        code: 'H11',
        description: 'Trekken tand of kies',
        points: 7.5,
        rate: 56.90,
        explanation: 'Inclusief (eventueel) hechten, kosten hechtmateriaal en wondtoilet.',
        requiresTeethNumbers: true,
        isFirstElement: true,
        followUpCode: 'H16'
    },
    {
        code: 'H16',
        description: 'Trekken volgende tand of kies, in dezelfde zitting en hetzelfde kwadrant',
        points: 5.6,
        rate: 42.48,
        explanation: 'Inclusief (eventueel) hechten, kosten hechtmateriaal en wondtoilet.',
        requiresTeethNumbers: true,
        requiresQuadrant: true
    },
    {
        code: 'H21',
        description: 'Kosten hechtmateriaal',
        points: 1,
        rate: 7.58,
        explanation: 'Uitsluitend extra in rekening te brengen bij: verrichtingen uit hoofdstuk H, met uitzondering van de codes H11, H16, H38 en H39; U05, U06, U25 en U35. Per H-code verrichting eenmaal te berekenen.',
        validWithCodes: ['H26', 'H33', 'H34', 'H35', 'H40', 'H41', 'H42', 'H43', 'H44', 'H59', 'H60', 'H65', 'H70', 'H75', 'H80', 'H85']
    },
    {
        code: 'H26',
        description: 'Hechten weke delen',
        points: 11,
        rate: 83.45,
        explanation: 'Bijvoorbeeld liphechting inclusief wondtoilet.',
        requiresTeethNumbers: false
    },
    {
        code: 'H50',
        description: 'Terugzetten tand of kies, eerste element',
        points: 10,
        rate: 75.86,
        explanation: 'Exclusief wortelkanaalbehandeling. Inclusief tijdelijke fixatie ongeacht de methodiek; inclusief hechten en wondtoilet.',
        requiresTeethNumbers: true,
        isFirstElement: true,
        followUpCode: 'H55'
    },
    {
        code: 'H55',
        description: 'Terugzetten tand of kies, volgend element in dezelfde zitting',
        points: 3,
        rate: 22.76,
        explanation: 'Exclusief wortelkanaalbehandeling. Inclusief tijdelijke fixatie ongeacht de methodiek; inclusief hechten en wondtoilet. Deze prestatie kan alleen gedeclareerd worden indien volgend op H50 in dezelfde zitting.',
        requiresTeethNumbers: true,
        validWithCodes: ['H50']
    }
];
// B. Complex Procedures and Preparations
export const COMPLEX_PROCEDURES = [
    {
        code: 'H90',
        description: 'Voorbereiding praktijkruimte ten behoeve van chirurgische verrichtingen vallend onder onderdeel B',
        points: 10,
        rate: 75.86,
        explanation: 'Het voor chirurgie gereed maken van de praktijkruimte in verband met de vereiste steriliteit. Uitsluitend in rekening te brengen indien bijzondere maatregelen worden toegepast, vergelijkbaar met inrichting operatiekamer.',
        incompatibleCodes: ['H36', 'H37', 'H38', 'H39']
    },
    {
        code: 'H33',
        description: 'Hemisectie van een molaar',
        points: 12,
        rate: 91.04,
        explanation: 'Inclusief hechten en wondtoilet.',
        requiresTeethNumbers: true
    },
    {
        code: 'H34',
        description: 'Vrijleggen ingesloten tand of kies ter bevordering van de doorbraak',
        points: 12,
        rate: 91.04,
        explanation: 'Verwijderen van tandvlees en kaakbot om een niet doorgebroken tand of kies vrij te leggen ter bevordering van de doorbraak. Inclusief zo nodig hechten en aanbrengen wondverband.',
        requiresTeethNumbers: true,
        incompatibleCodes: ['H11', 'H16', 'H35']
    },
    {
        code: 'H35',
        description: 'Moeizaam trekken tand of kies met behulp van chirurgie',
        points: 12,
        rate: 91.04,
        explanation: 'Een chirurgische verwijdering van een tand of kies waarbij tenminste twee van de onderstaande zaken zijn uitgevoerd: splitsen van de wortel(s); wegboren van kaakbot; het opklappen van het tandvlees (mucoperiostale opklap). Inclusief zo nodig hechten en wondtoilet.',
        requiresTeethNumbers: true
    }
];
// C. Autotransplantation
export const AUTOTRANSPLANTATION = [
    {
        code: 'H36',
        description: 'Onderzoek ten behoeve van de indicatiestelling voor een autotransplantaat behandeling',
        points: 11,
        rate: 83.45,
        explanation: 'Ongeachte het aantal zittingen. Onderzoek, voorlichting en globale beoordeling of autotransplantaat is geïndiceerd. Inclusief: het in kaart brengen van de klacht(en); het afnemen van een tandheelkundige, prothetische en psychosociale anamnese; het zo nodig onderzoeken van het functioneren van een bestaande prothetische voorziening; het schriftelijk vastleggen van de bevindingen.',
        isTimeDependent: false
    },
    {
        code: 'H37',
        description: 'Onderzoek ten behoeve van de uitvoering voor een autotransplantaat behandeling',
        points: 17,
        rate: 128.97,
        explanation: 'Ongeacht het aantal zittingen. Eenmaal per behandeling in rekening te brengen. Onder onderzoek ten behoeve van de uitvoering van voor een behandeling met autotransplantaten wordt verstaan: het afnemen van een uitgebreide medische anamnese; bothoogte- en botdiktemetingen; het zo nodig nemen van afdrukken ten behoeve van studiemodellen; het zo nodig laten maken van een boormal/pas element; het opstellen en bespreken van een behandelplan.',
        isTimeDependent: false
    },
    {
        code: 'H38',
        description: 'Uitvoeren eerste autotransplantaat',
        points: 38.6,
        rate: 292.84,
        explanation: 'Transplantaat van tand of kies. Inclusief: het eventueel verwijderen van de te vervangen tand of kies (receptor); het prepareren van een wondbed voor de wortel(s) van de te transplanteren tand of kies; het transplanteren en het overhechten van de getransplanteerde tand of kies; verdoving; het zo nodig vrijleggen van het foramen mentale; het geven van instructie/voorlichting mondhygiëne; de postoperatieve nazorg gedurende twee weken inclusief hechtingen verwijderen.',
        requiresTeethNumbers: true,
        isFirstElement: true,
        followUpCode: 'H39'
    },
    {
        code: 'H39',
        description: 'Uitvoeren volgende autotransplantaat, in dezelfde zitting',
        points: 15.9,
        rate: 120.62,
        explanation: 'Transplantaat van volgende tand of kies in dezelfde zitting. Deze prestatie kan alleen gedeclareerd worden indien volgend op H38 in dezelfde zitting.',
        requiresTeethNumbers: true,
        validWithCodes: ['H38']
    }
];
// D. Minor Surgical Procedures
export const MINOR_PROCEDURES = [
    {
        code: 'H40',
        description: 'Corrigeren van de vorm van de kaak, per kaak',
        points: 9,
        rate: 68.28,
        explanation: 'Correctie processus alveolaris. Als zelfstandige verrichting, inclusief hechten en wondtoilet.',
        requiresJaw: true
    },
    {
        code: 'H41',
        description: 'Verwijderen van het lipbandje of tongriempje',
        points: 6,
        rate: 45.52,
        explanation: 'Frenulum extirpatie. Inclusief hechten en wondtoilet.',
        requiresJaw: true
    }
];
// E. Root Apex Procedures
export const ROOT_PROCEDURES = [
    {
        code: 'H42',
        description: 'Wortelpuntoperatie, per tandwortel, zonder afsluiting',
        points: 12,
        rate: 91.04,
        explanation: 'Het verrichten van een apexresectie na een endodontische behandeling; maximaal twee apices per element in rekening te brengen; inclusief hechten en wondtoilet.',
        requiresTeethNumbers: true,
        maxRoots: 2
    },
    {
        code: 'H43',
        description: 'Wortelpuntoperatie, per tandwortel, met ante of retrograde afsluiting',
        points: 16,
        rate: 121.38,
        explanation: 'Het verrichten van een apexresectie na een endodontische behandeling; maximaal twee apices per element in rekening te brengen; inclusief hechten en wondtoilet.',
        requiresTeethNumbers: true,
        maxRoots: 2
    },
    {
        code: 'H44',
        description: 'Primaire antrumsluiting',
        points: 11,
        rate: 83.45,
        explanation: 'Het zodanig hechten dat de randen van het slijmvlies zonder spanning aansluiten; inclusief hechten en wondtoilet.',
        requiresTeethNumbers: true
    },
    {
        code: 'H59',
        description: 'Behandeling kaakbreuk, per kaak',
        points: 14,
        rate: 106.21,
        explanation: 'Fractuur van processus alveolaris. Als zelfstandige verrichting, inclusief hechten en wondtoilet.',
        requiresJaw: true
    }
];
// F. Cyst Operations
export const CYST_OPERATIONS = [
    {
        code: 'H60',
        description: 'Marsupialisatie',
        points: 14,
        rate: 106.21,
        explanation: 'Inclusief hechten en wondtoilet.',
        requiresTeethNumbers: true
    },
    {
        code: 'H65',
        description: 'Primaire sluiting',
        points: 27,
        rate: 204.83,
        explanation: 'Inclusief hechten en wondtoilet.',
        requiresTeethNumbers: true
    }
];
// G. Corrections of Prosthetic Part
export const PROSTHETIC_CORRECTIONS = [
    {
        code: 'H70',
        description: 'Lappige fibromen, Schlotterkamm, tubercorrectie e.d., enkelzijdig per kaak',
        points: 14,
        rate: 106.21,
        explanation: 'Inclusief hechten en wondtoilet.',
        requiresJaw: true
    },
    {
        code: 'H75',
        description: 'Lappige fibromen, Schlotterkamm, tubercorrectie e.d., dubbelzijdig per kaak',
        points: 27,
        rate: 204.83,
        explanation: 'Inclusief hechten en wondtoilet.',
        requiresJaw: true
    },
    {
        code: 'H80',
        description: 'Alveolotomie torus, vergelijkbare praeprothetische botcorrecties, enkelzijdig per kaak',
        points: 19,
        rate: 144.14,
        explanation: 'Inclusief hechten en wondtoilet.',
        requiresJaw: true
    },
    {
        code: 'H85',
        description: 'Alveolotomie torus, vergelijkbare praeprothetische botcorrecties, dubbelzijdig per kaak',
        points: 32,
        rate: 242.77,
        explanation: 'Inclusief hechten en wondtoilet.',
        requiresJaw: true
    }
];
// Export all H-codes
export const H_CODES = [
    ...BASIC_PROCEDURES,
    ...COMPLEX_PROCEDURES,
    ...AUTOTRANSPLANTATION,
    ...MINOR_PROCEDURES,
    ...ROOT_PROCEDURES,
    ...CYST_OPERATIONS,
    ...PROSTHETIC_CORRECTIONS
];
