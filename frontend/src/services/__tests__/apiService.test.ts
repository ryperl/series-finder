import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiService, ApiError, NetworkError, ValidationError, getErrorMessage, isRetryableError } from '../apiService'

// Mock fetch globally
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('ApiService', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('Error Classes', () => {
    it('should create ApiError with correct properties', () => {
      const error = new ApiError(404, 'Not Found', 'Resource not found', '/api/users/123')
      
      expect(error.name).toBe('ApiError')
      expect(error.status).toBe(404)
      expect(error.statusText).toBe('Not Found')
      expect(error.message).toBe('Resource not found')
      expect(error.endpoint).toBe('/api/users/123')
    })

    it('should create NetworkError with correct properties', () => {
      const error = new NetworkError('Connection failed', '/api/users')
      
      expect(error.name).toBe('NetworkError')
      expect(error.message).toBe('Connection failed')
      expect(error.endpoint).toBe('/api/users')
    })

    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Username is required', 'username')
      
      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Username is required')
      expect(error.field).toBe('username')
    })
  })

  describe('User API Methods', () => {
    describe('createUser', () => {
      it('should create user successfully', async () => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          displayName: 'Test User'
        }
        
        const expectedUser = { id: '1', ...userData, createdAt: new Date(), updatedAt: new Date() }
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => expectedUser,
          headers: new Headers({ 'content-type': 'application/json' })
        })

        const result = await apiService.createUser(userData)
        
        expect(result).toEqual(expectedUser)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:7071/api/users',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(userData)
          })
        )
      })

      it('should throw ValidationError for missing required fields', async () => {
        await expect(
          apiService.createUser({ email: 'test@example.com' })
        ).rejects.toThrow(ValidationError)
      })

      it('should handle conflict error (409) properly', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 409,
          statusText: 'Conflict',
          json: async () => ({ message: 'User already exists' }),
          headers: new Headers({ 'content-type': 'application/json' })
        })

        await expect(
          apiService.createUser({
            username: 'existing',
            email: 'existing@example.com',
            displayName: 'Existing User'
          })
        ).rejects.toThrow('Username or email already exists')
      })
    })

    describe('getUser', () => {
      it('should get user successfully', async () => {
        const user = { id: '1', username: 'test', email: 'test@example.com' }
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => user,
          headers: new Headers({ 'content-type': 'application/json' })
        })

        const result = await apiService.getUser('1')
        
        expect(result).toEqual(user)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:7071/api/users/1',
          expect.any(Object)
        )
      })

      it('should throw ValidationError for empty ID', async () => {
        await expect(apiService.getUser('')).rejects.toThrow('User ID is required')
      })

      it('should handle 404 error properly', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ message: 'User not found' }),
          headers: new Headers({ 'content-type': 'application/json' })
        })

        await expect(apiService.getUser('999')).rejects.toThrow('User not found')
      })
    })

    describe('getUserByEmail', () => {
      it('should encode email properly', async () => {
        const user = { id: '1', email: 'test+tag@example.com' }
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => user,
          headers: new Headers({ 'content-type': 'application/json' })
        })

        await apiService.getUserByEmail('test+tag@example.com')
        
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:7071/api/users/email/test%2Btag%40example.com',
          expect.any(Object)
        )
      })
    })
  })

  describe('Series API Methods', () => {
    describe('createSeries', () => {
      it('should create series successfully', async () => {
        const seriesData = {
          title: 'Breaking Bad',
          userId: 'user-1',
          genre: 'Drama'
        }
        
        const expectedSeries = { id: 'series-1', ...seriesData }
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => expectedSeries,
          headers: new Headers({ 'content-type': 'application/json' })
        })

        const result = await apiService.createSeries(seriesData)
        
        expect(result).toEqual(expectedSeries)
      })

      it('should validate required fields', async () => {
        await expect(
          apiService.createSeries({ title: 'Test' })
        ).rejects.toThrow(ValidationError)
      })
    })

    describe('getUserSeries', () => {
      it('should return empty array when no series found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ message: 'No series found' }),
          headers: new Headers({ 'content-type': 'application/json' })
        })

        const result = await apiService.getUserSeries('user-1')
        
        expect(result).toEqual([])
      })
    })
  })

  describe('Request retry logic', () => {
    it('should retry on 503 service unavailable', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: async () => ({ message: 'Service unavailable' }),
          headers: new Headers({ 'content-type': 'application/json' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: '1', username: 'test' }),
          headers: new Headers({ 'content-type': 'application/json' })
        })

      const result = await apiService.getUser('1')
      
      expect(result).toEqual({ id: '1', username: 'test' })
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retries', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ message: 'Service unavailable' }),
        headers: new Headers({ 'content-type': 'application/json' })
      })

      await expect(apiService.getUser('1')).rejects.toThrow('Service temporarily unavailable')
      expect(mockFetch).toHaveBeenCalledTimes(4) // Initial + 3 retries
    }, 10000) // 10 second timeout

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(apiService.getUser('1')).rejects.toThrow(NetworkError)
    }, 10000) // 10 second timeout
  })
})

describe('Error Utility Functions', () => {
  describe('getErrorMessage', () => {
    it('should return validation error message', () => {
      const error = new ValidationError('Username is required')
      expect(getErrorMessage(error)).toBe('Username is required')
    })

    it('should return network error message', () => {
      const error = new NetworkError('Connection failed', '/api/users')
      expect(getErrorMessage(error)).toBe('Unable to connect to the server. Please check your internet connection and try again.')
    })

    it('should return appropriate message for 401 error', () => {
      const error = new ApiError(401, 'Unauthorized', 'Not authenticated', '/api/users')
      expect(getErrorMessage(error)).toBe('Please log in to continue.')
    })

    it('should return appropriate message for 404 error', () => {
      const error = new ApiError(404, 'Not Found', 'Resource not found', '/api/users/123')
      expect(getErrorMessage(error)).toBe('The requested resource was not found.')
    })

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong')
      expect(getErrorMessage(error)).toBe('Something went wrong')
    })

    it('should handle unknown errors', () => {
      expect(getErrorMessage('string error')).toBe('An unexpected error occurred.')
    })
  })

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = new NetworkError('Connection failed', '/api/users')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for retryable HTTP status codes', () => {
      expect(isRetryableError(new ApiError(503, 'Service Unavailable', 'Unavailable', '/api/users'))).toBe(true)
      expect(isRetryableError(new ApiError(429, 'Too Many Requests', 'Rate limited', '/api/users'))).toBe(true)
      expect(isRetryableError(new ApiError(502, 'Bad Gateway', 'Bad gateway', '/api/users'))).toBe(true)
    })

    it('should return false for non-retryable errors', () => {
      expect(isRetryableError(new ApiError(404, 'Not Found', 'Not found', '/api/users'))).toBe(false)
      expect(isRetryableError(new ValidationError('Invalid input'))).toBe(false)
      expect(isRetryableError(new Error('Generic error'))).toBe(false)
    })
  })
})
