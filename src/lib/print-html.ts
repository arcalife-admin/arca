/**
 * Utilities for printing HTML/PDF without browser headers/footers (URL, date, title).
 * Uses hidden iframes with blob URLs and @page { margin: 0 } to suppress them in Chrome/Brave.
 */

/** Inject into document <style> blocks so printed pages omit the page URL. */
export const PRINT_NO_URL_PAGE_STYLES = `
  @page {
    margin: 0;
  }
`

export interface PrintHtmlOptions {
  /** Delay before opening the print dialog (ms). Default 150. */
  delay?: number
}

function createHiddenPrintIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden;'
  return iframe
}

/** Print HTML via a hidden iframe (no about:blank URL in the print footer). */
export function printHtmlDocument(html: string, options: PrintHtmlOptions = {}): void {
  const { delay = 150 } = options
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const blobUrl = URL.createObjectURL(blob)
  const iframe = createHiddenPrintIframe()
  iframe.src = blobUrl
  document.body.appendChild(iframe)

  const cleanup = () => {
    URL.revokeObjectURL(blobUrl)
    iframe.remove()
  }

  iframe.onload = () => {
    const printWindow = iframe.contentWindow
    if (!printWindow) {
      cleanup()
      return
    }

    printWindow.addEventListener('afterprint', cleanup, { once: true })
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      setTimeout(cleanup, 60_000)
    }, delay)
  }
}

/** Open an HTML preview in a new tab via blob URL (not about:blank). */
export function openHtmlPreview(html: string): Window | null {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const blobUrl = URL.createObjectURL(blob)
  const win = window.open(blobUrl, '_blank')
  if (!win) {
    URL.revokeObjectURL(blobUrl)
    return null
  }
  win.addEventListener('load', () => URL.revokeObjectURL(blobUrl), { once: true })
  return win
}

/** Print a PDF blob via a hidden iframe (no blob: URL in the print footer). */
export function printPdfBlob(blob: Blob, options: PrintHtmlOptions = {}): void {
  const { delay = 250 } = options
  const url = URL.createObjectURL(blob)
  const iframe = createHiddenPrintIframe()
  iframe.src = url
  document.body.appendChild(iframe)

  const cleanup = () => {
    URL.revokeObjectURL(url)
    iframe.remove()
  }

  iframe.onload = () => {
    const printWindow = iframe.contentWindow
    if (!printWindow) {
      cleanup()
      return
    }

    printWindow.addEventListener('afterprint', cleanup, { once: true })
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      setTimeout(cleanup, 60_000)
    }, delay)
  }
}
