import { translate } from '#/server/common/helpers/i18n.js'

/** Landing page after sign-in for the national regulator data upload module. Blank for now. */
export const uploadPollutantReleaseDataController = {
  handler(request, h) {
    const { language } = request.app
    const title = translate(
      language,
      'nrdu.upload-pollutant-release-data.title'
    )

    return h.view('nrdu/upload-pollutant-release-data/index', {
      pageTitle: title,
      heading: title,
      caption: translate(language, 'nrdu.upload-pollutant-release-data.caption')
    })
  }
}
