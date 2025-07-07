#!/bin/bash

echo "🔄 Restarting Local Study Planner"
echo "================================="

# Kill existing processes
echo "Stopping existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2

# Clear any cached files
echo "Clearing cache..."
rm -rf frontend/node_modules/.cache 2>/dev/null || true

# Start fresh
echo "Starting servers..."
./scripts/start-dev.sh
