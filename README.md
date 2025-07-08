# Local Study Planner - Phase 1: Clean Start

A local-first PDF study platform for Mac Mini M4.

## Phase 1 Goals

✅ **PDF Upload & Local Storage** - Manage PDFs locally  
✅ **Topic-Based Organization** - Organize by subject  
✅ **Enhanced PDF Viewer** - View PDFs with navigation  
✅ **Study Dashboard** - Central overview  
✅ **Local-First Design** - No cloud dependencies  

## Quick Start

1. **Install Dependencies**
   ```bash
   ./scripts/install-phase1.sh
   ```

2. **Start Development**
   ```bash
   ./scripts/start-phase1.sh
   ```

3. **Access App**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Project Structure

```
local-study-planner/
├── frontend/           # React app
├── backend/           # Express.js API
├── data/             # Local storage
│   └── pdfs/        # PDF files
├── scripts/          # Setup scripts
├── docs/            # Documentation
└── logs/            # Application logs
```

## Development

- **Platform**: Mac Mini M4
- **Storage**: Local filesystem only
- **Database**: SQLite (when needed)
- **PDF Viewer**: PDF.js

## Phase 1 Features

- 📁 PDF file management
- 📖 PDF viewing with controls
- 🏠 Study dashboard
- 📊 Basic progress tracking
- 🎯 Local-only operation

Ready for Phase 1 development!
