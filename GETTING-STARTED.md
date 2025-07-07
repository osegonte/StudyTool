# Getting Started - Local Study Planner

## 🚀 Quick Start

### 1. Set Up the Project
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Install all dependencies
./scripts/install-deps.sh

# Verify setup
./scripts/verify-setup.sh
```

### 2. Start the Application
```bash
# Start both frontend and backend
./scripts/start-dev.sh
```

### 3. Use the Application
1. Open http://localhost:3000 in your browser
2. Upload PDF files using the File Manager
3. Click on any PDF to view and read
4. Progress is automatically tracked and saved

## 🔧 Available Scripts

- `./scripts/install-deps.sh` - Install all dependencies
- `./scripts/start-dev.sh` - Start development environment
- `./scripts/verify-setup.sh` - Verify installation
- `./scripts/test-api.sh` - Test API endpoints

## 📁 What You Can Do (Phase 1)

### ✅ Implemented Features
- **Upload PDFs**: Drag and drop or click to upload
- **View PDFs**: Full-featured PDF viewer with navigation
- **Track Progress**: Automatic reading progress tracking
- **Manage Files**: Organize and delete PDFs
- **Local Storage**: Everything stays on your Mac Mini

### 🎯 Perfect For
- Reading academic papers
- Studying textbooks
- Technical documentation
- Research materials

## 🔄 Coming in Phase 2
- Advanced time tracking
- Reading speed analysis
- Study goal setting
- Deadline management
- Time estimation features

## 🆘 Troubleshooting

### Backend Won't Start
- Check if Node.js is installed: `node --version`
- Ensure port 3001 is available
- Check logs in `logs/backend.log`

### Frontend Won't Start
- Ensure port 3000 is available
- Check logs in `logs/frontend.log`
- Try clearing browser cache

### PDF Won't Load
- Ensure PDF is valid and not corrupted
- Check file size (should be under 50MB)
- Verify PDF is properly uploaded

### Can't Upload Files
- Check `data/pdfs/` directory permissions
- Ensure sufficient disk space
- Verify file is a PDF

## 📞 Need Help?
Check the documentation in the `docs/` directory or review the logs in the `logs/` directory for detailed error information.

Happy studying! 📚
