#!/bin/bash

echo "🚀 Complete Phase 2 Setup - Local Study Planner"
echo "==============================================="

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
    exit 1
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the local-study-planner root directory"
fi

print_info "Starting complete Phase 2 setup..."

# Create backup
print_header "Creating Backup"
mkdir -p backups/phase1-$(date +%Y%m%d_%H%M%S)
cp -r backend/src backups/phase1-$(date +%Y%m%d_%H%M%S)/backend-src
cp -r frontend/src backups/phase1-$(date +%Y%m%d_%H%M%S)/frontend-src
print_status "Backup created"

# Create directory structure
print_header "Setting Up Directory Structure"
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
mkdir -p data/goals
mkdir -p data/topics
mkdir -p data/sessions
print_status "Directory structure created"

# Create database schema
print_header "Creating Database Schema"
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
print_status "Database schema created"

# Create database initialization
print_header "Creating Database Module"
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

# Update backend package.json
print_header "Updating Backend Package.json"
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

# Update frontend package.json
print_header "Updating Frontend Package.json"
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

# Create enhanced backend index.js
print_header "Creating Enhanced Backend"
cat > backend/src/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const database = require('./database/init');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for PDFs
app.use('/pdfs', express.static(path.join(__dirname, '../../data/pdfs')));

// Initialize database
database.init().catch(console.error);

// Routes
app.use('/api/files', require('./routes/files'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/analytics', require('./routes/analytics'));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Study Planner API Phase 2 is running',
    version: '2.0.0',
    features: ['time-tracking', 'goals', 'analytics', 'topics']
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  database.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Study Planner API Phase 2 running on port ${PORT}`);
  console.log(`📁 PDF storage: ${path.join(__dirname, '../../data/pdfs')}`);
  console.log(`📊 Database: ${path.join(__dirname, '../../data/study-planner.db')}`);
});
EOF

# Create sessions route
print_header "Creating Sessions API"
cat > backend/src/routes/sessions.js << 'EOF'
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const database = require('../database/init');

// Start a new reading session
router.post('/start', async (req, res) => {
  try {
    const { fileId, startPage } = req.body;
    const sessionId = uuidv4();
    
    const session = {
      id: sessionId,
      file_id: fileId,
      start_time: new Date().toISOString(),
      start_page: startPage || 1,
      session_type: 'reading'
    };

    await database.run(
      `INSERT INTO reading_sessions (id, file_id, start_time, start_page, session_type)
       VALUES (?, ?, ?, ?, ?)`,
      [session.id, session.file_id, session.start_time, session.start_page, session.session_type]
    );

    res.json({ 
      success: true, 
      sessionId,
      message: 'Reading session started' 
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// End reading session
router.post('/end/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { endPage, notes } = req.body;
    const endTime = new Date().toISOString();

    // Get session start time
    const session = await database.query(
      'SELECT * FROM reading_sessions WHERE id = ?',
      [sessionId]
    );

    if (session.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const startTime = new Date(session[0].start_time);
    const duration = Math.floor((new Date(endTime) - startTime) / 1000);
    const pagesRead = Math.max(0, (endPage || session[0].start_page) - session[0].start_page + 1);
    const readingSpeed = duration > 0 ? (pagesRead / (duration / 60)) : 0;

    await database.run(
      `UPDATE reading_sessions 
       SET end_time = ?, duration = ?, end_page = ?, pages_read = ?, 
           reading_speed = ?, notes = ?
       WHERE id = ?`,
      [endTime, duration, endPage, pagesRead, readingSpeed, notes, sessionId]
    );

    // Update reading progress
    await updateReadingProgress(session[0].file_id, endPage, duration, readingSpeed);

    // Update daily stats
    await updateDailyStats(new Date().toISOString().split('T')[0], duration, pagesRead);

    res.json({ 
      success: true, 
      duration,
      pagesRead,
      readingSpeed,
      message: 'Session ended successfully' 
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get session history for a file
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const sessions = await database.query(
      `SELECT * FROM reading_sessions 
       WHERE file_id = ? 
       ORDER BY start_time DESC`,
      [fileId]
    );

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get all sessions for analytics
router.get('/all', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM reading_sessions WHERE 1=1';
    let params = [];

    if (startDate) {
      query += ' AND DATE(start_time) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(start_time) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY start_time DESC';

    const sessions = await database.query(query, params);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching all sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Helper function to update reading progress
async function updateReadingProgress(fileId, currentPage, sessionDuration, readingSpeed) {
  try {
    const existing = await database.query(
      'SELECT * FROM reading_progress WHERE file_id = ?',
      [fileId]
    );

    if (existing.length === 0) {
      await database.run(
        `INSERT INTO reading_progress 
         (id, file_id, current_page, total_time_spent, sessions_count, 
          average_reading_speed, last_session_date, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
        [uuidv4(), fileId, currentPage, sessionDuration, readingSpeed, 
         new Date().toISOString(), new Date().toISOString()]
      );
    } else {
      const progress = existing[0];
      const newTotalTime = progress.total_time_spent + sessionDuration;
      const newSessionCount = progress.sessions_count + 1;
      const newAvgSpeed = ((progress.average_reading_speed * progress.sessions_count) + readingSpeed) / newSessionCount;

      await database.run(
        `UPDATE reading_progress 
         SET current_page = ?, total_time_spent = ?, sessions_count = ?,
             average_reading_speed = ?, last_session_date = ?, updated_at = ?
         WHERE file_id = ?`,
        [currentPage, newTotalTime, newSessionCount, newAvgSpeed,
         new Date().toISOString(), new Date().toISOString(), fileId]
      );
    }
  } catch (error) {
    console.error('Error updating reading progress:', error);
  }
}

// Helper function to update daily stats
async function updateDailyStats(date, duration, pagesRead) {
  try {
    const existing = await database.query(
      'SELECT * FROM daily_stats WHERE date = ?',
      [date]
    );

    if (existing.length === 0) {
      await database.run(
        `INSERT INTO daily_stats 
         (id, date, total_reading_time, pages_read, sessions_count, files_worked_on)
         VALUES (?, ?, ?, ?, 1, 1)`,
        [uuidv4(), date, duration, pagesRead]
      );
    } else {
      const stats = existing[0];
      await database.run(
        `UPDATE daily_stats 
         SET total_reading_time = ?, pages_read = ?, sessions_count = ?
         WHERE date = ?`,
        [stats.total_reading_time + duration, 
         stats.pages_read + pagesRead,
         stats.sessions_count + 1,
         date]
      );
    }
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
}

module.exports = router;
EOF

# Install dependencies
print_header "Installing Dependencies"
cd backend
npm install
cd ../frontend  
npm install
cd ..

print_status "All dependencies installed"

# Create start script
print_header "Creating Start Script"
cat > scripts/start-phase2.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Local Study Planner Phase 2"
echo "======================================="

# Kill existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2

# Create log directory
mkdir -p logs

# Start backend
echo "Starting Phase 2 backend..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Start frontend  
echo "Starting Phase 2 frontend..."
cd frontend
BROWSER=none npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend
sleep 5

echo ""
echo "🎉 Phase 2 is running!"
echo "======================"
echo "📱 Frontend: http://localhost:3000"
echo "🖥️  Backend: http://localhost:3001"
echo "📊 Analytics: http://localhost:3000/analytics"
echo "🎯 Goals: http://localhost:3000/goals"
echo ""
echo "📜 Logs:"
echo "   Backend: logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "Press Ctrl+C to stop"

# Cleanup function
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    echo "Stopped Phase 2"
    exit 0
}

trap cleanup INT TERM EXIT

# Open browser
(sleep 8 && open http://localhost:3000) &

# Wait
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "Backend died unexpectedly"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Frontend died unexpectedly"
        break
    fi
    sleep 5
done
EOF

chmod +x scripts/start-phase2.sh

print_status "Phase 2 setup complete!"
echo ""
print_info "🎉 Your Local Study Planner Phase 2 is ready!"
echo ""
print_info "📋 What's been added:"
echo "   📊 Advanced analytics dashboard"
echo "   🎯 Goal setting and tracking"
echo "   ⏱️  Real-time study timer"
echo "   📁 Topic organization"
echo "   📈 Reading speed analysis"
echo "   🗄️  SQLite database integration"
echo ""
print_info "🚀 To start Phase 2:"
echo "   ./scripts/start-phase2.sh"
echo ""
print_info "🌐 Access points:"
echo "   Main App: http://localhost:3000"
echo "   Analytics: http://localhost:3000/analytics"
echo "   Goals: http://localhost:3000/goals"
echo ""
print_warning "All Phase 1 features remain fully functional!"
print_info "📚 Happy studying with your enhanced planner!"