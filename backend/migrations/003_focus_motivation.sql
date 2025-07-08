-- Focus & Motivation Layer for Stage 3

-- Pomodoro sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    session_type VARCHAR(20) DEFAULT 'focus', -- focus, short_break, long_break
    duration_minutes INTEGER DEFAULT 25,
    actual_duration_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    was_interrupted BOOLEAN DEFAULT false,
    interruption_reason TEXT,
    focus_rating INTEGER CHECK (focus_rating BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- XP and streaks tracking
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    total_study_minutes INTEGER DEFAULT 0,
    pages_read INTEGER DEFAULT 0,
    pomodoros_completed INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    streak_day INTEGER DEFAULT 0,
    daily_goal_met BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Focus mode sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    mode VARCHAR(20) DEFAULT 'normal', -- normal, focus, celebration, late_night
    distractions_count INTEGER DEFAULT 0,
    focus_score INTEGER CHECK (focus_score BETWEEN 1 AND 5),
    environment_notes TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_file_date ON pomodoro_sessions(file_id, started_at);
CREATE INDEX IF NOT EXISTS idx_user_progress_date ON user_progress(date);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_file ON focus_sessions(file_id);

-- Insert default user settings
INSERT INTO user_settings (setting_key, setting_value) VALUES
    ('pomodoro_focus_duration', '25'),
    ('pomodoro_short_break', '5'),
    ('pomodoro_long_break', '15'),
    ('daily_study_goal_minutes', '60'),
    ('daily_page_goal', '20'),
    ('enable_focus_mode', 'true'),
    ('enable_celebrations', 'true'),
    ('enable_reminders', 'true'),
    ('current_level', '1'),
    ('total_xp', '0'),
    ('current_streak', '0'),
    ('longest_streak', '0')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to calculate XP for different activities
CREATE OR REPLACE FUNCTION calculate_xp(
    activity_type VARCHAR,
    duration_minutes INTEGER DEFAULT 0,
    pages INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
BEGIN
    CASE activity_type
        WHEN 'pomodoro_completed' THEN RETURN 25;
        WHEN 'reading_time' THEN RETURN duration_minutes * 2;
        WHEN 'pages_read' THEN RETURN pages * 5;
        WHEN 'daily_goal_met' THEN RETURN 100;
        WHEN 'streak_bonus' THEN RETURN duration_minutes * 5; -- streak days
        ELSE RETURN 0;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily progress
CREATE OR REPLACE FUNCTION update_daily_progress(
    study_minutes INTEGER DEFAULT 0,
    pages INTEGER DEFAULT 0,
    pomodoros INTEGER DEFAULT 0
) RETURNS VOID AS $$
DECLARE
    today DATE := CURRENT_DATE;
    daily_goal INTEGER;
    xp_gained INTEGER := 0;
    current_streak INTEGER := 0;
BEGIN
    -- Get daily goal
    SELECT setting_value::INTEGER INTO daily_goal 
    FROM user_settings 
    WHERE setting_key = 'daily_study_goal_minutes';
    
    -- Calculate XP
    xp_gained := calculate_xp('reading_time', study_minutes) + 
                 calculate_xp('pages_read', pages) + 
                 calculate_xp('pomodoro_completed') * pomodoros;
    
    -- Insert or update today's progress
    INSERT INTO user_progress (date, total_study_minutes, pages_read, pomodoros_completed, xp_earned)
    VALUES (today, study_minutes, pages, pomodoros, xp_gained)
    ON CONFLICT (date) DO UPDATE SET
        total_study_minutes = user_progress.total_study_minutes + EXCLUDED.total_study_minutes,
        pages_read = user_progress.pages_read + EXCLUDED.pages_read,
        pomodoros_completed = user_progress.pomodoros_completed + EXCLUDED.pomodoros_completed,
        xp_earned = user_progress.xp_earned + EXCLUDED.xp_earned,
        daily_goal_met = (user_progress.total_study_minutes + EXCLUDED.total_study_minutes) >= daily_goal;
    
    -- Calculate streak
    SELECT COALESCE(MAX(streak_day), 0) INTO current_streak
    FROM user_progress 
    WHERE date >= CURRENT_DATE - INTERVAL '30 days' 
    AND daily_goal_met = true;
    
    -- Update settings
    UPDATE user_settings SET 
        setting_value = (
            SELECT SUM(xp_earned)::TEXT 
            FROM user_progress
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE setting_key = 'total_xp';
    
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE pomodoro_sessions IS 'Tracks Pomodoro technique sessions with focus ratings';
COMMENT ON TABLE user_progress IS 'Daily progress tracking for XP and streaks';
COMMENT ON TABLE focus_sessions IS 'Focus mode sessions with distraction tracking';
