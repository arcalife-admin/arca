import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'ro')) {
    locale = routing.defaultLocale
  }

  const [common, auth, dashboard, errors] = await Promise.all([
    import(`../../messages/ro/common.json`),
    import(`../../messages/ro/auth.json`),
    import(`../../messages/ro/dashboard.json`),
    import(`../../messages/ro/errors.json`),
  ])

  return {
    locale,
    messages: {
      common: common.default,
      auth: auth.default,
      dashboard: dashboard.default,
      errors: errors.default,
    },
  }
})
