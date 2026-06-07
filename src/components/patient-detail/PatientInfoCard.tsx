import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { MapPin, Edit, Settings, Mail, Phone, PhoneOff } from 'lucide-react'
import { useCall } from '@/contexts/CallContext'

interface PatientInfoCardProps {
  patient: any
  onEditClick: () => void
  onSettingsClick: () => void
  onLocationClick: () => void
  onAsaClick: () => void
  onEmailClick: () => void
  getLatestAsaData: () => any
  isDisabled?: boolean
}

export default function PatientInfoCard({
  patient,
  onEditClick,
  onSettingsClick,
  onLocationClick,
  onAsaClick,
  onEmailClick,
  getLatestAsaData,
  isDisabled = false
}: PatientInfoCardProps) {
  const { startCall } = useCall()

  const handleCallPatient = (patientData: {
    id: string;
    name: string;
    phone: string;
    initials: string;
  }) => {
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

  // Determine early spot contact preference - default to true if not specified
  const allowEarlySpotContact = patient?.allowEarlySpotContact ?? true;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        <Card className="p-3 border-2 border-blue-400 w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h2>
              {patient.isDisabled && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                  Dezactivat
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end">
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={isDisabled ? undefined : onEditClick}
                      disabled={isDisabled}
                      className={`flex-shrink-0 p-1 rounded transition-colors ${isDisabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-gray-100'}`}
                      title="Editează informațiile pacientului"
                    >
                      <Edit className={`w-3 h-3 ${isDisabled ? 'text-gray-400' : 'text-blue-600'}`} />
                    </button>
                  </TooltipTrigger>
                  {isDisabled && (
                    <TooltipContent>
                      <p className="text-xs">Reactivați pacientul pentru a edita</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <button
                  onClick={onSettingsClick}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Setări și administrare pacient"
                >
                  <Settings className="w-3 h-3 text-gray-600" />
                </button>

              </div>

              {/* Early spot contact preference icon - positioned under settings button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-1 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                    {allowEarlySpotContact ? (
                      <Phone className="w-3 h-3 text-green-600" />
                    ) : (
                      <PhoneOff className="w-3 h-3 text-red-600" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-blue-500/80 border-blue-500 ml-70 ">
                  <p className="text-xs">
                    {allowEarlySpotContact
                      ? "Pacientul acceptă să fie contactat pentru programări anticipate"
                      : "Pacientul preferă să nu fie contactat pentru programări anticipate"
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="text-xs">
            <div className="font-semibold text-blue-600">{patient.patientCode}</div>
            <div>{patient.cnp} ({patient.dateOfBirth.split('T')[0]})</div>
            <div>{patient.firstName} {patient.lastName} ({patient.gender.slice(0, 1)})</div>
            {patient.email && (
              <div className="flex items-center gap-1">
                <span
                  onClick={onEmailClick}
                  title="Trimite e-mail pacientului"
                  className="cursor-pointer"
                >
                  <Mail className="w-3 h-3 text-blue-600 hover:text-blue-800" />
                </span>
                {patient.email}
              </div>
            )}
            {patient.phone && (
              <div className="flex items-center gap-1">
                <span
                  onClick={() => handleCallPatient({
                    id: patient.id,
                    name: `${patient.firstName} ${patient.lastName}`,
                    phone: patient.phone,
                    initials: `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`
                  })}
                  title="Sună pacientul"
                  className="cursor-pointer"
                >
                  <Phone className="w-3 h-3 text-blue-600 hover:text-blue-800" />
                </span>
                {patient.phone}
              </div>
            )}
            <div className="border-t border-gray-300 my-1"></div>
            <div className="flex items-center gap-1">
              <div className="flex-1 truncate">{patient.address.display_name}</div>
              <button
                onClick={onLocationClick}
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                title="Vezi adresa și timpii de deplasare"
              >
                <MapPin className="w-3 h-3 text-blue-600" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs">
            <div className="flex flex-col gap-1 mb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onAsaClick}
                className="h-6 px-2 text-xs"
              >
                {getLatestAsaData().score ? `ASA ${getLatestAsaData().score} (${getLatestAsaData().date})` : 'ASA: indisponibil'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  )
} 