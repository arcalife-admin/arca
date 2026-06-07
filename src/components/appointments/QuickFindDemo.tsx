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
      title: 'Programare simplă',
      description: 'Găsiți un interval pentru o curățare dentară',
      icon: <User className="h-6 w-6" />,
      details: [
        'Pacient: John Smith',
        'Tratament: Curățare dentară',
        'Durată: 30 minute',
        'Practician: Dr. Johnson',
        'Căutare: Următoarele 7 zile'
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
      title: 'Programare combinată',
      description: 'Programați curățare + control cu practicieni diferiți',
      icon: <Users className="h-6 w-6" />,
      details: [
        'Pacient: Sarah Wilson',
        'Programare 1: Curățare dentară (30 min) cu Dr. Smith',
        'Programare 2: Control (15 min) cu Dr. Johnson',
        'Căutare: Următoarele 14 zile',
        'Programare secvențială'
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
      title: 'Interval de urgență',
      description: 'Găsiți disponibilitate imediată pentru tratament urgent',
      icon: <Clock className="h-6 w-6" />,
      details: [
        'Pacient: Mike Davis',
        'Tratament: Tratament de urgență',
        'Durată: 45 minute',
        'Căutare: Doar astăzi',
        'Orice practician disponibil'
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
      title: 'Căutare inteligentă',
      description: 'Algoritmul găsește automat intervalele orare optime',
      icon: <Search className="h-5 w-5" />
    },
    {
      title: 'Integrare concedii',
      description: 'Respectă concediile și intervalele blocate ale practicienilor',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      title: 'Mai mulți practicieni',
      description: 'Programați secvențial cu practicieni diferiți',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Durată flexibilă',
      description: 'Personalizați durata programărilor după necesități',
      icon: <Clock className="h-5 w-5" />
    }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-6 w-6 text-blue-600" />
          Găsire rapidă interval liber — Demo și exemple
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
            Scenarii exemplu
          </Button>
          <Button
            variant={activeTab === 'features' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('features')}
          >
            Funcționalități cheie
          </Button>
        </div>

        {activeTab === 'examples' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Faceți clic pe orice exemplu de mai jos pentru a vedea cum funcționează Găsirea rapidă în diferite scenarii:
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
                      Încercați acest exemplu
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
              Funcția Găsire rapidă oferă capabilități avansate de programare:
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
              <h4 className="font-semibold text-sm mb-2">Cum funcționează</h4>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  <span>Selectați pacientul și detaliile programării</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  <span>Configurați criteriile de căutare (interval de date, fereastră orară)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  <span>Sistemul caută intervalele orare disponibile</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">4</Badge>
                  <span>Examinați rezultatele și selectați intervalul optim</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">5</Badge>
                  <span>Programările sunt create automat</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
