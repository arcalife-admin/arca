import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DentalChartData, PeriodontalChartData, DentalProcedure } from '@/types/dental'
import { proceduresToToothData } from '@/lib/dental-chart-builder'

// Helper function to get tooth type
function getToothType(toothId: number): 'molar' | 'premolar' | 'anterior' {
  // Molar: 16-18, 26-28, 36-38, 46-48
  if ((toothId >= 16 && toothId <= 18) || (toothId >= 26 && toothId <= 28) || (toothId >= 36 && toothId <= 38) || (toothId >= 46 && toothId <= 48)) return 'molar';
  // Premolar: 14-15, 24-25, 34-35, 44-45
  if ((toothId >= 14 && toothId <= 15) || (toothId >= 24 && toothId <= 25) || (toothId >= 34 && toothId <= 35) || (toothId >= 44 && toothId <= 45)) return 'premolar';
  // Anterior: 11-13, 21-23, 31-33, 41-43
  return 'anterior';
}

interface DentalData {
  dentalChart: DentalChartData | null
  periodontalChart: PeriodontalChartData | null
  procedures: DentalProcedure[]
}

interface UseDentalDataProps {
  patientId: string
  onError?: (error: Error) => void
}

export function useDentalData({ patientId, onError }: UseDentalDataProps) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<DentalData>({
    queryKey: ['dental', patientId],
    staleTime: 0, // Always refetch when invalidated
    queryFn: async (): Promise<DentalData> => {
      const response = await fetch(`/api/patients/${patientId}/dental`)
      if (!response.ok) {
        throw new Error('Failed to fetch dental data')
      }
      const rawData = await response.json()

      // Rebuild the dentalChart from the current procedures only
      // Don't pass saved dental chart data since disabled teeth are now stored as procedures
      const rebuiltChart = proceduresToToothData(
        rawData.procedures || [],
        rawData.dentalChart?.toothTypes || {},
        null // Don't pass saved dental chart data
      )

      // Check if rebuilt chart is overwriting disabled teeth
      Object.entries(rebuiltChart).forEach(([toothId, toothData]) => {
        if (rawData.dentalChart?.teeth?.[toothId]?.isDisabled) {
          console.log(`🔍 Hook: WARNING! Rebuilt chart is overwriting disabled tooth ${toothId}!`);
          console.log(`🔍 Hook: Original disabled tooth:`, rawData.dentalChart.teeth[toothId]);
          console.log(`🔍 Hook: Rebuilt tooth data:`, toothData);
        }
      });


      // The rebuilt chart now includes disabled teDeeth from procedures, so we use it directly
      const mergedTeeth = { ...rebuiltChart };



      // Check specifically for disabled teeth
      Object.entries(mergedTeeth).forEach(([toothId, toothData]) => {
        if (toothData.isDisabled) {
          console.log(`🔍 Hook: Tooth ${toothId} is disabled:`, toothData);
          console.log(`🔍 Hook: Tooth ${toothId} zones:`, toothData.zones);
        }
      });


      return {
        dentalChart: {
          teeth: mergedTeeth,
          toothTypes: rawData.dentalChart?.toothTypes || {},
        },
        periodontalChart: rawData.periodontalChart,
        procedures: rawData.procedures || [],
      }
    },
  })

  const updateDentalData = useMutation({
    mutationFn: async (updates: {
      dentalChart?: DentalChartData
      periodontalChart?: PeriodontalChartData
    }) => {
      const response = await fetch(`/api/patients/${patientId}/dental`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update dental data')
      }
      return response.json()
    },
    onSuccess: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Hook: Invalidating dental queries for patient:', patientId);
      }
      queryClient.invalidateQueries({ queryKey: ['dental', patientId] })
    },
    onError,
  })

  return {
    dentalChart: data?.dentalChart,
    periodontalChart: data?.periodontalChart,
    procedures: data?.procedures || [],
    isLoading,
    error: error as Error | null,
    updateDentalData: updateDentalData.mutateAsync,
  }
} 