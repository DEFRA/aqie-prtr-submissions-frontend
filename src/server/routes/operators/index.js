import { modules } from '#/config/modules.js'
import { facilitiesController } from './facilities/controller.js'
import { missingFacilityController } from './missing-facility/controller.js'

const prefix = 'operators'

export const operators = {
  plugin: {
    name: prefix,
    register(server) {
      server.route([
        {
          method: 'GET',
          path: `/${prefix}`,
          handler: (_request, h) => h.redirect(modules[prefix].startPath)
        },
        {
          method: 'GET',
          path: `/${prefix}/facilities`,
          ...facilitiesController
        },
        {
          method: 'GET',
          path: `/${prefix}/facilities/missing`,
          ...missingFacilityController
        }
      ])
    }
  }
}
