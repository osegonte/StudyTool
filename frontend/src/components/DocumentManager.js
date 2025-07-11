import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, FileText, Trash2, Star, Search, Filter, 
  Grid, List, MoreHorizontal, Eye, Edit3
} from 'lucide-react';
import api from "../services/api";

const DocumentManager = () => {
  const [files, setFiles] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');

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
      await api.post('/files/upload', formData);
      loadFiles();
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
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

  const deleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`/files/${fileId}`);
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || file.topic_id === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEstimatedReadTime = (pageCount) => {
    const avgTimePerPage = 2; // minutes
    const totalMinutes = pageCount * avgTimePerPage;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="document-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="header-content">
          <h1>Documents</h1>
          <p>Your study materials</p>
        </div>
        
        <label className="upload-btn primary">
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

      {/* Sticky Topic Filter Panel */}
      <div className="filter-panel">
        <div className="filter-section">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="topic-filter"
          >
            <option value="all">All Documents</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>
                {topic.icon} {topic.name}
              </option>
            ))}
          </select>
        </div>

        <div className="view-controls">
          <button
            onClick={() => setViewMode('grid')}
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Document Grid */}
      <div className={`documents-container ${viewMode}`}>
        {loading ? (
          <div className="loading-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="document-skeleton" />
            ))}
          </div>
        ) : filteredFiles.length > 0 ? (
          filteredFiles.map(file => (
            <div key={file.id} className="document-card">
              <div className="document-header">
                <div className="document-icon">
                  <FileText size={24} />
                </div>
                <div className="document-actions">
                  <button
                    onClick={() => toggleFavorite(file)}
                    className={`action-btn ${file.is_favorite ? 'active' : ''}`}
                  >
                    <Star size={16} fill={file.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                  <button className="action-btn">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>

              <div className="document-content">
                <h3>{file.original_name}</h3>
                <div className="document-meta">
                  <span>{file.page_count} pages</span>
                  <span>{formatFileSize(file.file_size)}</span>
                  <span className="read-time">
                    {getEstimatedReadTime(file.page_count)} est.
                  </span>
                </div>
                
                {file.topic_name && (
                  <div 
                    className="topic-badge"
                    style={{ 
                      backgroundColor: file.topic_color,
                      color: 'white'
                    }}
                  >
                    {file.topic_icon} {file.topic_name}
                  </div>
                )}

                <div className="document-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '23%' }} />
                  </div>
                  <span className="progress-text">23% complete</span>
                </div>
              </div>

              <div className="document-footer">
                <Link to={`/viewer/${file.id}`} className="btn-primary">
                  <Eye size={16} />
                  Open
                </Link>
                <button className="btn-secondary">
                  <Edit3 size={16} />
                  Rename
                </button>
                <button
                  onClick={() => deleteFile(file.id)}
                  className="btn-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <FileText size={64} />
            <h3>No documents found</h3>
            <p>Upload your first PDF to get started</p>
            <label className="btn-primary">
              <Upload size={16} />
              Upload PDF
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;
