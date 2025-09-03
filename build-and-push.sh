#!/bin/bash
set -e

DOCKER_USER="ganraj99215"

echo " Building frontend image..."
docker build -t $DOCKER_USER/frontend:latest ./frontend

echo " Building backend image..."
docker build -t $DOCKER_USER/backend:latest -f backend/Dockerfile.backend ./backend

echo " Logging into Docker Hub..."
echo "Enter Docker Hub password:"
docker login -u $DOCKER_USER

echo " Pushing images..."
docker push $DOCKER_USER/frontend:latest
docker push $DOCKER_USER/backend:latest

echo " Build & push complete."
