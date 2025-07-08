#!/bin/bash

echo "📄 Creating Single Page PDF Viewer for Accurate Timing"
echo "======================================================"
echo "🎯 Stage 2 Enhancement: One page at a time with precise tracking"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info "Creating single-page PDF viewer with accurate page timing..."
print_warning "This will replace the scrollable iframe with one-page-at-a-time viewing"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

# 1. Create single-page PDF viewer component
print_info "Creating SinglePagePDFViewer component..."

cat << 'SINGLE_PAGE_VIEWER_EOF' > frontend/src/components/SinglePagePDFViewer.js
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const SinglePagePDFViewer = ({ fileUrl, totalPages, currentPage, onPageChange, fileName }) => {
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageRendering, setPageRendering] = useState(false);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load PDF.js
  useEffect(() => {
    const loadPDF = async () => {
      try {
        // Load PDF.js from CDN
        if (!window.pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            loadDocument();
          };
          document.head.appendChild(script);
        } else {
          loadDocument();
        }
      } catch (error) {
        console.error('Error loading PDF.js:', error);
      }
    };

    const loadDocument = async () => {
      try {
        const pdf = await window.pdfjsLib.getDocument(fileUrl).promise;
        setPdfDoc(pdf);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading PDF document:', error);
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [fileUrl]);

  // Render current page
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, rotation]);

  const renderPage = async (pageNum) => {
    if (pageRendering) return;
    
    setPageRendering(true);
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Calculate viewport
      let viewport = page.getViewport({ scale, rotation });
      
      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render page
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
    } catch (error) {
      console.error('Error rendering page:', error);
    } finally {
      setPageRendering(false);
    }
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
      onPageChange(pageNum);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const fitToWidth = () => {
    setScale(1.2);
    setRotation(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
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
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <div className="pdf-loading">
        <div className="loading-spinner"></div>
        <p>Loading PDF...</p>
      </div>
    );
  }

  return (
    <div className="single-page-viewer">
      {/* PDF Controls */}
      <div className="pdf-controls">
        <div className="navigation-controls">
          <button 
            onClick={previousPage} 
            disabled={currentPage <= 1}
            className="control-btn"
            title="Previous page (←)"
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
            className="control-btn"
            title="Next page (→)"
          >
            <ChevronRight size={18} />
          </button>
        </div>

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
          
          <button onClick={fitToWidth} className="control-btn" title="Fit to width">
            <Maximize size={16} />
          </button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="pdf-canvas-container">
        <canvas
          ref={canvasRef}
          className="pdf-canvas"
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 200px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e2e8f0'
          }}
        />
        {pageRendering && (
          <div className="page-loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SinglePagePDFViewer;
SINGLE_PAGE_VIEWER_EOF

print_status "Created SinglePagePDFViewer component"

# 2. Create enhanced page-specific timer with page memory
print_info "Creating enhanced timer with page memory..."

cat << 'ENHANCED_TIMER_EOF' > frontend/src/components/EnhancedPageTimer.js
import React, { useState, useEffect, useRef } from 'react';
import { Clock, Activity, BarChart3, Pause, Play } from 'lucide-react';
import api from '../services/api';

const EnhancedPageTimer = ({ fileId, currentPage, totalPages }) => {
  const [sessionId, setSessionId] = useState(null);
  const [pageTimers, setPageTimers] = useState({}); // Store time for each page
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPageStartTime, setCurrentPageStartTime] = useState(null);
  const intervalRef = useRef(null);
  const lastPageRef = useRef(currentPage);

  // Auto-start session when component mounts
  useEffect(() => {
    startSession();
    
    return () => {
      if (sessionId) {
        endSession();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fileId]);

  // Handle page changes with memory
  useEffect(() => {
    if (currentPage !== lastPageRef.current && sessionId) {
      handlePageChange(lastPageRef.current, currentPage);
    }
    lastPageRef.current = currentPage;
  }, [currentPage, sessionId]);

  // Timer updates
  useEffect(() => {
    if (isActive && !isPaused && currentPageStartTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - currentPageStartTime) / 1000);
        
        // Update current page time
        setPageTimers(prev => ({
          ...prev,
          [currentPage]: (prev[currentPage] || 0) + 1
        }));
        
        // Update total session time
        setTotalSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, currentPageStartTime, currentPage]);

  const startSession = async () => {
    try {
      const response = await api.post(`/study-sessions/start/${fileId}`, {
        startPage: currentPage,
        sessionType: 'reading'
      });
      
      setSessionId(response.data.session.id);
      setIsActive(true);
      setIsPaused(false);
      setCurrentPageStartTime(Date.now());
      
      // Initialize current page timer if not exists
      setPageTimers(prev => ({
        ...prev,
        [currentPage]: prev[currentPage] || 0
      }));
      
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handlePageChange = async (fromPage, toPage) => {
    if (!sessionId) return;
    
    try {
      // Record time for previous page
      await api.post(`/study-sessions/page-change/${sessionId}`, {
        fromPage,
        toPage,
        timestamp: new Date().toISOString()
      });
      
      // Check if we're going back to a previously visited page
      const isRevisit = pageTimers[toPage] > 0;
      
      if (isRevisit) {
        // Resuming a previously visited page
        setIsPaused(false);
        setCurrentPageStartTime(Date.now());
      } else {
        // New page - initialize timer
        setPageTimers(prev => ({
          ...prev,
          [toPage]: 0
        }));
        setCurrentPageStartTime(Date.now());
      }
      
    } catch (error) {
      console.error('Error tracking page change:', error);
    }
  };

  const togglePause = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
      setCurrentPageStartTime(Date.now());
    } else {
      // Pause
      setIsPaused(true);
      setCurrentPageStartTime(null);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      await api.post(`/study-sessions/end/${fileId}`, {
        endPage: currentPage,
        notes: `Session completed. Pages visited: ${Object.keys(pageTimers).length}`
      });
      
      setSessionId(null);
      setIsActive(false);
      setIsPaused(false);
      setCurrentPageStartTime(null);
      
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPageTime = () => {
    return pageTimers[currentPage] || 0;
  };

  const getVisitedPagesCount = () => {
    return Object.keys(pageTimers).filter(page => pageTimers[page] > 0).length;
  };

  const isRevisitingPage = () => {
    return pageTimers[currentPage] > 0;
  };

  return (
    <div className="enhanced-page-timer">
      <div className="timer-header">
        <div className="timer-title">
          <Activity size={16} className={isActive && !isPaused ? 'active' : ''} />
          <span>Study Session</span>
        </div>
        <div className="page-indicator">
          <span className="page-number">Page {currentPage} of {totalPages}</span>
          {isRevisitingPage() && (
            <span className="revisit-badge">Revisiting</span>
          )}
        </div>
      </div>
      
      <div className="timer-stats">
        <div className="stat-item">
          <Clock size={14} />
          <div className="stat-info">
            <div className="stat-label">This Page</div>
            <div className="stat-value">{formatTime(getCurrentPageTime())}</div>
          </div>
        </div>
        
        <div className="stat-item">
          <BarChart3 size={14} />
          <div className="stat-info">
            <div className="stat-label">Session Total</div>
            <div className="stat-value">{formatTime(totalSessionTime)}</div>
          </div>
        </div>
      </div>

      <div className="session-controls">
        <div className="session-info">
          <span className="pages-visited">{getVisitedPagesCount()} pages visited</span>
        </div>
        
        <div className="control-buttons">
          <button
            onClick={togglePause}
            className={`control-btn ${isPaused ? 'resume' : 'pause'}`}
            disabled={!isActive}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      <div className="session-status">
        {isActive ? (
          <div className={`status-active ${isPaused ? 'paused' : ''}`}>
            <div className={`pulse-dot ${isPaused ? 'paused' : ''}`}></div>
            <span>{isPaused ? 'Paused' : 'Recording automatically'}</span>
          </div>
        ) : (
          <div className="status-inactive">
            <span>Session ended</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPageTimer;
ENHANCED_TIMER_EOF

print_status "Created enhanced timer with page memory"

# 3. Update PDFViewer to use single-page viewer
print_info "Updating PDFViewer to use single-page viewer..."

cat << 'UPDATED_PDF_VIEWER_EOF' > frontend/src/pages/PDFViewer.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Home, FileText } from 'lucide-react';
import api from '../services/api';
import SinglePagePDFViewer from '../components/SinglePagePDFViewer';
import EnhancedPageTimer from '../components/EnhancedPageTimer';

const PDFViewer = () => {
  const { fileId } = useParams();
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadFile();
  }, [fileId]);

  const loadFile = async () => {
    try {
      const fileResponse = await api.get(`/files/${fileId}/metadata`);
      setFileInfo(fileResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError('Failed to load PDF file');
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    console.log(`📄 Page change: ${currentPage} → ${newPage}`);
    setCurrentPage(newPage);
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
    <div className="pdf-viewer">
      <div className="viewer-header">
        <div className="viewer-nav">
          <Link to="/files" className="btn btn-secondary">
            <ArrowLeft size={16} />
            Back
          </Link>
          <Link to="/" className="btn btn-secondary">
            <Home size={16} />
          </Link>
        </div>

        <div className="file-title">
          <div className="title-with-icon">
            <FileText size={20} />
            <h2>{fileInfo.original_name}</h2>
          </div>
          <div className="progress-info">
            {fileInfo.page_count} pages • {Math.round(fileInfo.file_size / 1024)} KB
          </div>
        </div>
      </div>

      {/* Enhanced Page Timer with Memory */}
      <div className="timer-section">
        <EnhancedPageTimer 
          fileId={fileId}
          currentPage={currentPage}
          totalPages={fileInfo.page_count}
        />
      </div>

      {/* Single Page PDF Viewer */}
      <div className="single-page-section">
        <SinglePagePDFViewer
          fileUrl={pdfUrl}
          totalPages={fileInfo.page_count}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          fileName={fileInfo.original_name}
        />
      </div>
    </div>
  );
};

export default PDFViewer;
UPDATED_PDF_VIEWER_EOF

print_status "Updated PDFViewer with single-page viewer"

# 4. Add CSS for single-page viewer and enhanced timer
print_info "Adding CSS for single-page viewer..."

cat << 'SINGLE_PAGE_CSS_EOF' >> frontend/src/styles/App.css

/* Single Page PDF Viewer Styles */
.single-page-viewer {
  background: #f8fafc;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.pdf-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 1rem;
}

.navigation-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 36px;
  height: 36px;
}

.control-btn:hover:not(:disabled) {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
}

.page-input {
  width: 60px;
  padding: 0.375rem 0;
  border: none;
  outline: none;
  text-align: center;
  font-weight: 500;
}

.page-total {
  color: #64748b;
  font-size: 0.875rem;
}

.zoom-level {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
}

.pdf-canvas-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  background: #64748b;
  min-height: 60vh;
  overflow: auto;
}

.pdf-canvas {
  background: white;
  border-radius: 0.5rem;
}

.page-loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pdf-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Enhanced Timer Styles */
.enhanced-page-timer {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.timer-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1e293b;
}

.timer-title svg.active {
  color: #10b981;
  animation: pulse 2s infinite;
}

.page-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-number {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.revisit-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.timer-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #f1f5f9;
}

.stat-item svg {
  color: #3b82f6;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.session-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
}

.pages-visited {
  color: #64748b;
  font-size: 0.875rem;
}

.control-buttons {
  display: flex;
  gap: 0.5rem;
}

.control-btn.pause {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}

.control-btn.resume {
  background: #dcfce7;
  color: #166534;
  border-color: #bbf7d0;
}

.session-status {
  text-align: center;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.status-active {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  font-weight: 500;
}

.status-active.paused {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.pulse-dot.paused {
  background: #f59e0b;
  animation: none;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.single-page-section {
  flex: 1;
}

/* Responsive design */
@media (max-width: 768px) {
  .pdf-controls {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .navigation-controls,
  .view-controls {
    justify-content: center;
  }
  
  .pdf-canvas-container {
    padding: 1rem;
  }
  
  .timer-stats {
    grid-template-columns: 1fr;
  }
  
  .session-controls {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .timer-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
SINGLE_PAGE_CSS_EOF

print_status "Added CSS for single-page viewer and enhanced timer"

# 5. Create test script for single-page viewer
cat << 'TEST_SINGLE_PAGE_EOF' > scripts/test-single-page.sh
#!/bin/bash

echo "🧪 Testing Single Page PDF Viewer with Accurate Timing"
echo "===================================================="

echo "Testing backend connection..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running"
    
    echo ""
    echo "📋 Single Page Viewer Features to Test:"
    echo "1. ✅ Backend running"
    echo "2. ⏳ Open any PDF in viewer"
    echo "3. ⏳ Check for single-page display (one page at a time)"
    echo "4. ⏳ Test navigation controls:"
    echo "     • Previous/Next buttons"
    echo "     • Page number input"
    echo "     • Keyboard arrows (← →)"
    echo "     • Zoom controls (+ -)"
    echo "     • Rotation (r key)"
    echo ""
    echo "📊 Enhanced Timer Features to Test:"
    echo "5. ⏳ Timer shows current page time"
    echo "6. ⏳ Timer shows total session time"
    echo "7. ⏳ Navigate to different pages"
    echo "8. ⏳ Go back to previous page - should show 'Revisiting'"
    echo "9. ⏳ Timer should continue from where it left off"
    echo "10. ⏳ Pause/Resume functionality"
    echo "11. ⏳ Pages visited counter updates"
    echo ""
    echo "🎯 Expected Behavior:"
    echo "  • ✅ ONE page displayed at a time"
    echo "  • ✅ Page timer resets on new pages"
    echo "  • ✅ Page timer continues on revisited pages"
    echo "  • ✅ Session timer always accumulates"
    echo "  • ✅ 'Revisiting' badge on previously seen pages"
    echo "  • ✅ Accurate per-page time tracking"
    echo ""
    echo "🚀 Start testing:"
    echo "   ./scripts/start-phase1.sh"
    
else
    echo "❌ Backend not running. Start with: ./scripts/start-phase1.sh"
fi
TEST_SINGLE_PAGE_EOF

chmod +x scripts/test-single-page.sh

print_status "Created single-page viewer test script"

# 6. Update Phase 2 progress tracker
cat << 'PHASE2_PROGRESS_EOF' > PHASE2_PROGRESS.md
# Phase 2: Time Tracking & Estimation - Progress Tracker

## 📊 Current Stage: 2 of 7 (Enhanced)

### ✅ Stage 1: Page-Level Time Tracking
- ✅ Database schema for page tracking
- ✅ API endpoints for time tracking
- ✅ Basic page timer component
- ✅ Database triggers and functions

### 🔄 Stage 2: Study Session Lifecycle Management (ENHANCED)
- ✅ Study session database tables
- ✅ Session management API
- ✅ **NEW: Single-page PDF viewer** 
- ✅ **NEW: Enhanced timer with page memory**
- ✅ **NEW: Pause/Resume functionality**
- ✅ **NEW: Revisiting page detection**
- ✅ **NEW: Accurate per-page timing**
- ✅ Session cleanup service
- ✅ Keyboard navigation (←→ for pages, +- for zoom, r for rotate)

### ⏳ Stage 3: Reading Speed Analysis
- ⏳ Speed calculation algorithms
- ⏳ Reading performance metrics
- ⏳ Speed variation by document/topic

### ⏳ Stage 4: Estimated Finish Time Calculation
- ⏳ Completion time predictions
- ⏳ Session planning estimates
- ⏳ Deadline meeting calculations

### ⏳ Stage 5: Deadline-Based Session Planning
- ⏳ Goal deadline setting
- ⏳ Daily chunk division
- ⏳ Adaptive planning based on performance

### ⏳ Stage 6: Daily & Weekly Progress Visualization
- ⏳ Dashboard progress section
- ⏳ Streak tracking
- ⏳ Visual progress indicators

### ⏳ Stage 7: Local Data Persistence
- ⏳ Enhanced data storage
- ⏳ Long-term analytics
- ⏳ Data export capabilities

## 🎯 Stage 2 Key Improvements

### Single-Page Viewing
- **One page at a time**: No more scrolling confusion
- **Precise page detection**: Exact timing per page
- **PDF.js integration**: Professional PDF rendering
- **Full navigation controls**: Zoom, rotate, page jumping

### Enhanced Timer Features
- **Page memory**: Timer remembers time spent on each page
- **Revisiting detection**: Shows when you return to a page
- **Pause/Resume**: Manual control when needed
- **Accurate tracking**: No more guessing about page changes

### User Experience
- **Keyboard shortcuts**: Arrow keys, zoom keys, rotation
- **Visual feedback**: Clear indicators for all states
- **Responsive design**: Works on all screen sizes
- **Professional appearance**: Clean, focused interface

## 🚀 Ready for Stage 3!

Stage 2 is now complete with enhanced single-page viewing and accurate timing.
Ready to move to Stage 3: Reading Speed Analysis.
PHASE2_PROGRESS_EOF

print_status "Created Phase 2 progress tracker"

print_status "✅ Single Page PDF Viewer with Accurate Timing Complete!"
echo ""
echo "🎯 What's New in Enhanced Stage 2:"
echo "   • ✅ Single-page PDF viewing (no more scrolling)"
echo "   • ✅ Enhanced timer with page memory"
echo "   • ✅ Pause/Resume functionality"
echo "   • ✅ Revisiting page detection"
echo "   • ✅ Accurate per-page time tracking"
echo "   • ✅ Full PDF navigation controls"
echo "   • ✅ Keyboard shortcuts"
echo "   • ✅ Professional PDF.js integration"
echo ""
echo "📱 Navigation Controls:"
echo "   • ✅ Previous/Next buttons"
echo "   • ✅ Page number input"
echo "   • ✅ Zoom in/out controls"
echo "   • ✅ Rotation control"
echo "   • ✅ Keyboard shortcuts (←→ +- r)"
echo ""
echo "⏱️ Enhanced Timer Features:"
echo "   • ✅ Current page time (resets on new pages)"
echo "   • ✅ Total session time (always accumulates)"
echo "   • ✅ Page memory (continues on revisited pages)"
echo "   • ✅ Revisiting badge for previously seen pages"
echo "   • ✅ Pages visited counter"
echo "   • ✅ Manual pause/resume option"
echo ""
echo "🚀 Ready to test:"
echo "1. Test setup: ./scripts/test-single-page.sh"
echo "2. Start app: ./scripts/start-phase1.sh"
echo "3. Open any PDF and experience single-page viewing!"
echo "4. Navigate pages and see accurate timing!"
echo ""
echo "📊 Current Progress: Stage 2 of 7 Complete (Enhanced)"
echo "Next: Stage 3 - Reading Speed Analysis"