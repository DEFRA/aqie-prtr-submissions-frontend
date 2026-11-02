import { translate } from '#/server/common/helpers/i18n.js'

/** Landing page after sign-in for the address book module. Blank for now. */
export const aboutYouController = {
  handler(request, h) {
    const { language } = request.app
    const title = translate(language, 'address-book.about-you.title')

    return h.view('address-book/about-you/index', {
      pageTitle: title,
      heading: title,
      caption: translate(language, 'address-book.about-you.caption')
    })
  }
}
