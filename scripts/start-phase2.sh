#!/bin/bash

echo "🚀 Starting Local Study Planner Phase 2"
echo "======================================="

# Kill existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2

# Create log directory
mkdir -p logs

# Start backend
echo "Starting Phase 2 backend..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Start frontend  
echo "Starting Phase 2 frontend..."
cd frontend
BROWSER=none npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend
sleep 5

echo ""
echo "🎉 Phase 2 is running!"
echo "======================"
echo "📱 Frontend: http://localhost:3000"
echo "🖥️  Backend: http://localhost:3001"
echo "📊 Analytics: http://localhost:3000/analytics"
echo "🎯 Goals: http://localhost:3000/goals"
echo ""
echo "📜 Logs:"
echo "   Backend: logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "Press Ctrl+C to stop"

# Cleanup function
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    echo "Stopped Phase 2"
    exit 0
}

trap cleanup INT TERM EXIT

# Open browser
(sleep 8 && open http://localhost:3000) &

# Wait
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "Backend died unexpectedly"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Frontend died unexpectedly"
        break
    fi
    sleep 5
done
