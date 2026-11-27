// Makes layout back links behave like the browser back button; the href is the no-JavaScript fallback.
export function initBackLinks(root = document) {
  for (const link of root.querySelectorAll('[data-module="app-back-link"]')) {
    link.addEventListener('click', (event) => {
      if (globalThis.history.length > 1) {
        event.preventDefault()
        globalThis.history.back()
      }
    })
  }
}
