export const AUTH_SESSION_KEY = 'auth'
export const EMAIL_PATH = '/sign-in'
export const OTP_PATH = '/sign-in/otp'
export const AFTER_SIGN_IN_PATH = '/'

export function getAuthSession(request) {
  return request.yar.get(AUTH_SESSION_KEY) ?? {}
}

export function setAuthSession(request, value) {
  request.yar.set(AUTH_SESSION_KEY, value)
}
