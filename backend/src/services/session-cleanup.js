// Automatic session cleanup service
const { Pool } = require('pg');

const currentUser = process.env.USER || process.env.USERNAME || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'study_planner',
  user: process.env.DB_USER || currentUser,
  password: process.env.DB_PASSWORD || '',
  ssl: false,
});

// Run cleanup every 10 minutes
const startCleanupService = () => {
  setInterval(async () => {
    try {
      await pool.query('SELECT auto_end_inactive_sessions()');
      console.log('🧹 Cleaned up inactive sessions');
    } catch (error) {
      console.error('Error in session cleanup:', error);
    }
  }, 10 * 60 * 1000); // 10 minutes
};

module.exports = { startCleanupService };
