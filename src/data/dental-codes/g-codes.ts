import { LegacyDentalCode } from './types';

// Section G - Jaw Treatment (Behandeling Kauwstelsel)
// This section excludes anesthesia and radiological procedures

// A.1 OPD Examination/Diagnostics (Onderzoek/diagnostiek bij OPD)
export const OPD_DIAGNOSTICS: LegacyDentalCode[] = [
  {
    code: 'G21',
    description: 'Functieonderzoek kauwstelsel',
    points: 18,
    rate: 136.56,
    explanation: 'Naar aanleiding van een klacht, suspect voor niet-dentoalveolaire orofaciale pijn en/of disfunctie (OPD). Onder functieonderzoek kauwstelsel wordt verstaan: het registreren van de klacht; het afnemen van een medische, dentale en psychosociale anamnese; het doen van bewegingsonderzoek (het meten van de maximale bewegingsuitslagen, het rapporteren van pijn (van gewricht of spier), het rapporteren van gewrichtsgeluiden (knappen en/of crepitatie), orthopedische testen, palpatie kauwmusculatuur en kaak gewricht); het schriftelijk vastleggen van de bevindingen; het formuleren van een werkdiagnose.',
    isTimeDependent: false,
    category: 'G'
  },
  {
    code: 'G22',
    description: 'Verlengd onderzoek OPD',
    points: 36,
    rate: 273.11,
    explanation: 'Het verlengd onderzoek OPD is een multidimensionaal onderzoek ten behoeve van diagnostiek van (mogelijk) complexe orofaciale pijn en/of disfunctie. Inclusief: onderzoek naar mogelijke dentoalveolaire oorzaak; het volledige DC-TMD as1 onderzoek; het afnemen en beoordelen van de volledige DC-TMD as2 vragenlijsten of daaraan equivalente vragenlijsten; indien nodig overleg met de huisarts, medisch specialist of andere voor de OPD relevante zorgverlener; het formuleren en bespreken van de diagnose en bepaling van beleid met patiënt.',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['G21']
  },
  {
    code: 'G23',
    description: 'Spieractiviteitsmeting en registratie',
    points: 16,
    rate: 121.38,
    explanation: 'Aanvullend onderzoek na het Verlengd onderzoek OPD met gebruikmaking van specifieke apparatuur.',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['G22']
  }
];

// A.2 OPD Therapy A (non-complex) or B (complex)
export const OPD_THERAPY: LegacyDentalCode[] = [
  {
    code: 'G41',
    description: 'Consult OPD-therapie A (niet-complex)',
    points: 10.5,
    rate: 79.66,
    explanation: 'Therapie bij niet-complexe OPD, per zitting. Inclusief counceling en begeleiding van de OPD A. Indien van toepassing omvat deze prestatie ook: het aanleren van oefeningen en automassage; controle en correctie van een stabilisatieopbeetplaat; adviezen betreffende het gebruik van (pijn)medicatie; reponeren bij acute blokkade van het kaakgewricht.',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['G21', 'G22']
  },
  {
    code: 'G62',
    description: 'Stabilisatieopbeetplaat',
    points: 27,
    rate: 204.83,
    explanation: 'Uitsluitend in rekening te brengen indien voorafgaand het functieonderzoek kauwstelsel (G21) en/of verlengd onderzoek OPD (G22) heeft plaatsgevonden. Inclusief: het maken van (digitale) afdrukken; de beetregistratie (ongeacht de methode); het plaatsen van de spalk; kleine correcties; het geven van eenmalige instructie omtrent het gebruik.',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['G21', 'G22']
  },
  {
    code: 'G47',
    description: 'Evaluatie/herbeoordeling na OPD therapie A',
    points: 12,
    rate: 91.04,
    explanation: 'Evaluatieonderzoek na therapie bij OPD A. Uitsluitend in rekening te brengen indien voorafgaand het functieonderzoek kauwstelsel (G21) en/of verlengd onderzoek OPD (G22) heeft plaatsgevonden. Inclusief: hermeting van de afwijkende waarden uit het functieonderzoek kauwstelsel; bespreking van de bevindingen met de patiënt en schriftelijke registratie; planning van nazorg.',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['G21', 'G22']
  },
  {
    code: 'G43',
    description: 'Consult OPD-therapie B (complex)',
    points: 20.2,
    rate: 153.25,
    explanation: 'Therapie bij complexe OPD, per zitting. Bij complexe OPD is sprake van problematiek die interacteert op meerdere gebieden (meerdere assen). Dit vereist een multidimensionele en gecoördineerde behandeling. Inclusief counseling en begeleiding van de OPD B. Indien van toepassing omvat deze prestatie ook: het geven van pijneducatie; het geven van gedragsadviezen; controle, instructies gebruik en evaluatie van een stabilisatieopbeetplaat en kleine correcties; het voorschrijven van receptgebonden medicatie; het aanleren van oefeningen en automassage; biofeedback technieken en sensomotorische oefentherapie, zo nodig met individuele hulpmiddelen.',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['G22']
  },
  {
    code: 'G44',
    description: 'Therapeutische injectie',
    points: 11,
    rate: 83.45,
    explanation: 'Per gelaatshelft. Spierinjectie of kaakgewrichtsinjectie met een medicament. De prestatie kan uitsluitend gedeclareerd worden indien: voorafgaand het verlengd onderzoek OPD heeft plaatsgevonden (G22); de OPD als complex is aangemerkt; en het een zelfstandige verrichting betreft die in een aparte zitting plaatsvindt.',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['G22']
  },
  {
    code: 'G46',
    description: 'Consult voor instructie apparatuur (eenmalig)',
    points: 8,
    rate: 60.69,
    explanation: 'Eenmalig consult voor instructie bij gebruik van een hulpmiddel voor mobiliteits-bevorderende oefentherapie. Eventuele vervolgconsulten en behandelingen met het betreffende hulpmiddel vallen onder prestatie G43 en kunnen niet apart gedeclareerd worden.',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['G22']
  },
  {
    code: 'G48',
    description: 'Evaluatie/herbeoordeling na OPD therapie B',
    points: 20,
    rate: 151.73,
    explanation: 'Evaluatieonderzoek na therapie bij OPD B. Inclusief: hermeting van de bevindingen uit het Verlengd onderzoek OPD (G22); bespreking van de bevindingen met de patiënt en schriftelijke registratie daarvan; planning van nazorg; en schriftelijke rapportage aan verwijzers en medebehandelaars.',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['G22']
  }
];

// B. Bite Registration (Beetregistraties)
export const BITE_REGISTRATION: LegacyDentalCode[] = [
  {
    code: 'G10',
    description: 'Niet-standaard beetregistratie',
    points: 15,
    rate: 113.80,
    explanation: 'Extra-oraal, quick mount. Hieronder wordt verstaan: het overbrengen van de positie van de bovenkaak in de schedel ten opzichte van de arbitraire intercondylaire as naar een middelwaarde articulator met behulp van face- of earbow, exclusief modellen.',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['R24', 'R34'],
    requirements: {
      conditions: ['Minimum 2 crowns required']
    }
  },
  {
    code: 'G11',
    description: 'Scharnierasbepaling',
    points: 15,
    rate: 113.80,
    explanation: 'Met behulp van hinge-axis locator en bepalen derde referentiepunt.',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['G10']
  },
  {
    code: 'G12',
    description: 'Centrale relatiebepaling',
    points: 14,
    rate: 106.21,
    explanation: 'Het ondermodel tegenover het bovenmodel ingipsen met behulp van drie wasbeten. Hierbij wordt uitgegaan van splitcast in het bovenmodel.',
    isTimeDependent: false,
    category: 'G'
  },
  {
    code: 'G13',
    description: 'Protrale/laterale bepalingen',
    points: 10,
    rate: 75.86,
    explanation: 'Lateraal links en rechts en protraal, waarna de condylushelling en de Bennethoek worden ingesteld.',
    isTimeDependent: false,
    category: 'G'
  },
  {
    code: 'G14',
    description: 'Instellen volledig instelbare articulator, pantograaf en registratie',
    points: 90,
    rate: 682.78,
    explanation: 'Bijvoorbeeld Stuartregistratie, Denar.',
    isTimeDependent: false,
    category: 'G'
  },
  {
    code: 'G15',
    description: 'Toeslag voor het behouden van beethoogte',
    points: 5,
    rate: 37.93,
    explanation: 'Bijvoorbeeld door kunsthars of stents mal of het laten staan van occlusiedeel op element en antagonist.',
    isTimeDependent: false,
    category: 'G'
  },
  {
    code: 'G16',
    description: 'Therapeutische positiebepaling',
    points: 5,
    rate: 37.93,
    explanation: 'Opnieuw bepalen van de therapeutische positie van de onderkaak ten opzichte van de bovenkaak door middel van een wasbeet en opnieuw ingipsen.',
    isTimeDependent: false,
    category: 'G'
  },
  {
    code: 'G20',
    description: 'Beetregistratie intra-oraal',
    points: 10,
    rate: 75.86,
    explanation: 'Bijvoorbeeld pijlpuntregistratie.',
    isTimeDependent: false,
    category: 'G'
  }
];

// C. Snoring and Sleep Disorders Device (Snurk- en slaapstoornisbeugel)
export const SLEEP_DEVICE: LegacyDentalCode[] = [
  {
    code: 'G71',
    description: 'Apparaat voor snurk- en slaapstoornissen (MRA)',
    points: 50,
    rate: 379.32,
    explanation: 'Inclusief: het maken van (digitale) afdrukken; de registratie (ongeacht de methode); het plaatsen van het apparaat, inclusief het aanbrengen van kleine correcties en het geven van bijbehorende instructies omtrent het gebruik; nazorg gedurende twee maanden na plaatsing van het MRA.',
    isTimeDependent: false,
    category: 'G'
  },
  {
    code: 'G72',
    description: 'Controlebezoek MRA',
    points: 5,
    rate: 37.93,
    explanation: 'Controlebezoek, al dan niet met kleine correcties aan het MRA of andere kleine verrichtingen. Uitsluitend in rekening te brengen twee maanden nadat het MRA is geplaatst (G71).',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['G71']
  },
  {
    code: 'G73',
    description: 'Reparatie MRA met afdruk',
    points: 8,
    rate: 60.69,
    explanation: 'In het geval er voor het repareren van het MRA (code G73) opnieuw moet worden geregistreerd, is het vervaardigen en declareren van een nieuwe MRA mogelijk (code G71 plus techniekkosten).',
    isTimeDependent: false,
    category: 'G',
    validWithCodes: ['G71']
  }
];

// D. Myofunctional Devices (Myofunctionele apparatuur)
export const MYOFUNCTIONAL: LegacyDentalCode[] = [
  {
    code: 'G74',
    description: 'Plaatsen van myofunctionele apparatuur',
    points: 13.5,
    rate: 102.42,
    explanation: 'Het bij aanvang van de myofunctionele therapie plaatsen van myofunctionele apparatuur en een introductie over het gebruik van de apparatuur. Deze prestatie omvat tevens de uitleg over het afwijkende mond- en tonggedrag en uitgebreide instructie over het dragen van de myofunctionele apparatuur.',
    isTimeDependent: false,
    category: 'G'
  },
  {
    code: 'G76',
    description: 'Consult myofunctionele therapie',
    points: 3.8,
    rate: 28.83,
    explanation: 'Therapie met behulp van myofunctionele apparatuur voor het afleren van afwijkende mond- en tonggewoonten. Deze therapie omvat de uitleg over het afwijkende mond- en tonggedrag, instructie over het dragen van de myofunctionele apparatuur en bijbehorende controle van het dragen van de apparatuur.',
    isTimeDependent: false,
    category: 'G',
    incompatibleCodes: ['M01']
  }
];

// Export all G-codes
export const G_CODES = [
  ...OPD_DIAGNOSTICS,
  ...OPD_THERAPY,
  ...BITE_REGISTRATION,
  ...SLEEP_DEVICE,
  ...MYOFUNCTIONAL
]; 