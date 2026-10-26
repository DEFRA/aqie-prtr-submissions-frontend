import { translate } from '#/server/common/helpers/i18n.js'
import { verifyOtp } from '../auth-service.js'
import {
  AFTER_SIGN_IN_PATH,
  EMAIL_PATH,
  getAuthSession,
  setAuthSession
} from '../auth-session.js'

const OTP_PATTERN = /^\d{6}$/

function renderOtpPage(h, lang, email, errorKey) {
  return h.view('auth/otp/index', {
    pageTitle: translate(lang, 'auth.otp.title'),
    email,
    errorText: errorKey && translate(lang, `auth.otp.errors.${errorKey}`)
  })
}

export const otpController = {
  handler(request, h) {
    const { email } = getAuthSession(request)
    if (!email) {
      return h.redirect(EMAIL_PATH)
    }
    return renderOtpPage(h, request.app.lang, email)
  }
}

export const otpSubmitController = {
  async handler(request, h) {
    const lang = request.app.lang
    const { email } = getAuthSession(request)
    if (!email) {
      return h.redirect(EMAIL_PATH)
    }

    const otp = String(request.payload?.otp ?? '').replaceAll(/\s/g, '')

    if (!otp) {
      return renderOtpPage(h, lang, email, 'required')
    }
    if (!OTP_PATTERN.test(otp)) {
      return renderOtpPage(h, lang, email, 'invalid')
    }

    const { valid } = await verifyOtp(email, otp)
    if (!valid) {
      return renderOtpPage(h, lang, email, 'incorrect')
    }

    setAuthSession(request, { email, authenticated: true })
    return h.redirect(AFTER_SIGN_IN_PATH)
  }
}
