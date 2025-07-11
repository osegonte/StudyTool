// frontend/src/components/viewer/NotesPanel.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Search, Tag, Link2, Bookmark, Hash, 
  Edit3, Save, X, ChevronDown, ChevronRight,
  FileText, Clock, Paperclip, Eye, ExternalLink
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';

const NotesPanel = ({ 
  fileId, 
  currentPage, 
  bookmarks, 
  onBookmarkClick 
}) => {
  // Notes state
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteTags, setNoteTags] = useState([]);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    currentPage: true,
    allNotes: true,
    bookmarks: true,
    linkedNotes: false
  });
  
  // Links and references
  const [linkedNotes, setLinkedNotes] = useState([]);
  const [backlinks, setBacklinks] = useState([]);
  const [allTags, setAllTags] = useState([]);
  
  // Auto-save
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Load notes on mount and when fileId/currentPage changes
  useEffect(() => {
    loadNotes();
    loadTags();
  }, [fileId]);
  
  useEffect(() => {
    loadPageNotes();
  }, [currentPage]);
  
  // Auto-save functionality
  useEffect(() => {
    if (isDirty && activeNote && noteContent) {
      clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => {
        saveNote();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }
    
    return () => clearTimeout(autoSaveRef.current);
  }, [noteContent, noteTitle, noteTags, isDirty]);
  
  const loadNotes = async () => {
    try {
      const response = await api.get(`/notes?file_id=${fileId}`);
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };
  
  const loadPageNotes = async () => {
    try {
      const response = await api.get(`/notes?file_id=${fileId}&page=${currentPage}`);
      const pageNotes = response.data.notes || [];
      
      // Auto-select the first note for current page if available
      if (pageNotes.length > 0 && !activeNote) {
        selectNote(pageNotes[0]);
      }
    } catch (error) {
      console.error('Error loading page notes:', error);
    }
  };
  
  const loadTags = async () => {
    try {
      const response = await api.get('/notes/tags');
      setAllTags(response.data.tags || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };
  
  const loadLinkedNotes = async (noteId) => {
    try {
      const response = await api.get(`/notes/${noteId}/links`);
      setLinkedNotes(response.data.linked || []);
      setBacklinks(response.data.backlinks || []);
    } catch (error) {
      console.error('Error loading linked notes:', error);
    }
  };
  
  const selectNote = (note) => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Save before switching notes?')) {
        saveNote();
      }
    }
    
    setActiveNote(note);
    setNoteContent(note.content || '');
    setNoteTitle(note.title || '');
    setNoteTags(note.tags || []);
    setIsEditing(false);
    setIsDirty(false);
    
    if (note.id) {
      loadLinkedNotes(note.id);
    }
  };
  
  const createNewNote = () => {
    const newNote = {
      id: null,
      title: `Notes for Page ${currentPage}`,
      content: '',
      page_reference: currentPage,
      file_id: fileId,
      tags: [],
      created_at: new Date().toISOString()
    };
    
    setActiveNote(newNote);
    setNoteContent('');
    setNoteTitle(newNote.title);
    setNoteTags([]);
    setIsEditing(true);
    setIsDirty(false);
    
    // Focus the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };
  
  const saveNote = async () => {
    if (!activeNote) return;
    
    try {
      const noteData = {
        title: noteTitle,
        content: noteContent,
        tags: noteTags,
        file_id: fileId,
        page_reference: currentPage,
        note_type: 'study'
      };
      
      let response;
      if (activeNote.id) {
        response = await api.put(`/notes/${activeNote.id}`, noteData);
      } else {
        response = await api.post('/notes', noteData);
      }
      
      const savedNote = response.data.note;
      setActiveNote(savedNote);
      setIsDirty(false);
      setLastSaved(new Date());
      
      // Update notes list
      if (activeNote.id) {
        setNotes(prev => prev.map(n => n.id === savedNote.id ? savedNote : n));
      } else {
        setNotes(prev => [savedNote, ...prev]);
      }
      
      // Process note links
      await processNoteLinks(savedNote.id, noteContent);
      
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };
  
  const processNoteLinks = async (noteId, content) => {
    // Extract [[Note Title]] links
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    const matches = [...content.matchAll(linkRegex)];
    
    for (const match of matches) {
      const linkedTitle = match[1];
      try {
        await api.post('/notes/links', {
          source_note_id: noteId,
          target_title: linkedTitle,
          link_text: linkedTitle
        });
      } catch (error) {
        console.error('Error creating note link:', error);
      }
    }
  };
  
  const deleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      
      if (activeNote?.id === noteId) {
        setActiveNote(null);
        setNoteContent('');
        setNoteTitle('');
        setNoteTags([]);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };
  
  const addTag = (tag) => {
    if (tag && !noteTags.includes(tag)) {
      setNoteTags(prev => [...prev, tag]);
      setIsDirty(true);
    }
  };
  
  const removeTag = (tag) => {
    setNoteTags(prev => prev.filter(t => t !== tag));
    setIsDirty(true);
  };
  
  const insertNoteLink = (title) => {
    const linkText = `[[${title}]]`;
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = noteContent;
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      setNoteContent(before + linkText + after);
      setIsDirty(true);
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + linkText.length, start + linkText.length);
      }, 0);
    }
  };
  
  const insertPageReference = () => {
    const pageRef = `[Page ${currentPage}](page:${currentPage})`;
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const text = noteContent;
      const before = text.substring(0, start);
      const after = text.substring(start);
      
      setNoteContent(before + pageRef + after);
      setIsDirty(true);
    }
  };
  
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchTerm || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !selectedTag || 
      (note.tags && note.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });
  
  const currentPageNotes = filteredNotes.filter(note => 
    note.page_reference === currentPage
  );
  
  const otherNotes = filteredNotes.filter(note => 
    note.page_reference !== currentPage
  );
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault();
        saveNote();
      } else if (e.key === 'n') {
        e.preventDefault();
        createNewNote();
      }
    }
  };
  
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
  return (
    <div className="notes-panel">
      {/* Panel Header */}
      <div className="notes-header">
        <div className="header-title">
          <FileText size={18} />
          <span>Study Notes</span>
        </div>
        
        <div className="header-actions">
          <button onClick={createNewNote} className="new-note-btn" title="New Note (Ctrl+N)">
            <Plus size={16} />
          </button>
          
          <button 
            onClick={() => setShowPreview(!showPreview)} 
            className={`preview-toggle ${showPreview ? 'active' : ''}`}
            title="Toggle Preview"
          >
            <Eye size={16} />
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="notes-filters">
        <div className="search-container">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="tag-filter">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="tag-select"
          >
            <option value="">All tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>#{tag}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Notes Content */}
      <div className="notes-content">
        {/* Current Page Notes */}
        <div className="notes-section">
          <button 
            onClick={() => toggleSection('currentPage')}
            className="section-header"
          >
            {expandedSections.currentPage ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Current Page ({currentPageNotes.length})</span>
          </button>
          
          {expandedSections.currentPage && (
            <div className="section-content">
              {currentPageNotes.length === 0 ? (
                <div className="empty-section">
                  <p>No notes for this page yet</p>
                  <button onClick={createNewNote} className="create-first-note">
                    Create first note
                  </button>
                </div>
              ) : (
                <div className="notes-list">
                  {currentPageNotes.map(note => (
                    <div 
                      key={note.id}
                      onClick={() => selectNote(note)}
                      className={`note-item ${activeNote?.id === note.id ? 'active' : ''}`}
                    >
                      <div className="note-title">{note.title}</div>
                      <div className="note-preview">
                        {note.content.substring(0, 80)}...
                      </div>
                      <div className="note-meta">
                        <Clock size={12} />
                        <span>{formatTimestamp(note.updated_at || note.created_at)}</span>
                      </div>
                      {note.tags && note.tags.length > 0 && (
                        <div className="note-tags">
                          {note.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Bookmarks */}
        <div className="notes-section">
          <button 
            onClick={() => toggleSection('bookmarks')}
            className="section-header"
          >
            {expandedSections.bookmarks ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Bookmarks ({bookmarks.length})</span>
          </button>
          
          {expandedSections.bookmarks && (
            <div className="section-content">
              {bookmarks.length === 0 ? (
                <div className="empty-section">
                  <p>No bookmarks yet</p>
                  <p className="hint">Press 'B' while reading to bookmark pages</p>
                </div>
              ) : (
                <div className="bookmarks-list">
                  {bookmarks.map(bookmark => (
                    <div 
                      key={bookmark.id}
                      onClick={() => onBookmarkClick(bookmark.page_number)}
                      className="bookmark-item"
                    >
                      <Bookmark size={14} />
                      <div className="bookmark-content">
                        <div className="bookmark-title">
                          Page {bookmark.page_number}
                        </div>
                        <div className="bookmark-note">
                          {bookmark.notes || bookmark.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* All Notes */}
        {otherNotes.length > 0 && (
          <div className="notes-section">
            <button 
              onClick={() => toggleSection('allNotes')}
              className="section-header"
            >
              {expandedSections.allNotes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Other Notes ({otherNotes.length})</span>
            </button>
            
            {expandedSections.allNotes && (
              <div className="section-content">
                <div className="notes-list">
                  {otherNotes.map(note => (
                    <div 
                      key={note.id}
                      onClick={() => selectNote(note)}
                      className={`note-item ${activeNote?.id === note.id ? 'active' : ''}`}
                    >
                      <div className="note-title">{note.title}</div>
                      <div className="note-preview">
                        {note.content.substring(0, 60)}...
                      </div>
                      <div className="note-meta">
                        <Paperclip size={12} />
                        <span>Page {note.page_reference}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Linked Notes */}
        {(linkedNotes.length > 0 || backlinks.length > 0) && (
          <div className="notes-section">
            <button 
              onClick={() => toggleSection('linkedNotes')}
              className="section-header"
            >
              {expandedSections.linkedNotes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Linked Notes ({linkedNotes.length + backlinks.length})</span>
            </button>
            
            {expandedSections.linkedNotes && (
              <div className="section-content">
                {linkedNotes.length > 0 && (
                  <div className="linked-section">
                    <h4>Links from this note</h4>
                    {linkedNotes.map(note => (
                      <div 
                        key={note.id}
                        onClick={() => selectNote(note)}
                        className="linked-note-item"
                      >
                        <Link2 size={12} />
                        <span>{note.title}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {backlinks.length > 0 && (
                  <div className="linked-section">
                    <h4>Notes linking here</h4>
                    {backlinks.map(note => (
                      <div 
                        key={note.id}
                        onClick={() => selectNote(note)}
                        className="linked-note-item"
                      >
                        <Link2 size={12} />
                        <span>{note.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Note Editor */}
      {activeNote && (
        <div className="note-editor">
          <div className="editor-header">
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => {
                setNoteTitle(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Note title..."
              className="note-title-input"
            />
            
            <div className="editor-actions">
              {isDirty && (
                <span className="save-indicator">
                  Unsaved changes
                </span>
              )}
              
              <button onClick={saveNote} className="save-btn" title="Save (Ctrl+S)">
                <Save size={14} />
              </button>
              
              {activeNote.id && (
                <button 
                  onClick={() => deleteNote(activeNote.id)} 
                  className="delete-btn"
                  title="Delete note"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          <div className="editor-toolbar">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`edit-toggle ${isEditing ? 'active' : ''}`}
            >
              <Edit3 size={14} />
              <span>{isEditing ? 'Preview' : 'Edit'}</span>
            </button>
            
            <button onClick={insertPageReference} className="toolbar-btn">
              <Paperclip size={14} />
              <span>Page Ref</span>
            </button>
            
            <button 
              onClick={() => {
                const title = prompt('Link to note (title):');
                if (title) insertNoteLink(title);
              }}
              className="toolbar-btn"
            >
              <Link2 size={14} />
              <span>Link</span>
            </button>
          </div>
          
          <div className="editor-content">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={noteContent}
                onChange={(e) => {
                  setNoteContent(e.target.value);
                  setIsDirty(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Start writing your notes... Use [[Note Title]] to link to other notes."
                className="note-textarea"
              />
            ) : (
              <div className="note-preview">
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) => {
                      if (href?.startsWith('page:')) {
                        const pageNum = parseInt(href.replace('page:', ''));
                        return (
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              onBookmarkClick(pageNum);
                            }}
                            className="page-link"
                          >
                            {children}
                          </a>
                        );
                      }
                      return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                    }
                  }}
                >
                  {noteContent || '*No content yet. Click Edit to start writing.*'}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          <div className="editor-footer">
            <div className="tags-container">
              <div className="tags-list">
                {noteTags.map(tag => (
                  <span key={tag} className="tag removable">
                    #{tag}
                    <button onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
              
              <input
                type="text"
                placeholder="Add tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTag(e.target.value.trim());
                    e.target.value = '';
                  }
                }}
                className="tag-input"
              />
            </div>
            
            {lastSaved && (
              <div className="last-saved">
                Last saved: {formatTimestamp(lastSaved)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPanel;