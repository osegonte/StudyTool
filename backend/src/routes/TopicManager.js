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

// Get all topics with enhanced statistics
router.get('/', async (req, res) => {
  try {
    const { include_archived = false, sort_by = 'created_at', order = 'DESC' } = req.query;
    
    let whereClause = '';
    if (!include_archived) {
      whereClause = 'WHERE t.is_archived = false';
    }
    
    const validSortFields = ['created_at', 'name', 'priority', 'target_completion_date', 'completion_percentage'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const query = `
      SELECT 
        t.*,
        COUNT(DISTINCT f.id) as file_count,
        COALESCE(SUM(f.page_count), 0) as total_pages,
        COALESCE(SUM(rp.pages_read), 0) as completed_pages,
        COALESCE(SUM(ss.total_duration_seconds), 0) / 3600.0 as total_study_hours,
        MAX(ss.session_end) as last_studied,
        COUNT(DISTINCT DATE(ss.session_start)) as study_days,
        CASE 
          WHEN SUM(f.page_count) > 0 
          THEN ROUND((SUM(rp.pages_read)::DECIMAL / SUM(f.page_count)) * 100, 1)
          ELSE 0 
        END as completion_percentage,
        CASE 
          WHEN t.target_completion_date IS NOT NULL 
          THEN DATE_PART('day', t.target_completion_date - CURRENT_DATE)
          ELSE NULL 
        END as days_until_deadline
      FROM topics t
      LEFT JOIN files f ON t.id = f.topic_id
      LEFT JOIN reading_progress rp ON f.id = rp.file_id
      LEFT JOIN study_sessions ss ON f.id = ss.file_id AND ss.session_end IS NOT NULL
      ${whereClause}
      GROUP BY t.id
      ORDER BY ${sortField === 'completion_percentage' ? 'completion_percentage' : `t.${sortField}`} ${sortOrder}
    `;
    
    const result = await pool.query(query);
    
    // Calculate current streak for each topic
    const topicsWithStreaks = await Promise.all(result.rows.map(async (topic) => {
      const streakQuery = `
        WITH consecutive_days AS (
          SELECT 
            DATE(ss.session_start) as study_date,
            ROW_NUMBER() OVER (ORDER BY DATE(ss.session_start) DESC) as row_num,
            DATE(ss.session_start) - (ROW_NUMBER() OVER (ORDER BY DATE(ss.session_start) DESC))::integer * INTERVAL '1 day' as group_date
          FROM study_sessions ss
          JOIN files f ON ss.file_id = f.id
          WHERE f.topic_id = $1 
            AND ss.session_end IS NOT NULL
            AND DATE(ss.session_start) <= CURRENT_DATE
          GROUP BY DATE(ss.session_start)
          ORDER BY DATE(ss.session_start) DESC
        ),
        streak_groups AS (
          SELECT 
            group_date,
            COUNT(*) as streak_length,
            MAX(study_date) as end_date
          FROM consecutive_days
          GROUP BY group_date
          ORDER BY end_date DESC
        )
        SELECT 
          COALESCE(
            (SELECT streak_length FROM streak_groups WHERE end_date >= CURRENT_DATE - INTERVAL '1 day' LIMIT 1),
            0
          ) as current_streak
      `;
      
      const streakResult = await pool.query(streakQuery, [topic.id]);
      
      return {
        ...topic,
        current_streak: streakResult.rows[0]?.current_streak || 0,
        file_count: parseInt(topic.file_count),
        total_pages: parseInt(topic.total_pages),
        completed_pages: parseInt(topic.completed_pages),
        total_study_hours: parseFloat(topic.total_study_hours) || 0,
        completion_percentage: parseFloat(topic.completion_percentage) || 0,
        days_until_deadline: topic.days_until_deadline ? parseInt(topic.days_until_deadline) : null
      };
    }));
    
    res.json(topicsWithStreaks);
  } catch (error) {
    console.error('Error getting topics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new topic with enhanced features
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      color = '#8B5CF6', 
      icon = '📚',
      target_completion_date,
      estimated_hours,
      priority = 3,
      tags = []
    } = req.body;
    
    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Topic name is required' });
    }
    
    if (priority < 1 || priority > 5) {
      return res.status(400).json({ error: 'Priority must be between 1 and 5' });
    }
    
    const result = await pool.query(
      `INSERT INTO topics 
       (name, description, color, icon, target_completion_date, estimated_hours, priority) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        name.trim(), 
        description?.trim() || null, 
        color, 
        icon, 
        target_completion_date || null,
        estimated_hours ? parseInt(estimated_hours) : null,
        priority
      ]
    );
    
    // Log topic creation event
    await pool.query(
      'INSERT INTO topic_events (topic_id, event_type, event_data) VALUES ($1, $2, $3)',
      [result.rows[0].id, 'created', JSON.stringify({ created_by: 'user' })]
    );
    
    res.status(201).json({
      success: true,
      topic: result.rows[0],
      message: 'Topic created successfully'
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a topic
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      color, 
      icon,
      target_completion_date,
      estimated_hours,
      priority,
      is_archived
    } = req.body;
    
    // Check if topic exists
    const existingTopic = await pool.query('SELECT * FROM topics WHERE id = $1', [id]);
    if (existingTopic.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    const result = await pool.query(
      `UPDATE topics 
       SET name = $1, description = $2, color = $3, icon = $4, 
           target_completion_date = $5, estimated_hours = $6, priority = $7,
           is_archived = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 
       RETURNING *`,
      [
        name?.trim() || existingTopic.rows[0].name,
        description?.trim(),
        color || existingTopic.rows[0].color,
        icon || existingTopic.rows[0].icon,
        target_completion_date,
        estimated_hours ? parseInt(estimated_hours) : null,
        priority || existingTopic.rows[0].priority,
        is_archived !== undefined ? is_archived : existingTopic.rows[0].is_archived,
        id
      ]
    );
    
    // Log update event
    await pool.query(
      'INSERT INTO topic_events (topic_id, event_type, event_data) VALUES ($1, $2, $3)',
      [id, 'updated', JSON.stringify(req.body)]
    );
    
    res.json({
      success: true,
      topic: result.rows[0],
      message: 'Topic updated successfully'
    });
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// Archive/Unarchive a topic
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_archived } = req.body;
    
    const result = await pool.query(
      'UPDATE topics SET is_archived = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_archived, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // Log archive event
    await pool.query(
      'INSERT INTO topic_events (topic_id, event_type, event_data) VALUES ($1, $2, $3)',
      [id, is_archived ? 'archived' : 'unarchived', JSON.stringify({ timestamp: new Date().toISOString() })]
    );
    
    res.json({
      success: true,
      topic: result.rows[0],
      message: `Topic ${is_archived ? 'archived' : 'unarchived'} successfully`
    });
  } catch (error) {
    console.error('Error archiving topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a topic
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if topic has files
    const filesCheck = await pool.query('SELECT COUNT(*) as count FROM files WHERE topic_id = $1', [id]);
    const fileCount = parseInt(filesCheck.rows[0].count);
    
    if (fileCount > 0) {
      // Just unlink files instead of preventing deletion
      await pool.query('UPDATE files SET topic_id = NULL WHERE topic_id = $1', [id]);
    }
    
    // Delete related events
    await pool.query('DELETE FROM topic_events WHERE topic_id = $1', [id]);
    
    // Delete the topic
    const result = await pool.query('DELETE FROM topics WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json({
      success: true,
      message: `Topic deleted successfully. ${fileCount} files were unlinked.`,
      files_unlinked: fileCount
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get topic analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    
    // Basic topic info
    const topicInfo = await pool.query('SELECT * FROM topics WHERE id = $1', [id]);
    if (topicInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // Study time analytics
    const studyAnalytics = await pool.query(`
      SELECT 
        DATE(ss.session_start) as study_date,
        SUM(ss.total_duration_seconds) / 3600.0 as hours_studied,
        COUNT(DISTINCT ss.id) as sessions_count,
        SUM(ss.pages_covered) as pages_read,
        AVG(ss.focus_rating) as avg_focus_rating
      FROM study_sessions ss
      JOIN files f ON ss.file_id = f.id
      WHERE f.topic_id = $1 
        AND ss.session_end IS NOT NULL
        AND ss.session_start >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(ss.session_start)
      ORDER BY study_date DESC
    `, [id]);
    
    // Reading speed trends
    const readingSpeed = await pool.query(`
      SELECT 
        DATE_TRUNC('week', ss.session_start) as week,
        AVG(ss.pages_covered::DECIMAL / (ss.total_duration_seconds / 60)) as avg_pages_per_minute
      FROM study_sessions ss
      JOIN files f ON ss.file_id = f.id
      WHERE f.topic_id = $1 
        AND ss.session_end IS NOT NULL
        AND ss.total_duration_seconds > 0
        AND ss.pages_covered > 0
        AND ss.session_start >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('week', ss.session_start)
      ORDER BY week DESC
    `, [id]);
    
    // Goal progress
    const goalProgress = await pool.query(`
      SELECT 
        sg.*,
        CASE 
          WHEN sg.target_value > 0 
          THEN ROUND((sg.current_progress::DECIMAL / sg.target_value) * 100, 1)
          ELSE 0 
        END as progress_percentage
      FROM study_goals sg
      WHERE sg.topic_id = $1 AND sg.is_achieved = false
      ORDER BY sg.priority DESC, sg.deadline ASC
    `, [id]);
    
    res.json({
      topic: topicInfo.rows[0],
      study_analytics: studyAnalytics.rows,
      reading_speed_trends: readingSpeed.rows,
      active_goals: goalProgress.rows,
      period_days: days
    });
  } catch (error) {
    console.error('Error getting topic analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start a study sprint for a topic
router.post('/:id/start-sprint', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      duration_minutes = 25, 
      file_id = null,
      sprint_goal = 'focused_reading'
    } = req.body;
    
    // Verify topic exists
    const topicCheck = await pool.query('SELECT * FROM topics WHERE id = $1', [id]);
    if (topicCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // If no specific file, find the next file to study in this topic
    let targetFileId = file_id;
    if (!targetFileId) {
      const nextFileQuery = await pool.query(`
        SELECT f.id, rp.current_page, f.page_count
        FROM files f
        LEFT JOIN reading_progress rp ON f.id = rp.file_id
        WHERE f.topic_id = $1
        ORDER BY 
          CASE WHEN rp.current_page IS NULL THEN 0 ELSE rp.current_page END ASC,
          f.created_at ASC
        LIMIT 1
      `, [id]);
      
      if (nextFileQuery.rows.length === 0) {
        return res.status(400).json({ error: 'No files found in this topic' });
      }
      
      targetFileId = nextFileQuery.rows[0].id;
    }
    
    // Create study sprint
    const sprintResult = await pool.query(`
      INSERT INTO study_sprints 
      (title, description, file_id, topic_id, estimated_minutes, sprint_goal, scheduled_date, scheduled_time)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, CURRENT_TIME)
      RETURNING *
    `, [
      `${topicCheck.rows[0].name} Sprint`,
      `Focused study session for ${topicCheck.rows[0].name}`,
      targetFileId,
      id,
      duration_minutes,
      sprint_goal
    ]);
    
    // Start study session
    const sessionResult = await pool.query(`
      INSERT INTO study_sessions (file_id, session_type, sprint_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [targetFileId, 'sprint', sprintResult.rows[0].id]);
    
    res.json({
      success: true,
      sprint: sprintResult.rows[0],
      session: sessionResult.rows[0],
      message: 'Study sprint started successfully'
    });
  } catch (error) {
    console.error('Error starting study sprint:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;