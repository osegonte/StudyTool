#!/bin/bash

echo "🔍 Verifying Local Study Planner Setup"
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    check_fail "Not in the correct project directory"
fi

check_pass "Project directory structure"

# Check Node.js installation
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed: $NODE_VERSION"
else
    check_fail "Node.js not installed"
fi

# Check npm installation
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass "npm installed: $NPM_VERSION"
else
    check_fail "npm not installed"
fi

# Check dependencies
if [ -d "frontend/node_modules" ]; then
    check_pass "Frontend dependencies installed"
else
    check_warn "Frontend dependencies not installed - run ./scripts/install-deps.sh"
fi

if [ -d "backend/node_modules" ]; then
    check_pass "Backend dependencies installed"
else
    check_warn "Backend dependencies not installed - run ./scripts/install-deps.sh"
fi

# Check data directories
if [ -d "data/pdfs" ]; then
    check_pass "PDF storage directory exists"
else
    check_fail "PDF storage directory missing"
fi

if [ -d "data/reading-progress" ]; then
    check_pass "Progress tracking directory exists"
else
    check_fail "Progress tracking directory missing"
fi

# Check script permissions
if [ -x "scripts/install-deps.sh" ]; then
    check_pass "Install script is executable"
else
    check_warn "Install script needs permissions - run: chmod +x scripts/*.sh"
fi

if [ -x "scripts/start-dev.sh" ]; then
    check_pass "Start script is executable"
else
    check_warn "Start script needs permissions - run: chmod +x scripts/*.sh"
fi

# Check if servers can start (basic file check)
if [ -f "backend/src/index.js" ]; then
    check_pass "Backend server file exists"
else
    check_fail "Backend server file missing"
fi

if [ -f "frontend/src/App.js" ]; then
    check_pass "Frontend app file exists"
else
    check_fail "Frontend app file missing"
fi

echo ""
echo "🎉 Setup verification complete!"
echo ""
echo "If all checks passed, you can:"
echo "1. Run: ./scripts/install-deps.sh (if dependencies not installed)"
echo "2. Run: ./scripts/start-dev.sh"
echo "3. Open: http://localhost:3000"
