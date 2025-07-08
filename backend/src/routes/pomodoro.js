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

// Start a pomodoro session
router.post('/start', async (req, res) => {
  try {
    const { file_id, session_type = 'focus', duration_minutes = 25 } = req.body;
    
    const result = await pool.query(
      `INSERT INTO pomodoro_sessions (file_id, session_type, duration_minutes) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [file_id, session_type, duration_minutes]
    );
    
    res.json({ 
      success: true, 
      session: result.rows[0],
      message: `${session_type} session started` 
    });
    
  } catch (error) {
    console.error('Error starting pomodoro session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete a pomodoro session
router.post('/end/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { 
      actual_duration_seconds, 
      was_interrupted = false, 
      interruption_reason, 
      focus_rating,
      notes 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE pomodoro_sessions 
       SET completed_at = CURRENT_TIMESTAMP,
           actual_duration_seconds = $1,
           was_interrupted = $2,
           interruption_reason = $3,
           focus_rating = $4,
           notes = $5
       WHERE id = $6 
       RETURNING *`,
      [actual_duration_seconds, was_interrupted, interruption_reason, focus_rating, notes, sessionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = result.rows[0];
    
    // Update daily progress if session was completed successfully
    if (!was_interrupted && session.session_type === 'focus') {
      const minutes = Math.ceil(actual_duration_seconds / 60);
      await pool.query('SELECT update_daily_progress($1, $2, $3)', [minutes, 0, 1]);
    }
    
    res.json({ 
      success: true, 
      session: session,
      message: 'Session completed successfully' 
    });
    
  } catch (error) {
    console.error('Error ending pomodoro session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pomodoro statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE was_interrupted = false) as completed_sessions,
        COUNT(*) FILTER (WHERE session_type = 'focus' AND was_interrupted = false) as focus_sessions,
        AVG(actual_duration_seconds) FILTER (WHERE was_interrupted = false) as avg_duration,
        AVG(focus_rating) FILTER (WHERE focus_rating IS NOT NULL) as avg_focus_rating,
        COUNT(*) FILTER (WHERE started_at >= CURRENT_DATE) as today_sessions
      FROM pomodoro_sessions
    `);
    
    const recentSessions = await pool.query(`
      SELECT ps.*, f.original_name
      FROM pomodoro_sessions ps
      LEFT JOIN files f ON ps.file_id = f.id
      ORDER BY ps.started_at DESC
      LIMIT 10
    `);
    
    res.json({
      stats: stats.rows[0],
      recent_sessions: recentSessions.rows
    });
    
  } catch (error) {
    console.error('Error getting pomodoro stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
