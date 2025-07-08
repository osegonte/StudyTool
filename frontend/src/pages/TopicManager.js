import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Folder } from 'lucide-react';
import api from '../services/api';

const TopicManager = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '📚'
  });

  const availableIcons = ['📚', '💻', '🔬', '📊', '🎨', '🏛️', '🌍', '🧮', '📝', '🎵'];
  const availableColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

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
      alert('Failed to save topic');
    }
  };

  const deleteTopic = async (topicId) => {
    if (!window.confirm('Are you sure? This will remove the topic from all associated files.')) return;

    try {
      await api.delete(`/topics/${topicId}`);
      loadTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic');
    }
  };

  const editTopic = (topic) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.name,
      description: topic.description || '',
      color: topic.color,
      icon: topic.icon
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTopic(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '📚'
    });
  };

  return (
    <div className="topic-manager">
      <div className="page-header">
        <h1>Topic Manager</h1>
        <p>Organize your study materials by subject</p>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={20} />
          New Topic
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
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
                  placeholder="e.g., Microeconomics"
                />
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of this topic"
                  rows={3}
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
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTopic ? 'Update Topic' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading topics...</div>
      ) : (
        <div className="topics-grid">
          {topics.length > 0 ? (
            topics.map(topic => (
              <div key={topic.id} className="topic-card">
                <div className="topic-header">
                  <div className="topic-info">
                    <span className="topic-icon">{topic.icon}</span>
                    <div>
                      <h3>{topic.name}</h3>
                      {topic.description && <p>{topic.description}</p>}
                    </div>
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
                <div 
                  className="topic-color-bar" 
                  style={{ backgroundColor: topic.color }}
                />
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Folder size={48} />
              <h3>No topics created yet</h3>
              <p>Create your first topic to organize your study materials</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                Create First Topic
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TopicManager;
