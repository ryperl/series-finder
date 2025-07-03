import { useState, useCallback } from 'react'
import { getErrorMessage, isRetryableError } from '../services/apiService'

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  showToast?: boolean
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      setData(result)
      
      if (options.onSuccess) {
        options.onSuccess(result)
      }
      
      return result
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      
      if (options.onError) {
        options.onError(errorMessage)
      }
      
      // Log for debugging
      console.error('API Error:', err)
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [options])

  const retry = useCallback(async (apiCall: () => Promise<T>) => {
    if (error && isRetryableError(error)) {
      return execute(apiCall)
    }
    throw new Error('Cannot retry this operation')
  }, [error, execute])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    loading,
    error,
    data,
    execute,
    retry,
    reset,
    canRetry: error ? isRetryableError(error) : false
  }
}

// Specialized hook for mutations (create, update, delete)
export function useMutation<T = any>(options: UseApiOptions = {}) {
  const { loading, error, execute, reset } = useApi<T>(options)

  const mutate = useCallback(async (apiCall: () => Promise<T>) => {
    return execute(apiCall)
  }, [execute])

  return {
    loading,
    error,
    mutate,
    reset
  }
}

// Specialized hook for queries with automatic retries
export function useQuery<T = any>(
  queryFn: () => Promise<T>,
  options: UseApiOptions & { enabled?: boolean; retryCount?: number } = {}
) {
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = options.retryCount || 3
  const { loading, error, data, execute, reset } = useApi<T>(options)

  const fetchData = useCallback(async () => {
    try {
      return await execute(queryFn)
    } catch (err) {
      if (isRetryableError(err) && retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          fetchData()
        }, Math.pow(2, retryCount) * 1000) // Exponential backoff
      }
      throw err
    }
  }, [execute, queryFn, retryCount, maxRetries])

  return {
    loading,
    error,
    data,
    refetch: fetchData,
    reset: () => {
      setRetryCount(0)
      reset()
    }
  }
}
