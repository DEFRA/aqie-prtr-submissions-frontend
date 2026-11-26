import { describe, test, expect, vi, afterEach } from 'vitest'
import { config } from '#/config/config.js'
import { api, callApi, ApiError } from './api-client.js'

describe('api client', () => {
  afterEach(() => {
    config.set('backendApi.mockEnabled', true)
    vi.unstubAllGlobals()
  })

  test('returns mock data while mocking is enabled', async () => {
    const facilities = await api.get('/facilities')

    expect(facilities.length).toBeGreaterThan(0)
    expect(facilities[0]).toHaveProperty('name')
  })

  test('rejects when no mock exists for the call', async () => {
    await expect(api.get('/unknown')).rejects.toThrow(ApiError)
  })

  test('calls the backend when mocking is disabled', async () => {
    config.set('backendApi.mockEnabled', false)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 'x' }]
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await api.get('/facilities')

    expect(result).toEqual([{ id: 'x' }])
    expect(fetchMock).toHaveBeenCalledWith(
      `${config.get('backendApi.baseUrl')}/facilities`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  test('throws an ApiError for a non-ok backend response', async () => {
    config.set('backendApi.mockEnabled', false)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    )

    await expect(callApi('/facilities')).rejects.toMatchObject({
      statusCode: 500
    })
  })

  test('returns null for a 204 response', async () => {
    config.set('backendApi.mockEnabled', false)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }))

    await expect(api.get('/facilities')).resolves.toBeNull()
  })

  test('sends a JSON body and custom headers on POST', async () => {
    config.set('backendApi.mockEnabled', false)
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    await api.post('/facilities', { name: 'Site' }, { headers: { 'x-a': '1' } })

    expect(fetchMock).toHaveBeenCalledWith(
      `${config.get('backendApi.baseUrl')}/facilities`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Site' }),
        headers: { 'content-type': 'application/json', 'x-a': '1' }
      })
    )
  })
})
