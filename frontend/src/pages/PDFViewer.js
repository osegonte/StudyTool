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
