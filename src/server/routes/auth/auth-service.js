import { config } from '#/config/config.js'

// Placeholder for the backend auth API. Replace the bodies with real HTTP calls.
const STUB_OTP = '123456'

function assertStubAllowed() {
  if (config.get('isProduction')) {
    throw new Error('Auth API is not implemented')
  }
}

/**
 * Ask the backend to email a one-time passcode.
 * TODO: POST <backend>/auth/otp/send { email }
 */
export async function sendOtp(_email) {
  assertStubAllowed()
  return { sent: true }
}

/**
 * Ask the backend to verify a one-time passcode.
 * TODO: POST <backend>/auth/otp/verify { email, otp }
 */
export async function verifyOtp(_email, otp) {
  assertStubAllowed()
  return { valid: otp === STUB_OTP }
}
