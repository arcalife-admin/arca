import React from 'react';
import { getFillingMaterialColor, getSealingColor, getStatusOutlineColor } from './Tooth';

// Helper function to determine tooth type
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

export interface ToothCanineSVGProps {
  zoneStatus: Record<string, string | undefined>;
  onZoneClick?: (zoneId: string) => void;
  onZoneHover?: (zoneId: string | null) => void;
  hoveredZone?: string | null;
  className?: string;
  style?: React.CSSProperties;
  viewBox?: string;
  gradientDefs?: React.ReactNode;
  toothId: number;
  wholeTooth?: any; // NEW: for crown status
  onClick?: (id: number, surface: string) => void; // NEW: for crown clicks
}

const HOVER_COLOR = '#b3e5fc';

export const ToothCanineSVG: React.FC<ToothCanineSVGProps> = ({
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

  // Puzzle-like, interlocking paths (approximate, based on your image)
  return (
    <svg viewBox={viewBox || "65 50 100 135"} className={className} style={{ ...style, zIndex: 50 }}>
      {/* Gradient definitions for fillings, sealings, etc. */}
      {gradientDefs && <defs>{gradientDefs}</defs>}


      {/* Lingual square (top) */}
      <rect id="lingual" x="90" y="80" width="15" height="20" fill={getFill('lingual')} stroke="none" className={getZoneClass('lingual')} aria-label="Lingual" onClick={() => onZoneClick?.('lingual')} onMouseEnter={() => onZoneHover?.('lingual')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'lingual')} />
      {createInnerRect(90, 80, 15, 20, 'lingual')}

      {/* Buccal square (bottom) */}
      <rect id="buccal" x="90" y="120" width="15" height="20" fill={getFill('buccal')} stroke="none" className={getZoneClass('buccal')} aria-label="Buccal" onClick={() => onZoneClick?.('buccal')} onMouseEnter={() => onZoneHover?.('buccal')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'buccal')} />
      {createInnerRect(90, 120, 15, 20, 'buccal')}

      {/* Cervical zones */}
      <rect id="cervical-buccal" x="90" y="140" width="15" height="15" fill={getFill('cervical-buccal')} stroke="none" className={getZoneClass('cervical-buccal')} aria-label="Cervical Buccal" onClick={() => onZoneClick?.('cervical-buccal')} onMouseEnter={() => onZoneHover?.('cervical-buccal')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'cervical-buccal')} />
      {createInnerRect(90, 140, 15, 15, 'cervical-buccal')}

      <rect id="cervical-lingual" x="90" y="65" width="15" height="15" fill={getFill('cervical-lingual')} stroke="none" className={getZoneClass('cervical-lingual')} aria-label="Cervical Lingual" onClick={() => onZoneClick?.('cervical-lingual')} onMouseEnter={() => onZoneHover?.('cervical-lingual')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'cervical-lingual')} />
      {createInnerRect(90, 65, 15, 15, 'cervical-lingual')}

      {/* Interdental zones */}
      <polygon id="interdental-mesial" points="70,80 90,100 90,120 70,140" fill={getFill('interdental-mesial')} stroke="none" className={getZoneClass('interdental-mesial')} aria-label="Interdental Mesial" onClick={() => onZoneClick?.('interdental-mesial')} onMouseEnter={() => onZoneHover?.('interdental-mesial')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'interdental-mesial')} />
      {createInnerPolygon("70,80 90,100 90,120 70,140", 'interdental-mesial')}

      <polygon id="interdental-distal" points="125,80 105,100 105,120 125,140" fill={getFill('interdental-distal')} stroke="none" className={getZoneClass('interdental-distal')} aria-label="Interdental Distal" onClick={() => onZoneClick?.('interdental-distal')} onMouseEnter={() => onZoneHover?.('interdental-distal')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'interdental-distal')} />
      {createInnerPolygon("125,80 105,100 105,120 125,140", 'interdental-distal')}

      {/* Triangles */}
      <polygon id="triangle-1" points="70,80 90,100 90,65" fill={getFill('triangle-1')} stroke="none" className={getZoneClass('triangle-1')} aria-label="Triangle 1" onClick={() => onZoneClick?.('triangle-1')} onMouseEnter={() => onZoneHover?.('triangle-1')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'triangle-1')} />
      {createInnerPolygon("70,80 90,100 90,65", 'triangle-1')}

      <polygon id="triangle-2" points="105,65 125,80 105,100" fill={getFill('triangle-2')} stroke="none" className={getZoneClass('triangle-2')} aria-label="Triangle 2" onClick={() => onZoneClick?.('triangle-2')} onMouseEnter={() => onZoneHover?.('triangle-2')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'triangle-2')} />
      {createInnerPolygon("105,65 125,80 105,100", 'triangle-2')}

      <polygon id="triangle-3" points="70,140 90,155 90,120" fill={getFill('triangle-3')} stroke="none" className={getZoneClass('triangle-3')} aria-label="Triangle 3" onClick={() => onZoneClick?.('triangle-3')} onMouseEnter={() => onZoneHover?.('triangle-3')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'triangle-3')} />
      {createInnerPolygon("70,140 90,155 90,120", 'triangle-3')}

      <polygon id="triangle-4" points="105,155 125,140 105,120" fill={getFill('triangle-4')} stroke="none" className={getZoneClass('triangle-4')} aria-label="Triangle 4" onClick={() => onZoneClick?.('triangle-4')} onMouseEnter={() => onZoneHover?.('triangle-4')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'triangle-4')} />
      {createInnerPolygon("105,155 125,140 105,120", 'triangle-4')}

      {/* Occlusal square (center) */}
      <rect id="occlusal" x="90" y="100" width="15" height="20" fill={getFill('occlusal')} stroke={getStatusOutlineColor(zoneStatus['occlusal'], wholeTooth)} strokeWidth="0" strokeLinejoin="round" className={getZoneClass('occlusal')} aria-label="Occlusal" onClick={() => onZoneClick?.('occlusal')} onMouseEnter={() => onZoneHover?.('occlusal')} onMouseLeave={() => onZoneHover?.(null)} onKeyDown={e => handleKeyDown(e, 'occlusal')} />
      {createInnerRect(90, 100, 15, 20, 'occlusal')}

      {/* Thick outer buccal outline */}
      <polygon points="70,80 90,65 105,65 125,80 105,100 90,100" fill="none" stroke={getStatusOutlineColor(zoneStatus['buccal-outline'], wholeTooth)} strokeWidth="0" strokeLinejoin="round" />

      {/* Thick outer lingual outline */}
      <polygon id="lingual-outline" points="70,140 90,155 105,155 125,140 105,120 90,120" fill="none" stroke={getStatusOutlineColor(zoneStatus['lingual-outline'], wholeTooth)} strokeWidth="0" strokeLinejoin="round" />

      {/* CROWN OVAL RENDERING */}
      {wholeTooth?.type === 'crown' && (
        <g style={{ pointerEvents: 'auto' }}>
          {/* Crown Gradients */}
          <defs>
            <radialGradient id={`crownGradient-${toothId}`} cx="30%" cy="30%">
              <stop offset="0%" stopColor={wholeTooth.material === 'gold' ? '#fbbf24' : '#ffffff'} />
              <stop offset="40%" stopColor={wholeTooth.material === 'gold' ? '#f59e0b' : '#f8fafc'} />
              <stop offset="80%" stopColor={wholeTooth.material === 'gold' ? '#d97706' : '#e2e8f0'} />
              <stop offset="100%" stopColor={wholeTooth.material === 'gold' ? '#92400e' : '#cbd5e1'} />
            </radialGradient>
            <linearGradient id={`crownHighlight-${toothId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={wholeTooth.material === 'gold' ? '#fde047' : '#ffffff'} stopOpacity="0.8" />
              <stop offset="50%" stopColor={wholeTooth.material === 'gold' ? '#fde047' : '#ffffff'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={wholeTooth.material === 'gold' ? '#fde047' : '#ffffff'} stopOpacity="0.1" />
            </linearGradient>
            <filter id={`crownShadow-${toothId}`}>
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor={wholeTooth.material === 'gold' ? '#92400e' : '#94a3b8'} floodOpacity="0.4" />
            </filter>
            <linearGradient id="ponticGapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#fca5a5" />
            </linearGradient>
          </defs>

          {wholeTooth.role === 'pontic' ? (
            /* PONTIC - Same as regular crown */
            <g>
              <ellipse
                cx="100"
                cy="115"
                rx="40"
                ry="55"
                fill={`url(#crownGradient-${toothId})`}
                stroke={wholeTooth.creationStatus === 'current' ? '#3b82f6' : wholeTooth.creationStatus === 'history' ? '#6b7280' : '#22c55e'}
                strokeWidth="2"
                filter={`url(#crownShadow-${toothId})`}
                onClick={() => onClick?.(toothId, 'occlusal')}
                className="cursor-pointer transition-all duration-200 hover:brightness-110"
              />
              {/* 3D highlight for permanent */}
              <ellipse
                cx="105"
                cy="110"
                rx="13"
                ry="20"
                fill={`url(#crownHighlight-${toothId})`}
                style={{ pointerEvents: 'none' }}
              />
              {/* Crown label - material indicator (removed or white) */}
            </g>
          ) : (
            /* REGULAR CROWN - Full size, solid crown (unchanged) */
            <g>
              <ellipse
                cx="100"
                cy="115"
                rx="40"
                ry="55"
                fill={`url(#crownGradient-${toothId})`}
                stroke={wholeTooth.creationStatus === 'current' ? '#3b82f6' : wholeTooth.creationStatus === 'history' ? '#6b7280' : '#22c55e'}
                strokeWidth="2"
                filter={`url(#crownShadow-${toothId})`}
                onClick={() => onClick?.(toothId, 'occlusal')}
                className="cursor-pointer transition-all duration-200 hover:brightness-110"
              />
              {/* 3D highlight for permanent */}
              <ellipse
                cx="105"
                cy="110"
                rx="13"
                ry="20"
                fill={`url(#crownHighlight-${toothId})`}
                style={{ pointerEvents: 'none' }}
              />
              {/* Crown label - material indicator (removed or white) */}
            </g>
          )}
        </g>
      )}
    </svg>
  );
};

export default ToothCanineSVG;