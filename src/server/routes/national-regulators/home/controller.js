import { DEFAULT_LANG, translate } from '#/server/common/helpers/i18n.js'

const TEXT = 'national-regulators.home'

export const homeController = {
  handler(request, h) {
    const language = request.app?.language ?? DEFAULT_LANG

    return h.view('national-regulators/home/index', {
      pageTitle: translate(language, `${TEXT}.title`),
      caption: translate(language, `${TEXT}.caption`)
    })
  }
}
