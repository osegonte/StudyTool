// backend/src/routes/study-sessions.js
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

// Start a new study session
router.post('/start', async (req, res) => {
  try {
    const { file_id, start_page = 1, session_type = 'reading', session_goal } = req.body;
    
    // End any existing active sessions for this file
    await pool.query(
      `UPDATE study_sessions 
       SET session_end = CURRENT_TIMESTAMP, 
           is_active = false,
           total_duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - session_start))::INTEGER
       WHERE file_id = $1 AND is_active = true`,
      [file_id]
    );
    
    // Create new session
    const result = await pool.query(
      `INSERT INTO study_sessions (file_id, start_page, session_type, session_goal) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [file_id, start_page, session_type, session_goal]
    );
    
    const session = result.rows[0];
    
    // Update reading progress
    await pool.query(
      `UPDATE reading_progress 
       SET current_session_id = $1, last_session_start = CURRENT_TIMESTAMP 
       WHERE file_id = $2`,
      [session.id, file_id]
    );
    
    res.json({ 
      success: true, 
      session,
      message: 'Study session started successfully' 
    });
    
  } catch (error) {
    console.error('Error starting study session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pause/Resume a study session
router.post('/:sessionId/pause', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { pause_reason = 'manual' } = req.body;
    
    // Check if session is currently active
    const sessionResult = await pool.query(
      'SELECT * FROM study_sessions WHERE id = $1',
      [sessionId]
    );
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = sessionResult.rows[0];
    
    if (session.is_active) {
      // Pause the session
      await pool.query(
        `INSERT INTO session_pauses (session_id, pause_reason) 
         VALUES ($1, $2)`,
        [sessionId, pause_reason]
      );
      
      await pool.query(
        'UPDATE study_sessions SET is_active = false WHERE id = $1',
        [sessionId]
      );
      
      res.json({ success: true, message: 'Session paused' });
    } else {
      // Resume the session
      await pool.query(
        `UPDATE session_pauses 
         SET pause_end = CURRENT_TIMESTAMP,
             pause_duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - pause_start))::INTEGER
         WHERE session_id = $1 AND pause_end IS NULL`,
        [sessionId]
      );
      
      await pool.query(
        'UPDATE study_sessions SET is_active = true WHERE id = $1',
        [sessionId]
      );
      
      res.json({ success: true, message: 'Session resumed' });
    }
    
  } catch (error) {
    console.error('Error pausing/resuming session:', error);
    res.status(500).json({ error: error.message });
  }
});

// End a study session
router.post('/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { 
      end_page, 
      focus_rating, 
      distractions_count = 0, 
      notes, 
      goal_achieved = false 
    } = req.body;
    
    // Calculate session statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT spa.page_number) as pages_covered,
        SUM(spa.duration_seconds) as total_page_time,
        COUNT(sp.id) as pause_count,
        COALESCE(SUM(sp.pause_duration_seconds), 0) as total_pause_time
      FROM study_sessions ss
      LEFT JOIN session_page_activity spa ON ss.id = spa.session_id
      LEFT JOIN session_pauses sp ON ss.id = sp.session_id
      WHERE ss.id = $1
    `, [sessionId]);
    
    const stats = statsResult.rows[0];
    const totalDuration = Math.floor((new Date() - new Date()) / 1000); // This would be calculated properly
    const activeDuration = totalDuration - (stats.total_pause_time || 0);
    
    // End the session
    const result = await pool.query(
      `UPDATE study_sessions 
       SET session_end = CURRENT_TIMESTAMP,
           is_active = false,
           total_duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - session_start))::INTEGER,
           active_duration_seconds = $1,
           pages_covered = $2,
           end_page = $3,
           focus_rating = $4,
           distractions_count = $5,
           notes = $6,
           goal_achieved = $7,
           interruptions_count = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 
       RETURNING *`,
      [activeDuration, stats.pages_covered, end_page, focus_rating, 
       distractions_count, notes, goal_achieved, stats.pause_count, sessionId]
    );
    
    // Clear current session from reading progress
    await pool.query(
      'UPDATE reading_progress SET current_session_id = NULL WHERE current_session_id = $1',
      [sessionId]
    );
    
    // Create reading analytics entry
    if (stats.pages_covered > 0) {
      await pool.query(
        `INSERT INTO reading_analytics 
         (file_id, session_id, date, page_number, time_spent_seconds, reading_speed_wpm, comprehension_rating)
         SELECT $1, $2, CURRENT_DATE, spa.page_number, spa.duration_seconds, spa.reading_speed_wpm, $3
         FROM session_page_activity spa
         WHERE spa.session_id = $2`,
        [result.rows[0].file_id, sessionId, focus_rating]
      );
    }
    
    res.json({ 
      success: true, 
      session: result.rows[0],
      stats: stats,
      message: 'Study session completed successfully' 
    });
    
  } catch (error) {
    console.error('Error ending study session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update session progress (for real-time updates)
router.put('/:sessionId/progress', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { 
      pages_covered, 
      focus_rating, 
      distractions_count, 
      notes,
      pomodoro_cycles 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE study_sessions 
       SET pages_covered = $1,
           focus_rating = $2,
           distractions_count = $3,
           notes = $4,
           pomodoro_cycles = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING *`,
      [pages_covered, focus_rating, distractions_count, notes, pomodoro_cycles, sessionId]
    );
    
    res.json({ 
      success: true, 
      session: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Error updating session progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session statistics
router.get('/stats/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { days = 30 } = req.query;
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(total_duration_seconds) / 3600.0 as total_hours,
        AVG(total_duration_seconds) / 60.0 as avg_session_minutes,
        SUM(pages_covered) as total_pages_read,
        AVG(focus_rating) as avg_focus_rating,
        SUM(distractions_count) as total_distractions,
        COUNT(*) FILTER (WHERE session_end >= CURRENT_DATE - INTERVAL '${days} days') as recent_sessions,
        MAX(total_duration_seconds) / 60.0 as longest_session_minutes
      FROM study_sessions 
      WHERE file_id = $1 AND session_end IS NOT NULL
    `, [fileId]);
    
    const recentSessions = await pool.query(`
      SELECT 
        id,
        session_start,
        session_end,
        total_duration_seconds,
        pages_covered,
        focus_rating,
        session_type
      FROM study_sessions 
      WHERE file_id = $1 AND session_end IS NOT NULL
      ORDER BY session_start DESC 
      LIMIT 10
    `, [fileId]);
    
    res.json({
      stats: stats.rows[0],
      recent_sessions: recentSessions.rows
    });
    
  } catch (error) {
    console.error('Error getting session stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current active session
router.get('/current/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        ss.*,
        EXTRACT(epoch FROM (CURRENT_TIMESTAMP - ss.session_start))::INTEGER as current_duration_seconds,
        COUNT(DISTINCT spa.page_number) as pages_visited
      FROM study_sessions ss
      LEFT JOIN session_page_activity spa ON ss.id = spa.session_id
      WHERE ss.file_id = $1 AND ss.is_active = true
      GROUP BY ss.id
      ORDER BY ss.session_start DESC
      LIMIT 1
    `, [fileId]);
    
    if (result.rows.length === 0) {
      return res.json({ 
        active_session: null,
        message: 'No active session' 
      });
    }
    
    res.json({ 
      active_session: result.rows[0],
      message: 'Active session found' 
    });
    
  } catch (error) {
    console.error('Error getting current session:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// backend/src/routes/page-tracking.js
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

// Start tracking a page
router.post('/start', async (req, res) => {
  try {
    const { session_id, file_id, page_number } = req.body;
    
    // End any existing page tracking for this session
    await pool.query(
      `UPDATE session_page_activity 
       SET page_exit_time = CURRENT_TIMESTAMP,
           duration_seconds = EXTRACT(epoch FROM (CURRENT_TIMESTAMP - page_enter_time))::INTEGER
       WHERE session_id = $1 AND page_exit_time IS NULL`,
      [session_id]
    );
    
    // Start new page tracking
    const result = await pool.query(
      `INSERT INTO session_page_activity (session_id, page_number) 
       VALUES ($1, $2) 
       RETURNING *`,
      [session_id, page_number]
    );
    
    res.json({ 
      success: true, 
      tracking: result.rows[0],
      message: `Started tracking page ${page_number}` 
    });
    
  } catch (error) {
    console.error('Error starting page tracking:', error);
    res.status(500).json({ error: error.message });
  }
});

// End tracking for current page
router.post('/end', async (req, res) => {
  try {
    const { session_id, page_number, time_spent_seconds, comprehension_rating } = req.body;
    
    const result = await pool.query(
      `UPDATE session_page_activity 
       SET page_exit_time = CURRENT_TIMESTAMP,
           duration_seconds = COALESCE($1, EXTRACT(epoch FROM (CURRENT_TIMESTAMP - page_enter_time))::INTEGER),
           comprehension_rating = $2
       WHERE session_id = $3 AND page_number = $4 AND page_exit_time IS NULL 
       RETURNING *`,
      [time_spent_seconds, comprehension_rating, session_id, page_number]
    );
    
    res.json({ 
      success: true, 
      tracking: result.rows[0],
      message: 'Page tracking ended' 
    });
    
  } catch (error) {
    console.error('Error ending page tracking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get page statistics for a file
router.get('/stats/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const pageStats = await pool.query(`
      SELECT 
        spa.page_number,
        COUNT(*) as view_count,
        SUM(spa.duration_seconds) as total_time_seconds,
        AVG(spa.duration_seconds) as avg_time_seconds,
        AVG(spa.reading_speed_wpm) as avg_reading_speed,
        AVG(spa.comprehension_rating) as avg_comprehension
      FROM session_page_activity spa
      JOIN study_sessions ss ON spa.session_id = ss.id
      WHERE ss.file_id = $1 AND spa.duration_seconds > 0
      GROUP BY spa.page_number 
      ORDER BY spa.page_number
    `, [fileId]);
    
    const overallStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT spa.page_number) as unique_pages_viewed,
        SUM(spa.duration_seconds) as total_reading_time_seconds,
        AVG(spa.duration_seconds) as avg_time_per_page,
        AVG(spa.reading_speed_wpm) as avg_reading_speed,
        COUNT(*) as total_page_views
      FROM session_page_activity spa
      JOIN study_sessions ss ON spa.session_id = ss.id
      WHERE ss.file_id = $1 AND spa.duration_seconds > 0
    `, [fileId]);
    
    res.json({
      page_stats: pageStats.rows,
      overall_stats: overallStats.rows[0] || {},
      reading_insights: {
        pages_per_minute: overallStats.rows[0]?.avg_time_per_page ? 
          Math.round(60 / overallStats.rows[0].avg_time_per_page * 100) / 100 : 0
      }
    });
    
  } catch (error) {
    console.error('Error getting page stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// backend/src/routes/notes.js
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

// Get notes with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      file_id, 
      topic_id, 
      page, 
      search, 
      tags, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let whereConditions = ['n.is_archived = false'];
    let queryParams = [];
    let paramCount = 0;
    
    if (file_id) {
      paramCount++;
      whereConditions.push(`n.file_id = ${paramCount}`);
      queryParams.push(file_id);
    }
    
    if (topic_id) {
      paramCount++;
      whereConditions.push(`n.topic_id = ${paramCount}`);
      queryParams.push(topic_id);
    }
    
    if (page) {
      paramCount++;
      whereConditions.push(`n.page_reference = ${paramCount}`);
      queryParams.push(parseInt(page));
    }
    
    if (search) {
      paramCount++;
      whereConditions.push(`n.search_vector @@ plainto_tsquery('english', ${paramCount})`);
      queryParams.push(search);
    }
    
    if (tags) {
      paramCount++;
      whereConditions.push(`n.tags && ${paramCount}`);
      queryParams.push(tags.split(','));
    }
    
    const whereClause = whereConditions.length > 0 ? 
      'WHERE ' + whereConditions.join(' AND ') : '';
    
    paramCount++;
    queryParams.push(parseInt(limit));
    paramCount++;
    queryParams.push(parseInt(offset));
    
    const query = `
      SELECT 
        n.*,
        f.original_name as file_name,
        t.name as topic_name,
        COUNT(nl.id) as link_count
      FROM notes n
      LEFT JOIN files f ON n.file_id = f.id
      LEFT JOIN topics t ON n.topic_id = t.id
      LEFT JOIN note_links nl ON n.id = nl.source_note_id OR n.id = nl.target_note_id
      ${whereClause}
      GROUP BY n.id, f.original_name, t.name
      ORDER BY n.updated_at DESC
      LIMIT ${paramCount - 1} OFFSET ${paramCount}
    `;
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      notes: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Error getting notes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new note
router.post('/', async (req, res) => {
  try {
    const {
      title,
      content,
      note_type = 'study',
      file_id,
      topic_id,
      page_reference,
      tags = [],
      page_anchor_data = {}
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO notes 
       (title, content, note_type, file_id, topic_id, page_reference, tags, page_anchor_data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [title, content, note_type, file_id, topic_id, page_reference, tags, JSON.stringify(page_anchor_data)]
    );
    
    const note = result.rows[0];
    
    // Create PDF anchor if page reference exists
    if (file_id && page_reference) {
      await pool.query(
        `INSERT INTO note_pdf_anchors (note_id, file_id, page_number, anchor_type, selection_data)
         VALUES ($1, $2, $3, 'note', $4)`,
        [note.id, file_id, page_reference, JSON.stringify(page_anchor_data)]
      );
    }
    
    res.json({
      success: true,
      note: note,
      message: 'Note created successfully'
    });
    
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a note
router.put('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const {
      title,
      content,
      note_type,
      tags,
      page_reference,
      page_anchor_data
    } = req.body;
    
    const result = await pool.query(
      `UPDATE notes 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           note_type = COALESCE($3, note_type),
           tags = COALESCE($4, tags),
           page_reference = COALESCE($5, page_reference),
           page_anchor_data = COALESCE($6, page_anchor_data),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING *`,
      [title, content, note_type, tags, page_reference, 
       page_anchor_data ? JSON.stringify(page_anchor_data) : null, noteId]
    );
    
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

// Delete a note
router.delete('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    
    // Delete note links first
    await pool.query(
      'DELETE FROM note_links WHERE source_note_id = $1 OR target_note_id = $1',
      [noteId]
    );
    
    // Delete PDF anchors
    await pool.query(
      'DELETE FROM note_pdf_anchors WHERE note_id = $1',
      [noteId]
    );
    
    // Delete the note
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 RETURNING *',
      [noteId]
    );
    
    if (result.rows.length === 0) {
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

// Get linked notes
router.get('/:noteId/links', async (req, res) => {
  try {
    const { noteId } = req.params;
    
    // Get notes this note links to
    const linkedNotes = await pool.query(`
      SELECT n.*, nl.link_type, nl.link_text
      FROM note_links nl
      JOIN notes n ON nl.target_note_id = n.id
      WHERE nl.source_note_id = $1
      ORDER BY nl.created_at DESC
    `, [noteId]);
    
    // Get notes that link to this note (backlinks)
    const backlinks = await pool.query(`
      SELECT n.*, nl.link_type, nl.link_text
      FROM note_links nl
      JOIN notes n ON nl.source_note_id = n.id
      WHERE nl.target_note_id = $1
      ORDER BY nl.created_at DESC
    `, [noteId]);
    
    res.json({
      linked: linkedNotes.rows,
      backlinks: backlinks.rows
    });
    
  } catch (error) {
    console.error('Error getting note links:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create note link
router.post('/links', async (req, res) => {
  try {
    const {
      source_note_id,
      target_note_id,
      target_title,
      link_type = 'reference',
      link_text
    } = req.body;
    
    // If target_title is provided but no target_note_id, try to find the note
    let actualTargetId = target_note_id;
    if (!target_note_id && target_title) {
      const targetResult = await pool.query(
        'SELECT id FROM notes WHERE title ILIKE $1 LIMIT 1',
        [`%${target_title}%`]
      );
      
      if (targetResult.rows.length > 0) {
        actualTargetId = targetResult.rows[0].id;
      }
    }
    
    const result = await pool.query(
      `INSERT INTO note_links 
       (source_note_id, target_note_id, target_title, link_type, link_text) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (source_note_id, target_note_id) DO NOTHING
       RETURNING *`,
      [source_note_id, actualTargetId, target_title, link_type, link_text]
    );
    
    res.json({
      success: true,
      link: result.rows[0],
      message: 'Note link created successfully'
    });
    
  } catch (error) {
    console.error('Error creating note link:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tags
router.get('/tags', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT unnest(tags) as tag, COUNT(*) as usage_count
      FROM notes 
      WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
      GROUP BY tag
      ORDER BY usage_count DESC, tag ASC
    `);
    
    res.json({
      tags: result.rows.map(row => row.tag)
    });
    
  } catch (error) {
    console.error('Error getting tags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search notes
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.json({ notes: [] });
    }
    
    const result = await pool.query(`
      SELECT 
        n.*,
        f.original_name as file_name,
        t.name as topic_name,
        ts_rank(n.search_vector, plainto_tsquery('english', $1)) as rank,
        ts_headline('english', n.content, plainto_tsquery('english', $1)) as snippet
      FROM notes n
      LEFT JOIN files f ON n.file_id = f.id
      LEFT JOIN topics t ON n.topic_id = t.id
      WHERE n.search_vector @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT $2
    `, [q, limit]);
    
    res.json({
      notes: result.rows,
      query: q
    });
    
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;