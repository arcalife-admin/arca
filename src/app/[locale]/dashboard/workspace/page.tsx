'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie } from '@/lib/cookies';

export default function WorkspacePage() {
  const router = useRouter();

  useEffect(() => {
    // Enable workspace view and redirect to dashboard
    setCookie('workspaceViewEnabled', 'true');
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecționare către vizualizarea spațiului de lucru...</p>
      </div>
    </div>
  );
} 