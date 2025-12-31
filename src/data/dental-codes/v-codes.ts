import { LegacyDentalCode } from './types';

export const VCodes: LegacyDentalCode[] = [
  {
    code: 'V10',
    description: 'Mondzorg aan huis',
    points: 4.2,
    rate: 31.86,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: false,
      notes: [
        'Exclusief vervoer',
        'Per bezoek, ongeacht aantal patiënten'
      ]
    }
  },
  {
    code: 'V20',
    description: 'Behandeling onder bijzondere omstandigheden',
    points: 6.7,
    rate: 50.83,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: false,
      notes: [
        'Behandeling van patiënten met bijzondere omstandigheden of beperkingen',
        'Toeslag per zitting'
      ]
    }
  },
  {
    code: 'V71',
    description: 'Eénvlaksvulling amalgaam',
    points: 4.2,
    rate: 31.86,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten'
      ]
    }
  },
  {
    code: 'V72',
    description: 'Tweevlaksvulling amalgaam',
    points: 6.7,
    rate: 50.83,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten'
      ]
    }
  },
  {
    code: 'V73',
    description: 'Drievlaksvulling amalgaam',
    points: 8.7,
    rate: 66.00,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten'
      ]
    }
  },
  {
    code: 'V74',
    description: 'Meervlaksvulling amalgaam',
    points: 12.7,
    rate: 96.35,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten'
      ]
    }
  },
  {
    code: 'V81',
    description: 'Eénvlaksvulling glasionomeer/glascarbomeer/compomeer',
    points: 6.2,
    rate: 47.04,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten'
      ]
    }
  },
  {
    code: 'V82',
    description: 'Tweevlaksvulling glasionomeer/glascarbomeer/compomeer',
    points: 8.7,
    rate: 66.00,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten'
      ]
    }
  },
  {
    code: 'V83',
    description: 'Drievlaksvulling glasionomeer/glascarbomeer/compomeer',
    points: 10.7,
    rate: 81.17,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten'
      ]
    }
  },
  {
    code: 'V84',
    description: 'Meervlaksvulling glasionomeer/glascarbomeer/compomeer',
    points: 14.2,
    rate: 107.73,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten'
      ]
    }
  },
  {
    code: 'V91',
    description: 'Eénvlaksvulling composiet',
    points: 8,
    rate: 60.69,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten'
      ]
    }
  },
  {
    code: 'V92',
    description: 'Tweevlaksvulling composiet',
    points: 10.5,
    rate: 79.66,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten'
      ]
    }
  },
  {
    code: 'V93',
    description: 'Drievlaksvulling composiet',
    points: 12.5,
    rate: 94.83,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten'
      ]
    }
  },
  {
    code: 'V94',
    description: 'Meervlaksvulling composiet',
    points: 16,
    rate: 121.38,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten'
      ]
    }
  },
  {
    code: 'V95',
    description: 'Volledig vormherstel tand of kies met composiet',
    points: 25,
    rate: 189.66,
    requirements: {
      category: 'SPECIAL_CARE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      notes: [
        'Inclusief etsen',
        'Inclusief afwerken en polijsten',
        'Inclusief aanbrengen van onderlaag'
      ]
    }
  },

  // Sealing codes (Fissuurlak)
  {
    code: 'V30',
    description: 'Fissuurlak eerste element',
    points: 4.5,
    rate: 34.14,
    requirements: {
      category: 'PREVENTIVE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      isFirstElement: true,
      followUpCode: 'V35',
      notes: [
        'Aanbrengen van fissuurlak op occlusiervlak',
        'Eerste element in zitting'
      ]
    }
  },
  {
    code: 'V35',
    description: 'Fissuurlak volgende element in dezelfde zitting',
    points: 2.5,
    rate: 18.97,
    requirements: {
      category: 'PREVENTIVE',
      isTimeDependent: false,
      perElement: true,
      requiresTooth: true,
      validWithCodes: ['V30'],
      sameSession: true,
      notes: [
        'Aanbrengen van fissuurlak op occlusiervlak',
        'Volgende elementen in dezelfde zitting'
      ]
    }
  }
]; 