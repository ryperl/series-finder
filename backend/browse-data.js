#!/usr/bin/env node

/**
 * Simple Cosmos DB Data Browser
 * Use this to browse your emulator data from the command line
 */

const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient({
  endpoint: process.env.COSMOS_DB_ENDPOINT || 'http://localhost:8081',
  key: process.env.COSMOS_DB_KEY
});

async function browseData() {
  try {
    console.log('🔍 Cosmos DB Data Browser');
    console.log('========================');
    console.log('');

    // List all databases
    const dbResponse = await client.databases.readAll().fetchAll();
    const databases = dbResponse.resources || [];
    console.log(`📦 Databases (${databases.length}):`);
    
    for (const db of databases) {
      console.log(`  📁 ${db.id}`);
      
      // List containers in each database
      const database = client.database(db.id);
      const containerResponse = await database.containers.readAll().fetchAll();
      const containers = containerResponse.resources || [];
      
      for (const containerDef of containers) {
        const container = database.container(containerDef.id);
        const itemResponse = await container.items.readAll().fetchAll();
        const items = itemResponse.resources || [];
        console.log(`    📄 ${containerDef.id} (${items.length} items)`);
        
        // Show first few items
        if (items.length > 0) {
          console.log(`       First item keys: ${Object.keys(items[0]).join(', ')}`);
        }
      }
    }
    
    console.log('');
    console.log('💡 Commands you can run:');
    console.log('   node browse-data.js                    - Browse all data');
    console.log('   node browse-data.js users              - Browse users container');
    console.log('   node browse-data.js series             - Browse series container');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Handle command line arguments
const containerName = process.argv[2];

async function browseContainer(containerName) {
  try {
    const database = client.database('series-finder-dev');
    const container = database.container(containerName);
    const { resources: items } = await container.items.readAll().fetchAll();
    
    console.log(`🔍 Container: ${containerName}`);
    console.log(`📊 Items: ${items.length}`);
    console.log('');
    
    items.forEach((item, index) => {
      console.log(`📄 Item ${index + 1}:`);
      console.log(JSON.stringify(item, null, 2));
      console.log('');
    });
    
  } catch (error) {
    console.error(`❌ Error browsing ${containerName}:`, error.message);
  }
}

if (containerName) {
  browseContainer(containerName);
} else {
  browseData();
}
