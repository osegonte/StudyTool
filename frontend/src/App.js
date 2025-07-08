import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import FileManager from './pages/FileManager';
import PDFViewer from './pages/PDFViewer';
import TopicManager from './pages/TopicManager';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/files" element={<FileManager />} />
            <Route path="/topics" element={<TopicManager />} />
            <Route path="/viewer/:fileId" element={<PDFViewer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
