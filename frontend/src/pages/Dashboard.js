import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Folder, Clock, TrendingUp, Upload } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalTopics: 0,
    totalPages: 0,
    recentFiles: [],
    topicStats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading your study dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Study Dashboard</h1>
        <p>Welcome back! Here's your learning progress.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText />
          </div>
          <div className="stat-info">
            <h3>{stats.totalFiles}</h3>
            <p>PDF Files</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Folder />
          </div>
          <div className="stat-info">
            <h3>{stats.totalTopics}</h3>
            <p>Study Topics</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp />
          </div>
          <div className="stat-info">
            <h3>{stats.totalPages}</h3>
            <p>Total Pages</p>
          </div>
        </div>

        <div className="stat-card action-card">
          <Link to="/files" className="action-link">
            <Upload />
            <span>Upload New PDF</span>
          </Link>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Recent Files</h2>
          {stats.recentFiles && stats.recentFiles.length > 0 ? (
            <div className="file-list">
              {stats.recentFiles.map(file => (
                <Link 
                  key={file.id} 
                  to={`/viewer/${file.id}`} 
                  className="file-item"
                >
                  <div className="file-info">
                    <h4>{file.original_name}</h4>
                    <p>
                      {file.page_count} pages
                      {file.topic_name && (
                        <span className="topic-badge" style={{ backgroundColor: file.topic_color }}>
                          {file.topic_name}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="file-actions">
                    <Clock size={16} />
                    <span>Continue Reading</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No files uploaded yet</h3>
              <p>Start by uploading your first PDF study material</p>
              <Link to="/files" className="btn btn-primary">
                Upload First PDF
              </Link>
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Topics Overview</h2>
          {stats.topicStats && stats.topicStats.length > 0 ? (
            <div className="topic-grid">
              {stats.topicStats.map(topic => (
                <div key={topic.id} className="topic-card">
                  <div className="topic-header">
                    <span className="topic-icon">{topic.icon}</span>
                    <h4>{topic.name}</h4>
                  </div>
                  <div className="topic-stats">
                    <p>{topic.file_count || 0} files</p>
                    <p>{topic.total_pages || 0} pages</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Folder size={48} />
              <h3>No topics created yet</h3>
              <p>Organize your study materials by creating topics</p>
              <Link to="/topics" className="btn btn-primary">
                Create First Topic
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
