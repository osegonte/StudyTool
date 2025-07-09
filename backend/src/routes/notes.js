const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
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

// Get all notes with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      topic_id, 
      search, 
      tag, 
      note_type, 
      limit = 50, 
      offset = 0
    } = req.query;

    let query = `
      SELECT n.*, t.name as topic_name, t.icon as topic_icon,
             ARRAY_LENGTH(n.tags, 1) as tag_count
      FROM notes n
      LEFT JOIN topics t ON n.topic_id = t.id
      WHERE n.is_archived = false
    `;
    
    const params = [];
    let paramCount = 0;

    if (topic_id) {
      paramCount++;
      query += ` AND n.topic_id = $${paramCount}`;
      params.push(topic_id);
    }

    if (note_type) {
      paramCount++;
      query += ` AND n.note_type = $${paramCount}`;
      params.push(note_type);
    }

    if (search) {
      paramCount++;
      query += ` AND (n.title ILIKE $${paramCount} OR n.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY n.updated_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await pool.query(query, params);
    
    res.json({
      notes: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error getting notes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new note
router.post('/', async (req, res) => {
  try {
    const {
      title,
      content = '',
      topic_id,
      file_id,
      note_type = 'general',
      tags = []
    } = req.body;

    const result = await pool.query(
      `INSERT INTO notes (title, content, topic_id, file_id, note_type, tags) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [title, content, topic_id, file_id, note_type, tags]
    );

    res.json({
      success: true,
      note: result.rows[0],
      message: 'Note created successfully'
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific note
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const noteResult = await pool.query(`
      SELECT n.*, t.name as topic_name, t.icon as topic_icon,
             f.original_name as file_name
      FROM notes n
      LEFT JOIN topics t ON n.topic_id = t.id
      LEFT JOIN files f ON n.file_id = f.id
      WHERE n.id = $1
    `, [id]);

    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({
      note: noteResult.rows[0]
    });
  } catch (error) {
    console.error('Error getting note:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update note
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      topic_id,
      note_type,
      tags
    } = req.body;

    const result = await pool.query(`
      UPDATE notes 
      SET title = $1, content = $2, topic_id = $3, note_type = $4, tags = $5
      WHERE id = $6 
      RETURNING *
    `, [title, content, topic_id, note_type, tags, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({
      success: true,
      note: result.rows[0],
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search notes
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    const result = await pool.query(`
      SELECT n.*, t.name as topic_name
      FROM notes n
      LEFT JOIN topics t ON n.topic_id = t.id
      WHERE (n.title ILIKE $1 OR n.content ILIKE $1)
        AND n.is_archived = false
      ORDER BY n.updated_at DESC
      LIMIT 20
    `, [`%${query}%`]);

    res.json({
      results: result.rows,
      query: query,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get note templates
router.get('/templates/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM note_templates
      ORDER BY is_default DESC, template_name ASC
    `);

    res.json({
      templates: result.rows
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tags
router.get('/tags/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tag_name, COUNT(*) as usage_count
      FROM notes, unnest(tags) as tag_name
      WHERE is_archived = false
      GROUP BY tag_name
      ORDER BY usage_count DESC, tag_name ASC
    `);

    res.json({
      tags: result.rows
    });
  } catch (error) {
    console.error('Error getting tags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM notes WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
