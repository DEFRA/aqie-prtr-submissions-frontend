import { describe, test, expect, vi } from 'vitest'
import { getFacilities } from './service.js'
import { api } from '#/server/common/helpers/api-client.js'

vi.mock('#/server/common/helpers/api-client.js', () => ({
  api: { get: vi.fn() }
}))

describe('facilities service', () => {
  test('fetches facilities through the api client', async () => {
    const facilities = [{ id: '1', name: 'Site', status: 'not-started' }]
    api.get.mockResolvedValue(facilities)

    await expect(getFacilities()).resolves.toBe(facilities)
    expect(api.get).toHaveBeenCalledWith('/facilities')
  })
})
