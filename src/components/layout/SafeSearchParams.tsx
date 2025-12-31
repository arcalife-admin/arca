'use client';

import React, { ReactNode, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

// Component that safely uses useSearchParams inside Suspense
function InnerContent({ children }: { children: ReactNode }) {
  // This is where we use the useSearchParams hook safely
  const searchParams = useSearchParams();
  const pathname = usePathname();

  return (
    <div data-search-params-available="true">
      {children}
    </div>
  );
}

// This wrapper ensures useSearchParams is called within a Suspense boundary
export function SafeSearchParams({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading parameters...</div>}>
      <InnerContent children={children} />
    </Suspense>
  );
}

export default SafeSearchParams; 