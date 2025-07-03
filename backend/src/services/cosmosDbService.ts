import { CosmosClient, Database, Container } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';

export class CosmosDbService {
  private client: CosmosClient;
  private database: Database;
  private usersContainer: Container;
  private seriesContainer: Container;
  private friendsContainer: Container;
  private favoritesContainer: Container;

  constructor() {
    const endpoint = process.env.COSMOS_DB_ENDPOINT!;
    const databaseName = process.env.COSMOS_DB_DATABASE_NAME!;
    const cosmosKey = process.env.COSMOS_DB_KEY;

    // For local development with emulator, use master key
    // For production, use managed identity
    if (cosmosKey && process.env.NODE_ENV === 'development') {
      console.log('🔧 Using Cosmos DB Emulator with master key');
      this.client = new CosmosClient({
        endpoint,
        key: cosmosKey
      });
    } else {
      console.log('🔐 Using Azure Managed Identity for Cosmos DB');
      // Use managed identity for authentication in production
      const credential = new DefaultAzureCredential();
      this.client = new CosmosClient({
        endpoint,
        aadCredentials: credential
      });
    }

    this.database = this.client.database(databaseName);
    this.usersContainer = this.database.container('users');
    this.seriesContainer = this.database.container('series');
    this.friendsContainer = this.database.container('friends');
    this.favoritesContainer = this.database.container('favorites');
  }

  // User operations
  async createUser(user: any) {
    const { resource } = await this.usersContainer.items.create(user);
    return resource;
  }

  async getUserById(id: string) {
    try {
      const { resource } = await this.usersContainer.item(id, id).read();
      return resource;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async getUserByEmail(email: string) {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: email }]
    };
    
    const { resources } = await this.usersContainer.items.query(querySpec).fetchAll();
    return resources.length > 0 ? resources[0] : null;
  }

  async getUserByUsername(username: string) {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.username = @username',
      parameters: [{ name: '@username', value: username }]
    };
    
    const { resources } = await this.usersContainer.items.query(querySpec).fetchAll();
    return resources.length > 0 ? resources[0] : null;
  }

  async updateUser(id: string, updates: any) {
    const { resource } = await this.usersContainer.item(id, id).replace({
      ...updates,
      updatedAt: new Date()
    });
    return resource;
  }

  async deleteUser(id: string) {
    await this.usersContainer.item(id, id).delete();
  }

  // Series operations
  async createSeries(series: any) {
    const { resource } = await this.seriesContainer.items.create(series);
    return resource;
  }

  async getSeriesById(id: string, userId: string) {
    try {
      const { resource } = await this.seriesContainer.item(id, userId).read();
      return resource;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async getSeriesByUserId(userId: string) {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@userId', value: userId }]
    };
    
    const { resources } = await this.seriesContainer.items.query(querySpec).fetchAll();
    return resources;
  }

  async getRecommendations(userId?: string) {
    let querySpec;
    
    if (userId) {
      // Get recommendations from friends
      querySpec = {
        query: `
          SELECT s.* FROM s 
          JOIN f IN s.friends 
          WHERE s.isRecommendation = true 
          AND f.userId = @userId 
          AND f.status = 'accepted'
          ORDER BY s.likes DESC, s.createdAt DESC
        `,
        parameters: [{ name: '@userId', value: userId }]
      };
    } else {
      // Get all public recommendations
      querySpec = {
        query: 'SELECT * FROM c WHERE c.isRecommendation = true ORDER BY c.likes DESC, c.createdAt DESC'
      };
    }
    
    const { resources } = await this.seriesContainer.items.query(querySpec).fetchAll();
    return resources;
  }

  async updateSeries(id: string, userId: string, updates: any) {
    const { resource } = await this.seriesContainer.item(id, userId).replace({
      ...updates,
      updatedAt: new Date()
    });
    return resource;
  }

  async deleteSeries(id: string, userId: string) {
    await this.seriesContainer.item(id, userId).delete();
  }

  async likeSeries(seriesId: string, seriesUserId: string, userId: string) {
    const series = await this.getSeriesById(seriesId, seriesUserId);
    if (!series) {
      throw new Error('Series not found');
    }

    const likedBy = series.likedBy || [];
    if (!likedBy.includes(userId)) {
      likedBy.push(userId);
      const updatedSeries = {
        ...series,
        likes: (series.likes || 0) + 1,
        likedBy,
        updatedAt: new Date()
      };
      
      return await this.seriesContainer.item(seriesId, seriesUserId).replace(updatedSeries);
    }
    
    return series;
  }

  async unlikeSeries(seriesId: string, seriesUserId: string, userId: string) {
    const series = await this.getSeriesById(seriesId, seriesUserId);
    if (!series) {
      throw new Error('Series not found');
    }

    const likedBy = series.likedBy || [];
    const index = likedBy.indexOf(userId);
    if (index > -1) {
      likedBy.splice(index, 1);
      const updatedSeries = {
        ...series,
        likes: Math.max(0, (series.likes || 0) - 1),
        likedBy,
        updatedAt: new Date()
      };
      
      return await this.seriesContainer.item(seriesId, seriesUserId).replace(updatedSeries);
    }
    
    return series;
  }

  // Friends operations
  async sendFriendRequest(userId: string, friendId: string) {
    const friendRequest = {
      id: `${userId}-${friendId}`,
      userId,
      friendId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const { resource } = await this.friendsContainer.items.create(friendRequest);
    return resource;
  }

  async acceptFriendRequest(userId: string, friendId: string) {
    const friendshipId = `${friendId}-${userId}`;
    const { resource } = await this.friendsContainer.item(friendshipId, userId).replace({
      id: friendshipId,
      userId,
      friendId,
      status: 'accepted',
      updatedAt: new Date()
    });
    
    // Create reverse friendship
    const reverseFriendshipId = `${userId}-${friendId}`;
    await this.friendsContainer.items.create({
      id: reverseFriendshipId,
      userId: friendId,
      friendId: userId,
      status: 'accepted',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return resource;
  }

  async getFriends(userId: string) {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.status = @status',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@status', value: 'accepted' }
      ]
    };
    
    const { resources } = await this.friendsContainer.items.query(querySpec).fetchAll();
    return resources;
  }

  async getFriendRequests(userId: string) {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.friendId = @userId AND c.status = @status',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@status', value: 'pending' }
      ]
    };
    
    const { resources } = await this.friendsContainer.items.query(querySpec).fetchAll();
    return resources;
  }

  async removeFriend(userId: string, friendId: string) {
    try {
      await this.friendsContainer.item(`${userId}-${friendId}`, userId).delete();
      await this.friendsContainer.item(`${friendId}-${userId}`, friendId).delete();
    } catch (error: any) {
      if (error.code !== 404) {
        throw error;
      }
    }
  }

  async addFriend(userId: string, friendId: string) {
    return await this.sendFriendRequest(userId, friendId);
  }

  async rejectFriendRequest(userId: string, friendId: string) {
    const friendshipId = `${friendId}-${userId}`;
    try {
      await this.friendsContainer.item(friendshipId, userId).delete();
    } catch (error: any) {
      if (error.code !== 404) {
        throw error;
      }
    }
  }

  // Favorites operations
  async createFavoriteList(favoriteList: any) {
    const { resource } = await this.favoritesContainer.items.create(favoriteList);
    return resource;
  }

  async getFavoriteListById(id: string, userId: string) {
    try {
      const { resource } = await this.favoritesContainer.item(id, userId).read();
      return resource;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async getFavoriteListsByUserId(userId: string) {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@userId', value: userId }]
    };
    
    const { resources } = await this.favoritesContainer.items.query(querySpec).fetchAll();
    return resources;
  }

  async updateFavoriteList(id: string, userId: string, updates: any) {
    const { resource } = await this.favoritesContainer.item(id, userId).replace({
      ...updates,
      updatedAt: new Date()
    });
    return resource;
  }

  async deleteFavoriteList(id: string, userId: string) {
    await this.favoritesContainer.item(id, userId).delete();
  }
}
