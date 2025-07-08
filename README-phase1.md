# Local Study Planner - Phase 1: Core Infrastructure & PDF Organization

A local-first study platform designed specifically for your **Mac Mini M4**, focusing on PDF organization and basic reading functionality without any cloud dependencies.

## 🧱 Phase 1 Goals

**Build the solid foundation** for a personal study system that:
- ✅ Runs entirely on your Mac Mini M4 (no internet required)
- ✅ Organizes PDFs by topics/subjects
- ✅ Provides a clean, fast PDF viewing experience
- ✅ Tracks basic reading progress
- ✅ Offers a centralized study dashboard

## 🎯 Key Features

### 📁 PDF Upload & Local Storage
- Upload any PDF from your Mac directly into the app
- All files stored locally in `data/pdfs/` directory
- No cloud storage - complete privacy and control
- Support for large PDF files (up to 100MB)

### 📂 Topic-Based Organization
- Create custom topics like "Microeconomics", "Python Programming", etc.
- Assign PDFs to topics for better organization
- Visual topic management with custom icons and colors
- Sidebar navigation by topic

### 📖 Enhanced PDF Viewer
- Built-in PDF viewer using PDF.js
- Page navigation, zoom controls, rotation
- Bookmark pages with notes
- Automatic progress tracking
- Favorite PDFs for quick access

### 🏠 Study Dashboard
- Overview of your entire PDF library
- Recent activity and reading recommendations
- Topic-based file organization view
- Continue reading suggestions
- Library statistics and insights

### 💾 Local-First Design
- SQLite database for fast local storage
- No internet connection required
- All data stays on your Mac Mini M4
- Instant startup and response times
- Complete privacy and data ownership

## 🚀 Quick Start

### 1. Install Dependencies
```bash
./scripts/install-deps.sh
```

### 2. Set Up Phase 1
```bash
./scripts/setup-phase1-enhanced.sh
```

### 3. Start Phase 1
```bash
./scripts/start-phase1.sh
```

### 4. Access Your Study Platform
- **Dashboard**: http://localhost:3000
- **API Health**: http://localhost:3001/api/health

## 📱 How to Use Phase 1

### Getting Started
1. **Create Topics**: Go to Topic Manager and create subjects like "Economics", "Programming"
2. **Upload PDFs**: Use the file manager to upload your study materials
3. **Organize**: Assign PDFs to topics during upload or edit them later
4. **Read**: Click any PDF to open the enhanced viewer
5. **Track Progress**: Your reading position is automatically saved

### Topic Management
- Create topics with custom icons (📚, 💻, 🔬, etc.)
- Choose colors for visual organization
- Edit or delete topics as needed
- View all PDFs within a topic

### PDF Organization
- Upload PDFs with topic assignment
- Add notes and tags to files
- Mark important PDFs as favorites
- Delete files you no longer need

### Reading Experience
- Navigate pages with arrow keys or buttons
- Zoom in/out for comfortable reading
- Rotate pages if needed
- Set bookmarks with notes
- Automatic progress saving

## 🗂️ Directory Structure

```
local-study-planner/
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── pages/            # Main pages (Dashboard, FileManager, etc.)
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API communication
│   │   └── styles/           # CSS styles
├── backend/                   # Express.js backend
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── database/         # SQLite database handling
│   │   └── index-phase1.js   # Main server file
├── data/                     # Local data storage
│   ├── pdfs/                # PDF file storage
│   ├── study-planner-phase1.db  # SQLite database
│   └── backups/             # Backup storage
├── scripts/                  # Utility scripts
└── docs/                    # Documentation
```

## 🔧 Technical Details

### Backend (Node.js/Express)
- **Database**: SQLite for local storage
- **File Upload**: Multer for PDF handling
- **API**: RESTful endpoints for all operations
- **Storage**: Local filesystem for PDFs

### Frontend (React)
- **PDF Viewing**: PDF.js integration
- **Routing**: React Router for navigation
- **Styling**: Custom CSS with responsive design
- **Icons**: Lucide React icon library

### Database Schema
- **topics**: Subject organization
- **files**: PDF metadata and organization
- **reading_progress**: Bookmark and progress tracking
- **user_preferences**: App settings

## 📊 API Endpoints

### Files
- `GET /api/files` - List all PDFs
- `POST /api/files/upload` - Upload new PDF
- `PUT /api/files/:id` - Update PDF metadata
- `DELETE /api/files/:id` - Delete PDF
- `GET /api/files/:id/metadata` - Get PDF details

### Topics
- `GET /api/topics` - List all topics
- `POST /api/topics` - Create new topic
- `PUT /api/topics/:id` - Update topic
- `DELETE /api/topics/:id` - Delete topic

### Progress
- `GET /api/progress/:fileId` - Get reading progress
- `POST /api/progress/:fileId` - Update progress
- `POST /api/progress/:fileId/bookmark` - Set bookmark

### Dashboard
- `GET /api/dashboard/stats` - Library statistics
- `GET /api/dashboard/recommendations` - Reading suggestions

## 🛠️ Development

### Running in Development Mode
```bash
# Start both frontend and backend
./scripts/start-phase1.sh

# Or start individually:
cd backend && npm run dev
cd frontend && npm start
```

### Testing the API
```bash
./scripts/test-api.sh
```

### Backup Your Data
```bash
# Manual backup
cp data/study-planner-phase1.db backups/backup-$(date +%Y%m%d).db
```

## 🔄 Preparing for Phase 2

Phase 1 provides the foundation for Phase 2, which will add:
- **Advanced Time Tracking**: Session-based reading timers
- **Reading Speed Analysis**: Pages per minute tracking
- **Goal Setting**: Deadline-based study goals
- **Enhanced Analytics**: Detailed study insights

Your Phase 1 data will be preserved and enhanced in Phase 2.

## 🚨 Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check if port 3001 is available
lsof -ti:3001

# Kill existing process if needed
lsof -ti:3001 | xargs kill -9

# Restart
./scripts/start-phase1.sh
```

**PDFs won't upload**
- Check file size (max 100MB)
- Ensure file is a valid PDF
- Check available disk space

**Database errors**
```bash
# Reset database (WARNING: loses all data)
rm data/study-planner-phase1.db
./scripts/start-phase1.sh
```

### Logs
- Backend: `logs/backend.log`
- Frontend: `logs/frontend.log`

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Ensure all dependencies are installed
4. Verify the Mac Mini M4 has sufficient resources

## 🎉 Success Metrics

By the end of Phase 1, you should be able to:
- ✅ Upload and organize PDFs by topic
- ✅ Browse your library efficiently
- ✅ Read PDFs with the built-in viewer
- ✅ Track reading progress automatically
- ✅ Set bookmarks and favorites
- ✅ Use the system entirely offline

**Phase 1 is your foundation** - a solid, local-first PDF organization and reading system that runs entirely on your Mac Mini M4!
