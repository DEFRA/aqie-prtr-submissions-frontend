import { config } from '#/config/config.js'

export class AuthApiError extends Error {
  constructor(path, status) {
    super(`Backend ${path} responded ${status}`)
    this.name = 'AuthApiError'
    this.status = status
  }
}

async function post(moduleName, endpoint, body) {
  const path = `/${moduleName}/auth/otp/${endpoint}`
  const response = await fetch(`${config.get('backendApi.url')}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.get('backendApi.timeoutMs'))
  })

  if (!response.ok) {
    throw new AuthApiError(path, response.status)
  }
  return response
}

/** Asks the backend to email a passcode. Throws AuthApiError (429 = resend cooldown). */
export async function sendOtp(moduleName, email) {
  await post(moduleName, 'send', { email })
}

/** Asks the backend to check a passcode. Resolves { valid }; throws AuthApiError (429 = locked). */
export async function verifyOtp(moduleName, email, otp) {
  const response = await post(moduleName, 'verify', { email, otp })
  return response.json()
}
