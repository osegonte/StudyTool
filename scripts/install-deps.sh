#!/bin/bash

echo "📦 Installing Local Study Planner Dependencies"
echo "============================================="

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Install backend dependencies
echo ""
print_info "Installing backend dependencies..."
cd backend

if npm install; then
    print_status "Backend dependencies installed successfully"
else
    print_error "Failed to install backend dependencies"
fi

# Install frontend dependencies
echo ""
print_info "Installing frontend dependencies..."
cd ../frontend

if npm install; then
    print_status "Frontend dependencies installed successfully"
else
    print_error "Failed to install frontend dependencies"
fi

# Return to root directory
cd ..

# Create additional necessary directories
print_info "Setting up data directories..."
mkdir -p data/{pdfs,user-data,reading-progress,backups}

# Set permissions for scripts
print_info "Setting script permissions..."
chmod +x scripts/*.sh

print_status "All dependencies installed successfully!"
echo ""
print_info "🎉 Setup complete! You can now:"
echo "     • Run './scripts/start-dev.sh' to start the development environment"
echo "     • Access frontend at http://localhost:3000"
echo "     • Access backend API at http://localhost:3001"
echo ""
print_info "📚 Your study planner is ready for Phase 1 testing!"