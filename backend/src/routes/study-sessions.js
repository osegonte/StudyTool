const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Get current user for database connection
const currentUser = process.env.USER || process.env.USERNAME || 'postgres';

// Initialize database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'study_planner',
  user: process.env.DB_USER || currentUser,
  password: process.env.DB_PASSWORD || '',
  ssl: false,
});

// Automatically start a study session when user opens a PDF
router.post('/start/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { startPage = 1, sessionType = 'reading' } = req.body;
    
    // First, end any existing active sessions for this file
    await pool.query(
      `UPDATE study_sessions 
       SET session_end = CURRENT_TIMESTAMP, 
           is_active = false,
           total_duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - session_start))::INTEGER
       WHERE file_id = $1 AND is_active = true`,
      [fileId]
    );
    
    // Also clean up any orphaned page activities
    await pool.query(`
      UPDATE session_page_activity 
      SET page_exit_time = CURRENT_TIMESTAMP,
          duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - page_enter_time))::INTEGER
      WHERE page_exit_time IS NULL 
        AND session_id IN (
          SELECT id FROM study_sessions WHERE file_id = $1
        )
    `, [fileId]);
    
    // Create new study session
    const sessionResult = await pool.query(
      `INSERT INTO study_sessions (file_id, start_page, session_type) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [fileId, startPage, sessionType]
    );
    
    const session = sessionResult.rows[0];
    
    // Update reading progress with current session
    await pool.query(
      `UPDATE reading_progress 
       SET current_session_id = $1, last_session_start = CURRENT_TIMESTAMP 
       WHERE file_id = $2`,
      [session.id, fileId]
    );
    
    // Start tracking the first page
    await pool.query(
      `INSERT INTO session_page_activity (session_id, page_number) 
       VALUES ($1, $2)`,
      [session.id, startPage]
    );
    
    res.json({ 
      success: true, 
      session: session,
      message: 'Study session started automatically' 
    });
    
  } catch (error) {
    console.error('Error starting study session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track page changes within a session (automatic)
router.post('/page-change/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { fromPage, toPage, timestamp } = req.body;
    
    // End tracking for the previous page
    if (fromPage) {
      await pool.query(
        `UPDATE session_page_activity 
         SET page_exit_time = $1,
             duration_seconds = EXTRACT(epoch FROM ($1 - page_enter_time))::INTEGER
         WHERE session_id = $2 AND page_number = $3 AND page_exit_time IS NULL`,
        [timestamp || 'CURRENT_TIMESTAMP', sessionId, fromPage]
      );
    }
    
    // Start tracking the new page
    if (toPage) {
      await pool.query(
        `INSERT INTO session_page_activity (session_id, page_number, page_enter_time) 
         VALUES ($1, $2, $3)`,
        [sessionId, toPage, timestamp || 'CURRENT_TIMESTAMP']
      );
      
      // Update session's current end page
      await pool.query(
        'UPDATE study_sessions SET end_page = $1 WHERE id = $2',
        [toPage, sessionId]
      );
    }
    
    res.json({ 
      success: true, 
      message: `Page tracking updated: ${fromPage} → ${toPage}` 
    });
    
  } catch (error) {
    console.error('Error tracking page change:', error);
    res.status(500).json({ error: error.message });
  }
});

// Automatically end a study session
router.post('/end/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { endPage, notes } = req.body;
    
    // Get the current active session
    const activeSessionResult = await pool.query(
      'SELECT * FROM study_sessions WHERE file_id = $1 AND is_active = true ORDER BY session_start DESC LIMIT 1',
      [fileId]
    );
    
    if (activeSessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active session found' });
    }
    
    const session = activeSessionResult.rows[0];
    
    // End any active page tracking
    await pool.query(
      `UPDATE session_page_activity 
       SET page_exit_time = CURRENT_TIMESTAMP,
           duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - page_enter_time))::INTEGER
       WHERE session_id = $1 AND page_exit_time IS NULL`,
      [session.id]
    );
    
    // Calculate session statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT page_number) as pages_covered,
        SUM(duration_seconds) as total_duration
      FROM session_page_activity 
      WHERE session_id = $1
    `, [session.id]);
    
    const stats = statsResult.rows[0];
    
    // End the study session
    const endResult = await pool.query(
      `UPDATE study_sessions 
       SET session_end = CURRENT_TIMESTAMP,
           is_active = false,
           total_duration_seconds = $1,
           pages_covered = $2,
           end_page = $3,
           notes = $4
       WHERE id = $5 
       RETURNING *`,
      [stats.total_duration || 0, stats.pages_covered || 0, endPage || session.start_page, notes, session.id]
    );
    
    // Clear current session from reading progress
    await pool.query(
      'UPDATE reading_progress SET current_session_id = NULL WHERE file_id = $1',
      [fileId]
    );
    
    res.json({ 
      success: true, 
      session: endResult.rows[0],
      stats: stats,
      message: 'Study session ended automatically' 
    });
    
  } catch (error) {
    console.error('Error ending study session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current session status
router.get('/current/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        ss.*,
        EXTRACT(epoch FROM (CURRENT_TIMESTAMP - ss.session_start))::INTEGER as current_duration,
        COUNT(DISTINCT spa.page_number) as pages_visited,
        MAX(spa.page_number) as current_page
      FROM study_sessions ss
      LEFT JOIN session_page_activity spa ON ss.id = spa.session_id
      WHERE ss.file_id = $1 AND ss.is_active = true
      GROUP BY ss.id
      ORDER BY ss.session_start DESC
      LIMIT 1
    `, [fileId]);
    
    if (result.rows.length === 0) {
      return res.json({ 
        active_session: null,
        message: 'No active session' 
      });
    }
    
    res.json({ 
      active_session: result.rows[0],
      message: 'Active session found' 
    });
    
  } catch (error) {
    console.error('Error getting current session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session history for a file
router.get('/history/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { limit = 10 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        ss.*,
        COUNT(DISTINCT spa.page_number) as unique_pages_visited,
        AVG(spa.duration_seconds) as avg_time_per_page
      FROM study_sessions ss
      LEFT JOIN session_page_activity spa ON ss.id = spa.session_id
      WHERE ss.file_id = $1 AND ss.session_end IS NOT NULL
      GROUP BY ss.id
      ORDER BY ss.session_start DESC
      LIMIT $2
    `, [fileId, limit]);
    
    res.json({ 
      sessions: result.rows,
      total: result.rows.length 
    });
    
  } catch (error) {
    console.error('Error getting session history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clean up inactive sessions (run periodically)
router.post('/cleanup', async (req, res) => {
  try {
    await pool.query('SELECT auto_end_inactive_sessions()');
    
    res.json({ 
      success: true, 
      message: 'Inactive sessions cleaned up' 
    });
    
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
