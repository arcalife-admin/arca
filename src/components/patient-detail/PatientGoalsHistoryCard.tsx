'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import {
  formatSizeDisplay,
} from '@/data/aesthetic-procedure-options'

const TIME_AGO_LABELS_RO: Record<string, string> = {
  lt_6_months: '< 6 luni',
  '6_12_months': '6–12 luni',
  '1_2_years': '1–2 ani',
  '2_5_years': '2–5 ani',
  '5_10_years': '5–10 ani',
  '10_plus_years': '10+ ani',
  unknown: 'Necunoscut',
}

function formatTimeAgoRo(value?: string): string {
  if (!value) return ''
  return TIME_AGO_LABELS_RO[value] ?? value
}
import {
  getAestheticProfile,
  type PatientSurgicalHistory,
} from '@/types/patient-aesthetic-profile'
import { PatientGoalsHistoryModal } from './PatientGoalsHistoryModal'

interface PatientGoalsHistoryCardProps {
  patientId: string
  surgicalHistory?: PatientSurgicalHistory | null
  visitReason?: string
  onSaved: () => void
}

function formatEntryLine(
  label: string,
  sizeCc?: string,
  sizeCup?: string,
  timeAgo?: string
): string {
  const size = formatSizeDisplay(sizeCc, sizeCup)
  const parts = [label]
  if (size) parts.push(size)
  if (timeAgo) parts.push(formatTimeAgoRo(timeAgo))
  return parts.join(' · ')
}

export default function PatientGoalsHistoryCard({
  patientId,
  surgicalHistory,
  visitReason,
  onSaved,
}: PatientGoalsHistoryCardProps) {
  const [showModal, setShowModal] = useState(false)
  const profile = getAestheticProfile(surgicalHistory)

  return (
    <>
      <Card className="flex flex-1 flex-col min-h-0 p-3 border-2 border-blue-400 rounded-xl overflow-hidden">
        <div className="flex flex-1 flex-col min-h-0 gap-2">
          <div className="flex justify-between items-center flex-shrink-0">
            <div className="font-bold text-blue-700">Obiective și istoric</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
              className="h-6 w-6 p-0"
              title="Editează obiectivele și istoricul"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar space-y-2">
            <div>
              <div className="text-xs font-semibold text-red-700 mb-1 uppercase tracking-wide">
                Istoric
              </div>
              {profile.history.length === 0 ? (
                <p className="text-xs text-gray-400 italic px-1">Nicio procedură anterioară înregistrată</p>
              ) : (
                <div className="space-y-1">
                  {profile.history.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2 rounded text-xs bg-red-50 border border-red-200 text-red-900"
                    >
                      {formatEntryLine(
                        entry.procedureLabel,
                        entry.sizeCc,
                        entry.sizeCup,
                        entry.timeAgo
                      )}
                      {entry.notes && (
                        <div className="mt-0.5 text-red-700/70 italic">{entry.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide">
                Obiective
              </div>
              {profile.goals.length === 0 ? (
                <p className="text-xs text-gray-400 italic px-1">Niciun obiectiv înregistrat</p>
              ) : (
                <div className="space-y-1">
                  {profile.goals.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2 rounded text-xs bg-green-50 border border-green-200 text-green-900"
                    >
                      {formatEntryLine(entry.procedureLabel, entry.sizeCc, entry.sizeCup)}
                      {entry.notes && (
                        <div className="mt-0.5 text-green-700/70 italic">{entry.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <PatientGoalsHistoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        patientId={patientId}
        initialProfile={profile}
        visitReason={visitReason}
        onSaved={() => {
          onSaved()
          setShowModal(false)
        }}
      />
    </>
  )
}
