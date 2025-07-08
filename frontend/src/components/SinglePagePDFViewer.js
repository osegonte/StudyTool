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
