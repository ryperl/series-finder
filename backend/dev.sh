#!/bin/bash

# Development helper script for Series Finder Backend
echo "🚀 Series Finder Backend Development Helper"
echo "=========================================="

case "$1" in
  "start")
    echo "📦 Installing dependencies..."
    npm install
    echo "🔨 Building TypeScript..."
    npm run build
    echo "🚀 Starting Azure Functions runtime..."
    npx func start --port 7071
    ;;
  "dev")
    echo "📦 Installing dependencies..."
    npm install
    echo "🔨 Building TypeScript..."
    npm run build
    echo "👀 Starting in watch mode..."
    echo "Open another terminal and run: npm run watch"
    npx func start --port 7071
    ;;
  "init-db")
    echo "🗄️ Initializing Cosmos DB Emulator..."
    node init-db.js
    ;;
  "full-setup")
    echo "🔄 Complete setup with database initialization..."
    echo "📦 Installing dependencies..."
    npm install
    echo "🗄️ Initializing Cosmos DB Emulator..."
    node init-db.js
    echo "🔨 Building TypeScript..."
    npm run build
    echo "🚀 Starting Azure Functions runtime..."
    npx func start --port 7071
    ;;
  "build")
    echo "🔨 Building TypeScript..."
    npm run build
    ;;
  "watch")
    echo "👀 Watching TypeScript files for changes..."
    npm run watch
    ;;
  "clean")
    echo "🧹 Cleaning build artifacts..."
    npm run clean
    ;;
  "browse")
    echo "🔍 Browsing Cosmos DB data..."
    node browse-data.js
    ;;
  "browse-users")
    echo "👥 Browsing users..."
    node browse-data.js users
    ;;
  "browse-series")
    echo "📺 Browsing series..."
    node browse-data.js series
    ;;
  "test")
    echo "🧪 Running tests..."
    npm test
    ;;
  *)
    echo "Usage: $0 {start|dev|init-db|full-setup|build|watch|clean|test|browse|browse-users|browse-series}"
    echo ""
    echo "Commands:"
    echo "  start        - Build and start the backend server"
    echo "  dev          - Start in development mode (run 'watch' in another terminal)"
    echo "  init-db      - Initialize Cosmos DB Emulator database and containers"
    echo "  full-setup   - Complete setup: install deps, init DB, build, and start"
    echo "  build        - Build TypeScript code"
    echo "  watch        - Watch TypeScript files for changes"
    echo "  clean        - Clean build artifacts"
    echo "  test         - Run tests"
    echo "  browse       - Browse all Cosmos DB data"
    echo "  browse-users - Browse users container"
    echo "  browse-series- Browse series container"
    echo ""
    echo "Cosmos DB Emulator workflow:"
    echo "1. Start Cosmos DB Emulator (see instructions below)"
    echo "2. Run './dev.sh init-db' to create database and containers"
    echo "3. Run './dev.sh start' to start the backend server"
    echo ""
    echo "OR use './dev.sh full-setup' to do steps 2-3 automatically"
    echo ""
    echo "Cosmos DB Emulator installation:"
    echo "- macOS: Download from https://aka.ms/cosmosdb-emulator"
    echo "- Docker: docker run -p 8081:8081 mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator"
    exit 1
    ;;
esac
