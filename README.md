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
