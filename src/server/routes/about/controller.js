import { translate } from '#/server/common/helpers/i18n.js'

/**
 * A GDS styled example about page controller.
 * Provided as an example, remove or modify as required.
 */
export const aboutController = {
  handler(request, h) {
    const lang = request.app.lang
    const title = translate(lang, 'about.title')

    return h.view('about/index', {
      pageTitle: title,
      heading: title,
      breadcrumbs: [
        {
          text: translate(lang, 'home.title'),
          href: '/'
        },
        {
          text: title
        }
      ]
    })
  }
}
