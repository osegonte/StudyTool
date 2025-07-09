import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Grid, List, FileText, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const NotesDashboard = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [topics, setTopics] = useState([]);
  const [tags, setTags] = useState([]);

  const loadNotes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTopic) params.append('topic_id', selectedTopic);
      if (selectedTag) params.append('tag', selectedTag);
      if (selectedType) params.append('note_type', selectedType);

      const response = await api.get(`/notes?${params.toString()}`);
      setNotes(response.data.notes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedTopic, selectedTag, selectedType]);

  const loadTopics = useCallback(async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const response = await api.get('/notes/tags/list');
      setTags(response.data.tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }, []);

  useEffect(() => {
    loadNotes();
    loadTopics();
    loadTags();
  }, [loadNotes, loadTopics, loadTags]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type) => {
    const icons = {
      general: '📝',
      summary: '📋',
      question: '❓',
      concept: '💡',
      example: '📘',
      meeting: '🤝'
    };
    return icons[type] || '📝';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTopic('');
    setSelectedTag('');
    setSelectedType('');
  };

  const hasActiveFilters = searchTerm || selectedTopic || selectedTag || selectedType;

  if (loading) {
    return (
      <div className="notes-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading your notes...</p>
      </div>
    );
  }

  return (
    <div className="notes-dashboard">
      <div className="notes-header">
        <div className="header-top">
          <h1>📝 Smart Notes</h1>
          <Link to="/notes/new" className="btn btn-primary">
            <Plus size={16} />
            New Note
          </Link>
        </div>
        
        <div className="notes-stats">
          <div className="stat">
            <span className="stat-number">{notes.length}</span>
            <span className="stat-label">Notes</span>
          </div>
          <div className="stat">
            <span className="stat-number">{topics.length}</span>
            <span className="stat-label">Topics</span>
          </div>
          <div className="stat">
            <span className="stat-number">{tags.length}</span>
            <span className="stat-label">Tags</span>
          </div>
        </div>
      </div>

      <div className="notes-controls">
        <div className="search-section">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="filter-select"
          >
            <option value="">All Topics</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>
                {topic.icon} {topic.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="filter-select"
          >
            <option value="">All Tags</option>
            {tags.map(tag => (
              <option key={tag.tag_name} value={tag.tag_name}>
                #{tag.tag_name} ({tag.usage_count})
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="general">📝 General</option>
            <option value="summary">📋 Summary</option>
            <option value="question">❓ Question</option>
            <option value="concept">💡 Concept</option>
            <option value="example">📘 Example</option>
            <option value="meeting">🤝 Meeting</option>
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn btn-secondary btn-sm">
              Clear Filters
            </button>
          )}
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

      <div className={`notes-container ${viewMode}`}>
        {notes.length > 0 ? (
          notes.map(note => (
            <Link
              key={note.id}
              to={`/notes/${note.id}`}
              className="note-card"
            >
              <div className="note-header">
                <div className="note-type">
                  {getTypeIcon(note.note_type)}
                </div>
                <div className="note-meta">
                  <span className="note-date">{formatDate(note.updated_at)}</span>
                  {note.backlink_count > 0 && (
                    <span className="backlink-count">
                      <LinkIcon size={12} />
                      {note.backlink_count}
                    </span>
                  )}
                </div>
              </div>

              <div className="note-content">
                <h3 className="note-title">{note.title}</h3>
                <p className="note-preview">
                  {note.content.substring(0, 150)}
                  {note.content.length > 150 ? '...' : ''}
                </p>
              </div>

              <div className="note-footer">
                {note.topic_name && (
                  <span 
                    className="note-topic"
                    style={{ backgroundColor: note.topic_color || '#3B82F6' }}
                  >
                    {note.topic_icon} {note.topic_name}
                  </span>
                )}
                
                {note.tags && note.tags.length > 0 && (
                  <div className="note-tags">
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="note-tag">
                        #{tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="tag-more">+{note.tags.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="note-stats">
                  <span className="word-count">{note.word_count} words</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="empty-notes">
            <FileText size={64} />
            <h3>No notes found</h3>
            <p>
              {hasActiveFilters 
                ? 'Try adjusting your search or filters' 
                : 'Create your first note to get started'
              }
            </p>
            {!hasActiveFilters && (
              <Link to="/notes/new" className="btn btn-primary">
                <Plus size={16} />
                Create First Note
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesDashboard;
