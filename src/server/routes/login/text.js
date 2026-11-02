import { translate } from '#/server/common/helpers/i18n.js'

// A module's own text wins; anything it does not override comes from `default`.
export function loginText(language, page, moduleName, key) {
  const specific = `login.${page}.modules.${moduleName}.${key}`
  const value = translate(language, specific)
  return value === specific
    ? translate(language, `login.${page}.default.${key}`)
    : value
}

export function loginTexts(language, page, moduleName, keys) {
  return Object.fromEntries(
    keys.map((key) => [key, loginText(language, page, moduleName, key)])
  )
}
