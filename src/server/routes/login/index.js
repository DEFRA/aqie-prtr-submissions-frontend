import { modules } from '#/config/modules.js'
import { emailController, emailSubmitController } from './email/controller.js'
import { otpController, otpSubmitController } from './otp/controller.js'
import { otpPath, signInPath, signOutPath } from './auth-session.js'
import { moduleEntryController } from './entry-controller.js'
import { signOutController } from './sign-out-controller.js'

/**
 * Sign-in journey (email, then one-time passcode), registered once for every module.
 * The module comes from the route settings, so the same controllers serve all of them.
 */
export const login = {
  plugin: {
    name: 'login',
    register(server) {
      server.route(
        Object.keys(modules).flatMap((moduleName) => {
          const options = { app: { module: moduleName } }
          return [
            {
              method: 'GET',
              path: `/${moduleName}`,
              options,
              ...moduleEntryController
            },
            {
              method: 'POST',
              path: signOutPath(moduleName),
              options,
              ...signOutController
            },
            {
              method: 'GET',
              path: signInPath(moduleName),
              options,
              ...emailController
            },
            {
              method: 'POST',
              path: signInPath(moduleName),
              options,
              ...emailSubmitController
            },
            {
              method: 'GET',
              path: otpPath(moduleName),
              options,
              ...otpController
            },
            {
              method: 'POST',
              path: otpPath(moduleName),
              options,
              ...otpSubmitController
            }
          ]
        })
      )
    }
  }
}
