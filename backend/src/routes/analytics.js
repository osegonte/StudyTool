const express = require('express');
const router = express.Router();
const database = require('../database/init');

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Today's stats
    const todayStats = await database.query(
      'SELECT * FROM daily_stats WHERE date = ?',
      [today]
    );
    
    // Week's stats
    const weekStats = await database.query(
      'SELECT SUM(total_reading_time) as total_time, SUM(pages_read) as total_pages FROM daily_stats WHERE date >= ?',
      [weekAgo]
    );
    
    // Total files and average reading speed
    const totalFiles = await database.query('SELECT COUNT(*) as count FROM files');
    const avgSpeed = await database.query(
      'SELECT AVG(average_reading_speed) as avg_speed FROM reading_progress WHERE average_reading_speed > 0'
    );
    
    // Active goals
    const activeGoals = await database.query(
      'SELECT COUNT(*) as count FROM study_goals WHERE is_completed = FALSE'
    );

    res.json({
      today: {
        readingTime: todayStats.length > 0 ? todayStats[0].total_reading_time : 0,
        pagesRead: todayStats.length > 0 ? todayStats[0].pages_read : 0,
        sessions: todayStats.length > 0 ? todayStats[0].sessions_count : 0
      },
      week: {
        totalTime: weekStats.length > 0 ? weekStats[0].total_time || 0 : 0,
        totalPages: weekStats.length > 0 ? weekStats[0].total_pages || 0 : 0
      },
      overall: {
        totalFiles: totalFiles[0].count,
        averageSpeed: avgSpeed.length > 0 ? avgSpeed[0].avg_speed || 0 : 0,
        activeGoals: activeGoals[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get reading speed trends
router.get('/reading-speed', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const speedData = await database.query(`
      SELECT 
        DATE(s.start_time) as date,
        AVG(s.reading_speed) as avg_speed,
        COUNT(*) as sessions_count,
        SUM(s.pages_read) as total_pages
      FROM reading_sessions s
      WHERE DATE(s.start_time) >= ? AND s.reading_speed > 0
      GROUP BY DATE(s.start_time)
      ORDER BY date ASC
    `, [daysAgo]);

    res.json(speedData);
  } catch (error) {
    console.error('Error fetching reading speed data:', error);
    res.status(500).json({ error: 'Failed to fetch reading speed data' });
  }
});

// Get daily activity chart data
router.get('/daily-activity', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const activityData = await database.query(`
      SELECT 
        date,
        total_reading_time as readingTime,
        pages_read as pagesRead,
        sessions_count as sessions
      FROM daily_stats
      WHERE date >= ?
      ORDER BY date ASC
    `, [startDate]);

    res.json(activityData);
  } catch (error) {
    console.error('Error fetching daily activity:', error);
    res.status(500).json({ error: 'Failed to fetch daily activity data' });
  }
});

// Get topic distribution
router.get('/topics-distribution', async (req, res) => {
  try {
    const topicData = await database.query(`
      SELECT 
        t.name,
        t.color,
        COUNT(f.id) as file_count,
        COALESCE(SUM(rp.total_time_spent), 0) as total_time
      FROM topics t
      LEFT JOIN files f ON t.id = f.topic_id
      LEFT JOIN reading_progress rp ON f.id = rp.file_id
      GROUP BY t.id, t.name, t.color
      ORDER BY total_time DESC
    `);

    res.json(topicData);
  } catch (error) {
    console.error('Error fetching topic distribution:', error);
    res.status(500).json({ error: 'Failed to fetch topic distribution' });
  }
});

module.exports = router;
