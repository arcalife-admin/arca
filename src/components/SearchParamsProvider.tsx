'use client';

import React, { ReactNode, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface SearchParamsContextValue {
  searchParams: ReturnType<typeof useSearchParams> | null;
}

const SearchParamsContext = React.createContext<SearchParamsContextValue>({
  searchParams: null,
});

export const useSearchParamsContext = () => React.useContext(SearchParamsContext);

function SearchParamsContent({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();

  return (
    <SearchParamsContext.Provider value={{ searchParams }}>
      {children}
    </SearchParamsContext.Provider>
  );
}

export function SearchParamsProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsContent>{children}</SearchParamsContent>
    </Suspense>
  );
}

export default SearchParamsProvider; 