const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for PDFs
app.use('/pdfs', express.static(path.join(__dirname, '../../data/pdfs')));

// Initialize database
let database;
try {
    database = require('./database/init');
    database.init().catch(console.error);
} catch (error) {
    console.error('Database initialization error:', error);
}

// Routes
app.use('/api/files', require('./routes/files'));
app.use('/api/progress', require('./routes/progress'));

// Phase 2 routes (with error handling)
try {
    app.use('/api/sessions', require('./routes/sessions'));
} catch (error) {
    console.error('Sessions route error:', error);
}

try {
    app.use('/api/goals', require('./routes/goals'));
} catch (error) {
    console.error('Goals route error:', error);
}

try {
    app.use('/api/analytics', require('./routes/analytics'));
} catch (error) {
    console.error('Analytics route error:', error);
}

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Study Planner API Phase 2 is running',
    version: '2.0.0',
    features: ['time-tracking', 'goals', 'analytics']
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  if (database) {
    database.close();
  }
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Study Planner API Phase 2 running on port ${PORT}`);
  console.log(`📁 PDF storage: ${path.join(__dirname, '../../data/pdfs')}`);
  console.log(`📊 Database: ${path.join(__dirname, '../../data/study-planner.db')}`);
});
