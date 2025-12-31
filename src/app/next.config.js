// This file exports config settings that will apply to all pages in the app directory
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
export const fetchCache = 'default-no-store'

// Set search params bailout to false (no bailout)
export const unstable_settings = {
  missingSuspenseWithCSRBailout: false,
} 