import { LegacyDentalCode } from './types';

export const mCodes: LegacyDentalCode[] = [
  {
    code: 'M01',
    description: 'Preventieve voorlichting en/of instructie, per vijf minuten',
    points: 2.24166667,
    rate: 17.01,
    requirements: {
      isTimeDependent: true,
      timeUnit: 5,
      notes: [
        'Behandelduur wordt uitsluitend in eenheden van vijf minuten gedeclareerd (afronden naar dichtstbijzijnde veelvoud).',
        'Kan in combinatie met C002 worden gedeclareerd als de preventieve voorlichting/instructie meer dan vijf minuten in beslag neemt.'
      ],
      includes: [
        'Kleuren van plaque',
        'Vastleggen van de plaque-score',
        'Geven van voedingsadviezen',
        'Afnemen van voedingsanamnese',
        'Voorlichting over het afleren van negatieve gewoontes',
        'Vastleggen en analyseren van QLF-opnamen en bespreking met patiënt/ouder(s)/verzorger(s)'
      ],
      excludes: [
        'Niet te declareren voor therapie met myofunctionele apparatuur (gebruik G76).'
      ]
    }
  },
  {
    code: 'M02',
    description: 'Consult voor evaluatie van preventie, per vijf minuten',
    points: 2.24166667,
    rate: 17.01,
    requirements: {
      isTimeDependent: true,
      timeUnit: 5,
      notes: [
        'Behandelduur wordt uitsluitend in eenheden van vijf minuten gedeclareerd (afronden naar dichtstbijzijnde veelvoud).'
      ],
      includes: [
        '(Opnieuw) kleuren van plaque',
        '(Opnieuw) vastleggen van de plaque-score',
        'Bijsturen van de patiënt (of begeleiders) in eerdere instructies'
      ]
    }
  },
  {
    code: 'M03',
    description: 'Gebitsreiniging, per vijf minuten',
    points: 2.24166667,
    rate: 17.01,
    requirements: {
      isTimeDependent: true,
      timeUnit: 5,
      includes: [
        'Verwijderen van plaque of tandsteen',
        'Polijsten van tanden, kiezen, implantaten of prothese'
      ],
      notes: [
        'Behandelduur wordt uitsluitend in eenheden van vijf minuten gedeclareerd (afronden naar dichtstbijzijnde veelvoud).'
      ]
    }
  },
  {
    code: 'M05',
    description: 'Niet-restauratieve behandeling van cariës in het melkgebit',
    points: 4.5,
    rate: 34.14,
    requirements: {
      includes: [
        'Beslijpen of toegankelijk maken (slicen) van caviteit',
        'Behandelen van carieuze dentine met cariës-conserverende middelen',
        'Aanbrengen van beschermlaag',
        'Fluorideren van het melkelement',
        'Vastleggen en monitoren van cariëslaesie'
      ],
      notes: [
        'Preventieve maatregel ter voorkoming van verdere progressie van cariës.',
        'Omvat NRCT (Non-Restorative Cavity Treatment) en UCT (Ultra Conservative Treatment).'
      ]
    }
  },
  {
    code: 'M30',
    description: 'Behandeling van gevoelige tandhalzen en (preventief) toedienen medicament',
    points: 1,
    rate: 7.59,
    requirements: {
      perElement: true,
      notes: [
        'Maximaal 5 elementen met fluoride- of chloor-hexidine-producten behandelen.\nBij meer dan 5 elementen is M40 aangewezen.'
      ],
      excludes: [
        'Niet bedoeld voor gebruik van cariës-detector, retractiekoord/-gel of bloedingsstelpende materialen.'
      ]
    }
  },
  {
    code: 'M32',
    description: 'Eenvoudig bacteriologisch- of enzymatisch onderzoek',
    points: 3,
    rate: 22.76,
    requirements: {
      notes: [
        'Mag alleen in rekening worden gebracht als de test in de praktijk in aanwezigheid van de patiënt wordt uitgevoerd.'
      ],
      includes: [
        'Nemen van eenvoudig plaque- of speekselmonster',
        'Interpreteren van bacteriologische of enzymatische gegevens'
      ]
    }
  },
  {
    code: 'M40',
    description: 'Fluoridebehandeling',
    points: 2.5,
    rate: 18.97,
    requirements: {
      perJaw: true,
      includes: [
        'Polijsten'
      ],
      notes: [
        'Ook bedoeld voor behandelen van meer dan 5 elementen met fluoride of chloor-hexidine.\nVoor 5 of minder elementen: M30.'
      ]
    }
  },
  {
    code: 'M61',
    description: 'Mondbeschermer of fluoridekap',
    points: 4.5,
    rate: 34.14,
    requirements: {
      includes: [
        'Afdrukken en plaatsing (inclusief eventuele onderkaakafdruk t.b.v. occlusiefixatie)',
        '(Individueel) aangemeten mondbeschermers voor sportactiviteiten'
      ]
    }
  },
  {
    code: 'M80',
    description: 'Behandeling van witte vlekken, eerste element',
    points: 8.7,
    rate: 66.0,
    followUpCode: 'M81',
    requirements: {
      perElement: true,
      includes: [
        'Behandeling van fluorose of cariogene plekjes via micro-invasieve infiltratietechniek',
        'Inclusief etsen en afwerking'
      ],
      notes: [
        'Materiaalkosten voor de invasieve vloeistof kunnen als materiaal- en techniekkosten apart worden gedeclareerd.'
      ]
    }
  },
  {
    code: 'M81',
    description: 'Behandeling van witte vlekken, volgend element',
    points: 4.8,
    rate: 36.41,
    requirements: {
      perElement: true,
      includes: [
        'Behandeling van fluorose of cariogene plekjes via micro-invasieve infiltratietechniek',
        'Inclusief etsen en afwerking'
      ],
      notes: [
        'Materiaalkosten voor de invasieve vloeistof kunnen als materiaal- en techniekkosten apart worden gedeclareerd.'
      ]
    }
  }
]; 