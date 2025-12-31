import { LegacyDentalCode } from './types';

export const ECodes: LegacyDentalCode[] = [
  {
    code: 'E01',
    description: 'Consult voor second opinion',
    points: 7,
    rate: 53.11,
    section: 'E',
    subSection: 'GENERAL',
    patientType: 'ALL',
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: false,
      notes: [
        'Consult op verzoek van tandarts of specialist',
        'Inclusief bestudering van documentatie',
        'Inclusief mondonderzoek',
        'Inclusief schriftelijke rapportage'
      ]
    }
  },
  {
    code: 'E02',
    description: 'Uitgebreid wortelkanaalbehandelingsoverleg',
    points: 5.5,
    rate: 41.73,
    section: 'E',
    subSection: 'GENERAL',
    patientType: 'ALL',
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: false,
      notes: [
        'Overleg met verwijzende tandarts',
        'Inclusief bestudering van documentatie',
        'Inclusief mondonderzoek',
        'Inclusief schriftelijke rapportage'
      ]
    }
  },
  {
    code: 'E03',
    description: 'Beoordelen trauma na tandheelkundig ongeval',
    points: 5.5,
    rate: 41.73,
    section: 'E',
    subSection: 'GENERAL',
    patientType: 'ALL',
    requirements: {
      category: 'ENDODONTICS',
      isTimeDependent: false,
      requiresTooth: true,
      requiresJaw: false,
      requiresSurface: false,
      perElement: true,
      notes: [
        'Uitgebreide beoordeling van een of twee beschadigde tanden of kiezen (trauma) na een tandheelkundig ongeval',
        'Niet in combinatie met C003, E05 en E02 in rekening te brengen',
        'Deze prestatie kan per zorgaanbieder per twee beschadigde elementen in rekening worden gebracht met een maximum van zes elementen per ongeval'
      ],
      incompatibleWith: ['C003', 'E05', 'E02']
    }
  },
  {
    code: 'E04',
    description: 'Toeslag voor kosten bij gebruik van roterende nikkel-titanium instrumenten',
    points: 0,
    rate: 59.92,
    section: 'E',
    subSection: 'GENERAL',
    patientType: 'ALL',
    requirements: {
      category: 'ENDODONTICS',
      isTimeDependent: false,
      requiresTooth: false,
      requiresJaw: false,
      requiresSurface: false,
      perElement: false,
      notes: [
        'Bij eenmalig gebruik per behandeling te berekenen',
        'Alleen in combinatie met de codes E13, E14, E16, E17, E54, E61, E77, U05, U06, U25 en U35 in rekening te brengen'
      ],
      applicableWith: ['E13', 'E14', 'E16', 'E17', 'E54', 'E61', 'E77', 'U05', 'U06', 'U25', 'U35']
    }
  },
  {
    code: 'E05',
    description: 'Onderzoek ten behoeve van de uitvoering van een complexe endodontische behandeling van een verwezen patiënt',
    points: 13.4,
    rate: 101.66,
    section: 'E',
    subSection: 'GENERAL',
    patientType: 'ALL',
    requirements: {
      category: 'ENDODONTICS',
      isTimeDependent: false,
      requiresTooth: false,
      requiresJaw: false,
      requiresSurface: false,
      perElement: false,
      notes: [
        'Ongeacht het aantal zittingen',
        'Eenmaal per complexe endodontische behandeling (CEB II of III) in rekening te brengen bij een verwezen patiënt',
        'Deze prestatie mag niet in rekening worden gebracht indien voor de endodontische behandeling wordt verwezen naar een andere zorgverlener',
        'Niet in combinatie met code C002, C003, E02, E77 en E78 in rekening te brengen'
      ],
      includes: [
        'het zo nodig aanmaken van een patiëntendossier',
        'het zo nodig opvragen van röntgenfoto\'s',
        'het afnemen van een medische anamnese',
        'het afnemen van een specifieke pijnanamnese',
        'het beoordelen van de restauratieve en parodontale conditie van aangedane gebitselement(en)',
        'het uitvoeren van klinische sensibiliteits- en provocatietesten',
        'het opstellen en bespreken van een behandelplan en het bespreken van alternatieve opties',
        'zo nodig een schriftelijke terugrapportage aan de verwijzend tandarts',
        'het bespreken van de bevindingen met en verstrekken van uitgebreide informatie aan de patiënt, ook over alternatieve behandelopties',
        'het zo nodig voeren van overleg (telefonisch en/of schriftelijk) met de verwijzende zorgaanbieder'
      ],
      incompatibleWith: ['C002', 'C003', 'E02', 'E77', 'E78']
    }
  },
  {
    code: 'E13',
    description: 'Wortelkanaalbehandeling per element met 1 kanaal',
    points: 18,
    tariff: 136.56,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het openen van de tandholte (pulpakamer), lengte bepalen, vormgeven, irrigeren en aanbrengen van een kanaalvulling in combinatie met een wortelkanaalcement',
        'Indien de lengtebepaling elektronisch wordt uitgevoerd, dan is hiervoor aanvullend de prestatie E85 eenmaal per element in rekening te brengen'
      ]
    }
  },
  {
    code: 'E14',
    description: 'Wortelkanaalbehandeling per element met 2 kanalen',
    points: 26,
    tariff: 197.25,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het openen van de tandholte (pulpakamer), lengte bepalen, vormgeven, irrigeren en aanbrengen van een kanaalvulling in combinatie met een wortelkanaalcement',
        'Indien de lengtebepaling elektronisch wordt uitgevoerd, dan is hiervoor aanvullend de prestatie E85 eenmaal per element in rekening te brengen'
      ]
    }
  },
  {
    code: 'E16',
    description: 'Wortelkanaalbehandeling per element met 3 kanalen',
    points: 34,
    tariff: 257.94,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het openen van de tandholte (pulpakamer), lengte bepalen, vormgeven, irrigeren en aanbrengen van een kanaalvulling in combinatie met een wortelkanaalcement',
        'Indien de lengtebepaling elektronisch wordt uitgevoerd, dan is hiervoor aanvullend de prestatie E85 eenmaal per element in rekening te brengen'
      ]
    }
  },
  {
    code: 'E17',
    description: 'Wortelkanaalbehandeling per element met 4 of meer kanalen',
    points: 42,
    tariff: 318.63,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het openen van de tandholte (pulpakamer), lengte bepalen, vormgeven, irrigeren en aanbrengen van een kanaalvulling in combinatie met een wortelkanaalcement',
        'Indien de lengtebepaling elektronisch wordt uitgevoerd, dan is hiervoor aanvullend de prestatie E85 eenmaal per element in rekening te brengen'
      ]
    }
  },
  {
    code: 'E19',
    description: 'Tijdelijk afsluiten van een element na start wortelkanaalbehandeling',
    points: 3,
    tariff: 22.76,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Per element, per zitting in rekening te brengen',
        'Indien de behandeling niet in één zitting wordt voltooid mag E19 in rekening worden gebracht',
        'Dit omvat tevens het zonodig weer verwijderen van het desinfectiemiddel en het controleren van de preparatielengtes en referentiepunten in de volgende zitting',
        'Niet te declareren in combinatie met de codes E61, E62, E63, E77 en E78'
      ]
    },
    forbiddenCombinations: ['E61', 'E62', 'E63', 'E77', 'E78']
  },
  {
    code: 'E31',
    description: 'Microchirurgische wortelkanaalbehandeling snij-/hoektand',
    points: 20,
    tariff: 151.73,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het uitvoeren van een flap, het toegankelijk maken van de wortelpunt d.m.v. een osteo-ectomie, het verwijderen van ontstekingsweefsel en het aanbrengen van hechtingen',
        'De verrichtingen zijn exclusief het gebruik van de operatiemicroscoop (E86) en het gebruiksklaar maken van de praktijkruimte (E87)'
      ]
    }
  },
  {
    code: 'E32',
    description: 'Microchirurgische wortelkanaalbehandeling premolaar',
    points: 28,
    tariff: 212.42,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het uitvoeren van een flap, het toegankelijk maken van de wortelpunt d.m.v. een osteo-ectomie, het verwijderen van ontstekingsweefsel en het aanbrengen van hechtingen',
        'De verrichtingen zijn exclusief het gebruik van de operatiemicroscoop (E86) en het gebruiksklaar maken van de praktijkruimte (E87)'
      ]
    }
  },
  {
    code: 'E33',
    description: 'Microchirurgische wortelkanaalbehandeling molaar',
    points: 36,
    tariff: 273.11,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het uitvoeren van een flap, het toegankelijk maken van de wortelpunt d.m.v. een osteo-ectomie, het verwijderen van ontstekingsweefsel en het aanbrengen van hechtingen',
        'De verrichtingen zijn exclusief het gebruik van de operatiemicroscoop (E86) en het gebruiksklaar maken van de praktijkruimte (E87)'
      ]
    }
  },
  {
    code: 'E34',
    description: 'Aanbrengen retrograde vulling',
    points: 4,
    tariff: 30.35,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het aanbrengen van een retrograde restauratie (vulling in de wortelpunt, aangebracht van onderaf) van een lekvrij materiaal, per kanaal'
      ]
    }
  },
  {
    code: 'E36',
    description: 'Het trekken en terugplaatsen van een element',
    points: 14,
    tariff: 106.21,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Exclusief het eventueel sluiten van de perforatie of het aanbrengen van een retrograde vulling en exclusief het aanbrengen van een spalk'
      ]
    }
  },
  {
    code: 'E37',
    description: 'Kijkoperatie',
    points: 12,
    tariff: 91.04,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Diagnostische flap: kijkoperatie ter inspectie van de wortel om te beoordelen of er sprake is van wortelfracturen, perforaties en botdefecten die aanleiding zijn voor extractie'
      ]
    }
  },
  {
    code: 'E40',
    description: 'Directe pulpa-overkapping',
    points: 5,
    tariff: 37.93,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Alleen geïndiceerd bij trauma-elementen met een pulpa-expositie in niet-geïnfecteerd dentine waarbij op de dag van het trauma een hermetisch afsluitende restauratie kan worden aangebracht'
      ],
      includedServices: [
        'De materiaalkosten van calciumsilicaatcement of een vergelijkbaar biokeramisch materiaal kunnen als materiaal- en techniekkosten apart in rekening worden gebracht'
      ]
    }
  },
  {
    code: 'E42',
    description: 'Terugzetten van een verplaatst element na tandheelkundig ongeval',
    points: 2,
    tariff: 15.17,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Repositie geluxeerd element: het handmatig of met behulp van extractietang terugplaatsen van een element dat door een tandheelkundig ongeval verplaatst of van stand veranderd is'
      ]
    }
  },
  {
    code: 'E43',
    description: 'Vastzetten element d.m.v. een spalk na tandheelkundig ongeval',
    points: 4,
    tariff: 30.35,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het aanbrengen van een fixatiespalk van draad en/of composiet (inclusief etsen) om een als gevolg van een tandheelkundig ongeval los zittend element te spalken, per element',
        'Deze prestatie mag niet in rekening worden gebracht voor het herstel en/of opnieuw plaatsen van retentie-apparatuur. Hiervoor is prestatie F812 uit de Prestatie- en tariefbeschikking orthodontische zorg van toepassing'
      ]
    },
    forbiddenCombinations: ['F812']
  },
  {
    code: 'E44',
    description: 'Verwijderen spalk ten behoeve van de behandeling van een trauma-element',
    points: 1,
    tariff: 7.59,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Hieronder wordt verstaan het verwijderen van de spalk, wegslijpen composiet en het polijsten van de elementen',
        'Per element waaraan de spalk is bevestigd in rekening te brengen',
        'Deze prestatie mag niet in rekening worden gebracht ten behoeve van het verwijderen van orthodontische retentie-apparatuur, hiervoor zijn de F-codes uit de Prestatie- en tariefbeschikking orthodontische zorg aangewezen'
      ]
    }
  },
  {
    code: 'E45',
    description: 'Aanbrengen van calciumhydroxide per element',
    points: 3,
    tariff: 22.76,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: ['Per element in rekening te brengen']
    }
  },
  {
    code: 'E51',
    description: 'Verwijderen van kroon of brug',
    points: 6,
    tariff: 45.52,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: ['Het verwijderen van een kroon of brug voorafgaande aan een wortelkanaalbehandeling met de bedoeling dat deze kroon of brug wordt teruggeplaatst']
    }
  },
  {
    code: 'E52',
    description: 'Toeslag in geval van een moeilijke wortelkanaalopening',
    points: 5,
    tariff: 37.93,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Toeslag die in rekening mag worden gebracht indien sprake is van een moeilijke wortelkanaalopening veroorzaakt door aanwezigheid van een of meerdere van onderstaande complicerende factoren:',
        '- gegoten, goudporseleinen of keramische vulling',
        '- gegoten stiftopbouw',
        '- composietopbouw in de tandholte (pulpakamer)',
        '- extreme inclinatie (een hoek van meer dan 30°)',
        '- zeer beperkte mondopening (minder dan 3 cm)'
      ],
      conditions: [
        'Alleen te declareren indien sprake is van een DETI-score B en CEB klasse II of III'
      ]
    }
  },
  {
    code: 'E53',
    description: 'Toeslag verwijderen van wortelstift',
    points: 7,
    tariff: 53.11,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het verwijderen van een wortelstift van metaal, koolstofvezel, glasvezel of keramiek die in het kanaal is gecementeerd met een definitief bevestigingscement',
        'Per kanaal'
      ],
      conditions: [
        'Alleen te declareren indien sprake is van een DETI-score B en CEB klasse II of III'
      ]
    }
  },
  {
    code: 'E54',
    description: 'Toeslag verwijderen van wortelkanaalvulmateriaal',
    points: 5,
    tariff: 37.93,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Een toeslag voor het verwijderen van wortelkanaalvulmateriaal van een eerdere wortelkanaalbehandeling',
        'Per kanaal',
        'Toeslag bij de prestaties E13, E14, E16 en E17'
      ],
      conditions: [
        'Alleen te declareren indien sprake is van een DETI-score B en CEB klasse II of III'
      ]
    },
    allowedCombinations: ['E13', 'E14', 'E16', 'E17']
  },
  {
    code: 'E55',
    description: 'Toeslag behandeling dichtgeslibd of verkalkt wortelkanaal',
    points: 5,
    tariff: 37.93,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'In rekening te brengen bij kanalen die niet zichtbaar zijn op röntgenfoto en onmogelijk om in eerste instantie met een vijl # 10 te penetreren',
        'Per kanaal',
        'Toeslag bij prestaties E13, E14, E16 of E17'
      ],
      conditions: [
        'Alleen te declareren indien sprake is van een DETI-score B en CEB klasse II of III'
      ]
    },
    allowedCombinations: ['E13', 'E14', 'E16', 'E17']
  },
  {
    code: 'E56',
    description: 'Toeslag voortgezette behandeling bij weefselschade van de tandwortel',
    points: 7,
    tariff: 53.11,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Toeslag wanneer een behandeling een voortzetting is van een afgebroken behandeling door vorige of verwijzende zorgaanbieder vanwege problemen, zoals bijvoorbeeld:',
        '- verkalkte kanalen',
        '- lengteverlies door richelvorming (obstructies)',
        '- afgebroken instrumenten',
        '- apicale transportatie',
        '- perforatie',
        'Per kanaal in rekening te brengen'
      ],
      includedServices: [
        'De materiaalkosten van calciumsilicaatcement of een vergelijkbaar biokeramisch materiaal kunnen als materiaal- en techniekkosten apart in rekening worden gebracht'
      ],
      conditions: [
        'Alleen te declareren indien sprake is van een DETI-score B en CEB klasse II of III'
      ]
    }
  },
  {
    code: 'E57',
    description: 'Toeslag behandeling van element met uitzonderlijke anatomie',
    points: 5,
    tariff: 37.93,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Toeslag wanneer de wortelkanaalbehandeling wordt uitgevoerd in een element met een uitzonderlijke anatomie',
        'Per element in rekening te brengen',
        'Van toepassing als sprake is van:',
        '- C- of S- vorm',
        '- Dens in dente (tand in een tand)',
        '- Dilaceratie (een knik in de wortel ten opzichte van de kroon)',
        '- Resorptiedefect',
        '- Taurodontie (afwijkende vorm van elementen, met verdiepte pulpakamers en korte wortels)'
      ],
      includedServices: [
        'Indien sprake is van een resorptiedefect dan kunnen de materiaalkosten van calciumsilicaatcement of een vergelijkbaar biokeramisch materiaal als materiaal- en techniekkosten apart in rekening worden gebracht'
      ],
      conditions: [
        'Alleen te declareren indien sprake is van een DETI-score B en CEB klasse II of III'
      ]
    }
  },
  {
    code: 'E60',
    description: 'Geheel of gedeeltelijk weghalen van pulpaweefsel',
    points: 8,
    tariff: 60.69,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Totale of partiële pulpotomie: het verwijderen van het beschadigde en geïnfecteerde tandweefsel, het controleren van de bloeding en het aanbrengen van een hermetisch afsluitend restauratiemateriaal'
      ],
      includedServices: [
        'De materiaalkosten van calciumsilicaatcement of een vergelijkbaar biokeramisch materiaal kunnen als materiaal- en techniekkosten apart in rekening worden gebracht'
      ]
    }
  },
  {
    code: 'E61',
    description: 'Behandelen van open wortelpunt met een desinfectiemiddel, eerste zitting',
    points: 14,
    tariff: 106.21,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: true,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het openen van de tandholte (pulpakamer), lengte bepalen, vormgeven, irrigeren en het aanbrengen van een desinfectiemiddel'
      ],
      includedServices: [
        'Indien de lengtebepaling elektronisch wordt uitgevoerd, dan is hiervoor aanvullend de prestatie E85 eenmaal per element in rekening te brengen'
      ]
    }
  },
  {
    code: 'E62',
    description: 'Behandelen van open wortelpunt met een desinfectiemiddel, elke volgende zitting',
    points: 9,
    tariff: 68.28,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het opnieuw openen van de tandholte (pulpakamer), controleren van een apicale barrière, irrigeren en het verversen van een desinfectiemiddel'
      ]
    }
  },
  {
    code: 'E63',
    description: 'Toeslag voor afsluiting met calciumsilicaatcement of een vergelijkbaar biokeramisch materiaal',
    points: 7.5,
    tariff: 56.90,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Per element. Het aanbrengen van een apicale barrière met behulp van calciumsilicaatcement of een vergelijkbaar biokeramisch materiaal, inclusief extraradiculaire matrix van bijv. calciumsulfaat',
        'E63 kan als toeslag gedeclareerd worden bij prestaties E13 t/m E17'
      ],
      includedServices: [
        'De materiaalkosten van calciumsilicaatcement of een vergelijkbaar biokeramisch materiaal kunnen als materiaal- en techniekkosten apart in rekening worden gebracht'
      ]
    },
    allowedCombinations: ['E13', 'E14', 'E15', 'E16', 'E17']
  },
  {
    code: 'E77',
    description: 'Initiële wortelkanaalbehandeling, eerste kanaal',
    points: 10,
    tariff: 75.86,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: true,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Alleen in rekening te brengen in spoedeisende gevallen tijdens waarneming',
        'Hieronder wordt verstaan: openen tandholte (pulpakamer), extirpatie, toegankelijk maken van kanalen voor irrigatie, irrigeren en het zonodig insluiten van een desinfectiemiddel (inclusief tijdelijke afsluiting)'
      ]
    }
  },
  {
    code: 'E78',
    description: 'Initiële wortelkanaalbehandeling, elk volgend kanaal',
    points: 5,
    tariff: 37.93,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Alleen in rekening te brengen in spoedeisende gevallen tijdens waarneming',
        'Hieronder wordt verstaan: openen tandholte (pulpakamer), extirpatie, toegankelijk maken van kanalen voor irrigatie, irrigeren en het zonodig insluiten van een desinfectiemiddel (inclusief tijdelijke afsluiting)'
      ]
    }
  },
  {
    code: 'E85',
    description: 'Elektronische lengtebepaling',
    points: 2.5,
    tariff: 18.97,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: ['Per element in rekening te brengen']
    }
  },
  {
    code: 'E86',
    description: 'Gebruik operatiemicroscoop bij wortelkanaalbehandeling',
    points: 13.5,
    tariff: 102.42,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Per wortelkanaalbehandeling in rekening te brengen, tenzij er sprake is van verwijzing naar een andere mondzorgaanbieder (praktijk) om de wortelkanaalbehandeling voort te zetten',
        'Deze andere mondzorgaanbieder (praktijk) mag de prestatie ook per wortelkanaalbehandeling in rekening brengen'
      ]
    }
  },
  {
    code: 'E87',
    description: 'Gebruiksklaar maken van praktijkruimte voor microchirurgische wortelkanaalbehandeling',
    points: 10,
    tariff: 75.86,
    isTimeDependent: false,
    requiresTooth: false,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: false,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het voor chirurgische behandeling van het wortelkanaal gereed maken van de praktijkruimte in verband met de vereiste steriliteit',
        'Uitsluitend in rekening te brengen indien bijzondere en specifieke maatregelen worden toegepast zoals het geheel afdekken van de patiënt of speciale kleding voor de operateur en assistente',
        'Alleen in combinatie met E31 t/m E37'
      ]
    },
    allowedCombinations: ['E31', 'E32', 'E33', 'E34', 'E35', 'E36', 'E37']
  },
  {
    code: 'E88',
    description: 'Opvullen van de pulpakamer en afsluiten van de kanaalingangen',
    points: 10,
    tariff: 75.86,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het aanbrengen van een diepe vulling, al dan niet in combinatie met een wortelstift, om de kanaalingangen af te sluiten en de pulpakamer op te vullen',
        'Hiermee wordt voldoende houvast gecreëerd voor de hierop aan te brengen vulling en wordt de tand of kies versterkt'
      ]
    }
  },
  {
    code: 'E90',
    description: 'Inwendig bleken, eerste zitting',
    points: 8,
    tariff: 60.69,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: true,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het verwijderen van vulmateriaal uit de tandholte (pulpakamer) en het coronale deel van het wortelkanaal, het aanbrengen een lekvrijonderlaag en het insluiten van bleekmateriaal',
        'Per element in rekening te brengen'
      ]
    }
  },
  {
    code: 'E95',
    description: 'Inwendig bleken, elke volgende zitting',
    points: 3,
    tariff: 22.76,
    isTimeDependent: false,
    requiresTooth: true,
    requiresJaw: false,
    requiresSurface: false,
    isPerElement: true,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Het verwijderen van vulmateriaal uit de tandholte (pulpakamer) en het coronale deel van het wortelkanaal, het aanbrengen een lekvrijonderlaag en het insluiten van bleekmateriaal',
        'Per element in rekening te brengen'
      ]
    }
  },
  {
    code: 'E97',
    description: 'Uitwendig bleken per kaak',
    points: 12.5,
    tariff: 94.83,
    isTimeDependent: false,
    requiresTooth: false,
    requiresJaw: true,
    requiresSurface: false,
    isPerElement: false,
    isFirstElement: false,
    category: 'ENDODONTICS',
    requirements: {
      notes: [
        'Afdrukken, plaatsen bleekhoesje en gebruiksinstructie',
        'Ongeacht het aantal elementen per kaak'
      ]
    }
  }
]; 