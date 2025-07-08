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
