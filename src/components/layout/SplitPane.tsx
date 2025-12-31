import React, { useRef, useState } from 'react';

interface SplitPaneProps {
  /**
   * Layout direction for the panes.
   * "horizontal" – side‐by‐side (default)
   * "vertical" – stacked on top of each other
   */
  direction?: 'horizontal' | 'vertical';
  /** Initial size (in px) of the first pane */
  initialPrimarySize?: number;
  /** Minimum size (in px) of the first pane */
  minPrimarySize?: number;
  /**
   * Children must be an array with exactly two React nodes – the primary and secondary pane.
   */
  children: [React.ReactNode, React.ReactNode];
}

/**
 * Simple split-pane component with draggable resizer.
 *
 * Use it like:
 * <SplitPane direction="horizontal" initialPrimarySize={300}>
 *    <LeftComponent />
 *    <RightComponent />
 * </SplitPane>
 */
const SplitPane: React.FC<SplitPaneProps> = ({
  direction = 'horizontal',
  initialPrimarySize = 300,
  minPrimarySize = 200,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [primarySize, setPrimarySize] = useState<number>(initialPrimarySize);

  const isHorizontal = direction === 'horizontal';

  // Handle mouse drag on the resizer handle
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();

    const startPos = isHorizontal ? e.clientX : e.clientY;
    const startSize = primarySize; // capture current size

    const onMouseMove = (eMove: MouseEvent) => {
      if (!containerRef.current) return;
      const delta = (isHorizontal ? eMove.clientX : eMove.clientY) - startPos;
      let newSize = startSize + delta;

      // Clamp size between minPrimarySize and containerSize - minPrimarySize
      const containerSize = isHorizontal
        ? containerRef.current.clientWidth
        : containerRef.current.clientHeight;
      const maxPrimarySize = containerSize - minPrimarySize;
      if (newSize < minPrimarySize) newSize = minPrimarySize;
      if (newSize > maxPrimarySize) newSize = maxPrimarySize;

      setPrimarySize(newSize);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={containerRef}
      className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} w-full h-full overflow-hidden`}
    >
      {/* Primary pane */}
      <div
        className="flex-shrink-0 overflow-auto"
        style={{ [isHorizontal ? 'width' : 'height']: primarySize }}
      >
        {children[0]}
      </div>

      {/* Resizer handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`${isHorizontal ? 'w-2 cursor-col-resize' : 'h-2 cursor-row-resize'} bg-gray-200 hover:bg-blue-300 transition-colors duration-150 flex-shrink-0`}
        style={{ backgroundColor: '#e5e7eb', minWidth: isHorizontal ? '8px' : 'auto', minHeight: isHorizontal ? 'auto' : '8px' }}
        title="Drag to resize"
      />

      {/* Secondary pane */}
      <div className="flex-1 overflow-auto">
        {children[1]}
      </div>
    </div>
  );
};

export default SplitPane; 