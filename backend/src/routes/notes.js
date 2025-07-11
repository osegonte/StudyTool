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

// Get notes
router.get('/', async (req, res) => {
  try {
    const { file_id, topic_id, page } = req.query;
    let query = 'SELECT * FROM notes WHERE is_archived = false';
    let params = [];
    let paramCount = 0;
    
    if (file_id) {
      paramCount++;
      query += ` AND file_id = $${paramCount}`;
      params.push(file_id);
    }
    
    if (topic_id) {
      paramCount++;
      query += ` AND topic_id = $${paramCount}`;
      params.push(topic_id);
    }
    
    if (page) {
      paramCount++;
      query += ` AND page_reference = $${paramCount}`;
      params.push(parseInt(page));
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ notes: result.rows });
  } catch (error) {
    console.error('Error getting notes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create note
router.post('/', async (req, res) => {
  try {
    const { title, content, file_id, topic_id, page_reference, tags } = req.body;
    
    const result = await pool.query(
      `INSERT INTO notes (title, content, file_id, topic_id, page_reference, tags) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [title, content, file_id, topic_id, page_reference, tags || []]
    );
    
    res.json({ success: true, note: result.rows[0] });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
