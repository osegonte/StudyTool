import React, { useState, useEffect } from 'react';
import { Target, Clock, CheckCircle, AlertCircle, Coffee, Brain } from 'lucide-react';
import api from '../services/api';

const DailyRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      // Generate recommendations if none exist for today
      await api.post('/recommendations/generate');
      
      // Load today's recommendations
      const response = await api.get('/recommendations/today');
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeRecommendation = async (id) => {
    try {
      await api.put(`/recommendations/${id}/complete`);
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === id ? { ...rec, is_completed: true } : rec
        )
      );
    } catch (error) {
      console.error('Error completing recommendation:', error);
    }
  };

  const getRecommendationIcon = (type) => {
    const iconMap = {
      urgent: AlertCircle,
      focus: Brain,
      light: Coffee,
      catchup: Target
    };
    return iconMap[type] || Target;
  };

  const getRecommendationColor = (type) => {
    const colorMap = {
      urgent: '#ef4444',
      focus: '#3b82f6',
      light: '#10b981',
      catchup: '#f59e0b'
    };
    return colorMap[type] || '#64748b';
  };

  if (loading) {
    return <div className="recommendations-loading">Loading recommendations...</div>;
  }

  const pendingRecommendations = recommendations.filter(r => !r.is_completed);
  const completedRecommendations = recommendations.filter(r => r.is_completed);

  return (
    <div className="daily-recommendations">
      <div className="recommendations-header">
        <h3>🧭 Today's Study Plan</h3>
        <div className="recommendation-stats">
          <span className="completed-count">
            {completedRecommendations.length}/{recommendations.length} completed
          </span>
        </div>
      </div>

      <div className="recommendations-list">
        {pendingRecommendations.map(recommendation => {
          const IconComponent = getRecommendationIcon(recommendation.recommendation_type);
          const color = getRecommendationColor(recommendation.recommendation_type);
          
          return (
            <div 
              key={recommendation.id} 
              className="recommendation-card"
              style={{ borderLeftColor: color }}
            >
              <div className="recommendation-header">
                <div className="recommendation-icon" style={{ color }}>
                  <IconComponent size={20} />
                </div>
                <div className="recommendation-content">
                  <h4 className="recommendation-title">{recommendation.title}</h4>
                  <p className="recommendation-description">{recommendation.description}</p>
                </div>
                <div className="recommendation-actions">
                  <button
                    onClick={() => completeRecommendation(recommendation.id)}
                    className="btn btn-primary btn-sm"
                  >
                    <CheckCircle size={16} />
                    Complete
                  </button>
                </div>
              </div>
              
              <div className="recommendation-details">
                {recommendation.estimated_minutes && (
                  <div className="time-estimate">
                    <Clock size={14} />
                    <span>{recommendation.estimated_minutes} min</span>
                  </div>
                )}
                {recommendation.topic_name && (
                  <div className="topic-tag">
                    <span>{recommendation.topic_icon} {recommendation.topic_name}</span>
                  </div>
                )}
                {recommendation.file_name && (
                  <div className="file-tag">
                    <span>📄 {recommendation.file_name}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {pendingRecommendations.length === 0 && (
          <div className="no-recommendations">
            <Target size={48} />
            <h4>All recommendations completed!</h4>
            <p>Great job staying on track today. Keep up the momentum!</p>
          </div>
        )}
      </div>

      {completedRecommendations.length > 0 && (
        <div className="completed-recommendations">
          <h4>✅ Completed Today</h4>
          <div className="completed-list">
            {completedRecommendations.map(recommendation => (
              <div key={recommendation.id} className="completed-item">
                <CheckCircle size={16} className="completed-icon" />
                <span>{recommendation.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyRecommendations;
