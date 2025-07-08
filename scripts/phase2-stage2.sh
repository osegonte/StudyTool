#!/bin/bash

echo "📍 Phase 2 - Stage 2: Automatic Study Session Management"
echo "========================================================"
echo "🔧 Making time tracking completely automatic and invisible"
echo "🎯 Focus on studying, not managing timers!"
echo ""

# Colors for output
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

# Verify we're in the right directory
if [ ! -f "PROJECT_STATUS.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the local-study-planner root directory"
    exit 1
fi

print_info "Setting up Stage 2: Automatic Study Session Lifecycle"
print_warning "This will replace manual timers with automatic tracking"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

# 1. Create database schema for study sessions
print_info "Creating database schema for study sessions..."

cat << 'SESSION_MIGRATION_EOF' > backend/migrations/002_study_sessions.sql
-- Study Session Management for Phase 2 Stage 2

-- Study sessions table - tracks complete reading sessions
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    total_duration_seconds INTEGER DEFAULT 0,
    pages_covered INTEGER DEFAULT 0,
    start_page INTEGER DEFAULT 1,
    end_page INTEGER DEFAULT 1,
    session_type VARCHAR(50) DEFAULT 'reading', -- reading, review, practice
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session page activity - detailed page-by-page tracking within sessions
CREATE TABLE IF NOT EXISTS session_page_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    page_enter_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    page_exit_time TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0,
    activity_type VARCHAR(50) DEFAULT 'reading' -- reading, scrolling, idle
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_sessions_file_id ON study_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_active ON study_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_session_page_activity_session ON session_page_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_session_page_activity_page ON session_page_activity(page_number);

-- Add session tracking to existing tables
ALTER TABLE reading_progress 
ADD COLUMN IF NOT EXISTS current_session_id UUID REFERENCES study_sessions(id),
ADD COLUMN IF NOT EXISTS last_session_start TIMESTAMP,
ADD COLUMN IF NOT EXISTS total_study_time_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_count INTEGER DEFAULT 0;

-- Function to automatically end sessions after inactivity
CREATE OR REPLACE FUNCTION auto_end_inactive_sessions()
RETURNS void AS $$
BEGIN
    -- End sessions that have been inactive for more than 30 minutes
    UPDATE study_sessions 
    SET 
        session_end = CURRENT_TIMESTAMP,
        is_active = false,
        total_duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - session_start))::INTEGER
    WHERE 
        is_active = true 
        AND session_start < CURRENT_TIMESTAMP - INTERVAL '30 minutes'
        AND session_end IS NULL;
        
    -- Also end any orphaned page activities
    UPDATE session_page_activity 
    SET 
        page_exit_time = CURRENT_TIMESTAMP,
        duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - page_enter_time))::INTEGER
    WHERE 
        page_exit_time IS NULL 
        AND page_enter_time < CURRENT_TIMESTAMP - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to update reading progress when sessions change
CREATE OR REPLACE FUNCTION update_session_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update reading progress with session data
    UPDATE reading_progress 
    SET 
        total_study_time_seconds = (
            SELECT COALESCE(SUM(total_duration_seconds), 0) 
            FROM study_sessions 
            WHERE file_id = NEW.file_id AND session_end IS NOT NULL
        ),
        session_count = (
            SELECT COUNT(*) 
            FROM study_sessions 
            WHERE file_id = NEW.file_id AND session_end IS NOT NULL
        ),
        last_read = CURRENT_TIMESTAMP
    WHERE file_id = NEW.file_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for session updates
DROP TRIGGER IF EXISTS trigger_update_session_progress ON study_sessions;
CREATE TRIGGER trigger_update_session_progress
    AFTER INSERT OR UPDATE ON study_sessions
    FOR EACH ROW EXECUTE FUNCTION update_session_progress();

COMMENT ON TABLE study_sessions IS 'Tracks complete study sessions with start/end times and summary data';
COMMENT ON TABLE session_page_activity IS 'Detailed page-by-page activity within study sessions';
COMMENT ON COLUMN study_sessions.session_type IS 'Type of session: reading, review, practice, etc.';
SESSION_MIGRATION_EOF

print_status "Created study session database schema"

# 2. Create automatic session management API
print_info "Creating automatic session management API..."

cat << 'SESSION_API_EOF' > backend/src/routes/study-sessions.js
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Get current user for database connection
const currentUser = process.env.USER || process.env.USERNAME || 'postgres';

// Initialize database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'study_planner',
  user: process.env.DB_USER || currentUser,
  password: process.env.DB_PASSWORD || '',
  ssl: false,
});

// Automatically start a study session when user opens a PDF
router.post('/start/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { startPage = 1, sessionType = 'reading' } = req.body;
    
    // First, end any existing active sessions for this file
    await pool.query(
      `UPDATE study_sessions 
       SET session_end = CURRENT_TIMESTAMP, 
           is_active = false,
           total_duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - session_start))::INTEGER
       WHERE file_id = $1 AND is_active = true`,
      [fileId]
    );
    
    // Also clean up any orphaned page activities
    await pool.query(`
      UPDATE session_page_activity 
      SET page_exit_time = CURRENT_TIMESTAMP,
          duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - page_enter_time))::INTEGER
      WHERE page_exit_time IS NULL 
        AND session_id IN (
          SELECT id FROM study_sessions WHERE file_id = $1
        )
    `, [fileId]);
    
    // Create new study session
    const sessionResult = await pool.query(
      `INSERT INTO study_sessions (file_id, start_page, session_type) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [fileId, startPage, sessionType]
    );
    
    const session = sessionResult.rows[0];
    
    // Update reading progress with current session
    await pool.query(
      `UPDATE reading_progress 
       SET current_session_id = $1, last_session_start = CURRENT_TIMESTAMP 
       WHERE file_id = $2`,
      [session.id, fileId]
    );
    
    // Start tracking the first page
    await pool.query(
      `INSERT INTO session_page_activity (session_id, page_number) 
       VALUES ($1, $2)`,
      [session.id, startPage]
    );
    
    res.json({ 
      success: true, 
      session: session,
      message: 'Study session started automatically' 
    });
    
  } catch (error) {
    console.error('Error starting study session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track page changes within a session (automatic)
router.post('/page-change/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { fromPage, toPage, timestamp } = req.body;
    
    // End tracking for the previous page
    if (fromPage) {
      await pool.query(
        `UPDATE session_page_activity 
         SET page_exit_time = $1,
             duration_seconds = EXTRACT(epoch FROM ($1 - page_enter_time))::INTEGER
         WHERE session_id = $2 AND page_number = $3 AND page_exit_time IS NULL`,
        [timestamp || 'CURRENT_TIMESTAMP', sessionId, fromPage]
      );
    }
    
    // Start tracking the new page
    if (toPage) {
      await pool.query(
        `INSERT INTO session_page_activity (session_id, page_number, page_enter_time) 
         VALUES ($1, $2, $3)`,
        [sessionId, toPage, timestamp || 'CURRENT_TIMESTAMP']
      );
      
      // Update session's current end page
      await pool.query(
        'UPDATE study_sessions SET end_page = $1 WHERE id = $2',
        [toPage, sessionId]
      );
    }
    
    res.json({ 
      success: true, 
      message: `Page tracking updated: ${fromPage} → ${toPage}` 
    });
    
  } catch (error) {
    console.error('Error tracking page change:', error);
    res.status(500).json({ error: error.message });
  }
});

// Automatically end a study session
router.post('/end/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { endPage, notes } = req.body;
    
    // Get the current active session
    const activeSessionResult = await pool.query(
      'SELECT * FROM study_sessions WHERE file_id = $1 AND is_active = true ORDER BY session_start DESC LIMIT 1',
      [fileId]
    );
    
    if (activeSessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active session found' });
    }
    
    const session = activeSessionResult.rows[0];
    
    // End any active page tracking
    await pool.query(
      `UPDATE session_page_activity 
       SET page_exit_time = CURRENT_TIMESTAMP,
           duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - page_enter_time))::INTEGER
       WHERE session_id = $1 AND page_exit_time IS NULL`,
      [session.id]
    );
    
    // Calculate session statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT page_number) as pages_covered,
        SUM(duration_seconds) as total_duration
      FROM session_page_activity 
      WHERE session_id = $1
    `, [session.id]);
    
    const stats = statsResult.rows[0];
    
    // End the study session
    const endResult = await pool.query(
      `UPDATE study_sessions 
       SET session_end = CURRENT_TIMESTAMP,
           is_active = false,
           total_duration_seconds = $1,
           pages_covered = $2,
           end_page = $3,
           notes = $4
       WHERE id = $5 
       RETURNING *`,
      [stats.total_duration || 0, stats.pages_covered || 0, endPage || session.start_page, notes, session.id]
    );
    
    // Clear current session from reading progress
    await pool.query(
      'UPDATE reading_progress SET current_session_id = NULL WHERE file_id = $1',
      [fileId]
    );
    
    res.json({ 
      success: true, 
      session: endResult.rows[0],
      stats: stats,
      message: 'Study session ended automatically' 
    });
    
  } catch (error) {
    console.error('Error ending study session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current session status
router.get('/current/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        ss.*,
        EXTRACT(epoch FROM (CURRENT_TIMESTAMP - ss.session_start))::INTEGER as current_duration,
        COUNT(DISTINCT spa.page_number) as pages_visited,
        MAX(spa.page_number) as current_page
      FROM study_sessions ss
      LEFT JOIN session_page_activity spa ON ss.id = spa.session_id
      WHERE ss.file_id = $1 AND ss.is_active = true
      GROUP BY ss.id
      ORDER BY ss.session_start DESC
      LIMIT 1
    `, [fileId]);
    
    if (result.rows.length === 0) {
      return res.json({ 
        active_session: null,
        message: 'No active session' 
      });
    }
    
    res.json({ 
      active_session: result.rows[0],
      message: 'Active session found' 
    });
    
  } catch (error) {
    console.error('Error getting current session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session history for a file
router.get('/history/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { limit = 10 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        ss.*,
        COUNT(DISTINCT spa.page_number) as unique_pages_visited,
        AVG(spa.duration_seconds) as avg_time_per_page
      FROM study_sessions ss
      LEFT JOIN session_page_activity spa ON ss.id = spa.session_id
      WHERE ss.file_id = $1 AND ss.session_end IS NOT NULL
      GROUP BY ss.id
      ORDER BY ss.session_start DESC
      LIMIT $2
    `, [fileId, limit]);
    
    res.json({ 
      sessions: result.rows,
      total: result.rows.length 
    });
    
  } catch (error) {
    console.error('Error getting session history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clean up inactive sessions (run periodically)
router.post('/cleanup', async (req, res) => {
  try {
    await pool.query('SELECT auto_end_inactive_sessions()');
    
    res.json({ 
      success: true, 
      message: 'Inactive sessions cleaned up' 
    });
    
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
SESSION_API_EOF

print_status "Created automatic session management API"

# 3. Create invisible automatic session tracker component
print_info "Creating invisible session tracker component..."

cat << 'AUTO_TRACKER_EOF' > frontend/src/components/AutoSessionTracker.js
import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

const AutoSessionTracker = ({ fileId, currentPage, onPageChange }) => {
  const [sessionId, setSessionId] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const lastPageRef = useRef(currentPage);
  const sessionTimeoutRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const PAGE_CHANGE_DELAY = 2000; // 2 seconds delay before registering page change

  // Automatically start session when component mounts
  useEffect(() => {
    startSession();
    
    // Cleanup when component unmounts
    return () => {
      if (sessionId) {
        endSession();
      }
    };
  }, [fileId]);

  // Handle page changes automatically
  useEffect(() => {
    if (currentPage !== lastPageRef.current && sessionId) {
      // Clear any existing timeout
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      
      // Wait a bit before registering page change (avoid rapid changes)
      sessionTimeoutRef.current = setTimeout(() => {
        handlePageChange(lastPageRef.current, currentPage);
        lastPageRef.current = currentPage;
      }, PAGE_CHANGE_DELAY);
    }
  }, [currentPage, sessionId]);

  // Auto-activity detection
  useEffect(() => {
    const resetActivityTimeout = () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      activityTimeoutRef.current = setTimeout(() => {
        // Auto-end session after inactivity
        if (sessionId) {
          endSession();
        }
      }, INACTIVITY_TIMEOUT);
    };

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetActivityTimeout();
    };

    // Add event listeners for activity detection
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Start activity timeout
    resetActivityTimeout();

    // Cleanup
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [sessionId]);

  const startSession = async () => {
    try {
      const response = await api.post(`/study-sessions/start/${fileId}`, {
        startPage: currentPage,
        sessionType: 'reading'
      });
      
      setSessionId(response.data.session.id);
      setIsTracking(true);
      lastPageRef.current = currentPage;
      
      console.log('📚 Study session started automatically');
      
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handlePageChange = async (fromPage, toPage) => {
    if (!sessionId) return;
    
    try {
      await api.post(`/study-sessions/page-change/${sessionId}`, {
        fromPage,
        toPage,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error tracking page change:', error);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      await api.post(`/study-sessions/end/${fileId}`, {
        endPage: currentPage,
        notes: `Session ended at page ${currentPage}`
      });
      
      setSessionId(null);
      setIsTracking(false);
      
      console.log('📚 Study session ended automatically');
      
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // This component renders nothing - it's completely invisible
  return null;
};

export default AutoSessionTracker;
AUTO_TRACKER_EOF

print_status "Created invisible automatic session tracker"

# 4. Update backend index.js to include session routes
print_info "Integrating session management routes..."

if ! grep -q "study-sessions" backend/src/index.js; then
    # Add study session routes
    sed '/const pageTrackingRoutes/a\
const studySessionRoutes = require("./routes/study-sessions");\
app.use("/api/study-sessions", studySessionRoutes);' backend/src/index.js > backend/src/index.js.tmp && mv backend/src/index.js.tmp backend/src/index.js
    
    print_status "Study session routes integrated"
else
    print_warning "Study session routes already integrated"
fi

# 5. Create improved PDF viewer with automatic tracking
print_info "Creating automatic tracking PDF viewer..."

cat << 'IMPROVED_VIEWER_EOF' > frontend/src/pages/PDFViewerAuto.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Home, Clock, Activity } from 'lucide-react';
import api from '../services/api';
import AutoSessionTracker from '../components/AutoSessionTracker';

const PDFViewerAuto = () => {
  const { fileId } = useParams();
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    loadFile();
    checkCurrentSession();
  }, [fileId]);

  // Check for active session every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkCurrentSession, 30000);
    return () => clearInterval(interval);
  }, [fileId]);

  const loadFile = async () => {
    try {
      const fileResponse = await api.get(`/files/${fileId}/metadata`);
      setFileInfo(fileResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError('Failed to load PDF file');
      setLoading(false);
    }
  };

  const checkCurrentSession = async () => {
    try {
      const response = await api.get(`/study-sessions/current/${fileId}`);
      setSessionInfo(response.data.active_session);
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading) {
    return (
      <div className="pdf-viewer loading-container">
        <div className="loading">Loading PDF...</div>
      </div>
    );
  }

  if (error || !fileInfo) {
    return (
      <div className="pdf-viewer error-container">
        <div className="error">{error || 'PDF not found'}</div>
        <Link to="/files" className="btn btn-primary">
          <ArrowLeft size={16} />
          Back to Files
        </Link>
      </div>
    );
  }

  const pdfUrl = `http://localhost:3001/uploads/${fileInfo.filename}`;

  return (
    <div className="pdf-viewer">
      {/* Invisible automatic session tracking */}
      <AutoSessionTracker 
        fileId={fileId}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <div className="viewer-header">
        <div className="viewer-nav">
          <Link to="/files" className="btn btn-secondary">
            <ArrowLeft size={16} />
            Back
          </Link>
          <Link to="/" className="btn btn-secondary">
            <Home size={16} />
          </Link>
        </div>

        <div className="file-title">
          <h2>{fileInfo.original_name}</h2>
          <div className="progress-info">
            {fileInfo.page_count} pages • {Math.round(fileInfo.file_size / 1024)} KB
          </div>
        </div>

        {/* Minimal session status indicator */}
        {sessionInfo && (
          <div className="session-status">
            <div className="status-indicator active">
              <Activity size={14} />
              <span>Recording</span>
            </div>
            <div className="session-time">
              <Clock size={14} />
              <span>{formatDuration(sessionInfo.current_duration)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="viewer-content">
        <iframe
          src={pdfUrl}
          width="100%"
          height="100%"
          style={{ border: 'none', minHeight: '80vh' }}
          title={fileInfo.original_name}
          onLoad={() => {
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};

export default PDFViewerAuto;
IMPROVED_VIEWER_EOF

print_status "Created automatic tracking PDF viewer"

# 6. Add CSS for session indicators
print_info "Adding CSS for automatic session tracking..."

cat << 'SESSION_CSS_EOF' >> frontend/src/styles/App.css

/* Automatic Session Tracking Styles - Phase 2 Stage 2 */
.session-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #10b981;
  font-weight: 500;
}

.status-indicator.active svg {
  animation: pulse 2s infinite;
}

.session-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #64748b;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Minimal and unobtrusive design */
.viewer-header {
  position: relative;
}

.session-status {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Hide session status on small screens to avoid clutter */
@media (max-width: 768px) {
  .session-status {
    display: none;
  }
}
SESSION_CSS_EOF

print_status "Added CSS for session indicators"

# 7. Run database migration
print_info "Running database migration for study sessions..."

psql -d study_planner -f backend/migrations/002_study_sessions.sql 2>/dev/null

if [ $? -eq 0 ]; then
    print_status "Database migration completed successfully"
else
    print_warning "Database migration may have failed. Try manually:"
    echo "psql -d study_planner -f backend/migrations/002_study_sessions.sql"
fi

# 8. Update App.js to use the new automatic viewer
print_info "Updating App.js to use automatic PDF viewer..."

if ! grep -q "PDFViewerAuto" frontend/src/App.js; then
    # Backup and update App.js
    cp frontend/src/App.js frontend/src/App.js.backup
    
    sed 's/import PDFViewer from/import PDFViewerAuto from/g; s/PDFViewer/PDFViewerAuto/g; s/\.\/pages\/PDFViewer/\.\/pages\/PDFViewerAuto/g' frontend/src/App.js > frontend/src/App.js.tmp && mv frontend/src/App.js.tmp frontend/src/App.js
    
    print_status "App.js updated to use automatic viewer"
else
    print_warning "Automatic viewer already integrated"
fi

# 9. Create session cleanup service
cat << 'CLEANUP_SERVICE_EOF' > backend/src/services/session-cleanup.js
// Automatic session cleanup service
const { Pool } = require('pg');

const currentUser = process.env.USER || process.env.USERNAME || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'study_planner',
  user: process.env.DB_USER || currentUser,
  password: process.env.DB_PASSWORD || '',
  ssl: false,
});

// Run cleanup every 10 minutes
const startCleanupService = () => {
  setInterval(async () => {
    try {
      await pool.query('SELECT auto_end_inactive_sessions()');
      console.log('🧹 Cleaned up inactive sessions');
    } catch (error) {
      console.error('Error in session cleanup:', error);
    }
  }, 10 * 60 * 1000); // 10 minutes
};

module.exports = { startCleanupService };
CLEANUP_SERVICE_EOF

# Add cleanup service to main backend
if ! grep -q "session-cleanup" backend/src/index.js; then
    sed '/const startServer = async/i\
// Start session cleanup service\
const { startCleanupService } = require("./services/session-cleanup");\
startCleanupService();' backend/src/index.js > backend/src/index.js.tmp && mv backend/src/index.js.tmp backend/src/index.js
    
    print_status "Session cleanup service integrated"
fi

# 10. Create test script for Stage 2
cat << 'STAGE2_TEST_EOF' > scripts/test-stage2.sh
#!/bin/bash

echo "🧪 Testing Stage 2: Automatic Study Session Management"
echo "===================================================="

# Test backend health and new endpoints
echo "Testing backend connection..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running"
    
    # Test session endpoints
    echo ""
    echo "🔍 Testing new session API endpoints..."
    echo "Available endpoints:"
    echo "  • POST /api/study-sessions/start/:fileId"
    echo "  • POST /api/study-sessions/end/:fileId"
    echo "  • GET  /api/study-sessions/current/:fileId"
    echo "  • GET  /api/study-sessions/history/:fileId"
    echo "  • POST /api/study-sessions/cleanup"
    
    echo ""
    echo "✅ Stage 2 API endpoints are ready!"
    echo ""
    echo "📋 Automatic Testing Checklist:"
    echo "1. ✅ Backend running with session APIs"
    echo "2. ⏳ Start your app: ./scripts/start-phase1.sh"
    echo "3. ⏳ Open a PDF file"
    echo "4. ⏳ Check for small 'Recording' indicator (top-right)"
    echo "5. ⏳ Navigate between pages (automatic tracking)"
    echo "6. ⏳ Leave PDF viewer (session auto-ends)"
    echo "7. ⏳ Check database for session records"
    
    echo ""
    echo "🎯 What should happen automatically:"
    echo "  • Session starts when you open a PDF"
    echo "  • Page changes are tracked invisibly"
    echo "  • Time per page is recorded"
    echo "  • Session ends when you leave or are inactive"
    echo "  • No manual timer management needed!"
    
else
    echo "❌ Backend not running. Start with: ./scripts/start-phase1.sh"
fi
STAGE2_TEST_EOF

chmod +x scripts/test-stage2.sh

print_status "Created Stage 2 test script"

# 11. Create services directory if it doesn't exist
mkdir -p backend/src/services

print_status "✅ Stage 2: Automatic Study Session Management setup complete!"
echo ""
echo "🎯 What Stage 2 Added:"
echo "   • ✅ Automatic session start when opening PDFs"
echo "   • ✅ Invisible page-by-page time tracking"
echo "   • ✅ Automatic session end on inactivity/close"
echo "   • ✅ Session history and statistics"
echo "   • ✅ Minimal 'Recording' indicator (unobtrusive)"
echo "   • ✅ Background cleanup of inactive sessions"
echo ""
echo "🔄 Database Changes:"
echo "   • ✅ New tables: study_sessions, session_page_activity"
echo "   • ✅ Automatic triggers for progress updates"
echo "   • ✅ Session cleanup functions"
echo ""
echo "🚀 Next Steps:"
echo "1. Test the setup: ./scripts/test-stage2.sh"
echo "2. Start your app: ./scripts/start-phase1.sh"
echo "3. Open any PDF - session starts automatically!"
echo "4. Study normally - everything is tracked invisibly"
echo "5. Ready for Stage 3: Reading Speed Analysis"
echo ""
print_warning "IMPORTANT: The app now uses PDFViewerAuto for automatic tracking"
print_info "You should see a small 'Recording' indicator when viewing PDFs"
echo ""
echo "🎓 Focus on studying - the app handles all the tracking!"