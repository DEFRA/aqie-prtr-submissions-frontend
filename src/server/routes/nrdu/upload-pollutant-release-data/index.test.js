import { createServer } from '#/server/server.js'

const EMAIL = 'user@example.com'
const VALID_CODE = '123456'

describe('#nrdu upload page', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockImplementation(async (url, init) => {
      if (url.endsWith('/nrdu/auth/otp/send')) {
        return new Response(null, { status: 204 })
      }

      if (url.endsWith('/nrdu/auth/otp/verify')) {
        return Response.json({ valid: JSON.parse(init.body).otp === VALID_CODE })
      }

      if (url.endsWith('/nrdu/upload/initiate')) {
        return Response.json({
          uploadId: 'upload-123',
          uploadUrl: 'https://uploader.example.test/upload-and-scan/upload-123',
          statusUrl: 'https://uploader.example.test/status/upload-123',
          reference: 'ref-123'
        })
      }

      return new Response(null, { status: 404 })
    })

    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function createClient() {
    const jar = new Map()
    const cookieHeader = () =>
      [...jar].map(([name, value]) => `${name}=${value}`).join('; ')

    const remember = (response) => {
      for (const setCookie of [response.headers['set-cookie']]
        .flat()
        .filter(Boolean)) {
        const [pair] = setCookie.split(';')
        const index = pair.indexOf('=')
        jar.set(pair.slice(0, index), pair.slice(index + 1))
      }
    }

    const send = async (options) => {
      const response = await server.inject({
        ...options,
        headers: { cookie: cookieHeader() }
      })
      remember(response)
      return response
    }

    return {
      get: (url) => send({ method: 'GET', url }),
      async submit(url, payload, pageUrl = url) {
        const page = await send({ method: 'GET', url: pageUrl })
        const crumb = /name="crumb" value="([^"]+)"/.exec(page.payload)?.[1]
        return send({ method: 'POST', url, payload: { ...payload, crumb } })
      }
    }
  }

  async function signInTo(client) {
    await client.submit('/nrdu/sign-in', { email: EMAIL })
    return client.submit('/nrdu/sign-in/otp', { otp: VALID_CODE })
  }

  test('starts the uploader session and shows the upload form', async () => {
    const client = createClient()
    await signInTo(client)

    const response = await client.get('/nrdu/upload-pollutant-release-data')

    expect(response.statusCode).toBe(200)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/nrdu/upload/initiate'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(response.payload).toContain(
      'https://uploader.example.test/upload-and-scan/upload-123'
    )
    expect(response.payload).toContain('name="file"')
    expect(response.payload).toContain('enctype="multipart/form-data"')
  })
})
