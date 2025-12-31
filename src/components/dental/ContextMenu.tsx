import React from 'react';
import { ContextMenu } from '@/components/ui/context-menu';

interface DirectionMenuProps {
  direction: 'd->m' | 'm->d';
  onChange: (newDirection: 'd->m' | 'm->d') => void;
  children: React.ReactNode;
}

export function DirectionContextMenu({ direction, onChange, children }: DirectionMenuProps) {
  const contextMenuItems = [
    {
      label: 'Distal → Mesial',
      onClick: () => onChange('d->m'),
      disabled: false,
    },
    {
      label: 'Mesial → Distal',
      onClick: () => onChange('m->d'),
      disabled: false,
    }
  ];

  return (
    <ContextMenu contextMenuItems={contextMenuItems}>
      {children}
    </ContextMenu>
  );
}
