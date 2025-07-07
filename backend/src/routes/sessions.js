const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const database = require('../database/init');

// Start a new reading session
router.post('/start', async (req, res) => {
  try {
    const { fileId, startPage } = req.body;
    const sessionId = uuidv4();
    
    const session = {
      id: sessionId,
      file_id: fileId,
      start_time: new Date().toISOString(),
      start_page: startPage || 1,
      session_type: 'reading'
    };

    await database.run(
      `INSERT INTO reading_sessions (id, file_id, start_time, start_page, session_type)
       VALUES (?, ?, ?, ?, ?)`,
      [session.id, session.file_id, session.start_time, session.start_page, session.session_type]
    );

    res.json({ 
      success: true, 
      sessionId,
      message: 'Reading session started' 
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// End reading session
router.post('/end/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { endPage, notes } = req.body;
    const endTime = new Date().toISOString();

    // Get session start time
    const session = await database.query(
      'SELECT * FROM reading_sessions WHERE id = ?',
      [sessionId]
    );

    if (session.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const startTime = new Date(session[0].start_time);
    const duration = Math.floor((new Date(endTime) - startTime) / 1000);
    const pagesRead = Math.max(0, (endPage || session[0].start_page) - session[0].start_page + 1);
    const readingSpeed = duration > 0 ? (pagesRead / (duration / 60)) : 0;

    await database.run(
      `UPDATE reading_sessions 
       SET end_time = ?, duration = ?, end_page = ?, pages_read = ?, 
           reading_speed = ?, notes = ?
       WHERE id = ?`,
      [endTime, duration, endPage, pagesRead, readingSpeed, notes, sessionId]
    );

    // Update reading progress
    await updateReadingProgress(session[0].file_id, endPage, duration, readingSpeed);

    // Update daily stats
    await updateDailyStats(new Date().toISOString().split('T')[0], duration, pagesRead);

    res.json({ 
      success: true, 
      duration,
      pagesRead,
      readingSpeed,
      message: 'Session ended successfully' 
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get session history for a file
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const sessions = await database.query(
      `SELECT * FROM reading_sessions 
       WHERE file_id = ? 
       ORDER BY start_time DESC`,
      [fileId]
    );

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get all sessions for analytics
router.get('/all', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM reading_sessions WHERE 1=1';
    let params = [];

    if (startDate) {
      query += ' AND DATE(start_time) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(start_time) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY start_time DESC';

    const sessions = await database.query(query, params);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching all sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Helper function to update reading progress
async function updateReadingProgress(fileId, currentPage, sessionDuration, readingSpeed) {
  try {
    const existing = await database.query(
      'SELECT * FROM reading_progress WHERE file_id = ?',
      [fileId]
    );

    if (existing.length === 0) {
      await database.run(
        `INSERT INTO reading_progress 
         (id, file_id, current_page, total_time_spent, sessions_count, 
          average_reading_speed, last_session_date, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
        [uuidv4(), fileId, currentPage, sessionDuration, readingSpeed, 
         new Date().toISOString(), new Date().toISOString()]
      );
    } else {
      const progress = existing[0];
      const newTotalTime = progress.total_time_spent + sessionDuration;
      const newSessionCount = progress.sessions_count + 1;
      const newAvgSpeed = ((progress.average_reading_speed * progress.sessions_count) + readingSpeed) / newSessionCount;

      await database.run(
        `UPDATE reading_progress 
         SET current_page = ?, total_time_spent = ?, sessions_count = ?,
             average_reading_speed = ?, last_session_date = ?, updated_at = ?
         WHERE file_id = ?`,
        [currentPage, newTotalTime, newSessionCount, newAvgSpeed,
         new Date().toISOString(), new Date().toISOString(), fileId]
      );
    }
  } catch (error) {
    console.error('Error updating reading progress:', error);
  }
}

// Helper function to update daily stats
async function updateDailyStats(date, duration, pagesRead) {
  try {
    const existing = await database.query(
      'SELECT * FROM daily_stats WHERE date = ?',
      [date]
    );

    if (existing.length === 0) {
      await database.run(
        `INSERT INTO daily_stats 
         (id, date, total_reading_time, pages_read, sessions_count, files_worked_on)
         VALUES (?, ?, ?, ?, 1, 1)`,
        [uuidv4(), date, duration, pagesRead]
      );
    } else {
      const stats = existing[0];
      await database.run(
        `UPDATE daily_stats 
         SET total_reading_time = ?, pages_read = ?, sessions_count = ?
         WHERE date = ?`,
        [stats.total_reading_time + duration, 
         stats.pages_read + pagesRead,
         stats.sessions_count + 1,
         date]
      );
    }
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
}

module.exports = router;
