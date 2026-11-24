import { DEFAULT_LANG, translate } from '#/server/common/helpers/i18n.js'

const TEXT = 'operators.facilities'

export const facilitiesController = {
  handler(request, h) {
    const language = request.app?.language ?? DEFAULT_LANG

    return h.view('operators/facilities/index', {
      pageTitle: translate(language, `${TEXT}.title`),
      caption: translate(language, `${TEXT}.caption`)
    })
  }
}
