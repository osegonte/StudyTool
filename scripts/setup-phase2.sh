#!/bin/bash

echo "🚀 Setting up Phase 2: Advanced Time Tracking & Goal Setting"
echo "============================================================"

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

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the local-study-planner root directory"
fi

print_info "Backing up existing files..."
mkdir -p backups/phase1
cp -r backend/src backups/phase1/backend-src-backup
cp -r frontend/src backups/phase1/frontend-src-backup

print_info "Creating Phase 2 backend enhancements..."

# Create enhanced database schema
cat > backend/src/database/schema.sql << 'EOF'
-- Enhanced schema for Phase 2
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    total_pages INTEGER,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    topic_id TEXT,
    deadline DATE,
    target_completion_date DATE,
    priority INTEGER DEFAULT 1,
    estimated_reading_time INTEGER, -- in minutes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3498db',
    target_hours_per_day REAL DEFAULT 1.0,
    deadline DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reading_sessions (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INTEGER, -- in seconds
    pages_read INTEGER DEFAULT 0,
    start_page INTEGER,
    end_page INTEGER,
    reading_speed REAL, -- pages per minute
    session_type TEXT DEFAULT 'reading', -- reading, review, exercise
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files (id)
);

CREATE TABLE IF NOT EXISTS reading_progress (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    current_page INTEGER DEFAULT 1,
    total_time_spent INTEGER DEFAULT 0, -- in seconds
    sessions_count INTEGER DEFAULT 0,
    average_reading_speed REAL, -- pages per minute
    estimated_completion_time INTEGER, -- in minutes
    last_session_date DATETIME,
    completion_percentage REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files (id)
);

CREATE TABLE IF NOT EXISTS study_goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    target_type TEXT NOT NULL, -- 'daily_minutes', 'pages_per_day', 'completion_date'
    target_value REAL NOT NULL,
    current_progress REAL DEFAULT 0.0,
    start_date DATE NOT NULL,
    end_date DATE,
    file_id TEXT,
    topic_id TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_stats (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    total_reading_time INTEGER DEFAULT 0, -- in seconds
    pages_read INTEGER DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    files_worked_on INTEGER DEFAULT 0,
    average_reading_speed REAL,
    goals_met INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_topic_id ON files (topic_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_file_id ON reading_sessions (file_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_start_time ON reading_sessions (start_time);
CREATE INDEX IF NOT EXISTS idx_reading_progress_file_id ON reading_progress (file_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats (date);
CREATE INDEX IF NOT EXISTS idx_study_goals_file_id ON study_goals (file_id);
CREATE INDEX IF NOT EXISTS idx_study_goals_topic_id ON study_goals (topic_id);
EOF

# Create database initialization module
cat > backend/src/database/init.js << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '../../../data/study-planner.db');
    this.db = null;
  }

  async init() {
    await fs.ensureDir(path.dirname(this.dbPath));
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('📊 Database connected successfully');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('📋 Database tables created successfully');
          resolve();
        }
      });
    });
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new Database();
EOF

# Enhanced backend package.json with new dependencies
cat > backend/package.json << 'EOF'
{
  "name": "study-planner-backend",
  "version": "2.0.0",
  "description": "Local Study Planner - Backend Phase 2",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "migrate": "node src/database/migrate.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "sqlite3": "^5.1.6",
    "dotenv": "^16.0.3",
    "fs-extra": "^11.1.0",
    "uuid": "^9.0.0",
    "moment": "^2.29.4",
    "lodash": "^4.17.21",
    "pdf-parse": "^1.1.1"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.4.3"
  }
}
EOF

# Enhanced frontend package.json
cat > frontend/package.json << 'EOF'
{
  "name": "study-planner-frontend",
  "version": "2.0.0",
  "description": "Local Study Planner - Frontend Phase 2",
  "private": true,
  "dependencies": {
    "@csstools/normalize.css": "^12.1.1",
    "axios": "^1.10.0",
    "lucide-react": "^0.263.1",
    "pdfjs-dist": "^3.11.174",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-scripts": "5.0.1",
    "sanitize.css": "^13.0.0",
    "date-fns": "^2.30.0",
    "recharts": "^2.8.0",
    "react-datepicker": "^4.21.0",
    "react-hot-toast": "^2.4.1"
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
EOF

print_info "Creating Phase 2 directory structure..."

# Create new directories
mkdir -p backend/src/database
mkdir -p backend/src/controllers
mkdir -p backend/src/services
mkdir -p backend/src/utils
mkdir -p frontend/src/components/analytics
mkdir -p frontend/src/components/goals
mkdir -p frontend/src/components/timer
mkdir -p frontend/src/hooks
mkdir -p frontend/src/services
mkdir -p data/analytics

# Create additional data directories
mkdir -p data/goals
mkdir -p data/topics
mkdir -p data/sessions

print_status "Phase 2 directory structure created"

print_info "Installing new dependencies..."

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
cd ..

print_status "Dependencies installed successfully"

print_info "Creating Phase 2 documentation..."

cat > docs/phase2-features.md << 'EOF'
# Phase 2 Features: Advanced Time Tracking & Goal Setting

## 🎯 New Features

### Advanced Time Tracking
- **Real-time session tracking** with start/pause/stop functionality
- **Reading speed analysis** - pages per minute calculation
- **Session history** with detailed breakdowns
- **Daily/weekly/monthly statistics** 
- **Reading patterns analysis**

### Goal Setting & Deadlines
- **Study goals** with multiple target types:
  - Daily reading time targets
  - Pages per day targets  
  - Completion date goals
- **Deadline management** with automatic time recommendations
- **Progress tracking** toward goals
- **Smart notifications** when falling behind schedule

### Enhanced Analytics
- **Reading speed trends** over time
- **Time distribution** across topics and files
- **Productivity insights** and recommendations
- **Goal completion statistics**
- **Study session quality metrics**

### Topic Management
- **Topic organization** for grouping related PDFs
- **Topic-level goals** and deadlines
- **Time allocation** across different subjects
- **Priority management** system

## 📊 Database Enhancements

### New Tables
- `topics` - Subject/topic organization
- `reading_sessions` - Detailed session tracking
- `study_goals` - Goal setting and tracking
- `daily_stats` - Aggregated daily statistics

### Enhanced Tables
- `files` - Added deadline, topic, priority fields
- `reading_progress` - Enhanced with speed analysis

## 🔧 Technical Improvements

### Backend
- SQLite database integration
- Enhanced API endpoints for analytics
- Real-time session tracking
- Goal management system
- Statistics calculation services

### Frontend  
- Real-time timer component
- Analytics dashboard
- Goal setting interface
- Enhanced progress visualization
- Charts and graphs with Recharts

## 🚀 Usage

### Setting Up Goals
1. Navigate to Goals section
2. Create new goal with target type
3. Set deadline and daily targets
4. Track progress automatically

### Time Tracking
1. Start reading session from PDF viewer
2. Timer tracks automatically
3. Pause/resume as needed
4. View detailed session history

### Analytics
1. Check daily/weekly statistics
2. Monitor reading speed trends
3. Review goal progress
4. Get study recommendations

## 📈 Benefits

- **Accurate time estimation** for study planning
- **Better goal achievement** through tracking
- **Improved reading efficiency** via speed analysis
- **Data-driven study decisions** with analytics
- **Motivation boost** through progress visualization
EOF

print_status "Phase 2 setup complete!"

echo ""
print_info "🎉 Phase 2 files created successfully!"
echo ""
print_info "Next steps:"
echo "1. Run: ./scripts/install-phase2-deps.sh"
echo "2. Run: ./scripts/start-dev.sh"  
echo "3. Test new features at http://localhost:3000"
echo ""
print_info "📚 New features include:"
echo "   • Advanced time tracking with session management"
echo "   • Reading speed analysis and trends"
echo "   • Goal setting with deadline management"
echo "   • Enhanced analytics dashboard"
echo "   • Topic organization system"
echo ""
print_warning "Remember to backup your data before testing!"