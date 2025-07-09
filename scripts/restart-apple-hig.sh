#!/bin/bash

echo "🔄 Restarting with Apple HIG Components"
echo "======================================="

# Stop all running processes
echo "🛑 Stopping existing servers..."
pkill -f "react-scripts/scripts/start.js" 2>/dev/null || true
pkill -f "node.*3001" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

# Wait for processes to stop
sleep 2

# Make sure we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the StudyTool root directory"
    exit 1
fi

# Move components to correct locations
echo "📦 Setting up Apple HIG components..."
mkdir -p frontend/src/components/enhanced
mkdir -p frontend/src/components/dashboard
mkdir -p frontend/src/components/reader

# Copy enhanced components if they exist
if [ -f "frontend/src/components/enhanced/AppleDashboard.js" ]; then
    cp frontend/src/components/enhanced/AppleDashboard.js frontend/src/components/AppleDashboard.js
fi

if [ -f "frontend/src/components/enhanced/DocumentManager.js" ]; then
    cp frontend/src/components/enhanced/DocumentManager.js frontend/src/components/DocumentManager.js
fi

if [ -f "frontend/src/components/enhanced/TopicManager.js" ]; then
    cp frontend/src/components/enhanced/TopicManager.js frontend/src/components/TopicManager.js
fi

if [ -f "frontend/src/components/reader/AppleReaderInterface.js" ]; then
    cp frontend/src/components/reader/AppleReaderInterface.js frontend/src/components/AppleReaderInterface.js
fi

if [ -f "frontend/src/components/enhanced/SettingsPage.js" ]; then
    cp frontend/src/components/enhanced/SettingsPage.js frontend/src/components/SettingsPage.js
fi

if [ -f "frontend/src/components/enhanced/SprintPage.js" ]; then
    cp frontend/src/components/enhanced/SprintPage.js frontend/src/components/SprintPage.js
fi

if [ -f "frontend/src/components/enhanced/AnalyticsPage.js" ]; then
    cp frontend/src/components/enhanced/AnalyticsPage.js frontend/src/components/AnalyticsPage.js
fi

# Update App.js to use the new components
echo "🔄 Updating App.js..."
cat > frontend/src/App.js << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import EnhancedNavigation from './components/EnhancedNavigation';
import AppleDashboard from './components/AppleDashboard';
import DocumentManager from './components/DocumentManager';
import TopicManager from './components/TopicManager';
import AppleReaderInterface from './components/AppleReaderInterface';
import SettingsPage from './components/SettingsPage';
import SprintPage from './components/SprintPage';
import AnalyticsPage from './components/AnalyticsPage';
import NotesPage from './pages/notes/NotesPage';
import AchievementDisplay from './components/AchievementDisplay';
import './styles/theme.css';
import './styles/apple-hig.css';
import './styles/App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <EnhancedNavigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<AppleDashboard />} />
              <Route path="/files" element={<DocumentManager />} />
              <Route path="/topics" element={<TopicManager />} />
              <Route path="/sprints" element={<SprintPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notes/*" element={<NotesPage />} />
              <Route path="/achievements" element={<AchievementDisplay />} />
              <Route path="/viewer/:fileId" element={<AppleReaderInterface />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
EOF

# Update navigation
echo "🗺️ Updating navigation..."
cat > frontend/src/components/EnhancedNavigation.js << 'EOF'
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, FileText, Folder, BookOpen, StickyNote, Trophy, 
  Menu, X, Activity, BarChart3, Settings, Timer 
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const EnhancedNavigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard', description: 'Overview & Stats' },
    { path: '/files', icon: FileText, label: 'Documents', description: 'PDFs & Files' },
    { path: '/topics', icon: Folder, label: 'Topics', description: 'Study Categories' },
    { path: '/sprints', icon: Timer, label: 'Sprints', description: 'Focus Sessions' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', description: 'Progress Insights' },
    { path: '/notes', icon: StickyNote, label: 'Notes', description: 'Knowledge Base' },
    { path: '/achievements', icon: Trophy, label: 'Achievements', description: 'Progress & Rewards' },
    { path: '/settings', icon: Settings, label: 'Settings', description: 'Preferences' },
  ];

  const isActive = (path) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <>
      <button 
        className="mobile-nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <nav className={`navigation ${isOpen ? 'open' : ''}`}>
        <div className="nav-header">
          <BookOpen className="nav-logo" />
          <div>
            <h1>Study Planner</h1>
            <p className="nav-subtitle">Your Learning Hub</p>
          </div>
        </div>
        
        <ul className="nav-links">
          {navItems.map(({ path, icon: Icon, label, description }) => (
            <li key={path}>
              <Link 
                to={path} 
                className={`nav-link ${isActive(path) ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} className="icon" />
                <div className="nav-link-content">
                  <span className="nav-link-label">{label}</span>
                  <span className="nav-link-description">{description}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-footer">
          <div className="nav-controls">
            <ThemeToggle />
          </div>
          <div className="nav-stats">
            <div className="stat-item">
              <span className="stat-label">Study Streak</span>
              <span className="stat-value">🔥 0 days</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total XP</span>
              <span className="stat-value">⭐ 0 points</span>
            </div>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div 
          className="nav-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default EnhancedNavigation;
EOF

# Check if backend is running
if ! pgrep -f "node.*3001" > /dev/null; then
    echo "🚀 Starting backend server..."
    cd backend
    npm start &
    BACKEND_PID=$!
    cd ..
    sleep 3
else
    echo "✅ Backend server is already running"
fi

# Start frontend server
echo "🌐 Starting frontend server with Apple HIG components..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Apple HIG UI Transformation Active!"
echo "====================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "✨ New Apple-Style Features:"
echo "• 🎨 Apple Human Interface Guidelines design"
echo "• 📊 Enhanced dashboard with SF Pro typography"
echo "• 📁 Redesigned file and topic managers"
echo "• 📖 Apple Books-style PDF reader"
echo "• ⚙️ macOS-style settings page"
echo "• 🏃 Sprint management with timer"
echo "• 📈 Beautiful analytics charts"
echo "• 🌙 Seamless dark mode support"
echo ""
echo "🚀 Open http://localhost:3000 to see the transformation!"
echo "Press Ctrl+C to stop all servers"

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait
EOF

chmod +x scripts/restart-apple-hig.sh
./scripts/restart-apple-hig.sh