import { describe, beforeAll, afterAll, test, expect } from 'vitest'
import * as cheerio from 'cheerio'
import { createServer } from '#/server/server.js'
import { config } from '#/config/config.js'

describe('Operator data collection module', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('GET /operators redirects to the landing page', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/operators'
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/operators/facilities')
  })

  test('GET /operators/facilities renders the landing page', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/operators/facilities'
    })
    const $ = cheerio.load(response.payload)

    expect(response.statusCode).toBe(200)
    expect(response.request.response.source.template).toBe(
      'operators/facilities/index'
    )
    expect($('h1').text()).toBe('Facilities')
    expect($('.govuk-caption-l').text()).toBe('Operator data collection')
    expect($('title').text()).toContain('Facilities')
    expect($('title').text()).toContain(config.get('serviceName'))
  })
})
