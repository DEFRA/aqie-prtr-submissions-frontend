import { translate, isSupportedLang } from './i18n.js'

describe('#i18n', () => {
  test('Should translate a key for the given language', () => {
    expect(translate('cy', 'home.title')).toBe('Hafan')
    expect(translate('en', 'home.title')).toBe('Home')
  })

  test('Should fall back to the key when missing', () => {
    expect(translate('cy', 'missing.key')).toBe('missing.key')
  })

  test('Should only support en and cy', () => {
    expect(isSupportedLang('cy')).toBe(true)
    expect(isSupportedLang('fr')).toBe(false)
  })
})
