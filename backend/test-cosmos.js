#!/usr/bin/env node

/**
 * Simple Cosmos DB Emulator connection test
 */

const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_DB_ENDPOINT || 'https://localhost:8081';
const key = process.env.COSMOS_DB_KEY;

console.log('🔍 Testing Cosmos DB Emulator Connection...');
console.log(`📍 Endpoint: ${endpoint}`);
console.log('');

// Test with different configurations
async function testConnection() {
  const configs = [
    {
      name: 'Standard Config',
      config: { endpoint, key }
    },
    {
      name: 'With SSL Disabled',
      config: { 
        endpoint, 
        key,
        connectionPolicy: {
          disableSSLVerification: true
        }
      }
    },
    {
      name: 'With Agent Override',
      config: { 
        endpoint, 
        key,
        agent: { rejectUnauthorized: false }
      }
    }
  ];

  for (const test of configs) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      const client = new CosmosClient(test.config);
      
      // Simple connectivity test
      const { databases } = await client.databases.readAll().fetchAll();
      console.log(`   ✅ Success! Found ${databases.length} database(s)`);
      
      // List existing databases
      if (databases.length > 0) {
        console.log(`   📦 Existing databases:`);
        databases.forEach(db => console.log(`      - ${db.id}`));
      }
      
      return client; // Return successful client
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      if (error.code) {
        console.log(`   📄 Error Code: ${error.code}`);
      }
    }
    console.log('');
  }
  
  return null;
}

async function checkEmulatorStatus() {
  console.log('🔍 Checking if Cosmos DB Emulator is running...');
  
  try {
    const response = await fetch('https://localhost:8081/_explorer/emulator.js', {
      method: 'GET',
      // Ignore SSL errors for emulator
      agent: { rejectUnauthorized: false }
    });
    
    if (response.ok) {
      console.log('✅ Cosmos DB Emulator is running and accessible');
      return true;
    } else {
      console.log(`❌ Emulator responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Cannot reach emulator: ${error.message}`);
    return false;
  }
}

async function main() {
  // First check if emulator is running
  const isRunning = await checkEmulatorStatus();
  console.log('');
  
  if (!isRunning) {
    console.log('💡 Cosmos DB Emulator is not running. Please start it:');
    console.log('');
    console.log('🐳 Docker (Recommended):');
    console.log('   docker run -p 8081:8081 -p 8900:8900 \\');
    console.log('     --name cosmos-emulator \\');
    console.log('     -e AZURE_COSMOS_EMULATOR_PARTITION_COUNT=10 \\');
    console.log('     -it mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator');
    console.log('');
    console.log('💻 Native macOS:');
    console.log('   Download from: https://aka.ms/cosmosdb-emulator');
    console.log('');
    return;
  }
  
  // Test connection
  const client = await testConnection();
  
  if (client) {
    console.log('🎉 Connection successful! You can now:');
    console.log('   1. Run: ./dev.sh init-db');
    console.log('   2. Run: ./dev.sh start');
  } else {
    console.log('❌ All connection attempts failed.');
    console.log('');
    console.log('🔧 Troubleshooting steps:');
    console.log('   1. Ensure emulator is running on port 8081');
    console.log('   2. Try restarting the emulator');
    console.log('   3. Check if another process is using port 8081');
    console.log('      Command: lsof -i :8081');
  }
}

main().catch(console.error);
