import { emailController, emailSubmitController } from './email/controller.js'
import { otpController, otpSubmitController } from './otp/controller.js'
import { EMAIL_PATH, OTP_PATH } from './auth-session.js'

/**
 * Sign-in journey: email address, then one-time passcode.
 * Other journeys redirect here when the user is not authenticated.
 */
export const auth = {
  plugin: {
    name: 'auth',
    register(server) {
      server.route([
        { method: 'GET', path: EMAIL_PATH, ...emailController },
        { method: 'POST', path: EMAIL_PATH, ...emailSubmitController },
        { method: 'GET', path: OTP_PATH, ...otpController },
        { method: 'POST', path: OTP_PATH, ...otpSubmitController }
      ])
    }
  }
}
