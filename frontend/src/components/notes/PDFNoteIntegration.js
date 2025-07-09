import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, StickyNote } from 'lucide-react';
import api from '../../services/api';

const PDFNoteIntegration = ({ fileId, currentPage, selectedText, onNoteCreated }) => {
  const [notes, setNotes] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    note_type: 'general'
  });

  const loadPageNotes = useCallback(async () => {
    try {
      const response = await api.get(`/notes?file_id=${fileId}`);
      // Filter notes that have PDF anchors for this page
      const pageNotes = response.data.notes.filter(note => 
        note.file_id === fileId
      );
      setNotes(pageNotes);
    } catch (error) {
      console.error('Error loading page notes:', error);
    }
  }, [fileId]);

  useEffect(() => {
    loadPageNotes();
  }, [fileId, currentPage, loadPageNotes]);

  const handleCreateNote = async () => {
    try {
      const noteData = {
        ...newNote,
        file_id: fileId,
        content: selectedText ? `> ${selectedText}\n\n${newNote.content}` : newNote.content
      };

      const response = await api.post('/notes', noteData);
      
      if (response.data.success) {
        // Create PDF anchor
        await api.post(`/notes/${response.data.note.id}/pdf-anchor`, {
          file_id: fileId,
          page_number: currentPage,
          anchor_text: selectedText,
          position_data: { page: currentPage }
        });

        setNewNote({ title: '', content: '', note_type: 'general' });
        setShowCreateForm(false);
        loadPageNotes();
        onNoteCreated?.(response.data.note);
      }
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      general: '📝',
      summary: '📋',
      question: '❓',
      concept: '💡',
      example: '📘'
    };
    return icons[type] || '📝';
  };

  return (
    <div className="pdf-note-integration">
      <div className="notes-panel-header">
        <h4>📝 Notes</h4>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-sm btn-primary"
        >
          <Plus size={14} />
          New Note
        </button>
      </div>

      {selectedText && (
        <div className="selected-text-preview">
          <h5>Selected Text:</h5>
          <blockquote>"{selectedText.substring(0, 100)}..."</blockquote>
        </div>
      )}

      {showCreateForm && (
        <div className="create-note-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <select
              value={newNote.note_type}
              onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value })}
              className="form-control"
            >
              <option value="general">📝 General Note</option>
              <option value="summary">📋 Summary</option>
              <option value="question">❓ Question</option>
              <option value="concept">💡 Concept</option>
              <option value="example">📘 Example</option>
            </select>
          </div>

          <div className="form-group">
            <textarea
              placeholder="Write your note..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="form-control"
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button
              onClick={handleCreateNote}
              disabled={!newNote.title.trim()}
              className="btn btn-primary btn-sm"
            >
              Create Note
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="page-notes-list">
        {notes.length > 0 ? (
          notes.slice(0, 5).map(note => (
            <div key={note.id} className="page-note-item">
              <div className="note-header">
                <span className="note-type-icon">
                  {getTypeIcon(note.note_type)}
                </span>
                <h5 className="note-title">{note.title}</h5>
                <a
                  href={`/notes/${note.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="note-edit-link"
                >
                  <Edit3 size={12} />
                </a>
              </div>
              
              <p className="note-preview">
                {note.content.substring(0, 100)}
                {note.content.length > 100 ? '...' : ''}
              </p>

              {note.tags && note.tags.length > 0 && (
                <div className="note-tags">
                  {note.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="note-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-notes">
            <StickyNote size={32} />
            <p>No notes for this document yet</p>
            {selectedText && (
              <p className="suggestion">
                Create a note about the selected text!
              </p>
            )}
          </div>
        )}
      </div>

      {notes.length > 5 && (
        <div className="notes-summary">
          <a href="/notes" target="_blank" rel="noopener noreferrer">
            View all {notes.length} notes →
          </a>
        </div>
      )}
    </div>
  );
};

export default PDFNoteIntegration;
