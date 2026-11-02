import { signInPath, signOut } from './auth-session.js'

/** Ends the user's sign-in for this module only, then returns to its sign-in page. */
export const signOutController = {
  handler(request, h) {
    const { module: moduleName } = request.route.settings.app

    signOut(request, moduleName)
    return h.redirect(signInPath(moduleName))
  }
}
