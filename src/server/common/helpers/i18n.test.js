import { translate, isSupportedLang } from './i18n.js'

describe('#i18n', () => {
  test('Should translate a key for the given language', () => {
    expect(translate('en-GB', 'common.errorSummaryTitle')).toBe(
      'There is a problem'
    )
    expect(translate('cy', 'common.errorSummaryTitle')).toBe('Mae problem')
  })

  test('Should fall back to the key when missing', () => {
    expect(translate('cy', 'missing.key')).toBe('missing.key')
  })

  test('Should only offer languages that have content', () => {
    expect(isSupportedLang('en-GB')).toBe(true)
    expect(isSupportedLang('cy')).toBe(true)
    expect(isSupportedLang('en')).toBe(false)
    expect(isSupportedLang('fr')).toBe(false)
  })
})
