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
