-- StudyTool - Smart Local Study Planner Database Schema
-- Phase 1: Core functionality

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
    session_type VARCHAR(50) DEFAULT 'reading', -- reading, review, note-taking
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

-- Sprint planning system
CREATE TABLE IF NOT EXISTS study_sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    start_page INTEGER,
    end_page INTEGER,
    estimated_minutes INTEGER NOT NULL,
    scheduled_date DATE,
    scheduled_time TIME,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    actual_duration_seconds INTEGER,
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced reading progress tracking
CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    current_page INTEGER DEFAULT 1,
    total_pages INTEGER NOT NULL,
    pages_read INTEGER DEFAULT 0,
    reading_speed_wpm DECIMAL(5,2),
    estimated_completion_date DATE,
    last_read_at TIMESTAMP,
    reading_streak_days INTEGER DEFAULT 0,
    bookmarks JSONB DEFAULT '[]'::jsonb,
    highlights JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goals and targets system
CREATE TABLE IF NOT EXISTS study_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) NOT NULL, -- daily_time, pages_per_day, complete_by_date, etc.
    target_value INTEGER NOT NULL,
    target_unit VARCHAR(20) NOT NULL, -- minutes, pages, files
    current_progress INTEGER DEFAULT 0,
    deadline DATE,
    is_achieved BOOLEAN DEFAULT false,
    achieved_at TIMESTAMP,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User daily progress tracking
CREATE TABLE IF NOT EXISTS daily_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    total_study_minutes INTEGER DEFAULT 0,
    pages_read INTEGER DEFAULT 0,
    sessions_completed INTEGER DEFAULT 0,
    sprints_completed INTEGER DEFAULT 0,
    focus_score DECIMAL(3,2), -- Average focus rating for the day
    daily_goal_met BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advanced analytics data
CREATE TABLE IF NOT EXISTS reading_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    pages_read INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    reading_speed_wpm DECIMAL(5,2),
    focus_incidents INTEGER DEFAULT 0,
    comprehension_self_rating INTEGER CHECK (comprehension_self_rating BETWEEN 1 AND 5),
    session_count INTEGER DEFAULT 0
);

-- Notes system with markdown support
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'markdown',
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    page_reference INTEGER,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_pinned BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note links for building knowledge graphs
CREATE TABLE IF NOT EXISTS note_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    target_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    link_type VARCHAR(50) DEFAULT 'reference', -- reference, elaboration, contradiction
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_note_id, target_note_id)
);

-- Study streaks and achievements
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    criteria JSONB NOT NULL,
    reward_points INTEGER DEFAULT 0,
    icon VARCHAR(10) DEFAULT '🏆',
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points_earned INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_topic ON files(topic_id);
CREATE INDEX IF NOT EXISTS idx_files_created ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_file ON study_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON study_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_progress_file ON reading_progress(file_id);
CREATE INDEX IF NOT EXISTS idx_sprints_date ON study_sprints(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_daily_progress_date ON daily_progress(date);
CREATE INDEX IF NOT EXISTS idx_analytics_file_date ON reading_analytics(file_id, date);
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
            updated_at = CURRENT_TIMESTAMP
        WHERE file_id = NEW.file_id;
        
        -- Update daily progress
        INSERT INTO daily_progress (date, total_study_minutes, pages_read, sessions_completed)
        VALUES (
            CURRENT_DATE,
            COALESCE(NEW.total_duration_seconds / 60, 0),
            COALESCE(NEW.pages_covered, 0),
            1
        )
        ON CONFLICT (date) DO UPDATE SET
            total_study_minutes = daily_progress.total_study_minutes + EXCLUDED.total_study_minutes,
            pages_read = daily_progress.pages_read + EXCLUDED.pages_read,
            sessions_completed = daily_progress.sessions_completed + EXCLUDED.sessions_completed;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reading_progress
    AFTER UPDATE ON study_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_progress();

-- Function to calculate reading speed
CREATE OR REPLACE FUNCTION calculate_reading_speed(session_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    session_record RECORD;
    wpm DECIMAL;
BEGIN
    SELECT pages_covered, total_duration_seconds 
    INTO session_record
    FROM study_sessions 
    WHERE id = session_id;
    
    IF session_record.total_duration_seconds > 0 AND session_record.pages_covered > 0 THEN
        -- Assuming average 250 words per page
        wpm := (session_record.pages_covered * 250.0) / (session_record.total_duration_seconds / 60.0);
        RETURN wpm;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Insert default user settings
INSERT INTO user_settings (setting_key, setting_value, setting_type) VALUES
('theme', 'light', 'string'),
('daily_goal_minutes', '60', 'integer'),
('default_session_length', '25', 'integer'),
('auto_pause_idle_minutes', '5', 'integer'),
('notifications_enabled', 'true', 'boolean'),
('reading_speed_wpm', '200', 'integer'),
('focus_mode_enabled', 'false', 'boolean')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample achievements
INSERT INTO achievements (title, description, achievement_type, criteria, reward_points, icon) VALUES
('First Steps', 'Complete your first study session', 'session_completion', '{"sessions": 1}', 10, '🚀'),
('Speed Reader', 'Read 50 pages in a single day', 'daily_pages', '{"pages": 50}', 25, '📚'),
('Consistent Scholar', 'Study for 7 consecutive days', 'streak', '{"days": 7}', 50, '🔥'),
('Marathon Reader', 'Complete a 100+ page document', 'document_completion', '{"min_pages": 100}', 75, '🏃'),
('Goal Crusher', 'Achieve 10 study goals', 'goals_achieved', '{"count": 10}', 100, '🎯')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE topics IS 'Study topics for organizing materials';
COMMENT ON TABLE files IS 'PDF files with enhanced metadata';
COMMENT ON TABLE study_sessions IS 'Detailed study session tracking';
COMMENT ON TABLE study_sprints IS 'Sprint planning and execution';
COMMENT ON TABLE reading_progress IS 'Per-file reading progress tracking';
COMMENT ON TABLE study_goals IS 'User-defined study goals and targets';
COMMENT ON TABLE daily_progress IS 'Daily study metrics and achievements';
COMMENT ON TABLE reading_analytics IS 'Advanced reading analytics data';
COMMENT ON TABLE notes IS 'Markdown notes with linking capabilities';
COMMENT ON TABLE achievements IS 'Achievement system for motivation';
