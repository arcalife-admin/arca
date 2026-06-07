const { defineRouting } = require('next-intl/routing')

const routing = defineRouting({
  locales: ['ro'],
  defaultLocale: 'ro',
  localePrefix: 'never',
})

module.exports = { routing }
