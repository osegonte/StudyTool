const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '../../../data/study-planner.db');
    this.db = null;
  }

  async init() {
    try {
      await fs.ensureDir(path.dirname(this.dbPath));
      
      return new Promise((resolve, reject) => {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            console.error('Error opening database:', err);
            reject(err);
          } else {
            console.log('📊 Database connected successfully');
            this.createTables().then(resolve).catch(reject);
          }
        });
      });
    } catch (error) {
      console.error('Database init error:', error);
      throw error;
    }
  }

  async createTables() {
    const schema = `
      CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY,
          original_name TEXT NOT NULL,
          filename TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          total_pages INTEGER,
          upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          deadline DATE,
          estimated_reading_time INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reading_sessions (
          id TEXT PRIMARY KEY,
          file_id TEXT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME,
          duration INTEGER,
          pages_read INTEGER DEFAULT 0,
          start_page INTEGER,
          end_page INTEGER,
          reading_speed REAL,
          session_type TEXT DEFAULT 'reading',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (file_id) REFERENCES files (id)
      );

      CREATE TABLE IF NOT EXISTS reading_progress (
          id TEXT PRIMARY KEY,
          file_id TEXT NOT NULL,
          current_page INTEGER DEFAULT 1,
          total_time_spent INTEGER DEFAULT 0,
          sessions_count INTEGER DEFAULT 0,
          average_reading_speed REAL,
          estimated_completion_time INTEGER,
          last_session_date DATETIME,
          completion_percentage REAL DEFAULT 0.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (file_id) REFERENCES files (id)
      );

      CREATE TABLE IF NOT EXISTS study_goals (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          target_type TEXT NOT NULL,
          target_value REAL NOT NULL,
          current_progress REAL DEFAULT 0.0,
          start_date DATE NOT NULL,
          end_date DATE,
          file_id TEXT,
          is_completed BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (file_id) REFERENCES files (id)
      );

      CREATE TABLE IF NOT EXISTS daily_stats (
          id TEXT PRIMARY KEY,
          date DATE NOT NULL,
          total_reading_time INTEGER DEFAULT 0,
          pages_read INTEGER DEFAULT 0,
          sessions_count INTEGER DEFAULT 0,
          files_worked_on INTEGER DEFAULT 0,
          average_reading_speed REAL,
          goals_met INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('📋 Database tables created successfully');
          resolve();
        }
      });
    });
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new Database();
