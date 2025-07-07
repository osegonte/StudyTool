const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const database = require('../database/init');

// Create new goal
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      targetType,
      targetValue,
      startDate,
      endDate,
      fileId,
      topicId
    } = req.body;

    const goalId = uuidv4();
    
    await database.run(
      `INSERT INTO study_goals 
       (id, title, description, target_type, target_value, start_date, end_date, file_id, topic_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [goalId, title, description, targetType, targetValue, startDate, endDate, fileId, topicId]
    );

    res.json({ 
      success: true, 
      goalId,
      message: 'Goal created successfully' 
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Get all goals
router.get('/', async (req, res) => {
  try {
    const goals = await database.query(`
      SELECT g.*, f.original_name as file_name, t.name as topic_name
      FROM study_goals g
      LEFT JOIN files f ON g.file_id = f.id
      LEFT JOIN topics t ON g.topic_id = t.id
      ORDER BY g.created_at DESC
    `);

    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Delete goal
router.delete('/:goalId', async (req, res) => {
  try {
    const { goalId } = req.params;
    
    await database.run('DELETE FROM study_goals WHERE id = ?', [goalId]);
    
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
