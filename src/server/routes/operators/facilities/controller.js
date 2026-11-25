import { DEFAULT_LANG, translate } from '#/server/common/helpers/i18n.js'
import { getFacilities } from './service.js'

const TEXT = 'operators.facilities'

// Tag colour per status; statuses without an entry render as plain text.
const TAG_CLASSES = {
  'wrong-assignment': 'govuk-tag--grey',
  'zero-return-submitted': 'govuk-tag--blue',
  'report-in-progress': 'govuk-tag--yellow',
  'report-submitted': 'govuk-tag--blue',
  'report-rejected': 'govuk-tag--red',
  'report-approved': 'govuk-tag--green'
}

// Facilities in these statuses can no longer be opened by the operator.
const NON_LINKED_STATUSES = new Set([
  'wrong-assignment',
  'zero-return-submitted',
  'report-submitted'
])

function toViewModel(facility, language) {
  return {
    name: facility.name,
    href: NON_LINKED_STATUSES.has(facility.status) ? null : '#',
    statusText: translate(language, `${TEXT}.status.${facility.status}`),
    tagClass: TAG_CLASSES[facility.status] ?? null,
    hint:
      facility.status === 'wrong-assignment'
        ? translate(language, `${TEXT}.wrongAssignmentHint`)
        : null
  }
}

export const facilitiesController = {
  async handler(request, h) {
    const language = request.app?.language ?? DEFAULT_LANG
    const facilities = await getFacilities()

    return h.view('operators/facilities/index', {
      pageTitle: translate(language, `${TEXT}.title`),
      caption: translate(language, `${TEXT}.caption`),
      missingFacilityLink: translate(language, `${TEXT}.missingFacilityLink`),
      noFacilities: translate(language, `${TEXT}.noFacilities`),
      facilities: facilities.map((facility) => toViewModel(facility, language))
    })
  }
}
