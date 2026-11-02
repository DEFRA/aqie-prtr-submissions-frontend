import { translate } from '#/server/common/helpers/i18n.js'
import { modules } from '#/config/modules.js'
import { verifyOtp } from '../auth-service.js'
import { getAuth, otpPath, signIn, signInPath } from '../auth-session.js'
import { loginTexts } from '../text.js'

const OTP_PATTERN = /^\d{6}$/

const TEXT_KEYS = [
  'title',
  'intro',
  'delay',
  'noCodeIntro',
  'noCodeStep1',
  'noCodeStep2',
  'label',
  'notArrivedSummary',
  'notArrivedText',
  'changeEmail',
  'button'
]

function renderOtpPage(request, h, errorKey) {
  const { module: moduleName } = request.route.settings.app
  const { language } = request.app
  const text = loginTexts(language, 'otp', moduleName, TEXT_KEYS)

  return h.view('login/otp/index', {
    pageTitle: text.title,
    text,
    formAction: otpPath(moduleName),
    changeEmailHref: signInPath(moduleName),
    errorText: errorKey && translate(language, `login.otp.errors.${errorKey}`)
  })
}

export const otpController = {
  handler(request, h) {
    const { module: moduleName } = request.route.settings.app
    if (!getAuth(request, moduleName).email) {
      return h.redirect(signInPath(moduleName))
    }
    return renderOtpPage(request, h)
  }
}

export const otpSubmitController = {
  async handler(request, h) {
    const { module: moduleName } = request.route.settings.app
    const { email } = getAuth(request, moduleName)
    if (!email) {
      return h.redirect(signInPath(moduleName))
    }

    const otp = String(request.payload?.otp ?? '').replaceAll(/\s/g, '')

    if (!otp) {
      return renderOtpPage(request, h, 'required')
    }
    if (!OTP_PATTERN.test(otp)) {
      return renderOtpPage(request, h, 'invalid')
    }

    let valid
    try {
      ;({ valid } = await verifyOtp(moduleName, email, otp))
    } catch (err) {
      request.logger.error(err, 'Failed to verify OTP')
      return renderOtpPage(
        request,
        h,
        err.status === 429 ? 'tooManyAttempts' : 'verifyFailed'
      )
    }

    if (!valid) {
      return renderOtpPage(request, h, 'incorrect')
    }

    signIn(request, moduleName, email)
    return h.redirect(modules[moduleName].landingPath)
  }
}
