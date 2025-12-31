import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { MapPin, Car, Bike, Clock, Navigation } from 'lucide-react'

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  address: {
    display_name: string
    lat: string
    lon: string
  }
  clinicLocation: {
    lat: string
    lon: string
    name: string
  }
}

interface TravelTime {
  driving: {
    duration: number | null
    distance: number | null
  } | null
  cycling: {
    duration: number | null
    distance: number | null
  } | null
}

export function LocationModal({ isOpen, onClose, address, clinicLocation }: LocationModalProps) {
  const [travelTime, setTravelTime] = useState<TravelTime | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && address.lat && address.lon) {
      fetchTravelTime()
    }
  }, [isOpen, address.lat, address.lon])

  const fetchTravelTime = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/travel-time?fromLat=${address.lat}&fromLon=${address.lon}&toLat=${clinicLocation.lat}&toLon=${clinicLocation.lon}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch travel time')
      }

      const data = await response.json()
      setTravelTime(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to calculate travel time'
      setError(errorMessage)
      console.error('Error fetching travel time:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return 'N/A'
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const formatDistance = (meters: number | null) => {
    if (meters === null) return 'N/A'
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  const openInMaps = () => {
    const url = `https://www.openstreetmap.org/directions?from=${address.lat},${address.lon}&to=${clinicLocation.lat},${clinicLocation.lon}`
    window.open(url, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Patient Address
          </DialogTitle>
          <DialogDescription>
            View patient address and travel times to the clinic
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Address */}
          <Card className="p-4">
            <h3 className="font-medium text-gray-900 mb-2">Address</h3>
            <p className="text-sm text-gray-600">{address.display_name}</p>
          </Card>

          {/* Travel Times */}
          <Card className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Travel Time to {clinicLocation.name}</h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : travelTime ? (
              <div className="space-y-3">
                {/* Driving */}
                {travelTime.driving && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">By Car</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatDuration(travelTime.driving.duration)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistance(travelTime.driving.distance)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cycling */}
                {travelTime.cycling && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">By Bike</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatDuration(travelTime.cycling.duration)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistance(travelTime.cycling.distance)}
                      </div>
                    </div>
                  </div>
                )}

                {!travelTime.driving && !travelTime.cycling && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No travel time data available
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No travel time data available</p>
            )}
          </Card>

          {/* Action Button */}
          <button
            onClick={openInMaps}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Open in Maps
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 