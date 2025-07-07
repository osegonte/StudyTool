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

// Routes
app.use('/api/files', require('./routes/files'));
app.use('/api/progress', require('./routes/progress'));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Study Planner API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Study Planner API running on port ${PORT}`);
  console.log(`📁 PDF storage: ${path.join(__dirname, '../../data/pdfs')}`);
});
