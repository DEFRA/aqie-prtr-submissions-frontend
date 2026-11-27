import { describe, test, expect, vi } from 'vitest'
import { missingFacilityController } from './controller.js'

const h = { view: vi.fn((template, context) => ({ template, context })) }

describe('missing facility controller', () => {
  test('renders the static page with English text by default', () => {
    const { template, context } = missingFacilityController.handler({}, h)

    expect(template).toBe('operators/missing-facility/index')
    expect(context).toEqual({
      pageTitle: 'Contact your Regulator about the missing facility',
      backLink: { href: '/operators/facilities' },
      body: 'Give them the details of any additional facilities you need to report PRTR data for.',
      returnLink: 'Return to facilities',
      facilitiesPath: '/operators/facilities'
    })
  })

  test('renders the Welsh text when the request language is cy', () => {
    const { context } = missingFacilityController.handler(
      { app: { language: 'cy' } },
      h
    )

    expect(context).toEqual({
      pageTitle: 'Contact your Regulator about the missing facility --CY',
      backLink: { href: '/operators/facilities' },
      body: 'Give them the details of any additional facilities you need to report PRTR data for. --CY',
      returnLink: 'Return to facilities --CY',
      facilitiesPath: '/operators/facilities'
    })
  })
})
