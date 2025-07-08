#!/bin/bash

echo "🍎 Deploying Apple HIG-Inspired Stage 3 Design"
echo "============================================="

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

print_info "Stopping current servers..."

# Stop existing servers
pkill -f "nodemon" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

sleep 3

print_status "Servers stopped"

print_info "Starting backend with Stage 3 APIs..."

# Create log directory
mkdir -p logs

# Start backend
cd backend
npm run dev > ../logs/backend-compact.log 2>&1 &
BACKEND_PID=$!
cd ..

print_info "Waiting for backend to initialize..."
sleep 8

# Test backend
if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    print_status "Backend is running"
else
    echo "❌ Backend failed to start - check logs/backend-compact.log"
    exit 1
fi

print_info "Starting frontend with compact design..."

# Start frontend
cd frontend
BROWSER=none npm start > ../logs/frontend-compact.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 5

echo ""
echo "🍎 ====================================="
echo "🍎  Apple HIG-Inspired Design Ready!"
echo "🍎 ====================================="
print_status "Backend: Running on port 3001"
print_status "Frontend: Running on port 3000"
echo ""
echo "🎨 New Apple HIG Design Features:"
echo "   📖 Center-focused PDF reading (like Apple Books)"
echo "   🔧 Compact bottom toolbar (like Safari)"
echo "   ⏱️  Minimal timer displays"
echo "   🎯 Clean progress indicators"
echo "   🌙 Elegant focus mode toggle"
echo ""
echo "📱 Test the New Layout:"
echo "   1. Go to: http://localhost:3000"
echo "   2. Upload a PDF"
echo "   3. Open PDF viewer"
echo "   4. Notice the clean, minimal interface!"
echo ""
echo "🔧 Bottom Toolbar Features:"
echo "   • ⏱️  Page/session timers (compact)"
echo "   • 📊 Daily progress bar"
echo "   • 🔥 Streak counter"
echo "   • 🎯 XP display"
echo "   • 🌙 Focus mode toggle"
echo "   • ⋯ Details expander"
echo ""
echo "📜 Debug Logs:"
echo "   • Backend: tail -f logs/backend-compact.log"
echo "   • Frontend: tail -f logs/frontend-compact.log"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"

# Cleanup function
cleanup() {
    echo ""
    print_info "Stopping compact design servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    echo "👋 Compact design stopped successfully!"
    exit 0
}

trap cleanup INT TERM EXIT

# Open browser after delay
(sleep 10 && open http://localhost:3000) &

# Monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend died - check logs/backend-compact.log"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend died - check logs/frontend-compact.log"
        break
    fi
    sleep 5
done