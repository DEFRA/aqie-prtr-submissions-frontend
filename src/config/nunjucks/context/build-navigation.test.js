import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide no navigation links', () => {
    expect(buildNavigation(mockRequest({ path: '/cookies' }))).toEqual([])
  })
})
