import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Ruler,
  Pencil,
  Square,
  Circle,
  Type,
  Trash2,
  Save,
  Plus,
  Wand2,
  Move,
  RectangleHorizontal,
  Brain as BrainIcon,
  PencilLine,
  Upload,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ImagingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  imageId?: string
}

interface ImageData {
  id: string
  url: string
  type: 'BITEWING' | 'OPG' | 'SOLO' | 'XRAY' | 'INTRAORAL' | 'EXTRAORAL' | 'PANORAMIC' | 'CBCT'
  side?: 'LEFT' | 'RIGHT'
  patientId: string
  createdAt: string
}

const tools = [
  { id: 'pan', name: 'Pan', icon: <Move className="h-4 w-4" /> },
  { id: 'rectangle', name: 'Rectangle', icon: <RectangleHorizontal className="h-4 w-4" />, shortcut: 'R' },
  { id: 'circle', name: 'Circle', icon: <Circle className="h-4 w-4" />, shortcut: 'C' },
  { id: 'text', name: 'Text', icon: <Type className="h-4 w-4" />, shortcut: 'T' },
  { id: 'freehand', name: 'Freehand', icon: <PencilLine className="h-4 w-4" />, shortcut: 'F' },
  { id: 'calibrate', name: 'Calibrate', icon: <Ruler className="h-4 w-4" />, shortcut: 'M' },
  { id: 'ai-detect', name: 'AI Detection', icon: <BrainIcon className="h-4 w-4" /> },
  { id: 'ai-enhance', name: 'AI Enhancement', icon: <Wand2 className="h-4 w-4" /> }
]

const imageTypes = [
  { value: 'BITEWING', label: 'Bitewing' },
  { value: 'OPG', label: 'OPG' },
  { value: 'SOLO', label: 'Solo X-ray' },
  { value: 'XRAY', label: 'X-ray' },
  { value: 'INTRAORAL', label: 'Intraoral' },
  { value: 'EXTRAORAL', label: 'Extraoral' },
  { value: 'PANORAMIC', label: 'Panoramic' },
  { value: 'CBCT', label: 'CBCT' }
] as const

export default function ImagingModal({ open, onOpenChange, patientId, imageId }: ImagingModalProps) {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
  const [temporaryImage, setTemporaryImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [selectedTool, setSelectedTool] = useState<string>('pan')
  const [selectedImageType, setSelectedImageType] = useState<ImageData['type']>('XRAY')
  const [selectedSide, setSelectedSide] = useState<'LEFT' | 'RIGHT' | undefined>(undefined)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasImage, setCanvasImage] = useState<HTMLImageElement | null>(null)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [imageQueue, setImageQueue] = useState<File[]>([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load image if imageId is provided
  useEffect(() => {
    if (imageId) {
      const loadImage = async () => {
        try {
          const response = await fetch(`/api/patients/${patientId}/images/${imageId}`)
          if (!response.ok) throw new Error('Failed to fetch image')
          const image = await response.json()
          setSelectedImage(image)
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to load image',
            variant: 'destructive'
          })
        }
      }
      loadImage()
    }
  }, [imageId, patientId])

  // Update the image loading effect to properly draw the image
  useEffect(() => {
    if (!selectedImage && !temporaryImage) return

    const loadImage = async () => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Reset transformations when loading new image
        setPanOffset({ x: 0, y: 0 })
        setZoom(100)
        setRotation(0)
        setBrightness(100)
        setContrast(100)

        // Set canvas dimensions to match image
        canvas.width = img.width
        canvas.height = img.height

        // Draw the image immediately
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
        }

        setCanvasImage(img)
        applyImageAdjustments()
      }

      // Handle image loading errors
      img.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to load image',
          variant: 'destructive'
        })
        handleSuccessfulSave() // Move to next image if current one fails
      }

      img.src = selectedImage?.url || temporaryImage || ''
    }

    loadImage()

    // Cleanup
    return () => {
      if (temporaryImage) {
        URL.revokeObjectURL(temporaryImage)
      }
    }
  }, [selectedImage, temporaryImage])

  const applyImageAdjustments = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !canvasImage) return

    // Store original dimensions
    const originalWidth = canvas.width
    const originalHeight = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Create a temporary canvas for the base image with filters
    const baseCanvas = document.createElement('canvas')
    baseCanvas.width = originalWidth
    baseCanvas.height = originalHeight
    const baseCtx = baseCanvas.getContext('2d')
    if (!baseCtx) return

    // Apply brightness and contrast to base image
    baseCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
    baseCtx.drawImage(canvasImage, 0, 0, originalWidth, originalHeight)

    // Save context state for main canvas
    ctx.save()

    // Apply transformations from center
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Move to center
    ctx.translate(centerX, centerY)

    // Apply zoom
    const scale = zoom / 100
    ctx.scale(scale, scale)

    // Apply rotation
    const angleInRadians = (rotation * Math.PI) / 180
    ctx.rotate(angleInRadians)

    // Move back and apply pan
    ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale)

    // Draw the filtered base image
    ctx.drawImage(baseCanvas, 0, 0)

    // Restore context
    ctx.restore()
  }

  const handleZoom = (value: number) => {
    setZoom(value)
    requestAnimationFrame(applyImageAdjustments)
  }

  const handleRotate = (direction: 'left' | 'right') => {
    const newRotation = rotation + (direction === 'left' ? -90 : 90)
    setRotation(newRotation)
    requestAnimationFrame(applyImageAdjustments)
  }

  const handleBrightnessChange = (value: number) => {
    setBrightness(value)
    requestAnimationFrame(applyImageAdjustments)
  }

  const handleContrastChange = (value: number) => {
    setContrast(value)
    requestAnimationFrame(applyImageAdjustments)
  }

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId)
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    setImageQueue(prev => [...prev, ...Array.from(files)])
    if (!selectedImage && !temporaryImage) {
      // Load the first image immediately
      const url = URL.createObjectURL(files[0])
      setTemporaryImage(url)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const processNextImage = async () => {
    if (imageQueue.length === 0) {
      setIsProcessingQueue(false)
      onOpenChange(false)
      return
    }

    const nextFile = imageQueue[0]
    const url = URL.createObjectURL(nextFile)
    setTemporaryImage(url)
    setImageQueue(prev => prev.slice(1))
  }

  // Handle successful save
  const handleSuccessfulSave = async () => {
    if (imageQueue.length > 0) {
      await processNextImage()
    } else {
      setIsProcessingQueue(false)
      onOpenChange(false)
    }
  }

  const handleSaveImage = async () => {
    if (!canvasRef.current) return

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current?.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/png')
      })

      // Create form data
      const formData = new FormData()
      formData.append('file', blob, 'image.png')
      formData.append('type', selectedImageType)
      if (selectedImageType === 'BITEWING' && selectedSide) {
        formData.append('side', selectedSide)
      }

      // If we're editing an existing image
      if (selectedImage?.id) {
        const response = await fetch(`/api/patients/${patientId}/images/${selectedImage.id}`, {
          method: 'PUT',
          body: formData
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error || 'Failed to update image')
        }

        toast({
          title: 'Success',
          description: 'Image updated successfully'
        })
      } else {
        // Creating a new image
        const response = await fetch(`/api/patients/${patientId}/images`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error || 'Failed to save image')
        }

        const newImage = await response.json()

        toast({
          title: 'Success',
          description: 'Image saved successfully'
        })
      }

      // Clear current image and canvas
      if (temporaryImage) {
        URL.revokeObjectURL(temporaryImage)
      }
      setTemporaryImage(null)
      setSelectedImage(null)

      // Reset image manipulation states
      setZoom(100)
      setRotation(0)
      setBrightness(100)
      setContrast(100)
      setPanOffset({ x: 0, y: 0 })

      // Clear canvas
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }

      // Handle successful save (process next image in queue if any)
      handleSuccessfulSave()
    } catch (error) {
      console.error('Error saving image:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save image',
        variant: 'destructive'
      })
    }
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setImageQueue([])
      setTemporaryImage(null)
      setSelectedImage(null)
      setSelectedImageType('XRAY')
      setSelectedSide(undefined)
      setZoom(100)
      setRotation(0)
      setBrightness(100)
      setContrast(100)
      setPanOffset({ x: 0, y: 0 })
      // Clear any object URLs to prevent memory leaks
      if (temporaryImage) {
        URL.revokeObjectURL(temporaryImage)
      }
    }
  }, [open, temporaryImage])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh]">
        <div className="flex h-full gap-4">
          {/* Main canvas area */}
          <div
            className="flex-1 relative border rounded-lg overflow-hidden"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {!selectedImage && !temporaryImage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/50">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Drop images here</h3>
                  <p className="text-sm text-muted-foreground">or click to select files</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <canvas ref={canvasRef} className="w-full h-full" />
            )}
          </div>

          {/* Tools and controls */}
          <div className="w-96 space-y-4">
            {/* Queue info */}
            {imageQueue.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {imageQueue.length} image{imageQueue.length === 1 ? '' : 's'} remaining in queue
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Rest of the tools and controls */}
            {(selectedImage || temporaryImage) && (
              <>
                {/* Tools */}
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {tools.map((tool) => (
                        <Button
                          key={tool.id}
                          variant={selectedTool === tool.id ? "default" : "outline"}
                          className="w-full flex items-center justify-start gap-3 px-4 py-3"
                          onClick={() => handleToolSelect(tool.id)}
                        >
                          {tool.icon}
                          <span className="whitespace-nowrap">{tool.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Image adjustments */}
                <Card>
                  <CardContent className="space-y-4 p-4">
                    <div className="space-y-2">
                      <Label>Zoom ({zoom}%)</Label>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleZoom(Math.max(10, zoom - 10))}>
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Slider
                          value={[zoom]}
                          onValueChange={([value]) => handleZoom(value)}
                          min={10}
                          max={400}
                          step={10}
                        />
                        <Button variant="outline" size="icon" onClick={() => handleZoom(Math.min(400, zoom + 10))}>
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Rotation</Label>
                      <div className="flex justify-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleRotate('left')}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleRotate('right')}>
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Brightness ({brightness}%)</Label>
                      <Slider
                        value={[brightness]}
                        onValueChange={([value]) => handleBrightnessChange(value)}
                        min={0}
                        max={200}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Contrast ({contrast}%)</Label>
                      <Slider
                        value={[contrast]}
                        onValueChange={([value]) => handleContrastChange(value)}
                        min={0}
                        max={200}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Image type and save */}
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Image Type</Label>
                        <select
                          className="w-full p-2 border rounded"
                          value={selectedImageType}
                          onChange={(e) => {
                            setSelectedImageType(e.target.value as ImageData['type'])
                            if (e.target.value !== 'BITEWING') {
                              setSelectedSide(undefined)
                            }
                          }}
                        >
                          {imageTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedImageType === 'BITEWING' && (
                        <div className="space-y-2">
                          <Label>Side</Label>
                          <select
                            className="w-full p-2 border rounded"
                            value={selectedSide || ''}
                            onChange={(e) => setSelectedSide(e.target.value as 'LEFT' | 'RIGHT' | undefined)}
                          >
                            <option value="">Select side...</option>
                            <option value="LEFT">Left</option>
                            <option value="RIGHT">Right</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleSaveImage}
                      disabled={selectedImageType === 'BITEWING' && !selectedSide}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Image {imageQueue.length > 0 ? `(${imageQueue.length} remaining)` : ''}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}