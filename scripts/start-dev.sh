#!/bin/bash

echo "🚀 Starting Local Study Planner Development Environment"
echo "====================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the local-study-planner root directory"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
fi

# Check if dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    print_warning "Frontend dependencies not found. Installing..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    print_warning "Backend dependencies not found. Installing..."
    cd backend && npm install && cd ..
fi

# Create log directory
mkdir -p logs

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 1
    else
        return 0
    fi
}

# Check if ports are available
if ! check_port 3001; then
    print_warning "Port 3001 is already in use. Backend might already be running."
    echo "Do you want to kill the existing process? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        lsof -ti:3001 | xargs kill -9
        print_status "Killed existing process on port 3001"
    else
        print_error "Cannot start backend on port 3001"
    fi
fi

if ! check_port 3000; then
    print_warning "Port 3000 is already in use. Frontend might already be running."
    echo "Do you want to kill the existing process? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        lsof -ti:3000 | xargs kill -9
        print_status "Killed existing process on port 3000"
    else
        print_error "Cannot start frontend on port 3000"
    fi
fi

# Start backend in background
print_info "Starting backend server..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
print_info "Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    # Test backend health endpoint
    if curl -s http://localhost:3001/api/health > /dev/null; then
        print_status "Backend server started successfully on port 3001"
    else
        print_warning "Backend started but health check failed"
    fi
else
    print_error "Backend failed to start. Check logs/backend.log for details"
fi

# Start frontend in background
print_info "Starting frontend development server..."
cd frontend
BROWSER=none npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
print_info "Waiting for frontend to initialize..."
sleep 5

# Check if frontend is running
if kill -0 $FRONTEND_PID 2>/dev/null; then
    print_status "Frontend server started successfully on port 3000"
else
    print_error "Frontend failed to start. Check logs/frontend.log for details"
fi

# Display status
echo ""
echo "🎉 Development environment is running!"
echo "======================================"
print_info "📱 Frontend: http://localhost:3000"
print_info "🖥️  Backend API: http://localhost:3001"
print_info "🔍 Health Check: http://localhost:3001/api/health"
print_info "📁 PDF Storage: $(pwd)/data/pdfs"
echo ""
print_info "📋 Available endpoints:"
echo "     • GET  /api/health - Health check"
echo "     • GET  /api/files - List all PDFs"
echo "     • POST /api/files/upload - Upload PDF"
echo "     • GET  /api/progress/:fileId - Get reading progress"
echo "     • POST /api/progress/:fileId - Update reading progress"
echo ""
print_info "📜 Logs:"
echo "     • Backend: logs/backend.log"
echo "     • Frontend: logs/frontend.log"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to kill both processes on exit
cleanup() {
    echo ""
    print_info "🛑 Stopping servers..."
    
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        print_status "Backend stopped"
    fi
    
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        print_status "Frontend stopped"
    fi
    
    # Clean up any remaining processes
    pkill -f "react-scripts start"
    pkill -f "nodemon"
    
    echo "👋 Development environment stopped"
    exit 0
}

# Set up signal handlers
trap cleanup INT TERM EXIT

# Open browser after a delay
(sleep 8 && open http://localhost:3000) &

# Wait for processes and monitor them
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend process died unexpectedly"
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Frontend process died unexpectedly"
    fi
    
    sleep 5
done