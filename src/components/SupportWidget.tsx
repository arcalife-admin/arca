'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LifeBuoy,
  X,
  MessageCircle,
  BookOpen,
  Monitor,
  AlertCircle,
  Download,
  ChevronDown,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  buildWhatsAppUrl,
  getSupportConfig,
  isSupportEnabled,
  ANYDESK_DOWNLOAD_URL,
  SUPPORT_REMOTE_SETUP_PATH,
  type SupportConfig,
} from '@/lib/support-config'
import SupportReportDialog from '@/components/SupportReportDialog'

function useSupportConfig(): SupportConfig | null {
  const [config, setConfig] = useState<SupportConfig | null>(null)

  useEffect(() => {
    const loaded = getSupportConfig()
    setConfig(isSupportEnabled(loaded) ? loaded : null)
  }, [])

  return config
}

export default function SupportWidget() {
  const config = useSupportConfig()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  if (!config) {
    return null
  }

  const whatsAppMessage =
    `Bună — am nevoie de ajutor cu Arca Life.\n` + `Pagină: ${pathname}`

  const whatsAppUrl = config.whatsapp
    ? buildWhatsAppUrl(config.whatsapp, whatsAppMessage)
    : null

  const faqHref = config.faqUrl?.startsWith('http')
    ? config.faqUrl
    : config.faqUrl || '/dashboard/support/faq'

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Suport tehnic"
        aria-expanded={isOpen}
        className="fixed left-6 bottom-6 z-[60] w-14 h-14 bg-slate-700 hover:bg-slate-800 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <LifeBuoy className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-6 bottom-24 z-[80] w-80 max-h-[calc(100vh-8rem)] overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200"
          >
            <div className="bg-slate-700 text-white p-4 sticky top-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5" />
                  Suport
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Închide panoul de suport"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-white/80 mt-1">
                Suport tehnic
              </p>
            </div>

            <div className="p-4 space-y-4 text-sm">
              {whatsAppUrl && (
                <section>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                    WhatsApp
                  </p>
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-green-800 hover:bg-green-100 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>Trimite mesaj</span>
                  </a>
                </section>
              )}

              {(config.hoursNl || config.hoursRo) && (
                <section className="rounded-lg bg-gray-50 px-3 py-2.5 text-gray-600">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                    Program
                  </p>
                  {config.hoursNl && <p>NL: {config.hoursNl}</p>}
                  {config.hoursRo && <p>RO: {config.hoursRo}</p>}
                </section>
              )}

              <section>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  Ajutor la distanță
                </p>
                <a
                  href={ANYDESK_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-blue-800 hover:bg-blue-100 transition-colors"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Descarcă AnyDesk</span>
                </a>
                <ol className="space-y-2 text-gray-600 list-decimal list-inside">
                  <li>Deschide AnyDesk pe acest PC</li>
                  <li>Trimite ID-ul pe WhatsApp</li>
                  <li>Rămâi la calculator</li>
                </ol>
              </section>

              <Collapsible className="border-t border-gray-200 -mx-4 px-4 pt-3">
                <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 py-1 text-left text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-700 transition-colors">
                  <span>Ajutor rapid</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  {faqHref.startsWith('http') ? (
                    <a
                      href={faqHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 shrink-0 text-gray-500" />
                      <span>Întrebări frecvente</span>
                    </a>
                  ) : (
                    <Link
                      href={faqHref}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 shrink-0 text-gray-500" />
                      <span>Întrebări frecvente</span>
                    </Link>
                  )}
                  <Link
                    href={SUPPORT_REMOTE_SETUP_PATH}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <Monitor className="w-4 h-4 shrink-0 text-gray-500" />
                    <span>Ghid AnyDesk</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      setReportOpen(true)
                    }}
                    className="w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-gray-500" />
                    <span>Raportează problemă</span>
                  </button>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[75] bg-black/25"
            aria-hidden
          />
        )}
      </AnimatePresence>

      <SupportReportDialog open={reportOpen} onOpenChange={setReportOpen} />
    </>
  )
}
