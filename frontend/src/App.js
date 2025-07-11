import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppleNavigation from './components/apple/AppleNavigation';
import AppleDashboard from './components/apple/AppleDashboard';
import DocumentManager from './components/DocumentManager';
import TopicManager from './components/TopicManager';
import './styles/App.css';

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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
