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

// Generate daily recommendations
router.post('/generate', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if recommendations already exist for today
    const existing = await pool.query(
      'SELECT COUNT(*) as count FROM daily_recommendations WHERE date = $1',
      [today]
    );
    
    if (parseInt(existing.rows[0].count) > 0) {
      return res.json({ success: true, message: 'Recommendations already exist for today' });
    }
    
    // Get user's files and progress
    const files = await pool.query(`
      SELECT f.*, rp.current_page, rp.total_pages, rp.last_read
      FROM files f
      LEFT JOIN reading_progress rp ON f.id = rp.file_id
      ORDER BY rp.last_read DESC NULLS LAST
      LIMIT 5
    `);
    
    const recommendations = [];
    
    // Generate different types of recommendations
    if (files.rows.length > 0) {
      const recentFile = files.rows[0];
      
      recommendations.push({
        title: 'Continue Reading',
        description: `Pick up where you left off in "${recentFile.original_name}"`,
        recommendation_type: 'focus',
        file_id: recentFile.id,
        estimated_minutes: 25
      });
      
      recommendations.push({
        title: 'Quick Review',
        description: 'Review the last 3 pages you read',
        recommendation_type: 'light',
        file_id: recentFile.id,
        estimated_minutes: 10
      });
    }
    
    // Add general recommendations
    recommendations.push({
      title: 'Daily Goal Check',
      description: 'Work towards your daily study goal',
      recommendation_type: 'urgent',
      estimated_minutes: 30
    });
    
    // Insert recommendations
    for (const rec of recommendations) {
      await pool.query(
        `INSERT INTO daily_recommendations 
         (date, title, description, recommendation_type, file_id, estimated_minutes) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [today, rec.title, rec.description, rec.recommendation_type, 
         rec.file_id || null, rec.estimated_minutes]
      );
    }
    
    res.json({ success: true, message: 'Recommendations generated' });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get today's recommendations
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT dr.*, f.original_name as file_name, t.name as topic_name, t.icon as topic_icon
      FROM daily_recommendations dr
      LEFT JOIN files f ON dr.file_id = f.id
      LEFT JOIN topics t ON f.topic_id = t.id
      WHERE dr.date = $1
      ORDER BY 
        CASE dr.recommendation_type 
          WHEN 'urgent' THEN 1 
          WHEN 'focus' THEN 2 
          WHEN 'light' THEN 3 
          ELSE 4 
        END,
        dr.created_at
    `, [today]);
    
    res.json({ recommendations: result.rows });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete a recommendation
router.put('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE daily_recommendations SET is_completed = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    
    res.json({ success: true, recommendation: result.rows[0] });
  } catch (error) {
    console.error('Error completing recommendation:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
