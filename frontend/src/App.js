// src/App.js - Fixed version
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppleNavigation from './components/apple/AppleNavigation';
import AppleDashboard from './components/apple/AppleDashboard';
import DocumentManager from './components/DocumentManager';
import TopicManager from './components/TopicManager';
import AnalyticsPage from './components/apple/AnalyticsPage';
import SettingsPage from './components/SettingsPage';
import PDFViewerCompact from './pages/PDFViewerCompact';
import './styles/apple/design-system.css';
import './styles/theme.css';

// Simple placeholder components for missing routes
const SprintPage = () => (
  <div className="container py-8">
    <h1>Sprint Planning</h1>
    <p>Sprint planning feature coming soon!</p>
  </div>
);

const NotesPage = () => (
  <div className="container py-8">
    <h1>📝 Notes</h1>
    <p>Smart notes feature coming soon!</p>
  </div>
);

const AchievementDisplay = () => (
  <div className="container py-8">
    <h1>🏆 Achievements</h1>
    <p>Achievement system coming soon!</p>
  </div>
);

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
            <Route path="/viewer/:fileId" element={<PDFViewerCompact />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;