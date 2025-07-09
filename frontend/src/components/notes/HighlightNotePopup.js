import React, { useState, useEffect } from 'react';
import { Save, StickyNote, Hash, X } from 'lucide-react';
import api from '../../services/api';

const HighlightNotePopup = ({ 
  selectedText, 
  position, 
  fileId, 
  currentPage, 
  onClose, 
  onNoteSaved 
}) => {
  const [noteTitle, setNoteTitle] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Auto-generate title from selected text
    if (selectedText) {
      const title = selectedText.length > 50 
        ? selectedText.substring(0, 47) + '...'
        : selectedText;
      setNoteTitle(title);
    }
  }, [selectedText]);

  const handleSave = async () => {
    if (!noteTitle.trim()) return;
    
    setSaving(true);
    try {
      // Create note with highlighted text
      const noteContent = `> ${selectedText}\n\n*From page ${currentPage}*\n\n`;
      
      const response = await api.post('/notes', {
        title: noteTitle,
        content: noteContent,
        note_type: noteType,
        file_id: fileId,
        tags: tags
      });

      if (response.data.success) {
        // Create PDF anchor
        await api.post(`/notes/${response.data.note.id}/pdf-anchor`, {
          file_id: fileId,
          page_number: currentPage,
          anchor_text: selectedText,
          position_data: { page: currentPage, x: position.x, y: position.y }
        });

        onNoteSaved?.(response.data.note);
        onClose();
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="highlight-note-popup"
      style={{
        position: 'absolute',
        top: position.y + 20,
        left: position.x,
        zIndex: 1000
      }}
      onKeyDown={handleKeyPress}
    >
      <div className="popup-content">
        <div className="popup-header">
          <StickyNote size={16} />
          <span>Quick Note</span>
          <button onClick={onClose} className="close-btn">
            <X size={14} />
          </button>
        </div>

        <div className="selected-preview">
          <span className="preview-text">"{selectedText.substring(0, 100)}..."</span>
        </div>

        <div className="note-form">
          <input
            type="text"
            placeholder="Note title..."
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="note-title-input"
            autoFocus
          />

          <div className="form-row">
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="note-type-select"
            >
              <option value="general">📝 Note</option>
              <option value="summary">📋 Summary</option>
              <option value="question">❓ Question</option>
              <option value="concept">💡 Concept</option>
              <option value="example">📘 Example</option>
            </select>
          </div>

          {tags.length > 0 && (
            <div className="tags-preview">
              {tags.map(tag => (
                <span key={tag} className="tag-chip">
                  #{tag}
                  <button onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
            </div>
          )}

          <div className="tag-input">
            <input
              type="text"
              placeholder="Add tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              className="tag-field"
            />
            <button onClick={addTag} className="tag-add-btn">
              <Hash size={12} />
            </button>
          </div>

          <div className="popup-actions">
            <button
              onClick={handleSave}
              disabled={saving || !noteTitle.trim()}
              className="save-btn"
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

export default HighlightNotePopup;
