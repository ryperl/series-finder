#!/usr/bin/env node

/**
 * Initialize Cosmos DB Emulator with required database and containers
 * Run this script after starting the Cosmos DB emulator
 */

const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_DB_ENDPOINT || 'http://localhost:8081';
const key = process.env.COSMOS_DB_KEY;
const databaseName = process.env.COSMOS_DB_DATABASE_NAME || 'series-finder-dev';

const client = new CosmosClient({ 
  endpoint, 
  key
});

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing Cosmos DB Emulator...');
    
    // Create database
    console.log(`📦 Creating database: ${databaseName}`);
    const { database } = await client.databases.createIfNotExists({ 
      id: databaseName 
    });
    
    // Create containers
    const containers = [
      { 
        id: 'users', 
        partitionKey: '/id',
        description: 'User profiles and authentication data'
      },
      { 
        id: 'series', 
        partitionKey: '/userId',
        description: 'TV series data for each user'
      },
      { 
        id: 'friends', 
        partitionKey: '/userId',
        description: 'Friend relationships and requests'
      },
      { 
        id: 'favorites', 
        partitionKey: '/userId',
        description: 'User favorite lists'
      }
    ];
    
    for (const containerDef of containers) {
      console.log(`📁 Creating container: ${containerDef.id}`);
      await database.containers.createIfNotExists({
        id: containerDef.id,
        partitionKey: containerDef.partitionKey
      });
      console.log(`   ✅ ${containerDef.description}`);
    }
    
    console.log('');
    console.log('🎉 Cosmos DB Emulator initialized successfully!');
    console.log('');
    console.log('📊 Database: series-finder-dev');
    console.log('📁 Containers: users, series, friends, favorites');
    console.log('🌐 Endpoint: https://localhost:8081');
    console.log('');
    console.log('🚀 You can now start your Azure Functions backend!');
    console.log('   cd /Users/perly/series-finder/backend && npm run start');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.log('');
    console.log('💡 Make sure the Cosmos DB Emulator is running:');
    console.log('   - Download from: https://aka.ms/cosmosdb-emulator');
    console.log('   - Or use Docker: docker run -p 8081:8081 mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator');
    process.exit(1);
  }
}

initializeDatabase();
