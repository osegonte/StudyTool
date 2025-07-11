import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import DocumentManager from './components/DocumentManager';
import TopicManager from './components/TopicManager';
import PDFViewer from './components/PDFViewer';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/files" element={<DocumentManager />} />
            <Route path="/topics" element={<TopicManager />} />
            <Route path="/viewer/:fileId" element={<PDFViewer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
