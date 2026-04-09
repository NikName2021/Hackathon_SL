#!/bin/bash

set -euo pipefail

echo "[deploy] starting"

if [ ! -f .env ]; then
  echo "[deploy] .env not found, creating from .env.example"
  cp .env.example .env
fi

echo "[deploy] stopping existing containers"
docker compose down --remove-orphans

echo "[deploy] building and starting"
docker compose up -d --build

echo "[deploy] services"
docker compose ps

echo "[deploy] done"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:8000/api/v1"
echo "Swagger: http://localhost:8000/docs"
