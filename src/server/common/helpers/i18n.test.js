import { translate, isSupportedLang } from './i18n.js'

describe('#i18n', () => {
  test('Should translate a key for the given language', () => {
    expect(translate('en', 'common.errorSummaryTitle')).toBe(
      'There is a problem'
    )
  })

  test('Should fall back to English, then the key, when missing', () => {
    expect(translate('cy', 'common.errorSummaryTitle')).toBe(
      'There is a problem'
    )
    expect(translate('cy', 'missing.key')).toBe('missing.key')
  })

  test('Should only offer languages that have content', () => {
    expect(isSupportedLang('en')).toBe(true)
    expect(isSupportedLang('cy')).toBe(false)
    expect(isSupportedLang('fr')).toBe(false)
  })
})
