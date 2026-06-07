import { useLayoutEffect, useRef, useState } from 'react'

export function useViewportSectionHeight() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [sectionHeight, setSectionHeight] = useState(0)

  useLayoutEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const measure = () => {
      setSectionHeight(el.clientHeight)
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return { scrollContainerRef, sectionHeight }
}
