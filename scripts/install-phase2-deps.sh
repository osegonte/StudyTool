#!/bin/bash

echo "📦 Installing Phase 2 Dependencies - Time Tracking & Goals"
echo "========================================================="

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

print_info "Installing Phase 2 specific dependencies..."

# Install backend dependencies for time tracking
print_info "Installing backend dependencies (SQLite, UUID, etc.)..."
cd backend
npm install
if [ $? -eq 0 ]; then
    print_status "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
fi

# Install frontend dependencies for analytics and goals
print_info "Installing frontend dependencies (Recharts, Date picker, etc.)..."
cd ../frontend
npm install
if [ $? -eq 0 ]; then
    print_status "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
fi

cd ..

# Set up Phase 2 data directories
print_info "Setting up Phase 2 data structure..."
mkdir -p data/{pdfs,sessions,goals,reading-progress,backups}

# Set script permissions
chmod +x scripts/*.sh

print_status "Phase 2 dependencies installed successfully!"
echo ""
print_info "🎯 Phase 2 features ready:"
echo "   • Time tracking with SQLite database"
echo "   • Reading speed analysis with Recharts"
echo "   • Goal setting with date pickers"
echo "   • Session management with UUID tracking"
echo ""
print_info "🚀 Start Phase 2 with:"
echo "   ./scripts/start-phase2.sh"
