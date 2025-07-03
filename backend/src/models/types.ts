export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Series {
  id: string;
  userId: string;
  title: string;
  description?: string;
  genre: string[];
  releaseYear: number;
  rating: number; // 1-10 scale
  posterUrl?: string;
  status: 'watching' | 'completed' | 'plan-to-watch' | 'dropped';
  review?: string;
  isRecommendation: boolean;
  likes: number;
  likedBy: string[]; // Array of user IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoriteList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  seriesIds: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
}

export interface UpdateUserRequest {
  username?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
}

export interface CreateSeriesRequest {
  title: string;
  description?: string;
  genre: string[];
  releaseYear: number;
  rating: number;
  posterUrl?: string;
  status: 'watching' | 'completed' | 'plan-to-watch' | 'dropped';
  review?: string;
  isRecommendation: boolean;
}

export interface UpdateSeriesRequest {
  title?: string;
  description?: string;
  genre?: string[];
  releaseYear?: number;
  rating?: number;
  posterUrl?: string;
  status?: 'watching' | 'completed' | 'plan-to-watch' | 'dropped';
  review?: string;
  isRecommendation?: boolean;
}

export interface CreateFavoriteListRequest {
  name: string;
  description?: string;
  seriesIds?: string[];
  isPublic: boolean;
}

export interface UpdateFavoriteListRequest {
  name?: string;
  description?: string;
  seriesIds?: string[];
  isPublic?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
