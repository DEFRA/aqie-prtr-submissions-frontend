import {
  DEFAULT_LANG,
  LANGUAGE_SESSION_KEY,
  SUPPORTED_LANGS,
  isSupportedLang,
  languageOptionsFor
} from '#/server/common/helpers/i18n.js'
import { getModuleName, modules } from '#/config/modules.js'

const SESSION_KEY = LANGUAGE_SESSION_KEY

// Language comes from ?language=en-GB|cy, is remembered in the session, and defaults to English.
// A module only accepts the languages it supports; pages outside any module accept every available one.
// Runs on onPreAuth, straight after yar loads the session, so CSRF and validation error pages use it too.
export const languageSelection = {
  plugin: {
    name: 'language-selection',
    register: (server) => {
      server.ext(
        'onPreAuth',
        (request, h) => {
          const moduleName = getModuleName(request.path)
          const allowed = moduleName ? modules[moduleName].languages : undefined
          const accepted = (allowed ?? SUPPORTED_LANGS).filter(isSupportedLang)

          const queryLanguage = request.query?.language

          if (accepted.includes(queryLanguage)) {
            request.yar.set(SESSION_KEY, queryLanguage)
            request.app.language = queryLanguage
          } else {
            const sessionLanguage = request.yar.get(SESSION_KEY)
            request.app.language = accepted.includes(sessionLanguage)
              ? sessionLanguage
              : DEFAULT_LANG
          }
          request.app.languageOptions = languageOptionsFor(allowed)

          return h.continue
        },
        { after: '@hapi/yar' }
      )
    }
  }
}
