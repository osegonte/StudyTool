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

// Get all topics
router.get('/', async (req, res) => {
  try {
    const { include_archived = false } = req.query;
    
    let whereClause = '';
    if (!include_archived) {
      whereClause = 'WHERE t.is_archived = false';
    }
    
    const query = `
      SELECT 
        t.*,
        COUNT(DISTINCT f.id) as file_count,
        COALESCE(SUM(f.page_count), 0) as total_pages,
        COALESCE(SUM(rp.pages_read), 0) as completed_pages,
        CASE 
          WHEN SUM(f.page_count) > 0 
          THEN ROUND((SUM(rp.pages_read)::DECIMAL / SUM(f.page_count)) * 100, 1)
          ELSE 0 
        END as completion_percentage
      FROM topics t
      LEFT JOIN files f ON t.id = f.topic_id
      LEFT JOIN reading_progress rp ON f.id = rp.file_id
      ${whereClause}
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    const topics = result.rows.map(topic => ({
      ...topic,
      file_count: parseInt(topic.file_count),
      total_pages: parseInt(topic.total_pages),
      completed_pages: parseInt(topic.completed_pages),
      completion_percentage: parseFloat(topic.completion_percentage) || 0,
      current_streak: 0, // Add streak calculation later
      total_study_time: 0 // Add study time calculation later
    }));
    
    res.json(topics);
  } catch (error) {
    console.error('Error getting topics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new topic
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      color = '#8B5CF6', 
      icon = '📚',
      target_completion_date,
      estimated_hours,
      priority = 3
    } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Topic name is required' });
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
    const updateFields = req.body;
    
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
        updateFields.name || existingTopic.rows[0].name,
        updateFields.description,
        updateFields.color || existingTopic.rows[0].color,
        updateFields.icon || existingTopic.rows[0].icon,
        updateFields.target_completion_date,
        updateFields.estimated_hours ? parseInt(updateFields.estimated_hours) : null,
        updateFields.priority || existingTopic.rows[0].priority,
        updateFields.is_archived !== undefined ? updateFields.is_archived : existingTopic.rows[0].is_archived,
        id
      ]
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

// Delete a topic
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Unlink files instead of preventing deletion
    await pool.query('UPDATE files SET topic_id = NULL WHERE topic_id = $1', [id]);
    
    const result = await pool.query('DELETE FROM topics WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json({
      success: true,
      message: 'Topic deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;