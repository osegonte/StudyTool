import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

const FileUpload = ({ onUpload, disabled = false }) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files) => {
    const file = files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileUpload(droppedFiles);
  };

  return (
    <div 
      className={`file-upload-zone ${dragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload size={48} />
      <h3>{uploading ? 'Uploading...' : 'Drop PDF files here'}</h3>
      <p>or</p>
      <label className="upload-button">
        Choose PDF File
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => handleFileUpload(e.target.files)}
          disabled={disabled || uploading}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
};

export default FileUpload;
