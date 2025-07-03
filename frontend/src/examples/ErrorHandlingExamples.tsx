// Example of using the improved API error handling

import React from 'react'
import { useMutation, useQuery } from '../hooks/useApi'
import { apiService, getErrorMessage } from '../services/apiService'
import toast from 'react-hot-toast'

// Example: Using the useMutation hook for creating a series
export function CreateSeriesExample() {
  const createSeriesMutation = useMutation({
    onSuccess: (newSeries) => {
      toast.success('Series created successfully!')
      console.log('New series:', newSeries)
    },
    onError: (error) => {
      toast.error(error)
    }
  })

  const handleCreateSeries = async () => {
    await createSeriesMutation.mutate(() =>
      apiService.createSeries({
        title: 'Breaking Bad',
        description: 'A high school chemistry teacher turned methamphetamine manufacturer',
        genre: 'Drama',
        userId: 'user123',
        status: 'completed',
        rating: 9.5,
        episodes: 62,
        year: 2008,
        isRecommendation: false,
        likes: 0,
        likedBy: []
      })
    )
  }

  return (
    <div>
      <button 
        onClick={handleCreateSeries}
        disabled={createSeriesMutation.loading}
      >
        {createSeriesMutation.loading ? 'Creating...' : 'Create Series'}
      </button>
      
      {createSeriesMutation.error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          {createSeriesMutation.error}
        </div>
      )}
    </div>
  )
}

// Example: Using the useQuery hook for fetching user series
export function UserSeriesExample({ userId }: { userId: string }) {
  const {
    loading,
    error,
    data: series,
    refetch
  } = useQuery(
    () => apiService.getUserSeries(userId),
    {
      enabled: !!userId,
      onError: (error) => {
        console.error('Failed to load user series:', error)
      }
    }
  )

  if (loading) {
    return <div>Loading series...</div>
  }

  if (error) {
    return (
      <div>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={refetch}>Try Again</button>
      </div>
    )
  }

  return (
    <div>
      <h3>Your Series ({series?.length || 0})</h3>
      {series?.map(s => (
        <div key={s.id}>
          <h4>{s.title}</h4>
          <p>{s.description}</p>
          <p>Status: {s.status}</p>
        </div>
      ))}
    </div>
  )
}

// Example: Manual error handling with try/catch
export function ManualErrorHandlingExample() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleLogin = async (username: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const user = await apiService.getUserByUsername(username)
      
      // Simulate password check (in real app, this would be handled by backend)
      if (password === 'correct_password') {
        toast.success('Login successful!')
        // Handle successful login
      } else {
        throw new Error('Invalid password')
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button 
        onClick={() => handleLogin('testuser', 'wrong_password')}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}
    </div>
  )
}
