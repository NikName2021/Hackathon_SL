#!/bin/bash

# University Task Board Deployment Script
set -e

echo "🚀 Starting deployment process..."

# 1. Check for .env file
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "💡 Please create a .env file based on .env.example"
    exit 1
fi

# 2. Update code (optional, uncomment if using Git on server)
# echo "📥 Pulling latest changes from git..."
# git pull origin main

# 3. Stop existing services
echo "🛑 Stopping current services..."
docker compose down --remove-orphans

# 4. Build and start containers
echo "🛠 Building and starting containers..."
docker compose up --build -d

# 5. Post-deployment checks
echo "🔍 Checking service status..."
docker compose ps

# 6. Cleanup unused images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✅ Deployment successful!"
echo "📍 Frontend: http://localhost"
echo "📍 Backend API: http://localhost/api/v1"
echo "📍 Swagger Docs: http://localhost:8000/docs (direct) or through proxy if configured"
