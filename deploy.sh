#!/bin/bash

# Set script to exit on error
set -e

echo "🚀 Stopping and removing existing containers (but not volumes)..."
docker-compose down  # This stops the containers but keeps the volumes

echo "🧹 Removing old Docker images..."
docker rmi $(docker images -q) -f || true  # Force remove images (if any)

echo "🐳 Building and starting Docker containers..."
docker-compose up -d --build

echo "⏳ Waiting for PostgreSQL to be ready..."
while ! docker exec db_container pg_isready -U postgres >/dev/null 2>&1; do
  echo "⏳ Waiting for database..."
  sleep 2
done

echo "✅ Database is ready!"

echo "📜 Running database migrations (if applicable)..."
docker exec -it $(docker ps -qf "name=app") npm run migration:run

echo "🎉 Deployment complete! Your application is running."
docker ps
