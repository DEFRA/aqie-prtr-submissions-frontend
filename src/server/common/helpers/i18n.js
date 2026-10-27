import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const DEFAULT_LANG = 'en'
export const SUPPORTED_LANGS = ['en', 'cy']

const serverDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const routesDir = path.join(serverDir, 'routes')

// routes/address-book/email/content.js -> namespace 'address-book.email'
const namespaceOf = (file) =>
  path.dirname(path.relative(routesDir, file)).split(path.sep).join('.')

const contentFiles = readdirSync(routesDir, {
  recursive: true,
  withFileTypes: true
})
  .filter((entry) => entry.isFile() && entry.name === 'content.js')
  .map((entry) => path.join(entry.parentPath, entry.name))

// Each content.js exports { en, cy? }; shared text lives in server/common/content.js.
const sources = [
  { namespace: 'common', file: path.join(serverDir, 'common/content.js') },
  ...contentFiles.map((file) => ({ namespace: namespaceOf(file), file }))
]

const messages = Object.fromEntries(SUPPORTED_LANGS.map((lang) => [lang, {}]))

// 'auth.email' -> messages[lang].auth.email, matching how translate() walks keys.
function setNested(root, namespace, value) {
  const parts = namespace.split('.')
  const last = parts.pop()
  const parent = parts.reduce((node, part) => (node[part] ??= {}), root)
  parent[last] = value
}

const loaded = await Promise.all(
  sources.map(async ({ namespace, file }) => ({
    namespace,
    content: (await import(pathToFileURL(file).href)).content
  }))
)

for (const { namespace, content } of loaded) {
  for (const lang of SUPPORTED_LANGS) {
    setNested(messages[lang], namespace, content[lang])
  }
}

// A language is only offered once at least one content file provides a string for it.
const hasStrings = (node) =>
  typeof node === 'string' ||
  (node !== null &&
    typeof node === 'object' &&
    Object.values(node).some(hasStrings))

const availableLangs = SUPPORTED_LANGS.filter(
  (lang) => lang === DEFAULT_LANG || hasStrings(messages[lang])
)

const lookup = (dict, key) =>
  key.split('.').reduce((node, part) => node?.[part], dict)

export function isSupportedLang(lang) {
  return availableLangs.includes(lang)
}

export const hasMultipleLangs = availableLangs.length > 1

// Falls back to English, then to the key itself.
export function translate(lang, key) {
  const value =
    lookup(messages[lang], key) ?? lookup(messages[DEFAULT_LANG], key)
  return typeof value === 'string' ? value : key
}
