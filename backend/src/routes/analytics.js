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

// Get comprehensive study analytics
router.get('/overview', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Overall statistics
    const overallStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT ss.id) as total_sessions,
        SUM(ss.total_duration_seconds) / 3600.0 as total_hours,
        AVG(ss.total_duration_seconds) / 60.0 as avg_session_minutes,
        COUNT(DISTINCT ss.file_id) as files_studied,
        SUM(ss.pages_covered) as total_pages_read,
        AVG(ss.focus_rating) as avg_focus_rating,
        COUNT(*) FILTER (WHERE ss.session_end >= CURRENT_DATE - INTERVAL '${days} days') as recent_sessions
      FROM study_sessions ss
      WHERE ss.session_end IS NOT NULL
    `);
    
    
    // Reading speed trends
    const readingSpeedTrends = await pool.query(`
      SELECT 
        DATE_TRUNC('week', date) as week,
        AVG(value) as avg_reading_speed,
        COUNT(*) as data_points
      FROM performance_metrics
      WHERE metric_type = 'reading_speed' 
        AND date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('week', date)
      ORDER BY week DESC
    `);
    
    // Focus performance by time of day
    const focusByTime = await pool.query(`
      SELECT 
        EXTRACT(hour FROM session_start) as hour_of_day,
        AVG(focus_rating) as avg_focus,
        COUNT(*) as session_count
      FROM study_sessions
      WHERE focus_rating IS NOT NULL 
        AND session_start >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY EXTRACT(hour FROM session_start)
      ORDER BY hour_of_day
    `);
    
    // Topic performance
    const topicPerformance = await pool.query(`
      SELECT 
        t.name as topic_name,
        t.icon as topic_icon,
        COUNT(DISTINCT ss.id) as sessions,
        SUM(ss.total_duration_seconds) / 3600.0 as total_hours,
        AVG(ss.focus_rating) as avg_focus,
        SUM(ss.pages_covered) as total_pages
      FROM topics t
      JOIN files f ON t.id = f.topic_id
      JOIN study_sessions ss ON f.id = ss.file_id
      WHERE ss.session_end >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY t.id, t.name, t.icon
      ORDER BY total_hours DESC
    `);
    
    res.json({
      overview: overallStats.rows[0],
      daily_progress: dailyProgress.rows,
      reading_speed_trends: readingSpeedTrends.rows,
      focus_by_time: focusByTime.rows,
      topic_performance: topicPerformance.rows,
      generated_at: new Date().toISOString(),
      period_days: days
    });
    
  } catch (error) {
    console.error('Error getting analytics overview:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get study streak and consistency analytics
router.get('/streaks', async (req, res) => {
  try {
    // Current streak calculation
    const currentStreak = await pool.query(`
      WITH consecutive_days AS (
        SELECT 
          date,
          ROW_NUMBER() OVER (ORDER BY date DESC) as row_num,
          date - (ROW_NUMBER() OVER (ORDER BY date DESC))::integer * INTERVAL '1 day' as group_date
        FROM user_progress 
        WHERE daily_goal_met = true 
          AND date <= CURRENT_DATE
        ORDER BY date DESC
      ),
      streak_groups AS (
        SELECT 
          group_date,
          COUNT(*) as streak_length,
          MAX(date) as end_date,
          MIN(date) as start_date
        FROM consecutive_days
        GROUP BY group_date
        ORDER BY end_date DESC
      )
      SELECT 
        COALESCE(
          (SELECT streak_length FROM streak_groups WHERE end_date = CURRENT_DATE),
          0
        ) as current_streak,
        (SELECT MAX(streak_length) FROM streak_groups) as longest_streak
    `);
    
    // Weekly consistency (percentage of days studied)
    const weeklyConsistency = await pool.query(`
      SELECT 
        DATE_TRUNC('week', date) as week,
        COUNT(*) as days_studied,
        COUNT(*) * 100.0 / 7 as consistency_percentage
      FROM user_progress
      WHERE date >= CURRENT_DATE - INTERVAL '12 weeks'
        AND total_study_minutes > 0
      GROUP BY DATE_TRUNC('week', date)
      ORDER BY week DESC
    `);
    
    res.json({
      current_streak: currentStreak.rows[0]?.current_streak || 0,
      longest_streak: currentStreak.rows[0]?.longest_streak || 0,
      weekly_consistency: weeklyConsistency.rows
    });
    
  } catch (error) {
    console.error('Error getting streak analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get detailed session analytics
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Session details
    const sessionDetails = await pool.query(`
      SELECT 
        ss.*,
        f.original_name as file_name,
        t.name as topic_name,
        sc.location,
        sc.device_used,
        sc.lighting_condition,
        sc.noise_level
      FROM study_sessions ss
      LEFT JOIN files f ON ss.file_id = f.id
      LEFT JOIN topics t ON f.topic_id = t.id
      LEFT JOIN study_contexts sc ON ss.id = sc.session_id
      WHERE ss.id = $1
    `, [sessionId]);
    
    // Page interactions during session
    const pageInteractions = await pool.query(`
      SELECT * FROM page_interactions
      WHERE session_id = $1
      ORDER BY interaction_start
    `, [sessionId]);
    
    // Exercise attempts during session
    const exerciseAttempts = await pool.query(`
      SELECT ea.*, e.title as exercise_title
      FROM exercise_attempts ea
      JOIN exercises e ON ea.exercise_id = e.id
      WHERE ea.session_id = $1
      ORDER BY ea.started_at
    `, [sessionId]);
    
    res.json({
      session: sessionDetails.rows[0],
      page_interactions: pageInteractions.rows,
      exercise_attempts: exerciseAttempts.rows
    });
    
  } catch (error) {
    console.error('Error getting session analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get spaced repetition schedule
router.get('/review-schedule', async (req, res) => {
  try {
    const { days_ahead = 7 } = req.query;
    
    const schedule = await pool.query(`
      SELECT 
        rs.*,
        f.original_name as file_name,
        t.name as topic_name,
        t.icon as topic_icon
      FROM review_schedule rs
      JOIN files f ON rs.file_id = f.id
      LEFT JOIN topics t ON f.topic_id = t.id
      WHERE rs.next_review_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days_ahead} days'
      ORDER BY rs.next_review_date, rs.difficulty_level DESC
    `);
    
    // Group by date for easier display
    const scheduleByDate = {};
    schedule.rows.forEach(item => {
      const date = item.next_review_date.toISOString().split('T')[0];
      if (!scheduleByDate[date]) {
        scheduleByDate[date] = [];
      }
      scheduleByDate[date].push(item);
    });
    
    res.json({
      schedule_by_date: scheduleByDate,
      total_reviews: schedule.rows.length
    });
    
  } catch (error) {
    console.error('Error getting review schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
