import * as Sentry from '@sentry/nextjs'
import { sentryInitOptions } from './src/lib/sentry'

Sentry.init(sentryInitOptions)
