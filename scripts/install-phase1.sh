#!/bin/bash

echo "📦 Installing Phase 1 Dependencies"
echo "=================================="

# Create package.json files for clean installation
echo "Creating package.json files..."

# Backend package.json
cat > backend/package.json << 'BACKEND_EOF'
{
  "name": "study-planner-backend-phase1",
  "version": "1.0.0",
  "description": "Local Study Planner Phase 1 Backend",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "sqlite3": "^5.1.6",
    "fs-extra": "^11.1.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
BACKEND_EOF

# Frontend package.json
cat > frontend/package.json << 'FRONTEND_EOF'
{
  "name": "study-planner-frontend-phase1",
  "version": "1.0.0",
  "description": "Local Study Planner Phase 1 Frontend",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-scripts": "5.0.1",
    "axios": "^1.10.0",
    "lucide-react": "^0.263.1",
    "pdfjs-dist": "^3.11.174"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
FRONTEND_EOF

echo "Installing backend dependencies..."
cd backend && npm install && cd ..

echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "✅ Phase 1 dependencies installed!"
echo ""
echo "Next steps:"
echo "1. Create your Phase 1 components"
echo "2. Run: ./scripts/start-phase1.sh"
echo "3. Access: http://localhost:3000"
