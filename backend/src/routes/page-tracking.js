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

// Start tracking a page view
router.post('/start/:fileId/:pageNumber', async (req, res) => {
  try {
    const { fileId, pageNumber } = req.params;
    
    // End any existing active session for this file
    await pool.query(
      `UPDATE page_tracking 
       SET session_end = CURRENT_TIMESTAMP, 
           time_spent_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - session_start))::INTEGER 
       WHERE file_id = $1 AND session_end IS NULL`,
      [fileId]
    );
    
    // Start new page tracking session
    const result = await pool.query(
      `INSERT INTO page_tracking (file_id, page_number, session_start) 
       VALUES ($1, $2, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [fileId, parseInt(pageNumber)]
    );
    
    // Update current page in reading_progress
    await pool.query(
      `UPDATE reading_progress 
       SET current_page = $1, current_page_start_time = CURRENT_TIMESTAMP 
       WHERE file_id = $2`,
      [parseInt(pageNumber), fileId]
    );
    
    res.json({ 
      success: true, 
      tracking: result.rows[0],
      message: `Started tracking page ${pageNumber}` 
    });
    
  } catch (error) {
    console.error('Error starting page tracking:', error);
    res.status(500).json({ error: error.message });
  }
});

// End tracking current page
router.post('/end/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await pool.query(
      `UPDATE page_tracking 
       SET session_end = CURRENT_TIMESTAMP,
           time_spent_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - session_start))::INTEGER
       WHERE file_id = $1 AND session_end IS NULL 
       RETURNING *`,
      [fileId]
    );
    
    // Clear current page start time
    await pool.query(
      'UPDATE reading_progress SET current_page_start_time = NULL WHERE file_id = $1',
      [fileId]
    );
    
    res.json({ 
      success: true, 
      sessions: result.rows,
      message: 'Page tracking session ended' 
    });
    
  } catch (error) {
    console.error('Error ending page tracking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get page tracking data for a file
router.get('/stats/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get detailed page statistics
    const pageStats = await pool.query(
      `SELECT 
         page_number,
         COUNT(*) as view_count,
         SUM(time_spent_seconds) as total_time_seconds,
         AVG(time_spent_seconds) as avg_time_seconds,
         MAX(time_spent_seconds) as max_time_seconds,
         MIN(time_spent_seconds) as min_time_seconds
       FROM page_tracking 
       WHERE file_id = $1 AND time_spent_seconds > 0
       GROUP BY page_number 
       ORDER BY page_number`,
      [fileId]
    );
    
    // Get overall file statistics
    const fileStats = await pool.query(
      `SELECT 
         COUNT(DISTINCT page_number) as pages_viewed,
         SUM(time_spent_seconds) as total_reading_time,
         AVG(time_spent_seconds) as avg_time_per_page,
         COUNT(*) as total_page_views
       FROM page_tracking 
       WHERE file_id = $1 AND time_spent_seconds > 0`,
      [fileId]
    );
    
    res.json({
      file_id: fileId,
      page_stats: pageStats.rows,
      file_stats: fileStats.rows[0] || {},
      reading_speed: {
        seconds_per_page: fileStats.rows[0]?.avg_time_per_page || 0,
        pages_per_minute: fileStats.rows[0]?.avg_time_per_page ? 
          Math.round(60 / fileStats.rows[0].avg_time_per_page * 100) / 100 : 0
      }
    });
    
  } catch (error) {
    console.error('Error getting page stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reading speed analysis across all files
router.get('/analysis/reading-speed', async (req, res) => {
  try {
    const analysis = await pool.query(`
      SELECT 
        f.original_name,
        f.id as file_id,
        COUNT(DISTINCT pt.page_number) as pages_read,
        SUM(pt.time_spent_seconds) as total_time_seconds,
        AVG(pt.time_spent_seconds) as avg_seconds_per_page,
        ROUND(60.0 / AVG(pt.time_spent_seconds), 2) as pages_per_minute
      FROM files f
      JOIN page_tracking pt ON f.id = pt.file_id
      WHERE pt.time_spent_seconds > 5
      GROUP BY f.id, f.original_name
      HAVING COUNT(DISTINCT pt.page_number) > 0
      ORDER BY pages_per_minute DESC
    `);
    
    // Overall user reading speed
    const overallSpeed = await pool.query(`
      SELECT 
        AVG(time_spent_seconds) as avg_seconds_per_page,
        ROUND(60.0 / AVG(time_spent_seconds), 2) as overall_pages_per_minute,
        COUNT(DISTINCT file_id) as files_tracked,
        COUNT(DISTINCT page_number) as total_pages_read
      FROM page_tracking 
      WHERE time_spent_seconds > 5
    `);
    
    res.json({
      files: analysis.rows,
      overall: overallSpeed.rows[0] || {},
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting reading speed analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
