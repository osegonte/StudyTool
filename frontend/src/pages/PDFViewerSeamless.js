import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Home, Search, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import SinglePagePDFViewer from '../components/SinglePagePDFViewer';
import CompactSessionToolbar from '../components/focus/CompactSessionToolbar';
import HighlightNotePopup from '../components/notes/HighlightNotePopup';
import NotesFAB from '../components/notes/NotesFAB';
import QuickNoteModal from '../components/notes/QuickNoteModal';
import PDFNoteIntegration from '../components/notes/PDFNoteIntegration';

const PDFViewerSeamless = () => {
  const { fileId } = useParams();
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [focusModeActive, setFocusModeActive] = useState(false);
  
  // Note-taking states
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [showHighlightPopup, setShowHighlightPopup] = useState(false);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [noteCount, setNoteCount] = useState(0);

  const loadFile = useCallback(async () => {
    try {
      const fileResponse = await api.get(`/files/${fileId}/metadata`);
      setFileInfo(fileResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError('Failed to load PDF file');
      setLoading(false);
    }
  }, [fileId]);

  const loadNoteCount = useCallback(async () => {
    try {
      const response = await api.get(`/notes?file_id=${fileId}`);
      setNoteCount(response.data.notes.length);
    } catch (error) {
      console.error('Error loading note count:', error);
    }
  }, [fileId]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length > 10) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(text);
      setSelectionPosition({
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY
      });
      setShowHighlightPopup(true);
    } else {
      setShowHighlightPopup(false);
      setSelectedText('');
    }
  }, []);

  const handleKeyboardShortcuts = useCallback((e) => {
    // Ctrl+Shift+N for quick note
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      setShowQuickNote(true);
    }
    
    // Ctrl+Shift+S for search notes
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      setShowNotesPanel(true);
    }
    
    // Escape to close popups
    if (e.key === 'Escape') {
      setShowHighlightPopup(false);
      setShowQuickNote(false);
    }
  }, []);

  useEffect(() => {
    loadFile();
    loadNoteCount();
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Setup text selection listener
    document.addEventListener('mouseup', handleTextSelection);
    
    // Setup keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [fileId, loadFile, loadNoteCount, handleTextSelection, handleKeyboardShortcuts]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setShowHighlightPopup(false); // Close popup on page change
    updateReadingProgress(newPage);
  };

  const updateReadingProgress = async (page) => {
    try {
      await api.post('/user-progress/update', {
        study_minutes: 1,
        pages_read: 1
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleFocusModeToggle = () => {
    setFocusModeActive(!focusModeActive);
    if (!focusModeActive) {
      document.body.classList.add('focus-mode-active');
      setShowNotesPanel(false);
      setShowHighlightPopup(false);
    } else {
      document.body.classList.remove('focus-mode-active');
    }
  };

  const handleNoteSaved = (note) => {
    console.log('Note saved:', note);
    loadNoteCount(); // Refresh note count
    
    // Show success notification
    if (Notification.permission === 'granted') {
      new Notification('📝 Note Saved!', {
        body: note.title,
        icon: '/favicon.ico'
      });
    }
  };

  const handleQuickNote = () => {
    setShowQuickNote(true);
  };

  const handleViewNotes = () => {
    setShowNotesPanel(true);
  };

  const handleSearchNotes = () => {
    // Open notes in new tab
    window.open('/notes', '_blank');
  };

  if (loading) {
    return (
      <div className="pdf-viewer loading-container">
        <div className="loading">Loading PDF...</div>
      </div>
    );
  }

  if (error || !fileInfo) {
    return (
      <div className="pdf-viewer error-container">
        <div className="error">{error || 'PDF not found'}</div>
        <Link to="/files" className="btn btn-primary">
          <ArrowLeft size={16} />
          Back to Files
        </Link>
      </div>
    );
  }

  const pdfUrl = `http://localhost:3001/uploads/${fileInfo.filename}`;

  return (
    <div className={`pdf-viewer-seamless ${focusModeActive ? 'focus-mode' : ''}`}>
      {!focusModeActive && (
        <div className="viewer-header">
          <div className="viewer-nav">
            <Link to="/files" className="btn btn-secondary">
              <ArrowLeft size={16} />
              Back
            </Link>
            <Link to="/" className="btn btn-secondary">
              <Home size={16} />
            </Link>
            <Link to="/notes" className="btn btn-secondary">
              <Search size={16} />
              All Notes
            </Link>
          </div>

          <div className="file-title">
            <h2>{fileInfo.original_name}</h2>
            <div className="progress-info">
              {fileInfo.page_count} pages • {noteCount} notes
            </div>
          </div>

          <div className="viewer-controls">
            <button
              onClick={() => setShowNotesPanel(!showNotesPanel)}
              className={`btn btn-secondary ${showNotesPanel ? 'active' : ''}`}
            >
              {showNotesPanel ? <EyeOff size={16} /> : <Eye size={16} />}
              Notes Panel
            </button>
          </div>
        </div>
      )}

      <div className="main-content">
        <div className="pdf-container">
          <SinglePagePDFViewer
            fileUrl={pdfUrl}
            totalPages={fileInfo.page_count}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            fileName={fileInfo.original_name}
          />
        </div>

        {/* Notes Panel */}
        {showNotesPanel && !focusModeActive && (
          <div className="notes-side-panel">
            <PDFNoteIntegration
              fileId={fileId}
              currentPage={currentPage}
              selectedText={selectedText}
              onNoteCreated={handleNoteSaved}
            />
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {!focusModeActive && (
        <NotesFAB
          fileId={fileId}
          currentPage={currentPage}
          onQuickNote={handleQuickNote}
          onViewNotes={handleViewNotes}
          onSearchNotes={handleSearchNotes}
          noteCount={noteCount}
        />
      )}

      {/* Highlight-to-Note Popup */}
      {showHighlightPopup && selectedText && !focusModeActive && (
        <HighlightNotePopup
          selectedText={selectedText}
          position={selectionPosition}
          fileId={fileId}
          currentPage={currentPage}
          onClose={() => {
            setShowHighlightPopup(false);
            setSelectedText('');
          }}
          onNoteSaved={handleNoteSaved}
        />
      )}

      {/* Quick Note Modal */}
      <QuickNoteModal
        isOpen={showQuickNote}
        onClose={() => setShowQuickNote(false)}
        fileId={fileId}
        currentPage={currentPage}
        onNoteSaved={handleNoteSaved}
        initialContent={selectedText ? `> ${selectedText}\n\n*From page ${currentPage}*\n\n` : ''}
      />

      {/* Compact Session Toolbar */}
      <CompactSessionToolbar
        fileId={fileId}
        currentPage={currentPage}
        totalPages={fileInfo.page_count}
        onFocusModeToggle={handleFocusModeToggle}
        focusModeActive={focusModeActive}
      />

      {/* Keyboard Shortcuts Helper */}
      {!focusModeActive && (
        <div className="keyboard-shortcuts-hint">
          <span>💡 Ctrl+Shift+N for Quick Note • Ctrl+Shift+S for Search</span>
        </div>
      )}
    </div>
  );
};

export default PDFViewerSeamless;
