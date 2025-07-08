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
