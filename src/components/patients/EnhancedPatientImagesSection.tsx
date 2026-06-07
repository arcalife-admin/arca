"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { HexColorPicker } from 'react-colorful';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Upload,
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
  Sun,
  Contrast,
  Trash2,
  Users,
  MoreVertical,
  MousePointer2,
  Eraser,
  ChevronLeft,
  ChevronRight,
  ImagePlus
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

type ImageCategory = 'BEFORE_PHOTO' | 'AFTER_PHOTO';

interface PatientImage {
  id: string;
  url: string;
  type: ImageCategory | string;
  dateTaken?: string;
  notes?: string;
  patientId?: string;
}

interface EnhancedPatientImagesSectionProps {
  patientId: string;
  patientFiles: PatientFile[];
  patientImages: PatientImage[];
  onRefresh?: () => void | Promise<void>;
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

type ToolId = 'cursor' | 'pan' | 'rectangle' | 'circle' | 'text' | 'freehand' | 'calibrate' | 'eraser';

interface Tool {
  id: ToolId;
  name: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const tools: Tool[] = [
  { id: 'cursor', name: 'Selectare', icon: <MousePointer2 className="h-4 w-4" />, shortcut: 'V' },
  { id: 'pan', name: 'Panoramare', icon: <Move className="h-4 w-4" />, shortcut: 'H' },
  { id: 'rectangle', name: 'Dreptunghi', icon: <RectangleHorizontal className="h-4 w-4" />, shortcut: 'R' },
  { id: 'circle', name: 'Cerc', icon: <Circle className="h-4 w-4" />, shortcut: 'C' },
  { id: 'text', name: 'Text', icon: <Type className="h-4 w-4" />, shortcut: 'T' },
  { id: 'freehand', name: 'Desen liber', icon: <PencilLine className="h-4 w-4" />, shortcut: 'F' },
  { id: 'eraser', name: 'Radieră', icon: <Eraser className="h-4 w-4" />, shortcut: 'E' },
  { id: 'calibrate', name: 'Calibrare', icon: <RulerIcon className="h-4 w-4" />, shortcut: 'M' }
];

const sortByDate = (images: PatientImage[]) =>
  [...images].sort((a, b) => {
    const dateA = a.dateTaken ? new Date(a.dateTaken).getTime() : 0;
    const dateB = b.dateTaken ? new Date(b.dateTaken).getTime() : 0;
    return dateB - dateA;
  });

export const EnhancedPatientImagesSection: React.FC<EnhancedPatientImagesSectionProps> = ({
  patientId,
  patientFiles,
  patientImages,
  onRefresh
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fitCanvasToViewport = useCallback(() => {
    const canvas = canvasRef.current;
    const viewport = canvasViewportRef.current;
    if (!canvas || !viewport || canvas.width === 0 || canvas.height === 0) return;

    const { width: vw, height: vh } = viewport.getBoundingClientRect();
    if (vw <= 0 || vh <= 0) return;

    const scale = Math.min(vw / canvas.width, vh / canvas.height);
    canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
    canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
  }, []);

  // State management
  const [selectedImage, setSelectedImage] = useState<PatientImage | null>(null);
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(0);
  const [selectedTool, setSelectedTool] = useState<ToolId>('cursor');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<ImageCategory>('BEFORE_PHOTO');
  const [showDragOverlay, setShowDragOverlay] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dragCounterRef = useRef(0);

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

  // Drag overlay state (file drops from OS)

  // Move/delete functionality
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedImageForAction, setSelectedImageForAction] = useState<PatientImage | null>(null);
  const [targetPatientSearch, setTargetPatientSearch] = useState('');
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);

  // Categorize images
  const beforeImages = sortByDate(
    patientImages?.filter(img => img.type === 'BEFORE_PHOTO') || []
  );
  const afterImages = sortByDate(
    patientImages?.filter(img => img.type === 'AFTER_PHOTO') || []
  );

  useEffect(() => {
    if (beforeIndex >= beforeImages.length) {
      setBeforeIndex(Math.max(0, beforeImages.length - 1));
    }
  }, [beforeImages.length, beforeIndex]);

  useEffect(() => {
    if (afterIndex >= afterImages.length) {
      setAfterIndex(Math.max(0, afterImages.length - 1));
    }
  }, [afterImages.length, afterIndex]);

  const uploadImages = async (files: FileList | File[], type: ImageCategory) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      toast.error('Nu au fost selectate fișiere imagine valide');
      return;
    }

    setIsUploading(true);
    try {
      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const uploadRes = await fetch(`/api/patients/${patientId}/images`, {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error(errText || 'Încărcarea a eșuat');
        }
      }

      const label = type === 'BEFORE_PHOTO' ? 'Înainte' : 'După';
      toast.success(`${fileArray.length} fotografii ${label} încărcate`);
      if (onRefresh) await onRefresh();
      // Show newest uploaded image in the matching carousel
      if (type === 'BEFORE_PHOTO') setBeforeIndex(0);
      else setAfterIndex(0);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Încărcarea imaginii/imaginilor a eșuat');
    } finally {
      setIsUploading(false);
      setShowDragOverlay(false);
      dragCounterRef.current = 0;
    }
  };

  const handleSectionDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    setShowDragOverlay(true);
  };

  const handleSectionDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setShowDragOverlay(false);
    }
  };

  const handleFileDrop = async (e: React.DragEvent, type: ImageCategory) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setShowDragOverlay(false);
    if (e.dataTransfer.files.length > 0) {
      await uploadImages(e.dataTransfer.files, type);
    }
  };

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
    setSelectedImage({ ...image, patientId: image.patientId || patientId });
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

  const goToCarouselIndex = (
    images: PatientImage[],
    newIndex: number,
    setIndex: React.Dispatch<React.SetStateAction<number>>
  ) => {
    setIndex(newIndex);
    if (images[newIndex]) {
      handleImageSelect(images[newIndex]);
    }
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

            if (!response.ok) throw new Error('Salvarea calibrării a eșuat');

            const newCalibration = await response.json();
            setCalibration(newCalibration);

            toast.success(`Calibrare finalizată: ${realLength} mm = ${Math.round(pixelLength)} pixeli`);
          } catch (error) {
            toast.error('Salvarea calibrării a eșuat');
          }
        } else if (realLength > 0) {
          // Create local calibration for demo purposes
          setCalibration({
            pixelWidth: pixelLength,
            realWidth: realLength
          });

          toast.success(`Calibrare temporară: ${realLength} mm = ${Math.round(pixelLength)} pixeli (nesalvată)`);
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
          toast.error('Date de calibrare invalide. Recalibrați, vă rugăm.');
          return;
        }

        const scale = calibRealWidth / calibPixelWidth;

        // Convert to real-world units using calibration
        const realLength = pixelLength * scale;

        // Validate the result
        if (!isFinite(realLength) || realLength <= 0) {
          toast.error('Rezultat de măsurare invalid. Verificați calibrarea.');
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

            if (!response.ok) throw new Error('Salvarea măsurătorii a eșuat');

            toast.success(`Măsurătoare salvată: ${realLength.toFixed(2)} mm`);
          } catch (error) {
            toast.error('Salvarea măsurătorii a eșuat');
          }
        } else {
          toast.success(`Măsurătoare finalizată: ${realLength.toFixed(2)} mm (nesalvată)`);
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

    setSelectedTool(toolId);
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
        requestAnimationFrame(() => {
          fitCanvasToViewport();
          applyImageAdjustments();
        });
      };

      img.onerror = () => {
        toast.error('Încărcarea imaginii a eșuat');
      };

      img.crossOrigin = 'anonymous';
      img.src = selectedImage.url;
    };

    loadImage();
  }, [selectedImage, fitCanvasToViewport]);

  // Keep canvas display sized to fit the viewport when container resizes
  useEffect(() => {
    if (!selectedImage) return;
    const viewport = canvasViewportRef.current;
    if (!viewport) return;

    fitCanvasToViewport();
    const ro = new ResizeObserver(() => fitCanvasToViewport());
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [selectedImage, fitCanvasToViewport]);

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

  // Delete image
  const handleDeleteImage = async () => {
    if (!selectedImageForAction) return;

    try {
      const response = await fetch(`/api/patients/${patientId}/images/${selectedImageForAction.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Ștergerea image');

      toast.success('Imaginea a fost ștearsă cu succes');
      setShowDeleteDialog(false);
      setSelectedImageForAction(null);
      if (onRefresh) await onRefresh();
    } catch (error) {
      toast.error('Ștergerea imaginii a eșuat');
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

      if (!response.ok) throw new Error('Mutarea imaginii a eșuat');

      toast.success('Imaginea a fost mutată la pacient cu succes');
      setShowMoveDialog(false);
      setSelectedImageForAction(null);
      if (onRefresh) await onRefresh();
    } catch (error) {
      toast.error('Mutarea imaginii la pacient a eșuat');
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

  const renderCarouselPanel = (
    label: string,
    images: PatientImage[],
    index: number,
    setIndex: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const image = images[index];
    const isSelected = !!image && selectedImage?.id === image.id;

    return (
      <div className="flex flex-col flex-1 min-w-0 min-h-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            {label}
            <Badge variant="secondary">{images.length}</Badge>
          </h4>
          {image && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedImageForAction(image);
                      setShowMoveDialog(true);
                    }}
                  >
                    <Users className="h-3 w-3 mr-2" />
                    Mută la pacient
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={() => {
                      setSelectedImageForAction(image);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Șterge
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div
          className="relative flex-1 min-h-0 overflow-hidden border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
          onClick={() => image && !isSelected && handleImageSelect(image)}
        >
          {!image ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm text-center p-4">
              <div>
                <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nu există fotografii {label === 'Înainte' ? 'înainte' : 'după'}</p>
              </div>
            </div>
          ) : isSelected ? (
            <div
              ref={canvasViewportRef}
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              onDragStart={(e) => selectedTool !== 'cursor' && e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              onDragOver={(e) => e.preventDefault()}
            >
              <canvas
                ref={canvasRef}
                className={`block max-w-full max-h-full ${selectedTool === 'cursor' ? 'cursor-default' : 'cursor-crosshair'}`}
                onClick={handleCanvasClick}
                onMouseDown={selectedTool === 'cursor' ? undefined : handleMouseDown}
                onMouseMove={selectedTool === 'cursor' ? undefined : handleMouseMove}
                onMouseUp={selectedTool === 'cursor' ? undefined : handleMouseUp}
                onMouseLeave={selectedTool === 'cursor' ? undefined : handleMouseUp}
                onContextMenu={selectedTool === 'text' ? handleTextInteraction : undefined}
                style={{ userSelect: 'none' }}
              />
            </div>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden p-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleImageSelect(image)}
            >
              <img
                src={image.url}
                alt={label}
                className="max-w-full max-h-full object-contain rounded"
                draggable={false}
              />
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="flex items-center justify-center gap-3 mt-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={index === 0}
              onClick={() => goToCarouselIndex(images, index - 1, setIndex)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
              {index + 1} / {images.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={index >= images.length - 1}
              onClick={() => goToCarouselIndex(images, index + 1, setIndex)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={sectionRef}
      className="relative border-2 border-blue-400 bg-white p-2 rounded-xl h-full max-h-full min-h-0 flex flex-col overflow-hidden"
      onDragEnter={handleSectionDragEnter}
      onDragLeave={handleSectionDragLeave}
      onDragOver={(e) => e.preventDefault()}
    >
      {showDragOverlay && (
        <div className="absolute inset-0 z-50 bg-black/50 rounded-xl flex gap-4 p-4 items-stretch">
          <div
            className="flex-1 border-2 border-dashed border-white rounded-lg flex flex-col items-center justify-center text-white cursor-copy hover:bg-white/10 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleFileDrop(e, 'BEFORE_PHOTO')}
          >
            <Upload className="h-10 w-10 mb-2" />
            <p className="text-lg font-medium">Plasați ca Înainte</p>
          </div>
          <div
            className="flex-1 border-2 border-dashed border-white rounded-lg flex flex-col items-center justify-center text-white cursor-copy hover:bg-white/10 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleFileDrop(e, 'AFTER_PHOTO')}
          >
            <Upload className="h-10 w-10 mb-2" />
            <p className="text-lg font-medium">Plasați ca După</p>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-lg font-semibold">Imagini pacient</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploadModal(true)}
            disabled={isUploading}
          >
            <ImagePlus className="w-4 h-4 mr-1" />
            Încarcă
          </Button>
        </div>

        {selectedImage && (
          <Card className="mb-4 shrink-0">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {tools.map((tool) => (
                    <Button
                      key={tool.id}
                      variant={selectedTool === tool.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToolSelect(tool.id)}
                      className="flex items-center gap-1"
                      title={tool.shortcut ? `${tool.name} (${tool.shortcut})` : tool.name}
                    >
                      {tool.icon}
                      <span className="text-xs hidden sm:inline">{tool.name}</span>
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                          <Label className="text-xs">Grosime:</Label>
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

                  <Separator orientation="vertical" className="h-6 hidden sm:block" />
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

                  <Separator orientation="vertical" className="h-6 hidden sm:block" />
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

                  {(shapes.length > 0 || measurements.length > 0) && (
                    <>
                      <Separator orientation="vertical" className="h-6 hidden sm:block" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShapes([]);
                          setMeasurements([]);
                          setCalibration(null);
                          setMeasurementStart(null);
                          setMeasurementActive(false);
                          setTextPosition(null);
                          setSelectedTextId(null);
                          setIsResizing(false);
                          setIsDraggingText(false);
                          if (selectedImage?.patientId && selectedImage?.id) {
                            fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/annotations`, {
                              method: 'DELETE'
                            }).catch(console.error);
                            fetch(`/api/patients/${selectedImage.patientId}/images/${selectedImage.id}/calibration`, {
                              method: 'DELETE'
                            }).catch(console.error);
                          }
                          requestAnimationFrame(applyImageAdjustments);
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Șterge tot
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-0">
          {renderCarouselPanel('Înainte', beforeImages, beforeIndex, setBeforeIndex)}
          {renderCarouselPanel('După', afterImages, afterIndex, setAfterIndex)}
          </div>
        </div>

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
                placeholder="Introduceți textul..."
                className="w-[200px]"
                autoFocus
              />
              <div className="flex items-center space-x-2">
                <Label className="text-xs">Scală:</Label>
                <Slider
                  value={[textScale]}
                  onValueChange={([value]) => setTextScale(value)}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-[100px]"
                />
              </div>
              <Button onClick={handleTextConfirm}>Confirmă</Button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          if (e.target.files?.length) {
            await uploadImages(e.target.files, uploadCategory);
            e.target.value = '';
            setShowUploadModal(false);
          }
        }}
      />

      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Încărcare fotografii</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Categorie</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={uploadCategory === 'BEFORE_PHOTO' ? 'default' : 'outline'}
                  onClick={() => setUploadCategory('BEFORE_PHOTO')}
                >
                  Înainte
                </Button>
                <Button
                  type="button"
                  variant={uploadCategory === 'AFTER_PHOTO' ? 'default' : 'outline'}
                  onClick={() => setUploadCategory('AFTER_PHOTO')}
                >
                  După
                </Button>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Se încarcă...' : 'Alegeți fișiere'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Move Patient Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mutare imagine la alt pacient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Căutare pacient</Label>
              <Input
                placeholder="Tastați numele pacientului..."
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
                      Cod: {patient.patientCode || 'Nedisponibil'}
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
              Ștergeți imaginea?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              {selectedImageForAction && (
                <div className="mb-4">
                  <img
                    src={selectedImageForAction.url}
                    alt="Imagine de șters"
                    className="w-24 h-24 object-cover rounded-lg mx-auto border-2 border-red-200"
                  />
                  <div className="mt-2">
                    <div className="font-medium">
                      {selectedImageForAction.type === 'BEFORE_PHOTO' ? 'Înainte' : selectedImageForAction.type === 'AFTER_PHOTO' ? 'După' : selectedImageForAction.type}
                    </div>
                    {selectedImageForAction.dateTaken && (
                      <div className="text-sm text-gray-400">
                        {new Date(selectedImageForAction.dateTaken).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <p className="text-gray-600">
                Sigur doriți să ștergeți această imagine? Această acțiune nu poate fi anulată.
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
                Anulare
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteImage}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Șterge imaginea
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 