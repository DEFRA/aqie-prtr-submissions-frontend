import { facilitiesController } from './controller.js'

export const pollutantDataCollectionFacilities = {
  plugin: {
    name: 'pollutant-data-collection-facilities',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/pollutant-data-collection/facilities',
          options: {
            app: { module: 'pollutant-data-collection', requiresAuth: true }
          },
          ...facilitiesController
        }
      ])
    }
  }
}
