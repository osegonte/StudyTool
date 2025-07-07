import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Upload, Clock, FileText } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalTimeSpent: 0,
    recentFiles: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [filesResponse, progressResponse] = await Promise.all([
        axios.get('http://localhost:3001/api/files'),
        axios.get('http://localhost:3001/api/progress')
      ]);

      const files = filesResponse.data;
      const progressData = progressResponse.data;

      const totalTimeSpent = progressData.reduce((total, progress) => 
        total + (progress.timeSpent || 0), 0
      );

      setStats({
        totalFiles: files.length,
        totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
        recentFiles: files.slice(0, 3)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>📚 Local Study Planner</h1>
        <p>Your personal study companion running on Mac Mini M4</p>
      </header>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <FileText size={32} />
          <div>
            <h3>{stats.totalFiles}</h3>
            <p>PDFs Uploaded</p>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={32} />
          <div>
            <h3>{stats.totalTimeSpent}m</h3>
            <p>Time Studied</p>
          </div>
        </div>
      </div>
      
      <main className="dashboard-main">
        <div className="dashboard-cards">
          <Link to="/files" className="dashboard-card">
            <BookOpen size={48} />
            <h3>My PDFs</h3>
            <p>Manage and organize your study materials</p>
          </Link>
          
          <Link to="/files" className="dashboard-card">
            <Upload size={48} />
            <h3>Upload New PDF</h3>
            <p>Add new study materials</p>
          </Link>
          
          <div className="dashboard-card">
            <Clock size={48} />
            <h3>Study Progress</h3>
            <p>Track your reading time and progress</p>
          </div>
        </div>

        {stats.recentFiles.length > 0 && (
          <div className="recent-files">
            <h2>Recent Files</h2>
            <div className="recent-files-list">
              {stats.recentFiles.map((file) => (
                <Link 
                  key={file.id} 
                  to={`/pdf/${file.id}`} 
                  className="recent-file-item"
                >
                  <FileText size={24} />
                  <div>
                    <h4>{file.name}</h4>
                    <p>{new Date(file.uploadDate).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
