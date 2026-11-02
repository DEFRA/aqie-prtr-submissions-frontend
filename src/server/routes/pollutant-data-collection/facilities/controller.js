import { translate } from '#/server/common/helpers/i18n.js'

/** Landing page after sign-in for the pollutant data collection module. Blank for now. */
export const facilitiesController = {
  handler(request, h) {
    const { language } = request.app
    const title = translate(
      language,
      'pollutant-data-collection.facilities.title'
    )

    return h.view('pollutant-data-collection/facilities/index', {
      pageTitle: title,
      heading: title,
      caption: translate(
        language,
        'pollutant-data-collection.facilities.caption'
      )
    })
  }
}
