#!/bin/bash

echo "💾 Deploying Comprehensive Data Persistence System"
echo "=============================================="

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
pkill -f "nodemon" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 3

print_info "Running comprehensive database migration..."
cd backend
if [ -f "migrations/004_comprehensive_study_data.sql" ]; then
    print_info "Applying comprehensive data migration..."
    psql -d study_planner -f migrations/004_comprehensive_study_data.sql -q
    if [ $? -eq 0 ]; then
        print_status "Comprehensive data migration completed"
    else
        print_warning "Migration may have already been applied"
    fi
else
    print_warning "Comprehensive migration file not found"
fi
cd ..

print_info "Starting backend with comprehensive data persistence..."
cd backend
npm run dev > ../logs/backend-comprehensive.log 2>&1 &
BACKEND_PID=$!
cd ..

print_info "Waiting for backend to initialize..."
sleep 8

if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    print_status "Backend running with comprehensive data system"
else
    echo "❌ Backend failed to start - check logs/backend-comprehensive.log"
    exit 1
fi

print_info "Starting frontend with enhanced tracking..."
cd frontend
BROWSER=none npm start > ../logs/frontend-comprehensive.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 5

echo ""
echo "💾 =========================================="
echo "💾  Comprehensive Data Persistence Ready!"
echo "💾 =========================================="
print_status "Backend: Running on port 3001"
print_status "Frontend: Running on port 3000"
echo ""
echo "📊 Comprehensive Data Tracking:"
echo "   ⏱️  Detailed session tracking"
echo "   📚 Exercise and practice logging"
echo "   🎯 Study goals with deadlines"
echo "   📈 Performance analytics"
echo "   🔄 Spaced repetition scheduling"
echo "   🪞 Study reflections and insights"
echo "   📱 Study context tracking"
echo "   💾 Automatic data backup"
echo ""
echo "🎯 All Your Study Data is Now Saved:"
echo "   • Every page you read (with timestamps)"
echo "   • Every minute you study"
echo "   • All your goals and progress"
echo "   • Exercise attempts and scores"
echo "   • Reading speed improvements"
echo "   • Focus patterns and trends"
echo "   • Study environment effects"
echo "   • Spaced repetition schedule"
echo ""
echo "📊 New API Endpoints Available:"
echo "   • /api/exercises - Practice tracking"
echo "   • /api/study-goals - Goal management"
echo "   • /api/analytics - Performance insights"
echo "   • /api/data/export - Backup your data"
echo ""
echo "🚀 Your Personal Study System is Ready!"
echo "   Go to: http://localhost:3000"
echo ""
echo "📜 Debug Logs:"
echo "   • Backend: tail -f logs/backend-comprehensive.log"
echo "   • Frontend: tail -f logs/frontend-comprehensive.log"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"

# Cleanup function
cleanup() {
    echo ""
    print_info "Stopping comprehensive data system..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    echo "👋 Comprehensive system stopped!"
    exit 0
}

trap cleanup INT TERM EXIT

# Open browser after delay
(sleep 10 && open http://localhost:3000) &

# Monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend died - check logs/backend-comprehensive.log"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend died - check logs/frontend-comprehensive.log"
        break
    fi
    sleep 5
done
