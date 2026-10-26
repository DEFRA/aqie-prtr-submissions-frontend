import { translate } from '#/server/common/helpers/i18n.js'

/**
 * A GDS styled example home page controller.
 * Provided as an example, remove or modify as required.
 */
export const homeController = {
  handler(request, h) {
    const title = translate(request.app.lang, 'home.title')

    return h.view('home/index', {
      pageTitle: title,
      heading: title
    })
  }
}
