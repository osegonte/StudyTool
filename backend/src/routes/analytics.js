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

// Get analytics overview
router.get('/overview', async (req, res) => {
  try {
    const overview = await pool.query(`
      SELECT 
        COUNT(DISTINCT ss.id) as total_sessions,
        COALESCE(SUM(ss.total_duration_seconds) / 3600.0, 0) as total_hours,
        COALESCE(SUM(ss.pages_covered), 0) as total_pages_read,
        COALESCE(AVG(ss.focus_rating), 0) as avg_focus_rating
      FROM study_sessions ss
      WHERE ss.session_end IS NOT NULL
    `);
    
    res.json({ overview: overview.rows[0] });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
