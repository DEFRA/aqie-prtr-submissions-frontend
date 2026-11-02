import {
  isAuthenticated,
  signInPath
} from '#/server/routes/login/auth-session.js'

// Routes opt in with `options.app = { module, requiresAuth: true }`.
export const moduleAuth = {
  plugin: {
    name: 'module-auth',
    register: (server) => {
      server.ext(
        'onPostAuth',
        (request, h) => {
          const { module: moduleName, requiresAuth } =
            request.route.settings.app ?? {}

          if (requiresAuth && !isAuthenticated(request, moduleName)) {
            return h.redirect(signInPath(moduleName)).takeover()
          }
          return h.continue
        },
        { after: '@hapi/yar' }
      )
    }
  }
}
