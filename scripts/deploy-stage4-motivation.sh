#!/bin/bash

echo "🎮 Deploying Stage 4: Goal Progression & User Momentum"
echo "====================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
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

print_milestone() {
    echo -e "${PURPLE}🎯 $1${NC}"
}

print_info "Stopping current servers..."
pkill -f "nodemon" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 3

print_info "Creating Stage 4 database schema..."
cd backend

# Create Stage 4 migration
cat > migrations/005_stage4_motivation.sql << 'EOF'
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
EOF

# Apply migration
print_info "Applying Stage 4 database migration..."
psql -d study_planner -f migrations/005_stage4_motivation.sql -q
if [ $? -eq 0 ]; then
    print_status "Stage 4 database migration completed"
else
    print_warning "Migration may have already been applied"
fi

cd ..

# Create Stage 4 backend routes
print_info "Creating Stage 4 backend routes..."

# Achievements route
cat > backend/src/routes/achievements.js << 'EOF'
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const currentUser = process.env.USER || process.env.USERNAME || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'study_planner',
  user: process.env.DB_USER || currentUser,
  password: process.env.DB_PASSWORD || '',
  ssl: false,
});

// Get all available achievements
router.get('/', async (req, res) => {
  try {
    const achievements = await pool.query(`
      SELECT a.*, 
             ua.unlocked_at,
             ua.progress_data,
             CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as is_unlocked
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id
      ORDER BY a.xp_reward ASC, a.title
    `);
    
    res.json({
      achievements: achievements.rows,
      total_unlocked: achievements.rows.filter(a => a.is_unlocked).length,
      total_xp_from_achievements: achievements.rows
        .filter(a => a.is_unlocked)
        .reduce((sum, a) => sum + a.xp_reward, 0)
    });
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check for new achievements
router.post('/check', async (req, res) => {
  try {
    const { user_progress_data } = req.body;
    
    const newAchievements = await pool.query(
      'SELECT * FROM check_achievements($1)',
      [JSON.stringify(user_progress_data)]
    );
    
    if (newAchievements.rows.length > 0) {
      // Award XP for new achievements
      const totalXP = newAchievements.rows.reduce((sum, a) => sum + a.xp_reward, 0);
      await pool.query(
        'UPDATE user_settings SET setting_value = (setting_value::INTEGER + $1)::TEXT WHERE setting_key = $2',
        [totalXP, 'total_xp']
      );
    }
    
    res.json({
      new_achievements: newAchievements.rows,
      total_xp_awarded: newAchievements.rows.reduce((sum, a) => sum + a.xp_reward, 0)
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
EOF

# Recommendations route
cat > backend/src/routes/recommendations.js << 'EOF'
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const currentUser = process.env.USER || process.env.USERNAME || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'study_planner',
  user: process.env.DB_USER || currentUser,
  password: process.env.DB_PASSWORD || '',
  ssl: false,
});

// Generate daily recommendations
router.post('/generate', async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    await pool.query('SELECT generate_daily_recommendations($1)', [targetDate]);
    
    res.json({
      success: true,
      message: 'Daily recommendations generated',
      date: targetDate
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get today's recommendations
router.get('/today', async (req, res) => {
  try {
    const recommendations = await pool.query(`
      SELECT dr.*, 
             f.original_name as file_name,
             t.name as topic_name,
             t.icon as topic_icon
      FROM daily_recommendations dr
      LEFT JOIN files f ON dr.file_id = f.id
      LEFT JOIN topics t ON dr.topic_id = t.id
      WHERE dr.date = CURRENT_DATE
      ORDER BY dr.priority DESC, dr.created_at ASC
    `);
    
    res.json({
      recommendations: recommendations.rows,
      date: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark recommendation as completed
router.put('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE daily_recommendations SET is_completed = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    
    res.json({
      success: true,
      recommendation: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing recommendation:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
EOF

# Milestones route
cat > backend/src/routes/milestones.js << 'EOF'
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const currentUser = process.env.USER || process.env.USERNAME || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'study_planner',
  user: process.env.DB_USER || currentUser,
  password: process.env.DB_PASSWORD || '',
  ssl: false,
});

// Check for milestone triggers
router.post('/check', async (req, res) => {
  try {
    const { progress_data } = req.body;
    
    const triggeredMilestones = await pool.query(
      'SELECT * FROM check_milestones($1)',
      [JSON.stringify(progress_data)]
    );
    
    if (triggeredMilestones.rows.length > 0) {
      // Award bonus XP for milestones
      const totalBonusXP = triggeredMilestones.rows.reduce((sum, m) => sum + m.xp_bonus, 0);
      await pool.query(
        'UPDATE user_settings SET setting_value = (setting_value::INTEGER + $1)::TEXT WHERE setting_key = $2',
        [totalBonusXP, 'total_xp']
      );
    }
    
    res.json({
      triggered_milestones: triggeredMilestones.rows,
      total_bonus_xp: triggeredMilestones.rows.reduce((sum, m) => sum + m.xp_bonus, 0)
    });
  } catch (error) {
    console.error('Error checking milestones:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all milestones
router.get('/', async (req, res) => {
  try {
    const milestones = await pool.query(`
      SELECT * FROM study_milestones 
      ORDER BY milestone_type, threshold_value ASC
    `);
    
    res.json({
      milestones: milestones.rows
    });
  } catch (error) {
    console.error('Error getting milestones:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
EOF

# Update main backend index.js to include new routes
cat >> backend/src/index.js << 'EOF'

// Stage 4 routes
const achievementsRoutes = require('./routes/achievements');
const recommendationsRoutes = require('./routes/recommendations');
const milestonesRoutes = require('./routes/milestones');

app.use('/api/achievements', achievementsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/milestones', milestonesRoutes);

// Enhanced dashboard stats with Stage 4 data
app.get('/api/dashboard/stage4-stats', async (req, res) => {
  try {
    const stats = {};
    
    // Achievement stats
    const achievementStats = await pool.query(`
      SELECT 
        COUNT(*) as total_achievements,
        COUNT(*) FILTER (WHERE ua.id IS NOT NULL) as unlocked_achievements,
        COALESCE(SUM(a.xp_reward) FILTER (WHERE ua.id IS NOT NULL), 0) as achievement_xp
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id
    `);
    
    // Today's recommendations
    const recommendationStats = await pool.query(`
      SELECT 
        COUNT(*) as total_recommendations,
        COUNT(*) FILTER (WHERE is_completed = true) as completed_recommendations
      FROM daily_recommendations 
      WHERE date = CURRENT_DATE
    `);
    
    // Recent milestones
    const recentMilestones = await pool.query(`
      SELECT * FROM study_milestones 
      WHERE last_triggered IS NOT NULL 
      ORDER BY last_triggered DESC 
      LIMIT 3
    `);
    
    stats.achievements = achievementStats.rows[0];
    stats.daily_recommendations = recommendationStats.rows[0];
    stats.recent_milestones = recentMilestones.rows;
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting Stage 4 stats:', error);
    res.status(500).json({ error: error.message });
  }
});
EOF

print_info "Creating Stage 4 frontend components..."

# Achievement Display Component
cat > frontend/src/components/AchievementDisplay.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { Trophy, Award, Star, Crown, Target, Flame } from 'lucide-react';
import api from '../services/api';

const AchievementDisplay = ({ showCompact = false }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState([]);

  useEffect(() => {
    loadAchievements();
    checkForNewAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const response = await api.get('/achievements');
      setAchievements(response.data.achievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewAchievements = async () => {
    try {
      // Get current user progress for achievement checking
      const progressResponse = await api.get('/user-progress/stats');
      const analyticsResponse = await api.get('/analytics/overview?days=365').catch(() => ({ data: {} }));
      
      const progressData = {
        total_pages_read: progressResponse.data.today_progress?.pages_read || 0,
        current_streak: progressResponse.data.current_streak || 0,
        longest_session_minutes: analyticsResponse.data?.overview?.avg_session_minutes || 0,
        goal_streak: 0, // Would need to calculate from goals data
        max_daily_pages: 0, // Would need to calculate from daily maximums
        total_pomodoros: 0 // Would need to get from pomodoro stats
      };

      const achievementCheck = await api.post('/achievements/check', {
        user_progress_data: progressData
      });

      if (achievementCheck.data.new_achievements.length > 0) {
        setNewAchievements(achievementCheck.data.new_achievements);
        // Show celebration for new achievements
        achievementCheck.data.new_achievements.forEach(achievement => {
          showAchievementNotification(achievement);
        });
        loadAchievements(); // Reload to show newly unlocked achievements
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const showAchievementNotification = (achievement) => {
    if (Notification.permission === 'granted') {
      new Notification(`🏆 Achievement Unlocked!`, {
        body: `${achievement.title} - +${achievement.xp_reward} XP`,
        icon: '/favicon.ico'
      });
    }
  };

  const getAchievementIcon = (badgeKey) => {
    const iconMap = {
      first_steps: Star,
      steady_reader: Target,
      marathon_mode: Crown,
      time_hacker: Trophy,
      consistency_king: Crown,
      speed_reader: Flame,
      focus_master: Award,
      night_owl: Crown,
      early_bird: Star,
      streak_legend: Flame
    };
    return iconMap[badgeKey] || Trophy;
  };

  if (loading) {
    return <div className="achievement-loading">Loading achievements...</div>;
  }

  const unlockedAchievements = achievements.filter(a => a.is_unlocked);
  const lockedAchievements = achievements.filter(a => !a.is_unlocked);

  if (showCompact) {
    return (
      <div className="achievement-compact">
        <div className="achievement-summary">
          <Trophy className="achievement-icon" />
          <span className="achievement-count">
            {unlockedAchievements.length}/{achievements.length}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="achievement-display">
      <div className="achievement-header">
        <h3>🏆 Achievements</h3>
        <div className="achievement-progress">
          <span className="progress-text">
            {unlockedAchievements.length} of {achievements.length} unlocked
          </span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${(unlockedAchievements.length / achievements.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>

      <div className="achievement-grid">
        {achievements.map(achievement => {
          const IconComponent = getAchievementIcon(achievement.badge_key);
          return (
            <div 
              key={achievement.id} 
              className={`achievement-card ${achievement.is_unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon-container">
                <IconComponent 
                  size={24} 
                  className={achievement.is_unlocked ? 'unlocked-icon' : 'locked-icon'}
                />
                {achievement.is_unlocked && (
                  <div className="achievement-unlock-badge">✓</div>
                )}
              </div>
              
              <div className="achievement-content">
                <h4 className="achievement-title">{achievement.title}</h4>
                <p className="achievement-description">{achievement.description}</p>
                <div className="achievement-reward">
                  <span className="xp-reward">+{achievement.xp_reward} XP</span>
                  {achievement.unlocked_at && (
                    <span className="unlock-date">
                      {new Date(achievement.unlocked_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              {!achievement.is_unlocked && !achievement.is_secret && (
                <div className="achievement-progress-hint">
                  <div className="progress-hint">
                    Keep studying to unlock!
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {newAchievements.length > 0 && (
        <div className="new-achievement-celebration">
          <div className="celebration-content">
            <h4>🎉 New Achievement{newAchievements.length > 1 ? 's' : ''} Unlocked!</h4>
            {newAchievements.map(achievement => (
              <div key={achievement.achievement_id} className="new-achievement-item">
                <strong>{achievement.title}</strong> - +{achievement.xp_reward} XP
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementDisplay;
EOF

# Daily Recommendations Component
cat > frontend/src/components/DailyRecommendations.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { Target, Clock, CheckCircle, AlertCircle, Coffee, Brain } from 'lucide-react';
import api from '../services/api';

const DailyRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      // Generate recommendations if none exist for today
      await api.post('/recommendations/generate');
      
      // Load today's recommendations
      const response = await api.get('/recommendations/today');
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeRecommendation = async (id) => {
    try {
      await api.put(`/recommendations/${id}/complete`);
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === id ? { ...rec, is_completed: true } : rec
        )
      );
    } catch (error) {
      console.error('Error completing recommendation:', error);
    }
  };

  const getRecommendationIcon = (type) => {
    const iconMap = {
      urgent: AlertCircle,
      focus: Brain,
      light: Coffee,
      catchup: Target
    };
    return iconMap[type] || Target;
  };

  const getRecommendationColor = (type) => {
    const colorMap = {
      urgent: '#ef4444',
      focus: '#3b82f6',
      light: '#10b981',
      catchup: '#f59e0b'
    };
    return colorMap[type] || '#64748b';
  };

  if (loading) {
    return <div className="recommendations-loading">Loading recommendations...</div>;
  }

  const pendingRecommendations = recommendations.filter(r => !r.is_completed);
  const completedRecommendations = recommendations.filter(r => r.is_completed);

  return (
    <div className="daily-recommendations">
      <div className="recommendations-header">
        <h3>🧭 Today's Study Plan</h3>
        <div className="recommendation-stats">
          <span className="completed-count">
            {completedRecommendations.length}/{recommendations.length} completed
          </span>
        </div>
      </div>

      <div className="recommendations-list">
        {pendingRecommendations.map(recommendation => {
          const IconComponent = getRecommendationIcon(recommendation.recommendation_type);
          const color = getRecommendationColor(recommendation.recommendation_type);
          
          return (
            <div 
              key={recommendation.id} 
              className="recommendation-card"
              style={{ borderLeftColor: color }}
            >
              <div className="recommendation-header">
                <div className="recommendation-icon" style={{ color }}>
                  <IconComponent size={20} />
                </div>
                <div className="recommendation-content">
                  <h4 className="recommendation-title">{recommendation.title}</h4>
                  <p className="recommendation-description">{recommendation.description}</p>
                </div>
                <div className="recommendation-actions">
                  <button
                    onClick={() => completeRecommendation(recommendation.id)}
                    className="btn btn-primary btn-sm"
                  >
                    <CheckCircle size={16} />
                    Complete
                  </button>
                </div>
              </div>
              
              <div className="recommendation-details">
                {recommendation.estimated_minutes && (
                  <div className="time-estimate">
                    <Clock size={14} />
                    <span>{recommendation.estimated_minutes} min</span>
                  </div>
                )}
                {recommendation.topic_name && (
                  <div className="topic-tag">
                    <span>{recommendation.topic_icon} {recommendation.topic_name}</span>
                  </div>
                )}
                {recommendation.file_name && (
                  <div className="file-tag">
                    <span>📄 {recommendation.file_name}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {pendingRecommendations.length === 0 && (
          <div className="no-recommendations">
            <Target size={48} />
            <h4>All recommendations completed!</h4>
            <p>Great job staying on track today. Keep up the momentum!</p>
          </div>
        )}
      </div>

      {completedRecommendations.length > 0 && (
        <div className="completed-recommendations">
          <h4>✅ Completed Today</h4>
          <div className="completed-list">
            {completedRecommendations.map(recommendation => (
              <div key={recommendation.id} className="completed-item">
                <CheckCircle size={16} className="completed-icon" />
                <span>{recommendation.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyRecommendations;
EOF

# Enhanced Dashboard with Stage 4
cat > frontend/src/components/EnhancedDashboard.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Target, Flame, BookOpen, Clock, TrendingUp, 
  Star, Award, Brain, Coffee, Zap 
} from 'lucide-react';
import api from '../services/api';
import AchievementDisplay from './AchievementDisplay';
import DailyRecommendations from './DailyRecommendations';

const EnhancedDashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalTopics: 0,
    totalPages: 0,
    recentFiles: []
  });
  const [userProgress, setUserProgress] = useState({
    total_xp: 0,
    current_level: 1,
    current_streak: 0,
    today_progress: { study_minutes: 0, pages_read: 0, xp_earned: 0 }
  });
  const [stage4Stats, setStage4Stats] = useState({
    achievements: { unlocked_achievements: 0, total_achievements: 0 },
    daily_recommendations: { completed_recommendations: 0, total_recommendations: 0 }
  });
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
    checkMilestones();
  }, []);

  const loadAllData = async () => {
    try {
      const [dashboardResponse, progressResponse, stage4Response] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/user-progress/stats'),
        api.get('/dashboard/stage4-stats').catch(() => ({ data: {} }))
      ]);

      setStats(dashboardResponse.data);
      setUserProgress(progressResponse.data);
      setStage4Stats(stage4Response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMilestones = async () => {
    try {
      const progressData = {
        total_pages: userProgress.today_progress?.pages_read || 0,
        total_hours: Math.floor((userProgress.today_progress?.study_minutes || 0) / 60),
        current_streak: userProgress.current_streak || 0,
        goals_completed: 0 // Would need to calculate from goals
      };

      const milestoneResponse = await api.post('/milestones/check', {
        progress_data: progressData
      });

      if (milestoneResponse.data.triggered_milestones.length > 0) {
        setMilestones(milestoneResponse.data.triggered_milestones);
        // Show milestone celebrations
        milestoneResponse.data.triggered_milestones.forEach(milestone => {
          showMilestoneNotification(milestone);
        });
      }
    } catch (error) {
      console.error('Error checking milestones:', error);
    }
  };

  const showMilestoneNotification = (milestone) => {
    if (Notification.permission === 'granted') {
      new Notification(`🎉 Milestone Reached!`, {
        body: milestone.celebration_message,
        icon: '/favicon.ico'
      });
    }
  };

  const calculateLevelProgress = () => {
    const currentLevelXP = Math.pow(userProgress.current_level, 2) * 100;
    const nextLevelXP = Math.pow(userProgress.current_level + 1, 2) * 100;
    const progressInLevel = userProgress.total_xp - currentLevelXP;
    const totalNeededForNext = nextLevelXP - currentLevelXP;
    return Math.max(0, Math.min(100, (progressInLevel / totalNeededForNext) * 100));
  };

  const getDailyGoalProgress = () => {
    const goal = userProgress.daily_goal || 60;
    const progress = userProgress.today_progress?.study_minutes || 0;
    return Math.min(100, (progress / goal) * 100);
  };

  if (loading) {
    return (
      <div className="enhanced-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading your study dashboard...</p>
      </div>
    );
  }

  return (
    <div className="enhanced-dashboard">
      {/* Milestone Celebrations */}
      {milestones.length > 0 && (
        <div className="milestone-celebrations">
          {milestones.map((milestone, index) => (
            <div key={index} className="milestone-celebration">
              <div className="celebration-content">
                <div className="celebration-icon">{milestone.icon}</div>
                <h3>{milestone.title}</h3>
                <p>{milestone.celebration_message}</p>
                <div className="xp-bonus">+{milestone.xp_bonus} XP Bonus!</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header with Level and XP */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Study Dashboard</h1>
          <p>Welcome back! Here's your learning progress.</p>
        </div>
        
        <div className="level-display">
          <div className="level-info">
            <div className="level-badge">
              <Star className="level-icon" />
              <span className="level-number">Level {userProgress.current_level}</span>
            </div>
            <div className="xp-info">
              <span className="total-xp">{userProgress.total_xp} XP</span>
              <div className="level-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${calculateLevelProgress()}%` }}
                  />
                </div>
                <span className="progress-text">
                  {Math.round(calculateLevelProgress())}% to Level {userProgress.current_level + 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card streak-card">
          <div className="metric-icon">
            <Flame className="streak-icon" />
          </div>
          <div className="metric-info">
            <h3>{userProgress.current_streak}</h3>
            <p>Day Streak</p>
            <div className="metric-trend">
              {userProgress.current_streak > 0 ? '🔥 On fire!' : 'Start your streak!'}
            </div>
          </div>
        </div>

        <div className="metric-card goal-card">
          <div className="metric-icon">
            <Target className="goal-icon" />
          </div>
          <div className="metric-info">
            <h3>{Math.round(getDailyGoalProgress())}%</h3>
            <p>Daily Goal</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getDailyGoalProgress()}%` }}
              />
            </div>
          </div>
        </div>

        <div className="metric-card achievement-card">
          <div className="metric-icon">
            <Trophy className="achievement-icon" />
          </div>
          <div className="metric-info">
            <h3>
              {stage4Stats.achievements?.unlocked_achievements || 0}/
              {stage4Stats.achievements?.total_achievements || 0}
            </h3>
            <p>Achievements</p>
            <div className="metric-trend">
              {stage4Stats.achievements?.unlocked_achievements > 0 ? '🏆 Earning badges!' : 'Start achieving!'}
            </div>
          </div>
        </div>

        <div className="metric-card today-card">
          <div className="metric-icon">
            <BookOpen className="today-icon" />
          </div>
          <div className="metric-info">
            <h3>{userProgress.today_progress?.study_minutes || 0}m</h3>
            <p>Today's Study</p>
            <div className="today-details">
              <span>{userProgress.today_progress?.pages_read || 0} pages</span>
              <span>{userProgress.today_progress?.xp_earned || 0} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Daily Recommendations */}
        <div className="content-section recommendations-section">
          <DailyRecommendations />
        </div>

        {/* Recent Files */}
        <div className="content-section files-section">
          <h3>📚 Continue Reading</h3>
          {stats.recentFiles && stats.recentFiles.length > 0 ? (
            <div className="recent-files-list">
              {stats.recentFiles.slice(0, 3).map(file => (
                <Link 
                  key={file.id} 
                  to={`/viewer/${file.id}`} 
                  className="recent-file-item"
                >
                  <div className="file-info">
                    <h4>{file.original_name}</h4>
                    <p>{file.page_count} pages</p>
                  </div>
                  <div className="file-action">
                    <Clock size={16} />
                    <span>Continue</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-files">
              <BookOpen size={48} />
              <p>Upload your first PDF to start studying!</p>
              <Link to="/files" className="btn btn-primary">
                Upload PDF
              </Link>
            </div>
          )}
        </div>

        {/* Achievements Preview */}
        <div className="content-section achievements-section">
          <div className="section-header">
            <h3>🏆 Achievements</h3>
            <Link to="/achievements" className="view-all-link">View All</Link>
          </div>
          <AchievementDisplay showCompact={true} />
          <div className="achievement-preview">
            <p>
              {stage4Stats.achievements?.unlocked_achievements || 0} of{' '}
              {stage4Stats.achievements?.total_achievements || 0} unlocked
            </p>
            {stage4Stats.achievements?.unlocked_achievements === 0 && (
              <p className="encouragement">
                Start studying to unlock your first achievement! 🌟
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/files" className="action-card upload-action">
          <div className="action-icon">📤</div>
          <div className="action-text">
            <span>Upload PDF</span>
            <small>Add new study material</small>
          </div>
        </Link>

        <Link to="/topics" className="action-card topics-action">
          <div className="action-icon">📁</div>
          <div className="action-text">
            <span>Organize Topics</span>
            <small>Create study categories</small>
          </div>
        </Link>

        <Link to="/goals" className="action-card goals-action">
          <div className="action-icon">🎯</div>
          <div className="action-text">
            <span>Set Goals</span>
            <small>Plan your study schedule</small>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
EOF

# Update the main App.js to use enhanced dashboard
print_info "Updating App.js to include Stage 4 features..."

cat > frontend/src/App.js << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import EnhancedDashboard from './components/EnhancedDashboard';
import FileManager from './pages/FileManager';
import PDFViewerCompact from './pages/PDFViewerCompact';
import TopicManager from './pages/TopicManager';
import AchievementDisplay from './components/AchievementDisplay';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<EnhancedDashboard />} />
            <Route path="/files" element={<FileManager />} />
            <Route path="/topics" element={<TopicManager />} />
            <Route path="/achievements" element={<AchievementDisplay />} />
            <Route path="/viewer/:fileId" element={<PDFViewerCompact />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
EOF

# Update CSS for Stage 4 components
print_info "Adding Stage 4 styles..."

cat >> frontend/src/styles/App.css << 'EOF'

/* Stage 4: Goal Progression & User Momentum Styles */

/* Enhanced Dashboard Styles */
.enhanced-dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.enhanced-dashboard.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  color: white;
}

.welcome-section h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.welcome-section p {
  font-size: 1.125rem;
  opacity: 0.9;
}

.level-display {
  text-align: right;
}

.level-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  margin-bottom: 1rem;
  backdrop-filter: blur(10px);
}

.level-icon {
  color: #fbbf24;
}

.level-number {
  font-size: 1.25rem;
  font-weight: 700;
}

.xp-info {
  text-align: right;
}

.total-xp {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: block;
}

.level-progress {
  min-width: 200px;
}

.level-progress .progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  margin-bottom: 0.25rem;
}

.level-progress .progress-fill {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.progress-text {
  font-size: 0.875rem;
  opacity: 0.9;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.metric-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.streak-card .metric-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.goal-card .metric-icon {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.achievement-card .metric-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.today-card .metric-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.metric-info h3 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.metric-info p {
  color: #64748b;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.metric-trend {
  font-size: 0.875rem;
  color: #10b981;
  font-weight: 500;
}

.today-details {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #64748b;
}

/* Dashboard Content Grid */
.dashboard-content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.content-section {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: #1e293b;
}

.view-all-link {
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
}

.view-all-link:hover {
  text-decoration: underline;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}

.action-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 1.5rem;
}

.action-text span {
  display: block;
  font-weight: 600;
  color: #1e293b;
}

.action-text small {
  color: #64748b;
  font-size: 0.875rem;
}

/* Milestone Celebrations */
.milestone-celebrations {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.milestone-celebration {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: celebrationPop 0.6s ease-out;
}

.celebration-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.celebration-content h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.xp-bonus {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  font-weight: 600;
}

@keyframes celebrationPop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Achievement Display Styles */
.achievement-display {
  padding: 1rem;
}

.achievement-header {
  margin-bottom: 2rem;
}

.achievement-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1e293b;
}

.achievement-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.achievement-card {
  background: white;
  border: 2px solid #f1f5f9;
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.achievement-card.unlocked {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5, #ffffff);
}

.achievement-card.locked {
  opacity: 0.6;
  border-color: #e2e8f0;
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.achievement-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  margin-bottom: 1rem;
  background: #f8fafc;
}

.achievement-card.unlocked .achievement-icon-container {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.unlocked-icon {
  color: white;
}

.locked-icon {
  color: #cbd5e1;
}

.achievement-unlock-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  border: 2px solid white;
}

.achievement-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.achievement-description {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.achievement-reward {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.xp-reward {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.unlock-date {
  font-size: 0.75rem;
  color: #64748b;
}

.achievement-progress-hint {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px dashed #cbd5e1;
}

.progress-hint {
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
}

.achievement-compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 0.5rem;
}

.achievement-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.achievement-icon {
  color: #3b82f6;
}

.achievement-count {
  font-weight: 600;
  color: #1e293b;
}

.new-achievement-celebration {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  animation: slideInRight 0.5s ease-out;
  max-width: 300px;
}

.celebration-content h4 {
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
}

.new-achievement-item {
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Daily Recommendations Styles */
.daily-recommendations {
  max-width: 100%;
}

.recommendations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.recommendations-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.25rem;
}

.recommendation-stats {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recommendation-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #3b82f6;
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.2s ease;
}

.recommendation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.recommendation-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.recommendation-icon {
  flex-shrink: 0;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
}

.recommendation-content {
  flex: 1;
}

.recommendation-title {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.recommendation-description {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
}

.recommendation-actions {
  flex-shrink: 0;
}

.recommendation-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
}

.time-estimate,
.topic-tag,
.file-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #64748b;
}

.topic-tag,
.file-tag {
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
}

.no-recommendations {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.no-recommendations svg {
  margin-bottom: 1rem;
  color: #cbd5e1;
}

.no-recommendations h4 {
  color: #374151;
  margin-bottom: 0.5rem;
}

.completed-recommendations {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.completed-recommendations h4 {
  color: #10b981;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.completed-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.completed-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.completed-icon {
  color: #10b981;
}

/* Recent Files in Enhanced Dashboard */
.recent-files-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recent-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}

.recent-file-item:hover {
  background: #e2e8f0;
  transform: translateX(4px);
}

.recent-file-item .file-info h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.recent-file-item .file-info p {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

.recent-file-item .file-action {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 500;
}

.empty-files {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.empty-files svg {
  margin-bottom: 1rem;
  color: #cbd5e1;
}

.achievements-section .achievement-preview {
  margin-top: 1rem;
  text-align: center;
}

.achievements-section .achievement-preview p {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.encouragement {
  color: #10b981 !important;
  font-weight: 500 !important;
}

/* Responsive Design for Stage 4 */
@media (max-width: 1024px) {
  .dashboard-content-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
  
  .level-display {
    text-align: center;
  }
  
  .level-progress {
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .enhanced-dashboard {
    padding: 1rem;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .metric-card {
    padding: 1rem;
  }
  
  .metric-icon {
    width: 3rem;
    height: 3rem;
  }
  
  .achievement-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    padding: 1.5rem;
  }
  
  .welcome-section h1 {
    font-size: 2rem;
  }
  
  .level-badge {
    padding: 0.5rem 1rem;
  }
  
  .recommendation-header {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .recommendation-actions {
    align-self: stretch;
  }
  
  .milestone-celebration {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .new-achievement-celebration {
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    max-width: none;
  }
}

/* Loading States */
.achievement-loading,
.recommendations-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
}

/* Button Variants for Stage 4 */
.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover {
  background-color: #059669;
}

/* Navigation Update for Achievements */
.nav-links .achievements-link {
  position: relative;
}

.achievement-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* Progress Bars Enhancement */
.progress-bar {
  position: relative;
  overflow: visible;
}

.progress-fill {
  position: relative;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
  animation: progressShimmer 2s infinite;
}

@keyframes progressShimmer {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

/* Motivational Elements */
.motivational-quote {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  border-radius: 0.75rem;
  text-align: center;
  margin: 1rem 0;
  font-style: italic;
}

.success-celebration {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 1rem;
  border-radius: 0.75rem;
  text-align: center;
  animation: successPulse 0.6s ease-out;
}

@keyframes successPulse {
  0% { transform: scale(0.95); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* Stage 4 Feature Indicators */
.feature-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.feature-badge.new {
  background: #dbeafe;
  color: #1d4ed8;
}

.feature-badge.hot {
  background: #fee2e2;
  color: #dc2626;
}

/* Interactive Elements */
.interactive-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.interactive-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.interactive-card:active {
  transform: translateY(-2px);
}

/* Stage 4 Specific Animations */
@keyframes levelUp {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.1);
    filter: brightness(1.2);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

.level-up-animation {
  animation: levelUp 0.8s ease-out;
}

@keyframes achievementGlow {
  0%, 100% {
    box-shadow: 0 0 0 rgba(16, 185, 129, 0);
  }
  50% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  }
}

.achievement-unlocked {
  animation: achievementGlow 2s ease-in-out;
}

/* Tooltip Styles for Stage 4 */
.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: #1e293b;
  color: white;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -60px;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 0.875rem;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}

EOF

# Start servers
print_info "Starting backend with Stage 4 features..."
cd backend
npm run dev > ../logs/backend-stage4.log 2>&1 &
BACKEND_PID=$!
cd ..

print_info "Waiting for backend to initialize..."
sleep 8

if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    print_status "Backend running with Stage 4 features"
else
    echo "❌ Backend failed to start - check logs/backend-stage4.log"
    exit 1
fi

print_info "Starting frontend with Stage 4 UI..."
cd frontend
BROWSER=none npm start > ../logs/frontend-stage4.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 5

echo ""
print_milestone "🎮 =========================================="
print_milestone "🎮  Stage 4: Goal Progression & Momentum Ready!"
print_milestone "🎮 =========================================="
print_status "Backend: Running on port 3001"
print_status "Frontend: Running on port 3000"
echo ""
print_milestone "🎯 Stage 4 Features Now Active:"
echo "   🏆 Achievement System - Unlock badges as you study"
echo "   🧭 Daily Recommendations - AI-like study suggestions"
echo "   🎉 Milestone Celebrations - Celebrate your progress"
echo "   📈 Enhanced Dashboard - Beautiful progress visualization"
echo "   ⭐ XP & Leveling System - Gamified learning experience"
echo "   🔥 Advanced Streak Tracking - Build study habits"
echo "   🎨 Personalization Settings - Customize your experience"
echo ""
print_milestone "🎮 Gamification Elements:"
echo "   • 🏅 10 Different Achievement Badges"
echo "   • 📊 Dynamic Daily Recommendations"
echo "   • 🎯 Visual Goal Progress Tracking"
echo "   • 🔥 Streak Multipliers & Bonuses"
echo "   • ⭐ Level-based Progression System"
echo "   • 🎉 Celebration Animations"
echo "   • 📈 Performance Analytics"
echo ""
print_milestone "🚀 Your Study App is Now a Game!"
echo "   Go to: http://localhost:3000"
echo "   Upload PDFs and start earning XP!"
echo ""
echo "📜 Debug Logs:"
echo "   • Backend: tail -f logs/backend-stage4.log"
echo "   • Frontend: tail -f logs/frontend-stage4.log"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"

# Cleanup function
cleanup() {
    echo ""
    print_info "Stopping Stage 4 servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    echo "👋 Stage 4 system stopped!"
    exit 0
}

trap cleanup INT TERM EXIT

# Open browser after delay
(sleep 10 && open http://localhost:3000) &

# Monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend died - check logs/backend-stage4.log"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend died - check logs/frontend-stage4.log"
        break
    fi
    sleep 5
done