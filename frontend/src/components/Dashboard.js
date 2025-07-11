import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, Clock, Target } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalPages: 0,
    recentFiles: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Study Dashboard</h1>
      <p className="mb-6">Welcome to your study planner</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 mb-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <FileText size={24} className="text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <div className="text-gray-600">Documents</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <Target size={24} className="text-green-600" />
            <div>
              <div className="text-2xl font-bold">{stats.totalPages}</div>
              <div className="text-gray-600">Total Pages</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <Clock size={24} className="text-purple-600" />
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-gray-600">Study Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Files */}
      <div className="card mb-6">
        <h2 className="mb-4">Recent Files</h2>
        {stats.recentFiles?.length > 0 ? (
          <div className="grid gap-4">
            {stats.recentFiles.slice(0, 3).map(file => (
              <Link
                key={file.id}
                to={`/viewer/${file.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div>
                  <div className="font-medium">{file.original_name}</div>
                  <div className="text-sm text-gray-600">{file.page_count} pages</div>
                </div>
                <div className="text-blue-600">Open →</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <h3>No documents yet</h3>
            <p className="mb-4">Upload your first PDF to start studying</p>
            <Link to="/files" className="btn btn-primary">
              <Upload size={16} />
              Upload PDF
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/files" className="card flex items-center gap-4 hover:shadow-lg">
          <Upload size={24} className="text-blue-600" />
          <div>
            <div className="font-medium">Upload PDF</div>
            <div className="text-sm text-gray-600">Add study material</div>
          </div>
        </Link>

        <Link to="/topics" className="card flex items-center gap-4 hover:shadow-lg">
          <Target size={24} className="text-green-600" />
          <div>
            <div className="font-medium">Create Topic</div>
            <div className="text-sm text-gray-600">Organize materials</div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
