import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import api from '../services/api';

const PDFViewer = () => {
  const { fileId } = useParams();
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          <h2>{fileInfo.original_name}</h2>
          <div className="progress-info">
            {fileInfo.page_count} pages • {Math.round(fileInfo.file_size / 1024)} KB
          </div>
        </div>
      </div>

      <div className="viewer-content">
        <iframe
          src={pdfUrl}
          width="100%"
          height="100%"
          style={{ border: 'none', minHeight: '80vh' }}
          title={fileInfo.original_name}
        />
      </div>
    </div>
  );
};

export default PDFViewer;
