'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Users, Search, ArrowRight } from 'lucide-react';

interface QuickFindDemoProps {
  onOpenQuickFind: (mode: 'single' | 'combi', preset?: any) => void;
}

export default function QuickFindDemo({ onOpenQuickFind }: QuickFindDemoProps) {
  const [activeTab, setActiveTab] = useState<'examples' | 'features'>('examples');

  const examples = [
    {
      title: 'Single Appointment',
      description: 'Find a slot for a dental cleaning',
      icon: <User className="h-6 w-6" />,
      details: [
        'Patient: John Smith',
        'Treatment: Dental cleaning',
        'Duration: 30 minutes',
        'Practitioner: Dr. Johnson',
        'Search: Next 7 days'
      ],
      mode: 'single' as const,
      preset: {
        patientId: 'demo-patient-1',
        type: 'Dental cleaning',
        duration: 30,
        practitionerId: 'demo-practitioner-1'
      }
    },
    {
      title: 'Combination Appointment',
      description: 'Schedule cleaning + check-up with different practitioners',
      icon: <Users className="h-6 w-6" />,
      details: [
        'Patient: Sarah Wilson',
        'Appointment 1: Dental cleaning (30min) with Dr. Smith',
        'Appointment 2: Check-up (15min) with Dr. Johnson',
        'Search: Next 14 days',
        'Sequential scheduling'
      ],
      mode: 'combi' as const,
      preset: {
        patientId: 'demo-patient-2',
        appointments: [
          {
            type: 'Dental cleaning',
            duration: 30,
            practitionerId: 'demo-practitioner-1',
            order: 1
          },
          {
            type: 'Check-up',
            duration: 15,
            practitionerId: 'demo-practitioner-2',
            order: 2
          }
        ]
      }
    },
    {
      title: 'Emergency Slot',
      description: 'Find immediate availability for urgent treatment',
      icon: <Clock className="h-6 w-6" />,
      details: [
        'Patient: Mike Davis',
        'Treatment: Emergency treatment',
        'Duration: 45 minutes',
        'Search: Today only',
        'Any available practitioner'
      ],
      mode: 'single' as const,
      preset: {
        patientId: 'demo-patient-3',
        type: 'Emergency treatment',
        duration: 45,
        searchDays: 1,
        searchStartTime: '08:00',
        searchEndTime: '18:00'
      }
    }
  ];

  const features = [
    {
      title: 'Smart Search',
      description: 'Intelligent algorithm finds optimal time slots',
      icon: <Search className="h-5 w-5" />
    },
    {
      title: 'Leave Integration',
      description: 'Respects practitioner leave and blocked times',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      title: 'Multi-Practitioner',
      description: 'Schedule with different practitioners in sequence',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Flexible Duration',
      description: 'Customize appointment lengths as needed',
      icon: <Clock className="h-5 w-5" />
    }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-6 w-6 text-blue-600" />
          Quick Find Empty Spot - Demo & Examples
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <Button
            variant={activeTab === 'examples' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('examples')}
          >
            Example Scenarios
          </Button>
          <Button
            variant={activeTab === 'features' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('features')}
          >
            Key Features
          </Button>
        </div>

        {activeTab === 'examples' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Click on any example below to see how the Quick Find feature works with different scenarios:
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {examples.map((example, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-blue-600">
                        {example.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{example.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{example.description}</p>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      {example.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-center gap-2 text-xs text-gray-700">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          {detail}
                        </div>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => onOpenQuickFind(example.mode, example.preset)}
                    >
                      Try This Example
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              The Quick Find feature provides powerful scheduling capabilities:
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {features.map((feature, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 mt-0.5">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{feature.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">How It Works</h4>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  <span>Select patient and appointment details</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  <span>Configure search criteria (date range, time window)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  <span>System searches through available time slots</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">4</Badge>
                  <span>Review results and select optimal time</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">5</Badge>
                  <span>Appointments are automatically scheduled</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 