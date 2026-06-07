import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import '../globals.css'
import { Providers } from '../providers'
import { NotificationContainer } from '@/components/ui/notification'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })
const locales = ['ro'] as const

type Props = {
  children: React.ReactNode
  params: { locale: string }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: 'Arca Life',
  description: 'Sistem de management pentru clinică',
}

export default function LocaleLayout({ children, params: { locale } }: Props) {
  if (!locales.includes(locale as 'ro')) {
    notFound()
  }

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <Providers>
          {children}
          <NotificationContainer />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
