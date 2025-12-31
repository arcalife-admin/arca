"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { HexColorPicker } from 'react-colorful';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  PlusCircle,
  Upload,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Move,
  RectangleHorizontal,
  Circle,
  Type,
  PencilLine,
  Ruler as RulerIcon,
  Brain as BrainIcon,
  Wand2,
  Sun,
  Contrast,
  Eye,
  Grid3x3,
  Maximize2,
  Save,
  Trash2,
  X,
  Users,
  MoreVertical,
  MousePointer2,
  Eraser
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface PatientFile {
  id: string;
  url: string;
  name: string;
  type: string;
  size?: number;
  createdAt?: string;
}

interface PatientImage {
  id: string;
  url: string;
  type: 'BITEWING' | 'OPG' | 'SOLO' | 'XRAY' | 'INTRAORAL' | 'EXTRAORAL' | 'PANORAMIC' | 'CBCT';
  side?: 'LEFT' | 'RIGHT';
  dateTaken?: string;
  toothNumber?: number;
  notes?: string;
  patientId?: string;
}

interface EnhancedPatientImagesSectionProps {
  patientId: string;
  patientFiles: PatientFile[];
  patientImages: PatientImage[];
  onRefresh?: () => void;
}

// Advanced tool functionality types
interface Shape {
  id: string;
  serverId?: string; // id from backend annotation
  type: 'rectangle' | 'circle' | 'text' | 'freehand';
  coordinates: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    text?: string;
    points?: { x: number; y: number }[];
  };
  color: string;
  scale?: number;
  penSize?: number;
}

interface Measurement {
  id?: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;
  pixelLength: number;
  color?: string;
}

interface Calibration {
  pixelWidth?: number;
  pixelHeight?: number;
  realWidth?: number;
  realHeight?: number;
  unit?: string;
}

interface Annotation {
  id: string;
  type: 'MEASUREMENT' | 'TEXT' | 'CIRCLE' | 'RECTANGLE' | 'FREEHAND';
  points: any;
  color: string;
  size: number;
  measurement?: number;
}

type ViewPreference =
  | 'latest_bitewings_opg'
  | 'recent_and_previous_bitewings'
  | 'chronological_all'
  | 'by_type'
  | 'custom_grid';

type ToolId = 'cursor' | 'pan' | 'rectangle' | 'circle' | 'text' | 'freehand' | 'calibrate' | 'eraser' | 'ai-detect' | 'ai-enhance';

interface Tool {
  id: ToolId;
  name: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const tools: Tool[] = [
  { id: 'cursor', name: 'Cursor', icon: <MousePointer2 className="h-4 w-4" />, shortcut: 'V' },
  { id: 'pan', name: 'Pan', icon: <Move className="h-4 w-4" />, shortcut: 'H' },
  { id: 'rectangle', name: 'Rectangle', icon: <RectangleHorizontal className="h-4 w-4" />, shortcut: 'R' },
  { id: 'circle', name: 'Circle', icon: <Circle className="h-4 w-4" />, shortcut: 'C' },
  { id: 'text', name: 'Text', icon: <Type className="h-4 w-4" />, shortcut: 'T' },
  { id: 'freehand', name: 'Freehand', icon: <PencilLine className="h-4 w-4" />, shortcut: 'F' },
  { id: 'eraser', name: 'Eraser', icon: <Eraser className="h-4 w-4" />, shortcut: 'E' },
  { id: 'calibrate', name: 'Calibrate', icon: <RulerIcon className="h-4 w-4" />, shortcut: 'M' },
  { id: 'ai-detect', name: 'AI Detection', icon: <BrainIcon className="h-4 w-4" /> },
  { id: 'ai-enhance', name: 'AI Enhancement', icon: <Wand2 className="h-4 w-4" /> }
];

const viewPreferences: { value: ViewPreference; label: string; description: string }[] = [
  {
    value: 'latest_bitewings_opg',
    label: 'Latest Bitewings + OPG',
    description: 'Show latest bitewing pair with OPG underneath'
  },
  {
    value: 'recent_and_previous_bitewings',
    label: 'Recent & Previous Bitewings',
    description: 'Current bitewings on top, previous set below'
  },
  {
    value: 'chronological_all',
    label: 'Chronological All Images',
    description: 'All images sorted by date (newest first)'
  },
  {
    value: 'by_type',
    label: 'Grouped by Type',
    description: 'Group images by X-ray type (OPG, Bitewing, etc.)'
  },
  {
    value: 'custom_grid',
    label: 'Custom Grid Layout',
    description: 'Drag and arrange images in custom positions'
  }
];

export const EnhancedPatientImagesSection: React.FC<EnhancedPatientImagesSectionProps> = ({
  patientId,
  patientFiles,
  patientImages,
  onRefresh
}) => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State management
  const [viewPreference, setViewPreference] = useState<ViewPreference>('latest_bitewings_opg');
  const [selectedImage, setSelectedImage] = useState<PatientImage | null>(null);
  const [activeTab, setActiveTab] = useState<'xray' | 'light'>('xray');
  const [selectedTool, setSelectedTool] = useState<ToolId>('cursor');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Advanced tool functionality state
  const [canvasImage, setCanvasImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [calibration, setCalibration] = useState<Calibration | null>(null);
  const [measurementStart, setMeasurementStart] = useState<{ x: number; y: number } | null>(null);
  const [measurementActive, setMeasurementActive] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);
  const [textColor, setTextColor] = useState('#ff0000');
  const [penSize, setPenSize] = useState(2);
  const [textScale, setTextScale] = useState(1);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number; screenX: number; screenY: number } | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCorner, setHoveredCorner] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingTextId, setResizingTextId] = useState<string | null>(null);
  const [justFinishedResizing, setJustFinishedResizing] = useState(false);
  const lastDrawPoint = useRef<{ x: number; y: number } | null>(null);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  // Drag and drop state
  const [draggedImage, setDraggedImage] = useState<PatientImage | null>(null);
  const [dragOverContainer, setDragOverContainer] = useState<string | null>(null);

  // Move/delete functionality
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedImageForAction, setSelectedImageForAction] = useState<PatientImage | null>(null);
  const [targetPatientSearch, setTargetPatientSearch] = useState('');
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);

  // Categorize images
  const xrayImages = patientImages?.filter(img =>
    ['BITEWING', 'OPG', 'SOLO', 'XRAY', 'PANORAMIC', 'CBCT'].includes(img.type)
  ) || [];

  const lightImages = [
    ...(patientFiles?.filter(file => file.type?.startsWith('image/')) || []),
    ...(patientImages?.filter(img =>
      ['INTRAORAL', 'EXTRAORAL'].includes(img.type)
    ).map(img => ({
      id: img.id,
      url: img.url,
      name: `${img.type} ${img.dateTaken ? `(${new Date(img.dateTaken).toLocaleDateString()})` : ''}`,
      type: 'image/jpeg'
    })) || [])
  ];

  // Sort images by date taken (newest first)
  const sortedXrayImages = [...xrayImages].sort((a, b) => {
    const dateA = a.dateTaken ? new Date(a.dateTaken).getTime() : 0;
    const dateB = b.dateTaken ? new Date(b.dateTaken).getTime() : 0;
    return dateB - dateA;
  });

  // Group images by type for organized display
  const groupedImages = sortedXrayImages.reduce((groups, image) => {
    const type = image.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(image);
    return groups;
  }, {} as Record<string, PatientImage[]>);

  // Get images based on view preference
  const getImagesForView = useCallback(() => {
    switch (viewPreference) {
      case 'latest_bitewings_opg':
        const latestBitewings = groupedImages['BITEWING']?.slice(0, 2) || [];
        const latestOPG = groupedImages['OPG']?.[0] ? [groupedImages['OPG'][0]] : [];
        return { top: latestBitewings, bottom: latestOPG };

      case 'recent_and_previous_bitewings':
        const recentBitewings = groupedImages['BITEWING']?.slice(0, 2) || [];
        const previousBitewings = groupedImages['BITEWING']?.slice(2, 4) || [];
        return { top: recentBitewings, bottom: previousBitewings };

      case 'chronological_all':
        return { grid: sortedXrayImages };

      case 'by_type':
        return { grouped: groupedImages };

      case 'custom_grid':
        return { custom: sortedXrayImages };

      default:
        return { top: [], bottom: [] };
    }
  }, [viewPreference, groupedImages, sortedXrayImages]);

  // Helper function to convert screen coordinates to canvas coordinates
  const screenToCanvas = (screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get coordinates relative to canvas
    const canvasX = (screenX - rect.left) * scaleX;
    const canvasY = (screenY - rect.top) * scaleY;

    // Apply inverse transformations to get image coordinates
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = zoom / 100;
    const angleInRadians = (-rotation * Math.PI) / 180; // Negative for inverse

    // Translate to center
    let x = canvasX - centerX;
    let y = canvasY - centerY;

    // Apply inverse scale
    x = x / scale;
    y = y / scale;

    // Apply inverse rotation
    const cos = Math.cos(angleInRadians);
    const sin = Math.sin(angleInRadians);
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;

    // Apply inverse pan
    const finalX = rotatedX + centerX - panOffset.x / scale;
    const finalY = rotatedY + centerY - panOffset.y / scale;

    return { x: finalX, y: finalY };
  };

  // Advanced image adjustment function with canvas drawing capabilities
  const applyImageAdjustments = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !canvasImage) return;

    // Store original dimensions
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create a temporary canvas for the base image with filters
    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = originalWidth;
    baseCanvas.height = originalHeight;
    const baseCtx = baseCanvas.getContext('2d');
    if (!baseCtx) return;

    // Apply brightness and contrast to base image
    baseCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    baseCtx.drawImage(canvasImage, 0, 0, originalWidth, originalHeight);

    // Save context state for main canvas
    ctx.save();

    // Apply transformations from center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = zoom / 100;
    const angleInRadians = (rotation * Math.PI) / 180;

    // Move to center
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.rotate(angleInRadians);
    ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale);

    // Draw the filtered base image
    ctx.drawImage(baseCanvas, 0, 0);

    // Restore context
    ctx.restore();

    // Draw all shapes with transformations
    shapes.forEach(shape => {
      ctx.save();

      // Apply the same transformations for shapes
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.rotate(angleInRadians);
      ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale);

      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2;

      if (shape.type === 'freehand' && shape.coordinates.points) {
        const points = shape.coordinates.points;
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          ctx.strokeStyle = shape.color;
          ctx.lineWidth = (shape.penSize || 2) / scale;

          // Draw smooth lines between points
          for (let i = 1; i < points.length; i++) {
            const xc = (points[i].x + points[i - 1].x) / 2;
            const yc = (points[i].y + points[i - 1].y) / 2;
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
          }

          ctx.stroke();
        }
      } else if (shape.type === 'text' && shape.coordinates.text) {
        const fontSize = 16 * (shape.scale || 1);
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = shape.color;

        const metrics = ctx.measureText(shape.coordinates.text);
        const width = metrics.width;
        const height = fontSize;

        // Draw dotted border
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(
          shape.coordinates.x,
          shape.coordinates.y - height,
          width,
          height
        );
        ctx.setLineDash([]);

        // Draw text
        ctx.fillText(
          shape.coordinates.text,
          shape.coordinates.x,
          shape.coordinates.y
        );

        // Draw resize handles for text
        const corners = {
          'top-left': { x: shape.coordinates.x, y: shape.coordinates.y - height },
          'top-right': { x: shape.coordinates.x + width, y: shape.coordinates.y - height },
          'bottom-left': { x: shape.coordinates.x, y: shape.coordinates.y },
          'bottom-right': { x: shape.coordinates.x + width, y: shape.coordinates.y }
        };

        for (const [corner, pos] of Object.entries(corners)) {
          ctx.fillStyle = hoveredCorner === corner && shape.id === selectedTextId ? '#0066ff' : '#000';
          ctx.fillRect(pos.x - 5, pos.y - 5, 10, 10);
        }
      } else if (shape.type === 'circle' && shape.coordinates.radius) {
        ctx.beginPath();
        ctx.arc(
          shape.coordinates.x,
          shape.coordinates.y,
          shape.coordinates.radius,
          0,
          2 * Math.PI
        );
        ctx.stroke();
      } else if (shape.type === 'rectangle' && shape.coordinates.width && shape.coordinates.height) {
        ctx.strokeRect(
          shape.coordinates.x,
          shape.coordinates.y,
          shape.coordinates.width,
          shape.coordinates.height
        );
      }

      ctx.restore();
    });

    // Draw measurements
    if (measurements.length > 0 || (measurementStart && measurementActive)) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.rotate(angleInRadians);
      ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale);

      // Draw existing measurements
      measurements.forEach(measurement => {
        ctx.beginPath();
        ctx.moveTo(measurement.start.x, measurement.start.y);
        ctx.lineTo(measurement.end.x, measurement.end.y);
        ctx.strokeStyle = measurement.color || textColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw measurement text with larger size and better visibility
        // Use a consistent font size regardless of measurement scale
        ctx.font = 'bold 24px Arial';  // Fixed size that won't scale with measurement
        const lengthVal = measurement.length;
        // Guard against invalid or missing length values to prevent runtime errors
        let labelText = '';
        if (typeof lengthVal === 'number' && isFinite(lengthVal)) {
          labelText = `${lengthVal.toFixed(1)} mm`;
        }
        if (!labelText) {
          // Skip drawing label if invalid
          ctx.restore();
          return;
        }
        const text = labelText;
        const midX = (measurement.start.x + measurement.end.x) / 2;
        const midY = (measurement.start.y + measurement.end.y) / 2;

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
      });

      // Draw active measurement - only when tool is calibrate and measurement is truly active
      if (measurementStart && measurementActive && lastMousePos.current && selectedTool === 'calibrate') {
        const mousePos = screenToCanvas(lastMousePos.current.x, lastMousePos.current.y);

        ctx.beginPath();
        ctx.moveTo(measurementStart.x, measurementStart.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw endpoints
        ctx.fillStyle = textColor;
        ctx.beginPath();
        ctx.arc(measurementStart.x, measurementStart.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }, [canvasImage, brightness, contrast, zoom, rotation, panOffset, shapes, measurements, selectedTextId, textColor, measurementStart, measurementActive, hoveredCorner]);

  // Image manipulation functions
  const handleZoom = (value: number) => {
    setZoom(value);
    requestAnimationFrame(applyImageAdjustments);
  };

  const handleRotate = (direction: 'left' | 'right') => {
    const newRotation = rotation + (direction === 'left' ? -90 : 90);
    setRotation(newRotation);
    requestAnimationFrame(applyImageAdjustments);
  };

  const handleBrightnessChange = (value: number) => {
    setBrightness(value);
    requestAnimationFrame(applyImageAdjustments);
  };

  const handleContrastChange = (value: number) => {
    setContrast(value);
    requestAnimationFrame(applyImageAdjustments);
  };

  // Handle image selection
  const handleImageSelect = (image: PatientImage) => {
    setSelectedImage(image);
    // Reset adjustments when selecting new image
    setZoom(100);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setPanOffset({ x: 0, y: 0 });
    setShapes([]);
    setMeasurements([]);
    setCalibration(null);
  };

  // Helpers for improved click-vs-drag detection on text
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  // Mouse interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // If cursor tool is selected, don't do anything on canvas - allow normal interaction
    if (selectedTool === 'cursor') {
      return;
    }

    lastMousePos.current = { x: e.clientX, y: e.clientY };
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    setStartPos({ x, y });

    if (selectedTool === 'calibrate') {
      // Start measurement on mouse down (click-drag-release style)
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      setMeasurementStart({ x, y });
      setMeasurementActive(true);
      return; // Skip further drawing logic
    }

    if (selectedTool === 'pan') {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (selectedTool === 'freehand') {
      setIsDrawing(true);
      const newShape: Shape = {
        id: Math.random().toString(),
        type: 'freehand',
        coordinates: {
          x: x,
          y: y,
          points: [{ x, y }]
        },
        color: textColor,
        penSize: penSize
      };
      setShapes(prev => [...prev, newShape]);
      lastDrawPoint.current = { x, y };
    } else if (selectedTool === 'text') {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Detect if click is on existing text or its handles
      let found = false;
      shapes.forEach(shape => {
        if (found || shape.type !== 'text' || !shape.coordinates.text) return;

        const fontSize = 16 * (shape.scale || 1);
        ctx.font = `${fontSize}px Arial`;
        const metrics = ctx.measureText(shape.coordinates.text);
        const width = metrics.width;
        const height = fontSize;

        const corners = {
          'top-left': { x: shape.coordinates.x, y: shape.coordinates.y - height },
          'top-right': { x: shape.coordinates.x + width, y: shape.coordinates.y - height },
          'bottom-left': { x: shape.coordinates.x, y: shape.coordinates.y },
          'bottom-right': { x: shape.coordinates.x + width, y: shape.coordinates.y }
        } as const;

        const handleSize = 15;
        Object.entries(corners).forEach(([corner, pos]) => {
          if (
            x >= pos.x - handleSize / 2 &&
            x <= pos.x + handleSize / 2 &&
            y >= pos.y - handleSize / 2 &&
            y <= pos.y + handleSize / 2
          ) {
            // Start resizing
            setSelectedTextId(shape.id);
            setResizingTextId(shape.id);
            setIsResizing(true);
            setHoveredCorner(corner as any);
            found = true;
          }
        });

        if (found) return;

        // Check body hit
        const isOnText =
          x >= shape.coordinates.x &&
          x <= shape.coordinates.x + width &&
          y >= shape.coordinates.y - height &&
          y <= shape.coordinates.y;

        if (isOnText) {
          // Start dragging
          setSelectedTextId(shape.id);
          setIsDraggingText(true);
          setDraggedTextId(shape.id);
          setDragOffset({ x: x - shape.coordinates.x, y: y - shape.coordinates.y });
          found = true;
        }
      });

      if (found) {
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        didDrag.current = false;
        // prevent canvas shape drawing logic
        return;
      }
      // If click is not on text -> we'll allow creation in mouse up
    } else {
      setIsDrawing(true);
      lastDrawPoint.current = { x, y };
    }

    if (selectedTool === 'eraser') {
      setIsErasing(true);
      performErase(e.clientX, e.clientY);
      return;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setJustFinishedResizing(false); // Clear the flag on mouse move

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update last mouse position ONLY when measurement tool is active and measurement is in progress
    if (measurementActive && measurementStart && selectedTool === 'calibrate') {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      requestAnimationFrame(applyImageAdjustments);
    }

    // Handle text dragging - prioritized and simplified
    if (isDraggingText && draggedTextId && dragOffset) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      // mark that a drag movement occurred
      if (dragStartPos.current && !didDrag.current) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 2) didDrag.current = true;
      }
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
      ));
      requestAnimationFrame(applyImageAdjustments);
      return;
    }

    // Handle text resizing with proper cursor following
    if (isResizing && resizingTextId && lastMousePos.current) {
      if (dragStartPos.current && !didDrag.current) {
        const dxTemp = e.clientX - dragStartPos.current.x;
        const dyTemp = e.clientY - dragStartPos.current.y;
        if (Math.sqrt(dxTemp * dxTemp + dyTemp * dyTemp) > 2) didDrag.current = true;
      }
      const { x: currentX, y: currentY } = screenToCanvas(e.clientX, e.clientY);

      setShapes(prev => prev.map(shape => {
        if (shape.id === resizingTextId && shape.type === 'text' && shape.coordinates.text) {
          const fontSize = 16 * (shape.scale || 1);
          const ctx = canvas.getContext('2d');
          if (!ctx) return shape;

          ctx.font = `${fontSize}px Arial`;
          const metrics = ctx.measureText(shape.coordinates.text);
          const width = metrics.width;
          const height = fontSize;

          // Calculate the original text box corners
          const corners = {
            'top-left': { x: shape.coordinates.x, y: shape.coordinates.y - height },
            'top-right': { x: shape.coordinates.x + width, y: shape.coordinates.y - height },
            'bottom-left': { x: shape.coordinates.x, y: shape.coordinates.y },
            'bottom-right': { x: shape.coordinates.x + width, y: shape.coordinates.y }
          };

          // Get the original corner position being dragged
          const originalCorner = corners[hoveredCorner || 'bottom-right'];
          if (!originalCorner) return shape;

          // Calculate the distance from the original corner to the current mouse position
          const dx = currentX - originalCorner.x;
          const dy = currentY - originalCorner.y;

          // Calculate new scale based on the change in width
          let newScale = shape.scale || 1;
          const originalWidth = width / newScale; // Get the base width without scale

          switch (hoveredCorner) {
            case 'bottom-right':
            case 'top-right': {
              // Scale based on width change
              const desiredWidth = width + dx;
              newScale = Math.max(0.5, desiredWidth / originalWidth);
              break;
            }
            case 'bottom-left':
            case 'top-left': {
              // Scale based on width change, but from right to left
              const desiredWidth = width - dx;
              newScale = Math.max(0.5, desiredWidth / originalWidth);
              // Adjust x position to maintain right side position
              shape.coordinates.x = shape.coordinates.x + width - (originalWidth * newScale);
              break;
            }
          }

          return {
            ...shape,
            scale: newScale
          };
        }
        return shape;
      }));

      requestAnimationFrame(applyImageAdjustments);
      return;
    }

    // Handle text corner hover detection
    if (selectedTool === 'text' && !isResizing && !isDraggingText) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let foundCorner = false;
      shapes.forEach(shape => {
        if (shape.type === 'text' && shape.coordinates.text) {
          const fontSize = 16 * (shape.scale || 1);
          ctx.font = `${fontSize}px Arial`;
          const metrics = ctx.measureText(shape.coordinates.text);
          const width = metrics.width;
          const height = fontSize;

          const corners = {
            'top-left': { x: shape.coordinates.x, y: shape.coordinates.y - height },
            'top-right': { x: shape.coordinates.x + width, y: shape.coordinates.y - height },
            'bottom-left': { x: shape.coordinates.x, y: shape.coordinates.y },
            'bottom-right': { x: shape.coordinates.x + width, y: shape.coordinates.y }
          };

          const handleSize = 10;
          for (const [corner, pos] of Object.entries(corners)) {
            if (
              x >= pos.x - handleSize / 2 &&
              x <= pos.x + handleSize / 2 &&
              y >= pos.y - handleSize / 2 &&
              y <= pos.y + handleSize / 2
            ) {
              setHoveredCorner(corner as any);
              foundCorner = true;
              break;
            }
          }
        }
      });

      if (!foundCorner) {
        setHoveredCorner(null);
      }
    }

    if (isPanning && lastPanPoint) {
      const dx = (e.clientX - lastPanPoint.x) * 0.5;
      const dy = (e.clientY - lastPanPoint.y) * 0.5;

      // Apply rotation to the pan direction
      const angleInRadians = (rotation * Math.PI) / 180;
      const cosAngle = Math.cos(angleInRadians);
      const sinAngle = Math.sin(angleInRadians);

      // Transform the pan vector according to rotation
      const rotatedDx = dx * cosAngle + dy * sinAngle;
      const rotatedDy = dy * cosAngle - dx * sinAngle;

      setPanOffset(prev => ({
        x: prev.x + rotatedDx,
        y: prev.y + rotatedDy
      }));

      setLastPanPoint({ x: e.clientX, y: e.clientY });
      requestAnimationFrame(applyImageAdjustments);
      return;
    }

    if (!isDrawing || !startPos) return;

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    switch (selectedTool) {
      case 'rectangle': {
        // Update preview without modifying state
        requestAnimationFrame(() => {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Redraw base state
          applyImageAdjustments();

          // Draw preview shape
          ctx.save();
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const scale = zoom / 100;
          const angleInRadians = (rotation * Math.PI) / 180;

          ctx.translate(centerX, centerY);
          ctx.scale(scale, scale);
          ctx.rotate(angleInRadians);
          ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale);

          ctx.strokeStyle = textColor;
          ctx.lineWidth = 2;
          const width = x - startPos.x;
          const height = y - startPos.y;
          ctx.strokeRect(startPos.x, startPos.y, width, height);
          ctx.restore();
        });
        break;
      }
      case 'circle': {
        // Update preview without modifying state
        requestAnimationFrame(() => {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Redraw base state
          applyImageAdjustments();

          // Draw preview shape
          ctx.save();
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const scale = zoom / 100;
          const angleInRadians = (rotation * Math.PI) / 180;

          ctx.translate(centerX, centerY);
          ctx.scale(scale, scale);
          ctx.rotate(angleInRadians);
          ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale);

          ctx.strokeStyle = textColor;
          ctx.lineWidth = 2;
          const radius = Math.sqrt(
            Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
          );
          ctx.beginPath();
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.restore();
        });
        break;
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

    if (measurementActive && measurementStart) {
      requestAnimationFrame(applyImageAdjustments);
    }

    if (isErasing) {
      performErase(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // --- Complete text dragging / resizing ---------------------------------------
    if (isDraggingText || (isResizing && resizingTextId)) {
      const clickWithoutMove = !didDrag.current;

      // Reset drag / resize states
      setIsDraggingText(false);
      setDraggedTextId(null);
      setDragOffset(null);
      setIsResizing(false);
      setResizingTextId(null);
      setHoveredCorner(null);

      // Add a short cooldown ONLY if there was an actual drag/resize movement
      if (didDrag.current) {
        setJustFinishedResizing(true);
        setTimeout(() => setJustFinishedResizing(false), 800);
      }

      dragStartPos.current = null;

      // If it was essentially a click, open edit modal immediately
      if (clickWithoutMove) {
        handleTextInteraction(e);
      }

      // Reset drag flag
      didDrag.current = false;
      return;
    }

    // Handle text resizing completion
    if (isResizing && resizingTextId) {
      setIsResizing(false);
      setResizingTextId(null);
      setHoveredCorner(null);
      setJustFinishedResizing(true);
      setTimeout(() => {
        setJustFinishedResizing(false);
      }, 800);
      return;
    }

    if (!startPos) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanning) {
      setIsPanning(false);
      setLastPanPoint(null);
      return;
    }

    if (!isDrawing) return;

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    let newShape: Shape | null = null;

    switch (selectedTool) {
      case 'rectangle':
        const width = x - startPos.x;
        const height = y - startPos.y;
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
        };
        break;
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
        );
        newShape = {
          id: Math.random().toString(),
          type: 'circle',
          coordinates: {
            x: startPos.x,
            y: startPos.y,
            radius
          },
          color: textColor
        };
        break;
    }

    setIsDrawing(false);
    setStartPos(null);
    lastDrawPoint.current = null;

    if (newShape) {
      setShapes(prevShapes => {
        const updatedShapes = [...prevShapes, newShape];
        // Persist to DB
        saveShapeToServer(newShape);
        requestAnimationFrame(applyImageAdjustments);
        return updatedShapes;
      });
    }

    // Finish measurement on mouse up
    if (selectedTool === 'calibrate' && measurementActive && measurementStart) {
      // Complete the measurement
      handleMeasurement(e);
      // Immediately clear measurement state to prevent cursor following
      setMeasurementActive(false);
      setMeasurementStart(null);
      lastMousePos.current = null;
      return;
    }

    if (isErasing) {
      setIsErasing(false);
      return;
    }
  };

  // Copy exact measurement logic from imaging page with mm calibration
  const handleMeasurement = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    // Make sure measurement tool works even without a selected image (for demo purposes)
    // but will prevent saving the calibration
    const canSaveCalibration = !!selectedImage;

    if (!calibration) {
      // If no calibration exists, start calibration process
      if (!measurementStart) {
        setMeasurementStart({ x, y });
        setMeasurementActive(true);
        // Force a redraw to show the ruler immediately
        requestAnimationFrame(applyImageAdjustments);
      } else {
        // Calculate pixel dimensions
        const dx = x - measurementStart.x;
        const dy = y - measurementStart.y;
        const pixelLength = Math.sqrt(dx * dx + dy * dy);

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
            };

            // Save calibration to database
            const response = await fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/calibration`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(calibrationData)
            });

            if (!response.ok) throw new Error('Failed to save calibration');

            const newCalibration = await response.json();
            setCalibration(newCalibration);

            toast.success(`Calibration Complete: ${realLength} mm = ${Math.round(pixelLength)} pixels`);
          } catch (error) {
            toast.error('Failed to save calibration');
          }
        } else if (realLength > 0) {
          // Create local calibration for demo purposes
          setCalibration({
            pixelWidth: pixelLength,
            realWidth: realLength
          });

          toast.success(`Temporary Calibration: ${realLength} mm = ${Math.round(pixelLength)} pixels (not saved)`);
        }

        // Reset measurement state
        setMeasurementStart(null);
        setMeasurementActive(false);
        lastMousePos.current = null; // Clear mouse position to prevent cursor following

        // Immediate redraw to clear transient line
        requestAnimationFrame(applyImageAdjustments);
      }
    } else {
      // If calibrated, handle regular measurements
      if (!measurementStart) {
        setMeasurementStart({ x, y });
        setMeasurementActive(true);
        // Force a redraw to show the ruler immediately
        requestAnimationFrame(applyImageAdjustments);
      } else {
        // Calculate distance in pixels
        const dx = x - measurementStart.x;
        const dy = y - measurementStart.y;
        const pixelLength = Math.sqrt(dx * dx + dy * dy);

        // Calculate the scaling factor based on calibration
        // Handle both database format (with pixelHeight/realHeight) and local format
        const calibPixelWidth = calibration.pixelWidth || calibration.pixelHeight;
        const calibRealWidth = calibration.realWidth || calibration.realHeight;

        if (!calibPixelWidth || !calibRealWidth || calibPixelWidth === 0) {
          toast.error('Invalid calibration data. Please recalibrate.');
          return;
        }

        const scale = calibRealWidth / calibPixelWidth;

        // Convert to real-world units using calibration
        const realLength = pixelLength * scale;

        // Validate the result
        if (!isFinite(realLength) || realLength <= 0) {
          toast.error('Invalid measurement result. Please check calibration.');
          return;
        }

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
            });

            if (!response.ok) throw new Error('Failed to save measurement');

            toast.success(`Measurement Saved: ${realLength.toFixed(2)} mm`);
          } catch (error) {
            toast.error('Failed to save measurement');
          }
        } else {
          toast.success(`Measurement Complete: ${realLength.toFixed(2)} mm (not saved)`);
        }

        // Reset measurement state
        setMeasurementStart(null);
        setMeasurementActive(false);
        lastMousePos.current = null; // Clear mouse position to prevent cursor following

        // Immediate redraw to clear transient line
        requestAnimationFrame(applyImageAdjustments);
      }
    }
  };

  // Copy exact text interaction logic from imaging page
  const handleTextInteraction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    // Ignore interactions right after resizing/dragging with longer timeout
    if (justFinishedResizing || isResizing || isDraggingText) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Find clicked text
    const clickedText = shapes.find(shape => {
      if (shape.type !== 'text' || !shape.coordinates.text) return false;

      const fontSize = 16 * (shape.scale || 1);
      ctx.font = `${fontSize}px Arial`;
      const metrics = ctx.measureText(shape.coordinates.text);
      const width = metrics.width;
      const height = fontSize;

      // Define corner positions
      const corners = {
        'top-left': { x: shape.coordinates.x, y: shape.coordinates.y - height },
        'top-right': { x: shape.coordinates.x + width, y: shape.coordinates.y - height },
        'bottom-left': { x: shape.coordinates.x, y: shape.coordinates.y },
        'bottom-right': { x: shape.coordinates.x + width, y: shape.coordinates.y }
      };

      // First check if clicking any resize handle with larger hit area
      const resizeHandleSize = 15; // Increased from 10 to 15 for easier clicking
      for (const [corner, pos] of Object.entries(corners)) {
        const isOnHandle =
          x >= pos.x - resizeHandleSize / 2 &&
          x <= pos.x + resizeHandleSize / 2 &&
          y >= pos.y - resizeHandleSize / 2 &&
          y <= pos.y + resizeHandleSize / 2;

        if (isOnHandle && e.button === 0) { // Left click on handle
          setSelectedTextId(shape.id); // Select the text being resized
          setResizingTextId(shape.id);
          setIsResizing(true);
          setHoveredCorner(corner as any);
          lastMousePos.current = { x: e.clientX, y: e.clientY };
          // Close any open text modal
          setTextPosition(null);
          return true;
        }
      }

      // Then check if clicking text body - use the full text box area
      const isOnText =
        x >= shape.coordinates.x &&
        x <= shape.coordinates.x + width &&
        y >= shape.coordinates.y - height &&
        y <= shape.coordinates.y;

      if (isOnText) {
        if (e.button === 2 || e.detail === 2) { // Right click OR double click - open edit modal
          setSelectedTextId(shape.id);
          setTextInput(shape.coordinates.text);
          setTextColor(shape.color);
          setTextPosition({
            x: shape.coordinates.x,
            y: shape.coordinates.y,
            screenX: e.clientX,
            screenY: e.clientY
          });
          setTextScale(shape.scale || 1);
        } else if (e.button === 0) { // Left click - start dragging
          setSelectedTextId(shape.id);
          setIsDraggingText(true);
          setDraggedTextId(shape.id);
          setDragOffset({
            x: x - shape.coordinates.x,
            y: y - shape.coordinates.y
          });
          // Close any open text modal
          setTextPosition(null);
        }
        return true;
      }

      return false;
    });

    // If clicking empty space with left click, start new text ONLY if no modal is open
    if (!clickedText && e.button === 0) {
      setTextPosition({
        x,
        y,
        screenX: e.clientX,
        screenY: e.clientY
      });
      setSelectedTextId(null);
      setTextInput('');
      setTextScale(1.5); // Increased default scale
      setIsResizing(false);
      setResizingTextId(null);
      setHoveredCorner(null);
    }
  };

  // Text confirmation handler
  const handleTextConfirm = () => {
    if (!textPosition) return;

    let createdOrUpdatedShape: Shape | null = null;

    if (selectedTextId) {
      // Update existing text
      setShapes(prev => prev.map(shape => {
        if (shape.id === selectedTextId) {
          const updated = {
            ...shape,
            coordinates: { ...shape.coordinates, text: textInput },
            color: textColor,
            scale: textScale
          };
          createdOrUpdatedShape = updated;
          return updated;
        }
        return shape;
      }));
    } else {
      // Add new text
      const newShape: Shape = {
        id: Math.random().toString(),
        type: 'text',
        coordinates: { ...textPosition, text: textInput },
        color: textColor,
        scale: textScale
      };
      createdOrUpdatedShape = newShape;
      setShapes(prev => [...prev, newShape]);
    }

    setTextInput('');
    setTextPosition(null);
    setSelectedTextId(null);
    requestAnimationFrame(applyImageAdjustments);

    if (createdOrUpdatedShape) {
      saveShapeToServer(createdOrUpdatedShape);
    }
  };

  // Canvas click handler
  const handleCanvasClick = (e: React.MouseEvent) => {
    // If cursor tool is selected, don't handle canvas clicks for tools
    if (selectedTool === 'cursor') {
      return;
    }

    switch (selectedTool) {
      case 'text':
        if (!justFinishedResizing) {
          handleTextInteraction(e);
        }
        break;
      case 'calibrate':
        handleMeasurement(e);
        break;
      case 'eraser':
        handleEraserClick(e);
        break;
    }
  };

  // Tool selection handler
  const handleToolSelect = (toolId: ToolId) => {
    // Enhanced cleanup when switching tools
    if (toolId !== 'text') {
      setTextPosition(null);
      setSelectedTextId(null);
      setIsResizing(false);
      setIsDraggingText(false);
      setResizingTextId(null);
      setHoveredCorner(null);
    }

    // Clear measurement state when switching tools
    setMeasurementStart(null);
    setMeasurementActive(false);
    lastMousePos.current = null;

    // Clear drawing state
    setIsDrawing(false);
    setStartPos(null);
    lastDrawPoint.current = null;

    if (toolId === 'ai-detect') {
      handleAIDetection();
      return;
    }
    if (toolId === 'ai-enhance') {
      handleAIEnhancement();
      return;
    }

    setSelectedTool(toolId);
  };

  // AI Detection functionality
  const handleAIDetection = async () => {
    if (!selectedImage) return;

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      const formData = new FormData();
      formData.append('image', blob);

      toast.info('AI Detection: Analyzing image...');

      const response = await fetch('/api/ai-detect', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Detection failed');

      const results = await response.json();

      // Draw detection results on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Save current transformations
      ctx.save();

      // Apply current view transformations
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = zoom / 100;
      const angleInRadians = (rotation * Math.PI) / 180;

      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.rotate(angleInRadians);
      ctx.translate(-centerX + panOffset.x / scale, -centerY + panOffset.y / scale);

      // Draw detections - handle Grounding DINO format
      results.detections.forEach((detection: any) => {
        const [x0, y0, x1, y1] = detection.box; // Grounding DINO returns [x0, y0, x1, y1]
        const width = x1 - x0;
        const height = y1 - y0;
        const label = detection.label || 'Object';
        const score = detection.score || 0;

        // Draw bounding box
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2 / scale; // Adjust line width for zoom
        ctx.strokeRect(x0, y0, width, height);

        // Draw label
        ctx.fillStyle = '#00ff00';
        ctx.font = `${14 / scale}px Arial`; // Adjust font size for zoom
        ctx.fillText(
          `${label} (${(score * 100).toFixed(1)}%)`,
          x0,
          y0 - 5 / scale
        );

        // Save detection as annotation if we have a selected image
        if (selectedImage?.patientId && selectedImage?.id) {
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
          }).catch(console.error);
        }
      });

      // Restore transformations
      ctx.restore();

      toast.success(`AI Detection: Found ${results.detections.length} objects`);
    } catch (error) {
      console.error('Error in AI detection:', error);
      toast.error('AI detection failed. Please try again.');
    }
  };

  // AI Enhancement functionality
  const handleAIEnhancement = async () => {
    if (!selectedImage) return;
    setIsEnhancing(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      const formData = new FormData();
      formData.append('image', blob);

      toast.info('AI Enhancement: Enhancing image...');

      const response = await fetch('/api/ai-enhance', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Enhancement failed');

      const enhancedImageBlob = await response.blob();
      const enhancedImageUrl = URL.createObjectURL(enhancedImageBlob);

      // Load enhanced image
      const img = new Image();
      img.onload = () => {
        setCanvasImage(img);
        // Reset adjustments when applying enhancement
        setBrightness(100);
        setContrast(100);
        requestAnimationFrame(applyImageAdjustments);

        // NOTE: We deliberately do NOT save the enhanced image automatically.
        toast.success('Enhanced image applied (not saved)');
      };
      img.src = enhancedImageUrl;
    } catch (error) {
      console.error('Error in AI enhancement:', error);
      toast.error('Failed to enhance image. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Load image when selected image changes
  useEffect(() => {
    if (!selectedImage) return;

    const loadImage = async () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Reset transformations when loading new image
        setPanOffset({ x: 0, y: 0 });
        setZoom(100);
        setRotation(0);
        setBrightness(100);
        setContrast(100);

        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image immediately
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }

        setCanvasImage(img);
        requestAnimationFrame(applyImageAdjustments);
      };

      img.onerror = () => {
        toast.error('Failed to load image');
      };

      img.crossOrigin = 'anonymous';
      img.src = selectedImage.url;
    };

    loadImage();
  }, [selectedImage]);

  // Load annotations and calibration when image changes
  useEffect(() => {
    if (!selectedImage?.patientId || !selectedImage?.id) return;

    const loadImageData = async () => {
      try {
        // Load calibration
        const calibrationResponse = await fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/calibration`);
        if (calibrationResponse.ok) {
          const calibrationData = await calibrationResponse.json();
          console.log('Loaded calibration data:', calibrationData);
          setCalibration(calibrationData);
        }

        // Load annotations
        const annotationsResponse = await fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/annotations`);
        if (annotationsResponse.ok) {
          const annotationsData = await annotationsResponse.json();

          const newMeasurements = [];
          const newShapes = [];

          for (const annotation of annotationsData) {
            if (annotation.type === 'MEASUREMENT') {
              newMeasurements.push({
                id: annotation.id,
                start: annotation.points.start,
                end: annotation.points.end,
                length: annotation.measurement,
                pixelLength: Math.sqrt(
                  Math.pow(annotation.points.end.x - annotation.points.start.x, 2) +
                  Math.pow(annotation.points.end.y - annotation.points.start.y, 2)
                ),
                color: annotation.color
              });
            } else {
              newShapes.push({
                id: annotation.id,
                type: annotation.type.toLowerCase() as Shape['type'],
                coordinates: annotation.points,
                color: annotation.color,
                scale: annotation.size
              });
            }
          }

          setMeasurements(newMeasurements);
          setShapes(newShapes);
        }
      } catch (error) {
        console.error('Error loading image data:', error);
      }
    };

    loadImageData();
  }, [selectedImage]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, image: PatientImage) => {
    setDraggedImage(image);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, containerType: string) => {
    if (selectedTool !== 'cursor') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverContainer(containerType);
  };

  const handleDragLeave = () => {
    setDragOverContainer(null);
  };

  const handleDrop = async (e: React.DragEvent, containerType: string, position?: number) => {
    if (selectedTool !== 'cursor') return;
    e.preventDefault();
    setDragOverContainer(null);

    // 1) Handle drops that originate from the OS / file system first -----------------
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      try {
        for (let i = 0; i < droppedFiles.length; i++) {
          const file = droppedFiles[i];
          // Only allow image types
          if (!file.type.startsWith('image/')) continue;

          // Decide default type/side based on container that received the drop
          let uploadType: string = 'XRAY';
          let uploadSide: string | null = null;

          if (containerType === 'bitewing-left') {
            uploadType = 'BITEWING';
            uploadSide = 'LEFT';
          } else if (containerType === 'bitewing-right') {
            uploadType = 'BITEWING';
            uploadSide = 'RIGHT';
          } else if (containerType === 'opg') {
            uploadType = 'OPG';
          }

          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', uploadType);
          if (uploadSide) formData.append('side', uploadSide);

          const uploadRes = await fetch(`/api/patients/${patientId}/images`, {
            method: 'POST',
            body: formData
          });

          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            console.error('Upload failed:', errText);
            throw new Error(errText || 'Upload failed');
          }
        }

        toast.success('Image(s) uploaded successfully');
        if (onRefresh) onRefresh(); // Auto-refresh after successful upload
      } catch (err) {
        console.error('File-drop upload error:', err);
        toast.error('Failed to upload image(s)');
      }
      return; // Skip the intra-app drag logic
    }

    // 2) In-app drag-and-drop (re-categorising an existing X-ray) --------------------
    if (!draggedImage) return;

    try {
      // Update image type based on container
      let newType = draggedImage.type;
      let newSide = draggedImage.side;

      if (containerType === 'bitewing-left') {
        newType = 'BITEWING';
        newSide = 'LEFT';
      } else if (containerType === 'bitewing-right') {
        newType = 'BITEWING';
        newSide = 'RIGHT';
      } else if (containerType === 'opg') {
        newType = 'OPG';
        newSide = undefined;
      }

      // Update the image - use PATCH method and only send the fields we want to update
      const response = await fetch(`/api/patients/${draggedImage.patientId}/images/${draggedImage.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: newType,
          side: newSide,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Update failed:', errorData);
        throw new Error('Failed to update image');
      }

      toast.success(`Image moved to ${containerType.replace('-', ' ')}`);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Drop error:', error);
      toast.error('Failed to move image');
    }

    setDraggedImage(null);
  };

  // Delete image
  const handleDeleteImage = async () => {
    if (!selectedImageForAction) return;

    try {
      const response = await fetch(`/api/patients/${patientId}/images/${selectedImageForAction.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete image');

      toast.success('Image deleted successfully');
      setShowDeleteDialog(false);
      setSelectedImageForAction(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  // Move image to another patient
  const handleMoveToPatient = async (targetPatientId: string) => {
    if (!selectedImageForAction) return;

    try {
      const response = await fetch(`/api/patients/${patientId}/images/${selectedImageForAction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: targetPatientId,
        }),
      });

      if (!response.ok) throw new Error('Failed to move image');

      toast.success('Image moved to patient successfully');
      setShowMoveDialog(false);
      setSelectedImageForAction(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error('Failed to move image to patient');
    }
  };

  // Load available patients for moving
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await fetch('/api/patients');
        if (response.ok) {
          const patients = await response.json();
          setAvailablePatients(patients.filter((p: any) => p.id !== patientId));
        }
      } catch (error) {
        console.error('Failed to load patients:', error);
      }
    };

    if (showMoveDialog) {
      loadPatients();
    }
  }, [showMoveDialog, patientId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger shortcuts when typing in inputs
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setSelectedTool('cursor');
          break;
        case 'h':
          setSelectedTool('pan');
          break;
        case 'r':
          setSelectedTool('rectangle');
          break;
        case 'c':
          setSelectedTool('circle');
          break;
        case 't':
          setSelectedTool('text');
          break;
        case 'f':
          setSelectedTool('freehand');
          break;
        case 'm':
          setSelectedTool('calibrate');
          break;
        case 'e':
          setSelectedTool('eraser');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Apply adjustments when dependencies change
  useEffect(() => {
    if (!canvasImage) return;

    const redrawCanvas = () => {
      requestAnimationFrame(applyImageAdjustments);
    };

    redrawCanvas();
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
    measurementActive,
    applyImageAdjustments
  ]);

  const displayData = getImagesForView();

  const saveShapeToServer = useCallback((shape: Shape) => {
    if (!selectedImage?.patientId || !selectedImage?.id) return;

    const annotationPayload: any = {
      type: shape.type.toUpperCase(),
      points: shape.coordinates,
      color: shape.color,
      size: shape.scale || shape.penSize || 1
    };
    if (shape.type === 'text') {
      annotationPayload.text = shape.coordinates.text;
    }

    fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(annotationPayload)
    }).catch(console.error);
  }, [selectedImage]);

  // Eraser drag state
  const [isErasing, setIsErasing] = useState(false);

  // Eraser helper (declared as function so it is hoisted before being used in handlers)
  function performErase(screenX: number, screenY: number) {
    if (!selectedImage) return;
    const { x, y } = screenToCanvas(screenX, screenY);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let removedShapes: Shape[] = [];
    let removedMeasurements: Measurement[] = [];
    setShapes(prev => {
      return prev.filter(shape => {
        let hitFlag = false;
        switch (shape.type) {
          case 'text': {
            if (!shape.coordinates.text) break;
            const fontSize = 16 * (shape.scale || 1);
            ctx.font = `${fontSize}px Arial`;
            const metrics = ctx.measureText(shape.coordinates.text);
            const width = metrics.width;
            const height = fontSize;
            hitFlag = x >= shape.coordinates.x && x <= shape.coordinates.x + width && y >= shape.coordinates.y - height && y <= shape.coordinates.y;
            break;
          }
          case 'rectangle': {
            const { x: rx, y: ry, width, height } = shape.coordinates as any;
            if (width !== undefined && height !== undefined) {
              hitFlag = x >= rx && x <= rx + width && y >= ry && y <= ry + height;
            }
            break;
          }
          case 'circle': {
            const { x: cx, y: cy, radius } = shape.coordinates as any;
            if (radius !== undefined) {
              hitFlag = Math.hypot(x - cx, y - cy) <= radius;
            }
            break;
          }
          case 'freehand': {
            const pts = (shape.coordinates.points || []) as any[];
            for (let i = 0; i < pts.length - 1 && !hitFlag; i++) {
              const p1 = pts[i];
              const p2 = pts[i + 1];
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const lenSq = dx * dx + dy * dy;
              if (lenSq === 0) continue;
              const t = ((x - p1.x) * dx + (y - p1.y) * dy) / lenSq;
              if (t < 0 || t > 1) continue;
              const projX = p1.x + t * dx;
              const projY = p1.y + t * dy;
              if (Math.hypot(x - projX, y - projY) <= 5) hitFlag = true;
            }
            break;
          }
        }
        if (hitFlag) removedShapes.push(shape);
        return !hitFlag;
      });
    });

    // --- check measurements ---
    setMeasurements(prevMeas => {
      const kept: Measurement[] = [];
      prevMeas.forEach(meas => {
        const p1 = meas.start;
        const p2 = meas.end;
        const dxSeg = p2.x - p1.x;
        const dySeg = p2.y - p1.y;
        const lenSq = dxSeg * dxSeg + dySeg * dySeg;
        if (lenSq === 0) {
          kept.push(meas);
          return;
        }
        const t = ((x - p1.x) * dxSeg + (y - p1.y) * dySeg) / lenSq;
        if (t < 0 || t > 1) {
          kept.push(meas);
          return;
        }
        const projX = p1.x + t * dxSeg;
        const projY = p1.y + t * dySeg;
        const dist = Math.hypot(x - projX, y - projY);
        if (dist <= 5) {
          removedMeasurements.push(meas);
        } else {
          kept.push(meas);
        }
      });
      return kept;
    });

    if (removedShapes.length > 0 || removedMeasurements.length > 0) {
      requestAnimationFrame(applyImageAdjustments);
      removedShapes.forEach(removedShape => {
        const annId = removedShape.serverId || removedShape.id;
        if (annId)
          fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/annotations?annotationId=${annId}`, { method: 'DELETE' }).catch(console.error);
      });
      removedMeasurements.forEach(rm => {
        const annId = rm.id;
        if (annId)
          fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/annotations?annotationId=${annId}`, { method: 'DELETE' }).catch(console.error);
      });
    }
  }

  const handleEraserClick = (e: React.MouseEvent) => performErase(e.clientX, e.clientY);

  return (
    <div className="border-2 border-blue-400 bg-white p-2 rounded-xl min-h-[50vh]">
      <div className="flex flex-col">
        {/* Header with view preferences */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Patient Images</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4 mr-1" />
              View Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/imaging?patientId=${patientId}`)}
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Add Images
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Default View Preference</Label>
                  <Select value={viewPreference} onValueChange={(value) => setViewPreference(value as ViewPreference)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {viewPreferences.map((pref) => (
                        <SelectItem key={pref.value} value={pref.value}>
                          <div>
                            <div className="font-medium">{pref.label}</div>
                            <div className="text-xs text-muted-foreground">{pref.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Categories Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'xray' | 'light')} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="xray" className="flex items-center gap-2">
              X-ray Images
              <Badge variant="secondary">{xrayImages.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="light" className="flex items-center gap-2">
              Light Images
              <Badge variant="secondary">{lightImages.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* X-ray Images Tab */}
          <TabsContent value="xray" className="flex-1 mt-4">
            {/* Tools Bar */}
            {selectedImage && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Left side: Tools */}
                    <div className="flex items-center gap-2">
                      {tools.map((tool) => (
                        <Button
                          key={tool.id}
                          variant={selectedTool === tool.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToolSelect(tool.id)}
                          disabled={tool.id === 'ai-enhance' && isEnhancing}
                          className="flex items-center gap-1"
                          title={tool.shortcut ? `${tool.name} (${tool.shortcut})` : tool.name}
                        >
                          {tool.icon}
                          <span className="text-xs hidden sm:inline">{tool.name}</span>
                        </Button>
                      ))}
                    </div>

                    {/* Right side: Color picker and settings */}
                    <div className="flex items-center gap-2">
                      {(selectedTool === 'text' || selectedTool === 'freehand' || selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'calibrate') && (
                        <>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-8 h-8 p-0 rounded-full"
                                style={{ backgroundColor: textColor }}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <HexColorPicker color={textColor} onChange={setTextColor} />
                            </PopoverContent>
                          </Popover>

                          {selectedTool === 'freehand' && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Size:</Label>
                              <Slider
                                value={[penSize]}
                                onValueChange={([value]) => setPenSize(value)}
                                min={1}
                                max={20}
                                step={1}
                                className="w-20"
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* Image Adjustments */}
                      <Separator orientation="vertical" className="h-6" />
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleZoom(Math.max(10, zoom - 10))}>
                          <ZoomOut className="h-3 w-3" />
                        </Button>
                        <span className="text-xs w-12 text-center">{zoom}%</span>
                        <Button variant="outline" size="sm" onClick={() => handleZoom(Math.min(400, zoom + 10))}>
                          <ZoomIn className="h-3 w-3" />
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => handleRotate('left')}>
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleRotate('right')}>
                          <RotateCw className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Brightness and Contrast */}
                      <Separator orientation="vertical" className="h-6" />
                      <div className="flex items-center gap-2">
                        <Sun className="h-3 w-3" />
                        <Slider
                          value={[brightness]}
                          onValueChange={([value]) => handleBrightnessChange(value)}
                          min={0}
                          max={200}
                          step={5}
                          className="w-16"
                        />
                        <span className="text-xs w-8">{brightness}%</span>

                        <Contrast className="h-3 w-3" />
                        <Slider
                          value={[contrast]}
                          onValueChange={([value]) => handleContrastChange(value)}
                          min={0}
                          max={200}
                          step={5}
                          className="w-16"
                        />
                        <span className="text-xs w-8">{contrast}%</span>
                      </div>

                      {/* Clear annotations */}
                      {(shapes.length > 0 || measurements.length > 0) && (
                        <>
                          <Separator orientation="vertical" className="h-6" />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Clear local state
                              setShapes([]);
                              setMeasurements([]);
                              setCalibration(null);
                              // Clear measurement tool state
                              setMeasurementStart(null);
                              setMeasurementActive(false);
                              // Clear text state
                              setTextPosition(null);
                              setSelectedTextId(null);
                              setIsResizing(false);
                              setIsDraggingText(false);
                              // Clear from database if image is selected
                              if (selectedImage?.patientId && selectedImage?.id) {
                                // Clear annotations
                                fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/annotations`, {
                                  method: 'DELETE'
                                }).catch(console.error);
                                // Clear calibration
                                fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/calibration`, {
                                  method: 'DELETE'
                                }).catch(console.error);
                              }
                              requestAnimationFrame(applyImageAdjustments);
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Clear
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-12 gap-4 h-[500px]">
              {/* Image List */}
              <div className="col-span-2">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Available X-rays
                      {selectedTool === 'cursor' && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          Drag & Drop Enabled
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className={`h-[450px] mx-2 p-3 border-2 rounded-lg transition-colors ${selectedTool === 'cursor' ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
                      }`}>
                      {sortedXrayImages.map((image) => (
                        <div
                          key={image.id}
                          draggable={selectedTool === 'cursor'}
                          onDragStart={(e) => selectedTool === 'cursor' ? handleDragStart(e, image) : e.preventDefault()}
                          className={`p-2 mb-2 rounded-lg cursor-pointer border transition-colors relative group ${selectedImage?.id === image.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                          onClick={() => handleImageSelect(image)}
                        >
                          <img
                            src={image.url}
                            alt={`${image.type} ${image.side || ''}`}
                            className="w-full h-16 object-cover rounded mb-1"
                          />
                          <div className="text-xs">
                            <div className="font-medium">{image.type}</div>
                            {image.side && <div className="text-gray-500">{image.side}</div>}
                            {image.dateTaken && (
                              <div className="text-gray-400">
                                {new Date(image.dateTaken).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-40">
                                <div className="space-y-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedImageForAction(image);
                                      setShowMoveDialog(true);
                                    }}
                                  >
                                    <Users className="h-3 w-3 mr-2" />
                                    Move to Patient
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-red-600 hover:text-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedImageForAction(image);
                                      setShowDeleteDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      ))}
                      {sortedXrayImages.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">No X-ray images</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Main Display Area */}
              <div className="col-span-10">
                <Card className="h-full">
                  <CardContent className="p-4 h-full">
                    <div className="h-full">
                      {/* Main Display Logic */}
                      {viewPreference === 'latest_bitewings_opg' && displayData.top && displayData.bottom ? (
                        <div className="grid grid-rows-2 gap-2 h-full">
                          {/* Top Row: Latest Bitewings */}
                          <div className="grid grid-cols-2 gap-2">
                            {/* Left Bitewing Container */}
                            <div
                              className={`border-2 border-dashed rounded-lg p-2 bg-gray-50 transition-colors ${selectedTool === 'cursor' && dragOverContainer === 'bitewing-left' ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
                                }`}
                              onDragOver={(e) => handleDragOver(e, 'bitewing-left')}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, 'bitewing-left')}
                            >
                              {(() => {
                                const leftImg = displayData.top.find(img => img.side === 'LEFT');
                                const isSelected = selectedImage && leftImg && selectedImage.id === leftImg.id;
                                return (
                                  <div
                                    className={`border-2 ${isSelected ? 'border-gray-300' : 'border-dashed border-gray-300'} rounded-lg p-2 bg-gray-50 transition-colors ${!isSelected && selectedTool === 'cursor' && dragOverContainer === 'bitewing-left' ? 'border-blue-500 bg-blue-100' : ''}`}
                                    onDragOver={isSelected ? undefined : (e) => handleDragOver(e, 'bitewing-left')}
                                    onDragLeave={isSelected ? undefined : handleDragLeave}
                                    onDrop={isSelected ? undefined : (e) => handleDrop(e, 'bitewing-left')}
                                  >
                                    {/* inner rendering maintained below */}
                                    {
                                      !leftImg ? (
                                        <div className="h-full flex items-center justify-center">
                                          <div className="text-gray-400 text-sm text-center">
                                            <div>Drop left bitewing here</div>
                                            <div className="text-xs mt-1">or drag from images</div>
                                          </div>
                                        </div>
                                      ) : isSelected ? (
                                        // ... existing code for selected canvas view ...
                                        <div
                                          className="relative h-full"
                                          onDragStart={(e) => selectedTool !== 'cursor' && e.preventDefault()}
                                          onDrop={(e) => selectedTool !== 'cursor' && e.preventDefault()}
                                          onDragOver={(e) => selectedTool !== 'cursor' && e.preventDefault()}
                                        >
                                          <canvas
                                            ref={canvasRef}
                                            width={500}
                                            height={250}
                                            className={`w-full h-full border rounded-lg ${selectedTool === 'cursor' ? 'cursor-default' : 'cursor-crosshair'}`}
                                            onClick={handleCanvasClick}
                                            onMouseDown={selectedTool === 'cursor' ? undefined : handleMouseDown}
                                            onMouseMove={selectedTool === 'cursor' ? undefined : handleMouseMove}
                                            onMouseUp={selectedTool === 'cursor' ? undefined : handleMouseUp}
                                            onMouseLeave={selectedTool === 'cursor' ? undefined : handleMouseUp}
                                            onContextMenu={selectedTool === 'text' ? handleTextInteraction : undefined}
                                            style={{ userSelect: 'none' }}
                                          />
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
                                                  <Label className="text-xs">Scale:</Label>
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
                                      ) : (
                                        <div
                                          className="h-full cursor-pointer hover:bg-gray-100 rounded"
                                          onClick={() => handleImageSelect(leftImg)}
                                        >
                                          <img src={leftImg.url} alt="Left Bitewing" className="w-full h-full object-contain rounded" draggable={false} />
                                          <div className="text-xs text-center mt-1">Left Bitewing</div>
                                        </div>
                                      )
                                    }
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Right Bitewing Container */}
                            <div
                              className={`border-2 border-dashed rounded-lg p-2 bg-gray-50 transition-colors ${selectedTool === 'cursor' && dragOverContainer === 'bitewing-right' ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
                                }`}
                              onDragOver={(e) => handleDragOver(e, 'bitewing-right')}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, 'bitewing-right')}
                            >
                              {(() => {
                                const rightImg = displayData.top.find(img => img.side === 'RIGHT');
                                const isSelected = selectedImage && rightImg && selectedImage.id === rightImg.id;
                                return (
                                  <div
                                    className={`border-2 ${isSelected ? 'border-gray-300' : 'border-dashed border-gray-300'} rounded-lg p-2 bg-gray-50 transition-colors ${!isSelected && selectedTool === 'cursor' && dragOverContainer === 'bitewing-right' ? 'border-blue-500 bg-blue-100' : ''}`}
                                    onDragOver={isSelected ? undefined : (e) => handleDragOver(e, 'bitewing-right')}
                                    onDragLeave={isSelected ? undefined : handleDragLeave}
                                    onDrop={isSelected ? undefined : (e) => handleDrop(e, 'bitewing-right')}
                                  >
                                    {/* inner rendering maintained below */}
                                    {
                                      !rightImg ? (
                                        <div className="h-full flex items-center justify-center">
                                          <div className="text-gray-400 text-sm text-center">
                                            <div>Drop right bitewing here</div>
                                            <div className="text-xs mt-1">or drag from images</div>
                                          </div>
                                        </div>
                                      ) : isSelected ? (
                                        // ... existing code for selected canvas view ...
                                        <div
                                          className="relative h-full"
                                          onDragStart={(e) => selectedTool !== 'cursor' && e.preventDefault()}
                                          onDrop={(e) => selectedTool !== 'cursor' && e.preventDefault()}
                                          onDragOver={(e) => selectedTool !== 'cursor' && e.preventDefault()}
                                        >
                                          <canvas
                                            ref={canvasRef}
                                            width={500}
                                            height={250}
                                            className={`w-full h-full border rounded-lg ${selectedTool === 'cursor' ? 'cursor-default' : 'cursor-crosshair'}`}
                                            onClick={handleCanvasClick}
                                            onMouseDown={selectedTool === 'cursor' ? undefined : handleMouseDown}
                                            onMouseMove={selectedTool === 'cursor' ? undefined : handleMouseMove}
                                            onMouseUp={selectedTool === 'cursor' ? undefined : handleMouseUp}
                                            onMouseLeave={selectedTool === 'cursor' ? undefined : handleMouseUp}
                                            onContextMenu={selectedTool === 'text' ? handleTextInteraction : undefined}
                                            style={{ userSelect: 'none' }}
                                          />
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
                                                  <Label className="text-xs">Scale:</Label>
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
                                      ) : (
                                        <div
                                          className="h-full cursor-pointer hover:bg-gray-100 rounded"
                                          onClick={() => handleImageSelect(rightImg)}
                                        >
                                          <img src={rightImg.url} alt="Right Bitewing" className="w-full h-full object-contain rounded" draggable={false} />
                                          <div className="text-xs text-center mt-1">Right Bitewing</div>
                                        </div>
                                      )
                                    }
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Bottom Row: OPG */}
                          {/* <div
                            className={`border-2 border-dashed rounded-lg p-2 bg-gray-50 transition-colors ${selectedTool === 'cursor' && dragOverContainer === 'opg' ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
                              }`}
                            onDragOver={(e) => handleDragOver(e, 'opg')}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, 'opg')}
                          >
                            {displayData.bottom.length > 0 ? (
                              <div
                                className="h-full cursor-pointer hover:bg-gray-100 rounded"
                                onClick={() => handleImageSelect(displayData.bottom[0])}
                              >
                                <img
                                  src={displayData.bottom[0].url}
                                  alt="OPG"
                                  className="w-full h-full object-contain rounded"
                                  draggable={false}
                                  onDragStart={(e) => e.preventDefault()}
                                />
                                <div className="text-xs text-center mt-1">OPG</div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <div className="text-gray-400 text-sm text-center">
                                  <div>Drop OPG here</div>
                                  <div className="text-xs mt-1">or drag from images</div>
                                </div>
                              </div>
                            )}
                          </div> */}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <Eye className="h-12 w-12 mx-auto mb-2" />
                            <p>Click on an image above to view and annotate</p>
                            <p className="text-sm mt-2">Or drag images into the containers below</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Global Text Input Overlay - positioned outside containers */}
            {textPosition && (
              <div
                className="fixed z-50"
                style={{
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
                    <Label className="text-xs">Scale:</Label>
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
          </TabsContent>

          {/* Light Images Tab */}
          <TabsContent value="light" className="flex-1 mt-4">
            <Card className="h-[300px]">
              <CardContent className="p-2">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {lightImages.map((image) => (
                    <div key={image.id} className="border rounded-lg p-2">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-20 object-cover rounded mb-1"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                      />
                      <p className="text-xs truncate">{image.name}</p>
                    </div>
                  ))}
                  {lightImages.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Upload className="h-12 w-12 mx-auto mb-2" />
                      <p>No light images available</p>
                      <p className="text-sm mt-1">Upload photos from the imaging page</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Move Patient Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Image to Another Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Search Patient</Label>
              <Input
                placeholder="Type patient name..."
                value={targetPatientSearch}
                onChange={(e) => setTargetPatientSearch(e.target.value)}
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {availablePatients
                .filter(patient =>
                  patient.firstName?.toLowerCase().includes(targetPatientSearch.toLowerCase()) ||
                  patient.lastName?.toLowerCase().includes(targetPatientSearch.toLowerCase()) ||
                  patient.patientCode?.toLowerCase().includes(targetPatientSearch.toLowerCase())
                )
                .map((patient) => (
                  <div
                    key={patient.id}
                    className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => handleMoveToPatient(patient.id)}
                  >
                    <div className="font-medium">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      Code: {patient.patientCode || 'N/A'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cute Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Image?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              {selectedImageForAction && (
                <div className="mb-4">
                  <img
                    src={selectedImageForAction.url}
                    alt="Image to delete"
                    className="w-24 h-24 object-cover rounded-lg mx-auto border-2 border-red-200"
                  />
                  <div className="mt-2">
                    <div className="font-medium">{selectedImageForAction.type}</div>
                    {selectedImageForAction.side && (
                      <div className="text-sm text-gray-500">{selectedImageForAction.side}</div>
                    )}
                    {selectedImageForAction.dateTaken && (
                      <div className="text-sm text-gray-400">
                        {new Date(selectedImageForAction.dateTaken).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <p className="text-gray-600">
                Are you sure you want to delete this image? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedImageForAction(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteImage}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 