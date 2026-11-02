import { translate, isSupportedLang, languageOptionsFor } from './i18n.js'

describe('#i18n', () => {
  test('Should translate a key for the given language', () => {
    expect(translate('en-GB', 'common.signOut')).toBe('Sign out')
    expect(translate('cy', 'common.signOut')).toBe('Allgofnodi')
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

  test('Should find text in nested folders', () => {
    expect(translate('en-GB', 'login.email.default.button')).toBe('Continue')
    expect(translate('en-GB', 'login.email.modules.nrdu.intro')).toContain(
      'national regulator'
    )
  })

  describe('languageOptionsFor', () => {
    test('Should offer English and Welsh by default', () => {
      expect(languageOptionsFor()).toEqual([
        { code: 'en-GB', text: 'English' },
        { code: 'cy', text: 'Cymraeg' }
      ])
    })

    test('Should offer nothing when only one language is allowed', () => {
      expect(languageOptionsFor(['en-GB'])).toEqual([])
      expect(languageOptionsFor(['cy'])).toEqual([])
    })

    test('Should ignore languages that have no content', () => {
      expect(languageOptionsFor(['en-GB', 'fr'])).toEqual([])
    })
  })
})
