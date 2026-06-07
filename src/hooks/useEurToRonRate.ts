'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_EUR_TO_RON_RATE } from '@/lib/procedure-currency';

let cachedRate: number | null = null;
let fetchPromise: Promise<number> | null = null;

async function fetchEurToRonRate(): Promise<number> {
  if (cachedRate !== null) return cachedRate;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/organization-settings')
    .then(async (response) => {
      if (!response.ok) return DEFAULT_EUR_TO_RON_RATE;
      const data = await response.json();
      const rate =
        typeof data.eurToRonRate === 'number' ? data.eurToRonRate : DEFAULT_EUR_TO_RON_RATE;
      cachedRate = rate;
      return rate;
    })
    .catch(() => DEFAULT_EUR_TO_RON_RATE)
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

export function invalidateEurToRonRateCache() {
  cachedRate = null;
}

export function useEurToRonRate(): number {
  const [rate, setRate] = useState<number>(cachedRate ?? DEFAULT_EUR_TO_RON_RATE);

  useEffect(() => {
    let cancelled = false;
    fetchEurToRonRate().then((value) => {
      if (!cancelled) setRate(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return rate;
}
