require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../data/pdfs');
fs.ensureDirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
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

// Routes

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      message: 'Local Study Planner Backend is running',
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
    const pageCount = 10; // Placeholder page count
    const metadata = {};

    const result = await pool.query(
      `INSERT INTO files (filename, original_name, file_path, topic_id, file_size, page_count, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.file.filename, req.file.originalname, req.file.path, 
       topic_id || null, req.file.size, pageCount, JSON.stringify(metadata)]
    );

    const fileData = result.rows[0];

    // Create initial reading progress entry
    await pool.query(
      'INSERT INTO reading_progress (file_id, total_pages) VALUES ($1, $2)',
      [fileData.id, pageCount]
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
    
    const filesResult = await pool.query('SELECT COUNT(*) as count FROM files');
    const topicsResult = await pool.query('SELECT COUNT(*) as count FROM topics');
    const pagesResult = await pool.query('SELECT COALESCE(SUM(page_count), 0) as total FROM files');
    
    stats.totalFiles = parseInt(filesResult.rows[0].count);
    stats.totalTopics = parseInt(topicsResult.rows[0].count);
    stats.totalPages = parseInt(pagesResult.rows[0].total);
    
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

// User progress routes
app.get('/api/user-progress/stats', async (req, res) => {
  try {
    res.json({
      total_xp: 0,
      current_level: 1,
      current_streak: 0,
      longest_streak: 0,
      daily_goal: 60,
      today_progress: {
        study_minutes: 0,
        pages_read: 0,
        xp_earned: 0
      }
    });
  } catch (error) {
    console.error('Error getting user progress stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stub routes for missing functionality
app.get('/api/achievements', (req, res) => {
  res.json({ achievements: [] });
});

app.get('/api/notes', (req, res) => {
  res.json({ notes: [] });
});

app.get('/api/analytics/overview', (req, res) => {
  res.json({ 
    overview: {
      total_sessions: 0,
      total_hours: 0,
      avg_session_minutes: 0,
      total_pages_read: 0
    }
  });
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

// Start server
const startServer = async () => {
  console.log(`🚀 Starting Local Study Planner Backend...`);
  
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to database. Please check PostgreSQL installation.');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Local Study Planner Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
};

process.on('SIGINT', async () => {
  console.log('\n🛑 Received interrupt signal. Shutting down...');
  await pool.end();
  process.exit(0);
});

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
