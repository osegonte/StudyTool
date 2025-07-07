const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const database = require('./database/init');
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
database.init().catch(console.error);

// Routes
app.use('/api/files', require('./routes/files'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/analytics', require('./routes/analytics'));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Study Planner API Phase 2 is running',
    version: '2.0.0',
    features: ['time-tracking', 'goals', 'analytics', 'topics']
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  database.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Study Planner API Phase 2 running on port ${PORT}`);
  console.log(`📁 PDF storage: ${path.join(__dirname, '../../data/pdfs')}`);
  console.log(`📊 Database: ${path.join(__dirname, '../../data/study-planner.db')}`);
});
