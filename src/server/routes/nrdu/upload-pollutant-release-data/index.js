import { uploadPollutantReleaseDataController } from './controller.js'

export const nrduUploadPollutantReleaseData = {
  plugin: {
    name: 'nrdu-upload-pollutant-release-data',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/nrdu/upload-pollutant-release-data',
          options: { app: { module: 'nrdu', requiresAuth: true } },
          ...uploadPollutantReleaseDataController
        }
      ])
    }
  }
}
