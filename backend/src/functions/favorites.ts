import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CosmosDbService } from '../services/cosmosDbService';

const cosmosDbService = new CosmosDbService();

export async function createFavoriteList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        const body = await request.json() as any;
        
        if (!userId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID is required' })
            };
        }

        if (!body.name) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'List name is required' })
            };
        }

        const favoriteList = {
            id: `${userId}-${Date.now()}`,
            userId,
            name: body.name,
            description: body.description || '',
            series: body.series || [],
            isPublic: body.isPublic || false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await cosmosDbService.createFavoriteList(favoriteList);
        return {
            status: 201,
            body: JSON.stringify(result)
        };
    } catch (error) {
        context.error('Error creating favorite list:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

export async function getFavoriteLists(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        
        if (!userId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID is required' })
            };
        }

        const favoriteLists = await cosmosDbService.getFavoriteListsByUserId(userId);
        return {
            status: 200,
            body: JSON.stringify(favoriteLists)
        };
    } catch (error) {
        context.error('Error getting favorite lists:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

export async function getFavoriteList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        const listId = request.params.listId;
        
        if (!userId || !listId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID and List ID are required' })
            };
        }

        const favoriteList = await cosmosDbService.getFavoriteListById(listId, userId);
        
        if (!favoriteList) {
            return {
                status: 404,
                body: JSON.stringify({ error: 'Favorite list not found' })
            };
        }

        return {
            status: 200,
            body: JSON.stringify(favoriteList)
        };
    } catch (error) {
        context.error('Error getting favorite list:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

export async function updateFavoriteList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        const listId = request.params.listId;
        const body = await request.json() as any;
        
        if (!userId || !listId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID and List ID are required' })
            };
        }

        const existingList = await cosmosDbService.getFavoriteListById(listId, userId);
        if (!existingList) {
            return {
                status: 404,
                body: JSON.stringify({ error: 'Favorite list not found' })
            };
        }

        const updates = {
            ...existingList,
            ...body,
            id: listId,
            userId,
            updatedAt: new Date()
        };

        const result = await cosmosDbService.updateFavoriteList(listId, userId, updates);
        return {
            status: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        context.error('Error updating favorite list:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

export async function deleteFavoriteList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        const listId = request.params.listId;
        
        if (!userId || !listId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID and List ID are required' })
            };
        }

        const existingList = await cosmosDbService.getFavoriteListById(listId, userId);
        if (!existingList) {
            return {
                status: 404,
                body: JSON.stringify({ error: 'Favorite list not found' })
            };
        }

        await cosmosDbService.deleteFavoriteList(listId, userId);
        return {
            status: 200,
            body: JSON.stringify({ message: 'Favorite list deleted successfully' })
        };
    } catch (error) {
        context.error('Error deleting favorite list:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

export async function addSeriesToFavoriteList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        const listId = request.params.listId;
        const body = await request.json() as any;
        
        if (!userId || !listId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID and List ID are required' })
            };
        }

        if (!body.seriesId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'Series ID is required' })
            };
        }

        const favoriteList = await cosmosDbService.getFavoriteListById(listId, userId);
        if (!favoriteList) {
            return {
                status: 404,
                body: JSON.stringify({ error: 'Favorite list not found' })
            };
        }

        const series = favoriteList.series || [];
        if (!series.some((s: any) => s.id === body.seriesId)) {
            series.push({
                id: body.seriesId,
                addedAt: new Date()
            });
        }

        const updates = {
            ...favoriteList,
            series,
            updatedAt: new Date()
        };

        const result = await cosmosDbService.updateFavoriteList(listId, userId, updates);
        return {
            status: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        context.error('Error adding series to favorite list:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

export async function removeSeriFromFavoriteList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        const listId = request.params.listId;
        const seriesId = request.params.seriesId;
        
        if (!userId || !listId || !seriesId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID, List ID, and Series ID are required' })
            };
        }

        const favoriteList = await cosmosDbService.getFavoriteListById(listId, userId);
        if (!favoriteList) {
            return {
                status: 404,
                body: JSON.stringify({ error: 'Favorite list not found' })
            };
        }

        const series = favoriteList.series || [];
        const updatedSeries = series.filter((s: any) => s.id !== seriesId);

        const updates = {
            ...favoriteList,
            series: updatedSeries,
            updatedAt: new Date()
        };

        const result = await cosmosDbService.updateFavoriteList(listId, userId, updates);
        return {
            status: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        context.error('Error removing series from favorite list:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

// Register HTTP trigger functions
app.http('createFavoriteList', {
    methods: ['POST'],
    route: 'users/{userId}/favorites',
    authLevel: 'function',
    handler: createFavoriteList
});

app.http('getFavoriteLists', {
    methods: ['GET'],
    route: 'users/{userId}/favorites',
    authLevel: 'function',
    handler: getFavoriteLists
});

app.http('getFavoriteList', {
    methods: ['GET'],
    route: 'users/{userId}/favorites/{listId}',
    authLevel: 'function',
    handler: getFavoriteList
});

app.http('updateFavoriteList', {
    methods: ['PUT'],
    route: 'users/{userId}/favorites/{listId}',
    authLevel: 'function',
    handler: updateFavoriteList
});

app.http('deleteFavoriteList', {
    methods: ['DELETE'],
    route: 'users/{userId}/favorites/{listId}',
    authLevel: 'function',
    handler: deleteFavoriteList
});

app.http('addSeriesToFavoriteList', {
    methods: ['POST'],
    route: 'users/{userId}/favorites/{listId}/series',
    authLevel: 'function',
    handler: addSeriesToFavoriteList
});

app.http('removeSeriFromFavoriteList', {
    methods: ['DELETE'],
    route: 'users/{userId}/favorites/{listId}/series/{seriesId}',
    authLevel: 'function',
    handler: removeSeriFromFavoriteList
});
