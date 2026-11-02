import { modules } from '#/config/modules.js'
import { isAuthenticated, signInPath } from './auth-session.js'

/** The bare module URL (for example /address-book) sends the user to sign in or straight to the module. */
export const moduleEntryController = {
  handler(request, h) {
    const { module: moduleName } = request.route.settings.app

    return h.redirect(
      isAuthenticated(request, moduleName)
        ? modules[moduleName].landingPath
        : signInPath(moduleName)
    )
  }
}
