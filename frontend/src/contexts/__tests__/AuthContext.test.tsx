import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'
import { apiService } from '../../services/apiService'

// Mock the API service
vi.mock('../../services/apiService', () => ({
  apiService: {
    getUserByUsername: vi.fn(),
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  }
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Test component to consume auth context
const TestComponent = () => {
  const { user, loading, login, register, logout, updateUser } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user ? user.username : 'No User'}</div>
      <button onClick={() => login('testuser', 'password')}>Login</button>
      <button onClick={() => register({ 
        username: 'newuser', 
        email: 'new@example.com', 
        password: 'password',
        displayName: 'New User' 
      })}>Register</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => updateUser({ displayName: 'Updated Name' })}>Update User</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should provide initial state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('No User')
    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
  })

  it('should handle login successfully', async () => {
    const user = await userEvent.setup()
    const mockUser = { 
      id: '1', 
      username: 'testuser', 
      email: 'test@example.com', 
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    vi.mocked(apiService.getUserByUsername).mockResolvedValue(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await user.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser')
    })
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser))
  })

  it('should handle login failure', async () => {
    const user = await userEvent.setup()
    
    vi.mocked(apiService.getUserByUsername).mockRejectedValue(new Error('User not found'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await expect(async () => {
      await user.click(screen.getByText('Login'))
    }).rejects.toThrow('Login failed')
  })

  it('should handle user registration', async () => {
    const user = await userEvent.setup()
    const mockUser = { 
      id: '2', 
      username: 'newuser', 
      email: 'new@example.com', 
      displayName: 'New User',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    vi.mocked(apiService.getUserByUsername).mockRejectedValue(new Error('User not found'))
    vi.mocked(apiService.getUserByEmail).mockRejectedValue(new Error('User not found'))
    vi.mocked(apiService.createUser).mockResolvedValue(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await user.click(screen.getByText('Register'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('newuser')
    })
  })

  it('should handle logout', async () => {
    const user = await userEvent.setup()
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ 
      id: '1', 
      username: 'testuser', 
      email: 'test@example.com', 
      displayName: 'Test User' 
    }))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await user.click(screen.getByText('Logout'))

    expect(screen.getByTestId('user')).toHaveTextContent('No User')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user')
  })

  it('should restore user from localStorage on mount', async () => {
    const savedUser = { 
      id: '1', 
      username: 'testuser', 
      email: 'test@example.com', 
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedUser))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser')
    })
  })
})
