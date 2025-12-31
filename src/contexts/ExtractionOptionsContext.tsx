import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ExtractionType = 'simple' | 'surgical' | 'hemisection' | 'impacted';

interface ExtractionOptions {
  type: ExtractionType;
  suturing: boolean;
  anesthesia: boolean;
  c022: boolean;
}

interface ContextValue {
  options: ExtractionOptions;
  setOptions: (opts: ExtractionOptions) => void;
}

const defaultOptions: ExtractionOptions = {
  type: 'simple',
  suturing: false,
  anesthesia: false,
  c022: false,
};

const ExtractionOptionsContext = createContext<ContextValue | undefined>(undefined);

export function ExtractionOptionsProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ExtractionOptions>(defaultOptions);
  return (
    <ExtractionOptionsContext.Provider value={{ options, setOptions }}>
      {children}
    </ExtractionOptionsContext.Provider>
  );
}

export function useExtractionOptions() {
  const ctx = useContext(ExtractionOptionsContext);
  if (!ctx) throw new Error('useExtractionOptions must be used within provider');
  return ctx;
} 