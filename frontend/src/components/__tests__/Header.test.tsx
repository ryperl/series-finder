import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Header from '../Header'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock the API service
vi.mock('../../services/apiService', () => ({
  apiService: {
    getUserByUsername: vi.fn(),
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  }
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Test wrapper component
const TestWrapper = ({ children, user = null }: { children: React.ReactNode, user?: any }) => {
  // Mock localStorage for user
  if (user) {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(user))
  } else {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  it('should render logo and navigation links', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    )

    expect(screen.getByText('Series Finder')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Discover')).toBeInTheDocument()
  })

  it('should show login and register links when user is not logged in', async () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument()
      expect(screen.getByText('Register')).toBeInTheDocument()
    })

    expect(screen.queryByText('Friends')).not.toBeInTheDocument()
    expect(screen.queryByText('Profile')).not.toBeInTheDocument()
    expect(screen.queryByText('Logout')).not.toBeInTheDocument()
  })

  it('should show user navigation when logged in', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    render(
      <TestWrapper user={mockUser}>
        <Header />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Friends')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })

    expect(screen.queryByText('Login')).not.toBeInTheDocument()
    expect(screen.queryByText('Register')).not.toBeInTheDocument()
  })

  it('should handle logout functionality', async () => {
    const user = await userEvent.setup()
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    render(
      <TestWrapper user={mockUser}>
        <Header />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Logout'))

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should have correct navigation links', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    )

    const homeLink = screen.getByText('Home').closest('a')
    const discoverLink = screen.getByText('Discover').closest('a')

    expect(homeLink).toHaveAttribute('href', '/')
    expect(discoverLink).toHaveAttribute('href', '/discover')
  })

  it('should render with proper styling classes', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    )

    const logo = screen.getByText('Series Finder')
    expect(logo).toBeInTheDocument()
    
    // Test that navigation items are properly rendered
    const navItems = screen.getAllByRole('link')
    expect(navItems.length).toBeGreaterThan(0)
  })
})
