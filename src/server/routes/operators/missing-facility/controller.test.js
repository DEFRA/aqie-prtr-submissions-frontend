import { describe, test, expect, vi } from 'vitest'
import { missingFacilityController } from './controller.js'

const h = { view: vi.fn((template, context) => ({ template, context })) }

describe('missing facility controller', () => {
  test.each([[{}], [{ app: { language: 'cy' } }]])(
    'renders the static page with English text for request %j',
    (request) => {
      const { template, context } = missingFacilityController.handler(
        request,
        h
      )

      expect(template).toBe('operators/missing-facility/index')
      expect(context).toEqual({
        pageTitle: 'Contact your Regulator about the missing facility',
        back: 'Back',
        body: 'Give them the details of any additional facilities you need to report PRTR data for.',
        returnLink: 'Return to facilities',
        facilitiesPath: '/operators/facilities'
      })
    }
  )
})
