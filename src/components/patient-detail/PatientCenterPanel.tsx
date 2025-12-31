import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, History } from 'lucide-react'
import { DentalChart } from '@/components/dental/DentalChart'
import PeriodontalChart from '@/components/dental/PeriodontalChart'
import { PROCEDURE_TYPES, TOOL_ICONS } from '@/components/dental/constants'
import { FillingOptionsProvider } from '@/contexts/FillingOptionsContext'
import { CrownBridgeOptionsProvider } from '@/contexts/CrownBridgeOptionsContext'
import { ExtractionOptionsProvider } from '@/contexts/ExtractionOptionsContext'
import { SealingOptionsProvider } from '@/contexts/SealingOptionsContext'
import type { ToothMeasurements } from '@/components/dental/PeriodontalChart'

interface PatientCenterPanelProps {
  centerPanel: 'status' | 'perio'
  setCenterPanel: (panel: 'status' | 'perio') => void
  activeTool: string | null
  handleToolClick: (toolId: string) => void
  setShowPerioSettingsModal: (show: boolean) => void
  setShowHistoryModal: (show: boolean) => void
  patient: any
  dentalChart: any
  perioSettings: any
  mapAPIToComponentData: (apiData: any) => Record<number, ToothMeasurements>
  mapComponentToAPIData: (componentData: Record<number, ToothMeasurements>, patientId: string) => any
  handlePeriodontalSave: (data: any) => Promise<void>
  onProcedureCreated: () => void
  onProcedureDeleted: () => void
  handleStatusSave: (data: any) => Promise<void>
  activeProcedures: any[]
  patientId: string
  procedures: any[] // Add procedures prop
  toothTypes: any // Add toothTypes prop
  /**
   * Indicates which treatment tab is currently active, influencing the status assigned to
   * newly-created procedures (COMPLETED for history, IN_PROGRESS for current, PENDING for plan).
   */
  currentStatus: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
  onForceRefresh?: () => void // Add force refresh prop
}

export default function PatientCenterPanel({
  centerPanel,
  setCenterPanel,
  activeTool,
  handleToolClick,
  setShowPerioSettingsModal,
  setShowHistoryModal,
  patient,
  dentalChart,
  perioSettings,
  mapAPIToComponentData,
  mapComponentToAPIData,
  handlePeriodontalSave,
  onProcedureCreated,
  onProcedureDeleted,
  handleStatusSave,
  activeProcedures,
  patientId,
  procedures, // Add procedures parameter
  toothTypes, // Add toothTypes parameter
  currentStatus,
  onForceRefresh
}: PatientCenterPanelProps) {
  const [perioRefreshKey, setPerioRefreshKey] = useState(0)
  const [latestPerioData, setLatestPerioData] = useState<any>(null)
  const [forcePerioRemount, setForcePerioRemount] = useState(false)
  const [freshPerioData, setFreshPerioData] = useState<any>(null)

  // Force fresh data load from database when switching to perio tab
  useEffect(() => {
    if (centerPanel === 'perio') {
      // Force fresh data load from patient data
      const latestChart = patient?.periodontalCharts && patient.periodontalCharts.length > 0
        ? patient.periodontalCharts[patient.periodontalCharts.length - 1]
        : null

      setFreshPerioData(latestChart)
      setPerioRefreshKey(Date.now())
    }
  }, [centerPanel, patient?.periodontalCharts])

  // Force complete refresh when clicking the periodontal chart button
  const handlePerioTabClick = () => {
    // Force fresh data load from database
    const latestChart = patient?.periodontalCharts && patient.periodontalCharts.length > 0
      ? patient.periodontalCharts[patient.periodontalCharts.length - 1]
      : null

    setFreshPerioData(latestChart)
    setPerioRefreshKey(Date.now())
    setCenterPanel('perio')

    // Force refresh patient data from database
    console.log('🔄 Force refreshing patient data from database...')
    if (onForceRefresh) {
      onForceRefresh()
    }
  }

  // Store latest auto-saved data
  const handlePeriodontalAutoSave = async (data: any) => {
    setLatestPerioData(data)
    await handlePeriodontalSave(data)
  }

  return (
    <div className="row-span-1 flex flex-col items-start justify-start border-2 border-blue-400 bg-white px-2 rounded-xl">
      <div className="flex gap-4 mb-4 justify-between w-full px-8 pt-4">
        <div className="flex gap-2">
          <Button
            variant={centerPanel === 'status' ? 'default' : 'outline'}
            onClick={() => setCenterPanel('status')}
          >
            STATUS PRAESENS
          </Button>
          <Button
            variant={centerPanel === 'perio' ? 'default' : 'outline'}
            onClick={handlePerioTabClick}
          >
            PERIODONTAL CHART
          </Button>
        </div>
        {centerPanel === 'status' && (
          <div className="flex gap-2">
            {PROCEDURE_TYPES.map(tool => (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? 'default' : 'outline'}
                onClick={() => handleToolClick(tool.id)}
                className="p-1 m-0 h-20 w-20 rounded-lg"
                size="sm"
                title={tool.label}
              >
                <img src={TOOL_ICONS[tool.id]} alt={tool.label} className="p-0 m-0 w-20 h-20 object-cover rounded-lg" />
              </Button>
            ))}
          </div>
        )}
        {centerPanel === 'perio' && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPerioSettingsModal(true)}
              className="p-2"
              title="Periodontal Chart Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistoryModal(true)}
              className="p-2"
              title="History"
            >
              <History className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {centerPanel === 'status' && (
        <div className="flex-1 w-full">
          <FillingOptionsProvider>
            <CrownBridgeOptionsProvider>
              <ExtractionOptionsProvider>
                <SealingOptionsProvider>
                  <DentalChart
                    procedures={procedures}
                    toothTypes={toothTypes}
                    readOnly={false}
                    activeTool={activeTool}
                    onToolChange={handleToolClick}
                    patientId={patientId}
                    onProcedureDeleted={onProcedureDeleted}
                    onProcedureCreated={onProcedureCreated}
                    currentStatus={currentStatus}
                    activeProcedures={activeProcedures}
                  />
                </SealingOptionsProvider>
              </ExtractionOptionsProvider>
            </CrownBridgeOptionsProvider>
          </FillingOptionsProvider>
        </div>
      )}

      {centerPanel === 'perio' && (
        <div className="flex-1 w-full">
          <PeriodontalChart
            key={`perio-${patient?.id}-${perioRefreshKey}`}
            initialData={{
              date: new Date().toISOString(),
              teeth: mapAPIToComponentData(freshPerioData || latestPerioData || null)
            }}
            settings={perioSettings}
            onSave={async (data) => {
              await handlePeriodontalSave(data)
            }}
            onAutoSave={async (data) => {
              await handlePeriodontalAutoSave(data)
            }}
          />
        </div>
      )}
    </div>
  )
} 