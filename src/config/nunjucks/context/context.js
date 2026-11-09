import path from 'node:path'
import { readFileSync } from 'node:fs'

import { config } from '#/config/config.js'
import { buildNavigation } from './build-navigation.js'
import { createLogger } from '#/server/common/helpers/logging/logger.js'
import {
  DEFAULT_LANG,
  hasMultipleLangs,
  translate
} from '#/server/common/helpers/i18n.js'

const logger = createLogger()
const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/.vite/manifest.json'
)

const googleTagManagerKey = config.get('googleAnalytics.googleTagManagerKey')
if (!googleTagManagerKey && config.get('isProduction')) {
  logger.warn('Analytics googleTagManagerKey not set')
}

let viteManifest

const languageOptions = [
  { code: 'en-GB', text: 'English' },
  { code: 'cy', text: 'Cymraeg' }
]

export function context(request) {
  if (config.get('isProduction') && !viteManifest) {
    try {
      viteManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch (error) {
      logger.error(`Vite ${path.basename(manifestPath)} not found`)
    }
  }

  const language = request?.app?.language ?? DEFAULT_LANG

  return {
    language,
    // Empty until Welsh content exists, which hides the switch link
    languageOptions: hasMultipleLangs ? languageOptions : [],
    currentLanguage: language,
    t: (key) => translate(language, key),
    assetPath: `${assetPath}/assets`,
    serviceName: config.get('serviceName'),
    serviceUrl: '/',
    cookieName: config.get('cookieConsent.name'),
    googleTagManagerKey,
    breadcrumbs: [],
    navigation: buildNavigation(request),
    getAssetPath(asset) {
      if (!config.get('isProduction')) {
        return `${assetPath}/${asset}`
      }

      const viteAssetPath = viteManifest?.[asset]?.file
      return `${assetPath}/${viteAssetPath ?? asset}`
    }
  }
}
