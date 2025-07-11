const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const pdf = require('pdf-parse');

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

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../../data/pdfs');
fs.ensureDirSync(uploadDir);

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
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Get all files
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
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
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload a file
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { topic_id } = req.body;
    const filePath = req.file.path;
    const fileBuffer = await fs.readFile(filePath);
    
    // Extract PDF info
    let pageCount = 1;
    try {
      const data = await pdf(fileBuffer);
      pageCount = data.numpages;
    } catch (error) {
      console.log('Could not extract PDF page count, using default');
    }

    // Save file info to database
    const result = await pool.query(
      `INSERT INTO files 
       (filename, original_name, file_path, file_size, page_count, topic_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        req.file.filename,
        req.file.originalname,
        filePath,
        req.file.size,
        pageCount,
        topic_id || null
      ]
    );

    // Create reading progress entry
    await pool.query(
      `INSERT INTO reading_progress (file_id, total_pages) 
       VALUES ($1, $2)`,
      [result.rows[0].id, pageCount]
    );

    res.json({
      success: true,
      file: result.rows[0],
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get file metadata
router.get('/:id/metadata', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT f.*, t.name as topic_name, t.color as topic_color
      FROM files f
      LEFT JOIN topics t ON f.topic_id = t.id
      WHERE f.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting file metadata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update file
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { topic_id, is_favorite } = req.body;
    
    const result = await pool.query(
      `UPDATE files 
       SET topic_id = $1, is_favorite = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [topic_id, is_favorite, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({
      success: true,
      file: result.rows[0],
      message: 'File updated successfully'
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete file
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get file info first
    const fileResult = await pool.query('SELECT * FROM files WHERE id = $1', [id]);
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = fileResult.rows[0];
    
    // Delete file from filesystem
    try {
      await fs.unlink(file.file_path);
    } catch (error) {
      console.log('File already deleted from filesystem');
    }
    
    // Delete reading progress
    await pool.query('DELETE FROM reading_progress WHERE file_id = $1', [id]);
    
    // Delete file record
    await pool.query('DELETE FROM files WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;