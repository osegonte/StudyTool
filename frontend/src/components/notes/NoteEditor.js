import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Eye, Edit3, Link, Hash, FileText } from 'lucide-react';
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
    if (noteId) {
      loadNote();
    } else if (initialData) {
      setNote({ ...note, ...initialData });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, loadTopics, loadNote, initialData]);

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
