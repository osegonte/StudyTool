#!/bin/bash

echo "🚀 Starting Local Study Planner - Phase 1"
echo "========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the local-study-planner root directory"
fi

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    print_warning "Dependencies not found. Installing..."
    ./scripts/install-deps.sh
fi

# Check if backend file exists
if [ ! -f "backend/src/index.js" ]; then
    print_error "Backend index.js not found. Please create backend/src/index.js first."
fi

# Check if frontend App.js exists
if [ ! -f "frontend/src/App.js" ]; then
    print_error "Frontend App.js not found. Please create frontend/src/App.js first."
fi

# Kill existing processes
print_info "Stopping any existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2

# Create log directory
mkdir -p logs

# Start backend
print_info "Starting backend server..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
print_info "Waiting for backend to initialize..."
sleep 3

# Start frontend
print_info "Starting frontend server..."
cd frontend
BROWSER=none npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend
sleep 5

# Display information
echo ""
echo "🎉 =================================="
echo "🎉  Local Study Planner Started"
echo "🎉 =================================="
print_status "Backend: Running on port 3001"
print_status "Frontend: Running on port 3000"
echo ""
echo "📱 Access Points:"
echo "   • Study Dashboard: http://localhost:3000"
echo "   • API Health: http://localhost:3001/api/health"
echo ""
echo "📜 Logs:"
echo "   • Backend: logs/backend.log"
echo "   • Frontend: logs/frontend.log"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"

# Cleanup function
cleanup() {
    echo ""
    print_info "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    echo "👋 Stopped successfully!"
    exit 0
}

trap cleanup INT TERM EXIT

# Open browser after delay
(sleep 8 && open http://localhost:3000) &

# Monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend died - check logs/backend.log"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend died - check logs/frontend.log"
        break
    fi
    sleep 5
done
