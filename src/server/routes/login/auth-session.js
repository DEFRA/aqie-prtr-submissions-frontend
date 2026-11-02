import { LANGUAGE_SESSION_KEY } from '#/server/common/helpers/i18n.js'

const AUTH_KEY = 'auth'

export const signInPath = (moduleName) => `/${moduleName}/sign-in`
export const otpPath = (moduleName) => `/${moduleName}/sign-in/otp`
export const signOutPath = (moduleName) => `/${moduleName}/sign-out`

// Each module keeps its own state: { [moduleName]: { email, authenticated } }
export function getAuth(request, moduleName) {
  return (request.yar.get(AUTH_KEY) ?? {})[moduleName] ?? {}
}

export function setPendingEmail(request, moduleName, email) {
  const auth = request.yar.get(AUTH_KEY) ?? {}
  request.yar.set(AUTH_KEY, {
    ...auth,
    [moduleName]: { email, authenticated: false }
  })
}

export function isAuthenticated(request, moduleName) {
  return getAuth(request, moduleName).authenticated === true
}

// Ends only this module's sign-in; other modules stay signed in.
export function signOut(request, moduleName) {
  const { [moduleName]: _ended, ...others } = request.yar.get(AUTH_KEY) ?? {}
  request.yar.set(AUTH_KEY, others)
}

// Starts a fresh session so an id from before sign-in cannot be reused.
export function signIn(request, moduleName, email) {
  const auth = request.yar.get(AUTH_KEY) ?? {}
  const language = request.yar.get(LANGUAGE_SESSION_KEY)

  request.yar.reset()
  request.yar.set(AUTH_KEY, {
    ...auth,
    [moduleName]: { email, authenticated: true }
  })
  if (language) {
    request.yar.set(LANGUAGE_SESSION_KEY, language)
  }
}
