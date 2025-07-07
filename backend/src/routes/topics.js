const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const database = require('../database/init');

// Get all topics
router.get('/', async (req, res) => {
  try {
    const topics = await database.query(`
      SELECT 
        t.*,
        COUNT(f.id) as file_count,
        COALESCE(SUM(rp.total_time_spent), 0) as total_time_spent
      FROM topics t
      LEFT JOIN files f ON t.id = f.topic_id
      LEFT JOIN reading_progress rp ON f.id = rp.file_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Create new topic
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      color = '#3498db',
      targetHoursPerDay = 1.0,
      deadline
    } = req.body;

    const topicId = uuidv4();
    
    await database.run(
      `INSERT INTO topics (id, name, description, color, target_hours_per_day, deadline)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [topicId, name, description, color, targetHoursPerDay, deadline]
    );

    res.json({ 
      success: true, 
      topicId,
      message: 'Topic created successfully' 
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

module.exports = router;
