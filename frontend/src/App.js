import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppleNavigation from './components/apple/AppleNavigation';
import AppleDashboard from './components/apple/AppleDashboard';
import DocumentManager from './components/DocumentManager';
import TopicManager from './components/TopicManager';
import SprintPage from './components/SprintPage';
import AnalyticsPage from './components/AnalyticsPage';
import SettingsPage from './components/SettingsPage';
import AppleReaderInterface from './components/AppleReaderInterface';
import AchievementDisplay from './components/AchievementDisplay';
import NotesPage from './pages/notes/NotesPage';
import './styles/apple/design-system.css';

function App() {
  return (
    <Router>
      <div className="App">
        <AppleNavigation />
        <main className="ml-64 min-h-screen bg-gray-50">
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
  );
}

export default App;
