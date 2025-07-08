# Local Study Planner - Personal Study System

A comprehensive, local-first study platform designed for your Mac Mini M4. Track your study sessions, build habits, and improve your learning with detailed analytics - all stored locally.

## 🎯 Features

### 📖 **Smart PDF Reading**
- Clean, Apple Books-style PDF viewer
- Automatic page timing and progress tracking
- Focus mode for distraction-free reading
- Keyboard shortcuts for efficient navigation

### ⏱️ **Advanced Time Tracking**
- Automatic session recording
- Page-by-page time analysis
- Pomodoro timer integration
- Study streak tracking

### 🎯 **Goal Management**
- Set study deadlines and targets
- Track daily and weekly progress
- XP and leveling system for motivation
- Achievement tracking

### 📚 **Exercise & Practice Tracking**
- Log practice problems and exercises
- Track performance and improvement
- Spaced repetition scheduling
- Difficulty adjustment based on performance

### 📊 **Comprehensive Analytics**
- Reading speed trends over time
- Focus pattern analysis
- Study environment optimization
- Performance insights and recommendations

### 💾 **Local Data Storage**
- Everything stored on your Mac Mini M4
- No cloud dependencies
- Complete privacy and control
- Data export for backup

## 🚀 Quick Start

### 1. **Deploy the System**
```bash
./scripts/deploy-comprehensive-data.sh
```

### 2. **Access Your Study Platform**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

### 3. **Start Studying**
1. Upload your PDF study materials
2. Organize them by topics
3. Open any PDF to start studying
4. Watch the bottom toolbar track your progress automatically

## 🎮 How to Use

### **Reading Experience**
- PDFs are displayed center-stage with minimal distractions
- Bottom toolbar shows essential info without cluttering
- Click 🌙 for focus mode (hides everything except PDF)
- All timing happens automatically in the background

### **Goal Setting**
- Create study goals with specific deadlines
- Set daily time targets (default: 60 minutes)
- Track progress toward exam dates
- Celebrate achievements with XP rewards

### **Analytics & Insights**
- View your study trends over time
- See which environments help you focus best
- Track reading speed improvements
- Optimize your study schedule

## 🔧 Technical Details

### **Architecture**
- **Frontend**: React 18 with modern UI components
- **Backend**: Node.js/Express with comprehensive APIs
- **Database**: PostgreSQL with detailed tracking schema
- **Storage**: Local filesystem for PDF files

### **Key Components**
- `CompactSessionToolbar` - Unobtrusive progress tracking
- `PDFViewerCompact` - Apple HIG-inspired reading interface
- `EnhancedSessionTracker` - Comprehensive data collection
- `FocusMode` - Distraction-free study environment

## 📁 Project Structure

```
local-study-planner/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/           # Main pages
│   │   └── styles/          # CSS styling
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   └── migrations/      # Database schema
├── data/                    # Local storage
│   ├── pdfs/               # PDF files
│   └── backups/            # Data backups
└── scripts/                # Utility scripts
```

## 📊 Data Tracked

Your study system automatically saves:
- ⏱️ **Time data**: Every second of study time with timestamps
- 📄 **Reading data**: Pages read, revisits, reading speed
- 🎯 **Goals**: Progress toward deadlines and daily targets
- 📚 **Exercises**: Practice attempts, scores, improvement
- 🧠 **Focus**: Concentration patterns and quality ratings
- 🌍 **Context**: Study environment and conditions
- 📈 **Analytics**: Performance trends and insights

## 🎯 Perfect For

- **Students** preparing for exams with deadlines
- **Professionals** learning new skills systematically
- **Researchers** reading papers and taking notes
- **Anyone** wanting to build consistent study habits

## 🔒 Privacy & Data

- **100% Local**: All data stored on your Mac Mini M4
- **No Cloud**: No internet connection required
- **Complete Control**: Export your data anytime
- **Private**: Your study data never leaves your device

---

**Built for serious learners who want to optimize their study habits and track their progress over time.** 📚✨
