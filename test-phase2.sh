#!/bin/bash

echo "🧪 Testing Phase 2 Local Study Planner"
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_test() {
    echo -e "${BLUE}🔍 Testing: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
}

print_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}⚠️  WARN: $1${NC}"
}

# Check if servers are running
check_servers() {
    print_test "Server Status"
    
    # Check backend
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        # Get health response
        HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
        if echo "$HEALTH_RESPONSE" | grep -q "Phase 2"; then
            print_pass "Backend server (Phase 2) is running on port 3001"
        else
            print_warn "Backend is running but may be Phase 1"
        fi
    else
        print_fail "Backend server not responding on port 3001"
        return 1
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_pass "Frontend server is running on port 3000"
    else
        print_fail "Frontend server not responding on port 3000"
        return 1
    fi
    
    return 0
}

# Test API endpoints
test_endpoints() {
    print_test "API Endpoints"
    
    local endpoints=(
        "/api/health:Health Check"
        "/api/files:File Management"
        "/api/sessions/all:Session Tracking"
        "/api/goals:Goal Management"
        "/api/topics:Topic Organization"
        "/api/analytics/dashboard:Analytics Dashboard"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r endpoint description <<< "$endpoint_info"
        
        status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001$endpoint" 2>/dev/null)
        
        if [ "$status" = "200" ]; then
            print_pass "$description ($endpoint)"
        else
            print_fail "$description ($endpoint) - HTTP $status"
        fi
    done
}

# Check file structure
check_structure() {
    print_test "File Structure"
    
    local required_files=(
        "backend/src/database/init.js:Database Module"
        "backend/src/routes/sessions.js:Sessions Route"
        "backend/src/routes/goals.js:Goals Route"
        "backend/src/routes/analytics.js:Analytics Route"
        "frontend/src/components/timer/StudyTimer.js:Study Timer Component"
        "frontend/src/components/analytics/AnalyticsDashboard.js:Analytics Component"
        "frontend/src/components/goals/GoalsManager.js:Goals Component"
        "frontend/src/services/api.js:Enhanced API Service"
        "frontend/src/pages/Analytics.js:Analytics Page"
        "frontend/src/pages/Goals.js:Goals Page"
    )
    
    for file_info in "${required_files[@]}"; do
        IFS=':' read -r file description <<< "$file_info"
        
        if [ -f "$file" ]; then
            print_pass "$description"
        else
            print_fail "$description missing: $file"
        fi
    done
}

# Check database
check_database() {
    print_test "Database"
    
    DB_PATH="data/study-planner.db"
    
    if [ -f "$DB_PATH" ]; then
        print_pass "Database file exists"
        
        if command -v sqlite3 >/dev/null 2>&1; then
            # Check if tables exist
            local tables=(
                "files"
                "topics"
                "reading_sessions"
                "reading_progress"
                "study_goals"
                "daily_stats"
            )
            
            for table in "${tables[@]}"; do
                if sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='$table';" | grep -q "$table"; then
                    print_pass "Table '$table' exists"
                else
                    print_fail "Table '$table' missing"
                fi
            done
        else
            print_warn "sqlite3 not available for table checking"
        fi
    else
        print_warn "Database not created yet (normal on first run)"
    fi
}

# Check dependencies
check_dependencies() {
    print_test "Dependencies"
    
    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        print_pass "Node.js $NODE_VERSION"
    else
        print_fail "Node.js not installed"
    fi
    
    # Check npm
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm --version)
        print_pass "npm $NPM_VERSION"
    else
        print_fail "npm not installed"
    fi
    
    # Check backend dependencies
    if [ -f "backend/package.json" ] && [ -d "backend/node_modules" ]; then
        # Check for key Phase 2 dependencies
        local backend_deps=("uuid" "sqlite3" "moment" "lodash")
        for dep in "${backend_deps[@]}"; do
            if [ -d "backend/node_modules/$dep" ]; then
                print_pass "Backend dependency: $dep"
            else
                print_fail "Backend dependency missing: $dep"
            fi
        done
    else
        print_fail "Backend dependencies not installed"
    fi
    
    # Check frontend dependencies
    if [ -f "frontend/package.json" ] && [ -d "frontend/node_modules" ]; then
        # Check for key Phase 2 dependencies
        local frontend_deps=("recharts" "react-datepicker" "react-hot-toast")
        for dep in "${frontend_deps[@]}"; do
            if [ -d "frontend/node_modules/$dep" ]; then
                print_pass "Frontend dependency: $dep"
            else
                print_fail "Frontend dependency missing: $dep"
            fi
        done
    else
        print_fail "Frontend dependencies not installed"
    fi
}

# Test data directories
check_data_dirs() {
    print_test "Data Directories"
    
    local dirs=(
        "data/pdfs:PDF Storage"
        "data/analytics:Analytics Data"
        "data/goals:Goals Data"
        "data/topics:Topics Data"
        "data/sessions:Sessions Data"
        "logs:Application Logs"
    )
    
    for dir_info in "${dirs[@]}"; do
        IFS=':' read -r dir description <<< "$dir_info"
        
        if [ -d "$dir" ]; then
            print_pass "$description directory exists"
        else
            print_fail "$description directory missing: $dir"
        fi
    done
}

# Check scripts
check_scripts() {
    print_test "Scripts"
    
    local scripts=(
        "scripts/start-phase2.sh:Phase 2 Start Script"
        "scripts/install-deps.sh:Dependency Installation"
        "scripts/verify-setup.sh:Setup Verification"
    )
    
    for script_info in "${scripts[@]}"; do
        IFS=':' read -r script description <<< "$script_info"
        
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                print_pass "$description (executable)"
            else
                print_warn "$description (not executable)"
            fi
        else
            print_fail "$description missing: $script"
        fi
    done
}

# Run comprehensive test
run_full_test() {
    echo ""
    echo "🔬 Running comprehensive Phase 2 test suite..."
    echo ""
    
    local test_sections=(
        "check_structure"
        "check_dependencies" 
        "check_data_dirs"
        "check_scripts"
        "check_database"
    )
    
    # Only test servers if they're running
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        test_sections+=("check_servers" "test_endpoints")
    else
        print_warn "Servers not running - skipping server tests"
        echo "   Start servers with: ./scripts/start-phase2.sh"
    fi
    
    local passed=0
    local total=0
    
    for test_func in "${test_sections[@]}"; do
        echo ""
        if $test_func; then
            ((passed++))
        fi
        ((total++))
    done
    
    echo ""
    echo "=========================================="
    if [ "$passed" -eq "$total" ]; then
        print_pass "All tests passed! ($passed/$total) 🎉"
        echo ""
        echo "🚀 Your Phase 2 Local Study Planner is ready!"
        echo ""
        echo "📱 Access your app:"
        echo "   • Main: http://localhost:3000"
        echo "   • Analytics: http://localhost:3000/analytics"
        echo "   • Goals: http://localhost:3000/goals"
    else
        print_warn "Some tests failed ($passed/$total passed)"
        echo ""
        echo "🔧 Run the cleanup script to fix issues:"
        echo "   ./cleanup-phase2.sh"
    fi
    echo "=========================================="
}

# Quick test function
quick_test() {
    print_test "Quick Health Check"
    
    # Check basic structure
    if [ -f "backend/package.json" ] && [ -f "frontend/package.json" ]; then
        print_pass "Package files exist"
    else
        print_fail "Missing package files"
        return 1
    fi
    
    # Check if Phase 2 files exist
    if [ -f "frontend/src/components/timer/StudyTimer.js" ]; then
        print_pass "Phase 2 components installed"
    else
        print_fail "Phase 2 components missing"
        return 1
    fi
    
    # Check if servers should be running
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        print_pass "Application is running"
        echo ""
        echo "🌐 Access your app at: http://localhost:3000"
    else
        print_warn "Application not running"
        echo ""
        echo "🚀 Start with: ./scripts/start-phase2.sh"
    fi
}

# Main execution
if [ "$1" = "quick" ]; then
    quick_test
elif [ "$1" = "full" ]; then
    run_full_test
else
    echo "Usage:"
    echo "  $0 quick    - Quick health check"
    echo "  $0 full     - Comprehensive test suite"
    echo ""
    read -p "Run quick test? (y/n): " run_quick
    if [[ "$run_quick" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        quick_test
    fi
fi