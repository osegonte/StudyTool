require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../data/pdfs')));

// Get current user for database connection
const currentUser = process.env.USER || process.env.USERNAME || 'postgres';

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'study_planner',
  user: process.env.DB_USER || currentUser,
  password: process.env.DB_PASSWORD || '',
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Error connecting to PostgreSQL database:', err.message);
    return false;
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create UUID extension if not exists
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create basic tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        icon VARCHAR(10) DEFAULT '📚',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
        file_size BIGINT,
        page_count INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}'::jsonb,
        is_favorite BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reading_progress (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
        current_page INTEGER DEFAULT 1,
        total_pages INTEGER DEFAULT 0,
        progress_percentage DECIMAL(5,2) DEFAULT 0,
        time_spent INTEGER DEFAULT 0,
        last_read TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        bookmarks JSONB DEFAULT '[]'::jsonb,
        notes TEXT,
        current_page_start_time TIMESTAMP,
        total_reading_time_seconds INTEGER DEFAULT 0,
        pages_read_count INTEGER DEFAULT 0,
        current_session_id UUID,
        last_session_start TIMESTAMP,
        total_study_time_seconds INTEGER DEFAULT 0,
        session_count INTEGER DEFAULT 0
      )
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_files_topic_id ON files(topic_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reading_progress_file_id ON reading_progress(file_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC)');

    console.log('📊 PostgreSQL database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    return false;
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../data/pdfs');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${fileId}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      message: 'Study Planner Backend is running',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL connected',
      user: currentUser
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Topics routes
app.get('/api/topics', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM topics ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting topics:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/topics', async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO topics (name, description, color, icon) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, color || '#3B82F6', icon || '📚']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// Files routes
app.get('/api/files', async (req, res) => {
  try {
    const query = `
      SELECT f.*, t.name as topic_name, t.color as topic_color, t.icon as topic_icon
      FROM files f
      LEFT JOIN topics t ON f.topic_id = t.id
      ORDER BY f.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { topic_id } = req.body;
    
    // Extract PDF metadata
    const pdfBuffer = await fs.readFile(req.file.path);
    let pdfData;
    try {
      pdfData = await pdfParse(pdfBuffer);
    } catch (error) {
      console.warn('Could not parse PDF metadata:', error.message);
      pdfData = { numpages: 0, info: {} };
    }

    const result = await pool.query(
      `INSERT INTO files (filename, original_name, file_path, topic_id, file_size, page_count, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.file.filename, req.file.originalname, req.file.path, 
       topic_id || null, req.file.size, pdfData.numpages || 0, JSON.stringify(pdfData.info || {})]
    );

    const fileData = result.rows[0];

    // Create initial reading progress entry
    await pool.query(
      'INSERT INTO reading_progress (file_id, total_pages) VALUES ($1, $2)',
      [fileData.id, pdfData.numpages || 0]
    );

    res.json({
      message: 'File uploaded successfully',
      file: fileData
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/:id/metadata', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting file metadata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = {};
    
    // Get total counts
    const filesResult = await pool.query('SELECT COUNT(*) as count FROM files');
    const topicsResult = await pool.query('SELECT COUNT(*) as count FROM topics');
    const pagesResult = await pool.query('SELECT COALESCE(SUM(page_count), 0) as total FROM files');
    
    stats.totalFiles = parseInt(filesResult.rows[0].count);
    stats.totalTopics = parseInt(topicsResult.rows[0].count);
    stats.totalPages = parseInt(pagesResult.rows[0].total);
    
    // Get recent files
    const recentFilesResult = await pool.query(`
      SELECT f.*, t.name as topic_name, t.color as topic_color 
      FROM files f 
      LEFT JOIN topics t ON f.topic_id = t.id 
      ORDER BY f.created_at DESC 
      LIMIT 5
    `);
    stats.recentFiles = recentFilesResult.rows;
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple user progress endpoint
app.get('/api/user-progress/stats', async (req, res) => {
  try {
    const stats = {
      total_xp: 0,
      current_level: 1,
      current_streak: 0,
      daily_goal: 60,
      today_progress: {
        study_minutes: 0,
        pages_read: 0,
        xp_earned: 0
      }
    };
    res.json(stats);
  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
    }
  }
  console.error('Unhandled error:', error);
  res.status(500).json({ error: error.message });
});

// Initialize and start server
const startServer = async () => {
  console.log(`🚀 Starting Study Planner Backend...`);
  console.log(`👤 Database user: ${currentUser}`);
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to database. Please check PostgreSQL installation.');
    process.exit(1);
  }
  
  // Initialize database
  const initialized = await initializeDatabase();
  if (!initialized) {
    console.error('❌ Cannot initialize database. Continuing anyway...');
  }
  
  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Study Planner Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🐘 Database: PostgreSQL (user: ${currentUser})`);
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
