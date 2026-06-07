'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { embeddedHref, useIsEmbedded } from '@/hooks/useIsEmbedded'

type EmbeddedLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string
}

export default function EmbeddedLink({ href, ...props }: EmbeddedLinkProps) {
  const isEmbedded = useIsEmbedded()
  return <Link href={embeddedHref(href, isEmbedded)} {...props} />
}
