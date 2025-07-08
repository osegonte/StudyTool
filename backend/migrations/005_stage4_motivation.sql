-- Stage 4: Goal Progression, Feedback Loops & User Momentum

-- Enhanced achievements and badges system
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_key VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) DEFAULT '🏆',
    xp_reward INTEGER DEFAULT 50,
    unlock_condition JSONB DEFAULT '{}'::jsonb,
    is_secret BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements tracking
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_data JSONB DEFAULT '{}'::jsonb
);

-- Daily recommendations engine
CREATE TABLE IF NOT EXISTS daily_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    recommendation_type VARCHAR(50) NOT NULL, -- urgent, catchup, light, focus
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 3,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    estimated_minutes INTEGER,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study milestones and celebrations
CREATE TABLE IF NOT EXISTS study_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_type VARCHAR(50) NOT NULL, -- pages, hours, streak, goal
    threshold_value INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    celebration_message TEXT,
    icon VARCHAR(10) DEFAULT '🎉',
    xp_bonus INTEGER DEFAULT 100,
    last_triggered TIMESTAMP
);

-- Personalization settings
CREATE TABLE IF NOT EXISTS personalization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(setting_category, setting_key)
);

-- Study environment effects tracking
CREATE TABLE IF NOT EXISTS environment_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
    time_of_day INTEGER, -- 0-23
    day_of_week INTEGER, -- 0-6
    session_duration_minutes INTEGER,
    focus_score INTEGER CHECK (focus_score BETWEEN 1 AND 5),
    pages_read INTEGER,
    weather_condition VARCHAR(50),
    productivity_score DECIMAL(3,2),
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default achievements
INSERT INTO achievements (badge_key, title, description, icon, xp_reward, unlock_condition) VALUES
('first_steps', 'First Steps', 'Complete your first 10 pages of reading', '👶', 25, '{"pages_read": 10}'),
('steady_reader', 'Steady Reader', 'Study for 5 days in a row', '📚', 50, '{"consecutive_days": 5}'),
('marathon_mode', 'Marathon Mode', 'Complete a 2-hour study session', '🏃', 75, '{"session_minutes": 120}'),
('time_hacker', 'Time Hacker', 'Finish a document ahead of schedule', '⏰', 100, '{"ahead_of_schedule": true}'),
('consistency_king', 'Consistency King', 'Hit your daily goal for 7 days straight', '👑', 150, '{"goal_streak": 7}'),
('speed_reader', 'Speed Reader', 'Read 50 pages in one day', '⚡', 100, '{"daily_pages": 50}'),
('focus_master', 'Focus Master', 'Complete 10 pomodoro sessions', '🧘', 125, '{"pomodoros": 10}'),
('night_owl', 'Night Owl', 'Study past 10 PM for 3 sessions', '🦉', 75, '{"late_sessions": 3}'),
('early_bird', 'Early Bird', 'Study before 7 AM for 3 sessions', '🐦', 75, '{"early_sessions": 3}'),
('streak_legend', 'Streak Legend', 'Maintain a 30-day study streak', '🔥', 500, '{"streak_days": 30}')
ON CONFLICT (badge_key) DO NOTHING;

-- Insert default study milestones
INSERT INTO study_milestones (milestone_type, threshold_value, title, celebration_message, icon, xp_bonus) VALUES
('pages', 100, '100 Pages Read!', 'You''ve read your first 100 pages! Knowledge is power! 📚', '📖', 100),
('pages', 500, '500 Pages Milestone!', 'Incredible! 500 pages of learning completed! 🎓', '🏆', 250),
('pages', 1000, '1000 Pages Champion!', 'You''re a reading machine! 1000 pages conquered! 🚀', '👑', 500),
('hours', 10, '10 Hours of Study!', 'You''ve dedicated 10 hours to learning! Great commitment! ⏰', '⭐', 100),
('hours', 50, '50 Hours Invested!', 'Amazing dedication! 50 hours of focused study! 💪', '🎯', 300),
('hours', 100, '100 Hours Master!', 'Legendary! 100 hours of pure learning power! 🧠', '🏅', 600),
('streak', 7, '1 Week Streak!', 'One week of consistent study! You''re building great habits! 📅', '🔥', 150),
('streak', 30, '1 Month Streak!', 'Unstoppable! 30 days of consistent learning! 🗓️', '💎', 500),
('goal', 7, '7 Goals Achieved!', 'Goal crusher! You''ve completed 7 study goals! 🎯', '🏹', 200)
ON CONFLICT DO NOTHING;

-- Insert default personalization settings
INSERT INTO personalization (setting_category, setting_key, setting_value) VALUES
('theme', 'primary_color', '#3b82f6'),
('theme', 'accent_color', '#10b981'),
('theme', 'celebration_style', 'confetti'),
('notifications', 'achievement_sounds', 'true'),
('notifications', 'milestone_popups', 'true'),
('recommendations', 'daily_suggestions', 'true'),
('recommendations', 'adaptive_goals', 'true'),
('gamification', 'show_xp_details', 'true'),
('gamification', 'show_level_progress', 'true'),
('dashboard', 'compact_mode', 'false'),
('dashboard', 'show_motivational_quotes', 'true')
ON CONFLICT (setting_category, setting_key) DO NOTHING;

-- Functions for Stage 4

-- Check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(user_progress_data JSONB)
RETURNS TABLE(achievement_id UUID, title VARCHAR, xp_reward INTEGER) AS $$
DECLARE
    achievement_record RECORD;
    condition_met BOOLEAN;
BEGIN
    FOR achievement_record IN 
        SELECT * FROM achievements 
        WHERE badge_key NOT IN (
            SELECT a.badge_key FROM achievements a 
            JOIN user_achievements ua ON a.id = ua.achievement_id
        )
    LOOP
        condition_met := false;
        
        -- Check different achievement conditions
        CASE achievement_record.badge_key
            WHEN 'first_steps' THEN
                condition_met := (user_progress_data->>'total_pages_read')::INTEGER >= 10;
            WHEN 'steady_reader' THEN
                condition_met := (user_progress_data->>'current_streak')::INTEGER >= 5;
            WHEN 'marathon_mode' THEN
                condition_met := (user_progress_data->>'longest_session_minutes')::INTEGER >= 120;
            WHEN 'consistency_king' THEN
                condition_met := (user_progress_data->>'goal_streak')::INTEGER >= 7;
            WHEN 'speed_reader' THEN
                condition_met := (user_progress_data->>'max_daily_pages')::INTEGER >= 50;
            WHEN 'focus_master' THEN
                condition_met := (user_progress_data->>'total_pomodoros')::INTEGER >= 10;
            WHEN 'streak_legend' THEN
                condition_met := (user_progress_data->>'current_streak')::INTEGER >= 30;
            ELSE
                condition_met := false;
        END CASE;
        
        IF condition_met THEN
            -- Award achievement
            INSERT INTO user_achievements (achievement_id, progress_data)
            VALUES (achievement_record.id, user_progress_data);
            
            -- Return achievement info
            achievement_id := achievement_record.id;
            title := achievement_record.title;
            xp_reward := achievement_record.xp_reward;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate daily recommendations
CREATE OR REPLACE FUNCTION generate_daily_recommendations(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    user_stats RECORD;
    rec_record RECORD;
BEGIN
    -- Clear existing recommendations for the day
    DELETE FROM daily_recommendations WHERE date = target_date;
    
    -- Get user statistics
    SELECT 
        COALESCE(AVG(total_study_minutes), 60) as avg_daily_minutes,
        COALESCE(MAX(current_streak), 0) as current_streak,
        COUNT(*) FILTER (WHERE daily_goal_met = false AND date >= target_date - INTERVAL '7 days') as missed_goals
    INTO user_stats
    FROM user_progress 
    WHERE date >= target_date - INTERVAL '30 days';
    
    -- Generate recommendations based on patterns
    
    -- Urgent: If behind on goals
    IF user_stats.missed_goals > 2 THEN
        INSERT INTO daily_recommendations (date, recommendation_type, title, description, priority, estimated_minutes)
        VALUES (target_date, 'urgent', 'Catch-up Session Needed', 
                'You''ve missed several daily goals. Let''s get back on track with a focused session!', 
                5, 90);
    END IF;
    
    -- Focus: If streak is building
    IF user_stats.current_streak >= 3 THEN
        INSERT INTO daily_recommendations (date, recommendation_type, title, description, priority, estimated_minutes)
        VALUES (target_date, 'focus', 'Keep the Momentum Going!', 
                'Your ' || user_stats.current_streak || '-day streak is impressive! Let''s extend it further.', 
                4, user_stats.avg_daily_minutes::INTEGER);
    END IF;
    
    -- Light: If consistently meeting goals
    IF user_stats.missed_goals = 0 THEN
        INSERT INTO daily_recommendations (date, recommendation_type, title, description, priority, estimated_minutes)
        VALUES (target_date, 'light', 'Maintenance Mode', 
                'You''re doing great! A light review session will keep you sharp.', 
                2, 30);
    END IF;
    
    -- Default: Regular study session
    INSERT INTO daily_recommendations (date, recommendation_type, title, description, priority, estimated_minutes)
    VALUES (target_date, 'focus', 'Daily Study Session', 
            'Time for your regular study session. You''ve got this!', 
            3, user_stats.avg_daily_minutes::INTEGER);
            
END;
$$ LANGUAGE plpgsql;

-- Check and trigger milestones
CREATE OR REPLACE FUNCTION check_milestones(progress_data JSONB)
RETURNS TABLE(milestone_id UUID, title VARCHAR, celebration_message TEXT, xp_bonus INTEGER) AS $$
DECLARE
    milestone_record RECORD;
    trigger_milestone BOOLEAN;
    total_pages INTEGER;
    total_hours INTEGER;
    current_streak INTEGER;
    goals_completed INTEGER;
BEGIN
    -- Extract progress data
    total_pages := (progress_data->>'total_pages')::INTEGER;
    total_hours := (progress_data->>'total_hours')::INTEGER;
    current_streak := (progress_data->>'current_streak')::INTEGER;
    goals_completed := (progress_data->>'goals_completed')::INTEGER;
    
    FOR milestone_record IN 
        SELECT * FROM study_milestones 
        WHERE last_triggered IS NULL OR last_triggered < CURRENT_DATE - INTERVAL '1 day'
    LOOP
        trigger_milestone := false;
        
        CASE milestone_record.milestone_type
            WHEN 'pages' THEN
                trigger_milestone := total_pages >= milestone_record.threshold_value;
            WHEN 'hours' THEN
                trigger_milestone := total_hours >= milestone_record.threshold_value;
            WHEN 'streak' THEN
                trigger_milestone := current_streak >= milestone_record.threshold_value;
            WHEN 'goal' THEN
                trigger_milestone := goals_completed >= milestone_record.threshold_value;
        END CASE;
        
        IF trigger_milestone THEN
            -- Update milestone trigger time
            UPDATE study_milestones 
            SET last_triggered = CURRENT_TIMESTAMP 
            WHERE id = milestone_record.id;
            
            -- Return milestone info
            milestone_id := milestone_record.id;
            title := milestone_record.title;
            celebration_message := milestone_record.celebration_message;
            xp_bonus := milestone_record.xp_bonus;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE achievements IS 'Badge system for gamifying study progress';
COMMENT ON TABLE daily_recommendations IS 'AI-like daily study suggestions based on user patterns';
COMMENT ON TABLE study_milestones IS 'Milestone celebrations for major achievements';
COMMENT ON TABLE personalization IS 'User customization preferences';
COMMENT ON TABLE environment_analytics IS 'Study environment and productivity correlation data';
