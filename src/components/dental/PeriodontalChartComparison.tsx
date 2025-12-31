import React from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown } from 'lucide-react'
import type { ToothMeasurements, PeriodontalChartType } from './PeriodontalChart'

interface PeriodontalChartComparisonProps {
  charts: Array<{
    date: string
    teeth: Record<number, ToothMeasurements>
    chartType?: PeriodontalChartType
    isExplicitlySaved?: boolean
  }>
  onClose: () => void
}

export default function PeriodontalChartComparison({
  charts,
  onClose
}: PeriodontalChartComparisonProps) {
  if (charts.length < 2) {
    return (
      <div className="p-4 text-center">
        <p>Need at least 2 charts to compare</p>
        <Button onClick={onClose} className="mt-2">Close</Button>
      </div>
    )
  }

  const [chart1, chart2] = charts
  const teeth1 = chart1.teeth
  const teeth2 = chart2.teeth

  const ADULT_TEETH = {
    upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
  }

  const getMeasurementValue = (tooth: ToothMeasurements, side: 'buccal' | 'lingual', site: 'distal' | 'middle' | 'mesial', field: 'pocketDepth' | 'recession') => {
    return tooth[side]?.[site]?.[field] || null
  }

  const compareMeasurements = (tooth1: ToothMeasurements, tooth2: ToothMeasurements, side: 'buccal' | 'lingual', site: 'distal' | 'middle' | 'mesial', field: 'pocketDepth' | 'recession') => {
    const val1 = getMeasurementValue(tooth1, side, site, field)
    const val2 = getMeasurementValue(tooth2, side, site, field)

    if (val1 === null && val2 === null) return 'no-change'
    if (val1 === null) return 'new'
    if (val2 === null) return 'removed'

    if (field === 'pocketDepth') {
      // For pocket depth, lower is better
      if (val2 < val1) return 'improved'
      if (val2 > val1) return 'worsened'
      return 'no-change'
    } else {
      // For recession, lower is better
      if (val2 < val1) return 'improved'
      if (val2 > val1) return 'worsened'
      return 'no-change'
    }
  }

  const getComparisonColor = (status: string) => {
    switch (status) {
      case 'improved': return 'text-green-600 bg-green-50 border-green-200'
      case 'worsened': return 'text-red-600 bg-red-50 border-red-200'
      case 'new': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'removed': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getComparisonIcon = (status: string) => {
    switch (status) {
      case 'improved': return <TrendingUp className="w-4 h-4" />
      case 'worsened': return <TrendingDown className="w-4 h-4" />
      case 'new': return <ArrowUp className="w-4 h-4" />
      case 'removed': return <ArrowDown className="w-4 h-4" />
      default: return <Minus className="w-4 h-4" />
    }
  }

  const renderToothComparison = (toothNumber: number) => {
    const tooth1 = teeth1[toothNumber]
    const tooth2 = teeth2[toothNumber]

    if (!tooth1 && !tooth2) return null

    const sides: ('buccal' | 'lingual')[] = ['buccal', 'lingual']
    const sites: ('distal' | 'middle' | 'mesial')[] = ['distal', 'middle', 'mesial']
    const fields: ('pocketDepth' | 'recession')[] = ['pocketDepth', 'recession']

    return (
      <div key={toothNumber} className="border rounded-lg p-3 mb-2">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Tooth {toothNumber}</h4>
          <div className="flex gap-2 text-sm">
            <span className="text-blue-600">
              {chart1.chartType?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} - {new Date(chart1.date).toLocaleDateString()}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-green-600">
              {chart2.chartType?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} - {new Date(chart2.date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {sides.map(side => (
            <div key={side} className="space-y-2">
              <h5 className="text-sm font-medium capitalize">{side}</h5>
              {sites.map(site => (
                <div key={site} className="space-y-1">
                  <div className="text-xs text-gray-500 capitalize">{site}</div>
                  {fields.map(field => {
                    const comparison = compareMeasurements(tooth1, tooth2, side, site, field)
                    const val1 = getMeasurementValue(tooth1, side, site, field)
                    const val2 = getMeasurementValue(tooth2, side, site, field)

                    return (
                      <div key={field} className={`flex items-center justify-between p-2 rounded border ${getComparisonColor(comparison)}`}>
                        <span className="text-xs capitalize">{field.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{val1 || '-'}</span>
                          <span className="text-xs">→</span>
                          <span className="text-xs">{val2 || '-'}</span>
                          {getComparisonIcon(comparison)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getOverallProgress = () => {
    let improved = 0
    let worsened = 0
    let noChange = 0

    ADULT_TEETH.upper.concat(ADULT_TEETH.lower).forEach(toothNumber => {
      const tooth1 = teeth1[toothNumber]
      const tooth2 = teeth2[toothNumber]

      if (!tooth1 || !tooth2) return

      const sides: ('buccal' | 'lingual')[] = ['buccal', 'lingual']
      const sites: ('distal' | 'middle' | 'mesial')[] = ['distal', 'middle', 'mesial']
      const fields: ('pocketDepth' | 'recession')[] = ['pocketDepth', 'recession']

      sides.forEach(side => {
        sites.forEach(site => {
          fields.forEach(field => {
            const comparison = compareMeasurements(tooth1, tooth2, side, site, field)
            if (comparison === 'improved') improved++
            else if (comparison === 'worsened') worsened++
            else if (comparison === 'no-change') noChange++
          })
        })
      })
    })

    return { improved, worsened, noChange }
  }

  const progress = getOverallProgress()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Periodontal Chart Comparison</h2>
        <Button onClick={onClose}>Close</Button>
      </div>

      {/* Progress Summary */}
      <Card className="p-4 mb-6">
        <h3 className="font-medium mb-3">Overall Progress</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{progress.improved}</div>
            <div className="text-sm text-green-600">Improved</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{progress.worsened}</div>
            <div className="text-sm text-red-600">Worsened</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{progress.noChange}</div>
            <div className="text-sm text-gray-600">No Change</div>
          </div>
        </div>
      </Card>

      {/* Chart Comparison */}
      <div className="space-y-4">
        <h3 className="font-medium">Detailed Comparison</h3>
        <div className="grid grid-cols-1 gap-4">
          {ADULT_TEETH.upper.concat(ADULT_TEETH.lower).map(toothNumber =>
            renderToothComparison(toothNumber)
          )}
        </div>
      </div>
    </div>
  )
} 