import React, { useState, useRef, useEffect } from 'react';
import { Save, X, Hash, StickyNote } from 'lucide-react';
import api from '../../services/api';

const QuickNoteModal = ({ 
  isOpen, 
  onClose, 
  fileId, 
  currentPage, 
  onNoteSaved,
  initialContent = ''
}) => {
  const [note, setNote] = useState({
    title: '',
    content: initialContent,
    note_type: 'general',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialContent) {
      setNote(prev => ({ ...prev, content: initialContent }));
    }
  }, [initialContent]);

  const handleSave = async () => {
    if (!note.title.trim()) return;
    
    setSaving(true);
    try {
      const response = await api.post('/notes', {
        ...note,
        file_id: fileId
      });

      if (response.data.success) {
        // Create PDF anchor if we have content
        if (note.content.trim()) {
          await api.post(`/notes/${response.data.note.id}/pdf-anchor`, {
            file_id: fileId,
            page_number: currentPage,
            anchor_text: note.content.substring(0, 100),
            position_data: { page: currentPage }
          });
        }

        onNoteSaved?.(response.data.note);
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNote({
      title: '',
      content: '',
      note_type: 'general',
      tags: []
    });
    setNewTag('');
  };

  const addTag = () => {
    if (newTag.trim() && !note.tags.includes(newTag.trim())) {
      setNote(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="quick-note-modal-overlay" onClick={onClose}>
      <div 
        className="quick-note-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <div className="header-left">
            <StickyNote size={18} />
            <span>Quick Note</span>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={16} />
          </button>
        </div>

        <div className="modal-content">
          <div className="form-group">
            <input
              ref={titleInputRef}
              type="text"
              placeholder="Note title..."
              value={note.title}
              onChange={(e) => setNote(prev => ({ ...prev, title: e.target.value }))}
              className="title-input"
            />
          </div>

          <div className="form-row">
            <select
              value={note.note_type}
              onChange={(e) => setNote(prev => ({ ...prev, note_type: e.target.value }))}
              className="type-select"
            >
              <option value="general">📝 General</option>
              <option value="summary">📋 Summary</option>
              <option value="question">❓ Question</option>
              <option value="concept">💡 Concept</option>
              <option value="example">📘 Example</option>
            </select>
          </div>

          <div className="form-group">
            <textarea
              placeholder="Write your note... (Ctrl+Enter to save)"
              value={note.content}
              onChange={(e) => setNote(prev => ({ ...prev, content: e.target.value }))}
              className="content-textarea"
              rows={6}
            />
          </div>

          {note.tags.length > 0 && (
            <div className="tags-display">
              {note.tags.map(tag => (
                <span key={tag} className="tag-chip">
                  #{tag}
                  <button onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
            </div>
          )}

          <div className="tag-input-row">
            <input
              type="text"
              placeholder="Add tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              className="tag-input"
            />
            <button onClick={addTag} className="tag-btn">
              <Hash size={14} />
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <div className="page-info">
            Page {currentPage}
          </div>
          <div className="actions">
            <button
              onClick={handleSave}
              disabled={saving || !note.title.trim()}
              className="save-btn primary"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickNoteModal;
