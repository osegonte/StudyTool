-- Enhanced Database Schema for SprintStudy
-- Complete study tracking, notes, and analytics system

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For better text search

-- ================================
-- ENHANCED STUDY SESSIONS SYSTEM
-- ================================

-- Study sessions with detailed tracking
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    session_type VARCHAR(50) DEFAULT 'reading', -- reading, review, note-taking, pomodoro
    start_page INTEGER NOT NULL,
    end_page INTEGER,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    total_duration_seconds INTEGER,
    active_duration_seconds INTEGER, -- Excluding pause time
    pages_covered INTEGER DEFAULT 0,
    focus_rating INTEGER CHECK (focus_rating BETWEEN 1 AND 5),
    distractions_count INTEGER DEFAULT 0,
    notes TEXT,
    interruptions_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    session_goal TEXT,
    goal_achieved BOOLEAN DEFAULT false,
    pomodoro_cycles INTEGER DEFAULT 0,
    break_time_seconds INTEGER DEFAULT 0,
    environment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Page-level tracking within sessions
CREATE TABLE IF NOT EXISTS session_page_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    page_enter_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    page_exit_time TIMESTAMP,
    duration_seconds INTEGER,
    scroll_events INTEGER DEFAULT 0,
    zoom_events INTEGER DEFAULT 0,
    interaction_count INTEGER DEFAULT 0,
    reading_speed_wpm DECIMAL(5,2),
    comprehension_rating INTEGER CHECK (comprehension_rating BETWEEN 1 AND 5)
);

-- Session pause tracking
CREATE TABLE IF NOT EXISTS session_pauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    pause_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pause_end TIMESTAMP,
    pause_duration_seconds INTEGER,
    pause_reason VARCHAR(100), -- idle, manual, distraction, break
    auto_detected BOOLEAN DEFAULT false
);

-- ================================
-- ENHANCED NOTES SYSTEM
-- ================================

-- Smart notes with markdown support and PDF anchoring
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_html TEXT, -- Rendered markdown for search
    note_type VARCHAR(50) DEFAULT 'study', -- study, summary, insight, question
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    page_reference INTEGER,
    page_anchor_data JSONB DEFAULT '{}'::jsonb, -- Precise positioning data
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_pinned BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    word_count INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 0,
    last_accessed TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    search_vector tsvector, -- Full-text search
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bidirectional note links for knowledge graphs
CREATE TABLE IF NOT EXISTS note_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    target_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    target_title VARCHAR(500), -- For linking to non-existent notes
    link_type VARCHAR(50) DEFAULT 'reference', -- reference, elaboration, contradiction, question
    link_text VARCHAR(500),
    context_snippet TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_note_id, target_note_id)
);

-- Note versions for history tracking
CREATE TABLE IF NOT EXISTS note_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    title VARCHAR(500) NOT NULL,
    version_number INTEGER NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note attachments and PDF anchors
CREATE TABLE IF NOT EXISTS note_pdf_anchors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    anchor_type VARCHAR(50) DEFAULT 'text', -- text, highlight, annotation, bookmark
    anchor_text TEXT,
    selection_data JSONB DEFAULT '{}'::jsonb, -- Selection coordinates, highlight color, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- BOOKMARKS & HIGHLIGHTS SYSTEM
-- ================================

-- Enhanced bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    bookmark_type VARCHAR(50) DEFAULT 'manual', -- manual, auto, important, review
    color VARCHAR(7) DEFAULT '#FFD700',
    position_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Text highlights within PDFs
CREATE TABLE IF NOT EXISTS highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    selected_text TEXT NOT NULL,
    highlight_color VARCHAR(7) DEFAULT '#FFFF00',
    selection_data JSONB NOT NULL, -- Coordinates, text positions
    note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
    highlight_type VARCHAR(50) DEFAULT 'important', -- important, question, summary, unclear
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- ANALYTICS & PERFORMANCE TRACKING
-- ================================

-- Daily study progress aggregation
CREATE TABLE IF NOT EXISTS daily_study_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    total_study_minutes INTEGER DEFAULT 0,
    active_study_minutes INTEGER DEFAULT 0, -- Excluding breaks/pauses
    pages_read INTEGER DEFAULT 0,
    unique_pages_read INTEGER DEFAULT 0,
    sessions_completed INTEGER DEFAULT 0,
    pomodoros_completed INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    words_written INTEGER DEFAULT 0,
    avg_focus_rating DECIMAL(3,2),
    avg_reading_speed_wpm DECIMAL(5,2),
    total_distractions INTEGER DEFAULT 0,
    daily_goal_minutes INTEGER DEFAULT 60,
    goal_achieved BOOLEAN DEFAULT false,
    longest_session_minutes INTEGER DEFAULT 0,
    files_studied INTEGER DEFAULT 0,
    topics_studied INTEGER DEFAULT 0,
    reading_streak_days INTEGER DEFAULT 0,
    productivity_score DECIMAL(5,2), -- Calculated metric
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reading performance analytics
CREATE TABLE IF NOT EXISTS reading_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    page_number INTEGER NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    reading_speed_wpm DECIMAL(5,2),
    comprehension_rating INTEGER CHECK (comprehension_rating BETWEEN 1 AND 5),
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    attention_events JSONB DEFAULT '{}'::jsonb, -- Scrolling, zooming, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study patterns and insights
CREATE TABLE IF NOT EXISTS study_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_type VARCHAR(100) NOT NULL, -- peak_hours, slow_topics, improvement_areas
    insight_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    date_range_start DATE,
    date_range_end DATE,
    is_actionable BOOLEAN DEFAULT false,
    action_taken BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- GOAL SETTING & ACHIEVEMENT SYSTEM
-- ================================

-- Study goals with smart tracking
CREATE TABLE IF NOT EXISTS study_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) NOT NULL, -- daily_time, pages_per_day, complete_file, skill_mastery
    target_value DECIMAL(10,2) NOT NULL,
    current_progress DECIMAL(10,2) DEFAULT 0,
    target_unit VARCHAR(20) NOT NULL, -- minutes, pages, files, percent
    deadline DATE,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50), -- daily, weekly, monthly
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    is_achieved BOOLEAN DEFAULT false,
    achieved_at TIMESTAMP,
    streak_count INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_progress_update TIMESTAMP,
    auto_tracking BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goal progress tracking
CREATE TABLE IF NOT EXISTS goal_progress_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES study_goals(id) ON DELETE CASCADE,
    progress_value DECIMAL(10,2) NOT NULL,
    progress_date DATE NOT NULL,
    notes TEXT,
    session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- ENHANCED READING PROGRESS
-- ================================

-- Detailed reading progress per file
CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    current_page INTEGER DEFAULT 1,
    total_pages INTEGER NOT NULL,
    pages_read INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    reading_speed_wpm DECIMAL(5,2),
    avg_time_per_page_seconds INTEGER,
    difficult_pages INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    favorite_pages INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    review_pages INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    last_read_at TIMESTAMP,
    total_reading_time_seconds INTEGER DEFAULT 0,
    reading_streak_days INTEGER DEFAULT 0,
    longest_session_minutes INTEGER DEFAULT 0,
    comprehension_score DECIMAL(3,2),
    current_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
    last_session_start TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- SPACED REPETITION SYSTEM
-- ================================

-- Spaced repetition for review scheduling
CREATE TABLE IF NOT EXISTS review_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
    ease_factor DECIMAL(3,2) DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    repetition_count INTEGER DEFAULT 0,
    next_review_date DATE NOT NULL,
    last_review_date DATE,
    quality_rating INTEGER CHECK (quality_rating BETWEEN 0 AND 5),
    review_type VARCHAR(50) DEFAULT 'content', -- content, notes, highlights
    is_due BOOLEAN GENERATED ALWAYS AS (next_review_date <= CURRENT_DATE) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- USER SETTINGS & PREFERENCES
-- ================================

-- Enhanced user settings
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string', -- string, integer, boolean, json
    is_user_modified BOOLEAN DEFAULT false,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(setting_category, setting_key)
);

-- ================================
-- PERFORMANCE INDEXES
-- ================================

-- Study sessions indexes
CREATE INDEX IF NOT EXISTS idx_study_sessions_file_date ON study_sessions(file_id, session_start);
CREATE INDEX IF NOT EXISTS idx_study_sessions_active ON study_sessions(is_active, session_start);
CREATE INDEX IF NOT EXISTS idx_study_sessions_duration ON study_sessions(total_duration_seconds DESC);

-- Page activity indexes
CREATE INDEX IF NOT EXISTS idx_page_activity_session ON session_page_activity(session_id, page_number);
CREATE INDEX IF NOT EXISTS idx_page_activity_duration ON session_page_activity(duration_seconds DESC);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_file_page ON notes(file_id, page_reference);
CREATE INDEX IF NOT EXISTS idx_notes_topic ON notes(topic_id);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_search ON notes USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_daily_progress_date ON daily_study_progress(date DESC);
CREATE INDEX IF NOT EXISTS idx_reading_analytics_file_date ON reading_analytics(file_id, date);
CREATE INDEX IF NOT EXISTS idx_reading_analytics_performance ON reading_analytics(reading_speed_wpm, comprehension_rating);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON study_goals(deadline, is_achieved);
CREATE INDEX IF NOT EXISTS idx_goals_progress ON study_goals(current_progress, target_value);

-- Review schedule indexes
CREATE INDEX IF NOT EXISTS idx_review_schedule_due ON review_schedule(is_due, next_review_date);
CREATE INDEX IF NOT EXISTS idx_review_schedule_file ON review_schedule(file_id, next_review_date);

-- ================================
-- AUTOMATED FUNCTIONS & TRIGGERS
-- ================================

-- Function to update note search vector
CREATE OR REPLACE FUNCTION update_note_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
    NEW.word_count := array_length(string_to_array(NEW.content, ' '), 1);
    NEW.reading_time_minutes := CEIL(NEW.word_count / 200.0); -- Average reading speed
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_note_search_vector
    BEFORE INSERT OR UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_note_search_vector();

-- Function to auto-end inactive sessions
CREATE OR REPLACE FUNCTION auto_end_inactive_sessions()
RETURNS INTEGER AS $$
DECLARE
    ended_sessions INTEGER := 0;
BEGIN
    -- End sessions that have been inactive for more than 30 minutes
    UPDATE study_sessions 
    SET 
        session_end = CURRENT_TIMESTAMP,
        is_active = false,
        total_duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - session_start))::INTEGER,
        notes = COALESCE(notes, '') || ' (Auto-ended due to inactivity)'
    WHERE 
        is_active = true 
        AND session_start < CURRENT_TIMESTAMP - INTERVAL '30 minutes'
        AND session_end IS NULL;
    
    GET DIAGNOSTICS ended_sessions = ROW_COUNT;
    
    RETURN ended_sessions;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily progress
CREATE OR REPLACE FUNCTION update_daily_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily progress when session ends
    IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
        INSERT INTO daily_study_progress (
            date,
            total_study_minutes,
            active_study_minutes,
            pages_read,
            sessions_completed,
            avg_focus_rating,
            total_distractions
        )
        VALUES (
            CURRENT_DATE,
            COALESCE(NEW.total_duration_seconds / 60, 0),
            COALESCE(NEW.active_duration_seconds / 60, 0),
            COALESCE(NEW.pages_covered, 0),
            1,
            NEW.focus_rating,
            NEW.distractions_count
        )
        ON CONFLICT (date) DO UPDATE SET
            total_study_minutes = daily_study_progress.total_study_minutes + EXCLUDED.total_study_minutes,
            active_study_minutes = daily_study_progress.active_study_minutes + EXCLUDED.active_study_minutes,
            pages_read = daily_study_progress.pages_read + EXCLUDED.pages_read,
            sessions_completed = daily_study_progress.sessions_completed + EXCLUDED.sessions_completed,
            avg_focus_rating = (
                (daily_study_progress.avg_focus_rating * (daily_study_progress.sessions_completed - 1) + COALESCE(NEW.focus_rating, 0)) 
                / daily_study_progress.sessions_completed
            ),
            total_distractions = daily_study_progress.total_distractions + EXCLUDED.total_distractions;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_progress
    AFTER UPDATE ON study_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_progress();

-- Function to calculate reading speed
CREATE OR REPLACE FUNCTION calculate_reading_speed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.duration_seconds > 30 AND NEW.duration_seconds IS NOT NULL THEN
        -- Estimate reading speed based on average words per page (250)
        NEW.reading_speed_wpm := (250.0 * 60) / NEW.duration_seconds;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_reading_speed
    BEFORE INSERT OR UPDATE ON session_page_activity
    FOR EACH ROW
    EXECUTE FUNCTION calculate_reading_speed();

-- Function to update spaced repetition schedule
CREATE OR REPLACE FUNCTION update_review_schedule(
    p_file_id UUID,
    p_page_number INTEGER,
    p_quality_rating INTEGER
)
RETURNS VOID AS $$
DECLARE
    current_schedule RECORD;
    new_interval INTEGER;
    new_ease_factor DECIMAL(3,2);
BEGIN
    -- Get current schedule
    SELECT * INTO current_schedule
    FROM review_schedule
    WHERE file_id = p_file_id AND page_number = p_page_number;
    
    IF current_schedule IS NULL THEN
        -- Create new schedule entry
        INSERT INTO review_schedule (file_id, page_number, next_review_date)
        VALUES (p_file_id, p_page_number, CURRENT_DATE + INTERVAL '1 day');
        RETURN;
    END IF;
    
    -- Calculate new interval based on SM-2 algorithm
    IF p_quality_rating >= 3 THEN
        IF current_schedule.repetition_count = 0 THEN
            new_interval := 1;
        ELSIF current_schedule.repetition_count = 1 THEN
            new_interval := 6;
        ELSE
            new_interval := ROUND(current_schedule.interval_days * current_schedule.ease_factor);
        END IF;
        
        new_ease_factor := current_schedule.ease_factor + (0.1 - (5 - p_quality_rating) * (0.08 + (5 - p_quality_rating) * 0.02));
    ELSE
        new_interval := 1;
        new_ease_factor := current_schedule.ease_factor;
    END IF;
    
    -- Ensure ease factor doesn't go below 1.3
    new_ease_factor := GREATEST(new_ease_factor, 1.3);
    
    -- Update schedule
    UPDATE review_schedule
    SET
        last_review_date = CURRENT_DATE,
        next_review_date = CURRENT_DATE + (new_interval || ' days')::INTERVAL,
        interval_days = new_interval,
        ease_factor = new_ease_factor,
        repetition_count = current_schedule.repetition_count + 1,
        quality_rating = p_quality_rating,
        updated_at = CURRENT_TIMESTAMP
    WHERE file_id = p_file_id AND page_number = p_page_number;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- INITIAL DATA & SETTINGS
-- ================================

-- Insert default user settings
INSERT INTO user_settings (setting_category, setting_key, setting_value, setting_type) VALUES
('ui', 'theme', 'light', 'string'),
('study', 'daily_goal_minutes', '60', 'integer'),
('study', 'pomodoro_work_duration', '25', 'integer'),
('study', 'pomodoro_short_break', '5', 'integer'),
('study', 'pomodoro_long_break', '15', 'integer'),
('study', 'auto_pause_idle_minutes', '2', 'integer'),
('notifications', 'enabled', 'true', 'boolean'),
('notifications', 'sound_enabled', 'true', 'boolean'),
('analytics', 'tracking_enabled', 'true', 'boolean'),
('reading', 'default_reading_speed_wpm', '200', 'integer'),
('notes', 'auto_save_enabled', 'true', 'boolean'),
('notes', 'default_preview_mode', 'true', 'boolean')
ON CONFLICT (setting_category, setting_key) DO NOTHING;

-- Create initial study insights triggers
CREATE OR REPLACE FUNCTION generate_study_insights()
RETURNS VOID AS $$
BEGIN
    -- This function would analyze study patterns and generate insights
    -- Implementation would depend on specific analytics requirements
    RAISE NOTICE 'Study insights generation would be implemented here';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE study_sessions IS 'Detailed study session tracking with timer and focus data';
COMMENT ON TABLE session_page_activity IS 'Page-level activity tracking within study sessions';
COMMENT ON TABLE notes IS 'Smart notes with markdown support and bidirectional linking';
COMMENT ON TABLE note_links IS 'Bidirectional links between notes for knowledge graphs';
COMMENT ON TABLE daily_study_progress IS 'Daily aggregated study metrics and progress tracking';
COMMENT ON TABLE reading_analytics IS 'Detailed reading performance analytics per page';
COMMENT ON TABLE study_goals IS 'Smart goal setting and tracking system';
COMMENT ON TABLE review_schedule IS 'Spaced repetition system for optimal review timing';
COMMENT ON TABLE bookmarks IS 'Enhanced bookmarks with positioning and categorization';
COMMENT ON TABLE highlights IS 'PDF text highlights with color coding and notes';

-- Final schema verification
DO $$
BEGIN
    RAISE NOTICE 'Enhanced SprintStudy database schema created successfully!';
    RAISE NOTICE 'Tables created: %', (
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN (
            'study_sessions', 'session_page_activity', 'session_pauses',
            'notes', 'note_links', 'note_versions', 'note_pdf_anchors',
            'bookmarks', 'highlights', 'daily_study_progress',
            'reading_analytics', 'study_insights', 'study_goals',
            'goal_progress_history', 'reading_progress', 'review_schedule',
            'user_settings'
        )
    );
END $$;