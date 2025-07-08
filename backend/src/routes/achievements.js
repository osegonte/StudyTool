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
