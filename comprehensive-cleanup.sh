#!/bin/bash

# Comprehensive cleanup for Study Planner

echo "🧹 Comprehensive Study Planner Cleanup"
echo "======================================"

# 1. Remove all unnecessary shell scripts
echo "📁 Removing unnecessary shell scripts..."
rm -f cleanup-irrelevant-files.sh
rm -f fix-dependencies.sh
rm -f fix-backend-dependencies.sh
rm -f reset-database.sh
rm -f create-missing-routes.sh
rm -f complete-fix.sh
rm -f quick-start.sh

# 2. Remove duplicate/backup files
echo "🗑️  Removing duplicate and backup files..."
rm -f frontend/src/components/apple/AppleDashboard.js.backup
rm -f frontend/src/components/apple/BeautifulDashboard.js.backup
rm -f frontend/src/components/apple/AnalyticsPage.js.backup
rm -f frontend/src/components/apple/BeautifulDashboard.js

# 3. Remove old/unused components
echo "📦 Removing unused components..."
rm -f frontend/src/components/AnalyticsPage.js
rm -f frontend/src/components/Dashboard.js
rm -f frontend/src/components/Navigation.js
rm -f frontend/src/components/PDFViewer.js
rm -f frontend/src/components/SinglePagePDFViewer.js
rm -f frontend/src/pages/PDFViewerCompact.js

# 4. Remove duplicate backend routes
echo "🔧 Removing duplicate backend files..."
rm -f backend/src/routes/TopicManager.js
rm -f backend/src/routes/exercises.js
rm -f backend/src/routes/focus-sessions.js
rm -f backend/src/routes/pomodoro.js
rm -f backend/src/routes/study-goals.js

# 5. Remove extra migration files (keep only the main one)
echo "🗄️  Cleaning up migration files..."
rm -f backend/migrations/005_complete_schema.sql
rm -f backend/migrations/006_complete_enhanced_schema.sql
rm -f backend/migrations/007_enhanced_complete_schema.sql
rm -f backend/migrations/001_clean_schema.sql

# 6. Remove unused CSS files
echo "🎨 Removing unused CSS files..."
rm -f frontend/src/styles/App.css
rm -f frontend/src/styles/theme.css
rm -f frontend/src/styles/apple/design-system.css

# 7. Remove documentation/paste files
echo "📝 Removing documentation files..."
rm -f paste.txt
rm -f paste-2.txt

# 8. Fix ESLint warnings by cleaning up unused imports
echo "⚠️  Fixing ESLint warnings..."

# Fix App.js useEffect dependencies
sed -i.bak 's/useEffect(() => {/useEffect(() => {/' frontend/src/App.js
sed -i.bak 's/}, \[\]);/}, [initializeApp, setupEventListeners]);/' frontend/src/App.js

# Clean up unused imports in components
echo "🔧 Cleaning unused imports..."

# SettingsPage.js - Remove unused imports
sed -i.bak '/Bell, /d' frontend/src/components/SettingsPage.js
sed -i.bak '/Target/d' frontend/src/components/SettingsPage.js

# RealTimeDashboard.js - Remove unused imports
sed -i.bak '/BarChart3, /d' frontend/src/components/analytics/RealTimeDashboard.js
sed -i.bak '/Calendar, /d' frontend/src/components/analytics/RealTimeDashboard.js
sed -i.bak '/Award, /d' frontend/src/components/analytics/RealTimeDashboard.js
sed -i.bak '/PieChart, Pie, Cell, /d' frontend/src/components/analytics/RealTimeDashboard.js

# AppleDashboard.js - Remove unused Award import
sed -i.bak '/Award/d' frontend/src/components/apple/AppleDashboard.js

# AdvancedPDFViewer.js - Remove unused imports
sed -i.bak '/Play, Pause, /d' frontend/src/components/viewer/AdvancedPDFViewer.js
sed -i.bak '/Clock, Eye, Target, Settings/d' frontend/src/components/viewer/AdvancedPDFViewer.js

# NotesPanel.js - Remove unused imports
sed -i.bak '/useCallback, /d' frontend/src/components/viewer/NotesPanel.js
sed -i.bak '/Tag, /d' frontend/src/components/viewer/NotesPanel.js
sed -i.bak '/Hash, /d' frontend/src/components/viewer/NotesPanel.js
sed -i.bak '/ExternalLink/d' frontend/src/components/viewer/NotesPanel.js

# Remove backup files created by sed
find . -name "*.bak" -delete

# 9. Create simplified startup script
echo "🚀 Creating simple startup script..."
cat > start.sh << 'EOF'
#!/bin/bash

# Simple Study Planner Startup Script

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎓 Starting Study Planner...${NC}"

# Check PostgreSQL
if ! pg_isready -q 2>/dev/null; then
    echo "❌ PostgreSQL not running. Start it first:"
    echo "  macOS: brew services start postgresql"
    echo "  Linux: sudo systemctl start postgresql"
    exit 1
fi

# Kill existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start backend
echo "🔧 Starting backend..."
cd backend && npm start &
BACKEND_PID=$!
cd ..

sleep 3

# Start frontend
echo "🎨 Starting frontend..."
cd frontend && npm start &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}✅ Study Planner running!${NC}"
echo "📚 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop..."

cleanup() {
    echo "🔌 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true
    exit 0
}

trap cleanup INT
while true; do sleep 1; done
EOF

chmod +x start.sh

# 10. Clean up project structure
echo "📁 Final project structure cleanup..."

# Ensure proper directory structure
mkdir -p data/{pdfs,backups,exports}
touch data/pdfs/.gitkeep
touch data/backups/.gitkeep
touch data/exports/.gitkeep

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📂 Clean project structure:"
echo "├── frontend/"
echo "│   ├── src/"
echo "│   │   ├── components/"
echo "│   │   │   ├── apple/ (Dashboard, Navigation)"
echo "│   │   │   ├── viewer/ (PDFViewer, Timer, Notes)"
echo "│   │   │   ├── DocumentManager.js"
echo "│   │   │   ├── TopicManager.js"
echo "│   │   │   └── SettingsPage.js"
echo "│   │   ├── services/ (api.js, notifications.js)"
echo "│   │   └── styles/ (sprintstudy.css, pdf-viewer.css)"
echo "├── backend/"
echo "│   ├── src/"
echo "│   │   ├── routes/ (files.js, topics.js, etc.)"
echo "│   │   └── services/"
echo "│   └── migrations/ (001_studytool_schema.sql)"
echo "├── data/ (pdfs, backups, exports)"
echo "└── start.sh (simple startup script)"
echo ""
echo "🚀 To start: ./start.sh"
echo "📚 Then open: http://localhost:3000"
echo ""
echo "🎓 Ready for your study materials!"