import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppleNavigation from './components/apple/AppleNavigation';
import AppleDashboard from './components/apple/AppleDashboard';
import DocumentManager from './components/DocumentManager';
import TopicManager from './components/TopicManager';
import AnalyticsPage from './components/apple/AnalyticsPage';
import SettingsPage from './components/SettingsPage';
import PDFViewerCompact from './pages/PDFViewerCompact';
import './styles/sprintstudy.css';

const SprintPage = () => (
  <div className="main-content">
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="greeting-text">⏱️ Study Sprints</h1>
        <p className="greeting-subtitle">Transform long documents into focused, manageable study sessions</p>
      </div>
      <div className="stat-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>⏱️</div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Study Sprints Coming Soon</h3>
        <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>Break your PDFs into focused 25-minute study sessions with automatic progress tracking.</p>
        <div className="btn btn-primary">🚀 Available in Phase 2</div>
      </div>
    </div>
  </div>
);

const NotesPage = () => (
  <div className="main-content">
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="greeting-text">📝 Smart Notes</h1>
        <p className="greeting-subtitle">Intelligent note-taking with bidirectional linking</p>
      </div>
      <div className="stat-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>��</div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Smart Notes Coming Soon</h3>
        <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>Create interconnected notes with markdown support and PDF anchoring.</p>
        <div className="btn btn-primary">📚 Available in Phase 5</div>
      </div>
    </div>
  </div>
);

const GoalsPage = () => (
  <div className="main-content">
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="greeting-text">🎯 Goals & Achievements</h1>
        <p className="greeting-subtitle">Set study targets and track your progress</p>
      </div>
      <div className="stat-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🎯</div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Goals & Achievements Coming Soon</h3>
        <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>Set daily and weekly study goals with beautiful progress tracking.</p>
        <div className="btn btn-primary">🏆 Available in Phase 3</div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App">
        <AppleNavigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<AppleDashboard />} />
            <Route path="/files" element={<DocumentManager />} />
            <Route path="/topics" element={<TopicManager />} />
            <Route path="/sprints" element={<SprintPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notes/*" element={<NotesPage />} />
            <Route path="/viewer/:fileId" element={<PDFViewerCompact />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
