import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import api from '../services/api';
import SinglePagePDFViewer from './SinglePagePDFViewer';

const PDFViewer = () => {
  const { fileId } = useParams();
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadFile();
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

  if (loading) {
    return <div>Loading PDF...</div>;
  }

  if (!fileInfo) {
    return (
      <div>
        <div>PDF not found</div>
        <Link to="/files" className="btn btn-primary">
          <ArrowLeft size={16} />
          Back to Files
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/files" className="btn btn-secondary">
            <ArrowLeft size={16} />
            Back
          </Link>
          <Link to="/" className="btn btn-secondary">
            <Home size={16} />
          </Link>
        </div>
        <div>
          <h2>{fileInfo.original_name}</h2>
          <div className="text-gray-600">{fileInfo.page_count} pages</div>
        </div>
      </div>

      <div className="card">
        <SinglePagePDFViewer
          fileUrl={`http://localhost:3001/uploads/${fileInfo.filename}`}
          totalPages={fileInfo.page_count}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          fileName={fileInfo.original_name}
        />
      </div>
    </div>
  );
};

export default PDFViewer;
