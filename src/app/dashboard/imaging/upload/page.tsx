'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
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
  ScanLine,
  BrainCircuit,
  Search,
  User,
  Move,
  RectangleHorizontal as RectangleIcon,
  Ruler as RulerIcon,
  PencilLine,
  Square as SquareIcon,
  Sparkles,
  RectangleHorizontal,
  Brain as BrainIcon
} from 'lucide-react'

import { useQuery } from '@tanstack/react-query'
import { HexColorPicker } from 'react-colorful'
import { Calibration, Annotation } from '@/types/database'

interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  email?: string
  phone: string
}

interface ImageData {
  id: string
  url: string
  type: 'BITEWING' | 'OPG' | 'SOLO' | 'XRAY' | 'INTRAORAL' | 'EXTRAORAL' | 'PANORAMIC' | 'CBCT'
  side?: 'LEFT' | 'RIGHT'
  patientId: string
  createdAt: string
  annotations?: Annotation[]
  calibration?: Calibration
}

type ToolId = 'pan' | 'rectangle' | 'circle' | 'text' | 'freehand' | 'calibrate' | 'ai-detect' | 'ai-enhance';
type ShapeType = 'circle' | 'rectangle' | 'text' | 'measurement' | 'freehand';

interface Tool {
  id: ToolId;
  name: string;
  icon: React.ReactNode;
  shortcut?: string;
}

interface Shape {
  id: string;
  type: ShapeType;
  coordinates: {
    x: number;
    y: number;
    text?: string;
    width?: number;
    height?: number;
    radius?: number;
    points?: Array<{ x: number; y: number }>;
  };
  color: string;
  scale?: number;
  penSize?: number;
}

const tools: Tool[] = [
  { id: 'pan', name: 'Pan', icon: <Move className="h-4 w-4" /> },
  { id: 'rectangle', name: 'Rectangle', icon: <RectangleHorizontal className="h-4 w-4" />, shortcut: 'R' },
  { id: 'circle', name: 'Circle', icon: <Circle className="h-4 w-4" />, shortcut: 'C' },
  { id: 'text', name: 'Text', icon: <Type className="h-4 w-4" />, shortcut: 'T' },
  { id: 'freehand', name: 'Freehand', icon: <PencilLine className="h-4 w-4" />, shortcut: 'F' },
  { id: 'calibrate', name: 'Calibrate', icon: <RulerIcon className="h-4 w-4" />, shortcut: 'M' },
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

function ImagingPageContent() {
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId')
  const imageId = searchParams.get('imageId')
  const [images, setImages] = useState<ImageData[]>([])
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [temporaryImage, setTemporaryImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [selectedTool, setSelectedTool] = useState<ToolId>('pan')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [canvasImage, setCanvasImage] = useState<HTMLImageElement | null>(null)
  const [drawingLayer, setDrawingLayer] = useState<HTMLCanvasElement | null>(null)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [rotationAnimation, setRotationAnimation] = useState(0)
  const lastDrawPoint = useRef<{ x: number; y: number } | null>(null)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<{ x: number; y: number; screenX: number; screenY: number } | null>(null)
  const [measurements, setMeasurements] = useState<Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    length: number;
    pixelLength: number;
    color?: string;
  }>>([])
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [measurementStart, setMeasurementStart] = useState<{ x: number; y: number } | null>(null)
  const [textColor, setTextColor] = useState('#ff0000')
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [textScale, setTextScale] = useState(1)
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 })
  const [isDraggingShape, setIsDraggingShape] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizingTextId, setResizingTextId] = useState<string | null>(null)
  const [measurementActive, setMeasurementActive] = useState(false)
  const [viewScale, setViewScale] = useState(1)
  const lastMousePos = useRef<{ x: number; y: number } | null>(null)
  const [isDraggingText, setIsDraggingText] = useState(false)
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [hoveredCorner, setHoveredCorner] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null>(null)
  const [justFinishedResizing, setJustFinishedResizing] = useState(false)
  const [penSize, setPenSize] = useState(2)
  const [selectedImageType, setSelectedImageType] = useState<ImageData['type']>('XRAY')
  const [selectedSide, setSelectedSide] = useState<'LEFT' | 'RIGHT' | undefined>(undefined)

  // Fetch patients
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await fetch('/api/patients')
      if (!response.ok) throw new Error('Failed to fetch patients')
      return response.json()
    }
  })

  // Load patient if patientId is provided
  useEffect(() => {
    if (patientId) {
      const loadPatient = async () => {
        try {
          const response = await fetch(`/api/patients/${patientId}`)
          if (!response.ok) throw new Error('Failed to fetch patient')
          const patient = await response.json()
          setSelectedPatient(patient)

          // If imageId is provided, select that image
          if (imageId) {
            const imageResponse = await fetch(`/api/patients/${patientId}/images/${imageId}`)
            if (!imageResponse.ok) throw new Error('Failed to fetch image')
            const image = await imageResponse.json()
            setSelectedImage(image)
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to load patient data',
            variant: 'destructive'
          })
        }
      }
      loadPatient()
    }
  }, [patientId, imageId])

  // Helper to normalize date strings for comparison
  function normalizeDate(dateString: string): string[] {
    if (!dateString) return []
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return [dateString]
    const us = date.toLocaleDateString('en-US')
    const gb = date.toLocaleDateString('en-GB')
    const iso = date.toISOString().slice(0, 10)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const day = pad(date.getDate())
    const month = pad(date.getMonth() + 1)
    const year = date.getFullYear().toString()
    const year2 = year.slice(-2)
    const compact = [
      `${day}${month}${year2}`,
      `${month}${day}${year2}`,
      `${day}${month}${year}`,
      `${month}${day}${year}`,
    ]
    return [us, gb, iso, ...compact]
  }

  // Filter patients based on search
  const filteredPatients = patients.filter((patient) => {
    const search = searchQuery.trim().toLowerCase()
    if (!search) return true
    return [
      patient.firstName || '',
      patient.lastName || '',
      patient.email || '',
      patient.phone || '',
      ...normalizeDate(patient.dateOfBirth).map((d) => d.toLowerCase()),
    ].some((field) => String(field).toLowerCase().includes(search))
  })

  // Add this helper function to determine if we're showing an image
  const hasActiveImage = selectedImage || temporaryImage

  // Helper function to draw smooth lines
  const smoothLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)

    // Calculate control points for quadratic curve
    const dx = x2 - x1
    const dy = y2 - y1
    const midX = x1 + dx / 2
    const midY = y1 + dy / 2

    ctx.quadraticCurveTo(midX, midY, x2, y2)
    ctx.stroke()
  }

  // Update coordinate transformation helpers to handle transformations correctly
  const screenToCanvas = (screenX: number, screenY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()

    // Get the scale between canvas coordinates and screen coordinates
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Convert screen coordinates to canvas coordinates
    let x = (screenX - rect.left) * scaleX
    let y = (screenY - rect.top) * scaleY

    // Get canvas center
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Translate to origin
    x -= centerX
    y -= centerY

    // Unapply zoom
    const scale = zoom / 100
    x /= scale
    y /= scale

    // Unapply rotation
    if (rotation !== 0) {
      const angleInRadians = (-rotation * Math.PI) / 180
      const rotatedX = x * Math.cos(angleInRadians) - y * Math.sin(angleInRadians)
      const rotatedY = x * Math.sin(angleInRadians) + y * Math.cos(angleInRadians)
      x = rotatedX
      y = rotatedY
    }

    // Unapply pan
    x -= panOffset.x / scale
    y -= panOffset.y / scale

    // Translate back
    x += centerX
    y += centerY

    return { x, y }
  }

  const canvasToScreen = (canvasX: number, canvasY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()

    // Get the scale between canvas coordinates and screen coordinates
    const scaleX = rect.width / canvas.width
    const scaleY = rect.height / canvas.height

    let x = canvasX
    let y = canvasY

    // Get canvas center
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Translate to origin
    x -= centerX
    y -= centerY

    // Apply pan
    const scale = zoom / 100
    x += panOffset.x / scale
    y += panOffset.y / scale

    // Apply rotation
    if (rotation !== 0) {
      const angleInRadians = (rotation * Math.PI) / 180
      const rotatedX = x * Math.cos(angleInRadians) - y * Math.sin(angleInRadians)
      const rotatedY = x * Math.sin(angleInRadians) + y * Math.cos(angleInRadians)
      x = rotatedX
      y = rotatedY
    }

    // Apply zoom
    x *= scale
    y *= scale

    // Translate back
    x += centerX
    y += centerY

    // Convert to screen coordinates
    x = x * scaleX
    y = y * scaleY

    return { x: x + rect.left, y: y + rect.top }
  }

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas || !canvasImage) return

      // Maintain aspect ratio while fitting to container
      const container = canvas.parentElement
      if (!container) return

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      const imageAspectRatio = canvasImage.width / canvasImage.height
      const containerAspectRatio = containerWidth / containerHeight

      let newWidth, newHeight
      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider than container
        newWidth = containerWidth
        newHeight = containerWidth / imageAspectRatio
      } else {
        // Image is taller than container
        newHeight = containerHeight
        newWidth = containerHeight * imageAspectRatio
      }

      // Update canvas size
      canvas.style.width = `${newWidth}px`
      canvas.style.height = `${newHeight}px`

      // Keep original resolution for sharp rendering
      canvas.width = canvasImage.width
      canvas.height = canvasImage.height

      // Redraw with new dimensions
      applyImageAdjustments()
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Initial resize

    return () => window.removeEventListener('resize', handleResize)
  }, [canvasImage])

  // Update mouse handlers to handle tool positioning correctly
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Always update lastMousePos when mouse is down
    lastMousePos.current = { x: e.clientX, y: e.clientY }

    const { x, y } = screenToCanvas(e.clientX, e.clientY)
    setStartPos({ x, y })

    if (selectedTool === 'pan') {
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    } else if (selectedTool === 'freehand') {
      setIsDrawing(true)
      // Create new freehand shape with type assertion and penSize
      const newShape: Shape = {
        id: Math.random().toString(),
        type: 'freehand' as const,
        coordinates: {
          x: x,
          y: y,
          points: [{ x, y }]
        },
        color: textColor,
        penSize: penSize
      }
      setShapes(prev => [...prev, newShape])
      lastDrawPoint.current = { x, y }
    } else if (selectedTool === 'calibrate') {
      // Directly call handleMeasurement when clicking with the calibrate tool
      handleMeasurement(e)
    } else {
      setIsDrawing(true)
      lastDrawPoint.current = { x, y }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    setJustFinishedResizing(false) // Clear the flag on mouse move

    const canvas = canvasRef.current
    if (!canvas) return

    // Always update last mouse position for use with measurement tool
    lastMousePos.current = { x: e.clientX, y: e.clientY }

    // If measurement is active, force redraw to update the ruler
    if (measurementActive && measurementStart) {
      requestAnimationFrame(applyImageAdjustments)
    }

    // Handle text dragging - prioritized and simplified
    if (isDraggingText && draggedTextId && dragOffset) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY)
      setShapes(prev => prev.map(shape =>
        shape.id === draggedTextId
          ? {
            ...shape,
            coordinates: {
              ...shape.coordinates,
              x: x - dragOffset.x,
              y: y - dragOffset.y
            }
          }
          : shape
      ))
      requestAnimationFrame(applyImageAdjustments)
      return
    }

    // Handle text resizing with proper cursor following
    if (isResizing && resizingTextId && lastMousePos.current) {
      const { x: currentX, y: currentY } = screenToCanvas(e.clientX, e.clientY)

      setShapes(prev => prev.map(shape => {
        if (shape.id === resizingTextId && shape.type === 'text' && shape.coordinates.text) {
          const fontSize = 16 * (shape.scale || 1)
          const ctx = canvas.getContext('2d')
          if (!ctx) return shape

          ctx.font = `${fontSize}px Arial`
          const metrics = ctx.measureText(shape.coordinates.text)
          const width = metrics.width
          const height = fontSize

          // Calculate the original text box corners
          const corners = {
            'top-left': { x: shape.coordinates.x, y: shape.coordinates.y - height },
            'top-right': { x: shape.coordinates.x + width, y: shape.coordinates.y - height },
            'bottom-left': { x: shape.coordinates.x, y: shape.coordinates.y },
            'bottom-right': { x: shape.coordinates.x + width, y: shape.coordinates.y }
          }

          // Get the original corner position being dragged
          const originalCorner = corners[hoveredCorner || 'bottom-right']
          if (!originalCorner) return shape

          // Calculate the distance from the original corner to the current mouse position
          const dx = currentX - originalCorner.x
          const dy = currentY - originalCorner.y

          // Calculate new scale based on the change in width
          let newScale = shape.scale || 1
          const originalWidth = width / newScale // Get the base width without scale

          switch (hoveredCorner) {
            case 'bottom-right':
            case 'top-right': {
              // Scale based on width change
              const desiredWidth = width + dx
              newScale = Math.max(0.5, desiredWidth / originalWidth)
              break
            }
            case 'bottom-left':
            case 'top-left': {
              // Scale based on width change, but from right to left
              const desiredWidth = width - dx
              newScale = Math.max(0.5, desiredWidth / originalWidth)
              // Adjust x position to maintain right side position
              shape.coordinates.x = shape.coordinates.x + width - (originalWidth * newScale)
              break
            }
          }

          return {
            ...shape,
            scale: newScale
          }
        }
        return shape
      }))

      requestAnimationFrame(applyImageAdjustments)
      return
    }

    // Handle text corner hover detection
    if (selectedTool === 'text' && !isResizing && !isDraggingText) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      let foundCorner = false
      shapes.forEach(shape => {
        if (shape.type === 'text' && shape.coordinates.text) {
          const fontSize = 16 * (shape.scale || 1)
          ctx.font = `${fontSize}px Arial`
          const metrics = ctx.measureText(shape.coordinates.text)
          const width = metrics.width
          const height = fontSize

          const corners = {
            'top-left': { x: shape.coordinates.x, y: shape.coordinates.y - height },
            'top-right': { x: shape.coordinates.x + width, y: shape.coordinates.y - height },
            'bottom-left': { x: shape.coordinates.x, y: shape.coordinates.y },
            'bottom-right': { x: shape.coordinates.x + width, y: shape.coordinates.y }
          }

          const handleSize = 10
          for (const [corner, pos] of Object.entries(corners)) {
            if (
              x >= pos.x - handleSize / 2 &&
              x <= pos.x + handleSize / 2 &&
              y >= pos.y - handleSize / 2 &&
              y <= pos.y + handleSize / 2
            ) {
              setHoveredCorner(corner as any)
              foundCorner = true
              break
            }
          }
        }
      })

      if (!foundCorner) {
        setHoveredCorner(null)
      }
    }

    if (isPanning && lastPanPoint) {
      const dx = (e.clientX - lastPanPoint.x) * 0.5
      const dy = (e.clientY - lastPanPoint.y) * 0.5

      // Apply rotation to the pan direction
      const angleInRadians = (rotation * Math.PI) / 180
      const cosAngle = Math.cos(angleInRadians)
      const sinAngle = Math.sin(angleInRadians)

      // Transform the pan vector according to rotation
      const rotatedDx = dx * cosAngle + dy * sinAngle
      const rotatedDy = dy * cosAngle - dx * sinAngle

      setPanOffset(prev => ({
        x: prev.x + rotatedDx,
        y: prev.y + rotatedDy
      }))

      setLastPanPoint({ x: e.clientX, y: e.clientY })
      requestAnimationFrame(applyImageAdjustments)
      return
    }

    if (!isDrawing || !startPos) return

    const { x, y } = screenToCanvas(e.clientX, e.clientY)

    switch (selectedTool) {
      case 'rectangle': {
        // Update preview without modifying state
        requestAnimationFrame(() => {
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          // Redraw base state
          applyImageAdjustments()

          // Draw preview shape
          ctx.save()
          const centerX = canvas.width / 2
          const centerY = canvas.height / 2
          const scale = zoom / 100
          const angleInRadians = (rotation * Math.PI) / 180

          ctx.translate(centerX, centerY)
          ctx.scale(scale, scale)
          ctx.rotate(angleInRadians)
          ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale)

          ctx.strokeStyle = textColor
          ctx.lineWidth = 2
          const width = x - startPos.x
          const height = y - startPos.y
          ctx.strokeRect(startPos.x, startPos.y, width, height)
          ctx.restore()
        })
        break
      }
      case 'circle': {
        // Update preview without modifying state
        requestAnimationFrame(() => {
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          // Redraw base state
          applyImageAdjustments()

          // Draw preview shape
          ctx.save()
          const centerX = canvas.width / 2
          const centerY = canvas.height / 2
          const scale = zoom / 100
          const angleInRadians = (rotation * Math.PI) / 180

          ctx.translate(centerX, centerY)
          ctx.scale(scale, scale)
          ctx.rotate(angleInRadians)
          ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale)

          ctx.strokeStyle = textColor
          ctx.lineWidth = 2
          const radius = Math.sqrt(
            Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
          )
          ctx.beginPath()
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
          ctx.stroke()
          ctx.restore()
        })
        break
      }
      case 'freehand': {
        if (lastDrawPoint.current) {
          setShapes(prev => {
            const lastShape = prev[prev.length - 1];
            if (lastShape?.type === ('freehand' as const)) {
              return prev.map(shape =>
                shape.id === lastShape.id
                  ? {
                    ...shape,
                    coordinates: {
                      ...shape.coordinates,
                      points: [...(shape.coordinates.points || []), { x, y }]
                    }
                  }
                  : shape
              );
            }
            return prev;
          });
          lastDrawPoint.current = { x, y };
          requestAnimationFrame(applyImageAdjustments);
        }
        break;
      }
    }

    // If measurement is active, update the preview
    if (measurementActive && measurementStart) {
      requestAnimationFrame(applyImageAdjustments)
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDraggingText) {
      setIsDraggingText(false)
      setDraggedTextId(null)
      setDragOffset(null)
      // Add timeout to prevent immediate text creation
      setJustFinishedResizing(true)
      setTimeout(() => {
        setJustFinishedResizing(false)
      }, 500)
      return
    }

    if (isResizing) {
      setIsResizing(false)
      setResizingTextId(null)
      setJustFinishedResizing(true)
      setTimeout(() => {
        setJustFinishedResizing(false)
      }, 500)
      return
    }

    if (!startPos) return

    const canvas = canvasRef.current
    if (!canvas) return

    if (isPanning) {
      setIsPanning(false)
      setLastPanPoint(null)
      return
    }

    if (!isDrawing) return

    const { x, y } = screenToCanvas(e.clientX, e.clientY)

    // Create the new shape
    let newShape: Shape | null = null;

    switch (selectedTool) {
      case 'rectangle': {
        const width = x - startPos.x
        const height = y - startPos.y
        newShape = {
          id: Math.random().toString(),
          type: 'rectangle',
          coordinates: {
            x: startPos.x,
            y: startPos.y,
            width,
            height
          },
          color: textColor
        }
        break
      }
      case 'circle': {
        const radius = Math.sqrt(
          Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
        )
        newShape = {
          id: Math.random().toString(),
          type: 'circle',
          coordinates: {
            x: startPos.x,
            y: startPos.y,
            radius
          },
          color: textColor
        }
        break
      }
    }

    // Reset states
    setIsDrawing(false)
    setStartPos(null)
    lastDrawPoint.current = null

    // Add the new shape and redraw immediately
    if (newShape) {
      // Update shapes state and force immediate redraw
      setShapes(prevShapes => {
        const updatedShapes = [...prevShapes, newShape]
        // Force immediate redraw with updated shapes
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          // Draw base image
          if (canvasImage) {
            ctx.drawImage(canvasImage, 0, 0)
          }
          // Draw all shapes including the new one
          updatedShapes.forEach(shape => {
            ctx.save()
            const centerX = canvas.width / 2
            const centerY = canvas.height / 2
            const scale = zoom / 100
            const angleInRadians = (rotation * Math.PI) / 180

            // Apply transformations
            ctx.translate(centerX, centerY)
            ctx.scale(scale, scale)
            ctx.rotate(angleInRadians)
            ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale)

            ctx.strokeStyle = shape.color
            ctx.lineWidth = 2

            if (shape.type === 'circle' && shape.coordinates.radius) {
              ctx.beginPath()
              ctx.arc(
                shape.coordinates.x,
                shape.coordinates.y,
                shape.coordinates.radius,
                0,
                2 * Math.PI
              )
              ctx.stroke()
            } else if (shape.type === 'rectangle' && shape.coordinates.width && shape.coordinates.height) {
              ctx.strokeRect(
                shape.coordinates.x,
                shape.coordinates.y,
                shape.coordinates.width,
                shape.coordinates.height
              )
            }
            ctx.restore()
          })
        }
        return updatedShapes
      })
    }
  }

  // Update text handling to fix modal positioning
  const handleTextAdd = (e: React.MouseEvent) => {
    if (selectedTool !== 'text') return
    const canvas = canvasRef.current
    if (!canvas) return

    const canvasCoords = screenToCanvas(e.clientX, e.clientY)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Check if clicking on existing text's resize handle
    const clickedText = shapes.find(shape => {
      if (shape.type !== 'text') return false

      const fontSize = 16 * (shape.scale || 1)
      ctx.font = `${fontSize}px Arial`
      const metrics = ctx.measureText(shape.coordinates.text || '')
      const width = metrics.width

      // Check if clicking resize handle (bottom-right corner)
      const handleX = shape.coordinates.x + width
      const handleY = shape.coordinates.y - fontSize
      const handleSize = 10
      const isOnResizeHandle =
        canvasCoords.x >= handleX - handleSize / 2 &&
        canvasCoords.x <= handleX + handleSize / 2 &&
        canvasCoords.y >= handleY - handleSize / 2 &&
        canvasCoords.y <= handleY + handleSize / 2

      if (isOnResizeHandle) {
        setResizingTextId(shape.id)
        setIsResizing(true)
        lastMousePos.current = { x: e.clientX, y: e.clientY }
        return true
      }

      // Check if clicking text body
      return (
        canvasCoords.x >= shape.coordinates.x &&
        canvasCoords.x <= shape.coordinates.x + width &&
        canvasCoords.y >= shape.coordinates.y - fontSize &&
        canvasCoords.y <= shape.coordinates.y
      )
    })

    if (clickedText) {
      if (!isResizing) {
        // Only open edit modal if not resizing
        setSelectedTextId(clickedText.id)
        setTextInput(clickedText.coordinates.text || '')
        setTextColor(clickedText.color)
        // Store both canvas and screen coordinates
        setTextPosition({
          x: clickedText.coordinates.x,
          y: clickedText.coordinates.y,
          screenX: e.clientX,
          screenY: e.clientY
        })
        setTextScale(clickedText.scale || 1)
      }
    } else {
      // Clicking empty space - create new text
      // Store both canvas and screen coordinates
      setTextPosition({
        x: canvasCoords.x,
        y: canvasCoords.y,
        screenX: e.clientX,
        screenY: e.clientY
      })
      setSelectedTextId(null)
      setTextInput('')
      setTextScale(4)
      setIsResizing(false)
      setResizingTextId(null)
    }
  }

  // Update applyImageAdjustments to handle transformations consistently
  const applyImageAdjustments = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !canvasImage) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Create a temporary canvas for the base image with filters
    const baseCanvas = document.createElement('canvas')
    const baseCtx = baseCanvas.getContext('2d')
    if (!baseCtx) return

    baseCanvas.width = canvas.width
    baseCanvas.height = canvas.height

    // Apply brightness and contrast to base image
    baseCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
    baseCtx.drawImage(canvasImage, 0, 0)

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

    // Restore context for shapes
    ctx.restore()

    // Draw all shapes with transformations
    shapes.forEach(shape => {
      ctx.save()

      // Apply the same transformations for shapes
      ctx.translate(centerX, centerY)
      ctx.scale(scale, scale)
      ctx.rotate(angleInRadians)
      ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale)

      ctx.strokeStyle = shape.color
      ctx.lineWidth = 2

      if (shape.type === ('freehand' as const) && shape.coordinates.points) {
        const points = shape.coordinates.points
        if (points.length > 1) {
          ctx.beginPath()
          ctx.moveTo(points[0].x, points[0].y)
          ctx.strokeStyle = shape.color
          ctx.lineWidth = (shape.penSize || 2) / scale

          // Draw smooth lines between points
          for (let i = 1; i < points.length; i++) {
            const xc = (points[i].x + points[i - 1].x) / 2
            const yc = (points[i].y + points[i - 1].y) / 2
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc)
          }

          ctx.stroke()
        }
      } else if (shape.type === 'text' && shape.coordinates.text) {
        const fontSize = 16 * (shape.scale || 1)
        ctx.font = `${fontSize}px Arial`
        ctx.fillStyle = shape.color

        const metrics = ctx.measureText(shape.coordinates.text)
        const width = metrics.width
        const height = fontSize

        // Draw dotted border
        ctx.setLineDash([2, 2])
        ctx.strokeStyle = '#666'
        ctx.strokeRect(
          shape.coordinates.x,
          shape.coordinates.y - height,
          width,
          height
        )
        ctx.setLineDash([])

        // Draw text
        ctx.fillText(
          shape.coordinates.text,
          shape.coordinates.x,
          shape.coordinates.y
        )

        // Always draw resize handles for all text
        const corners = {
          'top-left': { x: shape.coordinates.x, y: shape.coordinates.y - height },
          'top-right': { x: shape.coordinates.x + width, y: shape.coordinates.y - height },
          'bottom-left': { x: shape.coordinates.x, y: shape.coordinates.y },
          'bottom-right': { x: shape.coordinates.x + width, y: shape.coordinates.y }
        }

        for (const [corner, pos] of Object.entries(corners)) {
          ctx.fillStyle = hoveredCorner === corner && shape.id === selectedTextId ? '#0066ff' : '#000'
          ctx.fillRect(
            pos.x - 5,
            pos.y - 5,
            10,
            10
          )
        }
      } else if (shape.type === 'circle' && shape.coordinates.radius) {
        ctx.beginPath()
        ctx.arc(
          shape.coordinates.x,
          shape.coordinates.y,
          shape.coordinates.radius,
          0,
          2 * Math.PI
        )
        ctx.stroke()
      } else if (shape.type === 'rectangle' && shape.coordinates.width && shape.coordinates.height) {
        ctx.strokeRect(
          shape.coordinates.x,
          shape.coordinates.y,
          shape.coordinates.width,
          shape.coordinates.height
        )
      }

      ctx.restore()
    })

    // Draw measurements
    if (measurements.length > 0 || (measurementStart && measurementActive)) {
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.scale(scale, scale)
      ctx.rotate(angleInRadians)
      ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale)

      // Draw existing measurements with enhanced visibility
      measurements.forEach(measurement => {
        // Draw line
        ctx.beginPath()
        ctx.moveTo(measurement.start.x, measurement.start.y)
        ctx.lineTo(measurement.end.x, measurement.end.y)
        ctx.strokeStyle = measurement.color || textColor  // Use measurement's stored color if available
        ctx.lineWidth = 3  // Thicker line
        ctx.stroke()

        // Draw measurement text with larger size and better visibility
        // Use a consistent font size regardless of measurement scale
        ctx.font = 'bold 24px Arial'  // Fixed size that won't scale with measurement
        const text = `${measurement.length.toFixed(1)} mm`;
        const midX = (measurement.start.x + measurement.end.x) / 2
        const midY = (measurement.start.y + measurement.end.y) / 2

        // Add fancy background with rounded corners for better visibility
        ctx.textAlign = 'center';
        const metrics = ctx.measureText(text);
        const padding = 10;  // Increased from 6 to 10
        const bgWidth = metrics.width + padding * 2;
        const bgHeight = 34 + padding;  // Increased from 28 to 34
        const radius = 8;  // Increased from 6 to 8 - more rounded corners

        // Draw fancy semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        // Draw rounded rect
        ctx.beginPath();
        ctx.moveTo(midX - bgWidth / 2 + radius, midY - bgHeight / 2);
        ctx.lineTo(midX + bgWidth / 2 - radius, midY - bgHeight / 2);
        ctx.quadraticCurveTo(midX + bgWidth / 2, midY - bgHeight / 2, midX + bgWidth / 2, midY - bgHeight / 2 + radius);
        ctx.lineTo(midX + bgWidth / 2, midY + bgHeight / 2 - radius);
        ctx.quadraticCurveTo(midX + bgWidth / 2, midY + bgHeight / 2, midX + bgWidth / 2 - radius, midY + bgHeight / 2);
        ctx.lineTo(midX - bgWidth / 2 + radius, midY + bgHeight / 2);
        ctx.quadraticCurveTo(midX - bgWidth / 2, midY + bgHeight / 2, midX - bgWidth / 2, midY + bgHeight / 2 - radius);
        ctx.lineTo(midX - bgWidth / 2, midY - bgHeight / 2 + radius);
        ctx.quadraticCurveTo(midX - bgWidth / 2, midY - bgHeight / 2, midX - bgWidth / 2 + radius, midY - bgHeight / 2);
        ctx.closePath();
        ctx.fill();

        // Add slight border glow using the measurement's stored color
        ctx.shadowColor = measurement.color || textColor;
        ctx.shadowBlur = 8;

        // Draw text with bright color for maximum contrast
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, midX, midY + 4);  // +4 for vertical centering

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      })

      // Draw active measurement
      if (measurementStart && measurementActive && lastMousePos.current) {
        const mousePos = screenToCanvas(lastMousePos.current.x, lastMousePos.current.y)

        // Calculate angle for ruler direction
        const dx = mousePos.x - measurementStart.x
        const dy = mousePos.y - measurementStart.y
        const angle = Math.atan2(dy, dx)
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Draw decorative ruler background
        ctx.beginPath()

        // Calculate perpendicular vector for ruler width
        const perpX = -Math.sin(angle)
        const perpY = Math.cos(angle)
        const rulerWidth = 12

        // Draw ruler background as a rectangle with rounded ends
        ctx.beginPath()
        ctx.moveTo(
          measurementStart.x + perpX * rulerWidth / 2,
          measurementStart.y + perpY * rulerWidth / 2
        )
        ctx.lineTo(
          mousePos.x + perpX * rulerWidth / 2,
          mousePos.y + perpY * rulerWidth / 2
        )
        ctx.lineTo(
          mousePos.x - perpX * rulerWidth / 2,
          mousePos.y - perpY * rulerWidth / 2
        )
        ctx.lineTo(
          measurementStart.x - perpX * rulerWidth / 2,
          measurementStart.y - perpY * rulerWidth / 2
        )
        ctx.closePath()

        // Fill with a semi-transparent gradient
        const gradient = ctx.createLinearGradient(
          measurementStart.x, measurementStart.y,
          mousePos.x, mousePos.y
        )
        gradient.addColorStop(0, `${textColor}99`)  // Add transparency to the selected color
        gradient.addColorStop(1, `${textColor}99`)  // Add transparency to the selected color
        ctx.fillStyle = gradient
        ctx.fill()

        // Draw main ruler line
        ctx.beginPath()
        ctx.moveTo(measurementStart.x, measurementStart.y)
        ctx.lineTo(mousePos.x, mousePos.y)
        ctx.strokeStyle = textColor  // Use selected color
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw ruler ticks
        const tickLength = 6
        const majorTickLength = 10
        const tickSpacing = 10
        const numTicks = Math.floor(distance / tickSpacing)

        // Draw tick marks along the line
        for (let i = 1; i < numTicks; i++) {
          const ratio = i / numTicks
          const tickX = measurementStart.x + dx * ratio
          const tickY = measurementStart.y + dy * ratio

          // Determine if this is a major tick (every 5th tick)
          const isMajorTick = i % 5 === 0
          const currentTickLength = isMajorTick ? majorTickLength : tickLength

          // Calculate perpendicular direction for ticks
          const tickDx = perpX * currentTickLength
          const tickDy = perpY * currentTickLength

          // Draw tick
          ctx.beginPath()
          ctx.moveTo(tickX - tickDx / 2, tickY - tickDy / 2)
          ctx.lineTo(tickX + tickDx / 2, tickY + tickDy / 2)
          ctx.strokeStyle = isMajorTick ? textColor : `${textColor}99`  // Use selected color with transparency for minor ticks
          ctx.lineWidth = isMajorTick ? 2 : 1
          ctx.stroke()

          // Add measurement label for major ticks
          if (isMajorTick) {
            // Create shadow effect for better visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
            ctx.shadowBlur = 5
            ctx.shadowOffsetX = 1
            ctx.shadowOffsetY = 1

            // Use a consistent font size regardless of measurement scale
            ctx.font = 'bold 22px Arial'  // Fixed size that won't scale with measurement
            ctx.fillStyle = textColor  // Use the color from the color picker
            ctx.textAlign = 'center'
            const labelX = tickX + tickDx * 0.8
            const labelY = tickY + tickDy * 0.8

            if (!calibration) {
              ctx.fillText(`${i * tickSpacing}px`, labelX, labelY)
            } else {
              // If calibrated, show in mm with better formatting
              const mmValue = (i * tickSpacing * calibration.realWidth / calibration.pixelWidth).toFixed(1)
              ctx.fillText(`${mmValue} mm`, labelX, labelY)
            }

            // Reset shadow
            ctx.shadowColor = 'transparent'
            ctx.shadowBlur = 0
            ctx.shadowOffsetX = 0
            ctx.shadowOffsetY = 0
          }
        }

        // Draw endpoints with handles
        ctx.fillStyle = textColor  // Use selected color
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1.5

        // Start point 
        ctx.beginPath()
        ctx.arc(measurementStart.x, measurementStart.y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // End point
        ctx.beginPath()
        ctx.arc(mousePos.x, mousePos.y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // If we're in calibration mode, add instructional text
        if (!calibration) {
          // Remove all the special instructional text 
          // This entire block is intentionally left empty to remove all special instructions
        }
      }

      ctx.restore()
    }
  }

  // Add effect to handle brightness/contrast changes
  useEffect(() => {
    applyImageAdjustments()
  }, [brightness, contrast])

  // Update handleBrightnessChange to use the new state immediately
  const handleBrightnessChange = (value: number) => {
    setBrightness(value)
    requestAnimationFrame(applyImageAdjustments)
  }

  // Update handleContrastChange to use the new state immediately
  const handleContrastChange = (value: number) => {
    setContrast(value)
    requestAnimationFrame(applyImageAdjustments)
  }

  const handleMeasurement = async (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Always update lastMousePos when using measurement tool
    lastMousePos.current = { x: e.clientX, y: e.clientY }

    const { x, y } = screenToCanvas(e.clientX, e.clientY)

    // Make sure measurement tool works even without a selected image (for demo purposes)
    // but will prevent saving the calibration
    const canSaveCalibration = !!selectedImage

    if (!calibration) {
      // If no calibration exists, start calibration process
      if (!measurementStart) {
        setMeasurementStart({ x, y })
        setMeasurementActive(true)
        // Force a redraw to show the ruler immediately
        requestAnimationFrame(applyImageAdjustments)
      } else {
        // Calculate pixel dimensions
        const dx = x - measurementStart.x
        const dy = y - measurementStart.y
        const pixelLength = Math.sqrt(dx * dx + dy * dy)

        // Use fixed value of 15mm instead of prompting
        const realLength = 15; // Fixed calibration value of 15mm

        // Create a measurement object for the calibration measurement
        const calibrationMeasurement = {
          start: measurementStart,
          end: { x, y },
          length: realLength,
          pixelLength,
          color: textColor // Store the current color with the measurement
        };

        // Save the calibration measurement to the measurements array
        setMeasurements(prev => [...prev, calibrationMeasurement]);

        // Save the calibration measurement as an annotation if a patient image is selected
        if (canSaveCalibration) {
          try {
            // Save measurement as an annotation
            fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/annotations`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'MEASUREMENT',
                points: {
                  start: measurementStart,
                  end: { x, y }
                },
                color: textColor,  // Use the selected color
                size: 2,
                measurement: realLength
              })
            }).catch(console.error); // Handle errors silently
          } catch (error) {
            console.error("Error saving calibration measurement:", error);
          }
        }

        if (realLength > 0 && canSaveCalibration) {
          try {
            // Simplify calibration by using a single dimension
            const calibrationData = {
              pixelWidth: pixelLength,
              pixelHeight: pixelLength,
              realWidth: realLength,
              realHeight: realLength,
              unit: 'mm'
            }

            // Save calibration to database
            const response = await fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/calibration`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(calibrationData)
            })

            if (!response.ok) throw new Error('Failed to save calibration')

            const newCalibration = await response.json()
            setCalibration(newCalibration)

            toast({
              title: 'Calibration Complete',
              description: `Image calibrated: ${realLength} mm = ${Math.round(pixelLength)} pixels`
            })
          } catch (error) {
            toast({
              title: 'Error',
              description: 'Failed to save calibration',
              variant: 'destructive'
            })
          }
        } else if (realLength > 0) {
          // Create local calibration for demo purposes
          setCalibration({
            id: 'temp',
            pixelWidth: pixelLength,
            pixelHeight: pixelLength,
            realWidth: realLength,
            realHeight: realLength,
            unit: 'mm',
            imageId: 'temp',
            createdAt: new Date(),
            updatedAt: new Date()
          })

          toast({
            title: 'Temporary Calibration',
            description: `Image calibrated: ${realLength} mm = ${Math.round(pixelLength)} pixels (not saved)`
          })
        }

        // Reset measurement state
        setMeasurementStart(null)
        setMeasurementActive(false)
      }
    } else {
      // If calibrated, handle regular measurements
      if (!measurementStart) {
        setMeasurementStart({ x, y })
        setMeasurementActive(true)
        // Force a redraw to show the ruler immediately
        requestAnimationFrame(applyImageAdjustments)
      } else {
        // Calculate distance in pixels
        const dx = x - measurementStart.x
        const dy = y - measurementStart.y
        const pixelLength = Math.sqrt(dx * dx + dy * dy)

        // Calculate the scaling factor based on calibration
        const scale = calibration.realWidth / calibration.pixelWidth

        // Convert to real-world units using calibration
        const realLength = pixelLength * scale

        // Create a measurement object
        const newMeasurement = {
          start: measurementStart,
          end: { x, y },
          length: realLength,
          pixelLength,
          color: textColor // Store the current color with the measurement
        };

        // Save measurement to state
        setMeasurements(prev => [...prev, newMeasurement]);

        if (canSaveCalibration) {
          try {
            // Save measurement as an annotation
            const response = await fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/annotations`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'MEASUREMENT',
                points: {
                  start: measurementStart,
                  end: { x, y }
                },
                color: '#00ff00',
                size: 2,
                measurement: realLength
              })
            })

            if (!response.ok) throw new Error('Failed to save measurement')

            toast({
              title: 'Measurement Saved',
              description: `Distance: ${realLength.toFixed(2)} mm`
            })
          } catch (error) {
            toast({
              title: 'Error',
              description: 'Failed to save measurement',
              variant: 'destructive'
            })
          }
        } else {
          toast({
            title: 'Measurement Complete',
            description: `Distance: ${realLength.toFixed(2)} mm (not saved)`
          })
        }

        // Reset measurement state
        setMeasurementStart(null)
        setMeasurementActive(false)
      }
    }
  }

  const handleToolSelect = (toolId: string) => {
    // Close any open text modals when switching tools
    if (toolId !== 'text') {
      setTextPosition(null)
      setSelectedTextId(null)
    }

    // Reset measurement state when selecting the calibration tool
    if (toolId === 'calibrate') {
      setMeasurementStart(null)
      setMeasurementActive(false)
    }

    // For AI tools, execute the function immediately
    if (toolId === 'ai-detect') {
      handleAIDetection()
      return
    }
    if (toolId === 'ai-enhance') {
      handleAIEnhancement()
      return
    }

    setSelectedTool(toolId as ToolId)
  }

  const handleZoom = (value: number) => {
    setZoom(value)
    requestAnimationFrame(applyImageAdjustments)
  }

  const handleRotate = (direction: 'left' | 'right') => {
    const targetRotation = rotation + (direction === 'left' ? -90 : 90)

    // Set the target rotation value
    const startRotation = rotation
    const startTime = performance.now()
    const duration = 300 // animation duration in ms

    // Animation function
    const animateRotation = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smoother animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)

      // Calculate the current rotation value
      const currentRotation = startRotation + (targetRotation - startRotation) * easeOutCubic

      // Update rotation state
      setRotation(currentRotation)

      // Continue animation until complete
      if (progress < 1) {
        requestAnimationFrame(animateRotation)
      } else {
        // Ensure we end at exactly the target value
        setRotation(targetRotation)
      }

      // Redraw with the new rotation
      requestAnimationFrame(applyImageAdjustments)
    }

    // Start the animation
    requestAnimationFrame(animateRotation)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleImagePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.indexOf('image') === 0) {
        const blob = item.getAsFile()
        if (!blob) continue

        const url = URL.createObjectURL(blob)
        setTemporaryImage(url)
        toast({
          title: 'Temporary Image',
          description: 'Image pasted. Note: This is temporary and cannot be saved without selecting a patient.',
        })
        break
      }
    }
  }

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // If no patient is selected, handle first image as temporary
    if (!selectedPatient) {
      const url = URL.createObjectURL(files[0])
      setTemporaryImage(url)
      toast({
        title: 'Temporary Image',
        description: 'Image added. Note: This is temporary and cannot be saved without selecting a patient.',
      })
      return
    }

    // Handle multiple image upload
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'XRAY') // or determine type based on context

        const response = await fetch(`/api/patients/${selectedPatient.id}/images`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) throw new Error('Failed to upload image')
        return response.json()
      })

      const newImages = await Promise.all(uploadPromises)
      setImages(prev => [...prev, ...newImages])

      if (newImages.length > 0) {
        setSelectedImage(newImages[0])
      }

      toast({
        title: 'Success',
        description: `${newImages.length} image${newImages.length === 1 ? '' : 's'} uploaded successfully`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload one or more images',
        variant: 'destructive'
      })
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const items = Array.from(e.dataTransfer.items)
    const imageItems = items.filter(item => item.type.startsWith('image/'))

    if (imageItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please drop image files only',
        variant: 'destructive'
      })
      return
    }

    // If no patient is selected, handle as temporary image (only first image)
    if (!selectedPatient) {
      const firstImage = imageItems[0].getAsFile()
      if (!firstImage) return

      // Clear any existing temporary image
      if (temporaryImage) {
        URL.revokeObjectURL(temporaryImage)
      }

      const url = URL.createObjectURL(firstImage)
      setTemporaryImage(url)
      setSelectedImage(null) // Clear selected image when setting temporary
      toast({
        title: 'Temporary Image',
        description: 'Image dropped. Note: This is temporary and cannot be saved without selecting a patient.',
      })
      return
    }

    // Handle multiple image upload for selected patient
    try {
      const uploadPromises = imageItems.map(async (item) => {
        const file = item.getAsFile()
        if (!file) return null

        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'XRAY') // or determine type based on context

        const response = await fetch(`/api/patients/${selectedPatient.id}/images`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) throw new Error('Failed to upload image')
        return response.json()
      })

      const newImages = (await Promise.all(uploadPromises)).filter(Boolean)
      setImages(prev => [...prev, ...newImages])

      if (newImages.length > 0) {
        setSelectedImage(newImages[0])
      }

      toast({
        title: 'Success',
        description: `${newImages.length} image${newImages.length === 1 ? '' : 's'} uploaded successfully`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload one or more images',
        variant: 'destructive'
      })
    }
  }

  const handleSaveImage = async () => {
    if (!selectedPatient) {
      toast({
        title: 'Error',
        description: 'Please select a patient before saving images',
        variant: 'destructive'
      })
      return
    }

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
        const response = await fetch(`/api/patients/${selectedPatient.id}/images/${selectedImage.id}`, {
          method: 'PUT',
          body: formData
        })

        if (!response.ok) throw new Error('Failed to update image')

        toast({
          title: 'Success',
          description: 'Image updated successfully'
        })
      } else {
        // Creating a new image
        const response = await fetch(`/api/patients/${selectedPatient.id}/images`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) throw new Error('Failed to save image')

        const newImage = await response.json()
        setSelectedImage(newImage)
        setImages(prev => [...prev, newImage])

        toast({
          title: 'Success',
          description: 'Image saved successfully'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save image',
        variant: 'destructive'
      })
    }
  }

  const handleAIDetection = async () => {
    if (!selectedImage && !temporaryImage) return

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/png')
      })

      const formData = new FormData()
      formData.append('image', blob)

      toast({
        title: 'AI Detection',
        description: 'Analyzing image...'
      })

      const response = await fetch('/api/ai-detect', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Detection failed')

      const results = await response.json()

      // Draw detection results on canvas
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Save current transformations
      ctx.save()

      // Apply current view transformations
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const scale = zoom / 100
      const angleInRadians = (rotation * Math.PI) / 180

      ctx.translate(centerX, centerY)
      ctx.scale(scale, scale)
      ctx.rotate(angleInRadians)
      ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale)

      // Draw detections - handle Grounding DINO format
      results.detections.forEach((detection: any) => {
        const [x0, y0, x1, y1] = detection.box // Grounding DINO returns [x0, y0, x1, y1]
        const width = x1 - x0
        const height = y1 - y0
        const label = detection.label || 'Object'
        const score = detection.score || 0

        // Draw bounding box
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 2 / scale // Adjust line width for zoom
        ctx.strokeRect(x0, y0, width, height)

        // Draw label
        ctx.fillStyle = '#00ff00'
        ctx.font = `${14 / scale}px Arial` // Adjust font size for zoom
        ctx.fillText(
          `${label} (${(score * 100).toFixed(1)}%)`,
          x0,
          y0 - 5 / scale
        )

        // Save detection as annotation if we have a selected image
        if (selectedImage) {
          fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/annotations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'DETECTION',
              points: { x: x0, y: y0, width, height },
              text: `${label} (${(score * 100).toFixed(1)}%)`,
              color: '#00ff00',
              size: 2
            })
          }).catch(console.error)
        }
      })

      // Restore transformations
      ctx.restore()

      toast({
        title: 'Success',
        description: `Found ${results.detections.length} objects`
      })
    } catch (error) {
      console.error('Error in AI detection:', error)
      toast({
        title: 'Error',
        description: 'AI detection failed. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleAIEnhancement = async () => {
    if (!selectedImage && !temporaryImage) return
    setIsEnhancing(true)

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/png')
      })

      const formData = new FormData()
      formData.append('image', blob)

      toast({
        title: 'AI Enhancement',
        description: 'Enhancing image...'
      })

      const response = await fetch('/api/ai-enhance', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Enhancement failed')

      const enhancedImageBlob = await response.blob()
      const enhancedImageUrl = URL.createObjectURL(enhancedImageBlob)

      // Load enhanced image
      const img = new Image()
      img.onload = () => {
        setCanvasImage(img)
        // Reset adjustments when applying enhancement
        setBrightness(100)
        setContrast(100)
        applyImageAdjustments()

        // Save enhanced image if we have a selected image
        if (selectedImage) {
          const formData = new FormData()
          formData.append('file', enhancedImageBlob, 'enhanced.png')
          formData.append('type', selectedImage.type)

          fetch(`/api/patients/${selectedImage.patientId}/images`, {
            method: 'POST',
            body: formData
          })
            .then(response => response.json())
            .then(newImage => {
              setImages(prev => [...prev, newImage])
              toast({
                title: 'Success',
                description: 'Enhanced image saved'
              })
            })
            .catch(error => {
              console.error('Failed to save enhanced image:', error)
              toast({
                title: 'Warning',
                description: 'Enhanced image displayed but not saved',
                variant: 'destructive'
              })
            })
        }
      }
      img.src = enhancedImageUrl
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to enhance image. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleTextConfirm = () => {
    if (!textPosition) return

    if (selectedTextId) {
      // Update existing text
      setShapes(prev => prev.map(shape =>
        shape.id === selectedTextId
          ? {
            ...shape,
            coordinates: { ...shape.coordinates, text: textInput },
            color: textColor,
            scale: textScale
          }
          : shape
      ))
    } else {
      // Add new text
      const newShape: Shape = {
        id: Math.random().toString(),
        type: 'text',
        coordinates: { ...textPosition, text: textInput },
        color: textColor,
        scale: textScale
      }
      setShapes(prev => [...prev, newShape])
    }

    setTextInput('')
    setTextPosition(null)
    setSelectedTextId(null)
    applyImageAdjustments()
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    switch (selectedTool) {
      case 'text':
        if (!justFinishedResizing) {
          handleTextInteraction(e)
        }
        break
      case 'calibrate':
        handleMeasurement(e)
        break
    }
  }

  // Add effect to handle consistent redraws
  useEffect(() => {
    if (!canvasImage) return

    const redrawCanvas = () => {
      requestAnimationFrame(applyImageAdjustments)
    }

    // Initial draw
    redrawCanvas()

    // Set up animation frame for smooth updates
    let frameId: number
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      if (isPanning || isDrawing || measurementActive) {
        redrawCanvas()
      }
    }
    frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [
    canvasImage,
    brightness,
    contrast,
    zoom,
    rotation,
    panOffset,
    shapes,
    measurements,
    selectedTextId,
    textColor,
    measurementStart,
    measurementActive
  ])

  // Update image loading effect to ensure proper initialization
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

        setCanvasImage(img)
      }
      img.src = selectedImage?.url || temporaryImage || ''

      // If we have a selected image, load its calibration and annotations
      if (selectedImage) {
        try {
          // Load calibration
          const calibrationResponse = await fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/calibration`)
          if (calibrationResponse.ok) {
            const calibrationData = await calibrationResponse.json()
            setCalibration(calibrationData)
          }

          // Load annotations
          const annotationsResponse = await fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/annotations`)
          if (annotationsResponse.ok) {
            const annotationsData = await annotationsResponse.json()

            // Convert annotations to measurements and shapes
            const newMeasurements = []
            const newShapes = []

            for (const annotation of annotationsData) {
              if (annotation.type === 'MEASUREMENT') {
                newMeasurements.push({
                  start: annotation.points.start,
                  end: annotation.points.end,
                  length: annotation.measurement,
                  pixelLength: Math.sqrt(
                    Math.pow(annotation.points.end.x - annotation.points.start.x, 2) +
                    Math.pow(annotation.points.end.y - annotation.points.start.y, 2)
                  )
                })
              } else {
                newShapes.push({
                  id: annotation.id,
                  type: annotation.type.toLowerCase(),
                  coordinates: annotation.points,
                  color: annotation.color,
                  scale: annotation.size
                })
              }
            }

            setMeasurements(newMeasurements)
            setShapes(newShapes)
          }
        } catch (error) {
          console.error('Error loading image data:', error)
        }
      }
    }

    loadImage()

    // Cleanup
    return () => {
      if (temporaryImage) {
        URL.revokeObjectURL(temporaryImage)
      }
    }
  }, [selectedImage, temporaryImage])

  // Update text interaction handler to prioritize resize/move over modal
  const handleTextInteraction = (e: React.MouseEvent) => {
    if (selectedTool !== 'text') return
    e.preventDefault()

    // Ignore ALL interactions right after resizing/dragging
    if (justFinishedResizing) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const { x, y } = screenToCanvas(e.clientX, e.clientY)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Find clicked text
    const clickedText = shapes.find(shape => {
      if (shape.type !== 'text' || !shape.coordinates.text) return false

      const fontSize = 16 * (shape.scale || 1)
      ctx.font = `${fontSize}px Arial`
      const metrics = ctx.measureText(shape.coordinates.text)
      const width = metrics.width
      const height = fontSize

      // Define corner positions
      const corners = {
        'top-left': { x: shape.coordinates.x, y: shape.coordinates.y - height },
        'top-right': { x: shape.coordinates.x + width, y: shape.coordinates.y - height },
        'bottom-left': { x: shape.coordinates.x, y: shape.coordinates.y },
        'bottom-right': { x: shape.coordinates.x + width, y: shape.coordinates.y }
      }

      // First check if clicking any resize handle
      const handleSize = 10
      for (const [corner, pos] of Object.entries(corners)) {
        const isOnHandle =
          x >= pos.x - handleSize / 2 &&
          x <= pos.x + handleSize / 2 &&
          y >= pos.y - handleSize / 2 &&
          y <= pos.y + handleSize / 2

        if (isOnHandle && e.button === 0) { // Left click on handle
          setSelectedTextId(shape.id) // Select the text being resized
          setResizingTextId(shape.id)
          setIsResizing(true)
          setHoveredCorner(corner as any)
          lastMousePos.current = { x: e.clientX, y: e.clientY }
          return true
        }
      }

      // Then check if clicking text body - use the full text box area
      const isOnText =
        x >= shape.coordinates.x &&
        x <= shape.coordinates.x + width &&
        y >= shape.coordinates.y - height &&
        y <= shape.coordinates.y

      if (isOnText) {
        if (e.button === 2) { // Right click - open edit modal
          setSelectedTextId(shape.id)
          setTextInput(shape.coordinates.text)
          setTextColor(shape.color)
          setTextPosition({
            x: shape.coordinates.x,
            y: shape.coordinates.y,
            screenX: e.clientX,
            screenY: e.clientY
          })
          setTextScale(shape.scale || 1)
        } else if (e.button === 0) { // Left click - start dragging
          setSelectedTextId(shape.id)
          setIsDraggingText(true)
          setDraggedTextId(shape.id)
          setDragOffset({
            x: x - shape.coordinates.x,
            y: y - shape.coordinates.y
          })
        }
        return true
      }

      return false
    })

    // If clicking empty space with left click, start new text with higher default scale
    if (!clickedText && e.button === 0) {
      setTextPosition({
        x,
        y,
        screenX: e.clientX,
        screenY: e.clientY
      })
      setSelectedTextId(null)
      setTextInput('')
      setTextScale(1.5) // Increased default scale
      setIsResizing(false)
      setResizingTextId(null)
      setHoveredCorner(null)
    }
  }

  return (
    <div className="container w-full p-4 h-full">
      <div className="flex flex-col space-y-4 w-full">
        {/* Patient Search */}
        <div className="flex items-center space-x-2 w-full">
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[300px] justify-start">
                {selectedPatient ? (
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Search className="mr-2 h-4 w-4" />
                    <span>Search patients...</span>
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search patients..." value={searchQuery} onValueChange={setSearchQuery} />
                <CommandEmpty>No patients found.</CommandEmpty>
                <CommandGroup>
                  {filteredPatients.map((patient) => (
                    <CommandItem
                      key={patient.id}
                      onSelect={() => {
                        setSelectedPatient(patient)
                        setIsSearchOpen(false)
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      {`${patient.firstName} ${patient.lastName}`}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleAddImage}
          />
          <label htmlFor="image-upload">
            <Button variant="outline" asChild>
              <span>
                <Plus className="mr-2 h-4 w-4" />
                Add Image
              </span>
            </Button>
          </label>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-[auto,35%] gap-2 w-full h-full">
          {/* Canvas Area */}
          <div
            className="relative border rounded-lg overflow-hidden bg-gray-100 min-h-[600px]"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onPaste={handleImagePaste}
            onContextMenu={(e) => e.preventDefault()} // Prevent default context menu
          >
            {hasActiveImage ? (
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto"
                onClick={handleCanvasClick}
                onMouseDown={
                  selectedTool === 'calibrate' ?
                    handleMeasurement : // Direct measurement handling for calibrate tool
                    selectedTool === 'text' ?
                      handleTextInteraction :
                      handleMouseDown
                }
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={selectedTool === 'text' ? handleTextInteraction : undefined}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Drag and drop an image here, or use the Add Image button</p>
              </div>
            )}

            {/* Text Input Overlay */}
            {textPosition && (
              <div
                className="absolute z-50"
                style={{
                  position: 'fixed',
                  left: textPosition.screenX,
                  top: textPosition.screenY,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="flex flex-col space-y-2 bg-white p-2 rounded shadow-lg border">
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text..."
                    className="w-[200px]"
                    autoFocus
                  />
                  <div className="flex items-center space-x-2">
                    <Label>Scale:</Label>
                    <Slider
                      value={[textScale]}
                      onValueChange={([value]) => setTextScale(value)}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-[100px]"
                    />
                  </div>
                  <Button onClick={handleTextConfirm}>Confirm</Button>
                </div>
              </div>
            )}
          </div>

          {/* Tools Panel */}
          <div className="space-y-4">
            {/* Tools */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {tools.map((tool) => (
                    <Button
                      key={tool.id}
                      variant={selectedTool === tool.id ? "default" : "outline"}
                      className="w-full flex items-center justify-start gap-3 px-4 py-3 min-w-[11rem]"
                      onClick={() => handleToolSelect(tool.id)}
                    >
                      {tool.icon}
                      <span className="whitespace-nowrap">{tool.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Color Picker and Pen Size */}
            {(selectedTool === 'text' || selectedTool === 'freehand' || selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'calibrate') && (
              <div className="flex flex-col gap-4 py-2">
                <div className="flex items-center justify-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-10 h-10 p-0 rounded-full"
                        style={{ backgroundColor: textColor }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <HexColorPicker color={textColor} onChange={setTextColor} />
                    </PopoverContent>
                  </Popover>
                </div>
                {selectedTool === 'freehand' && (
                  <div className="space-y-2 px-2">
                    <Label>Pen Size ({penSize}px)</Label>
                    <Slider
                      value={[penSize]}
                      onValueChange={([value]) => setPenSize(value)}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Image Adjustments */}
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

            {/* Action Buttons */}
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
                        // Reset side when changing from/to bitewing
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
                  disabled={!selectedPatient || (selectedImageType === 'BITEWING' && !selectedSide)}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Image
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ImagingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <ImagingPageContent />
    </Suspense>
  );
}
