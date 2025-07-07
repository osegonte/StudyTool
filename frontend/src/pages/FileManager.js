import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Folder, Trash2, Eye, Clock } from 'lucide-react';
import axios from 'axios';

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileUpload = async (selectedFiles) => {
    const file = selectedFiles[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      await axios.post('http://localhost:3001/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchFiles(); // Refresh the file list
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await axios.delete(`http://localhost:3001/api/files/${fileId}`);
      fetchFiles(); // Refresh the file list
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed. Please try again.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileUpload(droppedFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-manager">
      <header className="file-manager-header">
        <div>
          <h1>📁 File Manager</h1>
          <p>{files.length} PDF{files.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <div className="header-actions">
          <label className="upload-btn">
            <Upload size={20} />
            {uploading ? 'Uploading...' : 'Upload PDF'}
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </header>
      
      <div className="file-manager-content">
        <aside className="topics-sidebar">
          <h3>📂 Topics</h3>
          <div className="topic-list">
            <div className="topic-item active">
              <Folder size={16} />
              <span>All Files ({files.length})</span>
            </div>
            <div className="topic-item">
              <Folder size={16} />
              <span>Recent</span>
            </div>
          </div>
        </aside>
        
        <main className="files-main">
          {files.length === 0 ? (
            <div 
              className={`upload-area ${dragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload size={64} />
              <h3>No PDFs uploaded yet</h3>
              <p>Drag and drop PDF files here or click the upload button</p>
            </div>
          ) : (
            <div className="files-grid">
              {files.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-icon">
                    <FileText size={48} />
                  </div>
                  <div className="file-info">
                    <h4 title={file.name}>{file.name}</h4>
                    <p>{formatFileSize(file.size)}</p>
                    <p>{new Date(file.uploadDate).toLocaleDateString()}</p>
                  </div>
                  <div className="file-actions">
                    <Link 
                      to={`/pdf/${file.id}`} 
                      className="action-btn view-btn"
                      title="View PDF"
                    >
                      <Eye size={16} />
                    </Link>
                    <button 
                      onClick={() => handleDelete(file.id)}
                      className="action-btn delete-btn"
                      title="Delete PDF"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FileManager;
