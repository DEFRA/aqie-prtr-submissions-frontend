import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide no navigation items', () => {
    expect(buildNavigation(mockRequest({ path: '/sign-in' }))).toEqual([])
  })
})
