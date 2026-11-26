import { buildNavigation } from './build-navigation.js'

describe('#buildNavigation', () => {
  test('Should provide no navigation items', () => {
    expect(buildNavigation({ path: '/' })).toEqual([])
  })
})
