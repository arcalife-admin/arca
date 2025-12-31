import React, { useState, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import clsx from 'clsx';
import { useFillingOptions } from '@/contexts/FillingOptionsContext';
import ToothMolarSVG from './ToothMolarSVG';
import ToothPremolarSVG from './ToothPremolarSVG';
import ToothCanineSVG from './ToothCanineSVG';
import ToothIncisorSVG from './ToothIncisorSVG';


// Removed old SURFACES constant - now using direct dental surface names per tooth

// Now using direct dental surface names with proper positioning per quadrant

function getQuadrant(id) {
  // Accepts both permanent and primary teeth
  const n = typeof id === 'string' ? parseInt(id, 10) : id;
  if (n >= 11 && n <= 18) return 1;
  if (n >= 21 && n <= 28) return 2;
  if (n >= 31 && n <= 38) return 3;
  if (n >= 41 && n <= 48) return 4;
  if (n >= 51 && n <= 55) return 1;
  if (n >= 61 && n <= 65) return 2;
  if (n >= 71 && n <= 75) return 3;
  if (n >= 81 && n <= 85) return 4;
  return 1; // fallback
}

// Add a feature flag for new SVG rendering
const USE_ZONE_SVG = true; // Set to false to revert to old rendering

interface ToothProps {
  id: any;
  status: any;
  onClick: any;
  onRightClick: any;
  isPrimary: any;
  isDragging: any;
  activeTool: any;
  scalingToolActive?: boolean;
  hoveredZone?: string | null;
  setHoveredZone?: Dispatch<SetStateAction<string | null>>;
  viewBox?: string;
  shiftPressed?: boolean;
}

// Helper: determine tooth type
function getToothType(id: number) {
  // Molar: 16-18, 26-28, 36-38, 46-48
  if ((id >= 16 && id <= 18) || (id >= 26 && id <= 28) || (id >= 36 && id <= 38) || (id >= 46 && id <= 48)) return 'molar';
  // Premolar: 14-15, 24-25, 34-35, 44-45
  if ((id >= 14 && id <= 15) || (id >= 24 && id <= 25) || (id >= 34 && id <= 35) || (id >= 44 && id <= 45)) return 'premolar';
  // Canine: 13, 23, 33, 43
  if (id === 13 || id === 23 || id === 33 || id === 43) return 'canine';
  // Incisor: 11-12, 21-22, 31-32, 41-42
  if ((id >= 11 && id <= 12) || (id >= 21 && id <= 22) || (id >= 31 && id <= 32) || (id >= 41 && id <= 42)) return 'incisor';

  return 'other';
}

// Helper: map zoneId to surface name for compatibility
function mapZoneToSurface(zoneId: string): string {
  if (!zoneId) return '';

  // Use the new subsurface mapping system
  if (zoneId.startsWith('occlusal')) return 'occlusal';
  if (zoneId.startsWith('lingual')) return 'lingual';
  if (zoneId.startsWith('buccal')) return 'buccal';
  if (zoneId.startsWith('cervical-buccal')) return 'buccal';
  if (zoneId.startsWith('cervical-lingual')) return 'lingual';
  if (zoneId.startsWith('interdental-mesial')) return 'mesial';
  if (zoneId.startsWith('interdental-distal')) return 'distal';

  // Handle triangles - they map to buccal or lingual based on position
  if (zoneId.startsWith('triangle')) {
    if (zoneId === 'triangle-1' || zoneId === 'triangle-2') {
      return 'lingual';
    } else if (zoneId === 'triangle-3' || zoneId === 'triangle-4') {
      return 'buccal';
    }
  }

  return zoneId;
}

// Helper to determine if all sub-surfaces of a main surface are filled
function isMainSurfaceFullyFilled(status, mainSurface) {
  // This function is no longer used with the new subsurface system
  return false;
}



// Map alternate surface keys to main SVG surface names
function mapSurfacesToMain(surfaceObj: Record<string, any>, surfaceNames: string[], id: number) {
  if (!surfaceObj) return {};
  // Determine if upper or lower arch
  const isUpper = id >= 11 && id <= 28;
  const mainNames = surfaceNames;
  const mapping: Record<string, string[]> = isUpper
    ? {
      mesial: ['mesial'],
      distal: ['distal'],
      buccal: ['buccal', 'cervical-buccal', 'triangle-3', 'triangle-4'],
      palatal: ['palatal', 'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2'],
    }
    : {
      mesial: ['mesial'],
      distal: ['distal'],
      buccal: ['buccal', 'cervical-buccal', 'triangle-3', 'triangle-4'],
      lingual: ['lingual', 'palatal', 'cervical-lingual', 'triangle-1', 'triangle-2'],
    };
  const result: Record<string, any> = {};
  for (const main of mainNames) {
    for (const alt of mapping[main] || []) {
      if (surfaceObj[alt]) {
        result[main] = surfaceObj[alt];
        break;
      }
    }
  }
  return result;
}

export function Tooth({ id, status, onClick, onRightClick, isPrimary, isDragging, activeTool, scalingToolActive = false, hoveredZone: externalHoveredZone, setHoveredZone: externalSetHoveredZone, viewBox, shiftPressed = false }: ToothProps) {
  const [lastSurface, setLastSurface] = useState(null);
  const [hoveredSurface, setHoveredSurface] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const mouseDownTimeRef = useRef(null);
  const mouseDownSurfaceRef = useRef(null);
  const lastWholeToothOperationTime = useRef(0);
  const wholeToothHandledRef = useRef(false);
  // Add state for zone hover
  // Use external hoveredZone state if provided (for modals/tooltips)
  const [hoveredZone, setHoveredZone] = typeof externalHoveredZone !== 'undefined' && typeof externalSetHoveredZone === 'function'
    ? [externalHoveredZone, externalSetHoveredZone]
    : useState<string | null>(null);

  // Helper: determine if this is a molar (for demo, 16-18, 26-28, 36-38, 46-48)
  const isMolar = (id >= 16 && id <= 18) || (id >= 26 && id <= 28) || (id >= 36 && id <= 38) || (id >= 46 && id <= 48);

  // Only render the internal crown oval for molars if there is NOT a crown (overlay will handle it)
  const shouldRenderInternalCrown = !(isMolar && status?.wholeTooth?.type === 'crown');

  // Zone click handler (calls parent with zoneId and mapped surface)
  const handleZoneClick = (zoneId: string) => {
    if (onClick) {
      // Always pass the literal zoneId as the first argument
      onClick(id, zoneId, zoneId, shiftPressed); // Pass zoneId for both zone and surface for shift-click precision
    }
  };
  // Zone hover handler
  const handleZoneHover = (zoneId: string | null) => {
    setHoveredZone(zoneId);
    // DRAG ACCUMULATION: If dragging, treat hover as a drag-add for this zone
    if (isDragging && zoneId) {
      const surface = mapZoneToSurface(zoneId);
      onClick(id, zoneId, surface, shiftPressed);
    }
  };

  // Get current filling material from context
  const fillingOptionsCtx = useFillingOptions();
  const currentMaterial = fillingOptionsCtx?.options?.material || 'composite';

  // Check if this tooth number would be invalid as a primary tooth
  const isInvalidPrimaryTooth = isPrimary && (
    (id >= 16 && id <= 18) || // Upper right 6,7,8
    (id >= 26 && id <= 28) || // Upper left 6,7,8
    (id >= 36 && id <= 38) || // Lower left 6,7,8
    (id >= 46 && id <= 48)    // Lower right 6,7,8
  );

  // Check if current tool affects the whole tooth
  const isWholeToothTool = ['crown', 'extraction', 'implant', 'primary', 'disabled'].includes(activeTool);

  // Support both legacy string and new object format for wholeTooth
  const wholeToothType = typeof status?.wholeTooth === 'string' ? status?.wholeTooth : status?.wholeTooth?.type;
  const wholeToothMaterial = status?.wholeTooth?.material || 'porcelain';
  const wholeToothRole = status?.wholeTooth?.role || 'abutment';
  const bridgeId = status?.wholeTooth?.bridgeId;
  const isPontic = wholeToothRole === 'pontic';

  // Check if tooth is disabled, invalid primary, or extracted
  const isExtracted = wholeToothType === 'extraction';
  const isDisabledOrInvalid = status?.isDisabled || isInvalidPrimaryTooth || isExtracted;





  // Check if current tool is allowed on disabled teeth
  const isAllowedTool = activeTool === 'primary' || activeTool === 'disabled' || activeTool === 'bridge' || (isExtracted && activeTool === 'extraction');

  // Use new crown colors for crowns/bridges, old logic for other procedures
  const wholeToothColor = isDisabledOrInvalid && !isExtracted ? '#d1d5db' :
    (wholeToothType === 'crown' ? null : // We'll handle crowns specially with gradients
      (wholeToothType ? getSurfaceColor(wholeToothType, false, currentMaterial, id) : null));

  // Helper function to get zone color with disabled state handling
  const getZoneColor = (zoneId: string, procType: string) => {
    if (procType === 'extraction') {
      // Extraction zones should always be red, even when disabled
      return isDisabledOrInvalid ? '#fca5a5' : '#ef4444'; // Lighter red when disabled
    }

    // Check if this specific zone is disabled
    if (procType === 'disabled') {
      return '#d1d5db'; // Gray for disabled zones
    }

    // Special handling for scaling codes - make them look normal (no color)
    if (typeof procType === 'string' && procType.startsWith('scaling')) {
      return '#fff'; // White - normal tooth appearance
    }

    // For other procedures, use normal color logic
    if (isDisabledOrInvalid) {
      return '#d1d5db'; // Gray when disabled
    }

    return getFillValue(getSurfaceColor(procType, false, currentMaterial, id));
  };

  const handleWholeToothOperation = useCallback(() => {
    if (!isWholeToothTool || (isInvalidPrimaryTooth && activeTool !== 'primary')) return;

    // Debounce whole tooth operations during drag
    const now = Date.now();
    if (isDragging && now - lastWholeToothOperationTime.current < 500) {
      return;
    }
    lastWholeToothOperationTime.current = now;

    onClick(id, 'occlusal');
  }, [isWholeToothTool, isInvalidPrimaryTooth, activeTool, isDragging, id, onClick]);

  const handleMouseDown = (surface) => {
    // Allow primary toggle tool and disable tool even for disabled teeth
    if (isDisabledOrInvalid && !isAllowedTool) return;

    mouseDownTimeRef.current = Date.now();
    mouseDownSurfaceRef.current = surface;

    // For whole-tooth tools (bridge, crown, etc.) immediately apply the operation so the first
    // tooth in a drag sequence is registered (e.g. as an abutment). This prevents scenarios
    // where the drag starts on a healthy tooth but that tooth is never added to the bridge.
    if (isWholeToothTool) {
      handleWholeToothOperation();
      wholeToothHandledRef.current = true; // Skip duplicate on mouse-up
    } else {
      wholeToothHandledRef.current = false;
    }
  };

  const handleMouseUp = (surface) => {
    if (!mouseDownTimeRef.current) return;
    // If we already handled a whole-tooth operation on mouse-down, do not trigger again
    if (wholeToothHandledRef.current) {
      mouseDownTimeRef.current = null;
      mouseDownSurfaceRef.current = null;
      wholeToothHandledRef.current = false;
      return;
    }
    // Allow primary toggle tool and disable tool even for disabled teeth
    if (isDisabledOrInvalid && !isAllowedTool) return;

    const now = Date.now();
    const duration = now - mouseDownTimeRef.current;

    // If this is a click (short duration and same surface and not dragging)
    if (duration < 200 && surface === mouseDownSurfaceRef.current && !isDragging) {
      onClick(id, surface);
    }

    mouseDownTimeRef.current = null;
    mouseDownSurfaceRef.current = null;
  };

  const handleMouseEnter = (surface) => {
    setHoveredSurface(surface);
    setIsHovered(true);

    // If we're dragging at the chart level, trigger the click
    if (isDragging) {
      // Allow primary toggle tool and disable tool even for disabled teeth
      if (isDisabledOrInvalid && !isAllowedTool) return;

      onClick(id, surface);
    }
  };

  const handleMouseLeave = (surface) => {
    setHoveredSurface(null);
    setIsHovered(false);
  };

  // Handle hover state changes
  const handleHoverChange = useCallback((hovering) => {
    setIsHovered(hovering);
  }, [id, activeTool]);

  // Reset state when dragging stops
  React.useEffect(() => {
    if (!isDragging) {
      setLastSurface(null);
      mouseDownTimeRef.current = null;
      mouseDownSurfaceRef.current = null;
    }
  }, [isDragging]);

  // Pie slice path generator for 4 segments (ovalized)
  function getPieSlicePath(cx, cy, rxOuter, ryOuter, rxInner, ryInner, startAngle, endAngle) {
    // Convert degrees to radians
    const startRad = (Math.PI / 180) * startAngle;
    const endRad = (Math.PI / 180) * endAngle;
    // Outer arc start/end
    const x1 = cx + rxOuter * Math.cos(startRad);
    const y1 = cy + ryOuter * Math.sin(startRad);
    const x2 = cx + rxOuter * Math.cos(endRad);
    const y2 = cy + ryOuter * Math.sin(endRad);
    // Inner arc start/end
    const x3 = cx + rxInner * Math.cos(endRad);
    const y3 = cy + ryInner * Math.sin(endRad);
    const x4 = cx + rxInner * Math.cos(startRad);
    const y4 = cy + ryInner * Math.sin(startRad);
    // Large arc flag
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return [
      `M ${x1} ${y1}`,
      `A ${rxOuter} ${ryOuter} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${rxInner} ${ryInner} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');
  }

  const quadrant = getQuadrant(id);

  // Determine quadrant-based flipping
  const flipY = quadrant === 1 || quadrant === 2; // Upper row: flip vertically
  const flipX = quadrant === 1 || quadrant === 4; // Left quadrants: flip horizontally

  // Helper to build transform style
  const getSvgTransform = () => {
    if (flipX && flipY) return { transform: 'scale(-1, -1)' };
    if (flipX) return { transform: 'scale(-1, 1)' };
    if (flipY) return { transform: 'scale(1, -1)' };
    return {};
  };

  // Define 4 fixed visual segments (always same positions)
  const segments = [
    { start: -45, end: 45, labelPos: [130, 53] },     // Segment 0: top
    { start: 45, end: 135, labelPos: [183, 130] },   // Segment 1: right 
    { start: 135, end: 225, labelPos: [130, 200] },  // Segment 2: bottom
    { start: 225, end: 315, labelPos: [75, 130] }    // Segment 3: left
  ];

  // Map which dental surface name is in which visual segment for each quadrant
  const surfaceMap = {
    1: ['mesial', 'palatal', 'distal', 'buccal'],    // Q1: 11-18 (upper right)
    2: ['distal', 'palatal', 'mesial', 'buccal'],    // Q2: 21-28 (upper left)
    3: ['distal', 'buccal', 'mesial', 'lingual'],    // Q3: 31-38 (lower left)
    4: ['mesial', 'buccal', 'distal', 'lingual']     // Q4: 41-48 (lower right)
  };

  // Separate mapping for labels to show correct anatomical positions
  const labelMap = {
    1: ['buccal', 'mesial', 'palatal', 'distal'],    // Q1: 11-18 (upper right)
    2: ['buccal', 'distal', 'palatal', 'mesial'],    // Q2: 21-28 (upper left)
    3: ['lingual', 'distal', 'buccal', 'mesial'],    // Q3: 31-38 (lower left)
    4: ['lingual', 'mesial', 'buccal', 'distal']     // Q4: 41-48 (lower right)
  };

  // Get the surface names for this quadrant
  const surfaceNames = surfaceMap[quadrant] || surfaceMap[1];
  const labelNames = labelMap[quadrant] || labelMap[1];

  // Make the tooth more vertically oval (taller than wide)
  const rxOuter = 36;
  const ryOuter = 48;
  const rxInner = 18;
  const ryInner = 28;
  const occlusalRx = 14;
  const occlusalRy = 22;

  const handleRightClick = (e) => {
    e.preventDefault();
    onRightClick(e, id);
  };

  // Helper function to extract fill value from getSurfaceColor return
  function getFillValue(colorResult: any): string {
    if (typeof colorResult === 'object' && colorResult.fill) {
      return colorResult.fill;
    }
    return colorResult || '#e5e7eb';
  }

  const toothType = getToothType(id);

  // Add a className for visual polish
  const svgClassName = 'transition-all duration-200 ease-in-out w-full h-full';

  // Collect all needed gradients for this tooth
  const gradients: React.ReactNode[] = [];
  const usedGradientIds = new Set<string>();
  if (status?.zones) {
    Object.entries(status.zones).forEach(([zoneId, procType]) => {
      if (typeof procType === 'string' && procType.startsWith('filling')) {
        const material = getFillingMaterial(procType, currentMaterial);
        const { gradientDef } = getFillingMaterialColor(material, false, id);
        if (gradientDef) {
          // Only add unique gradients
          const gradId = `filling-${material}-${id}`;
          if (!usedGradientIds.has(gradId)) {
            gradients.push(gradientDef);
            usedGradientIds.add(gradId);
          }
        }
      }
      if (typeof procType === 'string' && procType.startsWith('sealing')) {
        const { gradientDef } = getSealingColor(false, id);
        if (gradientDef && !usedGradientIds.has(`sealing-${id}`)) {
          gradients.push(gradientDef);
          usedGradientIds.add(`sealing-${id}`);
        }
      }
    });
  }

  const mappedSurfaces = mapSurfacesToMain(status?.zones || status?.surfaces, surfaceNames, id);

  return (
    <div
      ref={containerRef}
      onContextMenu={handleRightClick}
      className={clsx(
        "relative w-24 h-24 select-none transition-all duration-200",
        (isDisabledOrInvalid && !isAllowedTool ? "cursor-not-allowed opacity-30" : "cursor-pointer")
      )}
      onDragStart={(e) => e.preventDefault()}
      onMouseEnter={() => {
        handleHoverChange(true);
        if (isDragging && isWholeToothTool) {
          handleWholeToothOperation();
        }
      }}
      onMouseLeave={() => {
        handleHoverChange(false);
        setHoveredSurface(null);
        setHoveredZone(null);
      }}
    >
      {/* Overlay crown for molars, never clipped, always above */}
      {/* REMOVED: isMolar && status?.wholeTooth?.type === 'crown' overlay block, since external overlay is now used for molars */}
      {/* Tooltip overlay for zone name */}
      {/* Do not show tooltip for crowned molars, extracted teeth, or disabled teeth */}
      {hoveredZone && !(isMolar && status?.wholeTooth?.type === 'crown') && !isExtracted && !status?.isDisabled && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full bg-white text-xs px-2 py-1 rounded shadow border z-20 pointer-events-none select-none whitespace-nowrap">
          {hoveredZone.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </div>
      )}


      {/* New SVG for molars, premolars, and incisors with zone logic (feature flag) */}
      {USE_ZONE_SVG && (
        toothType === 'molar' ? (
          <ToothMolarSVG
            zoneStatus={status?.zones || {}}
            onZoneClick={handleZoneClick}
            onZoneHover={(zoneId) => {
              setHoveredZone(zoneId);
              if (isDragging && zoneId) handleZoneClick(zoneId);
            }}
            hoveredZone={hoveredZone}
            className={svgClassName}
            style={getSvgTransform()}
            viewBox={viewBox}
            gradientDefs={gradients}
            toothId={id}
            wholeTooth={status?.wholeTooth}
            onClick={onClick}
            crownHovered={status?.wholeTooth?.type === 'crown' && isHovered}
            onMouseEnter={status?.wholeTooth?.type === 'crown' ? () => setIsHovered(true) : undefined}
            onMouseLeave={status?.wholeTooth?.type === 'crown' ? () => setIsHovered(false) : undefined}
          />
        ) : toothType === 'premolar' ? (
          <ToothPremolarSVG
            zoneStatus={status?.zones || {}}
            onZoneClick={handleZoneClick}
            onZoneHover={(zoneId) => {
              setHoveredZone(zoneId);
              if (isDragging && zoneId) handleZoneClick(zoneId);
            }}
            hoveredZone={hoveredZone}
            className={svgClassName}
            style={getSvgTransform()}
            viewBox={viewBox}
            gradientDefs={gradients}
            toothId={id}
            wholeTooth={status?.wholeTooth}
            onClick={onClick}
          />
        ) : toothType === 'incisor' ? (
          <ToothIncisorSVG
            zoneStatus={status?.zones || {}}
            onZoneClick={handleZoneClick}
            onZoneHover={(zoneId) => {
              setHoveredZone(zoneId);
              if (isDragging && zoneId) handleZoneClick(zoneId);
            }}
            hoveredZone={hoveredZone}
            className={svgClassName}
            style={getSvgTransform()}
            viewBox={viewBox}
            gradientDefs={gradients}
            toothId={id}
            wholeTooth={status?.wholeTooth}
            onClick={onClick}
          />
        ) : toothType === 'canine' ? (
          <ToothCanineSVG
            zoneStatus={status?.zones || {}}
            onZoneClick={handleZoneClick}
            onZoneHover={(zoneId) => {
              setHoveredZone(zoneId);
              if (isDragging && zoneId) handleZoneClick(zoneId);
            }}
            hoveredZone={hoveredZone}
            className={svgClassName}
            style={getSvgTransform()}
            viewBox={viewBox}
            gradientDefs={gradients}
            toothId={id}
            wholeTooth={status?.wholeTooth}
            onClick={onClick}
          />
        ) : null
      )}
      {/* Fallback to old SVG rendering if not using new SVG or not a recognized type */}
      {(!USE_ZONE_SVG || toothType === 'other') && (
        <svg viewBox="0 0 200 240" className="w-full h-full">
          {/* Bridge session highlights removed - handled at chart level */}

          {/* GRADIENTS AND DEFS */}
          <defs>
            {/* Collect all filling gradients that need to be rendered */}
            {Object.entries(status?.surfaces || {}).map(([surface, procedureType]) => {
              if (typeof procedureType === 'string' && procedureType.startsWith('filling')) {
                const parts = procedureType.split('-');
                const material = parts.length >= 3 ? parts[2] : 'composite';
                const gradientData = getFillingMaterialColor(material, false, id);
                return gradientData.gradientDef;
              }
              return null;
            }).filter(Boolean)}

            {/* Occlusal surface gradient if it's a filling */}
            {(() => {
              const occlusalProcedure = status?.surfaces?.occlusal;
              if (typeof occlusalProcedure === 'string' && occlusalProcedure.startsWith('filling')) {
                const parts = occlusalProcedure.split('-');
                const material = parts.length >= 3 ? parts[2] : 'composite';
                const gradientData = getFillingMaterialColor(material, false, id);
                return gradientData.gradientDef;
              }
              return null;
            })()}

            {/* Occlusal surface gradient if it's a sealing */}
            {(() => {
              const occlusalProcedure = status?.surfaces?.occlusal;
              if (typeof occlusalProcedure === 'string' && occlusalProcedure.startsWith('sealing')) {
                const gradientData = getSealingColor(false, id);
                return gradientData.gradientDef;
              }
              return null;
            })()}
          </defs>

          {/* CROWN/BRIDGE RENDERING - Special 3D rendering for crowns */}
          {(wholeToothType === 'crown' && !isMolar) ? (
            // Only render internal crown for non-molars
            <>
              {/* Crown Gradients */}
              <defs>
                <radialGradient id={`crownGradient-${id}`} cx="30%" cy="30%">
                  <stop offset="0%" stopColor={getCrownColor(wholeToothMaterial, wholeToothRole).highlight} />
                  <stop offset="40%" stopColor={getCrownColor(wholeToothMaterial, wholeToothRole).primary} />
                  <stop offset="80%" stopColor={getCrownColor(wholeToothMaterial, wholeToothRole).secondary} />
                  <stop offset="100%" stopColor={getCrownColor(wholeToothMaterial, wholeToothRole).shadow} />
                </radialGradient>
                <linearGradient id={`crownHighlight-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={getCrownColor(wholeToothMaterial, wholeToothRole).highlight} stopOpacity="0.8" />
                  <stop offset="50%" stopColor={getCrownColor(wholeToothMaterial, wholeToothRole).highlight} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={getCrownColor(wholeToothMaterial, wholeToothRole).highlight} stopOpacity="0.1" />
                </linearGradient>
                <filter id={`crownShadow-${id}`}>
                  <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor={getCrownColor(wholeToothMaterial, wholeToothRole).shadow} floodOpacity="0.4" />
                </filter>
              </defs>

              {isPontic ? (
                /* PONTIC - Same as regular crown */
                <g>
                  {isPrimary ? (
                    <>
                      <circle
                        cx="100"
                        cy="140"
                        r="48"
                        fill={`url(#crownGradient-${id})`}
                        stroke={getStatusOutlineColor(wholeToothType, status?.wholeTooth, scalingToolActive)}
                        strokeWidth="3"
                        filter={`url(#crownShadow-${id})`}
                        onClick={() => onClick(id, 'occlusal')}
                        className="cursor-pointer transition-all duration-200 hover:brightness-110"
                      />
                      {/* 3D highlight for primary */}
                      <ellipse
                        cx="90"
                        cy="120"
                        rx="18"
                        ry="25"
                        fill={`url(#crownHighlight-${id})`}
                        style={{ pointerEvents: 'none' }}
                      />
                    </>
                  ) : (
                    <>
                      <ellipse
                        cx="100"
                        cy="140"
                        rx="85"
                        ry="110"
                        fill={`url(#crownGradient-${id})`}
                        stroke={getStatusOutlineColor(wholeToothType, status?.wholeTooth, scalingToolActive)}
                        strokeWidth="3"
                        filter={`url(#crownShadow-${id})`}
                        onClick={() => onClick(id, 'occlusal')}
                        className="cursor-pointer transition-all duration-200 hover:brightness-110"
                      />
                      {/* 3D highlight for permanent */}
                      <ellipse
                        cx="90"
                        cy="120"
                        rx="30"
                        ry="45"
                        fill={`url(#crownHighlight-${id})`}
                        style={{ pointerEvents: 'none' }}
                      />
                    </>
                  )}

                  {/* Crown label - material indicator */}
                  {wholeToothMaterial === 'gold' && (
                    <text
                      x="100"
                      y="225"
                      textAnchor="middle"
                      fontSize="8"
                      fill={getCrownColor(wholeToothMaterial, wholeToothRole).shadow}
                      fontWeight="bold"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      GOLD
                    </text>
                  )}
                </g>
              ) : (
                /* REGULAR CROWN - Full size, solid crown */
                <g>
                  {isPrimary ? (
                    <>
                      <circle
                        cx="100"
                        cy="140"
                        r="48"
                        fill={`url(#crownGradient-${id})`}
                        stroke={getStatusOutlineColor(wholeToothType, status?.wholeTooth, scalingToolActive)}
                        strokeWidth="3"
                        filter={`url(#crownShadow-${id})`}
                        onClick={() => onClick(id, 'occlusal')}
                        className="cursor-pointer transition-all duration-200 hover:brightness-110"
                      />
                      {/* 3D highlight for primary */}
                      <ellipse
                        cx="90"
                        cy="120"
                        rx="18"
                        ry="25"
                        fill={`url(#crownHighlight-${id})`}
                        style={{ pointerEvents: 'none' }}
                      />
                    </>
                  ) : (
                    <>
                      <ellipse
                        cx="100"
                        cy="140"
                        rx="85"
                        ry="110"
                        fill={`url(#crownGradient-${id})`}
                        stroke={getStatusOutlineColor(wholeToothType, status?.wholeTooth, scalingToolActive)}
                        strokeWidth="3"
                        filter={`url(#crownShadow-${id})`}
                        onClick={() => onClick(id, 'occlusal')}
                        className="cursor-pointer transition-all duration-200 hover:brightness-110"
                      />
                      {/* 3D highlight for permanent */}
                      <ellipse
                        cx="90"
                        cy="120"
                        rx="30"
                        ry="45"
                        fill={`url(#crownHighlight-${id})`}
                        style={{ pointerEvents: 'none' }}
                      />
                    </>
                  )}

                  {/* Crown label - material indicator */}
                  {wholeToothMaterial === 'gold' && (
                    <text
                      x="100"
                      y="225"
                      textAnchor="middle"
                      fontSize="8"
                      fill={getCrownColor(wholeToothMaterial, wholeToothRole).shadow}
                      fontWeight="bold"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      GOLD
                    </text>
                  )}

                </g>
              )}
            </>
          ) : isPrimary ? (
            // Primary tooth: segmented with 5 surfaces (occlusal, top, right, bottom, left) using a very wide, gently rounded square cross with subtle corner rounding and labels moved inward
            <>
              {/* Top petal */}
              <g>
                <path
                  d="M 55 45 Q 60 42 80 40 L 180 40 Q 200 42 205 45 L 130 125 Z"
                  fill={status?.zones?.[surfaceNames[0]] ? getZoneColor(surfaceNames[0], status.zones[surfaceNames[0]]) : (wholeToothColor || '#fff')}
                  stroke={getStatusOutlineColor(status?.zones?.[surfaceNames[0]] || null, status?.wholeTooth, scalingToolActive)}
                  strokeWidth={3}
                  onMouseEnter={() => handleMouseEnter(surfaceNames[0])}
                  onMouseLeave={() => handleMouseLeave(surfaceNames[0])}
                  onMouseDown={() => handleMouseDown(surfaceNames[0])}
                  onMouseUp={() => handleMouseUp(surfaceNames[0])}
                  className="transition-colors duration-100"
                />
              </g>
              {/* Right petal */}
              <g transform="rotate(90 130 120)">
                <path
                  d="M 55 45 Q 60 42 80 40 L 180 40 Q 200 42 205 45 L 130 125 Z"
                  fill={status?.zones?.[surfaceNames[1]] ? getZoneColor(surfaceNames[1], status.zones[surfaceNames[1]]) : (wholeToothColor || '#fff')}
                  stroke={getStatusOutlineColor(status?.zones?.[surfaceNames[1]] || null, status?.wholeTooth, scalingToolActive)}
                  strokeWidth={3}
                  onMouseEnter={() => handleMouseEnter(surfaceNames[1])}
                  onMouseLeave={() => handleMouseLeave(surfaceNames[1])}
                  onMouseDown={() => handleMouseDown(surfaceNames[1])}
                  onMouseUp={() => handleMouseUp(surfaceNames[1])}
                  className="transition-colors duration-100"
                />
              </g>
              {/* Bottom petal */}
              <g transform="rotate(180 130 120)">
                <path
                  d="M 55 45 Q 60 42 80 40 L 180 40 Q 200 42 205 45 L 130 125 Z"
                  fill={status?.zones?.[surfaceNames[2]] ? getZoneColor(surfaceNames[2], status.zones[surfaceNames[2]]) : (wholeToothColor || '#fff')}
                  stroke={getStatusOutlineColor(status?.zones?.[surfaceNames[2]] || null, status?.wholeTooth, scalingToolActive)}
                  strokeWidth={3}
                  onMouseEnter={() => handleMouseEnter(surfaceNames[2])}
                  onMouseLeave={() => handleMouseLeave(surfaceNames[2])}
                  onMouseDown={() => handleMouseDown(surfaceNames[2])}
                  onMouseUp={() => handleMouseUp(surfaceNames[2])}
                  className="transition-colors duration-100"
                />
              </g>
              {/* Left petal */}
              <g transform="rotate(270 130 120)">
                <path
                  d="M 55 45 Q 60 42 80 40 L 180 40 Q 200 42 205 45 L 130 125 Z"
                  fill={status?.zones?.[surfaceNames[3]] ? getZoneColor(surfaceNames[3], status.zones[surfaceNames[3]]) : (wholeToothColor || '#fff')}
                  stroke={getStatusOutlineColor(status?.zones?.[surfaceNames[3]] || null, status?.wholeTooth, scalingToolActive)}
                  strokeWidth={3}
                  onMouseEnter={() => handleMouseEnter(surfaceNames[3])}
                  onMouseLeave={() => handleMouseLeave(surfaceNames[3])}
                  onMouseDown={() => handleMouseDown(surfaceNames[3])}
                  onMouseUp={() => handleMouseUp(surfaceNames[3])}
                  className="transition-colors duration-100"
                />
              </g>
              {/* Central occlusal circle - clickable, always on top */}
              <circle
                cx={130}
                cy={120}
                r={38}
                fill={status?.zones?.occlusal ? getZoneColor('occlusal', status.zones.occlusal) : (wholeToothColor || '#fff')}
                stroke={getStatusOutlineColor(status?.zones?.occlusal || null, status?.wholeTooth, scalingToolActive)}
                strokeWidth={3}
                onMouseEnter={() => handleMouseEnter('occlusal')}
                onMouseLeave={() => handleMouseLeave('occlusal')}
                onMouseDown={() => handleMouseDown('occlusal')}
                onMouseUp={() => handleMouseUp('occlusal')}
                className="transition-colors duration-100"
              />
              {/* Labels for B, D, L, M, O - NON-CLICKABLE, positioned above everything */}
              <text x={130} y={70} textAnchor="middle" fontSize="26" fill="#9F4CB2" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {labelNames[0] === 'buccal' ? 'B' : labelNames[0] === 'lingual' ? 'L' : labelNames[0]?.charAt(0)?.toUpperCase()}
              </text>
              <text x={190} y={130} textAnchor="middle" fontSize="26" fill="#9F4CB2" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {labelNames[1] === 'mesial' ? 'M' : labelNames[1] === 'distal' ? 'D' : labelNames[1]?.charAt(0)?.toUpperCase()}
              </text>
              <text x={130} y={185} textAnchor="middle" fontSize="26" fill="#9F4CB2" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {labelNames[2] === 'buccal' ? 'B' : labelNames[2] === 'palatal' ? 'P' : labelNames[2]?.charAt(0)?.toUpperCase()}
              </text>
              <text x={70} y={130} textAnchor="middle" fontSize="26" fill="#9F4CB2" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {labelNames[3] === 'mesial' ? 'M' : labelNames[3] === 'distal' ? 'D' : labelNames[3]?.charAt(0)?.toUpperCase()}
              </text>
              <text x={130} y={130} textAnchor="middle" fontSize="26" fill="#9F4CB2" style={{ pointerEvents: 'none', userSelect: 'none' }}>O</text>
            </>
          ) : (
            // Permanent tooth: oval segments
            <>
              {/* Pie segments with border - clickable */}
              {segments.map((segment, index) => {
                const surfaceName = surfaceNames[index];
                const zoneStatus = status?.zones?.[surfaceName];
                return (
                  <path
                    key={surfaceName}
                    d={getPieSlicePath(130, 120, rxOuter * 2, ryOuter * 2, rxInner * 2, ryInner * 2, segment.start, segment.end)}
                    fill={zoneStatus ? getZoneColor(surfaceName, zoneStatus) : '#fff'}
                    stroke={getStatusOutlineColor(zoneStatus || null, status?.wholeTooth, scalingToolActive)}
                    strokeWidth={3}
                    onMouseEnter={() => handleMouseEnter(surfaceName)}
                    onMouseLeave={() => handleMouseLeave(surfaceName)}
                    onMouseDown={() => handleMouseDown(surfaceName)}
                    onMouseUp={() => handleMouseUp(surfaceName)}
                    className="transition-colors duration-100"
                  />
                );
              })}
              {/* Central occlusal oval - clickable */}
              <ellipse
                cx={130}
                cy={120}
                rx={occlusalRx * 2.5}
                ry={occlusalRy * 2.5}
                fill={status?.zones?.occlusal ? getZoneColor('occlusal', status.zones.occlusal) : (wholeToothColor || '#fff')}
                stroke={getStatusOutlineColor(status?.zones?.occlusal || null, status?.wholeTooth, scalingToolActive)}
                strokeWidth={3}
                onMouseEnter={() => handleMouseEnter('occlusal')}
                onMouseLeave={() => handleMouseLeave('occlusal')}
                onMouseDown={() => handleMouseDown('occlusal')}
                onMouseUp={() => handleMouseUp('occlusal')}
                className="transition-colors duration-100"
              />
              {/* Labels - NON-CLICKABLE, positioned above everything */}
              <text x={130} y={128} textAnchor="middle" fontSize="26" fill="#9F4CB2" style={{ pointerEvents: 'none', userSelect: 'none' }}>O</text>
              {segments.map((segment, index) => {
                const labelName = labelNames[index];

                const label = labelName === 'buccal' ? 'B'
                  : labelName === 'mesial' ? 'M'
                    : labelName === 'distal' ? 'D'
                      : labelName === 'lingual' ? 'L'
                        : labelName === 'palatal' ? 'P'
                          : labelName?.charAt(0)?.toUpperCase();

                return (
                  <text
                    key={labelName}
                    x={segment.labelPos[0]}
                    y={segment.labelPos[1]}
                    textAnchor="middle"
                    fontSize="26"
                    fill="#9F4CB2"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {label}
                  </text>
                );
              })}
            </>
          )}

          {/* Bridge connectors now rendered at DentalChart level */}


        </svg>
      )}
    </div>
  );
}

// Helper function to extract material from procedure type or get current material from context
function getFillingMaterial(procedureType: string, currentMaterial?: string): string {
  // If procedure type contains material info, extract it
  if (procedureType?.includes('-')) {
    const parts = procedureType.split('-');
    if (parts.length >= 2) {
      const materialPart = parts[parts.length - 1];
      if (['composite', 'glasionomeer', 'amalgam'].includes(materialPart)) {
        return materialPart;
      }
    }
  }

  // Default to current material from context or composite
  return currentMaterial || 'composite';
}

// New function to get material-based fill colors with gradients
function getFillingMaterialColor(material: string, isHovered: boolean = false, toothId: number): { fill: string, gradientDef?: React.ReactElement } {
  const gradientId = `filling-${material}-${toothId}`;

  const gradients = {
    composite: {
      gradientDef: (
        <radialGradient key={gradientId} id={gradientId} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#dbeafe" />
          <stop offset="80%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </radialGradient>
      ),
      fill: `url(#${gradientId})`
    },
    glasionomeer: {
      gradientDef: (
        <radialGradient key={gradientId} id={gradientId} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#f3e8ff" />
          <stop offset="80%" stopColor="#e9d5ff" />
          <stop offset="100%" stopColor="#d8b4fe" />
        </radialGradient>
      ),
      fill: `url(#${gradientId})`
    },
    amalgam: {
      gradientDef: (
        <radialGradient key={gradientId} id={gradientId} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#f1f5f9" />
          <stop offset="80%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>
      ),
      fill: `url(#${gradientId})`
    }
  };

  return gradients[material] || gradients.composite;
}

// New function to get sealing gradient - cute green sealant color
function getSealingColor(isHovered: boolean = false, toothId: number): { fill: string, gradientDef?: React.ReactElement } {
  const gradientId = `sealing-${toothId}`;

  return {
    gradientDef: (
      <radialGradient key={gradientId} id={gradientId} cx="30%" cy="30%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="30%" stopColor="#dcfce7" />
        <stop offset="60%" stopColor="#bbf7d0" />
        <stop offset="85%" stopColor="#86efac" />
        <stop offset="100%" stopColor="#22c55e" />
      </radialGradient>
    ),
    fill: `url(#${gradientId})`
  };
}

// New function to get status-based outline colors
export function getStatusOutlineColor(procedureType: string | null | undefined, wholeToothData?: any, scalingToolActive: boolean = false): string {
  if (!procedureType) return '#d1d5db'; // default gray outline instead of purple

  // Handle wholeTooth objects (crowns/bridges) - use their stored creationStatus
  if (wholeToothData && typeof wholeToothData === 'object' && wholeToothData.creationStatus) {
    const creationStatus = wholeToothData.creationStatus;
    if (creationStatus === 'current') {
      return '#3b82f6'; // blue for current tab
    } else if (creationStatus === 'history') {
      return '#6b7280'; // gray for history tab  
    } else if (creationStatus === 'pending') {
      return '#22c55e'; // green for pending tab
    }
  }

  if (typeof procedureType === 'string') {
    if (procedureType.includes('scaling-t021')) {
      return '#d1d5db'; // normal gray outline for scaling codes
    }
    if (procedureType.includes('scaling-t022')) {
      return '#d1d5db'; // normal gray outline for scaling codes
    }

    // Handle fillings, sealings, and extractions with status-based borders
    if (procedureType.startsWith('filling-')) {
      const parts = procedureType.split('-');
      if (parts.length >= 2) {
        const status = parts[1]; // 'current', 'history', or 'pending'
        if (status === 'current') {
          return '#3b82f6'; // blue for current tab
        } else if (status === 'history') {
          return '#6b7280'; // gray for history tab
        } else if (status === 'pending') {
          return '#22c55e'; // green for pending tab
        }
      }
    }

    if (procedureType.startsWith('sealing-')) {
      const parts = procedureType.split('-');
      if (parts.length >= 2) {
        const status = parts[1]; // 'current', 'history', or 'pending'
        if (status === 'current') {
          return '#3b82f6'; // blue for current tab
        } else if (status === 'history') {
          return '#6b7280'; // gray for history tab
        } else if (status === 'pending') {
          return '#22c55e'; // green for pending tab
        }
      }
    }

    if (procedureType === 'extraction') {
      // For extractions, we need to check the wholeTooth data for status
      if (wholeToothData && typeof wholeToothData === 'object' && wholeToothData.creationStatus) {
        const creationStatus = wholeToothData.creationStatus;
        if (creationStatus === 'current') {
          return '#3b82f6'; // blue for current tab
        } else if (creationStatus === 'history') {
          return '#6b7280'; // gray for history tab
        } else if (creationStatus === 'pending') {
          return '#22c55e'; // green for pending tab
        }
      }
      // Default for extractions without explicit status
      return '#6b7280'; // gray as default
    }

    if (procedureType.includes('inprogress') || procedureType.includes('current')) {
      return '#3b82f6'; // blue for in-progress
    } else if (procedureType.includes('completed') || procedureType.includes('history')) {
      return '#6b7280'; // gray for completed
    } else if (procedureType.includes('pending')) {
      return '#22c55e'; // green for pending
    }
  }

  return '#d1d5db'; // default gray outline instead of purple
}

// Add local getSurfaceColor function (copy from DentalChart)
function getSurfaceColor(procedureType: any, isHovered = false, currentMaterial = 'composite', toothId = 0): any {
  if (!procedureType) {
    return isHovered ? '#f3f4f6' : '#e5e7eb'; // Lighter gray on hover
  }
  // Handle crown object format (for bridges) - keep existing logic
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
  // Handle filling types with material-based gradients
  if (typeof procedureType === 'string' && procedureType.startsWith('filling')) {
    // Extract material from procedure type (e.g., 'filling-current-composite')
    const parts = procedureType.split('-');
    const material = parts.length >= 3 ? parts[2] : 'composite';
    return getFillingMaterialColor(material, isHovered, toothId);
  }
  // Handle sealing with beautiful gradient
  if (typeof procedureType === 'string' && procedureType.startsWith('sealing')) {
    return getSealingColor(isHovered, toothId);
  }

  // Keep existing colors for other procedure types
  switch (procedureType) {
    case 'crown':
      return isHovered ? '#fcd34d' : '#eab308'; // Lighter yellow on hover
    case 'extraction':
      return isHovered ? '#f87171' : '#ef4444'; // Lighter red on hover
    case 'implant':
      return isHovered ? '#60a5fa' : '#3b82f6'; // Lighter blue on hover
    default:
      return isHovered ? '#e5e7eb' : '#d1d5db'; // Lighter gray on hover
  }
}

// New function for crown/bridge material colors
function getCrownColor(material = 'porcelain', role = 'abutment') {
  const colors = {
    gold: {
      abutment: {
        primary: '#f59e0b',
        secondary: '#d97706',
        highlight: '#fbbf24',
        shadow: '#92400e'
      },
      pontic: {
        primary: '#fbbf24',
        secondary: '#f59e0b',
        highlight: '#fde047',
        shadow: '#a16207'
      }
    },
    porcelain: {
      abutment: {
        primary: '#f8fafc',
        secondary: '#e2e8f0',
        highlight: '#ffffff',
        shadow: '#94a3b8'
      },
      pontic: {
        primary: '#f1f5f9',
        secondary: '#cbd5e1',
        highlight: '#f8fafc',
        shadow: '#64748b'
      }
    }
  };

  return colors[material]?.[role] || colors.porcelain.abutment;
}

// Export these for SVG components
export { getFillingMaterialColor, getSealingColor };