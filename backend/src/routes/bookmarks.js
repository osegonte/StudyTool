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

// Get bookmarks for a file
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM bookmarks WHERE file_id = $1 ORDER BY page_number ASC',
      [fileId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a bookmark
router.post('/', async (req, res) => {
  try {
    const { file_id, page_number, title, notes } = req.body;
    
    const result = await pool.query(
      `INSERT INTO bookmarks (file_id, page_number, title, notes) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [file_id, page_number, title, notes]
    );
    
    res.json({
      success: true,
      bookmark: result.rows[0],
      message: 'Bookmark created successfully'
    });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a bookmark
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM bookmarks WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    res.json({
      success: true,
      message: 'Bookmark deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;