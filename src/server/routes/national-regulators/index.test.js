import { describe, beforeAll, afterAll, test, expect } from 'vitest'
import * as cheerio from 'cheerio'
import { createServer } from '#/server/server.js'
import { config } from '#/config/config.js'

describe('National Regulator data collection module', () => {
  let server

  beforeAll(async () => {
    config.set('featureFlags.nationalRegulatorsFeatureEnabled', true)
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    config.set('featureFlags.nationalRegulatorsFeatureEnabled', false)
    await server.stop({ timeout: 0 })
  })

  test('GET /national-regulators redirects to the landing page', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/national-regulators'
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/national-regulators/home')
  })

  test('GET /national-regulators/home renders the landing page', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/national-regulators/home'
    })
    const $ = cheerio.load(response.payload)

    expect(response.statusCode).toBe(200)
    expect(response.request.response.source.template).toBe(
      'national-regulators/home/index'
    )
    expect($('h1').text()).toBe('Home')
    expect($('.govuk-caption-l').text()).toBe(
      'National Regulator data collection'
    )
    expect($('title').text()).toContain(config.get('serviceName'))
  })
})

describe('National Regulator data collection module feature flag off', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('is disabled by default', () => {
    expect(config.get('featureFlags.nationalRegulatorsFeatureEnabled')).toBe(
      false
    )
  })

  test.each(['/national-regulators', '/national-regulators/home'])(
    'GET %s returns 404',
    async (url) => {
      const response = await server.inject({ method: 'GET', url })

      expect(response.statusCode).toBe(404)
    }
  )
})
