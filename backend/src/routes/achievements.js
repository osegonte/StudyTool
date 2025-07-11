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

// Initialize achievements
router.post('/init', async (req, res) => {
  try {
    const achievements = [
      {
        badge_key: 'first_steps',
        title: 'First Steps',
        description: 'Complete your first study session',
        xp_reward: 50,
        unlock_condition: JSON.stringify({ sessions_completed: 1 })
      },
      {
        badge_key: 'steady_reader',
        title: 'Steady Reader',
        description: 'Read 100 pages total',
        xp_reward: 100,
        unlock_condition: JSON.stringify({ total_pages: 100 })
      },
      {
        badge_key: 'marathon_mode',
        title: 'Marathon Mode',
        description: 'Study for 2 hours in a single day',
        xp_reward: 200,
        unlock_condition: JSON.stringify({ daily_hours: 2 })
      },
      {
        badge_key: 'consistency_king',
        title: 'Consistency King',
        description: 'Maintain a 7-day study streak',
        xp_reward: 300,
        unlock_condition: JSON.stringify({ streak_days: 7 })
      }
    ];

    for (const achievement of achievements) {
      await pool.query(
        `INSERT INTO achievements (badge_key, title, description, xp_reward, unlock_condition) 
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (badge_key) DO NOTHING`,
        [achievement.badge_key, achievement.title, achievement.description, 
         achievement.xp_reward, achievement.unlock_condition]
      );
    }

    res.json({ success: true, message: 'Achievements initialized' });
  } catch (error) {
    console.error('Error initializing achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all achievements
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
             ua.unlocked_at,
             CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as is_unlocked
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id
      ORDER BY a.created_at
    `);

    res.json({ achievements: result.rows });
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check for new achievements
router.post('/check', async (req, res) => {
  try {
    const { user_progress_data } = req.body;
    
    // Simple achievement checking logic
    const newAchievements = [];
    
    // Check each achievement condition
    const achievements = await pool.query('SELECT * FROM achievements');
    
    for (const achievement of achievements.rows) {
      const condition = JSON.parse(achievement.unlock_condition);
      let shouldUnlock = false;
      
      // Check if already unlocked
      const existing = await pool.query(
        'SELECT id FROM user_achievements WHERE achievement_id = $1',
        [achievement.id]
      );
      
      if (existing.rows.length > 0) continue;
      
      // Check conditions
      if (condition.total_pages && user_progress_data.total_pages_read >= condition.total_pages) {
        shouldUnlock = true;
      }
      if (condition.streak_days && user_progress_data.current_streak >= condition.streak_days) {
        shouldUnlock = true;
      }
      if (condition.daily_hours && user_progress_data.longest_session_minutes >= (condition.daily_hours * 60)) {
        shouldUnlock = true;
      }
      
      if (shouldUnlock) {
        await pool.query(
          'INSERT INTO user_achievements (achievement_id) VALUES ($1)',
          [achievement.id]
        );
        newAchievements.push(achievement);
      }
    }
    
    res.json({ new_achievements: newAchievements });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
