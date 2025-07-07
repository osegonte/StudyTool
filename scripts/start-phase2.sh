#!/bin/bash

echo "🚀 Starting Local Study Planner - Phase 2"
echo "========================================"
echo "Focus: Time Tracking & Goal Setting"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Kill existing processes
print_info "Stopping any existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2

# Create log directory
mkdir -p logs

# Check dependencies
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    print_warning "Dependencies missing. Installing..."
    ./scripts/install-deps.sh
fi

# Start backend
print_info "Starting Phase 2 backend (Time tracking & Goals)..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to initialize
print_info "Initializing database and time tracking..."
sleep 3

# Start frontend  
print_info "Starting Phase 2 frontend..."
cd frontend
BROWSER=none npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend
sleep 5

# Display Phase 2 specific information
echo ""
echo "🎉 Phase 2 Local Study Planner is running!"
echo "=========================================="
print_status "Time Tracking: Active"
print_status "Goal Setting: Ready"
print_status "Analytics: Available"
echo ""
echo "📱 Access Points:"
echo "   • Main Dashboard: http://localhost:3000"
echo "   • Analytics & Time Tracking: http://localhost:3000/analytics"
echo "   • Goal Setting & Deadlines: http://localhost:3000/goals"
echo ""
echo "⏱️  Phase 2 Features:"
echo "   • Reading time tracker with session management"
echo "   • Reading speed analysis and improvement tracking"
echo "   • Smart time estimation for PDF completion"
echo "   • Deadline-based goal setting with recommendations"
echo "   • Daily/weekly progress analytics"
echo ""
echo "📜 Logs:"
echo "   • Backend: logs/backend.log"
echo "   • Frontend: logs/frontend.log"
echo ""
echo "💡 Tips for Phase 2:"
echo "   1. Start a reading session when you open a PDF"
echo "   2. Let the timer run to build accurate speed data"
echo "   3. Set goals with realistic deadlines"
echo "   4. Check analytics weekly to track improvement"
echo ""
echo "Press Ctrl+C to stop all servers"

# Cleanup function
cleanup() {
    echo ""
    print_info "Stopping Phase 2 servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    echo "👋 Phase 2 stopped. Time tracking data saved!"
    exit 0
}

trap cleanup INT TERM EXIT

# Open browser after delay
(sleep 8 && open http://localhost:3000) &

# Monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend died unexpectedly - check logs/backend.log"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend died unexpectedly - check logs/frontend.log"
        break
    fi
    sleep 5
done
