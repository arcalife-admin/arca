// This file marks all dashboard pages as client-side rendered
// No static optimization will be applied to dashboard pages

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

// This should disable static generation warnings for search params
export const unstable_settings = {
  // Enable suspense for search params across the site
  unstable_missingSuspenseWithCSRBailout: false
} 