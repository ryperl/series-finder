import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { AuthProvider } from '../contexts/AuthContext'
import { vi } from 'vitest'

// Create a custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        cacheTime: 0, // Don't cache in tests
      },
    },
  })

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock data generators
export const mockUser = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  bio: 'Test bio',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
}

export const mockSeries = {
  id: 'series-1',
  userId: 'user-1',
  title: 'Breaking Bad',
  description: 'A high school chemistry teacher turned methamphetamine manufacturer',
  genre: 'Drama',
  status: 'completed' as const,
  rating: 9.5,
  episodes: 62,
  currentEpisode: 62,
  imageUrl: 'https://example.com/breaking-bad.jpg',
  year: 2008,
  isRecommendation: false,
  likes: 5,
  likedBy: ['user-2', 'user-3'],
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
}

export const mockFriend = {
  id: 'friend-1',
  userId: 'user-1',
  friendId: 'user-2',
  status: 'accepted' as const,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
}

export const mockFavoriteList = {
  id: 'list-1',
  userId: 'user-1',
  name: 'My Favorites',
  description: 'My favorite series',
  series: [{ id: 'series-1', addedAt: new Date('2023-01-01') }],
  isPublic: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
}

// API mock helpers
export const mockFetchSuccess = (data: any) => {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
    headers: new Headers({ 'content-type': 'application/json' }),
  })
}

export const mockFetchError = (status: number, message: string) => {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Error',
    json: async () => ({ message }),
    headers: new Headers({ 'content-type': 'application/json' }),
  })
}

export const mockFetchNetworkError = () => {
  return vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
}

// Wait for async operations
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
