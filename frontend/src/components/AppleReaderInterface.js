import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Home, Search, ZoomIn, ZoomOut, RotateCw, 
  Bookmark, Moon, Sun, Timer, Target, Activity, 
  StickyNote, Plus, Eye
} from 'lucide-react';
import api from '../services/api';
import SinglePagePDFViewer from './SinglePagePDFViewer';
import CompactSessionToolbar from './focus/CompactSessionToolbar';
import FocusMode from './focus/FocusMode';
import EnhancedSessionTracker from './focus/EnhancedSessionTracker';
import PDFNoteIntegration from './notes/PDFNoteIntegration';
import QuickNoteModal from './notes/QuickNoteModal';
import HighlightNotePopup from './notes/HighlightNotePopup';

const AppleReaderInterface = () => {
  const { fileId } = useParams();
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showToolbar, setShowToolbar] = useState(true);
  const [readerMode, setReaderMode] = useState('normal');
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [sessionData, setSessionData] = useState({});
  const [selectedText, setSelectedText] = useState('');
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [showHighlightPopup, setShowHighlightPopup] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState({ x: 0, y: 0 });
  const [sidebarMode, setSidebarMode] = useState('notes'); // notes, analytics, bookmarks
  const toolbarTimeoutRef = useRef(null);

  // Enhanced session tracker
  const sessionTracker = EnhancedSessionTracker({ 
    fileId, 
    currentPage, 
    onSessionData: setSessionData 
  });

  useEffect(() => {
    loadFile();
    setupToolbarAutoHide();
    setupTextSelection();
    
    return () => {
      if (toolbarTimeoutRef.current) {
        clearTimeout(toolbarTimeoutRef.current);
      }
    };
  }, [fileId]);

  useEffect(() => {
    // Page change tracking
    if (sessionTracker.actions) {
      sessionTracker.actions.trackPageInteraction('view', currentPage);
    }
  }, [currentPage]);

  const loadFile = async () => {
    try {
      const response = await api.get(`/files/${fileId}/metadata`);
      setFileInfo(response.data);
    } catch (error) {
      console.error('Error loading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupToolbarAutoHide = () => {
    const resetTimer = () => {
      setShowToolbar(true);
      if (toolbarTimeoutRef.current) {
        clearTimeout(toolbarTimeoutRef.current);
      }
      toolbarTimeoutRef.current = setTimeout(() => {
        if (!focusModeActive) setShowToolbar(false);
      }, 3000);
    };

    const handleMouseMove = () => resetTimer();
    const handleKeyPress = () => resetTimer();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keypress', handleKeyPress);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keypress', handleKeyPress);
    };
  };

  const setupTextSelection = () => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text.length > 3) {
        setSelectedText(text);
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setHighlightPosition({
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY
        });
        setShowHighlightPopup(true);
      } else {
        setSelectedText('');
        setShowHighlightPopup(false);
      }
    };

    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedText('');
    setShowHighlightPopup(false);
  };

  const toggleFocusMode = () => {
    setFocusModeActive(!focusModeActive);
    if (!focusModeActive) {
      setShowToolbar(false);
      setSidebarMode(null);
    } else {
      setShowToolbar(true);
      setSidebarMode('notes');
    }
  };

  const handleQuickNoteShortcut = (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      setShowQuickNote(true);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleQuickNoteShortcut);
    return () => document.removeEventListener('keydown', handleQuickNoteShortcut);
  }, []);

  if (loading) {
    return (
      <div className="reader-loading">
        <div className="loading-spinner" />
        <p>Loading document...</p>
      </div>
    );
  }

  if (!fileInfo) {
    return (
      <div className="reader-error">
        <h3>Document not found</h3>
        <Link to="/files" className="btn btn-primary">
          <ArrowLeft size={16} />
          Back to Files
        </Link>
      </div>
    );
  }

  return (
    <FocusMode 
      isActive={focusModeActive} 
      onToggle={toggleFocusMode}
      currentMode={readerMode}
    >
      <div className={`apple-reader ${readerMode} ${focusModeActive ? 'focus-active' : ''}`}>
        {/* Enhanced Header */}
        {(!focusModeActive || showToolbar) && (
          <div className={`reader-toolbar ${showToolbar ? 'visible' : 'hidden'}`}>
            <div className="toolbar-left">
              <Link to="/files" className="toolbar-btn">
                <ArrowLeft size={18} />
              </Link>
              <Link to="/" className="toolbar-btn">
                <Home size={18} />
              </Link>
              <div className="toolbar-divider" />
              <span className="document-title">{fileInfo.original_name}</span>
            </div>

            <div className="toolbar-center">
              <div className="page-navigator">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="nav-btn"
                >
                  ←
                </button>
                
                <div className="page-input">
                  <input
                    type="number"
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= fileInfo.page_count) {
                        handlePageChange(page);
                      }
                    }}
                    min="1"
                    max={fileInfo.page_count}
                  />
                  <span>of {fileInfo.page_count}</span>
                </div>
                
                <button
                  onClick={() => handlePageChange(Math.min(fileInfo.page_count, currentPage + 1))}
                  disabled={currentPage >= fileInfo.page_count}
                  className="nav-btn"
                >
                  →
                </button>
              </div>
            </div>

            <div className="toolbar-right">
              <button className="toolbar-btn" title="Search (Ctrl+F)">
                <Search size={18} />
              </button>
              <button className="toolbar-btn" title="Zoom Out">
                <ZoomOut size={18} />
              </button>
              <button className="toolbar-btn" title="Zoom In">
                <ZoomIn size={18} />
              </button>
              <button className="toolbar-btn" title="Rotate">
                <RotateCw size={18} />
              </button>
              <button className="toolbar-btn" title="Bookmark Page">
                <Bookmark size={18} />
              </button>
              <button 
                className="toolbar-btn"
                onClick={() => setShowQuickNote(true)}
                title="Quick Note (Ctrl+Shift+N)"
              >
                <StickyNote size={18} />
              </button>
              <button 
                className="toolbar-btn"
                onClick={toggleFocusMode}
                title={focusModeActive ? 'Exit Focus Mode' : 'Enter Focus Mode'}
              >
                {focusModeActive ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="reader-layout">
          {/* Sidebar - Notes/Analytics Panel */}
          {!focusModeActive && sidebarMode && (
            <div className="reader-sidebar">
              <div className="sidebar-tabs">
                <button 
                  className={`sidebar-tab ${sidebarMode === 'notes' ? 'active' : ''}`}
                  onClick={() => setSidebarMode('notes')}
                >
                  <StickyNote size={16} />
                  Notes
                </button>
                <button 
                  className={`sidebar-tab ${sidebarMode === 'analytics' ? 'active' : ''}`}
                  onClick={() => setSidebarMode('analytics')}
                >
                  <Activity size={16} />
                  Progress
                </button>
                <button 
                  className={`sidebar-tab ${sidebarMode === 'bookmarks' ? 'active' : ''}`}
                  onClick={() => setSidebarMode('bookmarks')}
                >
                  <Bookmark size={16} />
                  Bookmarks
                </button>
              </div>

              <div className="sidebar-content">
                {sidebarMode === 'notes' && (
                  <PDFNoteIntegration
                    fileId={fileId}
                    currentPage={currentPage}
                    selectedText={selectedText}
                    onNoteCreated={() => {
                      setSelectedText('');
                      setShowHighlightPopup(false);
                    }}
                  />
                )}
                
                {sidebarMode === 'analytics' && (
                  <div className="session-analytics">
                    <h4>📊 Session Analytics</h4>
                    <div className="analytics-grid">
                      <div className="metric">
                        <span className="label">Current Page Time</span>
                        <span className="value">{sessionData.formattedCurrentPageTime || '0:00'}</span>
                      </div>
                      <div className="metric">
                        <span className="label">Session Total</span>
                        <span className="value">{sessionData.formattedTotalTime || '0:00'}</span>
                      </div>
                      <div className="metric">
                        <span className="label">Pages Visited</span>
                        <span className="value">{sessionData.pagesVisitedCount || 0}</span>
                      </div>
                      <div className="metric">
                        <span className="label">Daily Progress</span>
                        <span className="value">{sessionData.dailyStats?.studyMinutes || 0}m</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {sidebarMode === 'bookmarks' && (
                  <div className="bookmarks-panel">
                    <h4>🔖 Bookmarks</h4>
                    <div className="bookmark-list">
                      <p className="empty-state">No bookmarks yet. Click the bookmark icon to save important pages.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          <div className="viewer-container">
            <SinglePagePDFViewer
              fileUrl={`http://localhost:3001/uploads/${fileInfo.filename}`}
              totalPages={fileInfo.page_count}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              fileName={fileInfo.original_name}
            />
          </div>
        </div>

        {/* Session Toolbar - Always Visible */}
        <CompactSessionToolbar
          fileId={fileId}
          currentPage={currentPage}
          totalPages={fileInfo.page_count}
          onFocusModeToggle={toggleFocusMode}
          focusModeActive={focusModeActive}
        />

        {/* Modals and Popups */}
        {showHighlightPopup && selectedText && (
          <HighlightNotePopup
            selectedText={selectedText}
            position={highlightPosition}
            fileId={fileId}
            currentPage={currentPage}
            onClose={() => {
              setShowHighlightPopup(false);
              setSelectedText('');
            }}
            onNoteSaved={() => {
              setShowHighlightPopup(false);
              setSelectedText('');
              // Refresh notes if sidebar is open
              if (sidebarMode === 'notes') {
                // Trigger refresh
              }
            }}
          />
        )}

        <QuickNoteModal
          isOpen={showQuickNote}
          onClose={() => setShowQuickNote(false)}
          fileId={fileId}
          currentPage={currentPage}
          initialContent={selectedText}
          onNoteSaved={() => {
            setShowQuickNote(false);
            setSelectedText('');
            // Refresh notes if sidebar is open
          }}
        />
      </div>
    </FocusMode>
  );
};

export default AppleReaderInterface;
