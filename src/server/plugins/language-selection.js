import { DEFAULT_LANG, isSupportedLang } from '#/server/common/helpers/i18n.js'

const SESSION_KEY = 'language'

// Language comes from ?language=en-GB|cy, is remembered in the session, and defaults to English.
// Runs on onPreAuth, straight after yar loads the session, so CSRF and validation error pages use it too.
export const languageSelection = {
  plugin: {
    name: 'language-selection',
    register: (server) => {
      server.ext(
        'onPreAuth',
        (request, h) => {
          const queryLanguage = request.query?.language

          if (isSupportedLang(queryLanguage)) {
            request.yar.set(SESSION_KEY, queryLanguage)
            request.app.language = queryLanguage
          } else {
            const sessionLanguage = request.yar.get(SESSION_KEY)
            request.app.language = isSupportedLang(sessionLanguage)
              ? sessionLanguage
              : DEFAULT_LANG
          }

          return h.continue
        },
        { after: '@hapi/yar' }
      )
    }
  }
}
