import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CosmosDbService } from '../services/cosmosDbService';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserRequest, UpdateUserRequest, ApiResponse, User } from '../models/types';

const cosmosDb = new CosmosDbService();

// Get user by ID
export async function getUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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

    const user = await cosmosDb.getUserById(userId);
    
    if (!user) {
      return {
        status: 404,
        body: JSON.stringify({
          success: false,
          error: 'User not found'
        } as ApiResponse<null>)
      };
    }

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: user
      } as ApiResponse<User>)
    };
  } catch (error) {
    context.error('Error getting user:', error);
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>)
    };
  }
}

// Create user
export async function createUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const requestBody = await request.json() as CreateUserRequest;
    
    if (!requestBody.email || !requestBody.username || !requestBody.displayName) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'Email, username, and display name are required'
        } as ApiResponse<null>)
      };
    }

    // Check if email already exists
    const existingUserByEmail = await cosmosDb.getUserByEmail(requestBody.email);
    if (existingUserByEmail) {
      return {
        status: 409,
        body: JSON.stringify({
          success: false,
          error: 'Email already exists'
        } as ApiResponse<null>)
      };
    }

    // Check if username already exists
    const existingUserByUsername = await cosmosDb.getUserByUsername(requestBody.username);
    if (existingUserByUsername) {
      return {
        status: 409,
        body: JSON.stringify({
          success: false,
          error: 'Username already exists'
        } as ApiResponse<null>)
      };
    }

    const newUser: User = {
      id: uuidv4(),
      email: requestBody.email,
      username: requestBody.username,
      displayName: requestBody.displayName,
      avatar: requestBody.avatar,
      bio: requestBody.bio,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createdUser = await cosmosDb.createUser(newUser);

    return {
      status: 201,
      body: JSON.stringify({
        success: true,
        data: createdUser,
        message: 'User created successfully'
      } as ApiResponse<User>)
    };
  } catch (error) {
    context.error('Error creating user:', error);
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>)
    };
  }
}

// Update user
export async function updateUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = request.params.userId;
    const requestBody = await request.json() as UpdateUserRequest;
    
    if (!userId) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'User ID is required'
        } as ApiResponse<null>)
      };
    }

    const existingUser = await cosmosDb.getUserById(userId);
    if (!existingUser) {
      return {
        status: 404,
        body: JSON.stringify({
          success: false,
          error: 'User not found'
        } as ApiResponse<null>)
      };
    }

    // Check if username is being updated and if it already exists
    if (requestBody.username && requestBody.username !== existingUser.username) {
      const existingUserByUsername = await cosmosDb.getUserByUsername(requestBody.username);
      if (existingUserByUsername) {
        return {
          status: 409,
          body: JSON.stringify({
            success: false,
            error: 'Username already exists'
          } as ApiResponse<null>)
        };
      }
    }

    const updatedUser = await cosmosDb.updateUser(userId, {
      ...existingUser,
      ...requestBody
    });

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      } as ApiResponse<User>)
    };
  } catch (error) {
    context.error('Error updating user:', error);
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>)
    };
  }
}

// Delete user
export async function deleteUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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

    const existingUser = await cosmosDb.getUserById(userId);
    if (!existingUser) {
      return {
        status: 404,
        body: JSON.stringify({
          success: false,
          error: 'User not found'
        } as ApiResponse<null>)
      };
    }

    await cosmosDb.deleteUser(userId);

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: 'User deleted successfully'
      } as ApiResponse<null>)
    };
  } catch (error) {
    context.error('Error deleting user:', error);
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
app.http('getUser', {
  methods: ['GET'],
  route: 'users/{userId}',
  authLevel: 'anonymous',
  handler: getUser
});

app.http('createUser', {
  methods: ['POST'],
  route: 'users',
  authLevel: 'anonymous',
  handler: createUser
});

app.http('updateUser', {
  methods: ['PUT'],
  route: 'users/{userId}',
  authLevel: 'anonymous',
  handler: updateUser
});

app.http('deleteUser', {
  methods: ['DELETE'],
  route: 'users/{userId}',
  authLevel: 'anonymous',
  handler: deleteUser
});
