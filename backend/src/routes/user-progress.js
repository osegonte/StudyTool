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
    res.json({
      current_streak: 0,
      total_xp: 0,
      daily_goal: 60
    });
  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
