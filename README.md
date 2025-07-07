# Local Study Planner - Phase 2

A personal study planner focused on **Time Tracking and Estimation** with **Goal Setting and Deadlines**, running entirely on your Mac Mini M4.

## Phase 2 Features

### 🕒 Time Tracking and Estimation
- **Reading Time Tracker**: Tracks time spent on each page of PDFs
- **Reading Speed Analysis**: Calculates average reading speed (pages per minute)
- **Time Estimation**: Estimates total time needed to finish PDFs based on your reading speed
- **Session Management**: Start/pause/stop reading sessions with detailed tracking

### 🎯 Goal Setting with Deadlines
- **Time-based Goals**: Set daily reading minute targets
- **Deadline Goals**: Set completion dates for PDFs or study topics
- **Progress Tracking**: Visual progress bars and completion percentages
- **Smart Recommendations**: App suggests daily study time based on deadlines and reading speed

### 📊 Analytics Dashboard
- **Reading Speed Trends**: Track improvement in reading speed over time
- **Daily Activity**: Monitor daily reading time and pages read
- **Goal Achievement**: Track how often you meet your daily/weekly goals
- **Time Estimation Accuracy**: See how accurate the app's time predictions are

## Quick Start

1. **Install Dependencies**
   ```bash
   ./scripts/install-deps.sh
   ```

2. **Start Phase 2**
   ```bash
   ./scripts/start-phase2.sh
   ```

3. **Access Your App**
   - Main Dashboard: http://localhost:3000
   - Analytics: http://localhost:3000/analytics
   - Goals: http://localhost:3000/goals

## How Phase 2 Works

### Time Tracking Workflow
1. Upload a PDF in the File Manager
2. Open the PDF viewer
3. Click the timer to start a reading session
4. Read at your normal pace - the app tracks everything
5. Pause/resume as needed
6. End the session when done

### Goal Setting Workflow  
1. Go to Goals section
2. Create a new time-based goal:
   - **Daily Minutes**: "Read 30 minutes every day"
   - **Completion Date**: "Finish this PDF by exam date"
3. The app tracks your progress automatically
4. Get recommendations on daily study time needed

### Smart Time Estimation
- As you read, the app learns your reading speed
- It calculates how long remaining PDFs will take
- Based on deadlines, it recommends daily study schedules
- Accuracy improves over time as you use the app more

## Tech Stack

- **Frontend**: React 18, PDF.js, Recharts for analytics
- **Backend**: Node.js, Express, SQLite for local data
- **Storage**: Everything stored locally on your Mac Mini
- **PDF Handling**: PDF.js for in-browser viewing

## Data Storage

All data is stored locally in the `data/` directory:
- `data/pdfs/` - Your PDF files
- `data/study-planner.db` - SQLite database with all tracking data
- `data/sessions/` - Reading session details
- `data/goals/` - Goal settings and progress

## Phase 2 vs Phase 1

**Phase 1** provided basic PDF viewing and simple progress tracking.

**Phase 2** adds:
- ⏱️ Precise time tracking with session management
- 📈 Reading speed analysis and improvement tracking  
- 🎯 Smart goal setting with deadline management
- 📊 Analytics dashboard with charts and insights
- 🧮 Intelligent time estimation for study planning

## Coming in Phase 3

Phase 3 will focus on **Enhanced Organization and Note-Taking**:
- Topic-based PDF organization
- Obsidian-style note-taking integration
- Highlight and annotation system
- Cross-reference between notes and PDFs

## Troubleshooting

### Common Issues
- **Servers won't start**: Run `./cleanup-phase2.sh` to fix
- **Database errors**: Delete `data/study-planner.db` to reset
- **Timer not working**: Check browser permissions for notifications

### Logs
- Backend: `logs/backend.log`
- Frontend: `logs/frontend.log`

### Clean Installation
```bash
./cleanup-phase2.sh  # Run this script
./scripts/install-deps.sh
./scripts/start-phase2.sh
```

Your personal study data remains private and never leaves your Mac Mini M4! 🔒
