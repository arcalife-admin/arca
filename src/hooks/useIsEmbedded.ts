'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useIsEmbedded(): boolean {
  const searchParams = useSearchParams()
  const embedParam = searchParams.get('embed') === '1'
  const [isInIframe, setIsInIframe] = useState(false)

  useEffect(() => {
    setIsInIframe(window.self !== window.top)
  }, [])

  return embedParam || isInIframe
}

export function withEmbedParam(href: string): string {
  const [path, query] = href.split('?')
  const params = new URLSearchParams(query ?? '')
  params.set('embed', '1')
  return `${path}?${params.toString()}`
}

export function embeddedHref(href: string, isEmbedded: boolean): string {
  return isEmbedded ? withEmbedParam(href) : href
}

export function openEmbeddedPatient(patientId: string): void {
  if (typeof window !== 'undefined' && window.parent && window.self !== window.top) {
    window.parent.postMessage(
      { type: 'openPane', pane: 'patient', patientId },
      '*'
    )
    return
  }
  window.location.href = `/dashboard/patients/${patientId}`
}
