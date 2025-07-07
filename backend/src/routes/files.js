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

// Simple file registry (will use database later)
let fileRegistry = {};

// Load existing files on startup
const loadExistingFiles = async () => {
  try {
    const pdfDir = path.join(__dirname, '../../../data/pdfs');
    const files = await fs.readdir(pdfDir);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));
    
    // Create registry entries for existing files if not already registered
    pdfFiles.forEach(file => {
      if (!fileRegistry[file]) {
        fileRegistry[file] = {
          id: file,
          original_name: file.replace(/^\d+-\d+-/, ''), // Remove timestamp prefix
          filename: file,
          file_path: `/pdfs/${file}`,
          upload_date: new Date().toISOString(),
          file_size: 0
        };
      }
    });
  } catch (error) {
    console.error('Error loading existing files:', error);
  }
};

// Load files on startup
loadExistingFiles();

// Get all files
router.get('/', async (req, res) => {
  try {
    const fileList = Object.values(fileRegistry).map(file => ({
      id: file.id,
      name: file.original_name,
      path: file.file_path,
      uploadDate: file.upload_date,
      size: file.file_size
    }));
    
    res.json(fileList);
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

// Upload new PDF
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Register the file
    fileRegistry[req.file.filename] = {
      id: req.file.filename,
      original_name: req.file.originalname,
      filename: req.file.filename,
      file_path: `/pdfs/${req.file.filename}`,
      upload_date: new Date().toISOString(),
      file_size: req.file.size
    };
    
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
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete file
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Check if file exists in registry
    if (!fileRegistry[fileId]) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete physical file
    const filePath = path.join(__dirname, '../../../data/pdfs', fileId);
    
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
    
    // Remove from registry
    delete fileRegistry[fileId];
    
    res.json({ 
      success: true, 
      message: 'File deleted successfully' 
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get file metadata
router.get('/:fileId/metadata', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileRegistry[fileId]) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(fileRegistry[fileId]);
  } catch (error) {
    console.error('Error getting metadata:', error);
    res.status(500).json({ error: 'Failed to get file metadata' });
  }
});

module.exports = router;
