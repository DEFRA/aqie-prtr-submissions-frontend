import { aboutYouController } from './controller.js'

export const addressBookAboutYou = {
  plugin: {
    name: 'address-book-about-you',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/address-book/about-you',
          options: { app: { module: 'address-book', requiresAuth: true } },
          ...aboutYouController
        }
      ])
    }
  }
}
