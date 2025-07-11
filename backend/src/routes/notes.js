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

// Get all notes with filters
router.get('/', async (req, res) => {
  try {
    const { search, topic_id, tag, note_type, file_id } = req.query;
    
    let query = `
      SELECT n.*, t.name as topic_name, t.icon as topic_icon, t.color as topic_color,
             f.original_name as file_name,
             array_length(string_to_array(n.content, ' '), 1) as word_count,
             (SELECT COUNT(*) FROM note_links nl WHERE nl.target_note_id = n.id) as backlink_count
      FROM notes n
      LEFT JOIN topics t ON n.topic_id = t.id
      LEFT JOIN files f ON n.file_id = f.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      query += ` AND (n.title ILIKE $${paramCount} OR n.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
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
    
    if (file_id) {
      paramCount++;
      query += ` AND n.file_id = $${paramCount}`;
      params.push(file_id);
    }
    
    if (tag) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(n.tags)`;
      params.push(tag);
    }
    
    query += ` ORDER BY n.updated_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ notes: result.rows });
  } catch (error) {
    console.error('Error getting notes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new note
router.post('/', async (req, res) => {
  try {
    const { title, content, topic_id, note_type = 'general', tags = [], file_id } = req.body;
    
    const result = await pool.query(
      `INSERT INTO notes (title, content, topic_id, note_type, tags, file_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, content, topic_id || null, note_type, tags, file_id || null]
    );
    
    res.json({ success: true, note: result.rows[0] });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific note
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get note details
    const noteResult = await pool.query(`
      SELECT n.*, t.name as topic_name, t.icon as topic_icon, t.color as topic_color
      FROM notes n
      LEFT JOIN topics t ON n.topic_id = t.id
      WHERE n.id = $1
    `, [id]);
    
    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Get linked notes
    const linkedNotesResult = await pool.query(`
      SELECT n.id, n.title
      FROM note_links nl
      JOIN notes n ON nl.target_note_id = n.id
      WHERE nl.source_note_id = $1
    `, [id]);
    
    res.json({ 
      note: noteResult.rows[0],
      linked_notes: linkedNotesResult.rows
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
    const { title, content, topic_id, note_type, tags } = req.body;
    
    const result = await pool.query(
      `UPDATE notes 
       SET title = $1, content = $2, topic_id = $3, note_type = $4, tags = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [title, content, topic_id || null, note_type, tags, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ success: true, note: result.rows[0] });
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
      SELECT id, title, content, note_type, tags
      FROM notes 
      WHERE title ILIKE $1 OR content ILIKE $1
      ORDER BY 
        CASE 
          WHEN title ILIKE $1 THEN 1 
          ELSE 2 
        END,
        updated_at DESC
      LIMIT 10
    `, [`%${query}%`]);
    
    res.json({ results: result.rows });
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tag list
router.get('/tags/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tag_name, COUNT(*) as usage_count
      FROM (
        SELECT unnest(tags) as tag_name
        FROM notes
      ) tag_counts
      GROUP BY tag_name
      ORDER BY usage_count DESC, tag_name
    `);
    
    res.json({ tags: result.rows });
  } catch (error) {
    console.error('Error getting tags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create PDF anchor for note
router.post('/:id/pdf-anchor', async (req, res) => {
  try {
    const { id } = req.params;
    const { file_id, page_number, anchor_text, position_data } = req.body;
    
    await pool.query(
      `INSERT INTO note_pdf_anchors (note_id, file_id, page_number, anchor_text, position_data) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id, file_id, page_number, anchor_text, JSON.stringify(position_data)]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating PDF anchor:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
