import inert from '@hapi/inert'

import { login } from '../routes/login/index.js'
import { addressBookAboutYou } from '../routes/address-book/about-you/index.js'
import { pollutantDataCollectionFacilities } from '../routes/pollutant-data-collection/facilities/index.js'
import { nrduUploadPollutantReleaseData } from '../routes/nrdu/upload-pollutant-release-data/index.js'
import { health } from '../routes/health/index.js'
import { cookies } from '../routes/cookies/controller.js'
import { serveStaticFiles } from './serve-static-files.js'
import { config } from '#/config/config.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])
      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])
      // Cookie consent & policy page
      await server.register([cookies])

      // Sign-in pages for every module, then the landing pages shown after sign-in
      await server.register([login])
      await server.register([
        addressBookAboutYou,
        pollutantDataCollectionFacilities,
        nrduUploadPollutantReleaseData
      ])

      // Static assets
      if (!config.get('isProduction') && !config.get('isTest')) {
        await (async () => {
          const createViteServer = (await import('vite')).createServer
          const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'custom'
          })

          await server.register({
            plugin: (await import('@defra/hapi-connect')).default,
            options: {
              path: '/public',
              middleware: [vite.middlewares]
            }
          })
        })()
      } else {
        server.register(serveStaticFiles)
      }
    }
  }
}
