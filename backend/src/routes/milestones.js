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

// Initialize milestones
router.post('/init', async (req, res) => {
  try {
    const milestones = [
      {
        milestone_key: 'first_hour',
        title: 'First Hour Milestone',
        description: 'Completed your first hour of studying',
        celebration_message: '🎉 You\'ve completed your first hour of focused study!',
        trigger_condition: JSON.stringify({ total_hours: 1 }),
        xp_bonus: 100,
        icon: '⏰'
      },
      {
        milestone_key: 'page_master',
        title: 'Page Master',
        description: 'Read 50 pages in total',
        celebration_message: '📚 You\'ve read 50 pages! Knowledge is building up!',
        trigger_condition: JSON.stringify({ total_pages: 50 }),
        xp_bonus: 150,
        icon: '📖'
      },
      {
        milestone_key: 'streak_champion',
        title: 'Streak Champion',
        description: 'Maintained a 5-day study streak',
        celebration_message: '🔥 5 days in a row! You\'re on fire!',
        trigger_condition: JSON.stringify({ streak_days: 5 }),
        xp_bonus: 250,
        icon: '🔥'
      }
    ];

    for (const milestone of milestones) {
      await pool.query(
        `INSERT INTO study_milestones 
         (milestone_key, title, description, celebration_message, trigger_condition, xp_bonus, icon) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (milestone_key) DO NOTHING`,
        [milestone.milestone_key, milestone.title, milestone.description, 
         milestone.celebration_message, milestone.trigger_condition, milestone.xp_bonus, milestone.icon]
      );
    }

    res.json({ success: true, message: 'Milestones initialized' });
  } catch (error) {
    console.error('Error initializing milestones:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check for triggered milestones
router.post('/check', async (req, res) => {
  try {
    const { progress_data } = req.body;
    
    const triggeredMilestones = [];
    
    // Get all milestones
    const milestones = await pool.query('SELECT * FROM study_milestones');
    
    for (const milestone of milestones.rows) {
      const condition = JSON.parse(milestone.trigger_condition);
      let shouldTrigger = false;
      
      // Check if milestone was already triggered recently (within 24 hours)
      const recentTrigger = await pool.query(
        'SELECT id FROM study_milestones WHERE milestone_key = $1 AND last_triggered > $2',
        [milestone.milestone_key, new Date(Date.now() - 24 * 60 * 60 * 1000)]
      );
      
      if (recentTrigger.rows.length > 0) continue;
      
      // Check trigger conditions
      if (condition.total_hours && progress_data.total_hours >= condition.total_hours) {
        shouldTrigger = true;
      }
      if (condition.total_pages && progress_data.total_pages >= condition.total_pages) {
        shouldTrigger = true;
      }
      if (condition.streak_days && progress_data.current_streak >= condition.streak_days) {
        shouldTrigger = true;
      }
      
      if (shouldTrigger) {
        await pool.query(
          'UPDATE study_milestones SET last_triggered = CURRENT_TIMESTAMP, times_triggered = times_triggered + 1 WHERE id = $1',
          [milestone.id]
        );
        triggeredMilestones.push(milestone);
      }
    }
    
    res.json({ triggered_milestones: triggeredMilestones });
  } catch (error) {
    console.error('Error checking milestones:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
