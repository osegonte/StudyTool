-- Comprehensive Study Data Persistence System
-- Ensures all study data is properly saved and never lost

-- Enhanced study sessions with detailed tracking
ALTER TABLE study_sessions 
ADD COLUMN IF NOT EXISTS focus_rating INTEGER CHECK (focus_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS distractions_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS environment_notes TEXT,
ADD COLUMN IF NOT EXISTS mood_before VARCHAR(50),
ADD COLUMN IF NOT EXISTS mood_after VARCHAR(50),
ADD COLUMN IF NOT EXISTS energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS comprehension_rating INTEGER CHECK (comprehension_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5);

-- Detailed page interaction tracking
CREATE TABLE IF NOT EXISTS page_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- view, bookmark, note, highlight, revisit
    interaction_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    interaction_end TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0,
    content_excerpt TEXT, -- What was being read
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exercise and practice tracking
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    exercise_type VARCHAR(50) DEFAULT 'practice', -- practice, quiz, review, homework
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 3,
    estimated_duration_minutes INTEGER,
    source_page_numbers TEXT, -- Which pages this exercise covers
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exercise attempts and results
CREATE TABLE IF NOT EXISTS exercise_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    score_percentage DECIMAL(5,2),
    confidence_rating INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),
    difficulty_felt INTEGER CHECK (difficulty_felt BETWEEN 1 AND 5),
    notes TEXT,
    mistakes_made TEXT, -- What went wrong
    concepts_unclear TEXT, -- What needs more study
    next_review_date DATE -- Spaced repetition
);

-- Study goals and milestones
CREATE TABLE IF NOT EXISTS study_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) NOT NULL, -- daily, weekly, exam, completion
    target_value INTEGER, -- minutes, pages, exercises
    target_unit VARCHAR(20), -- minutes, pages, exercises
    deadline DATE,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    current_progress INTEGER DEFAULT 0,
    is_achieved BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    achieved_at TIMESTAMP
);

-- Study environment and context tracking
CREATE TABLE IF NOT EXISTS study_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    location VARCHAR(100), -- home, library, cafe, etc.
    device_used VARCHAR(50), -- laptop, tablet, phone
    lighting_condition VARCHAR(50), -- bright, dim, natural
    noise_level VARCHAR(50), -- quiet, moderate, noisy
    temperature_comfort INTEGER CHECK (temperature_comfort BETWEEN 1 AND 5),
    posture VARCHAR(50), -- sitting, standing, lying
    break_frequency_minutes INTEGER,
    hydration_level INTEGER CHECK (hydration_level BETWEEN 1 AND 5),
    notes TEXT
);

-- Spaced repetition and review scheduling
CREATE TABLE IF NOT EXISTS review_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    page_range VARCHAR(50), -- "1-5", "10", "15-20"
    topic_covered TEXT,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    last_reviewed TIMESTAMP,
    next_review_date DATE NOT NULL,
    review_interval_days INTEGER DEFAULT 1,
    mastery_level INTEGER CHECK (mastery_level BETWEEN 1 AND 5) DEFAULT 1,
    times_reviewed INTEGER DEFAULT 0,
    notes TEXT
);

-- Study insights and reflections
CREATE TABLE IF NOT EXISTS study_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
    reflection_date DATE DEFAULT CURRENT_DATE,
    what_went_well TEXT,
    what_was_challenging TEXT,
    key_insights TEXT,
    concepts_mastered TEXT,
    concepts_need_work TEXT,
    study_strategy_effectiveness INTEGER CHECK (study_strategy_effectiveness BETWEEN 1 AND 5),
    motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 5),
    action_items TEXT,
    next_session_plan TEXT
);

-- Performance analytics and trends
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- reading_speed, focus_score, comprehension, efficiency
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20), -- pages_per_minute, percentage, score
    context JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_interactions_session ON page_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_page_interactions_page ON page_interactions(page_number);
CREATE INDEX IF NOT EXISTS idx_exercises_topic ON exercises(topic_id);
CREATE INDEX IF NOT EXISTS idx_exercises_file ON exercises(file_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise ON exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_study_goals_deadline ON study_goals(deadline);
CREATE INDEX IF NOT EXISTS idx_study_goals_topic ON study_goals(topic_id);
CREATE INDEX IF NOT EXISTS idx_review_schedule_date ON review_schedule(next_review_date);
CREATE INDEX IF NOT EXISTS idx_review_schedule_file ON review_schedule(file_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);

-- Enhanced user preferences for personalization
INSERT INTO user_settings (setting_key, setting_value) VALUES
    ('default_study_location', 'home'),
    ('preferred_session_length', '45'),
    ('break_reminder_interval', '25'),
    ('daily_study_target_hours', '2'),
    ('weekly_study_target_hours', '14'),
    ('spaced_repetition_enabled', 'true'),
    ('difficulty_auto_adjust', 'true'),
    ('performance_tracking', 'true'),
    ('goal_reminders', 'true'),
    ('study_streak_notifications', 'true')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to automatically create review schedules based on performance
CREATE OR REPLACE FUNCTION schedule_spaced_review(
    p_file_id UUID,
    p_page_range VARCHAR(50),
    p_performance_score INTEGER DEFAULT 3
) RETURNS VOID AS $$
DECLARE
    review_interval INTEGER;
    next_date DATE;
BEGIN
    -- Calculate interval based on performance (spaced repetition algorithm)
    CASE p_performance_score
        WHEN 1 THEN review_interval := 1;  -- Review tomorrow
        WHEN 2 THEN review_interval := 2;  -- Review in 2 days
        WHEN 3 THEN review_interval := 4;  -- Review in 4 days
        WHEN 4 THEN review_interval := 7;  -- Review in 1 week
        WHEN 5 THEN review_interval := 14; -- Review in 2 weeks
        ELSE review_interval := 3;
    END CASE;
    
    next_date := CURRENT_DATE + review_interval;
    
    INSERT INTO review_schedule (file_id, page_range, next_review_date, review_interval_days)
    VALUES (p_file_id, p_page_range, next_date, review_interval)
    ON CONFLICT (file_id, page_range) 
    DO UPDATE SET 
        next_review_date = next_date,
        review_interval_days = review_interval,
        times_reviewed = review_schedule.times_reviewed + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to track reading performance metrics
CREATE OR REPLACE FUNCTION track_reading_performance(
    p_session_id UUID
) RETURNS VOID AS $$
DECLARE
    session_record RECORD;
    reading_speed DECIMAL(10,2);
    focus_efficiency DECIMAL(10,2);
BEGIN
    -- Get session data
    SELECT * INTO session_record 
    FROM study_sessions 
    WHERE id = p_session_id;
    
    IF session_record.id IS NOT NULL THEN
        -- Calculate reading speed (pages per minute)
        IF session_record.total_duration_seconds > 0 AND session_record.pages_covered > 0 THEN
            reading_speed := (session_record.pages_covered::DECIMAL / (session_record.total_duration_seconds / 60.0));
            
            INSERT INTO performance_metrics (date, metric_type, file_id, value, unit)
            VALUES (CURRENT_DATE, 'reading_speed', session_record.file_id, reading_speed, 'pages_per_minute');
        END IF;
        
        -- Calculate focus efficiency (focus_rating * time_on_task)
        IF session_record.focus_rating IS NOT NULL THEN
            focus_efficiency := session_record.focus_rating * (session_record.total_duration_seconds / 60.0);
            
            INSERT INTO performance_metrics (date, metric_type, file_id, value, unit)
            VALUES (CURRENT_DATE, 'focus_efficiency', session_record.file_id, focus_efficiency, 'focus_minutes');
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically track performance when sessions end
CREATE OR REPLACE FUNCTION auto_track_performance() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
        PERFORM track_reading_performance(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_track_performance ON study_sessions;
CREATE TRIGGER trigger_auto_track_performance
    AFTER UPDATE ON study_sessions
    FOR EACH ROW EXECUTE FUNCTION auto_track_performance();

-- Enhanced function to update daily progress with comprehensive tracking
CREATE OR REPLACE FUNCTION comprehensive_daily_update(
    study_minutes INTEGER DEFAULT 0,
    pages INTEGER DEFAULT 0,
    pomodoros INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    focus_score INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    today DATE := CURRENT_DATE;
    daily_goal INTEGER;
    xp_gained INTEGER := 0;
    current_streak INTEGER := 0;
    goal_met BOOLEAN := false;
BEGIN
    -- Get daily goal
    SELECT setting_value::INTEGER INTO daily_goal 
    FROM user_settings 
    WHERE setting_key = 'daily_study_goal_minutes';
    
    -- Calculate comprehensive XP
    xp_gained := calculate_xp('reading_time', study_minutes) + 
                 calculate_xp('pages_read', pages) + 
                 calculate_xp('pomodoro_completed') * pomodoros +
                 (exercises_completed * 15); -- 15 XP per exercise
    
    -- Add focus bonus XP
    IF focus_score IS NOT NULL THEN
        xp_gained := xp_gained + (focus_score * 5); -- 5 XP per focus point
    END IF;
    
    -- Insert or update today's comprehensive progress
    INSERT INTO user_progress (
        date, total_study_minutes, pages_read, pomodoros_completed, 
        xp_earned, daily_goal_met
    )
    VALUES (today, study_minutes, pages, pomodoros, xp_gained, false)
    ON CONFLICT (date) DO UPDATE SET
        total_study_minutes = user_progress.total_study_minutes + EXCLUDED.total_study_minutes,
        pages_read = user_progress.pages_read + EXCLUDED.pages_read,
        pomodoros_completed = user_progress.pomodoros_completed + EXCLUDED.pomodoros_completed,
        xp_earned = user_progress.xp_earned + EXCLUDED.xp_earned;
    
    -- Check if daily goal is met
    SELECT (total_study_minutes >= daily_goal) INTO goal_met
    FROM user_progress 
    WHERE date = today;
    
    -- Update goal status
    UPDATE user_progress 
    SET daily_goal_met = goal_met
    WHERE date = today;
    
    -- Add goal achievement bonus XP
    IF goal_met AND NOT EXISTS (
        SELECT 1 FROM user_progress 
        WHERE date = today AND daily_goal_met = true
    ) THEN
        UPDATE user_progress 
        SET xp_earned = xp_earned + 100
        WHERE date = today;
    END IF;
    
    -- Update total XP in settings
    UPDATE user_settings SET 
        setting_value = (
            SELECT SUM(xp_earned)::TEXT 
            FROM user_progress
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE setting_key = 'total_xp';
    
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE page_interactions IS 'Detailed tracking of every page interaction for study analytics';
COMMENT ON TABLE exercises IS 'Practice exercises and their metadata linked to study materials';
COMMENT ON TABLE exercise_attempts IS 'Individual attempts at exercises with performance data';
COMMENT ON TABLE study_goals IS 'Personal study goals with deadlines and progress tracking';
COMMENT ON TABLE study_contexts IS 'Environmental factors that affect study performance';
COMMENT ON TABLE review_schedule IS 'Spaced repetition scheduling for optimal retention';
COMMENT ON TABLE study_reflections IS 'Personal insights and reflections on study sessions';
COMMENT ON TABLE performance_metrics IS 'Quantitative performance data over time';
