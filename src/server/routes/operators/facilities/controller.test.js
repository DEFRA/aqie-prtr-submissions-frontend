import { describe, test, expect, vi, beforeEach } from 'vitest'
import { facilitiesController } from './controller.js'
import { getFacilities } from './service.js'

vi.mock('./service.js', () => ({ getFacilities: vi.fn() }))

const h = { view: vi.fn((template, context) => ({ template, context })) }

const renderWith = async (facilities, request = {}) => {
  getFacilities.mockResolvedValue(facilities)
  return facilitiesController.handler(request, h)
}

describe('facilities controller', () => {
  beforeEach(() => {
    h.view.mockClear()
  })

  test('renders the facilities view with translated page text', async () => {
    const { template, context } = await renderWith([])

    expect(template).toBe('operators/facilities/index')
    expect(context).toMatchObject({
      pageTitle: 'Facilities you are responsible for',
      caption: 'Operator data collection',
      missingFacilityLink: 'Tell us about a missing facility',
      facilityYouAreNoteResponsible:
        'Tell us about a facility you are not responsible for',
      facilities: []
    })
  })

  test('falls back to English when the request has no language', async () => {
    const { context } = await renderWith([], {})

    expect(context.pageTitle).toBe('Facilities you are responsible for')
  })

  test('uses the Welsh text when the request language is cy', async () => {
    const { context } = await renderWith([], { app: { language: 'cy' } })

    expect(context.pageTitle).toBe('Facilities you are responsible for --CY')
  })

  test.each([
    ['report-in-progress', 'govuk-tag--yellow', '#'],
    ['report-submitted', 'govuk-tag--blue', null],
    ['report-rejected', 'govuk-tag--red', '#'],
    ['not-started', null, '#'],
    ['report-approved', 'govuk-tag--green', '#']
  ])('maps status %s to tag %s and link %s', async (status, tagClass, href) => {
    const { context } = await renderWith([{ id: '1', name: 'Site', status }])

    expect(context.facilities[0]).toMatchObject({
      name: 'Site',
      tagClass,
      href
    })
  })

  test('translates the status text for each facility', async () => {
    const { context } = await renderWith([
      { id: '1', name: 'A', status: 'report-in-progress' },
      { id: '2', name: 'B', status: 'not-started' }
    ])

    expect(context.facilities.map((facility) => facility.statusText)).toEqual([
      'Report in progress',
      'Not started'
    ])
    expect(context.facilities.map((facility) => facility.hint)).toEqual([
      null,
      null
    ])
  })

  test('propagates errors from the service', async () => {
    getFacilities.mockRejectedValue(new Error('backend down'))

    await expect(facilitiesController.handler({}, h)).rejects.toThrow(
      'backend down'
    )
  })
})
