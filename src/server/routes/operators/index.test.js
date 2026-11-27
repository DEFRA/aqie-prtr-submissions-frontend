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
    expect($('h1').text()).toBe('Facilities you are responsible for')
    expect($('.govuk-caption-l').text()).toBe('Operator data collection')
    expect($('title').text()).toContain('Facilities you are responsible for')
    expect($('title').text()).toContain(config.get('serviceName'))
  })

  test('GET /operators/facilities lists the facilities with their status', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/operators/facilities'
    })
    const $ = cheerio.load(response.payload)
    const items = $('[data-testid="facilities-list"] li')

    expect(items).toHaveLength(5)
    expect(items.first().text()).toContain(
      'Celsa Manufacturing (UK) Limited, Tremorfa Melt Shop'
    )
    expect(items.first().find('a')).toHaveLength(1)
    expect(items.first().find('.govuk-tag--yellow').text()).toBe(
      'Report in progress'
    )
    expect(items.eq(1).find('a')).toHaveLength(0)
    expect(items.eq(1).find('.govuk-tag--blue').text()).toBe('Report submitted')
    expect(items.eq(2).find('.govuk-tag--red').text()).toBe('Report rejected')
    expect(items.eq(3).find('.govuk-tag')).toHaveLength(0)
    expect(items.eq(3).text()).toContain('Not started')
    expect(items.eq(4).find('.govuk-tag--green').text()).toBe('Report approved')
  })

  test('GET /operators/facilities shows the two help links in order', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/operators/facilities'
    })
    const $ = cheerio.load(response.payload)
    const links = $('main p.govuk-body > a.govuk-link')
      .map((_i, el) => $(el).text())
      .get()

    expect(links).toEqual([
      'Tell us about a missing facility',
      'Tell us about a facility you are not responsible for'
    ])
  })

  test('GET /operators/facilities links to the missing facility page', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/operators/facilities'
    })
    const $ = cheerio.load(response.payload)
    const link = $('a[href="/operators/facilities/missing"]')

    expect(link.text()).toBe('Tell us about a missing facility')
  })

  test('GET /operators/facilities/missing renders the static page', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/operators/facilities/missing'
    })
    const $ = cheerio.load(response.payload)

    expect(response.statusCode).toBe(200)
    expect(response.request.response.source.template).toBe(
      'operators/missing-facility/index'
    )
    expect($('h1').text()).toBe(
      'Contact your Regulator about the missing facility'
    )
    expect($('main .govuk-body').first().text()).toBe(
      'Give them the details of any additional facilities you need to report PRTR data for.'
    )
    expect($('.govuk-back-link').attr('href')).toBe('/operators/facilities')
    expect($('main a.govuk-link[href="/operators/facilities"]').text()).toBe(
      'Return to facilities'
    )
    expect($('title').text()).toContain(config.get('serviceName'))
  })
})
