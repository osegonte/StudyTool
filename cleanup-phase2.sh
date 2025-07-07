#!/bin/bash

echo "🧹 Local Study Planner - Phase 2 Cleanup & Maintenance"
echo "======================================================"

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Function to show menu
show_menu() {
    echo ""
    echo "Select an option:"
    echo "1) 🚀 Start Phase 2 Study Planner"
    echo "2) 🛑 Stop all servers"
    echo "3) 🧹 Clean temporary files and caches"
    echo "4) 📊 Check database status"
    echo "5) 🔄 Restart with fresh data"
    echo "6) 📋 View logs"
    echo "7) 🔧 Fix common issues"
    echo "8) 📈 Database backup"
    echo "9) 📦 Update dependencies"
    echo "10) 📚 Quick start guide"
    echo "0) Exit"
    echo ""
    read -p "Enter your choice [0-10]: " choice
}

# Function to start the application
start_app() {
    print_header "Starting Phase 2 Study Planner"
    
    # Check if already running
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null || lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null; then
        print_warning "Application appears to be running already"
        read -p "Do you want to restart it? (y/n): " restart
        if [[ "$restart" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            stop_servers
            sleep 2
        else
            return
        fi
    fi
    
    if [ -f "scripts/start-phase2.sh" ]; then
        ./scripts/start-phase2.sh
    else
        print_error "Start script not found. Please run setup again."
    fi
}

# Function to stop servers
stop_servers() {
    print_header "Stopping all servers"
    
    # Kill processes on specific ports
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
        print_info "Stopping frontend server (port 3000)..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        print_status "Frontend stopped"
    fi
    
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null; then
        print_info "Stopping backend server (port 3001)..."
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
        print_status "Backend stopped"
    fi
    
    # Kill any remaining Node processes
    pkill -f "react-scripts start" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    
    print_status "All servers stopped"
}

# Function to clean temporary files
clean_temp() {
    print_header "Cleaning temporary files and caches"
    
    # Clean node modules caches
    if [ -d "frontend/node_modules/.cache" ]; then
        rm -rf frontend/node_modules/.cache
        print_status "Frontend cache cleared"
    fi
    
    if [ -d "backend/node_modules/.cache" ]; then
        rm -rf backend/node_modules/.cache
        print_status "Backend cache cleared"
    fi
    
    # Clean logs older than 7 days
    find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true
    print_status "Old logs cleaned"
    
    # Clean temporary PDF processing files
    find data/pdfs/ -name "*.tmp" -delete 2>/dev/null || true
    print_status "Temporary PDF files cleaned"
    
    # Clean npm cache
    npm cache clean --force 2>/dev/null || true
    print_status "NPM cache cleaned"
    
    print_status "Cleanup complete"
}

# Function to check database status
check_database() {
    print_header "Checking database status"
    
    DB_PATH="data/study-planner.db"
    
    if [ -f "$DB_PATH" ]; then
        # Get database size
        DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
        print_status "Database found: $DB_SIZE"
        
        # Try to connect and get basic stats
        if command -v sqlite3 >/dev/null 2>&1; then
            echo ""
            print_info "Database statistics:"
            
            # Count tables
            TABLE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
            echo "  📊 Tables: $TABLE_COUNT"
            
            # Count sessions
            SESSION_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM reading_sessions;" 2>/dev/null || echo "0")
            echo "  ⏱️  Reading sessions: $SESSION_COUNT"
            
            # Count goals
            GOAL_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM study_goals;" 2>/dev/null || echo "0")
            echo "  🎯 Study goals: $GOAL_COUNT"
            
            # Count files
            FILE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM files;" 2>/dev/null || echo "0")
            echo "  📄 Files tracked: $FILE_COUNT"
            
        else
            print_warning "sqlite3 not installed - install with: brew install sqlite"
        fi
    else
        print_warning "Database not found. It will be created on first run."
    fi
}

# Function to restart with fresh data
restart_fresh() {
    print_header "Restarting with fresh data"
    print_warning "This will delete all your study data!"
    read -p "Are you sure? Type 'YES' to confirm: " confirm
    
    if [ "$confirm" = "YES" ]; then
        stop_servers
        
        # Backup existing data
        BACKUP_DIR="backups/fresh-restart-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        if [ -f "data/study-planner.db" ]; then
            cp data/study-planner.db "$BACKUP_DIR/"
            print_status "Database backed up to $BACKUP_DIR"
        fi
        
        if [ -d "data/pdfs" ] && [ "$(ls -A data/pdfs 2>/dev/null)" ]; then
            cp -r data/pdfs "$BACKUP_DIR/"
            print_status "PDFs backed up to $BACKUP_DIR"
        fi
        
        # Clear data
        rm -f data/study-planner.db
        rm -f data/analytics/*.json 2>/dev/null || true
        rm -f data/goals/*.json 2>/dev/null || true
        rm -f data/sessions/*.json 2>/dev/null || true
        
        print_status "Data cleared. Backup saved in $BACKUP_DIR"
        print_info "You can now start the application fresh"
    else
        print_info "Operation cancelled"
    fi
}

# Function to view logs
view_logs() {
    print_header "Viewing logs"
    
    if [ ! -d "logs" ]; then
        print_warning "No logs directory found"
        return
    fi
    
    echo "Available logs:"
    ls -la logs/ 2>/dev/null || true
    echo ""
    
    read -p "Which log to view? (backend/frontend/all): " log_choice
    
    case $log_choice in
        backend)
            if [ -f "logs/backend.log" ]; then
                tail -50 logs/backend.log
            else
                print_warning "Backend log not found"
            fi
            ;;
        frontend)
            if [ -f "logs/frontend.log" ]; then
                tail -50 logs/frontend.log
            else
                print_warning "Frontend log not found"
            fi
            ;;
        all)
            echo "=== Backend Log ==="
            tail -25 logs/backend.log 2>/dev/null || echo "Backend log not found"
            echo ""
            echo "=== Frontend Log ==="
            tail -25 logs/frontend.log 2>/dev/null || echo "Frontend log not found"
            ;;
        *)
            print_warning "Invalid choice"
            ;;
    esac
}

# Function to fix common issues
fix_issues() {
    print_header "Fixing common issues"
    
    echo "1) Fix port conflicts"
    echo "2) Reinstall dependencies"
    echo "3) Reset database"
    echo "4) Fix file permissions"
    echo "5) Clear all caches"
    read -p "Select fix [1-5]: " fix_choice
    
    case $fix_choice in
        1)
            print_info "Fixing port conflicts..."
            stop_servers
            print_status "Ports cleared"
            ;;
        2)
            print_info "Reinstalling dependencies..."
            cd backend && rm -rf node_modules && npm install
            cd ../frontend && rm -rf node_modules && npm install
            cd ..
            print_status "Dependencies reinstalled"
            ;;
        3)
            print_info "Resetting database..."
            rm -f data/study-planner.db
            print_status "Database reset (will be recreated on startup)"
            ;;
        4)
            print_info "Fixing file permissions..."
            chmod +x scripts/*.sh
            chmod -R 755 data/
            print_status "Permissions fixed"
            ;;
        5)
            clean_temp
            ;;
        *)
            print_warning "Invalid choice"
            ;;
    esac
}

# Function to backup database
backup_database() {
    print_header "Creating database backup"
    
    DB_PATH="data/study-planner.db"
    
    if [ ! -f "$DB_PATH" ]; then
        print_warning "No database found to backup"
        return
    fi
    
    BACKUP_DIR="backups/database"
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/study-planner-$(date +%Y%m%d_%H%M%S).db"
    cp "$DB_PATH" "$BACKUP_FILE"
    
    # Also create a readable export if sqlite3 is available
    if command -v sqlite3 >/dev/null 2>&1; then
        EXPORT_FILE="$BACKUP_DIR/study-planner-$(date +%Y%m%d_%H%M%S).sql"
        sqlite3 "$DB_PATH" .dump > "$EXPORT_FILE"
        print_status "Database backed up to:"
        print_info "  Binary: $BACKUP_FILE"
        print_info "  SQL: $EXPORT_FILE"
    else
        print_status "Database backed up to: $BACKUP_FILE"
    fi
}

# Function to update dependencies
update_dependencies() {
    print_header "Updating dependencies"
    
    print_info "Checking for updates..."
    
    # Update backend dependencies
    cd backend
    npm outdated
    read -p "Update backend dependencies? (y/n): " update_backend
    if [[ "$update_backend" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        npm update
        print_status "Backend dependencies updated"
    fi
    
    # Update frontend dependencies
    cd ../frontend
    npm outdated
    read -p "Update frontend dependencies? (y/n): " update_frontend
    if [[ "$update_frontend" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        npm update
        print_status "Frontend dependencies updated"
    fi
    
    cd ..
    print_status "Dependencies check complete"
}

# Function to show quick start guide
quick_start() {
    print_header "Quick Start Guide"
    
    cat << 'EOF'
🚀 Phase 2 Local Study Planner - Quick Start

1. 📚 FIRST TIME SETUP:
   • Run: ./scripts/start-phase2.sh
   • Open: http://localhost:3000
   • Upload some PDFs to get started

2. 🎯 CREATING GOALS:
   • Go to Goals page
   • Click "Create Goal"
   • Set daily reading targets or completion dates

3. ⏱️ STUDY SESSIONS:
   • Open any PDF
   • Click the timer to start tracking
   • Your reading speed is calculated automatically

4. 📊 VIEW ANALYTICS:
   • Visit Analytics page
   • See reading speed trends
   • Check daily study patterns

5. 🔧 TROUBLESHOOTING:
   • Use this cleanup script for maintenance
   • Check logs if something isn't working
   • Restart fresh if needed

6. 💾 DATA LOCATION:
   • PDFs: data/pdfs/
   • Database: data/study-planner.db
   • Logs: logs/

7. 🆘 COMMON ISSUES:
   • Port conflicts: Use option 7 → 1
   • Broken dependencies: Use option 7 → 2
   • Database errors: Use option 7 → 3

Happy studying! 📖✨
EOF
}

# Main script execution
print_info "Welcome to Phase 2 Local Study Planner maintenance!"

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the local-study-planner root directory"
    exit 1
fi

# Main loop
while true; do
    show_menu
    
    case $choice in
        1) start_app ;;
        2) stop_servers ;;
        3) clean_temp ;;
        4) check_database ;;
        5) restart_fresh ;;
        6) view_logs ;;
        7) fix_issues ;;
        8) backup_database ;;
        9) update_dependencies ;;
        10) quick_start ;;
        0) 
            print_info "Thanks for using Local Study Planner! 📚"
            exit 0
            ;;
        *)
            print_warning "Invalid option. Please try again."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done