# TV Series Finder

A modern web application for discovering, tracking, and sharing TV series with friends. Built with React, TypeScript, Azure Functions, and Azure Cosmos DB.

## Features

- **User Authentication**: Register and login functionality
- **Series Management**: Add, edit, and track your favorite TV series
- **Social Features**: Connect with friends and see what they're watching
- **Recommendations**: Discover new series from the community
- **Favorites Lists**: Create custom lists of your favorite series
- **Ratings & Likes**: Rate series and like recommendations from friends

## Technology Stack

### Frontend

- **React 18** with TypeScript
- **Styled Components** for styling
- **React Router** for navigation
- **Vite** for build tooling
- **React Query** for data fetching
- **React Hot Toast** for notifications

### Backend

- **Azure Functions** (TypeScript)
- **Azure Cosmos DB** for data storage
- **Azure Storage** for file uploads
- **Managed Identity** for secure authentication

### Infrastructure

- **Azure Static Web Apps** for frontend hosting
- **Azure Function App** for backend APIs
- **Azure Cosmos DB** with containers for users, series, friends, and favorites
- **Application Insights** for monitoring
- **Azure Key Vault** for secrets management

## Project Structure

``` text
series-finder/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts (auth, etc.)
│   │   └── services/      # API service layer
├── backend/               # Azure Functions
│   ├── src/
│   │   ├── functions/     # HTTP trigger functions
│   │   ├── services/      # Business logic services
│   │   └── models/        # Type definitions
├── infra/                 # Infrastructure as Code (Bicep)
│   ├── main.bicep         # Main infrastructure template
│   └── main.parameters.json # Infrastructure parameters
└── azure.yaml             # Azure Developer CLI configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- Azure CLI
- Azure Developer CLI (azd)
- Azure subscription

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd series-finder
   ```

2. **Install dependencies**

   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

3. **Start the development servers**

   **Backend (Terminal 1):**

   ```bash
   cd backend
   npm start
   ```

   The Azure Functions will be available at `http://localhost:7071`

   **Frontend (Terminal 2):**

   ```bash
   cd frontend
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

4. **Access the application**

   Open your browser and navigate to `http://localhost:3000`

### Getting Started with the App

1. **Create a new account**:
   - Click "Register" or go to `http://localhost:3000/register`
   - Fill out the registration form:
     - Username (unique)
     - Email
     - Display Name
     - Password
     - Bio (optional)
   - Submit to create your account and automatically log in

2. **Or log in with existing account**:
   - Click "Login" or go to `http://localhost:3000/login`
   - Enter your username/email and password
   - Submit to access your dashboard

3. **Start using the app**:
   - Add TV series you're watching
   - Connect with friends
   - Create favorite lists
   - Discover new series from recommendations

**Note**: For local development, the app uses mock authentication and stores data locally. No Azure resources are required for local development.

### Deployment to Azure

1. **Initialize Azure Developer CLI**

   ```bash
   azd init
   ```

2. **Deploy to Azure**

   ```bash
   azd up
   ```

This will:

- Create all Azure resources using Bicep templates
- Deploy the backend functions
- Build and deploy the frontend to Azure Static Web Apps
- Configure all necessary connections and permissions

## API Endpoints

### Users

- `POST /api/users` - Create user
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users/email/{email}` - Get user by email
- `GET /api/users/username/{username}` - Get user by username
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### TV Series

- `POST /api/series` - Create series
- `GET /api/series/{id}/{userId}` - Get series by ID
- `GET /api/series/user/{userId}` - Get user's series
- `GET /api/series/recommendations` - Get recommendations
- `GET /api/series/recommendations/{userId}` - Get personalized recommendations
- `PUT /api/series/{id}/{userId}` - Update series
- `DELETE /api/series/{id}/{userId}` - Delete series
- `POST /api/series/{seriesId}/{seriesUserId}/like` - Like series
- `POST /api/series/{seriesId}/{seriesUserId}/unlike` - Unlike series

### Friends

- `GET /api/users/{userId}/friends` - Get friends
- `POST /api/users/{userId}/friends/{friendId}` - Send friend request
- `DELETE /api/users/{userId}/friends/{friendId}` - Remove friend
- `GET /api/users/{userId}/friend-requests` - Get friend requests
- `POST /api/users/{userId}/friend-requests/{friendId}/accept` - Accept friend request
- `POST /api/users/{userId}/friend-requests/{friendId}/reject` - Reject friend request

### Favorites

- `POST /api/users/{userId}/favorites` - Create favorite list
- `GET /api/users/{userId}/favorites` - Get favorite lists
- `GET /api/users/{userId}/favorites/{listId}` - Get favorite list
- `PUT /api/users/{userId}/favorites/{listId}` - Update favorite list
- `DELETE /api/users/{userId}/favorites/{listId}` - Delete favorite list
- `POST /api/users/{userId}/favorites/{listId}/series` - Add series to list
- `DELETE /api/users/{userId}/favorites/{listId}/series/{seriesId}` - Remove series from list

## Data Models

### User

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### TV Series Data

```typescript
interface Series {
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
```

## Environment Variables

### Frontend Configuration

- `VITE_API_BASE_URL` - Backend API base URL

### Backend Configuration

- `COSMOS_DB_ENDPOINT` - Cosmos DB endpoint
- `COSMOS_DB_DATABASE_NAME` - Cosmos DB database name

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Azure Architecture

The application follows Azure Well-Architected Framework principles:

- **Reliability**: Multi-region deployment capabilities, Azure Cosmos DB global distribution
- **Security**: Managed Identity for authentication, Key Vault for secrets, HTTPS everywhere
- **Cost Optimization**: Serverless functions scale to zero, consumption-based pricing
- **Operational Excellence**: Application Insights monitoring, automated deployments with azd
- **Performance**: CDN for static assets, optimized database queries, React code splitting

## Next Steps

- [ ] Add image upload functionality for series posters
- [ ] Implement real-time notifications
- [ ] Add search and filtering capabilities
- [ ] Implement user activity feeds
- [ ] Add email notifications for friend requests
- [ ] Implement OAuth providers (Google, Microsoft)
- [ ] Add mobile app support
- [ ] Implement advanced recommendation algorithms
