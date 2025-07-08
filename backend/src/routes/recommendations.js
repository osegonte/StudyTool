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
    const { date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    await pool.query('SELECT generate_daily_recommendations($1)', [targetDate]);
    
    res.json({
      success: true,
      message: 'Daily recommendations generated',
      date: targetDate
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get today's recommendations
router.get('/today', async (req, res) => {
  try {
    const recommendations = await pool.query(`
      SELECT dr.*, 
             f.original_name as file_name,
             t.name as topic_name,
             t.icon as topic_icon
      FROM daily_recommendations dr
      LEFT JOIN files f ON dr.file_id = f.id
      LEFT JOIN topics t ON dr.topic_id = t.id
      WHERE dr.date = CURRENT_DATE
      ORDER BY dr.priority DESC, dr.created_at ASC
    `);
    
    res.json({
      recommendations: recommendations.rows,
      date: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark recommendation as completed
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
    
    res.json({
      success: true,
      recommendation: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing recommendation:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
