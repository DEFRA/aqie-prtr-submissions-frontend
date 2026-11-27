import { DEFAULT_LANG, translate } from '#/server/common/helpers/i18n.js'

const TEXT = 'operators.missing-facility'

export const missingFacilityController = {
  handler(request, h) {
    const language = request.app?.language ?? DEFAULT_LANG

    return h.view('operators/missing-facility/index', {
      pageTitle: translate(language, `${TEXT}.title`),
      back: translate(language, `${TEXT}.back`),
      body: translate(language, `${TEXT}.body`),
      returnLink: translate(language, `${TEXT}.returnLink`),
      facilitiesPath: '/operators/facilities'
    })
  }
}
