import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CosmosDbService } from '../services/cosmosDbService';
import { v4 as uuidv4 } from 'uuid';
import { CreateSeriesRequest, UpdateSeriesRequest, ApiResponse, Series } from '../models/types';

const cosmosDb = new CosmosDbService();

// Get series by user ID
export async function getSeriesByUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = request.params.userId;
    
    if (!userId) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'User ID is required'
        } as ApiResponse<null>)
      };
    }

    const series = await cosmosDb.getSeriesByUserId(userId);

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: series
      } as ApiResponse<Series[]>)
    };
  } catch (error) {
    context.error('Error getting series by user:', error);
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>)
    };
  }
}

// Get recommendations
export async function getRecommendations(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = request.query.get('userId');
    
    const recommendations = await cosmosDb.getRecommendations(userId || undefined);

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: recommendations
      } as ApiResponse<Series[]>)
    };
  } catch (error) {
    context.error('Error getting recommendations:', error);
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>)
    };
  }
}

// Create series
export async function createSeries(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = request.params.userId;
    const requestBody = await request.json() as CreateSeriesRequest;
    
    if (!userId) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'User ID is required'
        } as ApiResponse<null>)
      };
    }

    if (!requestBody.title || !requestBody.genre || !requestBody.releaseYear || !requestBody.rating) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'Title, genre, release year, and rating are required'
        } as ApiResponse<null>)
      };
    }

    // Validate rating
    if (requestBody.rating < 1 || requestBody.rating > 10) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'Rating must be between 1 and 10'
        } as ApiResponse<null>)
      };
    }

    const newSeries: Series = {
      id: uuidv4(),
      userId,
      title: requestBody.title,
      description: requestBody.description,
      genre: requestBody.genre,
      releaseYear: requestBody.releaseYear,
      rating: requestBody.rating,
      posterUrl: requestBody.posterUrl,
      status: requestBody.status,
      review: requestBody.review,
      isRecommendation: requestBody.isRecommendation,
      likes: 0,
      likedBy: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createdSeries = await cosmosDb.createSeries(newSeries);

    return {
      status: 201,
      body: JSON.stringify({
        success: true,
        data: createdSeries,
        message: 'Series created successfully'
      } as ApiResponse<Series>)
    };
  } catch (error) {
    context.error('Error creating series:', error);
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>)
    };
  }
}

// Update series
export async function updateSeries(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = request.params.userId;
    const seriesId = request.params.seriesId;
    const requestBody = await request.json() as UpdateSeriesRequest;
    
    if (!userId || !seriesId) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'User ID and Series ID are required'
        } as ApiResponse<null>)
      };
    }

    const existingSeries = await cosmosDb.getSeriesById(seriesId, userId);
    if (!existingSeries) {
      return {
        status: 404,
        body: JSON.stringify({
          success: false,
          error: 'Series not found'
        } as ApiResponse<null>)
      };
    }

    // Validate rating if provided
    if (requestBody.rating && (requestBody.rating < 1 || requestBody.rating > 10)) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'Rating must be between 1 and 10'
        } as ApiResponse<null>)
      };
    }

    const updatedSeries = await cosmosDb.updateSeries(seriesId, userId, {
      ...existingSeries,
      ...requestBody
    });

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: updatedSeries,
        message: 'Series updated successfully'
      } as ApiResponse<Series>)
    };
  } catch (error) {
    context.error('Error updating series:', error);
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>)
    };
  }
}

// Delete series
export async function deleteSeries(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = request.params.userId;
    const seriesId = request.params.seriesId;
    
    if (!userId || !seriesId) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'User ID and Series ID are required'
        } as ApiResponse<null>)
      };
    }

    const existingSeries = await cosmosDb.getSeriesById(seriesId, userId);
    if (!existingSeries) {
      return {
        status: 404,
        body: JSON.stringify({
          success: false,
          error: 'Series not found'
        } as ApiResponse<null>)
      };
    }

    await cosmosDb.deleteSeries(seriesId, userId);

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: 'Series deleted successfully'
      } as ApiResponse<null>)
    };
  } catch (error) {
    context.error('Error deleting series:', error);
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>)
    };
  }
}

// Like series
export async function likeSeries(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = request.params.userId;
    const seriesId = request.params.seriesId;
    const seriesUserId = request.params.seriesUserId;
    
    if (!userId || !seriesId || !seriesUserId) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'User ID, Series ID, and Series User ID are required'
        } as ApiResponse<null>)
      };
    }

    const updatedSeries = await cosmosDb.likeSeries(seriesId, seriesUserId, userId);

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: updatedSeries,
        message: 'Series liked successfully'
      } as ApiResponse<Series>)
    };
  } catch (error) {
    context.error('Error liking series:', error);
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>)
    };
  }
}

// Unlike series
export async function unlikeSeries(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = request.params.userId;
    const seriesId = request.params.seriesId;
    const seriesUserId = request.params.seriesUserId;
    
    if (!userId || !seriesId || !seriesUserId) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'User ID, Series ID, and Series User ID are required'
        } as ApiResponse<null>)
      };
    }

    const updatedSeries = await cosmosDb.unlikeSeries(seriesId, seriesUserId, userId);

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: updatedSeries,
        message: 'Series unliked successfully'
      } as ApiResponse<Series>)
    };
  } catch (error) {
    context.error('Error unliking series:', error);
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>)
    };
  }
}

// Register HTTP routes
app.http('getSeriesByUser', {
  methods: ['GET'],
  route: 'users/{userId}/series',
  authLevel: 'anonymous',
  handler: getSeriesByUser
});

app.http('getRecommendations', {
  methods: ['GET'],
  route: 'recommendations',
  authLevel: 'anonymous',
  handler: getRecommendations
});

app.http('createSeries', {
  methods: ['POST'],
  route: 'users/{userId}/series',
  authLevel: 'anonymous',
  handler: createSeries
});

app.http('updateSeries', {
  methods: ['PUT'],
  route: 'users/{userId}/series/{seriesId}',
  authLevel: 'anonymous',
  handler: updateSeries
});

app.http('deleteSeries', {
  methods: ['DELETE'],
  route: 'users/{userId}/series/{seriesId}',
  authLevel: 'anonymous',
  handler: deleteSeries
});

app.http('likeSeries', {
  methods: ['POST'],
  route: 'users/{userId}/like/{seriesUserId}/series/{seriesId}',
  authLevel: 'anonymous',
  handler: likeSeries
});

app.http('unlikeSeries', {
  methods: ['DELETE'],
  route: 'users/{userId}/like/{seriesUserId}/series/{seriesId}',
  authLevel: 'anonymous',
  handler: unlikeSeries
});
