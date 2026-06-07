const { getRequestConfig } = require('next-intl/server')
const { routing } = require('./routing.js')

module.exports = getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale
  }

  const common = require('../messages/ro/common.json')
  const auth = require('../messages/ro/auth.json')
  const dashboard = require('../messages/ro/dashboard.json')
  const errors = require('../messages/ro/errors.json')

  return {
    locale,
    messages: { common, auth, dashboard, errors },
  }
})
