import Joi from 'joi'

import { translate } from '#/server/common/helpers/i18n.js'
import { sendOtp } from '../auth-service.js'
import { otpPath, setPendingEmail, signInPath } from '../auth-session.js'
import { loginTexts } from '../text.js'

const emailSchema = Joi.string()
  .trim()
  .max(254)
  .email({ tlds: { allow: false } })
  .required()

const TEXT_KEYS = [
  'title',
  'heading',
  'intro',
  'label',
  'hint',
  'notRecognisedSummary',
  'notRecognisedText',
  'button'
]

function renderEmailPage(request, h, { email = '', errorKey } = {}) {
  const { module: moduleName } = request.route.settings.app
  const { language } = request.app
  const text = loginTexts(language, 'email', moduleName, TEXT_KEYS)

  return h.view('login/email/index', {
    pageTitle: text.title,
    text,
    email,
    formAction: signInPath(moduleName),
    errorText: errorKey && translate(language, `login.email.errors.${errorKey}`)
  })
}

export const emailController = {
  handler: (request, h) => renderEmailPage(request, h)
}

export const emailSubmitController = {
  async handler(request, h) {
    const { module: moduleName } = request.route.settings.app
    const email = String(request.payload?.email ?? '').trim()

    if (!email) {
      return renderEmailPage(request, h, { email, errorKey: 'required' })
    }
    if (emailSchema.validate(email).error) {
      return renderEmailPage(request, h, { email, errorKey: 'invalid' })
    }

    try {
      await sendOtp(moduleName, email)
    } catch (err) {
      request.logger.error(err, 'Failed to send OTP')
      return renderEmailPage(request, h, {
        email,
        errorKey: err.status === 429 ? 'tooManyRequests' : 'sendFailed'
      })
    }

    setPendingEmail(request, moduleName, email)
    return h.redirect(otpPath(moduleName))
  }
}
