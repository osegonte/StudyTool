import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Play, Pause, BookOpen } from 'lucide-react';
import api from '../services/api';

const PDFViewerCompact = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);

  useEffect(() => {
    loadFileInfo();
  }, [fileId]);

  useEffect(() => {
    let interval;
    if (isSessionActive) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const loadFileInfo = async () => {
    try {
      const response = await api.get(`/files/${fileId}/metadata`);
      setFileInfo(response.data);
    } catch (error) {
      console.error('Error loading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = () => {
    setIsSessionActive(!isSessionActive);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (!fileInfo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">PDF not found</h2>
          <button 
            onClick={() => navigate('/files')} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ArrowLeft size={16} />
            Back to Files
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/files')} 
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Home size={20} />
            </button>
            <div>
              <h2 className="text-lg font-semibold">{fileInfo.original_name}</h2>
              <p className="text-sm text-gray-600">Page {currentPage} of {fileInfo.page_count}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <BookOpen size={16} />
              <span className="font-mono">{formatTime(sessionTimer)}</span>
            </div>
            <button
              onClick={toggleSession}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                isSessionActive 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isSessionActive ? <Pause size={16} /> : <Play size={16} />}
              {isSessionActive ? 'Pause Session' : 'Start Session'}
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <div className="text-center">
            <div className="mb-6">
              <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">PDF Viewer</h3>
              <p className="text-gray-600">
                Enhanced PDF viewer with study tracking will be available after running the full alignment.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                <span>Page</span>
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= fileInfo.page_count) {
                      setCurrentPage(page);
                    }
                  }}
                  min="1"
                  max={fileInfo.page_count}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                />
                <span>of {fileInfo.page_count}</span>
              </div>
              
              <button 
                onClick={() => setCurrentPage(Math.min(fileInfo.page_count, currentPage + 1))}
                disabled={currentPage >= fileInfo.page_count}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12">
              <p className="text-gray-500">
                PDF content would be displayed here
                <br />
                File: {fileInfo.original_name}
                <br />
                Size: {Math.round(fileInfo.file_size / 1024 / 1024 * 100) / 100} MB
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewerCompact;
