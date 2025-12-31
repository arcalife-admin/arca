import React from 'react';
import { getFillingMaterialColor, getSealingColor, getStatusOutlineColor } from './Tooth';

export interface ToothMolarSVGProps {
  zoneStatus: Record<string, string | undefined>;
  onZoneClick?: (zoneId: string) => void;
  onZoneHover?: (zoneId: string | null) => void;
  hoveredZone?: string | null;
  className?: string;
  style?: React.CSSProperties;
  viewBox?: string;
  gradientDefs?: React.ReactNode; // NEW: gradients for this tooth
  toothId: number; // NEW
  wholeTooth?: any; // NEW: for crown status
  onClick?: (id: number, surface: string) => void; // NEW: for crown clicks
  crownHovered?: boolean; // NEW: for lighting up the crown overlay on hover
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// Only show color on hover, otherwise white fill and gray outline
const OUTLINE_COLOR = '#d1d5db'; // Tailwind gray-300 (lighter)
const HOVER_COLOR = '#b3e5fc'; // Light blue for hover

export const ToothMolarSVG: React.FC<ToothMolarSVGProps> = ({
  zoneStatus,
  onZoneClick,
  onZoneHover,
  hoveredZone,
  className,
  style,
  viewBox,
  gradientDefs,
  toothId,
  wholeTooth,
  onClick,
  crownHovered,
  onMouseEnter,
  onMouseLeave,
}) => {


  // Helper for fill: use zoneStatus if present, otherwise white unless hovered
  const getFill = (zoneId: string) => {
    const procType = zoneStatus && zoneStatus[zoneId];



    if (procType) {
      if (typeof procType === 'string' && procType.startsWith('filling')) {
        const parts = procType.split('-');
        const material = parts.length >= 3 ? parts[2] : 'composite';
        const colorResult = getFillingMaterialColor(material, false, toothId);
        return typeof colorResult === 'object' && colorResult.fill
          ? colorResult.fill
          : (typeof colorResult === 'string' ? colorResult : '#fff');
      }
      if (typeof procType === 'string' && procType.startsWith('sealing')) {
        const colorResult = getSealingColor(false, toothId);
        return typeof colorResult === 'object' && colorResult.fill
          ? colorResult.fill
          : (typeof colorResult === 'string' ? colorResult : '#fff');
      }
      if (procType === 'extraction') {
        return '#ef4444'; // Red for extraction
      }
      if (procType === 'disabled') {
        return '#d1d5db'; // Gray for disabled
      }
    }
    return hoveredZone === zoneId ? HOVER_COLOR : '#fff';
  };

  // Helper to get inner border color
  const getInnerBorderColor = (zoneId: string) => {
    const color = getStatusOutlineColor(zoneStatus[zoneId], wholeTooth);
    return color === 'transparent' ? 'transparent' : color;
  };

  // Helper to create inner rectangle (2px smaller on each side)
  const createInnerRect = (x: number, y: number, width: number, height: number, zoneId: string) => {
    const borderColor = getInnerBorderColor(zoneId);
    if (borderColor === 'transparent') return null;

    return (
      <rect
        x={x + 2}
        y={y + 2}
        width={width - 4}
        height={height - 4}
        fill="none"
        stroke={borderColor}
        strokeWidth="2"
        strokeLinejoin="round"
        pointerEvents="none"
      />
    );
  };

  // Helper to create inner polygon (2px inset from each point)
  const createInnerPolygon = (points: string, zoneId: string) => {
    const borderColor = getInnerBorderColor(zoneId);
    if (borderColor === 'transparent') return null;

    // Parse points and create inner version
    const pointArray = points.split(' ').map(p => p.split(',').map(Number));
    const innerPoints = pointArray.map(([x, y]) => {
      // Calculate center of polygon
      const centerX = pointArray.reduce((sum, [px]) => sum + px, 0) / pointArray.length;
      const centerY = pointArray.reduce((sum, [, py]) => sum + py, 0) / pointArray.length;

      // Move point 2px towards center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance === 0) return [x, y];

      const insetDistance = Math.min(2, distance);
      const newX = x - (dx / distance) * insetDistance;
      const newY = y - (dy / distance) * insetDistance;

      return [newX, newY];
    });

    const innerPointsString = innerPoints.map(([x, y]) => `${x},${y}`).join(' ');

    return (
      <polygon
        points={innerPointsString}
        fill="none"
        stroke={borderColor}
        strokeWidth="2"
        strokeLinejoin="round"
        pointerEvents="none"
      />
    );
  };
  const getZoneClass = (zoneId: string) =>
    `transition-all duration-200 ${hoveredZone === zoneId ? 'ring-2 ring-blue-400 drop-shadow-md' : ''}`;
  const handleKeyDown = (e: React.KeyboardEvent, zoneId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onZoneClick?.(zoneId);
    }
  };

  // Helper: get lighter fill for crown on hover
  const getCrownHoverFill = () => {
    if (wholeTooth?.material === 'gold') return '#ffe082'; // light gold
    return '#f3f4f6'; // light porcelain
  };

  // Add helper to get quadrant
  function getQuadrant(id: number) {
    if (id >= 11 && id <= 18) return 1;
    if (id >= 21 && id <= 28) return 2;
    if (id >= 31 && id <= 38) return 3;
    if (id >= 41 && id <= 48) return 4;
    if (id >= 51 && id <= 55) return 1;
    if (id >= 61 && id <= 65) return 2;
    if (id >= 71 && id <= 75) return 3;
    if (id >= 81 && id <= 85) return 4;
    return 1;
  }
  // Determine if we need to flip the entire SVG horizontally
  const quadrant = getQuadrant(toothId);
  const flipSVG = quadrant === 2 || quadrant === 3;

  // Helper to get the correct triangle zoneId for this quadrant
  function getTriangleZoneId(originalId: string) {
    if (!flipSVG) return originalId;
    if (originalId === 'triangle-1') return 'triangle-3';
    if (originalId === 'triangle-2') return 'triangle-4';
    if (originalId === 'triangle-3') return 'triangle-1';
    if (originalId === 'triangle-4') return 'triangle-2';
    return originalId;
  }

  // Hand-drawn-accurate, tall, narrow, perfectly interlocking and symmetrical
  return (
    <div
      style={{ position: 'relative', display: 'inline-block', width: '100%', height: '100%' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Main tooth SVG below crown */}
      <svg viewBox={viewBox || '65 50 100 135'} className={className} style={{ ...style, zIndex: 50 }} {...(flipSVG ? { style: { ...style, transform: 'scale(-1,1)', transformOrigin: 'center', zIndex: 50 } } : {})}>
        {gradientDefs && <defs>{gradientDefs}</defs>}
        {/* ▬▬▬▬ OCCLUSAL SURFACE ▬▬▬▬ */}
        <g id="occlusal-group">
          {/* 4 occlusal squares — inner borders */}
          <rect id="occlusal-1" x="80" y="90" width="20" height="20"
            fill={getFill('occlusal-1')} stroke="none"
            className={getZoneClass('occlusal-1')} aria-label="Occlusal 1"
            onClick={() => onZoneClick?.('occlusal-1')}
            onMouseEnter={() => onZoneHover?.('occlusal-1')}
            onMouseLeave={() => onZoneHover?.(null)}
            onKeyDown={e => handleKeyDown(e, 'occlusal-1')}
          />
          {createInnerRect(80, 90, 20, 20, 'occlusal-1')}

          <rect id="occlusal-2" x="100" y="90" width="20" height="20"
            fill={getFill('occlusal-2')} stroke="none"
            className={getZoneClass('occlusal-2')} aria-label="Occlusal 2"
            onClick={() => onZoneClick?.('occlusal-2')}
            onMouseEnter={() => onZoneHover?.('occlusal-2')}
            onMouseLeave={() => onZoneHover?.(null)}
            onKeyDown={e => handleKeyDown(e, 'occlusal-2')}
          />
          {createInnerRect(100, 90, 20, 20, 'occlusal-2')}

          <rect id="occlusal-3" x="80" y="110" width="20" height="20"
            fill={getFill('occlusal-3')} stroke="none"
            className={getZoneClass('occlusal-3')} aria-label="Occlusal 3"
            onClick={() => onZoneClick?.('occlusal-3')}
            onMouseEnter={() => onZoneHover?.('occlusal-3')}
            onMouseLeave={() => onZoneHover?.(null)}
            onKeyDown={e => handleKeyDown(e, 'occlusal-3')}
          />
          {createInnerRect(80, 110, 20, 20, 'occlusal-3')}

          <rect id="occlusal-4" x="100" y="110" width="20" height="20"
            fill={getFill('occlusal-4')} stroke="none"
            className={getZoneClass('occlusal-4')} aria-label="Occlusal 4"
            onClick={() => onZoneClick?.('occlusal-4')}
            onMouseEnter={() => onZoneHover?.('occlusal-4')}
            onMouseLeave={() => onZoneHover?.(null)}
            onKeyDown={e => handleKeyDown(e, 'occlusal-4')}
          />
          {createInnerRect(100, 110, 20, 20, 'occlusal-4')}
        </g>

        {/* Lingual (Top) */}
        <rect id="lingual-1" x="80" y="70" width="20" height="20" fill={getFill('lingual-1')} stroke="none" className={getZoneClass('lingual-1')} aria-label="Lingual 1" onClick={() => onZoneClick?.('lingual-1')} onMouseEnter={() => onZoneHover?.('lingual-1')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'lingual-1')} />
        {createInnerRect(80, 70, 20, 20, 'lingual-1')}

        <rect id="lingual-2" x="100" y="70" width="20" height="20" fill={getFill('lingual-2')} stroke="none" className={getZoneClass('lingual-2')} aria-label="Lingual 2" onClick={() => onZoneClick?.('lingual-2')} onMouseEnter={() => onZoneHover?.('lingual-2')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'lingual-2')} />
        {createInnerRect(100, 70, 20, 20, 'lingual-2')}

        {/* Buccal (Bottom) */}
        <rect id="buccal-1" x="80" y="130" width="20" height="20" fill={getFill('buccal-1')} stroke="none" className={getZoneClass('buccal-1')} aria-label="Buccal 1" onClick={() => onZoneClick?.('buccal-1')} onMouseEnter={() => onZoneHover?.('buccal-1')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'buccal-1')} />
        {createInnerRect(80, 130, 20, 20, 'buccal-1')}

        <rect id="buccal-2" x="100" y="130" width="20" height="20" fill={getFill('buccal-2')} stroke="none" className={getZoneClass('buccal-2')} aria-label="Buccal 2" onClick={() => onZoneClick?.('buccal-2')} onMouseEnter={() => onZoneHover?.('buccal-2')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'buccal-2')} />
        {createInnerRect(100, 130, 20, 20, 'buccal-2')}

        {/* Cervical Lingual (very top) */}
        <rect id="cervical-lingual-1" x="80" y="55" width="20" height="15" fill={getFill('cervical-lingual-1')} stroke="none" className={getZoneClass('cervical-lingual-1')} aria-label="Cervical Lingual 1" onClick={() => onZoneClick?.('cervical-lingual-1')} onMouseEnter={() => onZoneHover?.('cervical-lingual-1')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'cervical-lingual-1')} />
        {createInnerRect(80, 55, 20, 15, 'cervical-lingual-1')}

        <rect id="cervical-lingual-2" x="100" y="55" width="20" height="15" fill={getFill('cervical-lingual-2')} stroke="none" className={getZoneClass('cervical-lingual-2')} aria-label="Cervical Lingual 2" onClick={() => onZoneClick?.('cervical-lingual-2')} onMouseEnter={() => onZoneHover?.('cervical-lingual-2')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'cervical-lingual-2')} />
        {createInnerRect(100, 55, 20, 15, 'cervical-lingual-2')}

        {/* Cervical Buccal (very bottom) */}
        <rect id="cervical-buccal-1" x="80" y="150" width="20" height="15" fill={getFill('cervical-buccal-1')} stroke="none" className={getZoneClass('cervical-buccal-1')} aria-label="Cervical Buccal 1" onClick={() => onZoneClick?.('cervical-buccal-1')} onMouseEnter={() => onZoneHover?.('cervical-buccal-1')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'cervical-buccal-1')} />
        {createInnerRect(80, 150, 20, 15, 'cervical-buccal-1')}

        <rect id="cervical-buccal-2" x="100" y="150" width="20" height="15" fill={getFill('cervical-buccal-2')} stroke="none" className={getZoneClass('cervical-buccal-2')} aria-label="Cervical Buccal 2" onClick={() => onZoneClick?.('cervical-buccal-2')} onMouseEnter={() => onZoneHover?.('cervical-buccal-2')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'cervical-buccal-2')} />
        {createInnerRect(100, 150, 20, 15, 'cervical-buccal-2')}

        {/* Corner Triangles (between flat and trapezoids) */}
        <g>
          <polygon id="triangle-1" points="80,55 80,90 50,70" fill={getFill('triangle-1')} stroke="none" className={getZoneClass('triangle-1')} aria-label="Triangle 1" onClick={() => onZoneClick?.('triangle-1')} onMouseEnter={() => onZoneHover?.('triangle-1')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'triangle-1')} />
          {createInnerPolygon("80,55 80,90 50,70", 'triangle-1')}

          <polygon id="triangle-2" points="150,70 120,55 120,90" fill={getFill('triangle-2')} stroke="none" className={getZoneClass('triangle-2')} aria-label="Triangle 2" onClick={() => onZoneClick?.('triangle-2')} onMouseEnter={() => onZoneHover?.('triangle-2')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'triangle-2')} />
          {createInnerPolygon("150,70 120,55 120,90", 'triangle-2')}

          <polygon id="triangle-3" points="50,150 80,130 80,165" fill={getFill('triangle-3')} stroke="none" className={getZoneClass('triangle-3')} aria-label="Triangle 3" onClick={() => onZoneClick?.('triangle-3')} onMouseEnter={() => onZoneHover?.('triangle-3')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'triangle-3')} />
          {createInnerPolygon("50,150 80,130 80,165", 'triangle-3')}

          <polygon id="triangle-4" points="150,150 120,130 120,165" fill={getFill('triangle-4')} stroke="none" className={getZoneClass('triangle-4')} aria-label="Triangle 4" onClick={() => onZoneClick?.('triangle-4')} onMouseEnter={() => onZoneHover?.('triangle-4')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'triangle-4')} />
          {createInnerPolygon("150,150 120,130 120,165", 'triangle-4')}
        </g>

        {/* Interdental Trapeziums (mesial/distal) */}
        <polygon id="interdental-mesial" points="50,70 80,90 80,130 50,150" fill={getFill('interdental-mesial')} stroke="none" className={getZoneClass('interdental-mesial')} aria-label="Interdental Mesial" onClick={() => onZoneClick?.('interdental-mesial')} onMouseEnter={() => onZoneHover?.('interdental-mesial')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'interdental-mesial')} />
        {createInnerPolygon("50,70 80,90 80,130 50,150", 'interdental-mesial')}

        <polygon id="interdental-distal" points="150,70 120,90 120,130 150,150" fill={getFill('interdental-distal')} stroke="none" className={getZoneClass('interdental-distal')} aria-label="Interdental Distal" onClick={() => onZoneClick?.('interdental-distal')} onMouseEnter={() => onZoneHover?.('interdental-distal')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'interdental-distal')} />
        {createInnerPolygon("150,70 120,90 120,130 150,150", 'interdental-distal')}

        {/* Thick outer occlusal outline */}
        <rect
          id="occlusal-outline"
          x="80" y="90" width="40" height="40"
          fill="none"
          stroke={getStatusOutlineColor(zoneStatus['occlusal-outline'], wholeTooth)}            // darker outline
          strokeWidth="0"
          strokeLinejoin="round"
          pointerEvents="none"
        />

        {/* Thick outer buccal outline */}
        <polygon id="buccal-outline" points="50,70 80,55 120,55 150,70 120,90 80,90" fill="none" stroke={getStatusOutlineColor(zoneStatus['buccal-outline'], wholeTooth)} strokeWidth="0" strokeLinejoin="round" />

        {/* Thick outer lingual outline */}
        <polygon id="lingual-outline" points="50,150 80,165 120,165 150,150 120,130 80,130" fill="none" stroke={getStatusOutlineColor(zoneStatus['lingual-outline'], wholeTooth)} strokeWidth="0" strokeLinejoin="round" />

        {/* If this is a crowned molar, make the crown lighter on hover */}
        {wholeTooth?.type === 'crown' && (
          <ellipse
            cx={100}
            cy={110}
            rx={60}
            ry={70}
            fill={crownHovered ? getCrownHoverFill() : (wholeTooth.material === 'gold' ? '#fbbf24' : '#eab308')}
            opacity={crownHovered ? 1 : 0.95}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>
    </div>

  );
};

export default ToothMolarSVG; 