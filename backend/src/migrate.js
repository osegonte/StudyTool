const fs = require('fs-extra');
const path = require('path');
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

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Create extensions
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension created');
    
    // Read and execute all migration files in order
    const migrationDir = path.join(__dirname, '../migrations');
    
    // Ensure migration directory exists
    await fs.ensureDir(migrationDir);
    
    const files = await fs.readdir(migrationDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    for (const file of sqlFiles) {
      console.log(`📄 Executing migration: ${file}`);
      const content = await fs.readFile(path.join(migrationDir, file), 'utf8');
      await pool.query(content);
      console.log(`✅ Completed: ${file}`);
    }
    
    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
