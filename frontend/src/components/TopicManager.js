import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Folder, Calendar, Target, 
  BookOpen, Clock, TrendingUp, Archive,
  MoreHorizontal, Play, Eye, Settings,
  Grid, List, Search, X, CheckCircle
} from 'lucide-react';
import api from "../services/api";

const TopicManager = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#8B5CF6',
    icon: '📚',
    target_completion_date: '',
    estimated_hours: '',
    priority: 3
  });

  const availableIcons = [
    '📚', '💻', '🔬', '📊', '🎨', '🏛️', '🌍', '🧮', 
    '📝', '🎵', '⚖️', '🩺', '🏗️', '🔧', '🌱', '🎯',
    '📖', '🎓', '📈', '🔥', '💡', '🚀', '⭐', '🏆'
  ];
  
  const availableColors = [
    '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', 
    '#EF4444', '#EC4899', '#84CC16', '#F97316',
    '#6366F1', '#8B5A2B', '#059669', '#DC2626'
  ];

  const priorityLevels = [
    { value: 1, label: 'Low', color: '#94A3B8' },
    { value: 2, label: 'Medium', color: '#3B82F6' },
    { value: 3, label: 'High', color: '#F59E0B' },
    { value: 4, label: 'Urgent', color: '#EF4444' },
    { value: 5, label: 'Critical', color: '#DC2626' }
  ];

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await api.get('/topics');
      // Use real data from API without mock additions
      setTopics(response.data);    } catch (error) {
      console.error('Error loading topics:', error);
      // Set empty array as fallback
      setTopics([]);
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
      target_completion_date: topic.target_completion_date || '',
      estimated_hours: topic.estimated_hours || '',
      priority: topic.priority || 3
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
      target_completion_date: '',
      estimated_hours: '',
      priority: 3
    });
  };

  const archiveTopic = async (topicId) => {
    try {
      await api.patch(`/topics/${topicId}`, { is_archived: true });
      loadTopics();
    } catch (error) {
      console.error('Error archiving topic:', error);
    }
  };

  const startStudySprint = (topic) => {
    // Navigation to study sprint with topic context
    console.log('Starting study sprint for:', topic.name);
  };

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' ||
                         (selectedFilter === 'active' && !topic.is_archived) ||
                         (selectedFilter === 'completed' && topic.completion_percentage >= 100) ||
                         (selectedFilter === 'in-progress' && topic.completion_percentage > 0 && topic.completion_percentage < 100) ||
                         (selectedFilter === 'not-started' && topic.completion_percentage === 0);
    
    return matchesSearch && matchesFilter;
  });

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return '#10B981'; // Green
    if (percentage >= 70) return '#3B82F6'; // Blue
    if (percentage >= 40) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const getDaysUntilDeadline = (date) => {
    if (!date) return null;
    const today = new Date();
    const deadline = new Date(date);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const TopicCard = ({ topic }) => {
    const daysUntilDeadline = getDaysUntilDeadline(topic.target_completion_date);
    const progressColor = getProgressColor(topic.completion_percentage || 0);
    const priorityInfo = priorityLevels.find(p => p.value === (topic.priority || 3)) || priorityLevels[2]; // Default to High priority

    return (
      <div className="topic-card">
        <div className="topic-header">
          <div 
            className="topic-color-ribbon"
            style={{ backgroundColor: topic.color || '#8B5CF6' }}
          />
          
          <div className="topic-main-info">
            <div className="topic-title-section">
              <div className="topic-icon-title">
                <span className="topic-icon" style={{ fontSize: '24px' }}>{topic.icon || '📚'}</span>
                <div>
                  <h3 className="topic-name">{topic.name || 'Untitled Topic'}</h3>
                  <div className="topic-badges">
                    <span 
                      className="priority-badge"
                      style={{ 
                        backgroundColor: `${priorityInfo.color}20`,
                        color: priorityInfo.color,
                        border: `1px solid ${priorityInfo.color}30`
                      }}
                    >
                      {priorityInfo.label}
                    </span>
                    {(topic.current_streak || 0) > 0 && (
                      <span className="streak-badge">
                        🔥 {topic.current_streak} day streak
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="topic-actions">
                <button 
                  onClick={() => startStudySprint(topic)}
                  className="action-btn primary"
                  title="Start Study Sprint"
                >
                  <Play size={16} />
                </button>
                <div className="action-menu">
                  <button className="action-btn">
                    <MoreHorizontal size={16} />
                  </button>
                  <div className="action-dropdown">
                    <button onClick={() => editTopic(topic)}>
                      <Edit2 size={14} />
                      Edit Topic
                    </button>
                    <button onClick={() => archiveTopic(topic.id)}>
                      <Archive size={14} />
                      Archive
                    </button>
                    <button 
                      onClick={() => deleteTopic(topic.id)}
                      className="danger"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {topic.description && (
              <p className="topic-description">{topic.description}</p>
            )}
          </div>
        </div>

        <div className="topic-stats">
          <div className="stat-item">
            <BookOpen size={16} />
            <span>{topic.file_count || 0} files</span>
          </div>
          <div className="stat-item">
            <Target size={16} />
            <span>{topic.total_pages || 0} pages</span>
          </div>
          <div className="stat-item">
            <Clock size={16} />
            <span>{topic.total_study_time || 0}h studied</span>
          </div>
          {daysUntilDeadline !== null && (
            <div className={`stat-item ${daysUntilDeadline < 7 ? 'urgent' : ''}`}>
              <Calendar size={16} />
              <span>
                {daysUntilDeadline > 0 
                  ? `${daysUntilDeadline} days left`
                  : daysUntilDeadline === 0 
                    ? 'Due today'
                    : `${Math.abs(daysUntilDeadline)} days overdue`
                }
              </span>
            </div>
          )}
        </div>

        <div className="topic-progress">
          <div className="progress-header">
            <span className="progress-label">Progress</span>
            <span className="progress-percentage">{topic.completion_percentage || 0}%</span>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${topic.completion_percentage || 0}%`,
                backgroundColor: progressColor
              }}
            />
          </div>
          
          <div className="progress-details">
            <span>{topic.completed_pages || 0} / {topic.total_pages || 0} pages completed</span>
            <span className="last-studied">
              Last studied {topic.last_studied ? topic.last_studied.toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>

        <div className="topic-footer">
          <button 
            onClick={() => startStudySprint(topic)}
            className="start-sprint-btn"
          >
            <Play size={16} />
            Start Sprint
          </button>
          
          <div className="quick-actions">
            <button className="quick-action" title="View Files">
              <Eye size={16} />
            </button>
            <button className="quick-action" title="Analytics">
              <TrendingUp size={16} />
            </button>
            <button className="quick-action" title="Settings">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="topic-manager">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">📁 Topics</h1>
            <p className="page-subtitle">Organize your study materials by subject and track progress</p>
          </div>
          
          <div className="header-stats">
            <div className="mini-stat">
              <div className="mini-stat-icon">
                <Folder size={20} />
              </div>
              <div className="mini-stat-content">
                <div className="mini-stat-value">{topics.length}</div>
                <div className="mini-stat-label">Topics</div>
              </div>
            </div>
            
            <div className="mini-stat">
              <div className="mini-stat-icon">
                <Target size={20} />
              </div>
              <div className="mini-stat-content">
                <div className="mini-stat-value">
                  {Math.round(topics.reduce((acc, t) => acc + t.completion_percentage, 0) / topics.length) || 0}%
                </div>
                <div className="mini-stat-label">Avg Progress</div>
              </div>
            </div>
            
            <div className="mini-stat">
              <div className="mini-stat-icon">
                <Clock size={20} />
              </div>
              <div className="mini-stat-content">
                <div className="mini-stat-value">
                  {topics.reduce((acc, t) => acc + t.total_study_time, 0)}h
                </div>
                <div className="mini-stat-label">Total Time</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={20} />
            Create Topic
          </button>
        </div>
      </div>

      {/* Enhanced Filter Bar */}
      <div className="filter-bar">
        <div className="filter-main">
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search topics..."
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
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Topics</option>
              <option value="active">Active</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="not-started">Not Started</option>
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

      {/* Topics Grid/List */}
      <div className={`topics-container ${viewMode}`}>
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your topics...</p>
          </div>
        ) : filteredTopics.length > 0 ? (
          filteredTopics.map(topic => (
            <TopicCard key={topic.id} topic={topic} />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Folder size={80} />
            </div>
            <h3 className="empty-title">
              {searchTerm || selectedFilter !== 'all' 
                ? 'No topics found' 
                : 'No topics created yet'
              }
            </h3>
            <p className="empty-description">
              {searchTerm || selectedFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first topic to organize your study materials by subject'
              }
            </p>
            {!searchTerm && selectedFilter === 'all' && (
              <button 
                className="empty-action"
                onClick={() => setShowForm(true)}
              >
                <Plus size={16} />
                Create Your First Topic
              </button>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Modal Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal enhanced-modal">
            <div className="modal-header">
              <h2>{editingTopic ? 'Edit Topic' : 'Create New Topic'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="enhanced-topic-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Topic Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g., Advanced Calculus"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    className="form-select"
                  >
                    {priorityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of this study topic"
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Completion Date</label>
                  <input
                    type="date"
                    value={formData.target_completion_date}
                    onChange={(e) => setFormData({...formData, target_completion_date: e.target.value})}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Estimated Hours</label>
                  <input
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
                    placeholder="e.g., 40"
                    min="1"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Icon</label>
                <div className="icon-picker enhanced">
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
                <label>Color Theme</label>
                <div className="color-picker enhanced">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({...formData, color})}
                    >
                      {formData.color === color && <CheckCircle size={16} color="white" />}
                    </button>
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