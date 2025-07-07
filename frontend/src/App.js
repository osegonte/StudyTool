import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PDFViewer from './pages/PDFViewer';
import FileManager from './pages/FileManager';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/files" element={<FileManager />} />
          <Route path="/pdf/:id" element={<PDFViewer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
