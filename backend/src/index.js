// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

// Import route modules
const topicsRouter = require('./routes/topics');
const filesRouter = require('./routes/files');
const studySessionsRouter = require('./routes/study-sessions');
const pageTrackingRouter = require('./routes/page-tracking');
const notesRouter = require('./routes/notes');
const bookmarksRouter = require('./routes/bookmarks');
const analyticsRouter = require('./routes/analytics');
const userProgressRouter = require('./routes/user-progress');
const goalsRouter = require('./routes/goals');

// Import services
const { startCleanupService } = require('./services/session-cleanup');
const { generateInsights } = require('./services/insights-generator');
const { updateSpacedRepetition } = require('./services/spaced-repetition');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server for Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Get current user for database connection
const currentUser = process.env.USER || process.env.USERNAME || 'postgres';

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'study_planner',
  user: process.env.DB_USER || currentUser,
  password: process.env.DB_PASSWORD || '',
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../data/pdfs');
const backupDir = path.join(__dirname, '../../data/backups');
const exportDir = path.join(__dirname, '../../data/exports');

fs.ensureDirSync(uploadDir);
fs.ensureDirSync(backupDir);
fs.ensureDirSync(exportDir);

// ================================
// MIDDLEWARE SETUP
// ================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Static file serving
app.use('/uploads', express.static(uploadDir, {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// ================================
// FILE UPLOAD CONFIGURATION
// ================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${fileId}${extension}`;
    cb(null, filename);
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
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB default
  }
});

// Make upload middleware available to routes
app.locals.upload = upload;

// ================================
// DATABASE CONNECTION TEST
// ================================

const testDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connected successfully');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].db_version.split(' ').slice(0, 2).join(' ')}`);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Make sure PostgreSQL is running and database exists');
    return false;
  }
};

// ================================
// API ROUTES
// ================================

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    const healthData = {
      status: 'healthy',
      message: 'SprintStudy Backend is running optimally',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: NODE_ENV,
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      features: {
        fileUpload: true,
        realTimeAnalytics: true,
        notifications: true,
        websocket: true
      }
    };

    res.json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API route registration
app.use('/api/topics', topicsRouter);
app.use('/api/files', filesRouter);
app.use('/api/study-sessions', studySessionsRouter);
app.use('/api/page-tracking', pageTrackingRouter);
app.use('/api/notes', notesRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/user-progress', userProgressRouter);
app.use('/api/goals', goalsRouter);

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = {};
    
    // Get file statistics
    const filesResult = await pool.query(`
      SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(page_count), 0) as total_pages,
        COALESCE(SUM(file_size), 0) as total_size
      FROM files
    `);
    
    const topicsResult = await pool.query('SELECT COUNT(*) as count FROM topics WHERE is_archived = false');
    
    // Get recent files with topic information
    const recentFilesResult = await pool.query(`
      SELECT 
        f.*,
        t.name as topic_name,
        t.color as topic_color,
        t.icon as topic_icon,
        rp.completion_percentage
      FROM files f 
      LEFT JOIN topics t ON f.topic_id = t.id 
      LEFT JOIN reading_progress rp ON f.id = rp.file_id
      ORDER BY f.created_at DESC 
      LIMIT 5
    `);

    // Get today's study statistics
    const todayStats = await pool.query(`
      SELECT 
        COALESCE(total_study_minutes, 0) as study_minutes,
        COALESCE(pages_read, 0) as pages_read,
        COALESCE(sessions_completed, 0) as sessions
      FROM daily_study_progress 
      WHERE date = CURRENT_DATE
    `);

    stats.totalFiles = parseInt(filesResult.rows[0].total_files);
    stats.totalTopics = parseInt(topicsResult.rows[0].count);
    stats.totalPages = parseInt(filesResult.rows[0].total_pages);
    stats.totalSize = parseInt(filesResult.rows[0].total_size);
    stats.recentFiles = recentFilesResult.rows;
    stats.todayStats = todayStats.rows[0] || { study_minutes: 0, pages_read: 0, sessions: 0 };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// User settings endpoints
app.get('/api/user-settings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT setting_category, setting_key, setting_value, setting_type 
      FROM user_settings 
      ORDER BY setting_category, setting_key
    `);
    
    const settings = {};
    result.rows.forEach(row => {
      if (!settings[row.setting_category]) {
        settings[row.setting_category] = {};
      }
      
      let value = row.setting_value;
      if (row.setting_type === 'boolean') {
        value = value === 'true';
      } else if (row.setting_type === 'integer') {
        value = parseInt(value);
      } else if (row.setting_type === 'json') {
        value = JSON.parse(value);
      }
      
      settings[row.setting_category][row.setting_key] = value;
    });
    
    res.json({ settings });
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/user-settings', async (req, res) => {
  try {
    const settings = req.body;
    
    for (const [category, categorySettings] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(categorySettings)) {
        const settingType = typeof value === 'boolean' ? 'boolean' :
                           typeof value === 'number' ? 'integer' :
                           typeof value === 'object' ? 'json' : 'string';
        
        const settingValue = settingType === 'json' ? JSON.stringify(value) : String(value);
        
        await pool.query(`
          INSERT INTO user_settings (setting_category, setting_key, setting_value, setting_type, is_user_modified)
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT (setting_category, setting_key) 
          DO UPDATE SET 
            setting_value = EXCLUDED.setting_value,
            setting_type = EXCLUDED.setting_type,
            is_user_modified = true,
            last_modified = CURRENT_TIMESTAMP
        `, [category, key, settingValue, settingType]);
      }
    }
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================
// WEBSOCKET REAL-TIME UPDATES
// ================================

io.on('connection', (socket) => {
  console.log(`📡 WebSocket client connected: ${socket.id}`);
  
  // Join analytics room for real-time updates
  socket.join('analytics');
  
  // Handle study session updates
  socket.on('session-update', (data) => {
    socket.to('analytics').emit('session-update', {
      type: 'session_update',
      session: data.session,
      todayMinutes: data.todayMinutes,
      todayPages: data.todayPages,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle session completion
  socket.on('session-complete', (data) => {
    socket.to('analytics').emit('session-complete', {
      type: 'session_complete',
      session: data.session,
      stats: data.stats,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle page tracking
  socket.on('page-change', (data) => {
    socket.to('analytics').emit('page-change', {
      type: 'page_change',
      fileId: data.fileId,
      fromPage: data.fromPage,
      toPage: data.toPage,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log(`📡 WebSocket client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.locals.io = io;

// ================================
// ERROR HANDLING MIDDLEWARE
// ================================

// Multer error handling
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large', 
        message: `Maximum file size is ${process.env.MAX_FILE_SIZE || '100MB'}` 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files', 
        message: 'Only one file can be uploaded at a time' 
      });
    }
  }
  next(error);
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  // Don't leak error details in production
  const isDevelopment = NODE_ENV === 'development';
  
  res.status(error.status || 500).json