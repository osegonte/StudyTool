import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Home, Clock } from 'lucide-react';
import axios from 'axios';

const PDFViewer = () => {
  const { id } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionStartTime] = useState(Date.now());
  const [fileInfo, setFileInfo] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadPDF();
    loadFileInfo();
    // Auto-save progress every 30 seconds
    const interval = setInterval(saveProgress, 30000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [currentPage, scale, rotation, pdfDoc]);

  // Save progress when component unmounts
  useEffect(() => {
    return () => {
      saveProgress();
    };
  }, []);

  const loadPDF = async () => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const pdf = await pdfjsLib.getDocument(`http://localhost:3001/pdfs/${id}`).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setLoading(false);

      // Load saved progress
      try {
        const progressResponse = await axios.get(`http://localhost:3001/api/progress/${id}`);
        if (progressResponse.data.currentPage) {
          setCurrentPage(progressResponse.data.currentPage);
        }
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

  const saveProgress = async () => {
    const sessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
    
    try {
      await axios.post(`http://localhost:3001/api/progress/${id}`, {
        currentPage,
        totalPages,
        sessionTime
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
