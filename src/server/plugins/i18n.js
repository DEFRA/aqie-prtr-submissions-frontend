import { DEFAULT_LANG, isSupportedLang } from '#/server/common/helpers/i18n.js'

const SESSION_KEY = 'lang'

// Language comes from ?lang=en|cy, is remembered in the session, and defaults to English.
export const i18n = {
  plugin: {
    name: 'i18n',
    register: (server) => {
      server.ext('onPreHandler', (request, h) => {
        const queryLang = request.query?.lang

        if (isSupportedLang(queryLang)) {
          request.yar?.set(SESSION_KEY, queryLang)
          request.app.lang = queryLang
        } else {
          const sessionLang = request.yar?.get(SESSION_KEY)
          request.app.lang = isSupportedLang(sessionLang)
            ? sessionLang
            : DEFAULT_LANG
        }

        return h.continue
      })
    }
  }
}
