import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

interface PatientFile {
  id: string
  url: string
  name: string
  type: string
  size?: number
  createdAt?: string
}

interface PatientImage {
  id: string
  url: string
  type: string
  dateTaken?: string
}

interface PatientImagesSectionProps {
  patientId: string
  patientFiles: PatientFile[]
  patientImages: PatientImage[]
}

// A presentational wrapper for the patient images area that was previously inline in the PatientDetailPage.
// All UI/behaviour remains identical – this component merely receives the data it needs as props so the page
// file can stay leaner without changing any logic.
export const PatientImagesSection: React.FC<PatientImagesSectionProps> = ({
  patientId,
  patientFiles,
  patientImages,
}) => {
  const router = useRouter()

  // Combine images coming from generic patient files and the dedicated images endpoint.
  const combinedImages = [
    ...(patientFiles?.filter((file) => file.type?.startsWith('image/')) || []),
    ...(patientImages || []).map((img) => ({
      id: img.id,
      url: img.url,
      name:
        img.type +
        (img.dateTaken ? ` (${new Date(img.dateTaken).toLocaleDateString()})` : ''),
      type: 'image/jpeg', // default to image
    })),
  ]

  return (
    <div className="border-2 border-blue-400 bg-white p-2 overflow-y-auto rounded-xl col-span-2">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold mb-2">Patient Images</h3>

        <div className="flex flex-row h-full gap-4">
          {/* Left side: Scrollable list of saved images */}
          <div className="w-1/6 border border-gray-200 rounded-lg p-2 overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium mb-2 text-gray-600">Saved Images</h4>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  router.push(`/dashboard/imaging?patientId=${patientId}`)
                }}
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2" id="saved-images-container">
              {combinedImages.map((image) => (
                <div
                  key={image.id}
                  className="rounded-md overflow-hidden bg-gray-50 p-1 cursor-move"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('image', JSON.stringify(image))
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-24 object-cover mb-1"
                  />
                  <p className="text-xs truncate">{image.name}</p>
                </div>
              ))}

              {combinedImages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No images available</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Upload images from the imaging page
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right side: Image containers */}
          <div className="w-3/4 border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-4">
            {/* Top row: Bitewings */}
            <div className="flex gap-4">
              <DropZone label="Left Bitewing" />
              <DropZone label="Right Bitewing" />
            </div>

            {/* Bottom row: OPG/T */}
            <div className="flex justify-center">
              <DropZone label="OPG/T" className="w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface DropZoneProps {
  label: string
  className?: string
}

const DropZone: React.FC<DropZoneProps> = ({ label, className = 'w-1/2' }) => {
  return (
    <div
      className={`${className} aspect-video bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center`}
      onDragOver={(e) => {
        e.preventDefault()
          ; (e.currentTarget as HTMLElement).style.backgroundColor = '#f0f9ff'
          ; (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6'
      }}
      onDragLeave={(e) => {
        e.preventDefault()
          ; (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff'
          ; (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db'
      }}
      onDrop={(e) => {
        e.preventDefault()
          ; (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff'
          ; (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db'

        try {
          const imageData = JSON.parse(e.dataTransfer.getData('image'))
          // Replace any existing content inside drop zone
          e.currentTarget.innerHTML = ''
          const img = document.createElement('img')
          img.src = imageData.url
          img.alt = imageData.name
          img.className = 'w-full h-full object-contain'
          e.currentTarget.appendChild(img)
        } catch (err) {
          console.error('Failed to drop image:', err)
        }
      }}
    >
      <span className="text-gray-400">{label}</span>
    </div>
  )
} 