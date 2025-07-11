#!/bin/bash

# Simple Study Planner Startup Script

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎓 Starting Study Planner...${NC}"

# Check PostgreSQL
if ! pg_isready -q 2>/dev/null; then
    echo "❌ PostgreSQL not running. Start it first:"
    echo "  macOS: brew services start postgresql"
    echo "  Linux: sudo systemctl start postgresql"
    exit 1
fi

# Kill existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start backend
echo "🔧 Starting backend..."
cd backend && npm start &
BACKEND_PID=$!
cd ..

sleep 3

# Start frontend
echo "🎨 Starting frontend..."
cd frontend && npm start &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}✅ Study Planner running!${NC}"
echo "📚 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop..."

cleanup() {
    echo "🔌 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true
    exit 0
}

trap cleanup INT
while true; do sleep 1; done
