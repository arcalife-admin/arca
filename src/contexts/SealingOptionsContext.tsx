'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SealingOptions {
  // Sealings are straightforward - no additional options needed
}

interface SealingOptionsContextType {
  options: SealingOptions;
  setOptions: (options: SealingOptions) => void;
}

const SealingOptionsContext = createContext<SealingOptionsContextType | undefined>(undefined);

export function SealingOptionsProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<SealingOptions>({
    // No options needed for sealings
  });

  return (
    <SealingOptionsContext.Provider value={{ options, setOptions }}>
      {children}
    </SealingOptionsContext.Provider>
  );
}

export function useSealingOptions() {
  const context = useContext(SealingOptionsContext);
  if (context === undefined) {
    throw new Error('useSealingOptions must be used within a SealingOptionsProvider');
  }
  return context;
} 