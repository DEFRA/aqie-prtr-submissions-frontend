import { config } from '#/config/config.js'
import { translate } from '#/server/common/helpers/i18n.js'
import { getAuth } from '#/server/routes/login/auth-session.js'

async function initiateUpload(request) {
  const { email } = getAuth(request, 'nrdu')
  const response = await fetch(
    `${config.get('backendApi.url')}/nrdu/upload/initiate`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        reference: crypto.randomUUID(),
        submissionId: `nrdu-${Date.now()}`,
        userId: email || 'unknown-user'
      }),
      signal: AbortSignal.timeout(config.get('backendApi.timeoutMs'))
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Backend upload initiation failed: ${text || response.status}`)
  }

  return response.json()
}

export const uploadPollutantReleaseDataController = {
  async handler(request, h) {
    const { language } = request.app
    const title = translate(
      language,
      'nrdu.upload-pollutant-release-data.title'
    )

    let uploadUrl = ''
    let uploadId = ''
    let statusUrl = ''
    let uploadError = ''

    try {
      const upload = await initiateUpload(request)
      uploadUrl = upload.uploadUrl
      uploadId = upload.uploadId
      statusUrl = upload.statusUrl
    } catch (error) {
      uploadError = error.message
    }

    return h.view('nrdu/upload-pollutant-release-data/index', {
      pageTitle: title,
      heading: title,
      caption: translate(language, 'nrdu.upload-pollutant-release-data.caption'),
      uploadUrl,
      uploadId,
      statusUrl,
      uploadError
    })
  }
}

export const uploadReceivedController = {
  handler(request, h) {
    const { language } = request.app
    const title = 'Upload received'
    const uploadId = request.query.uploadId || ''

    return h.view('nrdu/upload-pollutant-release-data/index', {
      pageTitle: title,
      heading: title,
      caption: 'Your file is being checked for viruses.',
      uploadId,
      statusPage: true,
      language
    })
  }
}

export const uploadStatusController = {
  async handler(request, h) {
    const response = await fetch(
      `${config.get('backendApi.url')}/nrdu/upload-status/${request.params.uploadId}`,
      {
        signal: AbortSignal.timeout(config.get('backendApi.timeoutMs'))
      }
    )

    if (!response.ok) {
      return h.response({ upload: { status: 'not-found' } }).code(response.status)
    }

    return h.response(await response.json())
  }
}
