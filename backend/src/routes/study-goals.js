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

// Create a new study goal
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      goal_type,
      target_value,
      target_unit,
      deadline,
      topic_id,
      file_id,
      priority = 3
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO study_goals 
       (title, description, goal_type, target_value, target_unit, deadline, 
        topic_id, file_id, priority) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [title, description, goal_type, target_value, target_unit, deadline,
       topic_id, file_id, priority]
    );
    
    res.json({
      success: true,
      goal: result.rows[0],
      message: 'Study goal created successfully'
    });
    
  } catch (error) {
    console.error('Error creating study goal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all active study goals
router.get('/', async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    let whereClause = 'WHERE 1=1';
    if (status === 'active') {
      whereClause += ' AND is_achieved = false AND (deadline IS NULL OR deadline >= CURRENT_DATE)';
    } else if (status === 'achieved') {
      whereClause += ' AND is_achieved = true';
    } else if (status === 'overdue') {
      whereClause += ' AND is_achieved = false AND deadline < CURRENT_DATE';
    }
    
    const result = await pool.query(`
      SELECT g.*,
             t.name as topic_name,
             f.original_name as file_name,
             CASE 
               WHEN g.deadline IS NOT NULL 
               THEN DATE_PART('day', g.deadline - CURRENT_DATE)
               ELSE NULL 
             END as days_remaining
      FROM study_goals g
      LEFT JOIN topics t ON g.topic_id = t.id
      LEFT JOIN files f ON g.file_id = f.id
      ${whereClause}
      ORDER BY g.priority DESC, g.deadline ASC
    `);
    
    res.json({
      goals: result.rows
    });
    
  } catch (error) {
    console.error('Error getting study goals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update goal progress
router.put('/:goalId/progress', async (req, res) => {
  try {
    const { goalId } = req.params;
    const { progress_increment } = req.body;
    
    const result = await pool.query(
      `UPDATE study_goals 
       SET current_progress = current_progress + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING *`,
      [progress_increment, goalId]
    );
    
    if (result.rows.length > 0) {
      const goal = result.rows[0];
      
      // Check if goal is achieved
      if (goal.current_progress >= goal.target_value && !goal.is_achieved) {
        await pool.query(
          'UPDATE study_goals SET is_achieved = true, achieved_at = CURRENT_TIMESTAMP WHERE id = $1',
          [goalId]
        );
        
        // Award achievement XP
        await pool.query(
          'SELECT comprehensive_daily_update($1, $2, $3, $4, $5)',
          [0, 0, 0, 0, null] // This will be updated to include achievement XP
        );
      }
    }
    
    res.json({
      success: true,
      goal: result.rows[0],
      message: 'Goal progress updated'
    });
    
  } catch (error) {
    console.error('Error updating goal progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get goal analytics and insights
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await pool.query(`
      SELECT 
        COUNT(*) as total_goals,
        COUNT(*) FILTER (WHERE is_achieved = true) as achieved_goals,
        COUNT(*) FILTER (WHERE deadline < CURRENT_DATE AND is_achieved = false) as overdue_goals,
        COUNT(*) FILTER (WHERE deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') as due_this_week,
        AVG(current_progress::DECIMAL / target_value * 100) as avg_completion_percentage
      FROM study_goals
    `);
    
    const recentAchievements = await pool.query(`
      SELECT g.*, t.name as topic_name, f.original_name as file_name
      FROM study_goals g
      LEFT JOIN topics t ON g.topic_id = t.id
      LEFT JOIN files f ON g.file_id = f.id
      WHERE g.is_achieved = true
      ORDER BY g.achieved_at DESC
      LIMIT 5
    `);
    
    res.json({
      analytics: analytics.rows[0],
      recent_achievements: recentAchievements.rows
    });
    
  } catch (error) {
    console.error('Error getting goal analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
