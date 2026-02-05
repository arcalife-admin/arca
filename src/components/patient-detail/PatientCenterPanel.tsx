import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, History } from 'lucide-react'
import SurgicalProcedureForm from '@/components/surgical/SurgicalProcedureForm'
// Dental chart and periodontal chart removed - not applicable for plastic surgery

interface PatientCenterPanelProps {
  centerPanel: 'status'
  setCenterPanel: (panel: 'status') => void
  activeTool: string | null
  handleToolClick: (toolId: string) => void
  setShowPerioSettingsModal?: (show: boolean) => void // Removed for plastic surgery - no longer needed
  setShowHistoryModal: (show: boolean) => void
  patient: any
  onProcedureCreated: () => void
  onProcedureDeleted: () => void
  handleStatusSave: (data: any) => Promise<void>
  activeProcedures: any[]
  patientId: string
  procedures: any[]
  /**
   * Indicates which treatment tab is currently active, influencing the status assigned to
   * newly-created procedures (COMPLETED for history, IN_PROGRESS for current, PENDING for plan).
   */
  currentStatus: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
  onForceRefresh?: () => void
}

export default function PatientCenterPanel({
  centerPanel,
  setCenterPanel,
  activeTool,
  handleToolClick,
  setShowHistoryModal,
  patient,
  onProcedureCreated,
  onProcedureDeleted,
  handleStatusSave,
  activeProcedures,
  patientId,
  procedures,
  currentStatus,
  onForceRefresh
}: PatientCenterPanelProps) {

  return (
    <div className="row-span-1 flex flex-col items-start justify-start border-2 border-blue-400 bg-white px-2 rounded-xl">
      <div className="flex gap-4 mb-4 justify-between w-full px-8 pt-4">
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => setCenterPanel('status')}
          >
            SURGICAL PROCEDURES
          </Button>
        </div>
      </div>

      {centerPanel === 'status' && (
        <div className="flex-1 w-full overflow-y-auto">
          <SurgicalProcedureForm
            patientId={patientId}
            onSuccess={() => {
              onProcedureCreated()
            }}
          />
        </div>
      )}
    </div>
  )
} 