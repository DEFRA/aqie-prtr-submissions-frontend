import Joi from 'joi'

import { translate } from '#/server/common/helpers/i18n.js'
import { sendOtp } from '../auth-service.js'
import { OTP_PATH, setAuthSession } from '../auth-session.js'

const emailSchema = Joi.string()
  .trim()
  .max(254)
  .email({ tlds: { allow: false } })
  .required()

function renderEmailPage(h, lang, { email = '', errorKey } = {}) {
  const errorText = errorKey && translate(lang, `auth.email.errors.${errorKey}`)

  return h.view('auth/email/index', {
    pageTitle: translate(lang, 'auth.email.title'),
    email,
    errorText
  })
}

export const emailController = {
  handler(request, h) {
    return renderEmailPage(h, request.app.lang)
  }
}

export const emailSubmitController = {
  async handler(request, h) {
    const lang = request.app.lang
    const email = String(request.payload?.email ?? '').trim()

    if (!email) {
      return renderEmailPage(h, lang, { email, errorKey: 'required' })
    }

    const { error } = emailSchema.validate(email)
    if (error) {
      return renderEmailPage(h, lang, { email, errorKey: 'invalid' })
    }

    try {
      await sendOtp(email)
    } catch (err) {
      request.logger.error(err, 'Failed to send OTP')
      return renderEmailPage(h, lang, {
        email,
        errorKey: err.status === 429 ? 'tooManyRequests' : 'sendFailed'
      })
    }

    setAuthSession(request, { email, authenticated: false })
    return h.redirect(OTP_PATH)
  }
}
