import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, FileText, Trash2, Star, Search, 
  Grid, List, MoreHorizontal, Eye, Edit3, Clock,
  BookOpen, Download, X
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
  const [sortBy, setSortBy] = useState('recent');

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

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.original_name.localeCompare(b.original_name);
      case 'size':
        return b.file_size - a.file_size;
      case 'pages':
        return b.page_count - a.page_count;
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
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

  const getProgressColor = (progress) => {
    if (progress < 25) return '#EF4444';
    if (progress < 50) return '#F59E0B';
    if (progress < 75) return '#3B82F6';
    return '#10B981';
  };

  return (
    <div className="document-manager">
      {/* Beautiful Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">📚 Documents</h1>
            <p className="page-subtitle">Manage your study materials with style</p>
          </div>
          
          <div className="header-stats">
            <div className="mini-stat">
              <div className="mini-stat-icon">
                <FileText size={20} />
              </div>
              <div className="mini-stat-content">
                <div className="mini-stat-value">{files.length}</div>
                <div className="mini-stat-label">Documents</div>
              </div>
            </div>
            
            <div className="mini-stat">
              <div className="mini-stat-icon">
                <BookOpen size={20} />
              </div>
              <div className="mini-stat-content">
                <div className="mini-stat-value">{files.reduce((sum, f) => sum + f.page_count, 0)}</div>
                <div className="mini-stat-label">Total Pages</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <label className="upload-button">
            <Upload size={20} />
            {uploading ? (
              <>
                <div className="loading-spinner small"></div>
                Uploading...
              </>
            ) : (
              'Upload PDF'
            )}
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Enhanced Filter Bar */}
      <div className="filter-bar">
        <div className="filter-main">
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="search-clear"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="filter-group">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="topic-select"
            >
              <option value="all">All Topics</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>
                  {topic.icon} {topic.name}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="recent">Recently Added</option>
              <option value="name">Name A-Z</option>
              <option value="size">File Size</option>
              <option value="pages">Page Count</option>
            </select>
          </div>
        </div>

        <div className="view-controls">
          <button
            onClick={() => setViewMode('grid')}
            className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Document Grid/List */}
      <div className={`documents-container ${viewMode}`}>
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your documents...</p>
          </div>
        ) : sortedFiles.length > 0 ? (
          sortedFiles.map(file => {
            const progress = Math.floor(Math.random() * 100); // Mock progress
            const lastRead = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
            
            return (
              <div key={file.id} className="document-card">
                <div className="document-preview">
                  <div className="document-icon">
                    <FileText size={32} />
                  </div>
                  <div className="document-overlay">
                    <button
                      onClick={() => toggleFavorite(file)}
                      className={`action-button favorite ${file.is_favorite ? 'active' : ''}`}
                    >
                      <Star size={16} fill={file.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                    <div className="action-menu">
                      <button className="action-button">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="document-content">
                  <div className="document-header">
                    <h3 className="document-title">{file.original_name}</h3>
                    {file.topic_name && (
                      <div 
                        className="topic-tag"
                        style={{ 
                          backgroundColor: `${file.topic_color}20`,
                          color: file.topic_color,
                          border: `1px solid ${file.topic_color}30`
                        }}
                      >
                        {file.topic_icon} {file.topic_name}
                      </div>
                    )}
                  </div>
                  
                  <div className="document-meta">
                    <div className="meta-item">
                      <BookOpen size={14} />
                      <span>{file.page_count} pages</span>
                    </div>
                    <div className="meta-item">
                      <Download size={14} />
                      <span>{formatFileSize(file.file_size)}</span>
                    </div>
                    <div className="meta-item">
                      <Clock size={14} />
                      <span>{getEstimatedReadTime(file.page_count)}</span>
                    </div>
                  </div>

                  <div className="reading-progress">
                    <div className="progress-header">
                      <span className="progress-label">Reading Progress</span>
                      <span className="progress-percentage">{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: getProgressColor(progress)
                        }} 
                      />
                    </div>
                    <div className="progress-footer">
                      <span className="last-read">
                        Last read {lastRead.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="document-actions">
                  <Link to={`/viewer/${file.id}`} className="primary-action">
                    <Eye size={16} />
                    Continue Reading
                  </Link>
                  <button className="secondary-action">
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="danger-action"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FileText size={80} />
            </div>
            <h3 className="empty-title">No documents found</h3>
            <p className="empty-description">
              {searchTerm || selectedTopic !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Upload your first PDF to get started with your studies'
              }
            </p>
            {!searchTerm && selectedTopic === 'all' && (
              <label className="empty-action">
                <Upload size={18} />
                Upload Your First PDF
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;