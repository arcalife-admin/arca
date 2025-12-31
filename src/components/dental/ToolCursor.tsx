import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function ToolCursor({ icon }) {
  const [pos, setPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    // Set crosshair cursor globally
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `* { cursor: crosshair !important; }`;
    document.head.appendChild(styleEl);

    const handleMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);

    return () => {
      document.head.removeChild(styleEl);
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  // Render icon 10px to the bottom-right of cursor
  return createPortal(
    <div>
    </div>,
    document.body
  );
} 