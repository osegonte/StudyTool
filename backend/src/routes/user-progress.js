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

// Get user progress stats
router.get('/stats', async (req, res) => {
  try {
    // Get user settings
    const settingsResult = await pool.query(`
      SELECT setting_key, setting_value 
      FROM user_settings 
      WHERE setting_key IN ('total_xp', 'current_streak', 'longest_streak', 'daily_study_goal_minutes')
    `);
    
    const settings = {};
    settingsResult.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    // Get today's progress
    const todayResult = await pool.query(`
      SELECT * FROM user_progress 
      WHERE date = CURRENT_DATE
    `);
    
    const todayProgress = todayResult.rows[0] || {
      total_study_minutes: 0,
      pages_read: 0,
      pomodoros_completed: 0,
      daily_goal_met: false
    };
    
    // Calculate current level
    const totalXP = parseInt(settings.total_xp || '0');
    const currentLevel = Math.floor(Math.sqrt(totalXP / 100)) + 1;
    
    // Calculate streak
    const streakResult = await pool.query(`
      WITH consecutive_days AS (
        SELECT date,
               date - (ROW_NUMBER() OVER (ORDER BY date))::integer * INTERVAL '1 day' as group_date
        FROM user_progress 
        WHERE daily_goal_met = true 
        AND date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY date DESC
      ),
      streak_groups AS (
        SELECT group_date, COUNT(*) as streak_length
        FROM consecutive_days
        GROUP BY group_date
        ORDER BY group_date DESC
      )
      SELECT COALESCE(MAX(streak_length), 0) as current_streak
      FROM streak_groups
      WHERE group_date = (SELECT MAX(group_date) FROM streak_groups)
    `);
    
    const currentStreak = streakResult.rows[0]?.current_streak || 0;
    
    res.json({
      total_xp: totalXP,
      current_level: currentLevel,
      current_streak: currentStreak,
      longest_streak: parseInt(settings.longest_streak || '0'),
      daily_goal: parseInt(settings.daily_study_goal_minutes || '60'),
      today_progress: todayProgress
    });
    
  } catch (error) {
    console.error('Error getting user progress stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update daily progress
router.post('/update', async (req, res) => {
  try {
    const { study_minutes = 0, pages_read = 0, pomodoros_completed = 0 } = req.body;
    
    await pool.query('SELECT update_daily_progress($1, $2, $3)', 
      [study_minutes, pages_read, pomodoros_completed]);
    
    res.json({ 
      success: true, 
      message: 'Daily progress updated' 
    });
    
  } catch (error) {
    console.error('Error updating daily progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get weekly progress
router.get('/weekly', async (req, res) => {
  try {
    const weeklyResult = await pool.query(`
      SELECT 
        date,
        total_study_minutes,
        pages_read,
        pomodoros_completed,
        xp_earned,
        daily_goal_met
      FROM user_progress 
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY date DESC
    `);
    
    res.json({
      weekly_progress: weeklyResult.rows
    });
    
  } catch (error) {
    console.error('Error getting weekly progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user settings
router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const result = await pool.query(
      `INSERT INTO user_settings (setting_key, setting_value) 
       VALUES ($1, $2) 
       ON CONFLICT (setting_key) 
       DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, value]
    );
    
    res.json({ 
      success: true, 
      setting: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
