#!/bin/bash

# Digital Ocean Deployment Script for Elix Star Live
# This script helps deploy your application to Digital Ocean

echo "🚀 Starting Digital Ocean deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose not found. Trying 'docker compose' instead..."
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Build the Docker image
print_status "Building Docker image..."
docker build -t elix-star-live .

if [ $? -eq 0 ]; then
    print_status "Docker image built successfully!"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Run with Docker Compose
print_status "Starting application with Docker Compose..."
$DOCKER_COMPOSE up -d

if [ $? -eq 0 ]; then
    print_status "Application started successfully!"
    print_status "Your app should be available at: http://localhost:3000"
    print_status "If using nginx proxy: http://localhost:80"
else
    print_error "Failed to start application"
    exit 1
fi

print_status "Deployment complete! 🎉"
print_status "To view logs: $DOCKER_COMPOSE logs -f"
print_status "To stop: $DOCKER_COMPOSE down"