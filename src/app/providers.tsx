'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'
import { RadioProvider } from '@/contexts/RadioContext'
import { TimerProvider } from '@/contexts/TimerContext'
import { CallProvider } from '@/contexts/CallContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { FillingOptionsProvider } from '@/contexts/FillingOptionsContext'
import { CrownBridgeOptionsProvider } from '@/contexts/CrownBridgeOptionsContext'
import { ExtractionOptionsProvider } from '@/contexts/ExtractionOptionsContext'
import { SealingOptionsProvider } from '@/contexts/SealingOptionsContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RadioProvider>
            <TimerProvider>
              <CallProvider>
                <NotificationProvider>
                  <FillingOptionsProvider>
                    <CrownBridgeOptionsProvider>
                      <ExtractionOptionsProvider>
                        <SealingOptionsProvider>
                          {children}
                        </SealingOptionsProvider>
                      </ExtractionOptionsProvider>
                    </CrownBridgeOptionsProvider>
                  </FillingOptionsProvider>
                </NotificationProvider>
              </CallProvider>
            </TimerProvider>
          </RadioProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
} 