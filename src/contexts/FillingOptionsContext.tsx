import React, { createContext, useState, ReactNode, useContext } from 'react';

export type FillingMaterial = 'composite' | 'glasionomeer' | 'amalgam';

interface FillingOptions {
  material: FillingMaterial;
  anesthesia: boolean;
  c022: boolean;
}

interface FillingOptionsContextValue {
  options: FillingOptions;
  setOptions: (options: FillingOptions) => void;
}

const defaultOptions: FillingOptions = {
  material: 'composite',
  anesthesia: false,
  c022: false,
};

const FillingOptionsContext = createContext<FillingOptionsContextValue | undefined>(undefined);

export function FillingOptionsProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<FillingOptions>(defaultOptions);
  return (
    <FillingOptionsContext.Provider value={{ options, setOptions }}>
      {children}
    </FillingOptionsContext.Provider>
  );
}

export function useFillingOptions() {
  const ctx = useContext(FillingOptionsContext);
  if (!ctx) {
    throw new Error('useFillingOptions must be used within a FillingOptionsProvider');
  }
  return ctx;
}
