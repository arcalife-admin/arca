'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PhoneCallIcon,
  PhoneOutgoingIcon,
  PhoneIncomingIcon,
  PlusIcon,
  Settings,
  Users,
  BookUser,
  BarChart3,
} from 'lucide-react';
import { useCall } from '@/contexts/CallContext';

function formatCallDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const CALL_STATUS_LABELS: Record<string, string> = {
  connected: 'Conectat',
  hold: 'În așteptare',
  ringing: 'Sună',
  dialing: 'Formare număr',
  ended: 'Încheiat',
};

function SuccessModal({ action, onClose }: { action: string | null; onClose: () => void }) {
  if (!action) return null;

  const messages: Record<string, string> = {
    start_call: 'Se apelează membrul personalului...',
    save_contact: 'Contact salvat cu succes!',
    view_patient: 'Se deschide dosarul pacientului...',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4 w-[90%] max-w-sm">
        <h2 className="text-lg font-semibold text-center">Succes</h2>
        <p className="text-center text-muted-foreground">{messages[action] || 'Acțiune finalizată.'}</p>
        <Button onClick={onClose} className="w-full">Închide</Button>
      </div>
    </div>
  );
}

function EmptyCallsState({ label }: { label: string }) {
  return (
    <div className="py-8 text-center">
      <PhoneCallIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">Niciun apel {label} încă</p>
      <p className="text-xs text-gray-400 mt-1">
        Istoricul apelurilor va apărea aici după conectarea sistemului telefonic.
      </p>
    </div>
  );
}

export default function PhoneCallsPage() {
  const [actionType, setActionType] = useState<string | null>(null);
  const {
    currentCall,
    isCallInProgress,
    startCall,
    endCall,
    putOnHold,
    resumeCall,
  } = useCall();

  const openModal = (action: string) => setActionType(action);
  const closeModal = () => setActionType(null);

  const handleTestCall = (patientData: { id: string; name: string; phone: string; initials: string }) => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'startCall', patientData }, '*');
    } else {
      startCall(patientData);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <SuccessModal action={actionType} onClose={closeModal} />

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Telefon și apeluri</h1>
        <p className="mt-1 text-sm text-gray-500">
          Apelați pacienți, personal și contacte ale clinicii — farmacie, spital și furnizori
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Total apeluri</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <PhoneIncomingIcon className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Pierdute</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <PhoneIncomingIcon className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Primite</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <PhoneOutgoingIcon className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Efectuate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Active call / test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" /> Sistem apeluri
            </CardTitle>
            <CardDescription>Controale apel activ și formare număr test</CardDescription>
          </CardHeader>
          <CardContent>
            {currentCall ? (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">Apel activ</p>
                <p className="text-xs text-blue-600">{currentCall.patientName}</p>
                <p className="text-xs text-blue-600">
                  {currentCall.status === 'connected' || currentCall.status === 'hold'
                    ? formatCallDuration(currentCall.duration)
                    : CALL_STATUS_LABELS[currentCall.status] ?? currentCall.status}
                </p>
                <div className="flex gap-2 mt-2">
                  {currentCall.status === 'connected' && (
                    <Button onClick={putOnHold} size="sm" variant="outline" className="text-xs">
                      În așteptare
                    </Button>
                  )}
                  {currentCall.status === 'hold' && (
                    <Button onClick={resumeCall} size="sm" variant="outline" className="text-xs">
                      Reluare
                    </Button>
                  )}
                  <Button onClick={endCall} size="sm" variant="destructive" className="text-xs">
                    Încheie
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">Apel test pacient (demo):</p>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() =>
                      handleTestCall({
                        id: 'test-1',
                        name: 'Maria Popescu',
                        phone: '+40 721 000 001',
                        initials: 'MP',
                      })
                    }
                    size="sm"
                    variant="outline"
                    className="text-xs justify-start"
                    disabled={isCallInProgress}
                  >
                    Apel Maria Popescu
                  </Button>
                  <Button
                    onClick={() =>
                      handleTestCall({
                        id: 'test-2',
                        name: 'Ion Ionescu',
                        phone: '+40 722 000 002',
                        initials: 'II',
                      })
                    }
                    size="sm"
                    variant="outline"
                    className="text-xs justify-start"
                    disabled={isCallInProgress}
                  >
                    Apel Ion Ionescu
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent calls */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PhoneCallIcon className="w-5 h-5" /> Apeluri recente
            </CardTitle>
            <CardDescription>Istoric apeluri pacienți și contacte clinică</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Toate</TabsTrigger>
                <TabsTrigger value="missed">Pierdute</TabsTrigger>
                <TabsTrigger value="incoming">Primite</TabsTrigger>
                <TabsTrigger value="outgoing">Efectuate</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <EmptyCallsState label="recente" />
              </TabsContent>
              <TabsContent value="missed">
                <EmptyCallsState label="pierdute" />
              </TabsContent>
              <TabsContent value="incoming">
                <EmptyCallsState label="primite" />
              </TabsContent>
              <TabsContent value="outgoing">
                <EmptyCallsState label="efectuate" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Internal calling */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" /> Apel intern
            </CardTitle>
            <CardDescription>Apelați recepția, sala de operații sau alt membru al personalului</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Nume personal sau interior (ex.: Recepție, Sala 1)..." />
            <Button onClick={() => openModal('start_call')} className="w-full">
              Inițiază apel
            </Button>
          </CardContent>
        </Card>

        {/* Phonebook */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookUser className="w-5 h-5" /> Agendă telefonică
            </CardTitle>
            <CardDescription>Contacte clinică — configurate de manager</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Căutați contacte..." />
            <div className="py-6 text-center border rounded-lg bg-gray-50">
              <BookUser className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Niciun contact încă</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Managerul va adăuga aici numere de farmacie, spital, laborator și furnizori.
              </p>
            </div>
            <Alert>
              <AlertDescription className="text-xs">
                Contacte tipice: farmacie, spital partener, laborator analize, service echipament medical.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Add contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PlusIcon className="w-5 h-5" /> Adaugă contact
            </CardTitle>
            <CardDescription>Salvați un contact al clinicii sau al unui pacient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Nume (ex.: Farmacia Unirea, Spital X)" />
            <Input placeholder="Număr de telefon" />
            <Input placeholder="Categorie (ex.: Farmacie, Spital, Laborator)" />
            <Input placeholder="ID pacient asociat (opțional)" />
            <Button onClick={() => openModal('save_contact')} className="w-full">
              Salvează contact
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
