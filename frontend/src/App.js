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
