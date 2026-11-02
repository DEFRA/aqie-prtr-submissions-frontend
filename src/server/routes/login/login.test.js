import { createServer } from '#/server/server.js'
import { modules } from '#/config/modules.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'

const EMAIL = 'user@example.com'
const VALID_CODE = '123456'

describe('#login module', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  const mockFetch = vi.fn()

  // Stands in for the backend: any email is accepted and only 123456 verifies.
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockImplementation(async (url, init) =>
      url.endsWith('/auth/otp/send')
        ? new Response(null, { status: 204 })
        : Response.json({ valid: JSON.parse(init.body).otp === VALID_CODE })
    )
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // A browser stand-in: keeps cookies between requests and supplies the CSRF token.
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
      cookie: (name) => jar.get(name),
      get: (url) => send({ method: 'GET', url }),
      // Loads a page for its CSRF token (the form's own page unless `pageUrl` is given), then posts
      async submit(url, payload, pageUrl = url) {
        const page = await send({ method: 'GET', url: pageUrl })
        const crumb = /name="crumb" value="([^"]+)"/.exec(page.payload)?.[1]
        return send({ method: 'POST', url, payload: { ...payload, crumb } })
      }
    }
  }

  async function signInTo(client, moduleName) {
    await client.submit(`/${moduleName}/sign-in`, { email: EMAIL })
    return client.submit(`/${moduleName}/sign-in/otp`, { otp: VALID_CODE })
  }

  describe('Welsh in pollutant-data-collection', () => {
    const welsh = '/pollutant-data-collection'

    test('shows the email page in Welsh', async () => {
      const { payload } = await createClient().get(
        `${welsh}/sign-in?language=cy`
      )

      expect(payload).toContain('<html lang="cy"')
      expect(payload).toContain('Rhowch eich cyfeiriad e-bost')
      expect(payload).toContain('Mewngofnodwch i adrodd data llygryddion')
      expect(payload).toContain('Parhau')
    })

    test('shows the email error summary and message in Welsh', async () => {
      const client = createClient()
      await client.get(`${welsh}/sign-in?language=cy`)

      const response = await client.submit(`${welsh}/sign-in`, { email: '' })

      expect(response.payload).toContain('Mae problem')
      expect(response.payload).toContain('Rhowch eich cyfeiriad e-bost')
    })

    test('shows the code page in Welsh', async () => {
      const client = createClient()
      await client.get(`${welsh}/sign-in?language=cy`)
      await client.submit(`${welsh}/sign-in`, { email: EMAIL })

      const { payload } = await client.get(`${welsh}/sign-in/otp`)

      expect(payload).toContain('Gwiriwch eich e-bost am god')
      expect(payload).toContain('Rhowch y cod')
    })

    test('shows the landing page and sign-out button in Welsh', async () => {
      const client = createClient()
      await client.get(`${welsh}/sign-in?language=cy`)
      await signInTo(client, 'pollutant-data-collection')

      const { payload } = await client.get(`${welsh}/facilities`)

      expect(payload).toContain('<html lang="cy"')
      expect(payload).toContain('Cyfleusterau')
      expect(payload).toContain('Allgofnodi')
    })

    test('keeps the same pages in English when Welsh is not chosen', async () => {
      const { payload } = await createClient().get(`${welsh}/sign-in`)

      expect(payload).toContain('<html lang="en-GB"')
      expect(payload).toContain('Enter your email address')
    })
  })

  describe('sign out', () => {
    test('shows a sign-out button on the landing page of the signed-in module', async () => {
      const client = createClient()
      await signInTo(client, 'address-book')

      const { payload } = await client.get(modules['address-book'].landingPath)

      expect(payload).toContain('action="/address-book/sign-out"')
      expect(payload).toContain('Sign out')
    })

    test('shows no sign-out button when not signed in', async () => {
      const { payload } = await createClient().get('/address-book/sign-in')

      expect(payload).not.toContain('sign-out')
    })

    test('shows no sign-out button for a module the user is not signed in to', async () => {
      const client = createClient()
      await signInTo(client, 'address-book')

      const { payload } = await client.get('/nrdu/sign-in')

      expect(payload).not.toContain('/nrdu/sign-out')
    })

    test('ends the sign-in and returns to the sign-in page', async () => {
      const client = createClient()
      await signInTo(client, 'address-book')

      const response = await client.submit(
        '/address-book/sign-out',
        {},
        modules['address-book'].landingPath
      )

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/address-book/sign-in')

      const landing = await client.get(modules['address-book'].landingPath)
      expect(landing.statusCode).toBe(302)
      expect(landing.headers.location).toBe('/address-book/sign-in')
    })

    test('leaves other modules signed in', async () => {
      const client = createClient()
      await signInTo(client, 'address-book')
      await signInTo(client, 'nrdu')

      await client.submit(
        '/address-book/sign-out',
        {},
        modules['address-book'].landingPath
      )

      expect((await client.get(modules.nrdu.landingPath)).statusCode).toBe(
        statusCodes.ok
      )
    })

    test('needs the CSRF token', async () => {
      const client = createClient()
      await signInTo(client, 'address-book')

      const response = await server.inject({
        method: 'POST',
        url: '/address-book/sign-out'
      })

      expect(response.statusCode).toBe(statusCodes.forbidden)
    })
  })

  describe.each(Object.entries(modules))('%s', (moduleName, settings) => {
    test('renders the email page with its own text', async () => {
      const { statusCode, payload } = await createClient().get(
        `/${moduleName}/sign-in`
      )

      expect(statusCode).toBe(statusCodes.ok)
      expect(payload).toContain('Enter your email address')
      expect(payload).toContain(`action="/${moduleName}/sign-in"`)
    })

    test('sends the email to the backend for this module and moves to the code page', async () => {
      const client = createClient()

      const response = await client.submit(`/${moduleName}/sign-in`, {
        email: EMAIL
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(`/${moduleName}/sign-in/otp`)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`/${moduleName}/auth/otp/send$`)),
        expect.objectContaining({ body: JSON.stringify({ email: EMAIL }) })
      )
    })

    test('lands on the module page after the correct code', async () => {
      const client = createClient()

      const response = await signInTo(client, moduleName)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(settings.landingPath)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`/${moduleName}/auth/otp/verify$`)),
        expect.anything()
      )
      expect((await client.get(settings.landingPath)).statusCode).toBe(
        statusCodes.ok
      )
    })

    test('redirects the landing page to sign-in when not signed in', async () => {
      const response = await createClient().get(settings.landingPath)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(`/${moduleName}/sign-in`)
    })

    test('keeps the user on the code page after a wrong code', async () => {
      const client = createClient()
      await client.submit(`/${moduleName}/sign-in`, { email: EMAIL })

      const response = await client.submit(`/${moduleName}/sign-in/otp`, {
        otp: '000000'
      })

      expect(response.statusCode).toBe(statusCodes.ok)
      expect(response.payload).toContain('not correct')
    })

    test('sends the bare module URL to sign-in when not signed in', async () => {
      const response = await createClient().get(`/${moduleName}`)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(`/${moduleName}/sign-in`)
    })

    test('sends the bare module URL to the landing page when signed in', async () => {
      const client = createClient()
      await signInTo(client, moduleName)

      const response = await client.get(`/${moduleName}`)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(settings.landingPath)
    })

    test('redirects the code page to sign-in when no email was entered', async () => {
      const response = await createClient().get(`/${moduleName}/sign-in/otp`)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(`/${moduleName}/sign-in`)
    })
  })

  test('signing in to one module does not sign in to another', async () => {
    const client = createClient()
    await signInTo(client, 'address-book')

    const other = await client.get(modules.nrdu.landingPath)

    expect(other.statusCode).toBe(302)
    expect(other.headers.location).toBe('/nrdu/sign-in')
  })

  test('a user can be signed in to two modules at once', async () => {
    const client = createClient()
    await signInTo(client, 'address-book')
    await signInTo(client, 'nrdu')

    expect(
      (await client.get(modules['address-book'].landingPath)).statusCode
    ).toBe(statusCodes.ok)
    expect((await client.get(modules.nrdu.landingPath)).statusCode).toBe(
      statusCodes.ok
    )
  })

  test('starts a new session when the user signs in', async () => {
    const client = createClient()
    await client.submit('/nrdu/sign-in', { email: EMAIL })
    const before = client.cookie('session')

    await client.submit('/nrdu/sign-in/otp', { otp: VALID_CODE })

    expect(client.cookie('session')).not.toBe(before)
  })

  test('shows an error for an empty email', async () => {
    const response = await createClient().submit('/nrdu/sign-in', { email: '' })

    expect(response.payload).toContain('There is a problem')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  test('shows an error for an invalid email', async () => {
    const response = await createClient().submit('/nrdu/sign-in', {
      email: 'nope'
    })

    expect(response.payload).toContain('correct format')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  test('shows an error when the code is not 6 digits', async () => {
    const client = createClient()
    await client.submit('/nrdu/sign-in', { email: EMAIL })

    const response = await client.submit('/nrdu/sign-in/otp', { otp: '12a' })

    expect(response.payload).toContain('must be 6 digits')
  })

  test('shows an error when the backend cannot send the code', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 502 }))

    const response = await createClient().submit('/nrdu/sign-in', {
      email: EMAIL
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(response.payload).toContain('We could not send a passcode')
  })

  test('tells the user to wait when the backend is rate limiting', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 429 }))

    const response = await createClient().submit('/nrdu/sign-in', {
      email: EMAIL
    })

    expect(response.payload).toContain('Wait a minute')
  })

  test('shows a lock-out message when the backend returns 429 on verify', async () => {
    const client = createClient()
    await client.submit('/nrdu/sign-in', { email: EMAIL })
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 429 }))

    const response = await client.submit('/nrdu/sign-in/otp', {
      otp: '000000'
    })

    expect(response.payload).toContain('too many incorrect passcodes')
  })

  test('shows an error when the backend is unreachable during verify', async () => {
    const client = createClient()
    await client.submit('/nrdu/sign-in', { email: EMAIL })
    mockFetch.mockRejectedValueOnce(new Error('connect ECONNREFUSED'))

    const response = await client.submit('/nrdu/sign-in/otp', {
      otp: VALID_CODE
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(response.payload).toContain('We could not check your passcode')
  })
})
