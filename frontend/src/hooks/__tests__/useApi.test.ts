import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useApi, useMutation, useQuery } from '../useApi'

// Mock the API service
vi.mock('../../services/apiService')

describe('useApi Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle successful API call', async () => {
    const mockData = { id: '1', name: 'Test' }
    const mockApiCall = vi.fn().mockResolvedValue(mockData)

    const { result } = renderHook(() => useApi())

    await waitFor(async () => {
      const data = await result.current.execute(mockApiCall)
      expect(data).toEqual(mockData)
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle API call error', async () => {
    const mockError = new Error('API Error')
    const mockApiCall = vi.fn().mockRejectedValue(mockError)

    const { result } = renderHook(() => useApi())

    await waitFor(async () => {
      try {
        await result.current.execute(mockApiCall)
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('API Error')
  })

  it('should set loading state during API call', async () => {
    const mockApiCall = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: 'test' }), 100))
    )

    const { result } = renderHook(() => useApi())

    result.current.execute(mockApiCall)

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('should call onSuccess callback', async () => {
    const mockData = { id: '1', name: 'Test' }
    const mockApiCall = vi.fn().mockResolvedValue(mockData)
    const onSuccess = vi.fn()

    const { result } = renderHook(() => useApi({ onSuccess }))

    await waitFor(async () => {
      await result.current.execute(mockApiCall)
    })

    expect(onSuccess).toHaveBeenCalledWith(mockData)
  })

  it('should call onError callback', async () => {
    const mockError = new Error('API Error')
    const mockApiCall = vi.fn().mockRejectedValue(mockError)
    const onError = vi.fn()

    const { result } = renderHook(() => useApi({ onError }))

    await waitFor(async () => {
      try {
        await result.current.execute(mockApiCall)
      } catch (error) {
        // Expected to throw
      }
    })

    expect(onError).toHaveBeenCalledWith('API Error')
  })
})

describe('useMutation Hook', () => {
  it('should handle mutation successfully', async () => {
    const mockData = { id: '1', name: 'Created' }
    const mockApiCall = vi.fn().mockResolvedValue(mockData)

    const { result } = renderHook(() => useMutation())

    await waitFor(async () => {
      const data = await result.current.mutate(mockApiCall)
      expect(data).toEqual(mockData)
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle mutation error', async () => {
    const mockError = new Error('Mutation Error')
    const mockApiCall = vi.fn().mockRejectedValue(mockError)

    const { result } = renderHook(() => useMutation())

    await waitFor(async () => {
      try {
        await result.current.mutate(mockApiCall)
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Mutation Error')
  })
})

describe('useQuery Hook', () => {
  it('should fetch data automatically when enabled', async () => {
    const mockData = { id: '1', name: 'Test' }
    const queryFn = vi.fn().mockResolvedValue(mockData)

    const { result } = renderHook(() => useQuery(queryFn, { enabled: true }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
    expect(queryFn).toHaveBeenCalled()
  })

  it('should not fetch data when disabled', () => {
    const queryFn = vi.fn()

    renderHook(() => useQuery(queryFn, { enabled: false }))

    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should handle query error', async () => {
    const mockError = new Error('Query Error')
    const queryFn = vi.fn().mockRejectedValue(mockError)

    const { result } = renderHook(() => useQuery(queryFn))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Query Error')
    expect(result.current.data).toBeNull()
  })

  it('should allow manual refetch', async () => {
    const mockData = { id: '1', name: 'Test' }
    const queryFn = vi.fn().mockResolvedValue(mockData)

    const { result } = renderHook(() => useQuery(queryFn, { enabled: false }))

    await waitFor(async () => {
      await result.current.refetch()
    })

    expect(queryFn).toHaveBeenCalled()
    expect(result.current.data).toEqual(mockData)
  })
})
