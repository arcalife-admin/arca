import { LegacyDentalCode } from './types';

export const yCodes: LegacyDentalCode[] = [
  {
    code: 'Y01',
    description: 'Information provision to third parties, per five minutes',
    points: null,
    rate: 17.28,
    requirements: {
      isTimeDependent: true,
      timeUnit: 5,
      conditions: [
        'written information request from third party',
        'not part of Zvw/Wlz/Wmo/Youth law care',
        'written information provision to requester',
        'written patient consent',
        'no other service descriptions allowed'
      ],
      notApplicableFor: [
        'legally required free information',
        'patient referrals',
        'advice requests to other providers',
        'clarification requests on provided information'
      ]
    }
  },
  {
    code: 'Y02',
    description: 'Mutual service provision',
    points: null,
    rate: 17.28,
    requirements: {
      serviceType: 'dental care services',
      providerRoles: {
        executing: 'performing provider',
        commissioning: 'ordering provider'
      },
      maxRate: 'applicable maximum rates',
      billing: 'to ordering provider'
    }
  }
]; 