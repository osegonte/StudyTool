#!/bin/bash

echo "🎨 Apple HIG UI Transformation - Night and Day Difference"
echo "========================================================="

# Create enhanced components directory
mkdir -p frontend/src/components/enhanced
mkdir -p frontend/src/components/dashboard
mkdir -p frontend/src/components/reader
mkdir -p frontend/src/components/shared

# 1. Enhanced Dashboard with Apple-style Welcome Header
echo "📊 Creating Enhanced Dashboard..."
cat > frontend/src/components/dashboard/AppleDashboard.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Clock, Target, TrendingUp, Play, Upload, 
  Flame, Trophy, Star, ChevronRight, Activity
} from 'lucide-react';
import api from '../../services/api';

const AppleDashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalTopics: 0,
    totalPages: 0,
    recentFiles: [],
    topicStats: []
  });
  const [userProgress, setUserProgress] = useState({
    dailyGoal: 60,
    studyMinutes: 45,
    xpEarned: 120,
    streakDays: 3
  });
  const [currentUser] = useState('Victor'); // Replace with actual user
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    setGreeting(getTimeBasedGreeting());
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = async () => {
    try {
      const [dashboardResponse, progressResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/user-progress/stats').catch(() => ({ data: userProgress }))
      ]);

      setStats(dashboardResponse.data);
      setUserProgress(progressResponse.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    return Math.min((userProgress.studyMinutes / userProgress.dailyGoal) * 100, 100);
  };

  if (loading) {
    return (
      <div className="apple-dashboard loading">
        <div className="loading-skeleton">
          <div className="skeleton-header" />
          <div className="skeleton-stats" />
          <div className="skeleton-content" />
        </div>
      </div>
    );
  }

  return (
    <div className="apple-dashboard">
      {/* Welcome Header - Apple Style */}
      <div className="welcome-header">
        <h1 className="welcome-title">
          {greeting}, {currentUser} 👋
        </h1>
        <p className="welcome-subtitle">
          Here's everything you need to hit today's goal.
        </p>
      </div>

      {/* Top Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon">
            <BookOpen size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalFiles}</div>
            <div className="stat-label">PDFs Uploaded</div>
          </div>
          <Link to="/files" className="stat-action">
            Upload More
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {Math.floor(userProgress.studyMinutes / 60)}h {userProgress.studyMinutes % 60}m
            </div>
            <div className="stat-label">Total Study Time</div>
          </div>
          <div className="stat-streak">
            <Flame size={16} />
            <span>{userProgress.streakDays}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Target size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{Math.round(getProgressPercentage())}%</div>
            <div className="stat-label">Daily Goal</div>
          </div>
          <div className="progress-ring">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="rgba(var(--primary-accent-hsl), 0.2)"
                strokeWidth="4"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="var(--primary-accent)"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - getProgressPercentage() / 100)}`}
                transform="rotate(-90 24 24)"
                className="progress-circle"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Continue Sprint Button */}
      <div className="continue-sprint-section">
        <button className="continue-sprint-btn">
          <Play size={20} />
          <span>Continue Sprint</span>
          <div className="btn-glow" />
        </button>
      </div>

      {/* Topic Progress Grid */}
      <div className="topic-progress-grid">
        <div className="section-header">
          <h2>Study Progress</h2>
          <Link to="/topics" className="section-action">
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="topic-cards">
          {stats.topicStats?.slice(0, 4).map(topic => (
            <div key={topic.id} className="topic-card">
              <div className="topic-header">
                <span className="topic-icon">{topic.icon}</span>
                <h3>{topic.name}</h3>
              </div>
              
              <div className="topic-progress">
                <div className="completion-ring">
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle
                      cx="36"
                      cy="36"
                      r="32"
                      fill="none"
                      stroke="rgba(var(--primary-accent-hsl), 0.1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="36"
                      cy="36"
                      r="32"
                      fill="none"
                      stroke="var(--primary-accent)"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - (topic.file_count || 0) / 10)}`}
                      transform="rotate(-90 36 36)"
                      className="progress-circle"
                    />
                  </svg>
                  <div className="progress-text">
                    {Math.round(((topic.file_count || 0) / 10) * 100)}%
                  </div>
                </div>
              </div>

              <div className="topic-stats">
                <span>{topic.file_count || 0} files</span>
                <span>{topic.total_pages || 0} pages</span>
              </div>

              <Link to={`/topics/${topic.id}`} className="topic-action">
                Start Sprint
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="activity-feed">
        <div className="section-header">
          <h2>Recent Activity</h2>
          <Link to="/analytics" className="section-action">
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">
              <BookOpen size={16} />
            </div>
            <div className="activity-content">
              <span className="activity-text">Read 10 pages of Microecon</span>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <Trophy size={16} />
            </div>
            <div className="activity-content">
              <span className="activity-text">Completed Sprint: Ch. 1</span>
              <span className="activity-time">Yesterday</span>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <Target size={16} />
            </div>
            <div className="activity-content">
              <span className="activity-text">Hit daily goal (60 min)</span>
              <span className="activity-time">2 days ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/files" className="quick-action">
          <Upload size={20} />
          <span>Upload PDF</span>
        </Link>
        <Link to="/topics" className="quick-action">
          <Activity size={20} />
          <span>Create Topic</span>
        </Link>
        <Link to="/analytics" className="quick-action">
          <TrendingUp size={20} />
          <span>View Analytics</span>
        </Link>
      </div>
    </div>
  );
};

export default AppleDashboard;
EOF

# 2. Enhanced Document Manager with Apple-style filtering
echo "📁 Creating Enhanced Document Manager..."
cat > frontend/src/components/enhanced/DocumentManager.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, FileText, Trash2, Star, Search, Filter, 
  Grid, List, MoreHorizontal, Eye, Edit3
} from 'lucide-react';
import api from '../../services/api';

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
EOF

# 3. Enhanced Topic Manager with Apple-style cards
echo "📂 Creating Enhanced Topic Manager..."
cat > frontend/src/components/enhanced/TopicManager.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Folder, Calendar, Target } from 'lucide-react';
import api from '../../services/api';

const TopicManager = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#8B5CF6',
    icon: '📚',
    deadline: ''
  });

  const availableIcons = [
    '📚', '💻', '🔬', '📊', '🎨', '🏛️', '🌍', '🧮', 
    '📝', '🎵', '⚖️', '🩺', '🏗️', '🔧', '🌱', '🎯'
  ];
  
  const availableColors = [
    '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', 
    '#EF4444', '#EC4899', '#84CC16', '#F97316'
  ];

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTopic) {
        await api.put(`/topics/${editingTopic.id}`, formData);
      } else {
        await api.post('/topics', formData);
      }
      
      loadTopics();
      resetForm();
    } catch (error) {
      console.error('Error saving topic:', error);
    }
  };

  const deleteTopic = async (topicId) => {
    if (!window.confirm('Are you sure? This will remove the topic from all files.')) return;

    try {
      await api.delete(`/topics/${topicId}`);
      loadTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  const editTopic = (topic) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.name,
      description: topic.description || '',
      color: topic.color,
      icon: topic.icon,
      deadline: topic.deadline || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTopic(null);
    setFormData({
      name: '',
      description: '',
      color: '#8B5CF6',
      icon: '📚',
      deadline: ''
    });
  };

  const getTopicProgress = (topic) => {
    const fileCount = topic.file_count || 0;
    const totalPages = topic.total_pages || 0;
    const completedPages = Math.floor(totalPages * 0.3); // Mock completion
    return {
      percentage: totalPages > 0 ? (completedPages / totalPages) * 100 : 0,
      completedPages,
      totalPages
    };
  };

  return (
    <div className="topic-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="header-content">
          <h1>Topics</h1>
          <p>Organize your study materials</p>
        </div>
        
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={20} />
          New Topic
        </button>
      </div>

      {/* Topic Grid */}
      <div className="topics-grid">
        {loading ? (
          <div className="loading-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="topic-skeleton" />
            ))}
          </div>
        ) : topics.length > 0 ? (
          topics.map(topic => {
            const progress = getTopicProgress(topic);
            return (
              <div key={topic.id} className="topic-card">
                <div className="topic-header">
                  <div 
                    className="topic-color-ribbon"
                    style={{ backgroundColor: topic.color }}
                  />
                  <div className="topic-info">
                    <div className="topic-title">
                      <span className="topic-icon">{topic.icon}</span>
                      <h3>{topic.name}</h3>
                    </div>
                    {topic.deadline && (
                      <div className="topic-deadline">
                        <Calendar size={14} />
                        <span>{new Date(topic.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="topic-actions">
                    <button onClick={() => editTopic(topic)}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteTopic(topic.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="topic-content">
                  {topic.description && (
                    <p className="topic-description">{topic.description}</p>
                  )}
                  
                  <div className="topic-progress">
                    <div className="progress-circle">
                      <svg width="80" height="80" viewBox="0 0 80 80">
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          fill="none"
                          stroke="rgba(0,0,0,0.1)"
                          strokeWidth="6"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          fill="none"
                          stroke={topic.color}
                          strokeWidth="6"
                          strokeDasharray={`${2 * Math.PI * 35}`}
                          strokeDashoffset={`${2 * Math.PI * 35 * (1 - progress.percentage / 100)}`}
                          transform="rotate(-90 40 40)"
                          className="progress-stroke"
                        />
                      </svg>
                      <div className="progress-text">
                        {Math.round(progress.percentage)}%
                      </div>
                    </div>
                    
                    <div className="progress-details">
                      <span>{progress.completedPages} / {progress.totalPages} pages</span>
                      <span>{topic.file_count || 0} files</span>
                    </div>
                  </div>
                </div>

                <div className="topic-footer">
                  <div className="topic-files">
                    <span className="file-count">{topic.file_count || 0} files</span>
                    <div className="file-previews">
                      {/* Mock file icons */}
                      {[...Array(Math.min(3, topic.file_count || 0))].map((_, i) => (
                        <div key={i} className="file-preview">
                          <Folder size={12} />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button className="start-sprint-btn">
                    <Target size={16} />
                    Start Sprint
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <Folder size={64} />
            <h3>No topics created yet</h3>
            <p>Create your first topic to organize your materials</p>
            <button 
              className="btn-primary"
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} />
              Create First Topic
            </button>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal apple-modal">
            <div className="modal-header">
              <h2>{editingTopic ? 'Edit Topic' : 'Create New Topic'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="topic-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g., Advanced Calculus"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of this topic"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Target Date</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Icon</label>
                <div className="icon-picker">
                  {availableIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-option ${formData.icon === icon ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, icon})}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({...formData, color})}
                    />
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTopic ? 'Update Topic' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicManager;
EOF

# 4. Enhanced PDF Reader with Apple-style interface
echo "📖 Creating Enhanced PDF Reader..."
cat > frontend/src/components/reader/AppleReaderInterface.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Home, Search, ZoomIn, ZoomOut, RotateCw, 
  Bookmark, Share, Moon, Sun, Timer, Target, Activity
} from 'lucide-react';
import api from '../../services/api';
import SinglePagePDFViewer from '../SinglePagePDFViewer';

const AppleReaderInterface = () => {
  const { fileId } = useParams();
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showToolbar, setShowToolbar] = useState(true);
  const [readerMode, setReaderMode] = useState('normal');
  const [sessionData, setSessionData] = useState({
    timeOnPage: 0,
    totalTime: 0,
    pagesRead: 0,
    estimatedRemaining: 0
  });

  useEffect(() => {
    loadFile();
    
    // Auto-hide toolbar after 5 seconds of inactivity
    const hideTimer = setTimeout(() => {
      setShowToolbar(false);
    }, 5000);

    const handleMouseMove = () => {
      setShowToolbar(true);
      clearTimeout(hideTimer);
      setTimeout(() => setShowToolbar(false), 5000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimer);
    };
  }, [fileId]);

  const loadFile = async () => {
    try {
      const response = await api.get(`/files/${fileId}/metadata`);
      setFileInfo(response.data);
    } catch (error) {
      console.error('Error loading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Update session data
    setSessionData(prev => ({
      ...prev,
      pagesRead: Math.max(prev.pagesRead, newPage),
      estimatedRemaining: calculateEstimatedTime(newPage)
    }));
  };

  const calculateEstimatedTime = (currentPage) => {
    if (!fileInfo) return 0;
    const remainingPages = fileInfo.page_count - currentPage;
    const avgTimePerPage = 2; // minutes
    return remainingPages * avgTimePerPage;
  };

  const toggleReaderMode = () => {
    setReaderMode(prev => prev === 'normal' ? 'focus' : 'normal');
  };

  if (loading) {
    return (
      <div className="reader-loading">
        <div className="loading-spinner" />
        <p>Loading document...</p>
      </div>
    );
  }

  if (!fileInfo) {
    return (
      <div className="reader-error">
        <h3>Document not found</h3>
        <Link to="/files" className="btn-primary">
          <ArrowLeft size={16} />
          Back to Files
        </Link>
      </div>
    );
  }

  return (
    <div className={`apple-reader ${readerMode}`}>
      {/* Three-Pane Layout */}
      <div className="reader-layout">
        {/* Left Thumbnails Panel */}
        <div className="thumbnails-panel">
          <div className="thumbnails-header">
            <h3>Pages</h3>
            <span className="page-count">{fileInfo.page_count}</span>
          </div>
          
          <div className="thumbnails-grid">
            {Array.from({ length: fileInfo.page_count }, (_, i) => (
              <div
                key={i + 1}
                className={`thumbnail ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => handlePageChange(i + 1)}
              >
                <div className="thumbnail-preview">
                  <span>{i + 1}</span>
                </div>
                <div className="thumbnail-label">
                  Page {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Viewer */}
        <div className="viewer-container">
          {/* Auto-hide Toolbar */}
          <div className={`reader-toolbar ${showToolbar ? 'visible' : 'hidden'}`}>
            <div className="toolbar-left">
              <Link to="/files" className="toolbar-btn">
                <ArrowLeft size={18} />
              </Link>
              <Link to="/" className="toolbar-btn">
                <Home size={18} />
              </Link>
              <div className="toolbar-divider" />
              <span className="document-title">{fileInfo.original_name}</span>
            </div>

            <div className="toolbar-center">
              <div className="page-navigator">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="nav-btn"
                >
                  ←
                </button>
                
                <div className="page-input">
                  <input
                    type="number"
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= fileInfo.page_count) {
                        handlePageChange(page);
                      }
                    }}
                    min="1"
                    max={fileInfo.page_count}
                  />
                  <span>of {fileInfo.page_count}</span>
                </div>
                
                <button
                  onClick={() => handlePageChange(Math.min(fileInfo.page_count, currentPage + 1))}
                  disabled={currentPage >= fileInfo.page_count}
                  className="nav-btn"
                >
                  →
                </button>
              </div>
            </div>

            <div className="toolbar-right">
              <button className="toolbar-btn">
                <Search size={18} />
              </button>
              <button className="toolbar-btn">
                <ZoomOut size={18} />
              </button>
              <button className="toolbar-btn">
                <ZoomIn size={18} />
              </button>
              <button className="toolbar-btn">
                <RotateCw size={18} />
              </button>
              <button className="toolbar-btn">
                <Bookmark size={18} />
              </button>
              <button 
                className="toolbar-btn"
                onClick={toggleReaderMode}
              >
                {readerMode === 'normal' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="pdf-viewer-area">
            <SinglePagePDFViewer
              fileUrl={`http://localhost:3001/uploads/${fileInfo.filename}`}
              totalPages={fileInfo.page_count}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              fileName={fileInfo.original_name}
            />
          </div>
        </div>

        {/* Right Slide-over Panel */}
        <div className="sidepanel-container">
          <div className="sidepanel-header">
            <h3>Study Session</h3>
            <div className="session-mode">
              <Activity size={16} />
              <span>Active</span>
            </div>
          </div>

          <div className="session-timer">
            <div className="timer-display">
              <Timer size={20} />
              <span className="time-text">
                {Math.floor(sessionData.totalTime / 60)}:{(sessionData.totalTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="timer-label">Session Time</div>
          </div>

          <div className="page-notes">
            <div className="notes-header">
              <h4>Page {currentPage} Notes</h4>
              <button className="add-note-btn">+</button>
            </div>
            <div className="notes-content">
              <p className="notes-placeholder">
                Click to add notes for this page...
              </p>
            </div>
          </div>

          <div className="session-progress">
            <div className="progress-item">
              <span className="progress-label">Pages Read</span>
              <span className="progress-value">{sessionData.pagesRead}</span>
            </div>
            <div className="progress-item">
              <span className="progress-label">Time Remaining</span>
              <span className="progress-value">{sessionData.estimatedRemaining}m</span>
            </div>
          </div>

          <div className="session-actions">
            <button className="btn-primary">
              <Target size={16} />
              Mark as Read
            </button>
            <button className="btn-secondary">
              <Bookmark size={16} />
              Bookmark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppleReaderInterface;
EOF

# 5. Enhanced Settings Page with macOS-style tabs
echo "⚙️ Creating Enhanced Settings Page..."
cat > frontend/src/components/enhanced/SettingsPage.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { 
  User, Settings, Palette, Download, Trash2, 
  Moon, Sun, Monitor, Save, Bell, Clock, Target
} from 'lucide-react';
import api from '../../services/api';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    profile: {
      name: 'Victor',
      email: 'victor@example.com',
      avatar: null
    },
    study: {
      dailyGoal: 60,
      pomodoroWork: 25,
      pomodoroBreak: 5,
      focusMode: true,
      notifications: true,
      autoSave: true
    },
    appearance: {
      theme: 'system',
      compactMode: false,
      animations: true
    }
  });
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'study', label: 'Study Preferences', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Export & Privacy', icon: Download }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/user-progress/stats');
      setSettings(prev => ({
        ...prev,
        study: {
          ...prev.study,
          dailyGoal: response.data.daily_goal || 60
        }
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/user-progress/settings/daily_study_goal_minutes', {
        value: settings.study.dailyGoal.toString()
      });
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'settings-toast success';
      toast.textContent = 'Settings saved successfully';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const exportData = async () => {
    try {
      const response = await api.get('/data/export');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_data_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const TabContent = ({ tab }) => {
    switch (tab) {
      case 'profile':
        return (
          <div className="settings-content">
            <div className="settings-group">
              <h3>Personal Information</h3>
              
              <div className="avatar-section">
                <div className="avatar-preview">
                  <div className="avatar-circle">
                    <User size={32} />
                  </div>
                </div>
                <div className="avatar-controls">
                  <button className="btn-secondary">Choose Photo</button>
                  <button className="btn-secondary">Remove</button>
                </div>
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={settings.profile.name}
                  onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>
        );

      case 'study':
        return (
          <div className="settings-content">
            <div className="settings-group">
              <h3>Study Goals</h3>
              
              <div className="form-group">
                <label>Daily Study Goal</label>
                <div className="slider-input">
                  <input
                    type="range"
                    min="15"
                    max="480"
                    step="15"
                    value={settings.study.dailyGoal}
                    onChange={(e) => updateSetting('study', 'dailyGoal', parseInt(e.target.value))}
                    className="slider"
                  />
                  <div className="slider-value">
                    <Clock size={16} />
                    <span>{settings.study.dailyGoal} minutes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h3>Pomodoro Timer</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Work Duration</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      value={settings.study.pomodoroWork}
                      onChange={(e) => updateSetting('study', 'pomodoroWork', parseInt(e.target.value))}
                      min="5"
                      max="60"
                    />
                    <span>min</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Break Duration</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      value={settings.study.pomodoroBreak}
                      onChange={(e) => updateSetting('study', 'pomodoroBreak', parseInt(e.target.value))}
                      min="5"
                      max="30"
                    />
                    <span>min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h3>Study Features</h3>
              
              <div className="toggle-group">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <label>Focus Mode</label>
                    <p>Hide distractions during study sessions</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.study.focusMode}
                      onChange={(e) => updateSetting('study', 'focusMode', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <label>Notifications</label>
                    <p>Get reminders and progress updates</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.study.notifications}
                      onChange={(e) => updateSetting('study', 'notifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <label>Auto-save Progress</label>
                    <p>Automatically save your reading progress</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.study.autoSave}
                      onChange={(e) => updateSetting('study', 'autoSave', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="settings-content">
            <div className="settings-group">
              <h3>Theme</h3>
              
              <div className="theme-options">
                <div 
                  className={`theme-option ${settings.appearance.theme === 'light' ? 'active' : ''}`}
                  onClick={() => updateSetting('appearance', 'theme', 'light')}
                >
                  <Sun size={24} />
                  <span>Light</span>
                </div>
                
                <div 
                  className={`theme-option ${settings.appearance.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => updateSetting('appearance', 'theme', 'dark')}
                >
                  <Moon size={24} />
                  <span>Dark</span>
                </div>
                
                <div 
                  className={`theme-option ${settings.appearance.theme === 'system' ? 'active' : ''}`}
                  onClick={() => updateSetting('appearance', 'theme', 'system')}
                >
                  <Monitor size={24} />
                  <span>System</span>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h3>Interface</h3>
              
              <div className="toggle-group">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <label>Compact Mode</label>
                    <p>Use smaller spacing and controls</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.appearance.compactMode}
                      onChange={(e) => updateSetting('appearance', 'compactMode', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <label>Animations</label>
                    <p>Enable smooth transitions and effects</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.appearance.animations}
                      onChange={(e) => updateSetting('appearance', 'animations', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="settings-content">
            <div className="settings-group">
              <h3>Data Export</h3>
              <p>Download all your study data for backup or transfer</p>
              
              <button className="btn-primary" onClick={exportData}>
                <Download size={16} />
                Download Data
              </button>
            </div>

            <div className="settings-group danger-zone">
              <h3>Danger Zone</h3>
              <p>Permanently delete your account and all data</p>
              
              <button className="btn-danger">
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Customize your study experience</p>
      </div>

      <div className="settings-container">
        {/* macOS-style Tab Navigation */}
        <div className="settings-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="settings-panel">
          <TabContent tab={activeTab} />
          
          <div className="settings-footer">
            <button 
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
EOF

# 6. Enhanced Sprint/Session Page
echo "🏃 Creating Enhanced Sprint Page..."
cat > frontend/src/components/enhanced/SprintPage.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Square, Timer, Target, BookOpen, 
  Trophy, Flame, BarChart3, CheckCircle
} from 'lucide-react';
import api from '../../services/api';

const SprintPage = () => {
  const [currentSprint, setCurrentSprint] = useState(null);
  const [sprintHistory, setSprintHistory] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sprintStats, setSprintStats] = useState({
    todaySessions: 0,
    totalXP: 0,
    streak: 0,
    averageTime: 0
  });

  useEffect(() => {
    loadSprintData();
    loadSprintHistory();
  }, []);

  useEffect(() => {
    let interval;
    if (sessionActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive]);

  const loadSprintData = async () => {
    try {
      const response = await api.get('/user-progress/stats');
      setSprintStats({
        todaySessions: response.data.today_progress?.pomodoros_completed || 0,
        totalXP: response.data.total_xp || 0,
        streak: response.data.current_streak || 0,
        averageTime: 25 // Mock average
      });
    } catch (error) {
      console.error('Error loading sprint data:', error);
    }
  };

  const loadSprintHistory = async () => {
    try {
      const response = await api.get('/pomodoro/stats');
      setSprintHistory(response.data.recent_sessions || []);
    } catch (error) {
      console.error('Error loading sprint history:', error);
    }
  };

  const startSprint = async (fileId, duration = 25) => {
    try {
      const response = await api.post('/pomodoro/start', {
        file_id: fileId,
        session_type: 'focus',
        duration_minutes: duration
      });
      
      setCurrentSprint({
        id: response.data.session.id,
        fileId,
        duration: duration * 60,
        startTime: Date.now()
      });
      setSessionActive(true);
      setSessionTime(0);
    } catch (error) {
      console.error('Error starting sprint:', error);
    }
  };

  const pauseSprint = () => {
    setSessionActive(false);
  };

  const resumeSprint = () => {
    setSessionActive(true);
  };

  const endSprint = async () => {
    if (!currentSprint) return;

    try {
      await api.post(`/pomodoro/end/${currentSprint.id}`, {
        actual_duration_seconds: sessionTime,
        was_interrupted: false,
        focus_rating: 4
      });
      
      setCurrentSprint(null);
      setSessionActive(false);
      setSessionTime(0);
      
      // Show completion feedback
      showCompletionFeedback();
      
      // Reload data
      loadSprintData();
      loadSprintHistory();
    } catch (error) {
      console.error('Error ending sprint:', error);
    }
  };

  const showCompletionFeedback = () => {
    const feedback = document.createElement('div');
    feedback.className = 'sprint-completion-toast';
    feedback.innerHTML = '🏆 Sprint Complete! +20 XP — 2m above average!';
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      document.body.removeChild(feedback);
    }, 3000);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    if (!currentSprint) return 0;
    return Math.max(0, currentSprint.duration - sessionTime);
  };

  return (
    <div className="sprint-page">
      <div className="sprint-header">
        <h1>Study Sprints</h1>
        <p>Focused study sessions for maximum productivity</p>
      </div>

      {/* Today's Sprint Card */}
      <div className="todays-sprint-card">
        {currentSprint ? (
          <div className="active-sprint">
            <div className="sprint-info">
              <h3>Active Sprint</h3>
              <p>Pages 11–20 • {Math.floor(currentSprint.duration / 60)}m session</p>
            </div>
            
            <div className="sprint-timer">
              <div className="timer-display">
                <Timer size={32} />
                <span className="time-text">
                  {formatTime(getTimeRemaining())}
                </span>
              </div>
              <div className="timer-progress">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${(sessionTime / currentSprint.duration) * 100}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="sprint-controls">
              {sessionActive ? (
                <button className="btn-secondary" onClick={pauseSprint}>
                  <Pause size={20} />
                  Pause
                </button>
              ) : (
                <button className="btn-primary" onClick={resumeSprint}>
                  <Play size={20} />
                  Resume
                </button>
              )}
              
              <button className="btn-primary" onClick={endSprint}>
                <CheckCircle size={20} />
                Mark as Done
              </button>
            </div>
          </div>
        ) : (
          <div className="start-sprint">
            <div className="sprint-preview">
              <h3>Ready for a Sprint?</h3>
              <p>Choose a duration and start your focused study session</p>
            </div>
            
            <div className="sprint-options">
              <button 
                className="sprint-option"
                onClick={() => startSprint('mock-file-id', 15)}
              >
                <Timer size={20} />
                <span>15 min</span>
              </button>
              
              <button 
                className="sprint-option primary"
                onClick={() => startSprint('mock-file-id', 25)}
              >
                <Timer size={20} />
                <span>25 min</span>
              </button>
              
              <button 
                className="sprint-option"
                onClick={() => startSprint('mock-file-id', 45)}
              >
                <Timer size={20} />
                <span>45 min</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sprint Stats */}
      <div className="sprint-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <h3>{sprintStats.todaySessions}</h3>
            <p>Sprints Today</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Trophy size={24} />
          </div>
          <div className="stat-content">
            <h3>{sprintStats.totalXP}</h3>
            <p>Total XP</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Flame size={24} />
          </div>
          <div className="stat-content">
            <h3>{sprintStats.streak}</h3>
            <p>Day Streak</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">