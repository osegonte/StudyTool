import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Home, Search, ZoomIn, ZoomOut, RotateCw, 
  Bookmark, Share, Moon, Sun, Timer, Target, Activity
} from 'lucide-react';
import api from '../../services/api';
import SinglePagePDFViewer from '../SinglePagePDFViewer';

const AppleReaderInterface = () => {
  const { fileId } = useParams();
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showToolbar, setShowToolbar] = useState(true);
  const [readerMode, setReaderMode] = useState('normal');
  const [sessionData, setSessionData] = useState({
    timeOnPage: 0,
    totalTime: 0,
    pagesRead: 0,
    estimatedRemaining: 0
  });

  useEffect(() => {
    loadFile();
    
    // Auto-hide toolbar after 5 seconds of inactivity
    const hideTimer = setTimeout(() => {
      setShowToolbar(false);
    }, 5000);

    const handleMouseMove = () => {
      setShowToolbar(true);
      clearTimeout(hideTimer);
      setTimeout(() => setShowToolbar(false), 5000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimer);
    };
  }, [fileId]);

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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Update session data
    setSessionData(prev => ({
      ...prev,
      pagesRead: Math.max(prev.pagesRead, newPage),
      estimatedRemaining: calculateEstimatedTime(newPage)
    }));
  };

  const calculateEstimatedTime = (currentPage) => {
    if (!fileInfo) return 0;
    const remainingPages = fileInfo.page_count - currentPage;
    const avgTimePerPage = 2; // minutes
    return remainingPages * avgTimePerPage;
  };

  const toggleReaderMode = () => {
    setReaderMode(prev => prev === 'normal' ? 'focus' : 'normal');
  };

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
        <Link to="/files" className="btn-primary">
          <ArrowLeft size={16} />
          Back to Files
        </Link>
      </div>
    );
  }

  return (
    <div className={`apple-reader ${readerMode}`}>
      {/* Three-Pane Layout */}
      <div className="reader-layout">
        {/* Left Thumbnails Panel */}
        <div className="thumbnails-panel">
          <div className="thumbnails-header">
            <h3>Pages</h3>
            <span className="page-count">{fileInfo.page_count}</span>
          </div>
          
          <div className="thumbnails-grid">
            {Array.from({ length: fileInfo.page_count }, (_, i) => (
              <div
                key={i + 1}
                className={`thumbnail ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => handlePageChange(i + 1)}
              >
                <div className="thumbnail-preview">
                  <span>{i + 1}</span>
                </div>
                <div className="thumbnail-label">
                  Page {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Viewer */}
        <div className="viewer-container">
          {/* Auto-hide Toolbar */}
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
              <button className="toolbar-btn">
                <Search size={18} />
              </button>
              <button className="toolbar-btn">
                <ZoomOut size={18} />
              </button>
              <button className="toolbar-btn">
                <ZoomIn size={18} />
              </button>
              <button className="toolbar-btn">
                <RotateCw size={18} />
              </button>
              <button className="toolbar-btn">
                <Bookmark size={18} />
              </button>
              <button 
                className="toolbar-btn"
                onClick={toggleReaderMode}
              >
                {readerMode === 'normal' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="pdf-viewer-area">
            <SinglePagePDFViewer
              fileUrl={`http://localhost:3001/uploads/${fileInfo.filename}`}
              totalPages={fileInfo.page_count}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              fileName={fileInfo.original_name}
            />
          </div>
        </div>

        {/* Right Slide-over Panel */}
        <div className="sidepanel-container">
          <div className="sidepanel-header">
            <h3>Study Session</h3>
            <div className="session-mode">
              <Activity size={16} />
              <span>Active</span>
            </div>
          </div>

          <div className="session-timer">
            <div className="timer-display">
              <Timer size={20} />
              <span className="time-text">
                {Math.floor(sessionData.totalTime / 60)}:{(sessionData.totalTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="timer-label">Session Time</div>
          </div>

          <div className="page-notes">
            <div className="notes-header">
              <h4>Page {currentPage} Notes</h4>
              <button className="add-note-btn">+</button>
            </div>
            <div className="notes-content">
              <p className="notes-placeholder">
                Click to add notes for this page...
              </p>
            </div>
          </div>

          <div className="session-progress">
            <div className="progress-item">
              <span className="progress-label">Pages Read</span>
              <span className="progress-value">{sessionData.pagesRead}</span>
            </div>
            <div className="progress-item">
              <span className="progress-label">Time Remaining</span>
              <span className="progress-value">{sessionData.estimatedRemaining}m</span>
            </div>
          </div>

          <div className="session-actions">
            <button className="btn-primary">
              <Target size={16} />
              Mark as Read
            </button>
            <button className="btn-secondary">
              <Bookmark size={16} />
              Bookmark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppleReaderInterface;
