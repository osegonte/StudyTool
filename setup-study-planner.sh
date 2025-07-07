#!/bin/bash

# Local Study Planner App - Phase 1 Setup Script
# This script creates the initial project structure for a local study planner app

echo "🚀 Setting up Local Study Planner App - Phase 1"
echo "=============================================="

# Define project name
PROJECT_NAME="local-study-planner"

# Create main project directory
echo "📁 Creating project directory: $PROJECT_NAME"
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Create main directory structure
echo "📂 Creating directory structure..."

# Frontend directories
mkdir -p "frontend/src/components"
mkdir -p "frontend/src/pages"
mkdir -p "frontend/src/utils"
mkdir -p "frontend/src/styles"
mkdir -p "frontend/src/services"
mkdir -p "frontend/public"

# Backend directories
mkdir -p "backend/src/routes"
mkdir -p "backend/src/models"
mkdir -p "backend/src/services"
mkdir -p "backend/src/middleware"
mkdir -p "backend/src/utils"

# Data directories
mkdir -p "data/pdfs"
mkdir -p "data/user-data"
mkdir -p "data/reading-progress"
mkdir -p "data/backups"

# Documentation and configuration
mkdir -p "docs"
mkdir -p "config"
mkdir -p "scripts"

echo "✅ Directory structure created successfully!"

# Create package.json for frontend
echo "📄 Creating frontend package.json..."
cat > frontend/package.json << 'EOF'
{
  "name": "study-planner-frontend",
  "version": "1.0.0",
  "description": "Local Study Planner - Frontend",
  "main": "src/index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "react-router-dom": "^6.8.0",
    "pdfjs-dist": "^3.11.174",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

# Create package.json for backend
echo "📄 Creating backend package.json..."
cat > backend/package.json << 'EOF'
{
  "name": "study-planner-backend",
  "version": "1.0.0",
  "description": "Local Study Planner - Backend",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "sqlite3": "^5.1.6",
    "dotenv": "^16.0.3",
    "fs-extra": "^11.1.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.4.3"
  }
}
EOF

# Create basic frontend structure
echo "⚛️ Creating React frontend structure..."

# Create index.html
cat > frontend/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Local Study Planner</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>
EOF

# Create main App.js
cat > frontend/src/App.js << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PDFViewer from './pages/PDFViewer';
import FileManager from './pages/FileManager';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/files" element={<FileManager />} />
          <Route path="/pdf/:id" element={<PDFViewer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
EOF

# Create index.js
cat > frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Create basic components
echo "🧩 Creating basic components..."

# Dashboard component
cat > frontend/src/pages/Dashboard.js << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Upload, Clock } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Local Study Planner</h1>
        <p>Your personal study companion</p>
      </header>
      
      <main className="dashboard-main">
        <div className="dashboard-cards">
          <Link to="/files" className="dashboard-card">
            <BookOpen size={48} />
            <h3>My PDFs</h3>
            <p>Manage and organize your study materials</p>
          </Link>
          
          <div className="dashboard-card">
            <Clock size={48} />
            <h3>Study Progress</h3>
            <p>Track your reading time and progress</p>
          </div>
          
          <div className="dashboard-card">
            <Upload size={48} />
            <h3>Upload New PDF</h3>
            <p>Add new study materials</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
EOF

# File Manager component
cat > frontend/src/pages/FileManager.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Folder } from 'lucide-react';

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    // This will be connected to backend later
    console.log('Loading files and topics...');
  }, []);

  return (
    <div className="file-manager">
      <header className="file-manager-header">
        <h1>File Manager</h1>
        <button className="upload-btn">
          <Upload size={20} />
          Upload PDF
        </button>
      </header>
      
      <div className="file-manager-content">
        <aside className="topics-sidebar">
          <h3>Topics</h3>
          <div className="topic-list">
            <div className="topic-item">
              <Folder size={16} />
              <span>General</span>
            </div>
          </div>
        </aside>
        
        <main className="files-main">
          <div className="files-grid">
            <div className="file-item">
              <FileText size={48} />
              <h4>Sample PDF</h4>
              <p>0 pages read</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FileManager;
EOF

# PDF Viewer component
cat > frontend/src/pages/PDFViewer.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PDFViewer = () => {
  const { id } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    // PDF.js integration will be implemented here
    console.log('Loading PDF with ID:', id);
  }, [id]);

  return (
    <div className="pdf-viewer">
      <header className="pdf-viewer-header">
        <h1>PDF Viewer</h1>
        <div className="pdf-controls">
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>
            Next
          </button>
        </div>
      </header>
      
      <div className="pdf-viewer-content">
        <div className="pdf-display">
          {/* PDF.js canvas will be rendered here */}
          <div className="pdf-placeholder">
            PDF content will be displayed here
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
EOF

# Create basic CSS
echo "🎨 Creating basic styles..."
cat > frontend/src/styles/App.css << 'EOF'
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

.App {
  min-height: 100vh;
}

/* Dashboard Styles */
.dashboard {
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.dashboard-card svg {
  color: #3498db;
  margin-bottom: 1rem;
}

.dashboard-card h3 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

/* File Manager Styles */
.file-manager {
  padding: 2rem;
}

.file-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-btn:hover {
  background: #2980b9;
}

.file-manager-content {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
}

.topics-sidebar {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  height: fit-content;
}

.topic-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.topic-item:hover {
  background: #f8f9fa;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.file-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.file-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.file-item svg {
  color: #e74c3c;
  margin-bottom: 1rem;
}

/* PDF Viewer Styles */
.pdf-viewer {
  padding: 2rem;
}

.pdf-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.pdf-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pdf-controls button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.pdf-controls button:hover {
  background: #2980b9;
}

.pdf-display {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-placeholder {
  color: #7f8c8d;
  font-size: 1.2rem;
}
EOF

# Create backend structure
echo "🖥️ Creating backend structure..."

# Create main server file
cat > backend/src/index.js << 'EOF'
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
EOF

# Create file routes
cat > backend/src/routes/files.js << 'EOF'
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
EOF

# Create progress routes
cat > backend/src/routes/progress.js << 'EOF'
const express = require('express');
const router = express.Router();

// Get reading progress for a file
router.get('/:fileId', (req, res) => {
  // This will be implemented with database later
  res.json({
    fileId: req.params.fileId,
    currentPage: 1,
    totalPages: 100,
    timeSpent: 0,
    lastAccessed: new Date().toISOString()
  });
});

// Update reading progress
router.post('/:fileId', (req, res) => {
  const { currentPage, timeSpent } = req.body;
  
  // This will be implemented with database later
  res.json({
    message: 'Progress updated',
    fileId: req.params.fileId,
    currentPage,
    timeSpent,
    updatedAt: new Date().toISOString()
  });
});

module.exports = router;
EOF

# Create configuration files
echo "⚙️ Creating configuration files..."

# Create .env file
cat > .env << 'EOF'
# Local Study Planner Configuration
PORT=3001
NODE_ENV=development

# Database (will be SQLite for local storage)
DB_PATH=./data/user-data/study-planner.db

# File upload limits
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=pdf
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
build/
dist/

# Runtime data
*.pid
*.seed
*.pid.lock

# User data and uploads
data/pdfs/*
!data/pdfs/.gitkeep
data/user-data/*
!data/user-data/.gitkeep
data/reading-progress/*
!data/reading-progress/.gitkeep
data/backups/*
!data/backups/.gitkeep

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF

# Create placeholder files to keep empty directories
echo "📝 Creating placeholder files..."
touch data/pdfs/.gitkeep
touch data/user-data/.gitkeep
touch data/reading-progress/.gitkeep
touch data/backups/.gitkeep

# Create README.md
cat > README.md << 'EOF'
# Local Study Planner

A personal study planner app that runs entirely on your Mac Mini M4, designed to help you manage PDFs, track reading progress, and organize your study materials.

## Features

- **Local PDF Management**: Upload and organize PDF study materials
- **Reading Progress Tracking**: Track time spent and pages read
- **Goal Setting**: Set study deadlines and get time recommendations
- **Note Taking**: Integrated note-taking system (coming in Phase 3)
- **Completely Local**: All data stays on your Mac Mini

## Setup

1. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

2. **Start the Development Servers**
   ```bash
   # Start backend (in backend directory)
   npm run dev
   
   # Start frontend (in frontend directory)
   npm start
   ```

3. **Access the App**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Development Phases

- **Phase 1** (Current): Core setup, PDF viewing, basic file management
- **Phase 2**: Time tracking and estimation features
- **Phase 3**: Enhanced organization and note-taking
- **Phase 4**: Personalization and advanced features

## Project Structure

```
local-study-planner/
├── frontend/          # React frontend
├── backend/           # Node.js backend
├── data/             # Local data storage
│   ├── pdfs/         # PDF files
│   ├── user-data/    # User preferences and data
│   └── reading-progress/ # Reading progress tracking
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Tech Stack

- **Frontend**: React, PDF.js, Lucide React
- **Backend**: Node.js, Express, SQLite
- **Storage**: Local file system
- **PDF Handling**: PDF.js
EOF

# Create development scripts
echo "🔧 Creating development scripts..."

# Create start script
cat > scripts/start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Local Study Planner Development Environment"
echo "====================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if not already installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Start backend in background
echo "🖥️ Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "⚛️ Starting frontend development server..."
cd frontend && npm start &
FRONTEND_PID=$!

echo "✅ Development environment started!"
echo "📱 Frontend: http://localhost:3000"
echo "🖥️ Backend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to kill both processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup INT TERM

# Wait for processes
wait
EOF

chmod +x scripts/start-dev.sh

# Create installation script
cat > scripts/install-deps.sh << 'EOF'
#!/bin/bash

echo "📦 Installing Local Study Planner Dependencies"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

cd ..
echo "🎉 All dependencies installed successfully!"
echo "Run './scripts/start-dev.sh' to start the development environment"
EOF

chmod +x scripts/install-deps.sh

# Create project documentation
cat > docs/phase1-completion.md << 'EOF'
# Phase 1 Completion Checklist

## Core Setup and PDF Viewing

### ✅ Completed
- [x] Project structure created
- [x] Frontend React app scaffolded
- [x] Backend Node.js server setup
- [x] Basic routing implemented
- [x] File upload system configured
- [x] Local storage structure created
- [x] Development scripts created

### 🔄 In Progress
- [ ] PDF.js integration
- [ ] PDF viewer component implementation
- [ ] File management UI completion
- [ ] Reading progress persistence

### 📋 Next Steps
1. Integrate PDF.js for PDF rendering
2. Implement file upload functionality
3. Add PDF viewing controls (zoom, navigation)
4. Create reading progress tracking
5. Test local file storage

## Notes
- All data is stored locally in the `data/` directory
- Backend runs on port 3001, frontend on port 3000
- Use `scripts/start-dev.sh` to start both servers
EOF

echo ""
echo "🎉 Project setup complete!"
echo "========================="
echo ""
echo "📁 Project created: $PROJECT_NAME"
echo "📍 Location: $(pwd)"
echo ""
echo "🚀 Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. ./scripts/install-deps.sh"
echo "3. ./scripts/start-dev.sh"
echo ""
echo "📖 Documentation available in docs/"
echo "🔧 Development scripts in scripts/"
echo ""
echo "Happy coding! 🚀"