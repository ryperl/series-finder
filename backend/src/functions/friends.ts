import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CosmosDbService } from '../services/cosmosDbService';

const cosmosDbService = new CosmosDbService();

export async function getFriends(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        
        if (!userId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID is required' })
            };
        }

        const friends = await cosmosDbService.getFriends(userId);
        return {
            status: 200,
            body: JSON.stringify(friends)
        };
    } catch (error) {
        context.error('Error getting friends:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

export async function addFriend(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        const friendId = request.params.friendId;
        
        if (!userId || !friendId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID and Friend ID are required' })
            };
        }

        if (userId === friendId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'Cannot add yourself as a friend' })
            };
        }

        const result = await cosmosDbService.addFriend(userId, friendId);
        return {
            status: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        context.error('Error adding friend:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

export async function removeFriend(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        const friendId = request.params.friendId;
        
        if (!userId || !friendId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID and Friend ID are required' })
            };
        }

        await cosmosDbService.removeFriend(userId, friendId);
        return {
            status: 200,
            body: JSON.stringify({ message: 'Friend removed successfully' })
        };
    } catch (error) {
        context.error('Error removing friend:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

export async function getFriendRequests(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        
        if (!userId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID is required' })
            };
        }

        const friendRequests = await cosmosDbService.getFriendRequests(userId);
        return {
            status: 200,
            body: JSON.stringify(friendRequests)
        };
    } catch (error) {
        context.error('Error getting friend requests:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

export async function acceptFriendRequest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        const friendId = request.params.friendId;
        
        if (!userId || !friendId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID and Friend ID are required' })
            };
        }

        const result = await cosmosDbService.acceptFriendRequest(userId, friendId);
        return {
            status: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        context.error('Error accepting friend request:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

export async function rejectFriendRequest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;
        const friendId = request.params.friendId;
        
        if (!userId || !friendId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID and Friend ID are required' })
            };
        }

        await cosmosDbService.rejectFriendRequest(userId, friendId);
        return {
            status: 200,
            body: JSON.stringify({ message: 'Friend request rejected' })
        };
    } catch (error) {
        context.error('Error rejecting friend request:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

// Register HTTP trigger functions
app.http('getFriends', {
    methods: ['GET'],
    route: 'users/{userId}/friends',
    authLevel: 'function',
    handler: getFriends
});

app.http('addFriend', {
    methods: ['POST'],
    route: 'users/{userId}/friends/{friendId}',
    authLevel: 'function',
    handler: addFriend
});

app.http('removeFriend', {
    methods: ['DELETE'],
    route: 'users/{userId}/friends/{friendId}',
    authLevel: 'function',
    handler: removeFriend
});

app.http('getFriendRequests', {
    methods: ['GET'],
    route: 'users/{userId}/friend-requests',
    authLevel: 'function',
    handler: getFriendRequests
});

app.http('acceptFriendRequest', {
    methods: ['POST'],
    route: 'users/{userId}/friend-requests/{friendId}/accept',
    authLevel: 'function',
    handler: acceptFriendRequest
});

app.http('rejectFriendRequest', {
    methods: ['POST'],
    route: 'users/{userId}/friend-requests/{friendId}/reject',
    authLevel: 'function',
    handler: rejectFriendRequest
});
