#!/bin/bash

echo "📦 Installing Local Study Planner Dependencies"
echo "============================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the local-study-planner root directory"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js from https://nodejs.org/"
fi

print_info "Node.js version: $(node --version)"
print_info "npm version: $(npm --version)"

# Create package.json files if they don't exist
if [ ! -f "backend/package.json" ]; then
    print_info "Creating backend package.json..."
    cat > backend/package.json << 'BACKEND_EOF'
{
  "name": "study-planner-backend",
  "version": "1.0.0",
  "description": "Local Study Planner Backend",
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
fi

if [ ! -f "frontend/package.json" ]; then
    print_info "Creating frontend package.json..."
    cat > frontend/package.json << 'FRONTEND_EOF'
{
  "name": "study-planner-frontend",
  "version": "1.0.0",
  "description": "Local Study Planner Frontend",
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
fi

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend
if npm install; then
    print_status "Backend dependencies installed successfully"
else
    print_error "Failed to install backend dependencies"
fi

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd ../frontend
if npm install; then
    print_status "Frontend dependencies installed successfully"
else
    print_error "Failed to install frontend dependencies"
fi

cd ..

# Create data directories
print_info "Setting up data directories..."
mkdir -p data/{pdfs,backups}
mkdir -p logs

# Set permissions for scripts
chmod +x scripts/*.sh

print_status "All dependencies installed successfully!"
echo ""
print_info "🎉 Setup complete! You can now:"
echo "     • Run './scripts/start-phase1.sh' to start the application"
echo "     • Access frontend at http://localhost:3000"
echo "     • Access backend API at http://localhost:3001"
echo ""
print_info "📚 Your study planner is ready!"
