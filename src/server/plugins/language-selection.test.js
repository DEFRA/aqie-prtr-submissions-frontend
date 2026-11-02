import { createServer } from '#/server/server.js'

describe('#languageSelection', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  const get = (url, cookie) =>
    server.inject({ method: 'GET', url, headers: cookie ? { cookie } : {} })

  const cookieFrom = (response) =>
    [response.headers['set-cookie']]
      .flat()
      .filter(Boolean)
      .map((c) => c.split(';')[0])
      .join('; ')

  test('Should default to English', async () => {
    const response = await get('/cookies')

    expect(response.payload).toContain('<html lang="en-GB"')
    expect(response.payload).toContain('href="?language=cy"')
  })

  test('Should switch to Welsh with ?language=cy and offer English', async () => {
    const response = await get('/cookies?language=cy')

    expect(response.payload).toContain('<html lang="cy"')
    expect(response.payload).toContain('href="?language=en-GB"')
  })

  test('Should remember the language in the session', async () => {
    const first = await get('/cookies?language=cy')
    const second = await get('/cookies', cookieFrom(first))

    expect(second.payload).toContain('<html lang="cy"')
  })

  test('Should ignore an unsupported language', async () => {
    const response = await get('/cookies?language=fr')

    expect(response.payload).toContain('<html lang="en-GB"')
  })

  test('Should ignore the old ?lang= parameter', async () => {
    const response = await get('/cookies?lang=cy')

    expect(response.payload).toContain('<html lang="en-GB"')
  })

  test('Should set the language before CSRF checks so error pages use it', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/cookies?language=cy',
      payload: { analytics: true }
    })

    expect(response.statusCode).toBe(403)
    expect(response.payload).toContain('<html lang="cy"')
  })

  describe('per module', () => {
    test.each(['address-book', 'nrdu'])(
      'English-only module %s ignores ?language=cy and shows no switch',
      async (moduleName) => {
        const response = await get(`/${moduleName}/sign-in?language=cy`)

        expect(response.payload).toContain('<html lang="en-GB"')
        expect(response.payload).not.toContain('href="?language=')
      }
    )

    test('Welsh module accepts ?language=cy and offers English', async () => {
      const response = await get(
        '/pollutant-data-collection/sign-in?language=cy'
      )

      expect(response.payload).toContain('<html lang="cy"')
      expect(response.payload).toContain('href="?language=en-GB"')
    })

    test('Welsh module offers the switch in English too', async () => {
      const response = await get('/pollutant-data-collection/sign-in')

      expect(response.payload).toContain('<html lang="en-GB"')
      expect(response.payload).toContain('href="?language=cy"')
    })

    test('A Welsh choice is kept while visiting an English-only module', async () => {
      const welsh = await get('/pollutant-data-collection/sign-in?language=cy')
      const cookie = cookieFrom(welsh)

      const english = await get('/nrdu/sign-in', cookie)
      const backAgain = await get('/pollutant-data-collection/sign-in', cookie)

      expect(english.payload).toContain('<html lang="en-GB"')
      expect(backAgain.payload).toContain('<html lang="cy"')
    })

    test('English-only module error pages stay English', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/nrdu/sign-in?language=cy',
        payload: { email: 'a@example.com' }
      })

      expect(response.statusCode).toBe(403)
      expect(response.payload).toContain('<html lang="en-GB"')
    })
  })
})
