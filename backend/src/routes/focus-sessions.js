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

// Save session reflection
router.post('/reflection', async (req, res) => {
  try {
    const { file_id, focus_score, environment_notes, distractions_count, mode = 'normal' } = req.body;
    
    const result = await pool.query(
      `INSERT INTO focus_sessions (file_id, mode, distractions_count, focus_score, environment_notes, session_end) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [file_id, mode, distractions_count || 0, focus_score, environment_notes]
    );
    
    res.json({ 
      success: true, 
      reflection: result.rows[0],
      message: 'Session reflection saved' 
    });
    
  } catch (error) {
    console.error('Error saving focus session reflection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get focus session analytics
router.get('/analytics/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const analytics = await pool.query(`
      SELECT 
        AVG(focus_score) as avg_focus_score,
        AVG(distractions_count) as avg_distractions,
        COUNT(*) as total_sessions,
        MAX(session_end) as last_session
      FROM focus_sessions 
      WHERE file_id = $1
    `, [fileId]);
    
    const recentSessions = await pool.query(`
      SELECT * FROM focus_sessions 
      WHERE file_id = $1 
      ORDER BY session_end DESC 
      LIMIT 10
    `, [fileId]);
    
    res.json({
      analytics: analytics.rows[0],
      recent_sessions: recentSessions.rows
    });
    
  } catch (error) {
    console.error('Error getting focus analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
