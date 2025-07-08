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

// Create a new exercise
router.post('/', async (req, res) => {
  try {
    const {
      topic_id,
      file_id,
      title,
      description,
      exercise_type = 'practice',
      difficulty_level = 3,
      estimated_duration_minutes,
      source_page_numbers
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO exercises 
       (topic_id, file_id, title, description, exercise_type, difficulty_level, 
        estimated_duration_minutes, source_page_numbers) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [topic_id, file_id, title, description, exercise_type, difficulty_level, 
       estimated_duration_minutes, source_page_numbers]
    );
    
    res.json({
      success: true,
      exercise: result.rows[0],
      message: 'Exercise created successfully'
    });
    
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get exercises for a file or topic
router.get('/by-file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await pool.query(`
      SELECT e.*, 
             COUNT(ea.id) as attempt_count,
             AVG(ea.score_percentage) as avg_score,
             MAX(ea.completed_at) as last_attempt
      FROM exercises e
      LEFT JOIN exercise_attempts ea ON e.id = ea.exercise_id
      WHERE e.file_id = $1
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `, [fileId]);
    
    res.json({
      exercises: result.rows
    });
    
  } catch (error) {
    console.error('Error getting exercises:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start an exercise attempt
router.post('/:exerciseId/attempt', async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const { session_id } = req.body;
    
    const result = await pool.query(
      `INSERT INTO exercise_attempts (exercise_id, session_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [exerciseId, session_id]
    );
    
    res.json({
      success: true,
      attempt: result.rows[0],
      message: 'Exercise attempt started'
    });
    
  } catch (error) {
    console.error('Error starting exercise attempt:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete an exercise attempt
router.put('/attempt/:attemptId/complete', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const {
      duration_seconds,
      score_percentage,
      confidence_rating,
      difficulty_felt,
      notes,
      mistakes_made,
      concepts_unclear
    } = req.body;
    
    // Calculate next review date based on performance
    const nextReviewDays = score_percentage >= 80 ? 7 : 
                          score_percentage >= 60 ? 3 : 1;
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);
    
    const result = await pool.query(
      `UPDATE exercise_attempts 
       SET completed_at = CURRENT_TIMESTAMP,
           duration_seconds = $1,
           score_percentage = $2,
           confidence_rating = $3,
           difficulty_felt = $4,
           notes = $5,
           mistakes_made = $6,
           concepts_unclear = $7,
           next_review_date = $8
       WHERE id = $9 
       RETURNING *`,
      [duration_seconds, score_percentage, confidence_rating, difficulty_felt,
       notes, mistakes_made, concepts_unclear, nextReviewDate, attemptId]
    );
    
    if (result.rows.length > 0) {
      // Update daily progress
      await pool.query(
        'SELECT comprehensive_daily_update($1, $2, $3, $4, $5)',
        [Math.ceil(duration_seconds / 60), 0, 0, 1, confidence_rating]
      );
      
      // Mark exercise as completed if score is good
      if (score_percentage >= 70) {
        await pool.query(
          'UPDATE exercises SET is_completed = true WHERE id = (SELECT exercise_id FROM exercise_attempts WHERE id = $1)',
          [attemptId]
        );
      }
    }
    
    res.json({
      success: true,
      attempt: result.rows[0],
      message: 'Exercise attempt completed'
    });
    
  } catch (error) {
    console.error('Error completing exercise attempt:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get exercise performance analytics
router.get('/analytics/:exerciseId', async (req, res) => {
  try {
    const { exerciseId } = req.params;
    
    const analytics = await pool.query(`
      SELECT 
        COUNT(*) as total_attempts,
        AVG(score_percentage) as avg_score,
        MAX(score_percentage) as best_score,
        AVG(duration_seconds) as avg_duration,
        AVG(confidence_rating) as avg_confidence,
        AVG(difficulty_felt) as avg_difficulty,
        COUNT(*) FILTER (WHERE score_percentage >= 80) as high_score_attempts
      FROM exercise_attempts 
      WHERE exercise_id = $1 AND completed_at IS NOT NULL
    `, [exerciseId]);
    
    const recentAttempts = await pool.query(`
      SELECT * FROM exercise_attempts 
      WHERE exercise_id = $1 AND completed_at IS NOT NULL
      ORDER BY completed_at DESC 
      LIMIT 10
    `, [exerciseId]);
    
    res.json({
      analytics: analytics.rows[0],
      recent_attempts: recentAttempts.rows
    });
    
  } catch (error) {
    console.error('Error getting exercise analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
