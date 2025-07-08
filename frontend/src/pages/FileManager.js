import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, Trash2, Star, Search } from 'lucide-react';
import api from '../services/api';

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFiles();
    loadTopics();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      loadFiles();
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`/files/${fileId}`);
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const toggleFavorite = async (file) => {
    try {
      await api.put(`/files/${file.id}`, {
        topic_id: file.topic_id,
        is_favorite: !file.is_favorite
      });
      loadFiles();
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'favorites' && file.is_favorite) ||
                         (filter === 'no-topic' && !file.topic_id) ||
                         (filter !== 'all' && filter !== 'favorites' && filter !== 'no-topic' && file.topic_id === filter);
    return matchesSearch && matchesFilter;
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-manager">
      <div className="page-header">
        <h1>File Manager</h1>
        <p>Upload and organize your study materials</p>
      </div>

      <div className="file-actions">
        <div className="upload-section">
          <label className="upload-btn">
            <Upload size={20} />
            {uploading ? 'Uploading...' : 'Upload PDF'}
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className="file-filters">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Files</option>
            <option value="favorites">Favorites</option>
            <option value="no-topic">No Topic</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>{topic.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading files...</div>
      ) : (
        <div className="files-grid">
          {filteredFiles.length > 0 ? (
            filteredFiles.map(file => (
              <div key={file.id} className="file-card">
                <div className="file-header">
                  <FileText size={24} />
                  <button
                    className={`favorite-btn ${file.is_favorite ? 'active' : ''}`}
                    onClick={() => toggleFavorite(file)}
                  >
                    <Star size={16} fill={file.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="file-info">
                  <h3>{file.original_name}</h3>
                  <div className="file-meta">
                    <span>{file.page_count} pages</span>
                    <span>{formatFileSize(file.file_size)}</span>
                  </div>
                  {file.topic_name && (
                    <span 
                      className="topic-badge" 
                      style={{ backgroundColor: file.topic_color }}
                    >
                      {file.topic_icon} {file.topic_name}
                    </span>
                  )}
                </div>

                <div className="file-actions">
                  <Link to={`/viewer/${file.id}`} className="btn btn-primary">
                    Open
                  </Link>
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteFile(file.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No files found</h3>
              <p>
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter' 
                  : 'Upload your first PDF to get started'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileManager;
