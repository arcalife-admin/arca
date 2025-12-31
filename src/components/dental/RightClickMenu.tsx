import React from 'react';
import { PROCEDURE_TYPES } from './constants';

export function RightClickMenu({ x, y, toothId, onApplyProcedure, onShowHistory, onClose }) {
  const handleSelect = (type) => {
    onApplyProcedure(type);
    onClose();
  };

  return (
    <div
      className="absolute bg-white shadow-md border rounded-md w-48"
      style={{ top: y, left: x, zIndex: 2147483648 }}
      onMouseLeave={onClose}
    >
      <div className="p-2 border-b font-semibold text-sm text-gray-600">
        Tooth {toothId}
      </div>
      <div className="max-h-60 overflow-y-auto">
        {PROCEDURE_TYPES.map((proc) => (
          <button
            key={proc.id}
            onClick={() => handleSelect(proc.id)}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            {proc.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          onShowHistory(toothId);
          onClose();
        }}
        className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t"
      >
        View History
      </button>
    </div>
  );
} 