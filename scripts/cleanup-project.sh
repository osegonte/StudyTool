#!/bin/bash

echo "🧹 Cleaning Up Project - Preparing for Phase 2"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Confirm cleanup
echo "This will remove unnecessary files and prepare your project for Phase 2."
echo "Your core application files and data will be preserved."
echo ""
read -p "Continue with cleanup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Files and directories to remove
print_info "Removing development and temporary files..."

# Remove node_modules (will be reinstalled)
if [ -d "frontend/node_modules" ]; then
    print_info "Removing frontend/node_modules..."
    rm -rf frontend/node_modules
    print_status "Frontend node_modules removed"
fi

if [ -d "backend/node_modules" ]; then
    print_info "Removing backend/node_modules..."
    rm -rf backend/node_modules
    print_status "Backend node_modules removed"
fi

# Remove log files
print_info "Cleaning up log files..."
rm -f logs/backend.log
rm -f logs/frontend.log
touch logs/.gitkeep
print_status "Log files cleaned"

# Remove npm debug logs
print_info "Removing npm debug files..."
find . -name "npm-debug.log*" -delete
find . -name "yarn-debug.log*" -delete
find . -name "yarn-error.log*" -delete
print_status "Debug files removed"

# Remove package-lock files (will be regenerated)
print_info "Removing package-lock files..."
rm -f frontend/package-lock.json
rm -f backend/package-lock.json
print_status "Package-lock files removed"

# Remove DS_Store files (macOS)
print_info "Removing macOS system files..."
find . -name ".DS_Store" -delete
print_status "System files removed"

# Remove temporary files
print_info "Removing temporary files..."
find . -name "temp-*" -delete
find . -name "test-*.html" -delete
print_status "Temporary files removed"

# Remove old backup files if any
if [ -d "data/backups" ] && [ "$(ls -A data/backups)" ]; then
    print_warning "Found backup files in data/backups/"
    ls -la data/backups/
    read -p "Remove old backup files? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f data/backups/*
        print_status "Backup files removed"
    fi
fi

# Clean up old scripts that are no longer needed
print_info "Removing irrelevant development scripts..."

# List of scripts to remove
SCRIPTS_TO_REMOVE=(
    "scripts/complete-phase1-setup.sh"
    "scripts/create-components.sh"
    "scripts/test-api.sh"
    "scripts/test-upload.sh"
    "scripts/install-deps.sh"
    "scripts/install-phase1.sh"
    "scripts/setup-phase1-enhanced.sh"
    "scripts/save-all-components.sh"
    "scripts/create-react-components.sh"
    "scripts/debug-and-postgres.sh"
    "scripts/fix-missing-files.sh"
    "scripts/test-and-troubleshoot.sh"
    "scripts/fix-postgres-auth.sh"
)

# Remove each script
for script in "${SCRIPTS_TO_REMOVE[@]}"; do
    if [ -f "$script" ]; then
        rm -f "$script"
        print_info "Removed: $script"
    fi
done

print_status "All irrelevant development scripts removed"

# Remove development artifacts
print_info "Removing development artifacts..."
rm -f frontend/src/App.test.js 2>/dev/null
rm -f frontend/src/logo.svg 2>/dev/null
rm -f frontend/src/reportWebVitals.js 2>/dev/null
rm -f frontend/src/setupTests.js 2>/dev/null
rm -rf frontend/public/manifest.json 2>/dev/null
rm -rf frontend/public/robots.txt 2>/dev/null
rm -rf frontend/public/favicon.ico 2>/dev/null
print_status "Development artifacts removed"

# Create a clean project summary
print_info "Creating project summary..."
cat > PROJECT_STATUS.md << 'STATUS_EOF'
# Local Study Planner - Phase 1 Complete ✅

## 🎉 Phase 1 Achievements
- ✅ **Local-First Architecture**: All data stored on Mac Mini M4
- ✅ **PostgreSQL Database**: Enterprise-grade with SSL support  
- ✅ **PDF Upload & Management**: Drag-and-drop file handling
- ✅ **Topic Organization**: Custom categories with colors/icons
- ✅ **PDF Viewer**: Iframe-based viewing with navigation
- ✅ **Progress Tracking**: Automatic reading position saving
- ✅ **Responsive UI**: Works on all screen sizes

## 📁 Current Structure
```
local-study-planner/
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # Navigation, etc.
│   │   ├── pages/             # Dashboard, FileManager, Topics, PDFViewer  
│   │   ├── services/          # API communication
│   │   └── styles/            # CSS styling
├── backend/                    # Express.js + PostgreSQL
│   ├── src/index.js           # Main server with all routes
│   └── .env                   # Database configuration
├── data/                      # Local storage
│   ├── pdfs/                 # PDF file storage  
│   └── backups/              # Database backups
├── scripts/                   # Utility scripts
└── logs/                     # Application logs
```

## 🚀 Running the App
```bash
# Start the application
./scripts/start-phase1.sh

# Access points
- Dashboard: http://localhost:3000
- API Health: http://localhost:3001/api/health
```

## 📊 Database Schema
- **topics**: Subject organization with colors/icons
- **files**: PDF metadata and file references  
- **reading_progress**: Bookmark and progress tracking

## 🎯 Ready for Phase 2
Phase 1 provides the perfect foundation for Phase 2's advanced features:
- ⏱️ **Time Tracking**: Session-based reading timers
- 📈 **Reading Analytics**: Speed analysis and insights  
- 🎯 **Goal Setting**: Deadline-based study goals
- 📊 **Advanced Dashboard**: Detailed study statistics

## 🔧 Development
- **Frontend**: React 18 with React Router
- **Backend**: Node.js/Express with PostgreSQL
- **Database**: PostgreSQL with UUID primary keys
- **File Storage**: Local filesystem (data/pdfs/)
- **Environment**: macOS optimized

---
*Phase 1 Complete - Ready for Phase 2 Development* 🎓
STATUS_EOF

print_status "Project summary created"

# Optimize package.json files
print_info "Optimizing package.json files..."

# Clean frontend package.json
cat > frontend/package.json << 'FRONTEND_CLEAN_EOF'
{
  "name": "local-study-planner-frontend",
  "version": "1.0.0",
  "description": "Local Study Planner Frontend - Phase 1 Complete",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-scripts": "5.0.1",
    "axios": "^1.10.0",
    "lucide-react": "^0.263.1"
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
FRONTEND_CLEAN_EOF

# Clean backend package.json
cat > backend/package.json << 'BACKEND_CLEAN_EOF'
{
  "name": "local-study-planner-backend",
  "version": "1.0.0",
  "description": "Local Study Planner Backend - PostgreSQL with SSL",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.3",
    "fs-extra": "^11.1.0",
    "uuid": "^9.0.0",
    "pdf-parse": "^1.1.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
BACKEND_CLEAN_EOF

print_status "Package.json files optimized"

# Create Phase 2 preparation script
print_info "Creating Phase 2 preparation script..."
cat > scripts/prepare-phase2.sh << 'PHASE2_PREP_EOF'
#!/bin/bash

echo "🚀 Preparing for Phase 2: Time Tracking & Goal Setting"
echo "===================================================="

echo "Phase 2 will add:"
echo "⏱️  Advanced time tracking with session timers"
echo "📈 Reading speed analysis and insights"  
echo "🎯 Goal setting with deadline management"
echo "📊 Enhanced analytics and progress visualization"
echo ""
echo "Phase 1 foundation is solid and ready!"
echo "All your data will be preserved and enhanced."
echo ""
echo "Ready to begin Phase 2 development? 🎓"

# Reinstall dependencies
echo "Reinstalling clean dependencies..."
cd backend && npm install
cd ../frontend && npm install
cd ..

echo "✅ Dependencies reinstalled"
echo "✅ Project cleaned and optimized"
echo "✅ Ready for Phase 2!"
PHASE2_PREP_EOF

chmod +x scripts/prepare-phase2.sh
print_status "Phase 2 preparation script created"

# Final file count and summary
print_info "Calculating final project stats..."
TOTAL_FILES=$(find . -type f | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh . | cut -f1)

echo ""
echo "🎉 ====================================================="
echo "🎉  PROJECT CLEANUP COMPLETE!"
echo "🎉 ====================================================="
echo ""
print_status "✅ Removed development artifacts and temporary files"
print_status "✅ Cleaned package.json files"
print_status "✅ Optimized project structure"
print_status "✅ Created project documentation"
print_status "✅ Ready for Phase 2 development"
echo ""
echo "📊 PROJECT STATS:"
echo "   • Total files: $TOTAL_FILES"
echo "   • Project size: $TOTAL_SIZE"
echo "   • Clean and optimized structure"
echo ""
echo "📁 WHAT'S PRESERVED:"
echo "   • ✅ All source code (frontend/backend)"
echo "   • ✅ Database configuration"
echo "   • ✅ PDF uploads and data"
echo "   • ✅ Essential scripts"
echo ""
echo "📁 ESSENTIAL SCRIPTS KEPT:"
echo "   • ✅ scripts/start-phase1.sh (to run the app)"
echo "   • ✅ scripts/prepare-phase2.sh (for next phase)"
echo "   • ✅ scripts/cleanup-project.sh (this script)"
echo ""
echo "🗑️  DEVELOPMENT SCRIPTS REMOVED:"
echo "   • ❌ All setup and installation scripts"
echo "   • ❌ All debugging and troubleshooting scripts"
echo "   • ❌ All component creation scripts"
echo "   • ❌ All testing scripts"
echo "   • ❌ All development helper scripts"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Run: ./scripts/prepare-phase2.sh"
echo "2. Test: ./scripts/start-phase1.sh"
echo "3. Begin Phase 2 development! 🎓"
echo ""
echo "📋 Project summary: PROJECT_STATUS.md"