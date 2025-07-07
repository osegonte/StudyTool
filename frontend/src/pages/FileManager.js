import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Folder } from 'lucide-react';

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    // This will be connected to backend later
    console.log('Loading files and topics...');
  }, []);

  return (
    <div className="file-manager">
      <header className="file-manager-header">
        <h1>File Manager</h1>
        <button className="upload-btn">
          <Upload size={20} />
          Upload PDF
        </button>
      </header>
      
      <div className="file-manager-content">
        <aside className="topics-sidebar">
          <h3>Topics</h3>
          <div className="topic-list">
            <div className="topic-item">
              <Folder size={16} />
              <span>General</span>
            </div>
          </div>
        </aside>
        
        <main className="files-main">
          <div className="files-grid">
            <div className="file-item">
              <FileText size={48} />
              <h4>Sample PDF</h4>
              <p>0 pages read</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FileManager;
