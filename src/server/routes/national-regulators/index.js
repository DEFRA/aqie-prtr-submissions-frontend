import { modules } from '#/config/modules.js'
import { homeController } from './home/controller.js'

const prefix = 'national-regulators'

export const nationalRegulators = {
  plugin: {
    name: prefix,
    register(server) {
      server.route([
        {
          method: 'GET',
          path: `/${prefix}`,
          handler: (request, h) => h.redirect(modules[prefix].startPath)
        },
        {
          method: 'GET',
          path: `/${prefix}/home`,
          ...homeController
        }
      ])
    }
  }
}
