import { api } from '#/server/common/helpers/api-client.js'

export function getFacilities() {
  return api.get('/facilities')
}
