import React, { useState, useEffect, useCallback, useRef, useReducer, useLayoutEffect, useMemo } from 'react';
import { Tooth } from './Tooth';
import { ToothModal } from './ToothModal';
import { ToolCursor } from './ToolCursor';
import { RightClickMenu } from './RightClickMenu';
import { PROCEDURE_TYPES, TOOL_ICONS } from './constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFillingOptions } from '@/contexts/FillingOptionsContext';
import { useCrownBridgeOptions } from '@/contexts/CrownBridgeOptionsContext';
import { useExtractionOptions } from '@/contexts/ExtractionOptionsContext';

import FillingToolOptions from './FillingToolOptions';
import CrownBridgeOptions from './CrownBridgeOptions';
import ExtractionToolOptions from './ExtractionToolOptions';
import SealingToolOptions from './SealingToolOptions';
import ScalingToolOptions from './ScalingToolOptions';

import { getFillingCode, getCodeByExact, createDentalProcedure } from '@/lib/fillings';
import { getCrownCode, createBridgeProcedures, analyzeBridgeTeeth, BridgeTeeth, getCodeByExact as getCrownCodeByExact } from '@/lib/crowns-bridges';
import { createExtractionProcedures, getExtractionCode } from '@/lib/extractions';
import { createSealingProcedures } from '@/lib/sealings';
import { createScalingProcedure } from '@/lib/scaling';
import { createPortal } from 'react-dom';

import { proceduresToToothData } from '@/lib/dental-chart-builder';

// Add JSX namespace for React
declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

const PERMANENT_TOOTH_IDS = [
  // Upper right (18-11)
  ...Array.from({ length: 8 }, (_, i) => 18 - i),
  // Upper left (21-28)
  ...Array.from({ length: 8 }, (_, i) => 21 + i),
  // Lower left (31-38)
  ...Array.from({ length: 8 }, (_, i) => 31 + i),
  // Lower right (41-48)
  ...Array.from({ length: 8 }, (_, i) => 41 + i),
];

const PRIMARY_TOOTH_IDS = [
  // Upper right (55-51)
  ...Array.from({ length: 5 }, (_, i) => 55 - i),
  // Upper left (61-65)
  ...Array.from({ length: 5 }, (_, i) => 61 + i),
  // Lower left (71-75)
  ...Array.from({ length: 5 }, (_, i) => 71 + i),
  // Lower right (81-85)
  ...Array.from({ length: 5 }, (_, i) => 81 + i),
];

// Define which tools are whole-tooth tools
const WHOLE_TOOTH_TOOLS = ['crown', 'extraction', 'implant', 'primary', 'disabled'];

// COMPLETELY NEW SUBSURFACE MAPPING SYSTEM
// Clear, unambiguous definitions for all tooth types and quadrants

// Universal subsurface definitions - NO MORE CONFUSION
const SUBSURFACE_DEFINITIONS = {
  // MOLAR SUBSURFACES (16-18, 26-28, 36-38, 46-48)
  molar: {
    buccal: ['buccal-1', 'buccal-2', 'cervical-buccal-1', 'cervical-buccal-2', 'triangle-3', 'triangle-4'],
    lingual: ['lingual-1', 'lingual-2', 'cervical-lingual-1', 'cervical-lingual-2', 'triangle-1', 'triangle-2'],
    occlusal: ['occlusal-1', 'occlusal-2', 'occlusal-3', 'occlusal-4'],
    mesial: ['interdental-mesial'],
    distal: ['interdental-distal']
  },
  // PREMOLAR SUBSURFACES (14-15, 24-25, 34-35, 44-45)
  premolar: {
    buccal: ['buccal', 'cervical-buccal', 'triangle-3', 'triangle-4'],
    lingual: ['lingual', 'cervical-lingual', 'triangle-1', 'triangle-2'],
    occlusal: ['occlusal'],
    mesial: ['interdental-mesial'],
    distal: ['interdental-distal']
  },
  // ANTERIOR SUBSURFACES (11-13, 21-23, 31-33, 41-43)
  anterior: {
    buccal: ['buccal', 'cervical-buccal', 'triangle-3', 'triangle-4'],
    lingual: ['lingual', 'cervical-lingual', 'triangle-1', 'triangle-2'],
    occlusal: ['occlusal'],
    mesial: ['interdental-mesial'],
    distal: ['interdental-distal']
  }
};

// Quadrant-aware triangle mapping
const TRIANGLE_MAPPING = {
  // Quadrant 1 (11-18): Upper Right
  1: {
    'triangle-1': 'lingual',
    'triangle-2': 'lingual',
    'triangle-3': 'buccal',
    'triangle-4': 'buccal'
  },
  // Quadrant 2 (21-28): Upper Left  
  2: {
    'triangle-1': 'lingual',
    'triangle-2': 'lingual',
    'triangle-3': 'buccal',
    'triangle-4': 'buccal'
  },
  // Quadrant 3 (31-38): Lower Left
  3: {
    'triangle-1': 'lingual',
    'triangle-2': 'lingual',
    'triangle-3': 'buccal',
    'triangle-4': 'buccal'
  },
  // Quadrant 4 (41-48): Lower Right
  4: {
    'triangle-1': 'lingual',
    'triangle-2': 'lingual',
    'triangle-3': 'buccal',
    'triangle-4': 'buccal'
  }
};

// Helper function to get quadrant from tooth ID
function getQuadrant(toothId: number): number {
  if (toothId >= 11 && toothId <= 18) return 1;
  if (toothId >= 21 && toothId <= 28) return 2;
  if (toothId >= 31 && toothId <= 38) return 3;
  if (toothId >= 41 && toothId <= 48) return 4;
  if (toothId >= 51 && toothId <= 55) return 1;
  if (toothId >= 61 && toothId <= 65) return 2;
  if (toothId >= 71 && toothId <= 75) return 3;
  if (toothId >= 81 && toothId <= 85) return 4;
  return 1;
}

// Helper function to get tooth type from tooth ID
export function getToothType(toothId: number): 'molar' | 'premolar' | 'anterior' {
  // Molars: 16-18, 26-28, 36-38, 46-48
  if ((toothId >= 16 && toothId <= 18) || (toothId >= 26 && toothId <= 28) ||
    (toothId >= 36 && toothId <= 38) || (toothId >= 46 && toothId <= 48)) {
    return 'molar';
  }
  // Premolars: 14-15, 24-25, 34-35, 44-45
  if ((toothId >= 14 && toothId <= 15) || (toothId >= 24 && toothId <= 25) ||
    (toothId >= 34 && toothId <= 35) || (toothId >= 44 && toothId <= 45)) {
    return 'premolar';
  }
  // Anterior: 11-13, 21-23, 31-33, 41-43
  return 'anterior';
}

// NEW: Map any subsurface to its main surface
export function mapSubsurfaceToMainSurface(subsurface: string, toothId: number): string {
  const quadrant = getQuadrant(toothId);
  const toothType = getToothType(toothId);

  // Handle triangles with quadrant-aware mapping
  if (subsurface.startsWith('triangle')) {
    const result = TRIANGLE_MAPPING[quadrant][subsurface] || 'buccal';
    return result;
  }

  // Handle other subsurfaces
  const definitions = SUBSURFACE_DEFINITIONS[toothType];
  for (const [mainSurface, subsurfaces] of Object.entries(definitions)) {
    if (subsurfaces.includes(subsurface)) {
      return mainSurface;
    }
  }

  // Fallback mappings
  if (subsurface.startsWith('buccal')) return 'buccal';
  if (subsurface.startsWith('lingual')) return 'lingual';
  if (subsurface.startsWith('occlusal')) return 'occlusal';
  if (subsurface.startsWith('mesial')) return 'mesial';
  if (subsurface.startsWith('distal')) return 'distal';

  return subsurface;
}

// NEW: Get all subsurfaces for a main surface
function getSubsurfacesForMainSurface(mainSurface: string, toothId: number): string[] {
  const toothType = getToothType(toothId);
  const definitions = SUBSURFACE_DEFINITIONS[toothType];
  const result = definitions[mainSurface] || [mainSurface];
  return result;
}

// NEW: Get all subsurfaces for a specific subsurface
function getAllSubsurfacesForSubsurface(subsurface: string, toothId: number): string[] {
  const mainSurface = mapSubsurfaceToMainSurface(subsurface, toothId);
  const result = getSubsurfacesForMainSurface(mainSurface, toothId);
  return result;
}

// Reducer for tooth types
function toothTypesReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_TOOTH':
      const { id } = action.payload;
      const isPrimary = state[id] === 'primary';
      const newType = isPrimary ? 'permanent' : 'primary';
      return { ...state, [id]: newType };
    case 'SET_TOOTH_TYPES':
      return action.payload;
    default:
      return state;
  }
}

// When initializing or updating toothData, always ensure zones object exists
function ensureZones(teeth) {
  const updated = { ...teeth };
  Object.keys(updated).forEach((id) => {
    if (!updated[id].zones) updated[id].zones = {};
  });
  return updated;
}

function getFillingNote(tooth: number, mainSurfaces: string[]) {
  // Determine quadrant and tooth type
  const quadrant = Math.floor(tooth / 10);
  const toothType = getToothType(tooth);

  // Apply swaps for Q2/Q3 molars
  let mappedSurfaces = [...mainSurfaces];
  if (toothType === 'molar') {
    if (quadrant === 2) {
      // Q2 molars: swap buccal <-> palatal, mesial <-> distal
      mappedSurfaces = mappedSurfaces.map(s => {
        if (s === 'buccal') return 'palatal';
        if (s === 'palatal' || s === 'lingual') return 'buccal';
        if (s === 'mesial') return 'distal';
        if (s === 'distal') return 'mesial';
        return s;
      });
    } else if (quadrant === 3) {
      // Q3 molars: swap mesial <-> distal
      mappedSurfaces = mappedSurfaces.map(s => {
        if (s === 'mesial') return 'distal';
        if (s === 'distal') return 'mesial';
        return s;
      });
    }
  }

  // Normalize palatal/lingual surfaces based on quadrant
  mappedSurfaces = mappedSurfaces.map(s => {
    if (s === 'palatal' || s === 'lingual') {
      if (quadrant === 1 || quadrant === 2) {
        return 'palatal'; // Q1/Q2: always "p"
      } else {
        return 'lingual'; // Q3/Q4: always "l"
      }
    }
    return s;
  });

  const surfaceMap: Record<string, string> = {
    occlusal: 'o',
    distal: 'd',
    mesial: 'm',
    buccal: 'b',
    palatal: 'p',
    lingual: 'l',
  };
  const codes = mappedSurfaces.map(s => surfaceMap[s] || s[0]).join('');
  return `${tooth}${codes}`;
}

export function DentalChart({
  procedures = [],
  toothTypes = {},
  readOnly = false,
  activeTool: externalActiveTool,
  onToolChange,
  patientId,
  onProcedureDeleted,
  onProcedureCreated,
  currentStatus = 'PENDING',
  activeProcedures = []
}: {
  procedures: any[]
  toothTypes: Record<number, string>
  readOnly?: boolean
  activeTool?: string | null
  onToolChange?: (tool: string) => void
  patientId?: string
  onProcedureDeleted?: () => void
  onProcedureCreated?: (procedure?: any) => void
  currentStatus?: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
  activeProcedures?: any[]
}) {
  // Simple state - no complex tracking
  const [toothData, setToothData] = useState({});
  const [internalActiveTool, setInternalActiveTool] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [scalingCode, setScalingCode] = useState<'T021' | 'T022'>('T022');

  // Add drag state tracking
  const [isDragging, setIsDragging] = useState(false);
  const mouseDownTimeRef = useRef(null);
  const mouseDownPositionRef = useRef<{ x: number; y: number } | null>(null);
  // Track modified (tooth, zone) pairs instead of just teeth
  const modifiedZonesInDragRef = useRef(new Set<string>());
  // Track created procedures to prevent duplicates
  const procedureCreatedRef = useRef(new Set<string>());

  // Add shift key detection
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Bridge connector key for re-rendering
  const [bridgeConnectorKey, setBridgeConnectorKey] = useState('');
  const prevBridgeTeethRef = useRef('');

  // Add state to track extraction creation
  const [isCreatingExtraction, setIsCreatingExtraction] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [processingDisabledTooth, setProcessingDisabledTooth] = useState<number | null>(null);
  const [creatingDisabledProcedures, setCreatingDisabledProcedures] = useState<Set<number>>(new Set());

  // Sealing modal state


  // Bridge drag tracking
  const bridgeDragTeethRef = useRef<Map<number, 'abutment' | 'pontic'>>(new Map());
  const bridgeTeethOrderRef = useRef<number[]>([]);
  const currentBridgeIdRef = useRef<string | null>(null);

  // Rebuild toothData from procedures whenever they change
  useEffect(() => {
    // Don't rebuild toothData if we're currently creating an extraction
    if (isCreatingExtraction) {
      return;
    }

    // Set rebuilding flag to prevent disabled tool interference
    setIsRebuilding(true);

    // Get saved dental chart data from procedures
    const savedDentalChart = procedures.find(proc => proc.code?.code === 'SAVED_DENTAL_CHART')?.notes;
    let parsedSavedData = null;

    if (savedDentalChart) {
      try {
        parsedSavedData = JSON.parse(savedDentalChart);
      } catch (e) {
        // Ignore parsing errors
      }
    }

    const newToothData = proceduresToToothData(procedures, toothTypes, parsedSavedData);

    // Preserve scaling visual feedback after data refresh
    const updatedToothData = { ...newToothData };

    // Check if we have any scaling procedures that should show visual feedback
    procedures.forEach(procedure => {
      if ((procedure.code?.code === 'T021' || procedure.code?.code === 'T022') && procedure.toothNumber) {
        const toothNumber = procedure.toothNumber;
        const scalingCode = procedure.code.code;

        // Add visual feedback for scaling procedures
        if (!updatedToothData[toothNumber]) {
          updatedToothData[toothNumber] = { zones: {}, procedures: [] };
        }

        const creationStatus = procedure.status === 'IN_PROGRESS' ? 'current' :
          procedure.status === 'COMPLETED' ? 'history' : 'pending';
        const procedureType = `scaling-${creationStatus}-${scalingCode}`;

        // Color all subsurfaces for scaling visual feedback
        const toothType = getToothType(toothNumber);
        const allSubsurfaces = [];

        if (toothType === 'molar') {
          allSubsurfaces.push(
            'buccal-1', 'buccal-2', 'cervical-buccal-1', 'cervical-buccal-2', 'triangle-3', 'triangle-4',
            'lingual-1', 'lingual-2', 'cervical-lingual-1', 'cervical-lingual-2', 'triangle-1', 'triangle-2',
            'occlusal-1', 'occlusal-2', 'occlusal-3', 'occlusal-4',
            'interdental-mesial', 'interdental-distal'
          );
        } else if (toothType === 'premolar') {
          allSubsurfaces.push(
            'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
            'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
            'occlusal',
            'interdental-mesial', 'interdental-distal'
          );
        } else {
          allSubsurfaces.push(
            'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
            'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
            'occlusal',
            'interdental-mesial', 'interdental-distal'
          );
        }

        // Color all subsurfaces with scaling color
        allSubsurfaces.forEach(subsurface => {
          updatedToothData[toothNumber].zones[subsurface] = procedureType;
        });
      }
    });

    // Always rebuild from procedures - disabled teeth are now properly handled by the dental chart builder
    setToothData(updatedToothData);

    // Clear rebuilding flag after a longer delay to allow disabled tool operations to complete
    setTimeout(() => {
      setIsRebuilding(false);
    }, 200);
  }, [procedures, toothTypes, isCreatingExtraction]);

  // Add shift key detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Use external tool state if provided, otherwise internal
  const activeTool = externalActiveTool !== undefined ? externalActiveTool : internalActiveTool;
  const handleSelectTool = (tool) => {
    // Clear procedure tracking when tool changes
    procedureCreatedRef.current.clear();

    // Clear bridge drag tracking when switching away from bridge tool
    if (activeTool === 'bridge' && tool !== 'bridge') {
      bridgeDragTeethRef.current.clear();
    }

    if (onToolChange) {
      onToolChange(tool);
    } else {
      setInternalActiveTool(tool);
    }
  };

  const fillingOptionsCtx = useFillingOptions();
  const fillingOptions = fillingOptionsCtx?.options;
  const crownBridgeOptionsCtx = useCrownBridgeOptions();
  const crownBridgeOptions = crownBridgeOptionsCtx?.options;
  const extractionOptionsCtx = useExtractionOptions();
  const extractionOptions = extractionOptionsCtx?.options;

  // Handle chart-wide drag events
  const handleChartMouseDown = useCallback((e) => {
    if (activeTool && !readOnly) {
      mouseDownTimeRef.current = Date.now();
      modifiedZonesInDragRef.current.clear();
      setIsDragging(false);
      // Clear bridge tracking for new drag operations
      bridgeDragTeethRef.current.clear();
      bridgeTeethOrderRef.current = [];
      currentBridgeIdRef.current = null;
      // Store initial mouse position for distance calculation
      mouseDownPositionRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [activeTool, readOnly]);

  const handleChartMouseMove = useCallback((e) => {
    if (mouseDownTimeRef.current && !isDragging && mouseDownPositionRef.current) {
      // Calculate distance moved
      const distance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPositionRef.current.x, 2) +
        Math.pow(e.clientY - mouseDownPositionRef.current.y, 2)
      );

      // Only trigger drag if moved more than 5 pixels (prevents accidental drags during scrolling)
      if (distance > 5) {
        setIsDragging(true);
      }
    }
  }, [isDragging]);

  const handleChartMouseUp = useCallback(async () => {
    // Clear procedure tracking when chart mouse up
    procedureCreatedRef.current.clear();
    // Clear mouse position tracking
    mouseDownPositionRef.current = null;

    // If we were dragging and have modified zones, create grouped procedures
    if (isDragging && modifiedZonesInDragRef.current.size > 0 && activeTool === 'filling' && patientId && patientId !== 'test-patient' && fillingOptions) {
      const material = fillingOptions?.material || 'composite';

      // Group surfaces by tooth
      const toothSurfaces: Record<number, string[]> = {};

      modifiedZonesInDragRef.current.forEach(zoneKey => {
        const [toothId, surface] = (zoneKey as string).split('__');
        const fdi = Number(toothId);
        if (!toothSurfaces[fdi]) toothSurfaces[fdi] = [];
        toothSurfaces[fdi].push(surface);
      });

      // Create one procedure per tooth with all its surfaces
      for (const [fdi, surfaces] of Object.entries(toothSurfaces)) {
        const toothNumber = Number(fdi);

        // Save the actual subsurface names to the database
        const uniqueSubsurfaces = [...new Set(surfaces)];

        // Count main surfaces for the procedure code and notes
        const mainSurfaces = new Set<string>();
        uniqueSubsurfaces.forEach(subsurface => {
          const mainSurface = mapSubsurfaceToMainSurface(subsurface, toothNumber);
          mainSurfaces.add(mainSurface);
        });

        const uniqueMainSurfaces = Array.from(mainSurfaces);

        try {
          const fillingCode = await getFillingCode(material, Math.min(uniqueMainSurfaces.length, 5));
          if (fillingCode) {
            const createdProcedure = await createDentalProcedure(
              patientId,
              fillingCode.id,
              toothNumber,
              getFillingNote(toothNumber, uniqueMainSurfaces),
              currentStatus,
              uniqueSubsurfaces, // Save the actual subsurface names
              material
            );
            // Pass the created procedure to the callback for undo stack population
            if (onProcedureCreated) {
              onProcedureCreated(createdProcedure);
            }
            if (fillingOptions.anesthesia) {
              const a10 = await getCodeByExact('A10');
              if (a10) {
                const anesthesiaProcedure = await createDentalProcedure(patientId, a10.id, toothNumber, 'Local anesthesia', currentStatus);
                if (onProcedureCreated) {
                  onProcedureCreated(anesthesiaProcedure);
                }
              }
            }
            if (fillingOptions.c022) {
              const c022 = await getCodeByExact('C022');
              if (c022) {
                const c022Procedure = await createDentalProcedure(patientId, c022.id, toothNumber, 'C022', currentStatus);
                if (onProcedureCreated) {
                  onProcedureCreated(c022Procedure);
                }
              }
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error creating grouped filling procedure:', error);
          }
        }
      }

      // Call onProcedureCreated if it exists
      if (typeof onProcedureCreated === 'function') {
        onProcedureCreated();
      }
    }

    // Handle sealing drag operations
    if (isDragging && modifiedZonesInDragRef.current.size > 0 && activeTool === 'sealing' && patientId && patientId !== 'test-patient') {
      // Get all teeth that were sealed during drag
      const sealedTeeth: number[] = [];
      modifiedZonesInDragRef.current.forEach(zoneKey => {
        const [toothId, surface] = (zoneKey as string).split('__');
        if (surface === 'sealing') {
          sealedTeeth.push(Number(toothId));
        }
      });

      // Create sealing procedures for all sealed teeth with V30/V35 logic
      if (sealedTeeth.length > 0) {
        try {
          console.log('🦷 Creating sealing procedures for teeth:', sealedTeeth);

          // Check if any of these teeth already have sealing procedures
          const existingSealingTeeth = new Set<number>();
          procedures.forEach(proc => {
            if ((proc.code.code === 'V30' || proc.code.code === 'V35') && sealedTeeth.includes(proc.toothNumber)) {
              existingSealingTeeth.add(proc.toothNumber);
            }
          });

          // Filter out teeth that already have sealing procedures
          const newTeethToSeal = sealedTeeth.filter(tooth => !existingSealingTeeth.has(tooth));
          console.log('🦷 New teeth to seal:', newTeethToSeal);

          if (newTeethToSeal.length > 0) {
            const createdProcedures = await createSealingProcedures(newTeethToSeal, patientId, currentStatus);
            console.log('🦷 Created procedures:', createdProcedures);

            // Pass all created procedures to the callback for undo stack population
            if (onProcedureCreated && createdProcedures.length > 0) {
              createdProcedures.forEach(procedure => {
                onProcedureCreated(procedure);
              });
            }
          }
        } catch (error) {
          console.error('Error creating grouped sealing procedures:', error);
        }
      }
    }

    // Handle extraction drag operations
    if (isDragging && modifiedZonesInDragRef.current.size > 0 && activeTool === 'extraction' && patientId && patientId !== 'test-patient' && extractionOptions) {
      // Get all teeth that were extracted during drag
      const extractedTeeth: number[] = [];
      modifiedZonesInDragRef.current.forEach(zoneKey => {
        const [toothId, surface] = (zoneKey as string).split('__');
        if (surface === 'extraction') {
          extractedTeeth.push(Number(toothId));
        }
      });

      // Create extraction procedures for all extracted teeth
      if (extractedTeeth.length > 0) {
        try {
          for (const toothNumber of extractedTeeth) {
            const createdProcedures = await createExtractionProcedures(
              patientId,
              toothNumber,
              extractionOptions.type,
              {
                suturing: extractionOptions.suturing,
                anesthesia: extractionOptions.anesthesia,
                c022: extractionOptions.c022,
              },
              currentStatus
            );

            // Pass all created procedures to the callback for undo stack population
            if (onProcedureCreated && createdProcedures.length > 0) {
              createdProcedures.forEach(procedure => {
                onProcedureCreated(procedure);
              });
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error creating grouped extraction procedures:', error);
          }
        }
      }
    }

    // Handle scaling drag operations
    if (isDragging && modifiedZonesInDragRef.current.size > 0 && activeTool === 'scaling' && patientId && patientId !== 'test-patient') {
      console.log('🦷 Scaling drag detected:', {
        modifiedZones: Array.from(modifiedZonesInDragRef.current),
        scalingCode,
        patientId,
        currentStatus
      });

      // Get all teeth that were scaled during drag
      const scaledTeeth: number[] = [];
      modifiedZonesInDragRef.current.forEach(zoneKey => {
        const [toothId, surface] = (zoneKey as string).split('__');
        if (surface.startsWith('scaling-')) {
          scaledTeeth.push(Number(toothId));
        }
      });

      console.log('🦷 Teeth to scale:', scaledTeeth);

      // Create scaling procedures for all scaled teeth
      if (scaledTeeth.length > 0) {
        try {
          for (const toothNumber of scaledTeeth) {
            // Create unique key for this procedure to prevent duplicates
            const procedureKey = `scaling-${toothNumber}-${scalingCode}`;

            if (!procedureCreatedRef.current.has(procedureKey)) {
              console.log(`🦷 Creating scaling procedure for tooth ${toothNumber} with code ${scalingCode}`);
              procedureCreatedRef.current.add(procedureKey);

              console.log(`🦷 Creating drag scaling procedure with currentStatus: ${currentStatus}`);
              const scalingProcedure = await createScalingProcedure(
                patientId,
                toothNumber,
                scalingCode,
                0, // No anesthesia by default - can be added via the scaling tool options
                currentStatus
              );
              console.log('🦷 Scaling procedure created:', scalingProcedure);
              if (onProcedureCreated) {
                console.log('🦷 Calling onProcedureCreated callback');
                onProcedureCreated(scalingProcedure);
              }

              // Keep the visual feedback for scaling procedures since they're invisible on the chart
              // Don't clear the visual feedback after procedure creation
            } else {
              console.log(`🦷 Skipping duplicate scaling procedure for tooth ${toothNumber}`);
            }
          }
        } catch (error) {
          console.error('❌ Error creating grouped scaling procedures:', error);
        }
      }
    }

    // Handle bridge drag cleanup
    if (activeTool === 'bridge') {
      // Clear bridge drag tracking
      bridgeDragTeethRef.current.clear();
      bridgeTeethOrderRef.current = [];
      currentBridgeIdRef.current = null;
    }

    mouseDownTimeRef.current = null;
    setIsDragging(false);
    modifiedZonesInDragRef.current.clear();
  }, [isDragging, activeTool, patientId, fillingOptions, currentStatus, onProcedureCreated]);

  // Simple tooth click handler with immediate visual feedback
  const handleToothClick = async (id, zoneIdOrSurface, surface, shiftPressed = false) => {
    if (readOnly || !activeTool) return;

    // Track unique (tooth, zone) pairs for drag
    const zoneKey = `${id}__${zoneIdOrSurface}`;
    if (isDragging && modifiedZonesInDragRef.current.has(zoneKey)) {
      return;
    }

    const type = toothTypes[id] || 'permanent';
    const fdi = type === 'primary' ? Number(id) : Number(id);

    let surfacesToFill: string[] = [];

    if (activeTool === 'filling') {
      if (shiftPressed && zoneIdOrSurface) {
        // Shift-click: fill ONLY the specific subsurface clicked (NO mapping, NO grouping)
        surfacesToFill = [zoneIdOrSurface];
      } else {
        // Normal click: fill ALL subsurfaces for the main surface
        const mainSurface = mapSubsurfaceToMainSurface(zoneIdOrSurface || surface, fdi);
        surfacesToFill = getSubsurfacesForMainSurface(mainSurface, fdi);
      }
    }

    // For immediate visual feedback during interaction, update local state
    // This will be overridden when procedures are rebuilt
    setToothData(prev => {
      const updated = { ...prev };
      if (!updated[fdi]) {
        updated[fdi] = { zones: {}, procedures: [] };
      }
      if (!updated[fdi].zones) updated[fdi].zones = {};
      if (activeTool === 'filling') {
        const material = fillingOptions?.material || 'composite';
        const creationStatus = currentStatus === 'IN_PROGRESS' ? 'current'
          : currentStatus === 'COMPLETED' ? 'history'
            : 'pending';
        const procedureType = `filling-${creationStatus}-${material}`;
        surfacesToFill.forEach(surface => {
          updated[fdi].zones[surface] = procedureType;
        });
      }
      if (activeTool === 'crown') {
        const material = crownBridgeOptions?.material || 'porcelain';
        updated[fdi].wholeTooth = {
          type: 'crown',
          material,
          creationStatus: currentStatus === 'IN_PROGRESS' ? 'current'
            : currentStatus === 'COMPLETED' ? 'history'
              : 'pending',
        };
      }
      if (activeTool === 'scaling') {
        // Add scaling visual feedback - color all subsurfaces with scaling color
        const creationStatus = currentStatus === 'IN_PROGRESS' ? 'current'
          : currentStatus === 'COMPLETED' ? 'history'
            : 'pending';
        const procedureType = `scaling-${creationStatus}-${scalingCode}`;

        // Color all subsurfaces for scaling
        const toothType = getToothType(fdi);
        const allSubsurfaces = [];

        if (toothType === 'molar') {
          // Molar subsurfaces
          allSubsurfaces.push(
            'buccal-1', 'buccal-2', 'cervical-buccal-1', 'cervical-buccal-2', 'triangle-3', 'triangle-4',
            'lingual-1', 'lingual-2', 'cervical-lingual-1', 'cervical-lingual-2', 'triangle-1', 'triangle-2',
            'occlusal-1', 'occlusal-2', 'occlusal-3', 'occlusal-4',
            'interdental-mesial', 'interdental-distal'
          );
        } else if (toothType === 'premolar') {
          // Premolar subsurfaces
          allSubsurfaces.push(
            'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
            'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
            'occlusal',
            'interdental-mesial', 'interdental-distal'
          );
        } else {
          // Anterior subsurfaces
          allSubsurfaces.push(
            'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
            'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
            'occlusal',
            'interdental-mesial', 'interdental-distal'
          );
        }

        // Color all subsurfaces with scaling color
        allSubsurfaces.forEach(subsurface => {
          updated[fdi].zones[subsurface] = procedureType;
        });
      }
      if (activeTool === 'extraction') {
        // Check if tooth is already extracted - if so, remove extraction
        if (updated[fdi].wholeTooth === 'extraction') {
          delete updated[fdi].wholeTooth;
          // Also remove all extraction-colored zones
          Object.keys(updated[fdi].zones).forEach(zone => {
            if (updated[fdi].zones[zone] === 'extraction') {
              delete updated[fdi].zones[zone];
            }
          });
        } else {
          updated[fdi].wholeTooth = 'extraction';

          // Color all subsurfaces red for extraction
          const toothType = getToothType(fdi);
          const allSubsurfaces = [];

          if (toothType === 'molar') {
            // Molar subsurfaces
            allSubsurfaces.push(
              'buccal-1', 'buccal-2', 'cervical-buccal-1', 'cervical-buccal-2', 'triangle-3', 'triangle-4',
              'lingual-1', 'lingual-2', 'cervical-lingual-1', 'cervical-lingual-2', 'triangle-1', 'triangle-2',
              'occlusal-1', 'occlusal-2', 'occlusal-3', 'occlusal-4',
              'interdental-mesial', 'interdental-distal'
            );
          } else if (toothType === 'premolar') {
            // Premolar subsurfaces
            allSubsurfaces.push(
              'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
              'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
              'occlusal',
              'interdental-mesial', 'interdental-distal'
            );
          } else {
            // Anterior subsurfaces
            allSubsurfaces.push(
              'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
              'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
              'occlusal',
              'interdental-mesial', 'interdental-distal'
            );
          }

          // Color all subsurfaces red
          allSubsurfaces.forEach(subsurface => {
            updated[fdi].zones[subsurface] = 'extraction';
          });
        }
      }
      if (activeTool === 'bridge') {
        // For bridge tool, only track teeth during drag operations
        if (isDragging) {
          // Check if this tooth is disabled or extracted
          const originalToothStatus = prev[fdi] || {};
          const isToothDisabledOrExtracted = originalToothStatus.isDisabled ||
            originalToothStatus.wholeTooth === 'extraction' ||
            originalToothStatus.wholeTooth?.type === 'extraction';

          // Add this tooth to the bridge drag tracking
          const role = isToothDisabledOrExtracted ? 'pontic' : 'abutment';
          bridgeDragTeethRef.current.set(fdi, role);

          // Track the order in which teeth were added
          if (!bridgeTeethOrderRef.current.includes(fdi)) {
            bridgeTeethOrderRef.current.push(fdi);
          }

          // Generate bridge ID if this is the first tooth in the bridge
          if (!currentBridgeIdRef.current) {
            currentBridgeIdRef.current = `bridge-${Date.now()}`;
          }

          // Update visual tooth data for immediate feedback
          const mat = crownBridgeOptions?.material || 'porcelain';
          const creationStatus = currentStatus === 'IN_PROGRESS' ? 'current'
            : currentStatus === 'COMPLETED' ? 'history'
              : 'pending';

          updated[fdi].wholeTooth = {
            type: 'crown',
            material: mat,
            role: role,
            bridgeId: currentBridgeIdRef.current,
            creationStatus: creationStatus,
            // For pontics, don't preserve disabled state - pontic appearance should override disabled
            originalState: role === 'pontic' ? 'healthy' : (isToothDisabledOrExtracted ?
              (originalToothStatus.isDisabled ? 'disabled' :
                originalToothStatus.wholeTooth === 'extraction' ? 'extraction' : 'missing') : 'healthy')
          };

          // Color all subsurfaces for the bridge tooth
          const toothType = getToothType(fdi);
          const allSubsurfaces = [];

          if (toothType === 'molar') {
            // Molar subsurfaces
            allSubsurfaces.push(
              'buccal-1', 'buccal-2', 'cervical-buccal-1', 'cervical-buccal-2', 'triangle-3', 'triangle-4',
              'lingual-1', 'lingual-2', 'cervical-lingual-1', 'cervical-lingual-2', 'triangle-1', 'triangle-2',
              'occlusal-1', 'occlusal-2', 'occlusal-3', 'occlusal-4',
              'interdental-mesial', 'interdental-distal'
            );
          } else if (toothType === 'premolar') {
            // Premolar subsurfaces
            allSubsurfaces.push(
              'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
              'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
              'occlusal',
              'interdental-mesial', 'interdental-distal'
            );
          } else {
            // Anterior subsurfaces
            allSubsurfaces.push(
              'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
              'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
              'occlusal',
              'interdental-mesial', 'interdental-distal'
            );
          }

          // Color all subsurfaces with bridge color
          allSubsurfaces.forEach(subsurface => {
            updated[fdi].zones[subsurface] = role === 'pontic' ? 'pontic' : 'bridge-abutment';
          });
        }
      }
      if (activeTool === 'disabled') {
        // Don't process disabled tool during rebuilds to prevent interference
        if (isRebuilding) {
          return updated;
        }

        // Prevent multiple simultaneous operations on the same tooth
        if (processingDisabledTooth === fdi) {
          return updated;
        }

        // Check if tooth is already disabled by looking at procedures and current state
        // Use both code.code and codeId checks for robustness
        const hasDisabledProcedure = procedures.some(p =>
          (p.code?.code === 'DISABLED' || p.codeId === 'DISABLED') && p.toothNumber === fdi
        );
        const isCurrentlyDisabled = updated[fdi]?.isDisabled || toothData[fdi]?.isDisabled || hasDisabledProcedure;

        if (isCurrentlyDisabled) {
          // Set processing flag to prevent multiple operations
          setProcessingDisabledTooth(fdi);
          // IMMEDIATELY remove disabled state from visual display
          delete updated[fdi].isDisabled;
          // Also remove all disabled-colored zones IMMEDIATELY
          if (updated[fdi].zones) {
            Object.keys(updated[fdi].zones).forEach(zone => {
              if (updated[fdi].zones[zone] === 'disabled') {
                delete updated[fdi].zones[zone];
              }
            });
          }

          // Remove disabled procedure from database FIRST, then refresh
          if (patientId && patientId !== 'test-patient') {
            // First, get the DISABLED code ID, then find and delete the disabled procedure
            fetch('/api/dental-codes').then(response => response.json()).then(codes => {
              const disabledCode = codes.find(c => c.code === 'DISABLED');
              if (!disabledCode) {
                console.error('🔍 DISABLED dental code not found');
                setProcessingDisabledTooth(null);
                return;
              }

              // Now find and delete the disabled procedure using the codeId
              fetch(`/api/patients/${patientId}/dental-procedures`, {
                method: 'GET'
              }).then(response => response.json()).then(procedures => {
                const disabledProcedures = procedures.filter(p => p.codeId === disabledCode.id && p.toothNumber === fdi);
                if (disabledProcedures.length > 0) {
                  // DELETE ALL DISABLED PROCEDURES FOR THIS TOOTH
                  Promise.all(disabledProcedures.map(procedure =>
                    fetch(`/api/patients/${patientId}/dental-procedures/${procedure.id}`, {
                      method: 'DELETE'
                    })
                  )).then(() => {
                    // Clear processing flag
                    setProcessingDisabledTooth(null);
                    // NOW refresh the dental chart - this will show the tooth as permanently enabled
                    if (onProcedureDeleted) {
                      onProcedureDeleted();
                    }
                  }).catch((error) => {
                    // Clear processing flag
                    setProcessingDisabledTooth(null);
                    // Still refresh to ensure UI is consistent
                    if (onProcedureDeleted) {
                      onProcedureDeleted();
                    }
                  });
                } else {
                  // Clear processing flag
                  setProcessingDisabledTooth(null);
                  // No disabled procedures found, but still refresh to ensure UI is consistent
                  if (onProcedureDeleted) {
                    onProcedureDeleted();
                  }
                }
              }).catch((error) => {
                // Clear processing flag
                setProcessingDisabledTooth(null);
                // Even if fetch fails, still refresh to ensure UI is consistent
                if (onProcedureDeleted) {
                  onProcedureDeleted();
                }
              });
            }).catch((error) => {
              // Clear processing flag
              setProcessingDisabledTooth(null);
              // Even if fetch fails, still refresh to ensure UI is consistent
              if (onProcedureDeleted) {
                onProcedureDeleted();
              }
            });
          }
        } else {
          updated[fdi].isDisabled = true;

          // Color all subsurfaces gray for disabled tooth
          const toothType = getToothType(fdi);
          const allSubsurfaces = [];

          if (toothType === 'molar') {
            // Molar subsurfaces
            allSubsurfaces.push(
              'buccal-1', 'buccal-2', 'cervical-buccal-1', 'cervical-buccal-2', 'triangle-3', 'triangle-4',
              'lingual-1', 'lingual-2', 'cervical-lingual-1', 'cervical-lingual-2', 'triangle-1', 'triangle-2',
              'occlusal-1', 'occlusal-2', 'occlusal-3', 'occlusal-4',
              'interdental-mesial', 'interdental-distal'
            );
          } else if (toothType === 'premolar') {
            // Premolar subsurfaces
            allSubsurfaces.push(
              'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
              'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
              'occlusal',
              'interdental-mesial', 'interdental-distal'
            );
          } else {
            // Anterior subsurfaces
            allSubsurfaces.push(
              'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
              'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
              'occlusal',
              'interdental-mesial', 'interdental-distal'
            );
          }

          // Color all subsurfaces gray
          allSubsurfaces.forEach(subsurface => {
            updated[fdi].zones[subsurface] = 'disabled';
          });

          // Create invisible disabled procedure in database
          if (patientId && patientId !== 'test-patient') {
            // Prevent multiple simultaneous disabled procedure creations for the same tooth
            if (creatingDisabledProcedures.has(fdi)) {
              return;
            }

            // Mark this tooth as having a disabled procedure being created
            setCreatingDisabledProcedures(prev => new Set([...prev, fdi]));

            // First get the DISABLED dental code
            fetch('/api/dental-codes').then(response => response.json()).then(codes => {
              const disabledCode = codes.find(c => c.code === 'DISABLED');
              if (disabledCode) {
                // Double-check if a disabled procedure already exists for this tooth
                // Use the procedures passed to the component first, then fetch if needed
                const existingDisabledProcedure = procedures.find(p =>
                  (p.code?.code === 'DISABLED' || p.codeId === disabledCode.id) && p.toothNumber === fdi
                );

                if (existingDisabledProcedure) {
                  console.log(`🔍 Tooth ${fdi} already has disabled procedure, skipping creation`);
                  // Remove from creating set
                  setCreatingDisabledProcedures(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(fdi);
                    return newSet;
                  });
                  // Trigger a single refresh to ensure UI is consistent
                  if (onProcedureCreated) {
                    onProcedureCreated();
                  }
                  return;
                }

                // Additional check: fetch from database to be absolutely sure
                fetch(`/api/patients/${patientId}/dental-procedures`, {
                  method: 'GET'
                }).then(response => response.json()).then(dbProcedures => {
                  const existingDbDisabledProcedure = dbProcedures.find(p =>
                    p.codeId === disabledCode.id && p.toothNumber === fdi
                  );

                  if (existingDbDisabledProcedure) {
                    console.log(`🔍 Tooth ${fdi} already has disabled procedure in database, skipping creation`);
                    // Remove from creating set
                    setCreatingDisabledProcedures(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(fdi);
                      return newSet;
                    });
                    // Trigger a single refresh to ensure UI is consistent
                    if (onProcedureCreated) {
                      onProcedureCreated();
                    }
                    return;
                  }

                  // Create the invisible procedure only if one doesn't already exist
                  fetch('/api/dental-procedures', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      patientId: patientId,
                      codeId: disabledCode.id,
                      toothNumber: fdi,
                      date: new Date().toISOString(),
                      status: 'PENDING',
                      subSurfaces: allSubsurfaces
                    })
                  }).then((response) => {
                    console.log(`🔍 Successfully created disabled procedure for tooth ${fdi}`);

                    // Parse the response to get the created procedure
                    return response.json().then((createdProcedure) => {
                      // Remove from creating set
                      setCreatingDisabledProcedures(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(fdi);
                        return newSet;
                      });

                      // Pass the created procedure to the callback for undo stack
                      if (onProcedureCreated) {
                        onProcedureCreated(createdProcedure);
                      }
                    });
                  }).catch((error) => {
                    console.error(`🔍 Error creating disabled procedure for tooth ${fdi}:`, error);

                    // Handle unique constraint violation gracefully
                    if (error.message && error.message.includes('Tooth is already disabled')) {
                      console.log(`🔍 Tooth ${fdi} is already disabled (constraint violation)`);
                    }

                    // Remove from creating set on error
                    setCreatingDisabledProcedures(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(fdi);
                      return newSet;
                    });
                  });
                }).catch((error) => {
                  if (process.env.NODE_ENV === 'development') {
                    console.error('Error checking existing disabled procedures:', error);
                  }
                  // Remove from creating set on error
                  setCreatingDisabledProcedures(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(fdi);
                    return newSet;
                  });
                });
              } else {
                // Remove from creating set if no disabled code found
                setCreatingDisabledProcedures(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(fdi);
                  return newSet;
                });
              }
            }).catch((error) => {
              if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching dental codes:', error);
              }
              // Remove from creating set on error
              setCreatingDisabledProcedures(prev => {
                const newSet = new Set(prev);
                newSet.delete(fdi);
                return newSet;
              });
            });
          }

          // Don't save disabled teeth to dental chart data - they are stored as procedures
          // The chart will be rebuilt from procedures when refreshed
        }
      }
      if (activeTool === 'sealing') {
        const creationStatus = currentStatus === 'IN_PROGRESS' ? 'current'
          : currentStatus === 'COMPLETED' ? 'history'
            : 'pending';

        // For molars, seal all four occlusal subsurfaces
        const toothType = getToothType(fdi);
        if (toothType === 'molar') {
          // Seal all four occlusal subsurfaces for molars
          updated[fdi].zones['occlusal-1'] = `sealing-${creationStatus}`;
          updated[fdi].zones['occlusal-2'] = `sealing-${creationStatus}`;
          updated[fdi].zones['occlusal-3'] = `sealing-${creationStatus}`;
          updated[fdi].zones['occlusal-4'] = `sealing-${creationStatus}`;
        } else {
          // For non-molars, seal the single occlusal surface
          updated[fdi].zones['occlusal'] = `sealing-${creationStatus}`;
        }
      }
      // Track (tooth, zone) for drag
      if (isDragging && activeTool === 'filling') {
        surfacesToFill.forEach(surface => {
          modifiedZonesInDragRef.current.add(`${id}__${surface}`);
        });
      }
      if (isDragging && activeTool === 'sealing') {
        // Track the tooth for sealing drag operations
        modifiedZonesInDragRef.current.add(`${id}__sealing`);
      }
      if (isDragging && activeTool === 'extraction') {
        // Track the tooth for extraction drag operations
        modifiedZonesInDragRef.current.add(`${id}__extraction`);
      }
      if (isDragging && activeTool === 'disabled') {
        // Track the tooth for disabled drag operations
        modifiedZonesInDragRef.current.add(`${id}__disabled`);
      }
      if (isDragging && activeTool === 'scaling') {
        // Track the tooth for scaling drag operations
        modifiedZonesInDragRef.current.add(`${id}__scaling-${scalingCode}`);
      }



      return updated;
    });

    // Only create procedures if NOT dragging (single clicks)
    if (!isDragging && activeTool === 'filling' && patientId && patientId !== 'test-patient' && fillingOptions && surfacesToFill.length > 0) {
      const material = fillingOptions?.material || 'composite';

      // Save the actual subsurface names to the database
      const uniqueSubsurfaces = [...new Set(surfacesToFill)];

      try {
        // Count main surfaces for the procedure code and notes
        const mainSurfaces = new Set<string>();
        uniqueSubsurfaces.forEach(subsurface => {
          const mainSurface = mapSubsurfaceToMainSurface(subsurface, fdi);
          mainSurfaces.add(mainSurface);
        });
        const uniqueMainSurfaces = Array.from(mainSurfaces);

        const fillingCode = await getFillingCode(material, Math.min(uniqueMainSurfaces.length, 5));
        if (fillingCode) {
          const createdProcedure = await createDentalProcedure(
            patientId,
            fillingCode.id,
            fdi,
            getFillingNote(fdi, uniqueMainSurfaces),
            currentStatus,
            uniqueSubsurfaces, // Save the actual subsurface names
            material
          );
          // Pass the created procedure to the callback for undo stack population
          if (onProcedureCreated) {
            onProcedureCreated(createdProcedure);
          }
          if (fillingOptions.anesthesia) {
            const a10 = await getCodeByExact('A10');
            if (a10) {
              const anesthesiaProcedure = await createDentalProcedure(patientId, a10.id, fdi, 'Local anesthesia', currentStatus);
              if (onProcedureCreated) {
                onProcedureCreated(anesthesiaProcedure);
              }
            }
          }
          if (fillingOptions.c022) {
            const c022 = await getCodeByExact('C022');
            if (c022) {
              const c022Procedure = await createDentalProcedure(patientId, c022.id, fdi, 'C022', currentStatus);
              if (onProcedureCreated) {
                onProcedureCreated(c022Procedure);
              }
            }
          }
          if (onProcedureCreated) onProcedureCreated();
        }
      } catch (error) {
        // Only log errors, no spam
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating filling procedure:', error);
        }
      }
    }

    // Create sealing procedures for single clicks
    if (!isDragging && activeTool === 'sealing' && patientId && patientId !== 'test-patient') {
      try {
        const createdProcedures = await createSealingProcedures([fdi], patientId, currentStatus);

        // Pass all created procedures to the callback for undo stack population
        if (onProcedureCreated && createdProcedures.length > 0) {
          createdProcedures.forEach(procedure => {
            onProcedureCreated(procedure);
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating sealing procedure:', error);
        }
      }
    }

    // Create extraction procedures for single clicks
    if (!isDragging && activeTool === 'extraction' && patientId && patientId !== 'test-patient' && extractionOptions) {
      try {
        // Check if tooth is already extracted - if so, remove extraction procedures
        const currentToothData = toothData[fdi];
        if (currentToothData?.wholeTooth === 'extraction') {
          // Tooth is already extracted, clicking again should remove extraction
          // This will be handled by the procedure deletion callback
          if (onProcedureDeleted) onProcedureDeleted();
        } else {
          // Set flag to prevent toothData rebuild during extraction creation
          setIsCreatingExtraction(true);

          // Create new extraction procedures
          const createdProcedures = await createExtractionProcedures(
            patientId,
            fdi,
            extractionOptions.type,
            {
              suturing: extractionOptions.suturing,
              anesthesia: extractionOptions.anesthesia,
              c022: extractionOptions.c022,
            },
            currentStatus
          );

          // Pass all created procedures to the callback for undo stack population
          if (onProcedureCreated && createdProcedures.length > 0) {
            createdProcedures.forEach(procedure => {
              onProcedureCreated(procedure);
            });
          }

          // Clear flag after a short delay to allow procedures to update
          setTimeout(() => {
            setIsCreatingExtraction(false);
          }, 100);
        }
      } catch (error) {
        setIsCreatingExtraction(false);
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating extraction procedure:', error);
        }
      }
    }

    // Create crown procedures for single clicks
    if (!isDragging && activeTool === 'crown' && patientId && patientId !== 'test-patient' && crownBridgeOptions) {
      try {
        // Check if tooth is already crowned - if so, remove crown procedures
        const currentToothData = toothData[fdi];
        if (currentToothData?.wholeTooth?.type === 'crown') {
          // Tooth is already crowned, clicking again should remove crown procedures
          // This will be handled by the procedure deletion callback
          if (onProcedureDeleted) onProcedureDeleted();
        } else {
          // Check if R24/R34 procedure already exists for this tooth to prevent duplicates
          // Check across ALL statuses to prevent duplicates in any tab
          const existingCrownProcedure = procedures.find(p =>
            p.toothNumber === fdi &&
            (p.code.code === 'R24' || p.code.code === 'R34')
          );

          if (existingCrownProcedure) {
            // Crown procedure already exists for this tooth, don't create another one
            if (process.env.NODE_ENV === 'development') {
              console.log(`${existingCrownProcedure.code.code} procedure already exists for tooth ${fdi} (status: ${existingCrownProcedure.status}), skipping creation`);
            }
            return;
          }

          // Create unique key for this procedure to prevent duplicates
          const procedureKey = `crown-${fdi}-${crownBridgeOptions.material}`;

          // Check if procedure was already created for this tooth
          if (!procedureCreatedRef.current.has(procedureKey)) {
            procedureCreatedRef.current.add(procedureKey);

            const crownCode = await getCrownCode(crownBridgeOptions.material);
            if (crownCode) {
              // Create main crown procedure with simple description
              const crownProcedure = await createDentalProcedure(
                patientId,
                crownCode.id,
                fdi,
                `${crownBridgeOptions.material} crown on tooth ${fdi}`,
                currentStatus
              );
              if (onProcedureCreated) {
                onProcedureCreated(crownProcedure);
              }

              // Create separate procedures for selected related codes (like fillings do)
              if (crownBridgeOptions.retention) {
                const r14 = await getCrownCodeByExact('R14');
                if (r14) {
                  const retentionProcedure = await createDentalProcedure(patientId, r14.id, fdi, 'Retention', currentStatus);
                  if (onProcedureCreated) {
                    onProcedureCreated(retentionProcedure);
                  }
                }
              }

              if (crownBridgeOptions.anesthesia) {
                const a10 = await getCrownCodeByExact('A10');
                if (a10) {
                  const anesthesiaProcedure = await createDentalProcedure(patientId, a10.id, fdi, 'Local anesthesia', currentStatus);
                  if (onProcedureCreated) {
                    onProcedureCreated(anesthesiaProcedure);
                  }
                }
              }

              if (crownBridgeOptions.c022) {
                const c022 = await getCrownCodeByExact('C022');
                if (c022) {
                  const c022Procedure = await createDentalProcedure(patientId, c022.id, fdi, 'C022', currentStatus);
                  if (onProcedureCreated) {
                    onProcedureCreated(c022Procedure);
                  }
                }
              }
            }

            if (onProcedureCreated) onProcedureCreated();
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating crown procedure:', error);
        }
      }
    }

    // Create scaling procedures for single clicks
    if (!isDragging && activeTool === 'scaling' && patientId && patientId !== 'test-patient') {
      console.log('🦷 Single click scaling detected:', { fdi, scalingCode, patientId, currentStatus });
      try {
        // Create unique key for this procedure to prevent duplicates
        const procedureKey = `scaling-${fdi}-${scalingCode}`;

        // Check if procedure was already created for this tooth
        if (!procedureCreatedRef.current.has(procedureKey)) {
          console.log(`🦷 Creating single click scaling procedure for tooth ${fdi} with code ${scalingCode}`);
          procedureCreatedRef.current.add(procedureKey);

          // Create scaling procedure using the selected scaling code
          console.log(`🦷 Creating scaling procedure with currentStatus: ${currentStatus}`);
          const scalingProcedure = await createScalingProcedure(
            patientId,
            fdi,
            scalingCode,
            0, // No anesthesia by default - can be added via the scaling tool options
            currentStatus
          );
          console.log('🦷 Single click scaling procedure created:', scalingProcedure);
          if (onProcedureCreated) {
            console.log('🦷 Calling onProcedureCreated callback for single click');
            onProcedureCreated(scalingProcedure);
          }

          // Keep the visual feedback for scaling procedures since they're invisible on the chart
          // Don't clear the visual feedback after procedure creation
        } else {
          console.log(`🦷 Skipping duplicate single click scaling procedure for tooth ${fdi}`);
        }
      } catch (error) {
        console.error('❌ Error creating single click scaling procedure:', error);
      }
    }

    // Create bridge procedures for drag operations
    if (isDragging && activeTool === 'bridge' && patientId && patientId !== 'test-patient' && crownBridgeOptions) {
      try {
        // Check if we have teeth in the bridge drag
        if (bridgeDragTeethRef.current.size > 0) {

          // Use the shared bridgeId for all teeth in this bridge
          const bridgeId = currentBridgeIdRef.current || `bridge-${Date.now()}`;

          // Create bridge procedures
          const bridgeTeeth: BridgeTeeth = {};
          // Use the preserved order in which teeth were added to the bridge (first added = main abutment)
          const teethArray = bridgeTeethOrderRef.current;

          // Use the roles already determined during bridge drag
          teethArray.forEach((toothNum, index) => {
            const dragRole = bridgeDragTeethRef.current.get(toothNum);
            const toothStatus = toothData[toothNum];

            // Use the role from the drag if available, otherwise determine it
            if (dragRole) {
              bridgeTeeth[toothNum] = dragRole;
            } else {
              // Fallback logic (should rarely be needed)
              const isFirstOrLast = index === 0 || index === teethArray.length - 1;

              if (isFirstOrLast) {
                bridgeTeeth[toothNum] = 'abutment';
              } else {
                const isToothDisabledOrExtracted = toothStatus?.isDisabled ||
                  toothStatus?.wholeTooth === 'extraction' ||
                  toothStatus?.wholeTooth?.type === 'extraction';

                bridgeTeeth[toothNum] = isToothDisabledOrExtracted ? 'pontic' : 'abutment';
              }
            }
          });

          // Create bridge procedures with the same bridgeId for all teeth
          // Use a unique key to prevent duplicate creation
          const bridgeProcedureKey = `bridge-${bridgeId}-${Object.keys(bridgeTeeth).sort().join('-')}`;

          if (!procedureCreatedRef.current.has(bridgeProcedureKey)) {
            procedureCreatedRef.current.add(bridgeProcedureKey);

            const createdBridgeProcedures = await createBridgeProcedures(
              patientId,
              bridgeTeeth,
              crownBridgeOptions.material,
              bridgeId,
              {
                retention: crownBridgeOptions.retention,
                anesthesia: crownBridgeOptions.anesthesia,
                c022: crownBridgeOptions.c022,
              },
              currentStatus
            );

            // Add all created bridge procedures to the undo stack
            if (onProcedureCreated && createdBridgeProcedures.length > 0) {
              createdBridgeProcedures.forEach(procedure => {
                onProcedureCreated(procedure);
              });
            }
          }

          if (onProcedureCreated) onProcedureCreated();
        }
      } catch (error) {

      }
    }
  };

  const handleRightClick = (e, id) => {
    e.preventDefault();
    if (readOnly) return;
    setContextMenu({ x: e.clientX, y: e.clientY, toothId: id });
  };

  const handleRemoveProcedure = async (id, surface) => {
    // Simple procedure removal - just call the callback
    if (onProcedureDeleted) {
      onProcedureDeleted();
    }
  };

  const handleShowHistory = (id) => {
    setSelectedTooth({ id, data: toothData[id] });
  };

  const handleModalClose = () => setSelectedTooth(null);

  const relevantToothIds = PERMANENT_TOOTH_IDS.concat(PRIMARY_TOOTH_IDS);

  // Add ref to track tooth containers for position calculation
  const toothContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Render bridge connectors at chart level using actual DOM positions
  const renderBridgeConnectors = useCallback(() => {
    const connectors: React.ReactElement[] = [];

    // Find all completed bridges (excluding active bridge drags)
    const bridges: Record<string, number[]> = {};
    Object.entries(toothData).forEach(([fdi, status]) => {
      const wholeTooth = (status as any)?.wholeTooth;
      const bridgeId = wholeTooth?.bridgeId;

      if (bridgeId) {
        if (!bridges[bridgeId]) bridges[bridgeId] = [];
        bridges[bridgeId].push(parseInt(fdi));
      }
    });

    // Add active bridge drag if exists
    if (bridgeDragTeethRef.current.size > 0) {
      const activeBridgeTeeth = Array.from(bridgeDragTeethRef.current.keys());
      const bridgeId = currentBridgeIdRef.current || `bridge-${Date.now()}`;
      bridges[bridgeId] = activeBridgeTeeth;
    }

    // Find pontics and connect them to adjacent abutments
    Object.entries(toothData).forEach(([fdi, status]) => {
      const wholeTooth = (status as any)?.wholeTooth;
      if (wholeTooth?.role === 'pontic' && !wholeTooth?.bridgeId) {
        const toothNum = parseInt(fdi);
        // Look for adjacent abutments to find the bridge this pontic belongs to
        for (let offset of [-1, 1, -2, 2]) {
          const adjacentTooth = toothNum + offset;
          const adjacentStatus = toothData[adjacentTooth];
          const adjacentBridgeId = (adjacentStatus as any)?.wholeTooth?.bridgeId;

          if (adjacentBridgeId && adjacentStatus?.wholeTooth?.role === 'abutment') {
            // Add this pontic to the same bridge
            if (!bridges[adjacentBridgeId]) bridges[adjacentBridgeId] = [];
            if (!bridges[adjacentBridgeId].includes(toothNum)) {
              bridges[adjacentBridgeId].push(toothNum);
            }
            break; // Found the bridge, stop looking
          }
        }
      }
    });

    // Only use actual bridges with bridgeId - no fallback for individual crowns

    // Get actual DOM positions of teeth
    const getToothDOMPosition = (fdi: number, displayId: number) => {
      const containerEl = toothContainerRefs.current.get(displayId);
      if (!containerEl) return null;

      const chartContainer = containerEl.closest('.dental-chart-container');
      if (!chartContainer) return null;

      const containerRect = containerEl.getBoundingClientRect();
      const chartRect = chartContainer.getBoundingClientRect();

      // Calculate position relative to chart container
      const x = containerRect.left - chartRect.left + (containerRect.width / 2);
      const y = containerRect.top - chartRect.top + (containerRect.height / 2);

      return { x, y, width: containerRect.width, height: containerRect.height };
    };

    // Render connectors for each bridge
    Object.entries(bridges).forEach(([bridgeId, bridgeTeeth]) => {
      // Allow cantilever bridges (1 abutment + 1 pontic) - minimum 2 teeth
      if (bridgeTeeth.length < 2) return;

      // Get positions for all teeth in bridge
      const teethWithPositions = bridgeTeeth.map(fdi => {
        // Find the display ID that corresponds to this FDI
        let displayId = fdi;
        for (const [id, type] of Object.entries(toothTypes)) {
          const convertedFdi = type === 'primary' ? Number(id) : Number(id);
          if (convertedFdi === fdi) {
            displayId = Number(id);
            break;
          }
        }

        const position = getToothDOMPosition(fdi, displayId);
        return { toothNum: fdi, displayId, position };
      }).filter(item => item.position !== null);

      // Allow cantilever bridges - minimum 2 teeth with positions
      if (teethWithPositions.length < 2) return;

      // Sort by x position (left to right)
      teethWithPositions.sort((a, b) => a.position!.x - b.position!.x);

      const firstToothData = toothData[teethWithPositions[0].toothNum];
      const material = (firstToothData as any)?.wholeTooth?.material || crownBridgeOptions?.material || 'porcelain';
      // Get creation status for outline color
      const creationStatus = (firstToothData as any)?.wholeTooth?.creationStatus ||
        (currentStatus === 'IN_PROGRESS' ? 'current' : currentStatus === 'COMPLETED' ? 'history' : 'pending');
      const statusOutlineColor = creationStatus === 'current' ? '#3b82f6'
        : creationStatus === 'history' ? '#6b7280'
          : creationStatus === 'pending' ? '#22c55e'
            : '#b197d6'; // default purple

      // Create connectors between consecutive teeth in the bridge
      for (let i = 0; i < teethWithPositions.length - 1; i++) {
        const tooth1 = teethWithPositions[i];
        const tooth2 = teethWithPositions[i + 1];

        if (!tooth1.position || !tooth2.position) continue;



        // Only connect teeth in the same row (similar y positions)
        if (Math.abs(tooth1.position.y - tooth2.position.y) > 50) continue;

        const connectorHeight = 30; // thicker connector
        const connectorY = tooth1.position.y - (connectorHeight / 2) - 16; // slightly higher

        // Calculate connector between teeth - using center distance for robustness
        const centerDistance = tooth2.position.x - tooth1.position.x;
        if (centerDistance <= 0) continue; // sanity check

        const connectorWidth = Math.max(centerDistance * 1.1, 30); // 110% of distance, min 30px - longer to avoid gaps
        const connectorX = tooth1.position.x - (connectorWidth - centerDistance) / 2; // extend beyond both teeth

        // Only render if there's a positive gap
        if (connectorWidth > 0) {
          const connector = (
            <g key={`bridge-${bridgeId}-${tooth1.toothNum}-${tooth2.toothNum}`}>
              <defs>
                <linearGradient id={`bridgeGrad-${bridgeId}-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={material === 'gold' ? '#fbbf24' : '#f8fafc'} />
                  <stop offset="30%" stopColor={material === 'gold' ? '#f59e0b' : '#e2e8f0'} />
                  <stop offset="70%" stopColor={material === 'gold' ? '#d97706' : '#cbd5e1'} />
                  <stop offset="100%" stopColor={material === 'gold' ? '#92400e' : '#94a3b8'} />
                </linearGradient>
                <filter id={`bridgeShadow-${bridgeId}-${i}`}>
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.2" />
                </filter>
              </defs>
              <rect
                x={connectorX}
                y={connectorY}
                width={connectorWidth}
                height={connectorHeight}
                fill={`url(#bridgeGrad-${bridgeId}-${i})`}
                stroke={statusOutlineColor}
                strokeWidth="2"
                rx="6"
                filter={`url(#bridgeShadow-${bridgeId}-${i})`}
                opacity="0.95"
              />
              {/* Add highlight line for 3D effect */}
              <rect
                x={connectorX}
                y={connectorY + 1}
                width={connectorWidth}
                height="2"
                fill={material === 'gold' ? '#fde047' : '#ffffff'}
                rx="6"
                opacity="0.6"
              />
            </g>
          );

          connectors.push(connector);
        }
      }
    });

    return connectors;
  }, [toothData, toothTypes, bridgeDragTeethRef.current, crownBridgeOptions, currentStatus]);

  // Only trigger bridge connector re-render when the set of teeth with bridges changes
  useEffect(() => {
    // Find all teeth with a bridgeId
    const bridgeTeeth = Object.entries(toothData)
      .filter(([_, status]) => (status as any)?.wholeTooth?.bridgeId)
      .map(([id, _]) => id)
      .sort()
      .join(',');

    // Add active bridge drag teeth
    const activeDragTeeth = Array.from(bridgeDragTeethRef.current.keys()).sort().join(',');
    const allBridgeTeeth = bridgeTeeth + (activeDragTeeth ? ',' + activeDragTeeth : '');

    // Only update if the bridge teeth have actually changed
    if (prevBridgeTeethRef.current !== allBridgeTeeth) {
      setBridgeConnectorKey(allBridgeTeeth);
      prevBridgeTeethRef.current = allBridgeTeeth;
    }
  }, [toothData, bridgeDragTeethRef.current.size]);



  // Add 'Primary Tooth' tool to toolbox
  const toolbox = [
    ...PROCEDURE_TYPES,
    { id: 'primary', label: 'Primary Tooth', icon: '/icons/primary.svg' },
  ];

  // Cleanup scaling preview when tool changes
  const prevToolRef = useRef(activeTool);
  useEffect(() => {
    if (prevToolRef.current === 'scaling' && activeTool !== 'scaling') {
      // Don't remove scaling surfaces when tool changes - they persist for outline visibility
      // Only clear procedure deduplication when switching tools
      // procedureCreatedRef.current.clear(); // This line was removed as per the edit hint
    }
    prevToolRef.current = activeTool;
  }, [activeTool]);

  // Clear scaling visual state when procedures change
  useEffect(() => {
    if (activeProcedures && activeProcedures.length > 0) {
      // Get teeth that have scaling procedures
      const teethWithScalingProcedures = new Set();
      activeProcedures.forEach(proc => {
        if (proc.code?.code?.startsWith('T021') || proc.code?.code?.startsWith('T022')) {
          teethWithScalingProcedures.add(proc.toothNumber);
        }
      });

      // Only update if there are actual changes to avoid infinite loops
      setToothData(prev => {
        let hasChanges = false;
        const updated = { ...prev };

        Object.keys(updated).forEach(toothNum => {
          const num = parseInt(toothNum);
          if (!teethWithScalingProcedures.has(num)) {
            // Remove scaling visual state if no scaling procedure
            if (updated[num].surfaces) {
              Object.keys(updated[num].surfaces).forEach(surface => {
                if (updated[num].surfaces[surface].startsWith('scaling-')) {
                  delete updated[num].surfaces[surface];
                  hasChanges = true;
                }
              });
            }
          }
        });

        // Only return updated if there were actual changes
        return hasChanges ? updated : prev;
      });
    }
  }, [activeProcedures]);

  // CrownOverlay: renders a crown SVG at an absolute position over the chart
  function CrownOverlay({ el, wholeTooth, toothId, viewBox, onRightClick }) {
    if (!wholeTooth || !el) return null;


    // Find the actual SVG element inside the tooth container
    const svg = el.querySelector('svg');
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    // Use the SVG's own viewBox for overlay
    const vbStr = svg.getAttribute('viewBox') || viewBox || '65 50 100 135';
    const [vbX, vbY, vbW, vbH] = vbStr.split(' ').map(Number);
    // Crown ellipse: cx=160, cy=115, rx=100, ry=70 (moved much further right to properly center)
    // Use a smaller margin to prevent overlap with adjacent teeth
    const svgCx = 160, svgCy = 115, svgRx = 100, svgRy = 70, margin = 10;
    const crownBoxX = svgCx - svgRx - margin;
    const crownBoxY = svgCy - svgRy - margin;
    const crownBoxW = svgRx * 2 + margin * 2;
    const crownBoxH = svgRy * 2 + margin * 2;
    // Calculate scale from SVG units to pixels
    // Restore the overlay crown to its original size, regardless of the underlying SVG scale
    const overlayW = crownBoxW * 0.7; // do not scale by rect.width/vbW
    const overlayH = crownBoxH * 0.7; // do not scale by rect.height/vbH
    // Center overlay SVG on the tooth's center, accounting for the tooth number offset (ml-6 = 1.5rem = 24px)
    const toothCenterX = rect.left + rect.width / 2 + 12; // Reduced offset to move crown slightly left
    const toothCenterY = rect.top + rect.height / 2;
    const overlayLeft = toothCenterX - overlayW / 2;
    const overlayTop = toothCenterY - overlayH / 2;
    // Center of the crown in overlay SVG units (centered on the new position)
    const overlayCx = svgCx;
    const overlayCy = svgCy;
    return createPortal(
      <svg
        style={{
          position: 'absolute',
          left: overlayLeft,
          top: overlayTop,
          width: overlayW,
          height: overlayH,
          pointerEvents: 'none',
          zIndex: 1000,
        }}
        width={overlayW}
        height={overlayH}
        viewBox={`${crownBoxX} ${crownBoxY} ${crownBoxW} ${crownBoxH}`}
        className="crown-overlay"
        onContextMenu={e => {
          if (onRightClick) onRightClick(e, toothId);
        }}
      >
        <defs>
          <radialGradient id={`crownGradient-${toothId}`} cx="30%" cy="30%">
            <stop offset="0%" stopColor={wholeTooth.material === 'gold' ? '#fbbf24' : '#ffffff'} />
            <stop offset="40%" stopColor={wholeTooth.material === 'gold' ? '#f59e0b' : '#f8fafc'} />
            <stop offset="80%" stopColor={wholeTooth.material === 'gold' ? '#d97706' : '#e2e8f0'} />
            <stop offset="100%" stopColor={wholeTooth.material === 'gold' ? '#92400e' : '#cbd5e1'} />
          </radialGradient>
          <radialGradient id={`crownGradientHover-${toothId}`} cx="30%" cy="30%">
            <stop offset="0%" stopColor={wholeTooth.material === 'gold' ? '#fde047' : '#ffffff'} />
            <stop offset="40%" stopColor={wholeTooth.material === 'gold' ? '#fbbf24' : '#ffffff'} />
            <stop offset="80%" stopColor={wholeTooth.material === 'gold' ? '#f59e0b' : '#f8fafc'} />
            <stop offset="100%" stopColor={wholeTooth.material === 'gold' ? '#d97706' : '#e2e8f0'} />
          </radialGradient>
          <linearGradient id={`crownHighlight-${toothId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={wholeTooth.material === 'gold' ? '#fde047' : '#ffffff'} stopOpacity="0.8" />
            <stop offset="50%" stopColor={wholeTooth.material === 'gold' ? '#fde047' : '#ffffff'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={wholeTooth.material === 'gold' ? '#fde047' : '#ffffff'} stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id={`crownHighlightHover-${toothId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={wholeTooth.material === 'gold' ? '#fef3c7' : '#ffffff'} stopOpacity="0.9" />
            <stop offset="50%" stopColor={wholeTooth.material === 'gold' ? '#fde047' : '#ffffff'} stopOpacity="0.5" />
            <stop offset="100%" stopColor={wholeTooth.material === 'gold' ? '#fbbf24' : '#ffffff'} stopOpacity="0.2" />
          </linearGradient>
          <filter id={`crownShadow-${toothId}`}>
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor={wholeTooth.material === 'gold' ? '#92400e' : '#94a3b8'} floodOpacity="0.4" />
          </filter>
          <filter id={`crownShadowHover-${toothId}`}>
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor={wholeTooth.material === 'gold' ? '#92400e' : '#94a3b8'} floodOpacity="0.2" />
          </filter>
          <linearGradient id="ponticGapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#fca5a5" />
          </linearGradient>
        </defs>
        {wholeTooth.role === 'pontic' ? (
          <g>
            {/* Pontic crown - same as regular crown */}
            <ellipse
              cx={overlayCx}
              cy={overlayCy}
              rx="60"
              ry="70"
              fill={`url(#crownGradient-${toothId})`}
              stroke={wholeTooth.creationStatus === 'current' ? '#3b82f6' : wholeTooth.creationStatus === 'history' ? '#6b7280' : '#22c55e'}
              strokeWidth="3"
              filter={`url(#crownShadow-${toothId})`}
              className="crown-ellipse"
              style={{ pointerEvents: 'auto' }}
              onClick={() => {
                // Handle crown click - this should trigger the crown tool
                if (onRightClick) {
                  const mockEvent = { preventDefault: () => { } };
                  onRightClick(mockEvent, toothId);
                }
              }}
            />
            <ellipse
              cx={overlayCx + 1}
              cy={overlayCy + 10}
              rx="15"
              ry="24"
              fill={`url(#crownHighlight-${toothId})`}
              style={{ pointerEvents: 'none' }}
              className="crown-highlight"
            />
          </g>
        ) : (
          <g>
            <ellipse
              cx={overlayCx}
              cy={overlayCy}
              rx="60"
              ry="70"
              fill={`url(#crownGradient-${toothId})`}
              stroke={wholeTooth.creationStatus === 'current' ? '#3b82f6' : wholeTooth.creationStatus === 'history' ? '#6b7280' : '#22c55e'}
              strokeWidth="3"
              filter={`url(#crownShadow-${toothId})`}
              className="crown-ellipse"
              style={{ pointerEvents: 'auto' }}
              onClick={() => {
                // Handle crown click - this should trigger the crown tool
                if (onRightClick) {
                  const mockEvent = { preventDefault: () => { } };
                  onRightClick(mockEvent, toothId);
                }
              }}
            />
            <ellipse
              cx={overlayCx + 1}
              cy={overlayCy + 10}
              rx="15"
              ry="24"
              fill={`url(#crownHighlight-${toothId})`}
              style={{ pointerEvents: 'none' }}
              className="crown-highlight"
            />
          </g>
        )}
      </svg>,
      el.closest('.dental-chart-container') || document.body
    );
  }

  // Add state to control when overlays are rendered
  const [overlaysReady, setOverlaysReady] = useState(false);
  // Number of teeth to render overlays for (molars only)
  const molarIds = [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48];

  // Set overlays ready when component mounts and refs are available
  useEffect(() => {
    const allMolarsHaveRefs = molarIds.every(id => toothContainerRefs.current.has(id));
    if (allMolarsHaveRefs) {
      setOverlaysReady(true);
    }
  }, []); // Only run once on mount



  return (
    <Card
      className="p-2 h-full w-full select-none dental-chart-container"
      {...{
        onMouseDown: handleChartMouseDown,
        onMouseMove: handleChartMouseMove,
        onMouseUp: handleChartMouseUp
      }}
    >
      <div className="h-full w-full relative">
        {/* Bridge connectors layer BELOW teeth */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg
            key={bridgeConnectorKey}
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {renderBridgeConnectors()}
          </svg>
        </div>

        {/* Render all molar crown overlays above teeth */}
        {overlaysReady && (() => {
          const crownedMolars = molarIds.filter(id => {
            const el = toothContainerRefs.current.get(id);
            const type = toothTypes[id] || 'permanent';
            const fdi = type === 'primary' ? Number(id) : id;
            const status = toothData[fdi];
            return el && status?.wholeTooth && status.wholeTooth.type === 'crown';
          });
          return (
            <React.Fragment>
              {crownedMolars.map((id) => {
                const el = toothContainerRefs.current.get(id);
                const type = toothTypes[id] || 'permanent';
                const fdi = type === 'primary' ? Number(id) : id;
                const status = toothData[fdi];
                const chartContainer = el.closest('.dental-chart-container');
                if (!chartContainer) return null;
                let quadrant = 1;
                if (id >= 11 && id <= 18) quadrant = 1;
                else if (id >= 21 && id <= 28) quadrant = 2;
                else if (id >= 31 && id <= 38) quadrant = 3;
                else if (id >= 41 && id <= 48) quadrant = 4;
                // Shift Q2 and Q3 molars downward by increasing y in viewBox
                // Declare isMolar before use
                const isMolar = (id >= 16 && id <= 18) || (id >= 26 && id <= 28) || (id >= 36 && id <= 38) || (id >= 46 && id <= 48);
                let viewBox;
                if (isMolar && (id >= 26 && id <= 28)) {
                  viewBox = '65 40 100 135'; // Q2 molars (lowered)
                } else if (isMolar && (id >= 36 && id <= 38)) {
                  viewBox = '65 40 100 135'; // Q3 molars (lowered)
                } else {
                  viewBox = isMolar ? '65 50 100 135' : (quadrant === 2 || quadrant === 3 ? '35 50 100 135' : '65 50 100 135');
                }
                return (
                  <CrownOverlay
                    key={id}
                    el={el}
                    wholeTooth={status.wholeTooth}
                    toothId={id}
                    viewBox={viewBox}
                    onRightClick={handleRightClick}
                  />
                );
              })}
            </React.Fragment>
          );
        })()}



        {/* Scaling preview overlay - shows existing scaling procedures */}
        {activeTool === 'scaling' && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {Object.entries(toothData).map(([toothId, status]) => {
              const toothNumber = parseInt(toothId);
              const zones = (status as any)?.zones || {};

              // Find scaling procedures for this tooth
              const scalingZones = Object.entries(zones).filter(([zone, procedureType]) =>
                typeof procedureType === 'string' && procedureType.startsWith('scaling-')
              );

              if (scalingZones.length === 0) return null;

              // Get the container element for this tooth
              const containerEl = toothContainerRefs.current.get(toothNumber);
              if (!containerEl) return null;

              const containerRect = containerEl.getBoundingClientRect();
              const chartContainer = containerEl.closest('.dental-chart-container');
              if (!chartContainer) return null;

              const chartRect = chartContainer.getBoundingClientRect();
              const relativeX = containerRect.left - chartRect.left + containerRect.width / 2;
              const relativeY = containerRect.top - chartRect.top + containerRect.height / 2;

              // Ensure the overlay is within the chart bounds
              const overlaySize = 35; // 8 * 4 (w-8 = 32px)
              const maxX = chartRect.width - overlaySize;
              const maxY = chartRect.height - overlaySize;
              const clampedX = Math.max(0, Math.min(relativeX - overlaySize / 2, maxX));
              const clampedY = Math.max(0, Math.min(relativeY - overlaySize / 2, maxY));

              // Determine scaling code and color
              const scalingCode = (typeof scalingZones[0][1] === 'string' && scalingZones[0][1].includes('T021')) ? 'T021' : 'T022';
              const scalingColor = scalingCode === 'T021' ? '#f97316' : '#3b82f6'; // orange for T021, blue for T022

              return (
                <div
                  key={toothNumber}
                  className="absolute w-10 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                  style={{
                    left: clampedX,
                    top: clampedY,
                    backgroundColor: scalingColor,
                    zIndex: 20
                  }}
                  title={`${scalingCode} scaling on tooth ${toothNumber}`}
                >
                  <span className="text-white text-xs font-bold">{scalingCode}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Pontic overlay - shows "P" label on top of every pontic */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
          {Object.entries(toothData).map(([toothId, status]) => {
            const toothNumber = parseInt(toothId);
            const wholeTooth = (status as any)?.wholeTooth;

            // Check if this tooth is a pontic
            if (!wholeTooth || wholeTooth.role !== 'pontic') return null;

            // Get the container element for this tooth
            const containerEl = toothContainerRefs.current.get(toothNumber);
            if (!containerEl) return null;

            const containerRect = containerEl.getBoundingClientRect();
            const chartContainer = containerEl.closest('.dental-chart-container');
            if (!chartContainer) return null;

            const chartRect = chartContainer.getBoundingClientRect();
            const relativeX = containerRect.left - chartRect.left + containerRect.width / 2;
            const relativeY = containerRect.top - chartRect.top + containerRect.height / 2;

            // Ensure the overlay is within the chart bounds
            const overlaySize = 24; // Even smaller size
            const maxX = chartRect.width - overlaySize;
            const maxY = chartRect.height - overlaySize;
            const clampedX = Math.max(0, Math.min(relativeX - overlaySize / 2, maxX));
            const clampedY = Math.max(0, Math.min(relativeY - overlaySize / 2, maxY));

            return (
              <div
                key={toothNumber}
                className="absolute w-6 h-5 rounded-full border border-gray-300 bg-white/90 shadow-sm flex items-center justify-center"
                style={{
                  left: clampedX,
                  top: clampedY,
                  zIndex: 9999
                }}
                title={`Pontic on tooth ${toothNumber}`}
              >
                <span className="text-gray-700 text-xs font-medium">P</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 h-full w-full">
          {/* Upper row: 18-11 | 21-28 */}
          <div className="flex flex-col items-center w-full h-full ml-[-1rem]">
            <div className="flex justify-center gap-1 w-full h-full">
              {relevantToothIds.slice(0, 16).map((id) => {
                const type = toothTypes[id] || 'permanent';
                const displayId = type === 'primary' ? Number(id) : id;
                const fdi = displayId;
                // Determine quadrant for custom viewBox
                let quadrant = 1;
                if (id >= 11 && id <= 18) quadrant = 1;
                else if (id >= 21 && id <= 28) quadrant = 2;
                else if (id >= 61 && id <= 65) quadrant = 2;
                // Correct viewBox logic for molars
                let viewBox;
                if (id >= 26 && id <= 28) {
                  viewBox = '65 40 100 135'; // Q2 molars (lowered)
                } else if (id >= 36 && id <= 38) {
                  viewBox = '65 40 100 135'; // Q3 molars (lowered)
                } else if (id >= 16 && id <= 18) {
                  viewBox = '65 50 100 135'; // Q1 molars
                } else if (id >= 46 && id <= 48) {
                  viewBox = '65 50 100 135'; // Q4 molars
                } else if (quadrant === 2 || quadrant === 3) {
                  viewBox = '35 50 100 135';
                } else {
                  viewBox = '65 50 100 135';
                }
                const isMolar = (id >= 16 && id <= 18) || (id >= 26 && id <= 28) || (id >= 36 && id <= 38) || (id >= 46 && id <= 48);
                const hasCrown = isMolar && toothData[fdi]?.wholeTooth?.type === 'crown';
                return (
                  <div
                    key={id}
                    className="flex flex-col items-center justify-center w-24 select-none"
                    ref={(el) => {
                      if (el) {
                        toothContainerRefs.current.set(id, el);
                      } else {
                        toothContainerRefs.current.delete(id);
                      }
                    }}
                  >
                    <div className={`${type === 'primary' ? 'scale-90' : hasCrown ? 'scale-[0.85]' : 'scale-115'} flex justify-center w-full`}>
                      <Tooth
                        id={id}
                        status={toothData[fdi]}
                        onClick={handleToothClick}
                        onRightClick={handleRightClick}
                        isPrimary={type === 'primary'}
                        isDragging={isDragging}
                        activeTool={activeTool}
                        scalingToolActive={activeTool === 'scaling'}
                        viewBox={viewBox}
                        shiftPressed={isShiftPressed}
                      />
                    </div>
                    <div className="text-center text-xs text-gray-700 font-medium mt-2 ml-6 w-full">
                      {!(type === 'primary' && (
                        (id >= 16 && id <= 18) || // Upper right 6,7,8
                        (id >= 26 && id <= 28) || // Upper left 6,7,8
                        (id >= 36 && id <= 38) || // Lower left 6,7,8
                        (id >= 46 && id <= 48)    // Lower right 6,7,8
                      )) ? displayId : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Lower row: 48-41 | 31-38 */}
          <div className="flex flex-col items-center w-full h-full ml-[-1rem]">
            <div className="flex justify-center gap-1 w-full h-full">
              {[
                // Quadrant 4 (48-41)
                ...relevantToothIds.slice(24, 32).reverse(),
                // Quadrant 3 (31-38)
                ...relevantToothIds.slice(16, 24)
              ].map((id) => {
                const type = toothTypes[id] || 'permanent';
                const displayId = type === 'primary' ? Number(id) : id;
                const fdi = displayId;
                // Determine quadrant for custom viewBox
                let quadrant = 4;
                if (id >= 31 && id <= 38) quadrant = 3;
                else if (id >= 71 && id <= 75) quadrant = 3;
                // Correct viewBox logic for molars
                let viewBox;
                if (id >= 26 && id <= 28) {
                  viewBox = '65 40 100 135'; // Q2 molars (lowered)
                } else if (id >= 36 && id <= 38) {
                  viewBox = '65 40 100 135'; // Q3 molars (lowered)
                } else if (id >= 16 && id <= 18) {
                  viewBox = '65 50 100 135'; // Q1 molars
                } else if (id >= 46 && id <= 48) {
                  viewBox = '65 50 100 135'; // Q4 molars
                } else if (quadrant === 2 || quadrant === 3) {
                  viewBox = '35 50 100 135';
                } else {
                  viewBox = '65 50 100 135';
                }
                const isMolar = (id >= 16 && id <= 18) || (id >= 26 && id <= 28) || (id >= 36 && id <= 38) || (id >= 46 && id <= 48);
                const hasCrown = isMolar && toothData[fdi]?.wholeTooth?.type === 'crown';
                return (
                  <div
                    key={id}
                    className="flex flex-col items-center justify-center w-24 select-none"
                    ref={(el) => {
                      if (el) {
                        toothContainerRefs.current.set(id, el);
                      } else {
                        toothContainerRefs.current.delete(id);
                      }
                    }}
                  >
                    <div className={`${type === 'primary' ? 'scale-90' : hasCrown ? 'scale-[0.85]' : 'scale-115'} flex justify-center w-full`}>
                      <Tooth
                        id={id}
                        status={toothData[fdi]}
                        onClick={handleToothClick}
                        onRightClick={handleRightClick}
                        isPrimary={type === 'primary'}
                        isDragging={isDragging}
                        activeTool={activeTool}
                        scalingToolActive={activeTool === 'scaling'}
                        viewBox={viewBox}
                        shiftPressed={isShiftPressed}
                      />
                    </div>
                    <div className="text-center text-xs text-gray-700 font-medium mt-2 ml-6 w-full">
                      {!(type === 'primary' && (
                        (id >= 16 && id <= 18) || // Upper right 6,7,8
                        (id >= 26 && id <= 28) || // Upper left 6,7,8
                        (id >= 36 && id <= 38) || // Lower left 6,7,8
                        (id >= 46 && id <= 48)    // Lower right 6,7,8
                      )) ? displayId : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {selectedTooth && (
        <ToothModal
          tooth={selectedTooth}
          patientId={patientId}
          onClose={handleModalClose}
          onRemoveProcedure={handleRemoveProcedure}
        />
      )}
      {contextMenu && (
        <RightClickMenu
          x={contextMenu.x}
          y={contextMenu.y}
          toothId={contextMenu.toothId}
          onApplyProcedure={handleSelectTool}
          onShowHistory={handleShowHistory}
          onClose={() => setContextMenu(null)}
        />
      )}
      {activeTool && <ToolCursor icon={TOOL_ICONS[activeTool]} />}
      {activeTool === 'filling' && <FillingToolOptions />}
      {(activeTool === 'crown' || activeTool === 'bridge') && <CrownBridgeOptions />}
      {activeTool === 'extraction' && <ExtractionToolOptions />}
      {activeTool === 'sealing' && <SealingToolOptions />}
      {activeTool === 'scaling' && <ScalingToolOptions selectedCode={scalingCode} setSelectedCode={setScalingCode} patientId={patientId} currentStatus={currentStatus} onProcedureAdded={onProcedureCreated} />}


    </Card>
  );
}

function getSurfaceColor(procedureType) {
  if (!procedureType) return '#e5e7eb'; // gray-200 default

  // Handle crown object format (for bridges)
  if (typeof procedureType === 'object' && procedureType.type === 'crown') {
    const material = procedureType.material || 'porcelain';
    const role = procedureType.role;

    if (material === 'gold') {
      if (role === 'pontic') {
        return '#f59e0b'; // Bright gold for pontics
      } else {
        return '#d97706'; // Darker gold for abutments
      }
    } else {
      if (role === 'pontic') {
        return '#fcd34d'; // Bright yellow for pontics  
      } else {
        return '#eab308'; // Darker yellow for abutments
      }
    }
  }

  // Handle bridge-specific zone colors
  if (typeof procedureType === 'string') {
    if (procedureType === 'pontic') {
      return '#fcd34d'; // Bright yellow for pontics
    }
    if (procedureType === 'bridge-abutment') {
      return '#eab308'; // Darker yellow for bridge abutments
    }
  }

  // Handle filling types with material-based colors (use base colors since no gradients here)
  if (typeof procedureType === 'string' && procedureType.startsWith('filling')) {
    // Extract material from procedure type (e.g., 'filling-current-composite')
    const parts = procedureType.split('-');
    const material = parts.length >= 3 ? parts[2] : 'composite';

    const colors = {
      composite: '#dbeafe',     // light blue  
      glasionomeer: '#f3e8ff',  // light purple  
      amalgam: '#f1f5f9'        // light silver
    };

    return colors[material] || colors.composite;
  }

  // Handle scaling types with code-based colors
  if (typeof procedureType === 'string' && procedureType.startsWith('scaling')) {
    // Scaling codes should look normal - no special colors
    return '#e5e7eb'; // normal gray color
  }

  switch (procedureType) {
    case 'crown':
      return '#eab308'; // yellow (default porcelain)
    case 'extraction':
      return '#ef4444'; // red
    case 'implant':
      return '#3b82f6'; // blue
    case 'sealing':
      return '#10b981'; // green (sealant color)
    default:
      return '#d1d5db'; // gray-300
  }
}

export { getSubsurfacesForMainSurface };

