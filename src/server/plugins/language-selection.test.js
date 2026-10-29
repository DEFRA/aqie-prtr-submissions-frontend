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
    const response = await get('/')

    expect(response.payload).toContain('<html lang="en-GB"')
    expect(response.payload).toContain('href="?language=cy"')
  })

  test('Should switch to Welsh with ?language=cy and offer English', async () => {
    const response = await get('/?language=cy')

    expect(response.payload).toContain('<html lang="cy"')
    expect(response.payload).toContain('href="?language=en-GB"')
  })

  test('Should remember the language in the session', async () => {
    const first = await get('/?language=cy')
    const second = await get('/', cookieFrom(first))

    expect(second.payload).toContain('<html lang="cy"')
  })

  test('Should ignore an unsupported language', async () => {
    const response = await get('/?language=fr')

    expect(response.payload).toContain('<html lang="en-GB"')
  })

  test('Should ignore the old ?lang= parameter', async () => {
    const response = await get('/?lang=cy')

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
})
