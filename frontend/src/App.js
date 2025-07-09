import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import EnhancedNavigation from './components/EnhancedNavigation';
import EnhancedDashboard from './components/EnhancedDashboard';
import FileManager from './pages/FileManager';
import PDFViewerSeamless from './pages/PDFViewerSeamless';
import TopicManager from './pages/TopicManager';
import NotesPage from './pages/notes/NotesPage';
import AchievementDisplay from './components/AchievementDisplay';
import './styles/theme.css';
import './styles/App.css';
import './styles/notes.css';
import './styles/seamless-notes.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <EnhancedNavigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<EnhancedDashboard />} />
              <Route path="/files" element={<FileManager />} />
              <Route path="/topics" element={<TopicManager />} />
              <Route path="/notes/*" element={<NotesPage />} />
              <Route path="/achievements" element={<AchievementDisplay />} />
              <Route path="/viewer/:fileId" element={<PDFViewerSeamless />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
