// URL prefix -> module settings. The first path segment of a URL identifies the module.
export const modules = {
  'address-book': {
    languages: ['en-GB'],
    landingPath: '/address-book/about-you'
  },
  'pollutant-data-collection': {
    languages: ['en-GB', 'cy'],
    landingPath: '/pollutant-data-collection/facilities'
  },
  nrdu: {
    languages: ['en-GB'],
    landingPath: '/nrdu/upload-pollutant-release-data'
  }
}

export function getModuleName(urlPath) {
  const [, firstSegment] = urlPath.split('/')
  return Object.hasOwn(modules, firstSegment) ? firstSegment : undefined
}
