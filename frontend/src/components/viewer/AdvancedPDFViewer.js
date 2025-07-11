// frontend/src/components/viewer/AdvancedPDFViewer.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, 
  Maximize, Search, Bookmark, MoreHorizontal, Play, Pause,
  Clock, Eye, Target, Settings
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import StudyTimer from './StudyTimer';
import NotesPanel from './NotesPanel';
import api from '../../services/api';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const AdvancedPDFViewer = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  // Core state
  const [pdfDoc, setPdfDoc] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [renderingPage, setRenderingPage] = useState(false);
  
  // Study session state
  const [activeSession, setActiveSession] = useState(null);
  const [pageStartTime, setPageStartTime] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    totalTime: 0,
    pagesRead: 0,
    avgTimePerPage: 0
  });
  
  // UI state
  const [showNotes, setShowNotes] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  
  // Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pageTrackingRef = useRef({
    pageEnterTime: null,
    currentPage: null,
    sessionId: null
  });
  
  // Load PDF document
  useEffect(() => {
    if (fileId) {
      loadDocument();
    }
  }, [fileId]);
  
  // Page tracking effect
  useEffect(() => {
    if (activeSession && currentPage) {
      trackPageChange();
    }
  }, [currentPage, activeSession]);
  
  // Idle detection
  useEffect(() => {
    let idleTimer;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (activeSession) {
          pauseSession();
        }
      }, 120000); // 2 minutes
    };
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });
    
    resetIdleTimer();
    
    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
    };
  }, [activeSession]);
  
  const loadDocument = async () => {
    try {
      // Load file metadata
      const fileResponse = await api.get(`/files/${fileId}/metadata`);
      setFileInfo(fileResponse.data);
      
      // Load PDF document
      const pdfUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/uploads/${fileResponse.data.filename}`;
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      
      // Load reading progress
      const progressResponse = await api.get(`/reading-progress/${fileId}`);
      if (progressResponse.data.current_page) {
        setCurrentPage(progressResponse.data.current_page);
      }
      
      // Load bookmarks
      const bookmarksResponse = await api.get(`/bookmarks/${fileId}`);
      setBookmarks(bookmarksResponse.data || []);
      
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDoc || renderingPage) return;
    
    setRenderingPage(true);
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const viewport = page.getViewport({ scale, rotation });
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
    } catch (error) {
      console.error('Error rendering page:', error);
    } finally {
      setRenderingPage(false);
    }
  }, [pdfDoc, scale, rotation, renderingPage]);
  
  // Render current page when dependencies change
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, rotation, renderPage]);
  
  const trackPageChange = async () => {
    const now = new Date();
    const tracking = pageTrackingRef.current;
    
    // End tracking for previous page
    if (tracking.pageEnterTime && tracking.currentPage && tracking.sessionId) {
      const timeSpent = Math.floor((now - tracking.pageEnterTime) / 1000);
      
      try {
        await api.post('/page-tracking/end', {
          session_id: tracking.sessionId,
          page_number: tracking.currentPage,
          time_spent_seconds: timeSpent
        });
      } catch (error) {
        console.error('Error ending page tracking:', error);
      }
    }
    
    // Start tracking for new page
    if (activeSession) {
      try {
        await api.post('/page-tracking/start', {
          session_id: activeSession.id,
          file_id: fileId,
          page_number: currentPage
        });
        
        // Update refs
        tracking.pageEnterTime = now;
        tracking.currentPage = currentPage;
        tracking.sessionId = activeSession.id;
        
        // Update reading progress
        await api.put(`/reading-progress/${fileId}`, {
          current_page: currentPage,
          last_read_at: now.toISOString()
        });
        
      } catch (error) {
        console.error('Error starting page tracking:', error);
      }
    }
  };
  
  const startSession = async () => {
    try {
      const response = await api.post('/study-sessions/start', {
        file_id: fileId,
        start_page: currentPage,
        session_type: 'reading'
      });
      
      setActiveSession(response.data.session);
      setPageStartTime(new Date());
      
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };
  
  const pauseSession = async () => {
    if (!activeSession) return;
    
    try {
      await api.post(`/study-sessions/pause/${activeSession.id}`);
      setActiveSession(null);
      
    } catch (error) {
      console.error('Error pausing session:', error);
    }
  };
  
  const endSession = async () => {
    if (!activeSession) return;
    
    try {
      await api.post(`/study-sessions/end/${activeSession.id}`, {
        end_page: currentPage,
        notes: '' // Can be expanded for session notes
      });
      
      setActiveSession(null);
      setPageStartTime(null);
      
      // Update session stats
      await loadSessionStats();
      
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };
  
  const loadSessionStats = async () => {
    try {
      const response = await api.get(`/study-sessions/stats/${fileId}`);
      setSessionStats(response.data);
    } catch (error) {
      console.error('Error loading session stats:', error);
    }
  };
  
  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };
  
  const previousPage = () => goToPage(currentPage - 1);
  const nextPage = () => goToPage(currentPage + 1);
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const rotate = () => setRotation(prev => (prev + 90) % 360);
  const fitToWidth = () => {
    if (containerRef.current && canvasRef.current) {
      const containerWidth = containerRef.current.clientWidth - 40;
      const newScale = containerWidth / canvasRef.current.width * scale;
      setScale(Math.min(newScale, 3.0));
    }
  };
  
  const addBookmark = async () => {
    try {
      const response = await api.post('/bookmarks', {
        file_id: fileId,
        page_number: currentPage,
        title: `Page ${currentPage}`,
        notes: ''
      });
      
      setBookmarks(prev => [...prev, response.data.bookmark]);
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          previousPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextPage();
          break;
        case '+':
        case '=':
          event.preventDefault();
          zoomIn();
          break;
        case '-':
          event.preventDefault();
          zoomOut();
          break;
        case 'r':
          event.preventDefault();
          rotate();
          break;
        case 'f':
          event.preventDefault();
          fitToWidth();
          break;
        case 'b':
          event.preventDefault();
          addBookmark();
          break;
        case 'n':
          event.preventDefault();
          setShowNotes(!showNotes);
          break;
        case ' ':
          event.preventDefault();
          if (activeSession) {
            pauseSession();
          } else {
            startSession();
          }
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, activeSession, showNotes]);
  
  if (loading) {
    return (
      <div className="pdf-viewer-loading">
        <div className="loading-spinner"></div>
        <p>Loading PDF viewer...</p>
      </div>
    );
  }
  
  if (!fileInfo || !pdfDoc) {
    return (
      <div className="pdf-viewer-error">
        <h2>Unable to load PDF</h2>
        <button onClick={() => navigate('/files')} className="btn-primary">
          Back to Files
        </button>
      </div>
    );
  }
  
  return (
    <div className="advanced-pdf-viewer">
      {/* Header Toolbar */}
      <div className="pdf-toolbar">
        <div className="toolbar-left">
          <button onClick={() => navigate('/files')} className="toolbar-btn">
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          
          <div className="file-info">
            <h2 className="file-title">{fileInfo.original_name}</h2>
            <div className="file-meta">
              <span>{totalPages} pages</span>
              <span>•</span>
              <span>{Math.round(fileInfo.file_size / 1024 / 1024)} MB</span>
            </div>
          </div>
        </div>
        
        <div className="toolbar-center">
          <div className="page-controls">
            <button 
              onClick={previousPage} 
              disabled={currentPage <= 1}
              className="page-btn"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="page-input-group">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page) goToPage(page);
                }}
                min="1"
                max={totalPages}
                className="page-input"
              />
              <span className="page-total">of {totalPages}</span>
            </div>
            
            <button 
              onClick={nextPage} 
              disabled={currentPage >= totalPages}
              className="page-btn"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="toolbar-right">
          <div className="view-controls">
            <button onClick={zoomOut} className="control-btn" title="Zoom out (-)">
              <ZoomOut size={16} />
            </button>
            
            <span className="zoom-level">{Math.round(scale * 100)}%</span>
            
            <button onClick={zoomIn} className="control-btn" title="Zoom in (+)">
              <ZoomIn size={16} />
            </button>
            
            <button onClick={rotate} className="control-btn" title="Rotate (r)">
              <RotateCw size={16} />
            </button>
            
            <button onClick={fitToWidth} className="control-btn" title="Fit width (f)">
              <Maximize size={16} />
            </button>
          </div>
          
          <div className="study-controls">
            <button onClick={addBookmark} className="control-btn" title="Bookmark (b)">
              <Bookmark size={16} />
            </button>
            
            <button 
              onClick={() => setShowNotes(!showNotes)} 
              className={`control-btn ${showNotes ? 'active' : ''}`}
              title="Notes (n)"
            >
              <Search size={16} />
            </button>
            
            <button className="control-btn">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="pdf-content">
        {/* Timer Sidebar */}
        {showTimer && (
          <div className="timer-sidebar">
            <StudyTimer
              activeSession={activeSession}
              onStartSession={startSession}
              onPauseSession={pauseSession}
              onEndSession={endSession}
              sessionStats={sessionStats}
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </div>
        )}
        
        {/* PDF Canvas Container */}
        <div className="pdf-canvas-area" ref={containerRef}>
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              className="pdf-canvas"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                borderRadius: '8px'
              }}
            />
            
            {renderingPage && (
              <div className="page-loading-overlay">
                <div className="loading-spinner small"></div>
              </div>
            )}
          </div>
          
          {/* Page Progress Indicator */}
          <div className="page-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(currentPage / totalPages) * 100}%` }}
              />
            </div>
            <div className="progress-text">
              {Math.round((currentPage / totalPages) * 100)}% complete
            </div>
          </div>
        </div>
        
        {/* Notes Panel */}
        {showNotes && (
          <div className="notes-sidebar">
            <NotesPanel 
              fileId={fileId}
              currentPage={currentPage}
              bookmarks={bookmarks}
              onBookmarkClick={goToPage}
            />
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="pdf-status-bar">
        <div className="status-left">
          <div className="session-indicator">
            {activeSession ? (
              <>
                <div className="session-active">
                  <div className="pulse-dot"></div>
                  <span>Recording session</span>
                </div>
                <span className="session-time">
                  {pageStartTime && formatDuration((new Date() - pageStartTime) / 1000)}
                </span>
              </>
            ) : (
              <span className="session-inactive">Press Space to start studying</span>
            )}
          </div>
        </div>
        
        <div className="status-center">
          <div className="reading-stats">
            <span>📖 {sessionStats.pagesRead} pages read</span>
            <span>⏱️ {formatDuration(sessionStats.totalTime)}</span>
            <span>📊 {sessionStats.avgTimePerPage}s/page</span>
          </div>
        </div>
        
        <div className="status-right">
          <div className="shortcuts-hint">
            <span>↔ Navigate</span>
            <span>Space Start/Pause</span>
            <span>B Bookmark</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility function to format duration
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export default AdvancedPDFViewer;