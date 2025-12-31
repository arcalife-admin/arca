import React, { createContext, useContext, useState, ReactNode } from 'react';

export type CrownMaterial = 'porcelain' | 'gold';

interface CrownBridgeOptions {
  material: CrownMaterial;
  retention: boolean;
  anesthesia: boolean;
  c022: boolean;
}

interface ContextValue {
  options: CrownBridgeOptions;
  setOptions: (opts: CrownBridgeOptions) => void;
}

const defaultOptions: CrownBridgeOptions = {
  material: 'porcelain',
  retention: false,
  anesthesia: false,
  c022: false,
};

const CrownBridgeOptionsContext = createContext<ContextValue | undefined>(undefined);

export function CrownBridgeOptionsProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<CrownBridgeOptions>(defaultOptions);
  return (
    <CrownBridgeOptionsContext.Provider value={{ options, setOptions }}>
      {children}
    </CrownBridgeOptionsContext.Provider>
  );
}

export function useCrownBridgeOptions() {
  const ctx = useContext(CrownBridgeOptionsContext);
  if (!ctx) throw new Error('useCrownBridgeOptions must be used within provider');
  return ctx;
} 