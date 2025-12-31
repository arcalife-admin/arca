import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { FileText, Eye, Edit, GitCompare } from 'lucide-react'
import type { ToothMeasurements } from './PeriodontalChart'
import type { PeriodontalChartType } from '@/types/dental'

interface PeriodontalChartHistoryModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  periodontalCharts: Array<{
    date: string
    teeth: Record<number, ToothMeasurements>
    chartType?: PeriodontalChartType
    isExplicitlySaved?: boolean
  }> | null
  onLoadChart: (chartData: {
    date: string;
    teeth: Record<number, ToothMeasurements>;
    chartType?: PeriodontalChartType;
    isExplicitlySaved?: boolean;
  }) => void
  onViewChart?: (chartData: {
    date: string;
    teeth: Record<number, ToothMeasurements>;
    chartType?: PeriodontalChartType;
    isExplicitlySaved?: boolean;
  }) => void
  onEditChart?: (chartData: {
    date: string;
    teeth: Record<number, ToothMeasurements>;
    chartType?: PeriodontalChartType;
    isExplicitlySaved?: boolean;
  }) => void
  onCompareCharts?: (charts: Array<{
    date: string;
    teeth: Record<number, ToothMeasurements>;
    chartType?: PeriodontalChartType;
    isExplicitlySaved?: boolean;
  }>) => void
}

export default function PeriodontalChartHistoryModal({
  isOpen,
  onOpenChange,
  periodontalCharts,
  onLoadChart,
  onViewChart,
  onEditChart,
  onCompareCharts
}: PeriodontalChartHistoryModalProps) {
  if (!periodontalCharts || periodontalCharts.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Periodontal Chart History</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No periodontal chart history available</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Filter only explicitly saved charts and sort by date (newest first)
  const savedCharts = periodontalCharts?.filter(chart => chart.isExplicitlySaved) || []
  const sortedCharts = savedCharts.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const countTeethWithNotes = (teeth: Record<number, ToothMeasurements>) => {
    return Object.values(teeth).filter(tooth =>
      tooth.notes && tooth.notes.trim().length > 0
    ).length
  }

  const getTeethWithNotes = (teeth: Record<number, ToothMeasurements>) => {
    return Object.entries(teeth)
      .filter(([_, tooth]) => tooth.notes && tooth.notes.trim().length > 0)
      .map(([toothNumber, tooth]) => ({ toothNumber: parseInt(toothNumber), notes: tooth.notes }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Periodontal Chart History</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {sortedCharts.map((chart, index) => {
            const teethWithNotes = getTeethWithNotes(chart.teeth)
            const notesCount = countTeethWithNotes(chart.teeth)

            return (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">
                      {chart.chartType?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} - {new Date(chart.date).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(chart.date).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {notesCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-blue-600">
                        <FileText className="w-4 h-4" />
                        <span>{notesCount} note{notesCount !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <div className="flex gap-1">
                      {onViewChart && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onViewChart(chart)
                            onOpenChange(false)
                          }}
                          title="View Chart"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {onEditChart && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onEditChart(chart)
                            onOpenChange(false)
                          }}
                          title="Edit Chart"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onLoadChart(chart)
                          onOpenChange(false)
                        }}
                      >
                        Load This Chart
                      </Button>
                    </div>
                  </div>
                </div>

                {teethWithNotes.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <h4 className="font-medium text-sm mb-2">Notes:</h4>
                    <div className="space-y-2">
                      {teethWithNotes.map(({ toothNumber, notes }) => (
                        <div key={toothNumber} className="text-sm">
                          <span className="font-medium text-blue-600">Tooth {toothNumber}:</span>
                          <span className="ml-2 text-gray-700">{notes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* Comparison Section */}
        {onCompareCharts && sortedCharts.length >= 2 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-4">Compare Charts</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Select two charts to compare periodontal health progression
              </p>
              <div className="flex gap-2">
                <select className="flex-1 p-2 border rounded-md text-sm">
                  <option value="">Select first chart...</option>
                  {sortedCharts.map((chart, index) => (
                    <option key={`first-${index}`} value={index}>
                      {chart.chartType?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} - {new Date(chart.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <select className="flex-1 p-2 border rounded-md text-sm">
                  <option value="">Select second chart...</option>
                  {sortedCharts.map((chart, index) => (
                    <option key={`second-${index}`} value={index}>
                      {chart.chartType?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} - {new Date(chart.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement comparison logic
                    onCompareCharts(sortedCharts.slice(0, 2))
                    onOpenChange(false)
                  }}
                >
                  <GitCompare className="w-4 h-4 mr-1" />
                  Compare
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 