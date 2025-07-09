#!/bin/bash

echo "🧠 Starting Stage 5: Topic-Based Smart Note-Taking System"
echo "=================================================="

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    echo "Starting PostgreSQL..."
    brew services start postgresql@14 2>/dev/null || systemctl start postgresql 2>/dev/null || service postgresql start 2>/dev/null
    sleep 3
fi

# Run database migrations
echo "📊 Running database migrations..."
./scripts/migrate-stage5.sh

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed. Cannot continue."
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Start backend server
echo "🔧 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend server
echo "🌐 Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Stage 5: Smart Note-Taking System is now running!"
echo "=================================================="
echo "📝 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "🧠 New Features Available:"
echo "• 📝 Smart note editor with markdown support"
echo "• 🔗 Topic-based organization"
echo "• 🏷️ Tagging system"
echo "• 🔍 Full-text search across all notes"
echo "• 📋 Note templates for quick creation"
echo ""
echo "📚 Access your notes at: http://localhost:3000/notes"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interruption
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
