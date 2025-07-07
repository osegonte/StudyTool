const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../data/pdfs');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Get all files
router.get('/', async (req, res) => {
  try {
    const pdfDir = path.join(__dirname, '../../../data/pdfs');
    const files = await fs.readdir(pdfDir);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));
    
    const fileData = pdfFiles.map(file => ({
      id: file,
      name: file,
      path: `/pdfs/${file}`,
      uploadDate: new Date().toISOString() // This will be from database later
    }));
    
    res.json(fileData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

// Upload new PDF
router.post('/upload', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        id: req.file.filename,
        name: req.file.originalname,
        path: `/pdfs/${req.file.filename}`,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
