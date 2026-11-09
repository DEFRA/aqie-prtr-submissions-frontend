import {
  uploadPollutantReleaseDataController,
  uploadReceivedController,
  uploadStatusController
} from './controller.js'

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
        },
        {
          method: 'GET',
          path: '/nrdu/upload-received',
          options: { app: { module: 'nrdu', requiresAuth: true } },
          ...uploadReceivedController
        },
        {
          method: 'GET',
          path: '/nrdu/upload-status/{uploadId}',
          options: { app: { module: 'nrdu', requiresAuth: true } },
          ...uploadStatusController
        }
      ])
    }
  }
}
