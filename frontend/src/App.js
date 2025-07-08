import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import EnhancedDashboard from './components/EnhancedDashboard';
import FileManager from './pages/FileManager';
import PDFViewerCompact from './pages/PDFViewerCompact';
import TopicManager from './pages/TopicManager';
import AchievementDisplay from './components/AchievementDisplay';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<EnhancedDashboard />} />
            <Route path="/files" element={<FileManager />} />
            <Route path="/topics" element={<TopicManager />} />
            <Route path="/achievements" element={<AchievementDisplay />} />
            <Route path="/viewer/:fileId" element={<PDFViewerCompact />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
