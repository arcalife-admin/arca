'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PhoneCallIcon, PhoneMissedIcon, PhoneOutgoingIcon, PhoneIncomingIcon, PlusIcon, Settings } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';

function formatCallDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Simple Modal Component
function SuccessModal({ action, onClose }: { action: string | null, onClose: () => void }) {
  if (!action) return null;

  const messages: Record<string, string> = {
    start_call: 'Calling favorite coworker...',
    call_lab: 'Calling Dental Lab...',
    call_ortho: 'Calling Ortho Clinic...',
    save_contact: 'Contact saved successfully!',
    view_patient: 'Opening this patient\'s card...',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4 w-[90%] max-w-sm">
        <h2 className="text-lg font-semibold text-center">Success</h2>
        <p className="text-center text-muted-foreground">{messages[action] || 'Action completed.'}</p>
        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    </div>
  );
}

export default function PhoneCallsPage() {
  const [actionType, setActionType] = useState<string | null>(null);
  const {
    currentCall,
    isCallInProgress,
    showFloatingButton,
    startCall,
    endCall,
    putOnHold,
    resumeCall,
    setShowFloatingButton,
  } = useCall();

  const openModal = (action: string) => {
    setActionType(action);
  };

  const closeModal = () => {
    setActionType(null);
  };

  const handleTestCall = (patientData: { id: string; name: string; phone: string; initials: string }) => {
    // Check if we're in an embedded iframe
    if (typeof window !== 'undefined' && window.parent !== window) {
      // We're in an iframe, send message to parent to start the call
      window.parent.postMessage({
        type: 'startCall',
        patientData
      }, '*');
    } else {
      // Normal mode, start call directly
      startCall(patientData);
    }
  };

  return (
    <div className="p-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* Success Modal */}
      <SuccessModal action={actionType} onClose={closeModal} />

      {/* Call System Settings */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" /> Call System
          </h2>
          <div className="space-y-4">
            {/* Floating Button Toggle */}
            {/* <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Floating Call Button</p>
                <p className="text-xs text-gray-500">Show call controls in corner</p>
              </div>
              <button
                onClick={() => setShowFloatingButton(!showFloatingButton)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${showFloatingButton ? 'bg-green-500' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-200 ${showFloatingButton ? 'translate-x-4' : 'translate-x-0'
                    }`}
                />
              </button>
            </div> */}

            {/* Current Call Status */}
            {currentCall ? (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">Active Call</p>
                <p className="text-xs text-blue-600">{currentCall.patientName}</p>
                <p className="text-xs text-blue-600">
                  {currentCall.status === 'connected' || currentCall.status === 'hold'
                    ? formatCallDuration(currentCall.duration)
                    : currentCall.status.charAt(0).toUpperCase() + currentCall.status.slice(1)
                  }
                </p>
                <div className="flex gap-2 mt-2">
                  {currentCall.status === 'connected' && (
                    <Button onClick={putOnHold} size="sm" variant="outline" className="text-xs">
                      Hold
                    </Button>
                  )}
                  {currentCall.status === 'hold' && (
                    <Button onClick={resumeCall} size="sm" variant="outline" className="text-xs">
                      Resume
                    </Button>
                  )}
                  <Button onClick={endCall} size="sm" variant="destructive" className="text-xs">
                    End
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">Test calling system:</p>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => handleTestCall({
                      id: 'test-1',
                      name: 'John Doe',
                      phone: '+31 6 1111 1111',
                      initials: 'JD'
                    })}
                    size="sm"
                    variant="outline"
                    className="text-xs justify-start"
                    disabled={isCallInProgress}
                  >
                    📞 Call John Doe
                  </Button>
                  <Button
                    onClick={() => handleTestCall({
                      id: 'test-2',
                      name: 'Jane Smith',
                      phone: '+31 6 2222 2222',
                      initials: 'JS'
                    })}
                    size="sm"
                    variant="outline"
                    className="text-xs justify-start"
                    disabled={isCallInProgress}
                  >
                    📞 Call Jane Smith
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Calls */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <PhoneCallIcon className="w-5 h-5" /> Recent Calls
          </h2>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="missed">Missed</TabsTrigger>
              <TabsTrigger value="incoming">Incoming</TabsTrigger>
              <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="space-y-2 mt-4">
                {/* Map your calls here */}
                <div className="flex justify-between items-center text-sm">
                  <span
                    className="text-muted-foreground cursor-pointer hover:text-primary hover:underline"
                    onClick={() => openModal('view_patient')}
                  >
                    Patient Name
                  </span>
                  <span className="text-green-600">Answered</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span
                    className="text-muted-foreground cursor-pointer hover:text-primary hover:underline"
                    onClick={() => openModal('view_patient')}
                  >
                    Patient Name
                  </span>
                  <span className="text-red-600">Missed</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span
                    className="text-muted-foreground cursor-pointer hover:text-primary hover:underline"
                    onClick={() => openModal('view_patient')}
                  >
                    Patient Name
                  </span>
                  <span className="text-blue-600">Incoming</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span
                    className="text-muted-foreground cursor-pointer hover:text-primary hover:underline"
                    onClick={() => openModal('view_patient')}
                  >
                    Patient Name
                  </span>
                  <span className="text-purple-600">Outgoing</span>
                </div>
              </div>

            </TabsContent>
            <TabsContent value="missed">
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center text-sm">
                  <span
                    className="text-muted-foreground cursor-pointer hover:text-primary hover:underline"
                    onClick={() => openModal('view_patient')}
                  >
                    Important Call
                  </span>
                  <span className="text-red-600">Missed</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="incoming">
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center text-sm">
                  <span
                    className="text-muted-foreground cursor-pointer hover:text-primary hover:underline"
                    onClick={() => openModal('view_patient')}
                  >
                    Patient Name
                  </span>
                  <span className="text-blue-600">Incoming</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="outgoing">
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center text-sm">
                  <span
                    className="text-muted-foreground cursor-pointer hover:text-primary hover:underline"
                    onClick={() => openModal('view_patient')}
                  >
                    Patient Name
                  </span>
                  <span className="text-purple-600">Outgoing</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Call Analytics */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <PhoneIncomingIcon className="w-5 h-5" /> Call Stats
          </h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-lg font-bold">24</p>
              <p className="text-xs text-green-600">Total Calls</p>
            </div>
            <div>
              <p className="text-lg font-bold">6</p>
              <p className="text-xs text-red-600">Missed Calls</p>
            </div>
            <div>
              <p className="text-lg font-bold">12</p>
              <p className="text-xs text-blue-600">Incoming</p>
            </div>
            <div>
              <p className="text-lg font-bold">3</p>
              <p className="text-xs text-purple-600">Outgoing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Internal Calling */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <PhoneOutgoingIcon className="w-5 h-5" /> Internal Call
          </h2>
          <div className="space-y-2">
            <Input placeholder="Enter staff name or ext..." />
            <Button onClick={() => openModal('start_call')} className="w-full">Start Call</Button>
          </div>
        </CardContent>
      </Card>

      {/* Phonebook */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <PhoneCallIcon className="w-5 h-5" /> Phonebook
          </h2>
          <div className="space-y-2">
            <Input placeholder="Search phonebook..." />
            <ul className="text-sm space-y-1">
              <li className="flex justify-between">
                <span>Dental Lab</span>
                <Button onClick={() => openModal('call_lab')} variant="outline" size="sm">Call</Button>
              </li>
              <li className="flex justify-between">
                <span>Ortho Clinic</span>
                <Button onClick={() => openModal('call_ortho')} variant="outline" size="sm">Call</Button>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Add New Contact */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <PlusIcon className="w-5 h-5" /> Add Contact
          </h2>
          <div className="space-y-2">
            <Input placeholder="Name" />
            <Input placeholder="Phone Number" />
            <Input placeholder="Connected Patient ID (optional)" />
            <Button onClick={() => openModal('save_contact')} className="w-full">Save Contact</Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
