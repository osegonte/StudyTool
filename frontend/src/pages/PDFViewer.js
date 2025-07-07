import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Home, Play, Pause, Square, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const PDFViewer = () => {
  const { id } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState(null);
  
  // Phase 2: Session and Page-Level Time Tracking
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [pageStartTime, setPageStartTime] = useState(null);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [pageTimeData, setPageTimeData] = useState({});
  const [readingSpeed, setReadingSpeed] = useState(0);
  const [estimatedFinishTime, setEstimatedFinishTime] = useState(0);
  
  const canvasRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const pageTimerRef = useRef(null);

  useEffect(() => {
    loadPDF();
    loadFileInfo();
    
    // Cleanup on unmount
    return () => {
      if (sessionActive) {
        endSession();
      }
    };
  }, [id]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [currentPage, scale, rotation, pdfDoc]);

  // Phase 2: Page change tracking
  useEffect(() => {
    if (sessionActive && pageStartTime) {
      // Record time spent on previous page
      recordPageTime();
      // Start timing new page
      startPageTiming();
    }
  }, [currentPage]);

  // Phase 2: Session timer
  useEffect(() => {
    if (sessionActive) {
      sessionTimerRef.current = setInterval(() => {
        setCurrentSessionTime(Date.now() - sessionStartTime);
      }, 1000);
    } else {
      clearInterval(sessionTimerRef.current);
    }

    return () => clearInterval(sessionTimerRef.current);
  }, [sessionActive, sessionStartTime]);

  const loadPDF = async () => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const pdf = await pdfjsLib.getDocument(`http://localhost:3001/pdfs/${id}`).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setLoading(false);

      // Load previous progress
      try {
        const progressResponse = await axios.get(`http://localhost:3001/api/progress/${id}`);
        if (progressResponse.data.currentPage) {
          setCurrentPage(progressResponse.data.currentPage);
        }
        setTotalSessionTime(progressResponse.data.timeSpent || 0);
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoading(false);
    }
  };

  const loadFileInfo = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/files`);
      const file = response.data.find(f => f.id === id);
      setFileInfo(file);
    } catch (error) {
      console.error('Error loading file info:', error);
    }
  };

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
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
    }
  };

  // Phase 2: Start study session
  const startSession = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/sessions/start', {
        fileId: id,
        startPage: currentPage,
        totalPages: totalPages
      });
      
      setSessionId(response.data.sessionId);
      setSessionActive(true);
      setSessionStartTime(Date.now());
      startPageTiming();
      
      toast.success('📚 Study session started! Time tracking active.');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    }
  };

  // Phase 2: Pause/Resume session
  const pauseSession = () => {
    if (sessionActive) {
      recordPageTime();
      setSessionActive(false);
      toast('⏸️ Session paused');
    } else {
      setSessionActive(true);
      setSessionStartTime(Date.now() - currentSessionTime);
      startPageTiming();
      toast('▶️ Session resumed');
    }
  };

  // Phase 2: End study session
  const endSession = async () => {
    if (!sessionId || !sessionActive) return;

    try {
      // Record final page time
      recordPageTime();
      
      const sessionDuration = Math.floor(currentSessionTime / 1000);
      const pagesRead = Math.max(1, currentPage - (pageTimeData.startPage || currentPage) + 1);
      
      const response = await axios.post(`http://localhost:3001/api/sessions/end/${sessionId}`, {
        endPage: currentPage,
        sessionDuration: sessionDuration,
        pagesRead: pagesRead,
        pageTimeData: pageTimeData
      });

      // Update session state
      setSessionActive(false);
      setSessionId(null);
      setCurrentSessionTime(0);
      setTotalSessionTime(prev => prev + sessionDuration);
      
      // Calculate and display results
      const avgTimePerPage = sessionDuration / pagesRead;
      const readingSpeedCalc = pagesRead / (sessionDuration / 60); // pages per minute
      setReadingSpeed(readingSpeedCalc);
      
      // Calculate estimated finish time
      const remainingPages = totalPages - currentPage;
      const estimatedMinutes = Math.ceil(remainingPages * avgTimePerPage / 60);
      setEstimatedFinishTime(estimatedMinutes);
      
      toast.success(`📖 Session completed! 
        ${pagesRead} pages read in ${Math.floor(sessionDuration / 60)}m ${sessionDuration % 60}s
        Speed: ${readingSpeedCalc.toFixed(1)} pages/min
        Est. finish: ${estimatedMinutes}min`);
      
      // Save progress
      await saveProgress();
      
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    }
  };

  // Phase 2: Page-level time tracking
  const startPageTiming = () => {
    setPageStartTime(Date.now());
  };

  const recordPageTime = () => {
    if (!pageStartTime) return;
    
    const timeOnPage = Date.now() - pageStartTime;
    setPageTimeData(prev => ({
      ...prev,
      [currentPage]: (prev[currentPage] || 0) + timeOnPage,
      startPage: prev.startPage || currentPage
    }));
  };

  // Phase 2: Save progress with time data
  const saveProgress = async () => {
    try {
      await axios.post(`http://localhost:3001/api/progress/${id}`, {
        currentPage: currentPage,
        totalPages: totalPages,
        sessionTime: Math.floor(currentSessionTime / 1000),
        totalTime: totalSessionTime,
        readingSpeed: readingSpeed,
        estimatedFinishTime: estimatedFinishTime
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const goToPage = (page) => {
    const newPage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(newPage);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <div className="pdf-viewer loading">
        <div className="loading-spinner">
          <Clock size={48} />
          <p>Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      <header className="pdf-viewer-header">
        <div className="header-left">
          <Link to="/files" className="back-btn">
            <Home size={20} />
            Back to Files
          </Link>
          <div className="file-title">
            <h1>{fileInfo?.name || 'PDF Viewer'}</h1>
          </div>
        </div>
        
        <div className="pdf-controls">
          <button 
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="control-btn"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="page-info">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              min="1"
              max={totalPages}
              className="page-input"
            />
            <span>of {totalPages}</span>
          </div>
          
          <button 
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="control-btn"
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="divider"></div>
          
          <button onClick={zoomOut} className="control-btn">
            <ZoomOut size={20} />
          </button>
          
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          
          <button onClick={zoomIn} className="control-btn">
            <ZoomIn size={20} />
          </button>
          
          <button onClick={rotate} className="control-btn">
            <RotateCw size={20} />
          </button>
        </div>
      </header>
      
      {/* Phase 2: Enhanced Study Timer Dashboard */}
      <div className="study-session-bar">
        <div className="session-controls">
          {!sessionActive && !sessionId && (
            <button onClick={startSession} className="session-btn start-btn">
              <Play size={16} />
              Start Study Session
            </button>
          )}
          
          {sessionId && (
            <>
              <button onClick={pauseSession} className={`session-btn ${sessionActive ? 'pause-btn' : 'resume-btn'}`}>
                {sessionActive ? <Pause size={16} /> : <Play size={16} />}
                {sessionActive ? 'Pause' : 'Resume'}
              </button>
              
              <button onClick={endSession} className="session-btn stop-btn">
                <Square size={16} />
                End Session
              </button>
            </>
          )}
        </div>
        
        <div className="session-info">
          <div className="time-display">
            <Clock size={16} />
            <span className="session-time">{formatTime(currentSessionTime)}</span>
          </div>
          
          {readingSpeed > 0 && (
            <div className="speed-display">
              <span className="reading-speed">{readingSpeed.toFixed(1)} pages/min</span>
            </div>
          )}
          
          {estimatedFinishTime > 0 && (
            <div className="estimate-display">
              <span className="finish-estimate">~{estimatedFinishTime}min to finish</span>
            </div>
          )}
          
          <div className="progress-display">
            <span className="page-progress">{currentPage}/{totalPages} pages</span>
            <span className="completion-percent">({Math.round((currentPage/totalPages)*100)}%)</span>
          </div>
        </div>
      </div>
      
      <div className="pdf-viewer-content">
        <div className="pdf-container">
          <canvas 
            ref={canvasRef}
            className="pdf-canvas"
          />
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
