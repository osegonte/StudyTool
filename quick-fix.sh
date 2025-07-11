#!/bin/bash

# Quick fix for the missing migration file

echo "🔧 Quick fix for migration file..."

# Create the clean migration file directly
cat > backend/migrations/001_studytool_schema.sql << 'EOF'
-- StudyTool - Clean Database Schema
-- Fixed migration file

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User settings and preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topics with enhanced features
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#8B5CF6',
    icon VARCHAR(10) DEFAULT '📚',
    target_completion_date DATE,
    estimated_hours INTEGER,
    is_archived BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced files table for PDF management
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    page_count INTEGER NOT NULL,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    estimated_read_time_minutes INTEGER,
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    is_favorite BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study sessions with detailed tracking
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    session_type VARCHAR(50) DEFAULT 'reading',
    start_page INTEGER NOT NULL,
    end_page INTEGER,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    total_duration_seconds INTEGER,
    pages_covered INTEGER DEFAULT 0,
    focus_rating INTEGER CHECK (focus_rating BETWEEN 1 AND 5),
    notes TEXT,
    interruptions_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    session_goal TEXT,
    goal_achieved BOOLEAN DEFAULT false
);

-- Enhanced reading progress tracking
CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    current_page INTEGER DEFAULT 1,
    total_pages INTEGER NOT NULL,
    pages_read INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    reading_speed_wpm DECIMAL(5,2),
    estimated_completion_date DATE,
    last_read_at TIMESTAMP,
    reading_streak_days INTEGER DEFAULT 0,
    bookmarks JSONB DEFAULT '[]'::jsonb,
    highlights JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notes system
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general',
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    page_reference INTEGER,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_topic ON files(topic_id);
CREATE INDEX IF NOT EXISTS idx_files_created ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_file ON study_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON study_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_progress_file ON reading_progress(file_id);
CREATE INDEX IF NOT EXISTS idx_notes_file ON notes(file_id);
CREATE INDEX IF NOT EXISTS idx_notes_topic ON notes(topic_id);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);

-- Functions for automated calculations
CREATE OR REPLACE FUNCTION update_reading_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update reading progress when session ends
    IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
        UPDATE reading_progress 
        SET 
            pages_read = GREATEST(pages_read, NEW.end_page),
            last_read_at = NEW.session_end,
            completion_percentage = CASE 
                WHEN total_pages > 0 THEN (GREATEST(pages_read, NEW.end_page)::DECIMAL / total_pages) * 100
                ELSE 0 
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE file_id = NEW.file_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_reading_progress
    AFTER UPDATE ON study_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_progress();

-- Insert default user settings AFTER table is created
INSERT INTO user_settings (setting_key, setting_value, setting_type) VALUES
('theme', 'light', 'string'),
('daily_goal_minutes', '60', 'integer'),
('default_session_length', '25', 'integer'),
('auto_pause_idle_minutes', '5', 'integer'),
('notifications_enabled', 'true', 'boolean'),
('reading_speed_wpm', '200', 'integer'),
('focus_mode_enabled', 'false', 'boolean')
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON TABLE topics IS 'Study topics for organizing materials';
COMMENT ON TABLE files IS 'PDF files with enhanced metadata';
COMMENT ON TABLE study_sessions IS 'Detailed study session tracking';
COMMENT ON TABLE reading_progress IS 'Per-file reading progress tracking';
COMMENT ON TABLE notes IS 'Study notes with linking capabilities';
EOF

echo "✅ Migration file created!"

# Now run the migration
echo "🔄 Running database migration..."
cd backend

if node src/migrate.js; then
    echo "✅ Database migration completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi

cd ..

echo "✅ Database setup complete!"
echo ""
echo "🚀 Now starting the application..."

# Kill any existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start backend
echo "🔧 Starting backend..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

sleep 3

# Start frontend  
echo "🎨 Starting frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

sleep 8

# Check if services are running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend running on http://localhost:3001"
else
    echo "⚠️  Backend may still be starting..."
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend running on http://localhost:3000"
else
    echo "⚠️  Frontend may still be starting..."
fi

echo ""
echo "🎉 Study Planner is ready!"
echo "📚 Open: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop..."

# Cleanup function
cleanup() {
    echo "🔌 Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    echo "✅ Services stopped."
    exit 0
}

trap 'cleanup' INT

# Keep running
while true; do 
    sleep 1
done