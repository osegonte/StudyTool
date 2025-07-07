#!/bin/bash

echo "🧪 Testing Local Study Planner API"
echo "=================================="

# Test health endpoint
echo "Testing health endpoint..."
response=$(curl -s -w "%{http_code}" http://localhost:3001/api/health)
http_code="${response: -3}"

if [ "$http_code" -eq 200 ]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed (HTTP $http_code)"
    echo "Make sure the backend server is running with: ./scripts/start-dev.sh"
    exit 1
fi

# Test files endpoint
echo "Testing files endpoint..."
response=$(curl -s -w "%{http_code}" http://localhost:3001/api/files)
http_code="${response: -3}"

if [ "$http_code" -eq 200 ]; then
    echo "✅ Files endpoint working"
else
    echo "❌ Files endpoint failed (HTTP $http_code)"
    exit 1
fi

echo ""
echo "🎉 API tests passed! Your Local Study Planner is working correctly."
