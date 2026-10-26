import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'

describe('#auth sign-in journey', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  // Crumb needs the cookie from a GET and the token from the rendered form.
  async function getPage(url, cookie) {
    const response = await server.inject({
      method: 'GET',
      url,
      headers: cookie ? { cookie } : {}
    })
    const crumb = /name="crumb" value="([^"]+)"/.exec(response.payload)?.[1]
    const cookies = [response.headers['set-cookie']].flat().filter(Boolean)
    return {
      response,
      crumb,
      cookie: cookies.map((c) => c.split(';')[0]).join('; ')
    }
  }

  async function post(url, payload, { crumb, cookie }) {
    return server.inject({
      method: 'POST',
      url,
      payload: { ...payload, crumb },
      headers: { cookie }
    })
  }

  test('GET /sign-in renders the email page', async () => {
    const { response } = await getPage('/sign-in')
    expect(response.statusCode).toBe(statusCodes.ok)
    expect(response.payload).toContain('Enter your email address')
  })

  test('POST /sign-in with empty email shows an error', async () => {
    const page = await getPage('/sign-in')
    const response = await post('/sign-in', { email: '' }, page)
    expect(response.statusCode).toBe(statusCodes.ok)
    expect(response.payload).toContain('There is a problem')
  })

  test('POST /sign-in with invalid email shows an error', async () => {
    const page = await getPage('/sign-in')
    const response = await post('/sign-in', { email: 'nope' }, page)
    expect(response.payload).toContain('correct format')
  })

  test('GET /sign-in/otp without an email redirects to /sign-in', async () => {
    const { response } = await getPage('/sign-in/otp')
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/sign-in')
  })

  test('full journey: email, wrong code, then correct code', async () => {
    const emailPage = await getPage('/sign-in')
    const emailPost = await post(
      '/sign-in',
      { email: 'user@example.com' },
      emailPage
    )
    expect(emailPost.statusCode).toBe(302)
    expect(emailPost.headers.location).toBe('/sign-in/otp')

    const sessionCookie = [emailPage.cookie, emailPost.headers['set-cookie']]
      .flat()
      .filter(Boolean)
      .map((c) => c.split(';')[0])
      .join('; ')

    const otpPage = await getPage('/sign-in/otp', sessionCookie)
    expect(otpPage.response.statusCode).toBe(statusCodes.ok)

    const wrong = await post(
      '/sign-in/otp',
      { otp: '000000' },
      {
        crumb: otpPage.crumb,
        cookie: sessionCookie
      }
    )
    expect(wrong.payload).toContain('not correct')

    const right = await post(
      '/sign-in/otp',
      { otp: '123456' },
      {
        crumb: otpPage.crumb,
        cookie: sessionCookie
      }
    )
    expect(right.statusCode).toBe(302)
    expect(right.headers.location).toBe('/')
  })
})
