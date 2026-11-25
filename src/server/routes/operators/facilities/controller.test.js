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
      missingFacilityLink: 'Is there a facility missing?',
      facilities: []
    })
  })

  test('falls back to English when the request has no language', async () => {
    const { context } = await renderWith([], { app: { language: 'cy' } })

    expect(context.pageTitle).toBe('Facilities you are responsible for')
  })

  test.each([
    ['wrong-assignment', 'govuk-tag--grey', null],
    ['zero-return-submitted', 'govuk-tag--blue', null],
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

  test('adds the removal hint only for wrong assignments', async () => {
    const { context } = await renderWith([
      { id: '1', name: 'A', status: 'wrong-assignment' },
      { id: '2', name: 'B', status: 'not-started' }
    ])

    expect(context.facilities[0].hint).toBe(
      'You will be contacted when this facility has been removed from your list'
    )
    expect(context.facilities[1].hint).toBeNull()
  })

  test('propagates errors from the service', async () => {
    getFacilities.mockRejectedValue(new Error('backend down'))

    await expect(facilitiesController.handler({}, h)).rejects.toThrow(
      'backend down'
    )
  })
})
