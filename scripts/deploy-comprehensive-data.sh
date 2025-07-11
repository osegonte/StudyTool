#!/bin/bash

# Comprehensive Study Planner Deployment Script
set -e

echo "🚀 Deploying Local Study Planner with all features..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    print_warning "PostgreSQL is not running. Please start PostgreSQL first."
    echo "On macOS: brew services start postgresql"
    echo "On Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create database if it doesn't exist
print_status "Setting up database..."
createdb study_planner 2>/dev/null || print_warning "Database already exists"

# Run migrations
print_status "Running database migrations..."
cd backend
node src/migrate.js
cd ..

print_status "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

print_status "Starting frontend development server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Local Study Planner is now running!"
echo ""
echo "📊 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "⏹️  To stop: Press Ctrl+C"

# Cleanup function
cleanup() {
    echo ""
    print_status "Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT

# Wait for user to stop
wait
