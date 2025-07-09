#!/bin/bash

# Fix React Hook dependency warnings for Stage 5

echo "🔧 Fixing React Hook dependency warnings..."

# Fix NoteEditor.js
echo "📝 Updating NoteEditor.js..."
cat > frontend/src/components/notes/NoteEditor.js << 'EOF'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Eye, Edit3, Link, Paperclip, Hash, Calendar, FileText } from 'lucide-react';
import api from '../../services/api';

const NoteEditor = ({ noteId, onSave, onClose, initialData = null }) => {
  const [note, setNote] = useState({
    title: '',
    content: '',
    topic_id: null,
    note_type: 'general',
    tags: []
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [topics, setTopics] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [linkedNotes, setLinkedNotes] = useState([]);
  const [showLinkSuggestions, setShowLinkSuggestions] = useState(false);
  const [linkSuggestions, setLinkSuggestions] = useState([]);
  const contentRef = useRef(null);

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
      setAvailableTags(response.data.tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }, []);

  const loadNote = useCallback(async () => {
    if (!noteId) return;
    
    try {
      const response = await api.get(`/notes/${noteId}`);
      setNote(response.data.note);
      setLinkedNotes(response.data.linked_notes || []);
    } catch (error) {
      console.error('Error loading note:', error);
    }
  }, [noteId]);

  useEffect(() => {
    loadTopics();
    loadTags();
    if (noteId) {
      loadNote();
    } else if (initialData) {
      setNote({ ...note, ...initialData });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, loadTopics, loadTags, loadNote, initialData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = noteId ? `/notes/${noteId}` : '/notes';
      const method = noteId ? 'put' : 'post';
      
      const response = await api[method](endpoint, note);
      
      if (response.data.success) {
        onSave?.(response.data.note);
        if (!noteId) {
          // Redirect to edit the newly created note
          window.history.pushState({}, '', `/notes/${response.data.note.id}`);
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (value) => {
    setNote({ ...note, content: value });
    
    // Check for [[]] link patterns
    const linkPattern = /\[\[([^\]]*)\]\]/g;
    const matches = value.match(linkPattern);
    
    if (matches) {
      // Show link suggestions for incomplete links
      const lastMatch = matches[matches.length - 1];
      if (lastMatch.length > 2 && lastMatch.length < 50) {
        searchNotesForLinks(lastMatch.slice(2, -2));
      }
    } else {
      setShowLinkSuggestions(false);
    }
  };

  const searchNotesForLinks = async (query) => {
    if (query.length < 2) return;
    
    try {
      const response = await api.get(`/notes/search/${encodeURIComponent(query)}`);
      setLinkSuggestions(response.data.results.slice(0, 5));
      setShowLinkSuggestions(true);
    } catch (error) {
      console.error('Error searching for link suggestions:', error);
    }
  };

  const insertLink = (noteTitle) => {
    const content = note.content;
    const newContent = content.replace(/\[\[([^\]]*)\]\]$/, `[[${noteTitle}]]`);
    setNote({ ...note, content: newContent });
    setShowLinkSuggestions(false);
  };

  const addTag = () => {
    if (newTag.trim() && !note.tags.includes(newTag.trim())) {
      setNote({
        ...note,
        tags: [...note.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNote({
      ...note,
      tags: note.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const renderPreview = () => {
    let content = note.content;
    
    // Convert [[links]] to clickable links
    content = content.replace(/\[\[([^\]]+)\]\]/g, '<a href="#" class="note-link">$1</a>');
    
    // Convert markdown-style formatting
    content = content.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    content = content.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    content = content.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');
    content = content.replace(/^- (.+)$/gm, '<li>$1</li>');
    content = content.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    content = content.replace(/\n/g, '<br>');

    return { __html: content };
  };

  const noteTypeOptions = [
    { value: 'general', label: 'General', icon: '📝' },
    { value: 'summary', label: 'Summary', icon: '📋' },
    { value: 'question', label: 'Question', icon: '❓' },
    { value: 'concept', label: 'Concept', icon: '💡' },
    { value: 'example', label: 'Example', icon: '📘' },
    { value: 'meeting', label: 'Meeting', icon: '🤝' }
  ];

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <div className="note-title-section">
          <input
            type="text"
            placeholder="Note title..."
            value={note.title}
            onChange={(e) => setNote({ ...note, title: e.target.value })}
            className="note-title-input"
          />
        </div>

        <div className="note-controls">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`btn btn-secondary ${previewMode ? 'active' : ''}`}
          >
            {previewMode ? <Edit3 size={16} /> : <Eye size={16} />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !note.title.trim()}
            className="btn btn-primary"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="note-metadata">
        <div className="metadata-row">
          <div className="form-group">
            <label>Topic</label>
            <select
              value={note.topic_id || ''}
              onChange={(e) => setNote({ ...note, topic_id: e.target.value || null })}
              className="form-control"
            >
              <option value="">No topic</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>
                  {topic.icon} {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={note.note_type}
              onChange={(e) => setNote({ ...note, note_type: e.target.value })}
              className="form-control"
            >
              {noteTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="metadata-row">
          <div className="form-group tags-group">
            <label>Tags</label>
            <div className="tags-container">
              <div className="current-tags">
                {note.tags.map(tag => (
                  <span key={tag} className="tag">
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="add-tag">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="tag-input"
                />
                <button onClick={addTag} className="btn btn-sm btn-secondary">
                  <Hash size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="note-content-area">
        {previewMode ? (
          <div 
            className="note-preview"
            dangerouslySetInnerHTML={renderPreview()}
          />
        ) : (
          <div className="note-editor-container">
            <textarea
              ref={contentRef}
              value={note.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing your note... Use [[Note Title]] to link to other notes."
              className="note-content-editor"
            />
            
            {showLinkSuggestions && (
              <div className="link-suggestions">
                <h4>Link to existing note:</h4>
                {linkSuggestions.map(suggestion => (
                  <button
                    key={suggestion.id}
                    onClick={() => insertLink(suggestion.title)}
                    className="link-suggestion"
                  >
                    <Link size={14} />
                    {suggestion.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {linkedNotes.length > 0 && (
        <div className="linked-notes-section">
          <h4>Linked Notes</h4>
          <div className="linked-notes">
            {linkedNotes.map(linkedNote => (
              <a
                key={linkedNote.id}
                href={`/notes/${linkedNote.id}`}
                className="linked-note"
              >
                <FileText size={14} />
                {linkedNote.title}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="note-help">
        <details>
          <summary>Formatting Help</summary>
          <div className="help-content">
            <p><strong>Markdown shortcuts:</strong></p>
            <ul>
              <li><code># Heading 1</code></li>
              <li><code>## Heading 2</code></li>
              <li><code>**bold text**</code></li>
              <li><code>*italic text*</code></li>
              <li><code>- bullet point</code></li>
              <li><code>[[Note Title]]</code> - Link to another note</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
};

export default NoteEditor;
EOF

# Fix NotesDashboard.js
echo "📋 Updating NotesDashboard.js..."
cat > frontend/src/components/notes/NotesDashboard.js << 'EOF'
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, Grid, List, Tag, Calendar, FileText, Link as LinkIcon } from 'lucide-react';
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
EOF

echo "✅ Fixed React Hook dependency warnings!"
echo ""
echo "Changes made:"
echo "• Added useCallback hooks to prevent unnecessary re-renders"
echo "• Fixed useEffect dependency arrays to include all dependencies"
echo "• Added proper eslint-disable comments where needed"
echo ""
echo "The warnings should now be resolved when you restart the development server."