import { LegacyDentalCode } from './types';

export const pCodes: LegacyDentalCode[] = [
  // Section A: Partial Dentures
  {
    code: 'P001',
    description: 'Partial denture of resin, 1-4 elements, per jaw',
    points: 15,
    rate: 113.80,
    requirements: {
      maxElements: 4,
      perJaw: true,
      aftercareMonths: 4
    }
  },
  {
    code: 'P002',
    description: 'Partial denture of resin, 5-13 elements, per jaw',
    points: 30,
    rate: 227.59,
    requirements: {
      minElements: 5,
      maxElements: 13,
      perJaw: true,
      aftercareMonths: 4
    }
  },
  {
    code: 'P003',
    description: 'Frame denture, 1-4 elements, per jaw',
    points: 41,
    rate: 311.04,
    requirements: {
      maxElements: 4,
      perJaw: true,
      aftercareMonths: 4,
      includesDesignAndSupports: true
    }
  },
  {
    code: 'P004',
    description: 'Frame denture, 5-13 elements, per jaw',
    points: 56,
    rate: 424.84,
    requirements: {
      minElements: 5,
      maxElements: 13,
      perJaw: true,
      aftercareMonths: 4,
      includesDesignAndSupports: true
    }
  },

  // Section B: Complete Dentures
  {
    code: 'P020',
    description: 'Complete denture upper jaw',
    points: 30,
    rate: 227.59,
    requirements: {
      jaw: 'upper',
      aftercareMonths: 4
    }
  },
  {
    code: 'P021',
    description: 'Complete denture lower jaw',
    points: 40,
    rate: 303.46,
    requirements: {
      jaw: 'lower',
      aftercareMonths: 4
    }
  },
  {
    code: 'P022',
    description: 'Complete denture upper and lower jaw',
    points: 65,
    rate: 493.12,
    requirements: {
      jaw: 'both',
      aftercareMonths: 4
    }
  },
  {
    code: 'P023',
    description: 'Temporary complete denture, per jaw',
    points: 20,
    rate: 151.73,
    requirements: {
      perJaw: true,
      isTemporary: true,
      aftercareMonths: 4,
      purpose: 'bridging period until permanent prosthetic'
    }
  },

  // Section C: Additional Fees
  {
    code: 'P040',
    description: 'Individual impression for complete denture',
    points: 10.8,
    rate: 81.93,
    requirements: {
      applicableWith: ['P020', 'P021', 'P022', 'P023']
    }
  },
  {
    code: 'P041',
    description: 'Individual impression for partial resin denture',
    points: 5,
    rate: 37.93,
    requirements: {
      applicableWith: ['P001', 'P002']
    }
  },
  {
    code: 'P042',
    description: 'Bite registration with specific equipment',
    points: 10,
    rate: 75.86,
    requirements: {
      applicableWith: ['P020', 'P022'],
      purpose: 'determine jaw relationship'
    }
  },
  {
    code: 'P043',
    description: 'Front setup and/or bite determination in separate session',
    points: 6,
    rate: 45.52,
    requirements: {
      applicableWith: ['P002', 'P004', 'P020', 'P022'],
      separateSession: true,
      maxOccurrences: 1
    }
  },
  {
    code: 'P044',
    description: 'Fee for severely resorbed jaw, per jaw',
    points: 13.5,
    rate: 102.42,
    requirements: {
      applicableWith: ['P020', 'P021', 'P022'],
      condition: 'severely resorbed jaw'
    }
  },
  {
    code: 'P045',
    description: 'Fee for immediate denture',
    points: 2.5,
    rate: 18.97,
    requirements: {
      applicableWith: ['P001', 'P002', 'P003', 'P004', 'P020', 'P021', 'P022', 'P023', 'P071', 'P072'],
      maxElements: 8,
      excludes: ['extractions', 'fillings']
    }
  },
  {
    code: 'P046',
    description: 'Fee per element in overdenture',
    points: 8,
    rate: 60.69,
    requirements: {
      applicableWith: ['P001', 'P002', 'P003', 'P004', 'P020', 'P021', 'P022', 'P023', 'P071', 'P072'],
      includesPreparation: true
    }
  },
  {
    code: 'P047',
    description: 'Fee for cast anchor in partial resin denture',
    points: 3,
    rate: 22.76,
    requirements: {
      applicableWith: ['P001', 'P002'],
      includesSupport: true
    }
  },
  {
    code: 'P048',
    description: 'Fee for precision attachment, per attachment',
    points: 15,
    rate: 113.80,
    requirements: {
      applicableWith: ['P003', 'P004', 'P020', 'P021', 'P022'],
      matrixAndPatrixAsOne: true
    }
  },
  {
    code: 'P049',
    description: 'Fee for telescopic crown with precision attachment',
    points: 10,
    rate: 75.86,
    requirements: {
      applicableWith: ['P003', 'P004', 'P020', 'P021', 'P022'],
      purpose: 'extra support and retention'
    }
  },

  // Section D: Adjustments to Existing Dentures
  {
    code: 'P060',
    description: 'Tissue conditioning complete denture, per jaw',
    points: 7,
    rate: 53.11,
    requirements: {
      perJaw: true,
      isTemporaryLining: true
    }
  },
  {
    code: 'P061',
    description: 'Tissue conditioning partial or frame denture, per jaw',
    points: 7,
    rate: 53.11,
    requirements: {
      perJaw: true,
      isTemporaryLining: true
    }
  },
  {
    code: 'P062',
    description: 'Reline complete denture, indirect method, per jaw',
    points: 14.1,
    rate: 106.97,
    requirements: {
      perJaw: true,
      method: 'indirect'
    }
  },
  {
    code: 'P063',
    description: 'Reline complete denture, direct method, per jaw',
    points: 14.2,
    rate: 107.73,
    requirements: {
      perJaw: true,
      method: 'direct'
    }
  },
  {
    code: 'P064',
    description: 'Reline partial or frame denture, indirect method, per jaw',
    points: 12.3,
    rate: 93.31,
    requirements: {
      perJaw: true,
      method: 'indirect'
    }
  },
  {
    code: 'P065',
    description: 'Reline partial or frame denture, direct method, per jaw',
    points: 12.8,
    rate: 97.11,
    requirements: {
      perJaw: true,
      method: 'direct'
    }
  },
  {
    code: 'P066',
    description: 'Reline overdenture on natural abutments without bar dismounting, per jaw',
    points: 28,
    rate: 212.42,
    requirements: {
      perJaw: true,
      onNaturalAbutments: true
    }
  },
  {
    code: 'P067',
    description: 'Planned grinding of existing denture',
    points: 5,
    rate: 37.93,
    requirements: {
      purpose: 'bilateral balanced occlusion and articulation',
      notWithinFourMonths: true
    }
  },
  {
    code: 'P068',
    description: 'Repair complete denture without impression, per jaw',
    points: 3,
    rate: 22.76,
    requirements: {
      perJaw: true,
      noImpression: true
    }
  },
  {
    code: 'P069',
    description: 'Repair complete denture with impression, per jaw',
    points: 8,
    rate: 60.69,
    requirements: {
      perJaw: true,
      withImpression: true
    }
  },
  {
    code: 'P070',
    description: 'Repair partial or frame denture without impression, per jaw',
    points: 3,
    rate: 22.76,
    requirements: {
      perJaw: true,
      noImpression: true
    }
  },
  {
    code: 'P071',
    description: 'Repair and/or expansion of partial or frame denture with impression, per jaw',
    points: 8,
    rate: 60.69,
    requirements: {
      perJaw: true,
      withImpression: true,
      aftercareMonths: 4
    }
  },
  {
    code: 'P072',
    description: 'Expand partial or frame denture with element(s) to complete denture, with impression, per jaw',
    points: 8,
    rate: 60.69,
    requirements: {
      perJaw: true,
      withImpression: true,
      aftercareMonths: 4,
      purpose: 'conversion to complete denture'
    }
  }
]; 