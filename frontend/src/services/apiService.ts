// API configuration and utility functions
export const API_BASE_URL = import.meta.env.PROD
  ? 'https://your-function-app.azurewebsites.net/api'
  : 'http://localhost:7071/api';

// Custom error classes for better error handling
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public endpoint: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public endpoint: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Series {
  id: string;
  userId: string;
  title: string;
  description: string;
  genre: string;
  status: 'watching' | 'completed' | 'plan-to-watch' | 'dropped';
  rating?: number;
  episodes?: number;
  currentEpisode?: number;
  imageUrl?: string;
  year?: number;
  isRecommendation: boolean;
  likes: number;
  likedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoriteList {
  id: string;
  userId: string;
  name: string;
  description: string;
  series: Array<{ id: string; addedAt: Date }>;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}, retries = 3): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });

        // Handle different HTTP status codes
        if (response.ok) {
          // Check if response has content
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return await response.json();
          } else {
            return null; // For DELETE requests or empty responses
          }
        }

        // Handle specific error status codes
        let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response body is not JSON, use default message
        }

        switch (response.status) {
          case 400:
            throw new ValidationError(errorMessage);
          case 401:
            throw new ApiError(401, 'Unauthorized', 'Authentication required', endpoint);
          case 403:
            throw new ApiError(403, 'Forbidden', 'Access denied', endpoint);
          case 404:
            throw new ApiError(404, 'Not Found', `Resource not found: ${endpoint}`, endpoint);
          case 409:
            throw new ApiError(
              response.status,
              response.statusText,
              errorMessage,
              endpoint
            );
          case 429:
            // Rate limiting - retry after delay
            if (attempt < retries) {
              await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
              continue;
            }
            throw new ApiError(429, 'Too Many Requests', 'Rate limit exceeded', endpoint);
          case 500:
            throw new ApiError(500, 'Internal Server Error', 'Server error occurred', endpoint);
          case 502:
          case 503:
          case 504:
            // Server errors - retry with exponential backoff
            if (attempt < retries) {
              await this.delay(Math.pow(2, attempt) * 1000);
              continue;
            }
            throw new ApiError(response.status, response.statusText, 'Service temporarily unavailable', endpoint);
          default:
            throw new ApiError(response.status, response.statusText, errorMessage, endpoint);
        }
      } catch (error) {
        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          if (attempt < retries) {
            await this.delay(Math.pow(2, attempt) * 1000);
            continue;
          }
          throw new NetworkError('Network connection failed. Please check your internet connection.', endpoint);
        }
        
        // Re-throw our custom errors
        if (error instanceof ApiError || error instanceof ValidationError || error instanceof NetworkError) {
          throw error;
        }
        
        // Handle unexpected errors
        console.error('Unexpected error in API request:', error);
        throw new Error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    // Use shorter delays in test environment
    const testDelay = import.meta.env.MODE === 'test' ? ms / 10 : ms;
    return new Promise(resolve => setTimeout(resolve, testDelay));
  }

  // Helper method to validate required fields
  private validateRequired(data: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new ValidationError(`${field} is required`, field);
      }
    }
  }

  // User API methods
  async createUser(userData: Partial<User>): Promise<User> {
    this.validateRequired(userData, ['username', 'email', 'displayName']);
    
    try {
      return await this.request('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        throw new ValidationError('Username or email already exists');
      }
      throw error;
    }
  }

  async getUser(id: string): Promise<User> {
    if (!id) {
      throw new ValidationError('User ID is required');
    }
    
    try {
      return await this.request(`/users/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ValidationError('User not found');
      }
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User> {
    if (!email) {
      throw new ValidationError('Email is required');
    }
    
    try {
      return await this.request(`/users/email/${encodeURIComponent(email)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ValidationError('User with this email not found');
      }
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User> {
    if (!username) {
      throw new ValidationError('Username is required');
    }
    
    try {
      return await this.request(`/users/username/${encodeURIComponent(username)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ValidationError('User with this username not found');
      }
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (!id) {
      throw new ValidationError('User ID is required');
    }
    if (!updates || Object.keys(updates).length === 0) {
      throw new ValidationError('Update data is required');
    }
    
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string): Promise<void> {
    if (!id) {
      throw new ValidationError('User ID is required');
    }
    
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Series API methods
  async createSeries(seriesData: Partial<Series>): Promise<Series> {
    this.validateRequired(seriesData, ['title', 'userId', 'genre']);
    
    return this.request('/series', {
      method: 'POST',
      body: JSON.stringify(seriesData),
    });
  }

  async getSeries(id: string, userId: string): Promise<Series> {
    if (!id || !userId) {
      throw new ValidationError('Series ID and User ID are required');
    }
    
    return this.request(`/series/${id}/${userId}`);
  }

  async getUserSeries(userId: string): Promise<Series[]> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    try {
      return await this.request(`/series/user/${userId}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return []; // Return empty array if user has no series
      }
      throw error;
    }
  }

  async getRecommendations(userId?: string): Promise<Series[]> {
    const endpoint = userId ? `/series/recommendations/${userId}` : '/series/recommendations';
    
    try {
      return await this.request(endpoint);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return []; // Return empty array if no recommendations found
      }
      throw error;
    }
  }

  async updateSeries(id: string, userId: string, updates: Partial<Series>): Promise<Series> {
    if (!id || !userId) {
      throw new ValidationError('Series ID and User ID are required');
    }
    if (!updates || Object.keys(updates).length === 0) {
      throw new ValidationError('Update data is required');
    }
    
    return this.request(`/series/${id}/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSeries(id: string, userId: string): Promise<void> {
    if (!id || !userId) {
      throw new ValidationError('Series ID and User ID are required');
    }
    
    return this.request(`/series/${id}/${userId}`, {
      method: 'DELETE',
    });
  }

  async likeSeries(seriesId: string, seriesUserId: string, userId: string): Promise<Series> {
    if (!seriesId || !seriesUserId || !userId) {
      throw new ValidationError('Series ID, Series User ID, and User ID are required');
    }
    
    return this.request(`/series/${seriesId}/${seriesUserId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async unlikeSeries(seriesId: string, seriesUserId: string, userId: string): Promise<Series> {
    if (!seriesId || !seriesUserId || !userId) {
      throw new ValidationError('Series ID, Series User ID, and User ID are required');
    }
    
    return this.request(`/series/${seriesId}/${seriesUserId}/unlike`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Friends API methods
  async getFriends(userId: string): Promise<Friend[]> {
    return this.request(`/users/${userId}/friends`);
  }

  async addFriend(userId: string, friendId: string): Promise<Friend> {
    return this.request(`/users/${userId}/friends/${friendId}`, {
      method: 'POST',
    });
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    return this.request(`/users/${userId}/friends/${friendId}`, {
      method: 'DELETE',
    });
  }

  async getFriendRequests(userId: string): Promise<Friend[]> {
    return this.request(`/users/${userId}/friend-requests`);
  }

  async acceptFriendRequest(userId: string, friendId: string): Promise<Friend> {
    return this.request(`/users/${userId}/friend-requests/${friendId}/accept`, {
      method: 'POST',
    });
  }

  async rejectFriendRequest(userId: string, friendId: string): Promise<void> {
    return this.request(`/users/${userId}/friend-requests/${friendId}/reject`, {
      method: 'POST',
    });
  }

  // Favorites API methods
  async createFavoriteList(userId: string, listData: Partial<FavoriteList>): Promise<FavoriteList> {
    return this.request(`/users/${userId}/favorites`, {
      method: 'POST',
      body: JSON.stringify(listData),
    });
  }

  async getFavoriteLists(userId: string): Promise<FavoriteList[]> {
    return this.request(`/users/${userId}/favorites`);
  }

  async getFavoriteList(userId: string, listId: string): Promise<FavoriteList> {
    return this.request(`/users/${userId}/favorites/${listId}`);
  }

  async updateFavoriteList(userId: string, listId: string, updates: Partial<FavoriteList>): Promise<FavoriteList> {
    return this.request(`/users/${userId}/favorites/${listId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteFavoriteList(userId: string, listId: string): Promise<void> {
    return this.request(`/users/${userId}/favorites/${listId}`, {
      method: 'DELETE',
    });
  }

  async addSeriesToFavoriteList(userId: string, listId: string, seriesId: string): Promise<FavoriteList> {
    return this.request(`/users/${userId}/favorites/${listId}/series`, {
      method: 'POST',
      body: JSON.stringify({ seriesId }),
    });
  }

  async removeSeriFromFavoriteList(userId: string, listId: string, seriesId: string): Promise<FavoriteList> {
    return this.request(`/users/${userId}/favorites/${listId}/series/${seriesId}`, {
      method: 'DELETE',
    });
  }
}

// Utility function to get user-friendly error messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message;
  }
  
  if (error instanceof NetworkError) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'A server error occurred. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'The service is temporarily unavailable. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
}

// Utility function to check if an error is retryable
export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }
  
  if (error instanceof ApiError) {
    return [408, 429, 502, 503, 504].includes(error.status);
  }
  
  return false;
}

export const apiService = new ApiService();
