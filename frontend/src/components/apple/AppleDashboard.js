import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Upload, Folder } from 'lucide-react';
import api from '../../services/api';

const AppleDashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalPages: 0,
    totalTopics: 0
  });
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats({
        totalFiles: response.data.totalFiles || 0,
        totalPages: response.data.totalPages || 0,
        totalTopics: response.data.totalTopics || 0
      });
      setRecentFiles(response.data.recentFiles || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">
          Good day! 👋
        </h1>
        <p className="text-xl text-gray-600">
          Ready to continue your learning journey?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map(topic => (
          <div key={topic.id} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: topic.color }}
              >
                <span className="text-white text-xl">{topic.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{topic.name}</h3>
                <p className="text-sm text-gray-500">{topic.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="text-center py-12">
          <Folder size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No topics created yet</h3>
          <p className="text-gray-500">Create your first topic to organize your materials</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Topic</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Advanced Calculus"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Brief description"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Icon</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="📚"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-full h-10 rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicManager;
