import { config } from '#/config/config.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { apiMocks } from './api-mocks.js'

export class ApiError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

/**
 * Single entry point for calls to the submissions backend API.
 * Returns dummy data from api-mocks.js while `backendApi.mockEnabled` is true.
 */
export async function callApi(path, { method = 'GET', body, headers } = {}) {
  // remove this mock code when real api is there
  if (config.get('backendApi.mockEnabled')) {
    const mock = apiMocks[`${method} ${path}`]
    if (!mock) {
      throw new ApiError(
        `No mock defined for ${method} ${path}`,
        statusCodes.notImplemented
      )
    }
    return mock(body)
  }

  const response = await fetch(`${config.get('backendApi.baseUrl')}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(config.get('backendApi.timeout'))
  })

  if (!response.ok) {
    throw new ApiError(
      `Backend API ${method} ${path} failed with ${response.status}`,
      response.status
    )
  }

  return response.status === statusCodes.noContent ? null : response.json()
}

export const api = {
  get: (path, options) => callApi(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    callApi(path, { ...options, method: 'POST', body })
}
