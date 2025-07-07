import React, { useState, useEffect } from 'react';
import { Plus, Target, Calendar, Clock, BookOpen, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import { goalsAPI, filesAPI, topicsAPI } from '../../services/api';
import "react-datepicker/dist/react-datepicker.css";

const GoalsManager = () => {
  const [goals, setGoals] = useState([]);
  const [files, setFiles] = useState([]);
  const [topics, setTopics] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetType: 'daily_minutes',
    targetValue: 60,
    startDate: new Date(),
    endDate: null,
    fileId: '',
    topicId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsRes, filesRes, topicsRes] = await Promise.all([
        goalsAPI.getAll(),
        filesAPI.getAll(),
        topicsAPI.getAll()
      ]);

      setGoals(goalsRes.data);
      setFiles(filesRes.data);
      setTopics(topicsRes.data);
    } catch (error) {
      console.error('Error loading goals data:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    try {
      await goalsAPI.create(newGoal);
      toast.success('Goal created successfully!');
      setShowCreateForm(false);
      setNewGoal({
        title: '',
        description: '',
        targetType: 'daily_minutes',
        targetValue: 60,
        startDate: new Date(),
        endDate: null,
        fileId: '',
        topicId: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const deleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;

    try {
      await goalsAPI.delete(goalId);
      toast.success('Goal deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const getGoalTypeIcon = (type) => {
    switch (type) {
      case 'daily_minutes': return <Clock size={20} />;
      case 'pages_per_day': return <BookOpen size={20} />;
      case 'completion_date': return <Calendar size={20} />;
      default: return <Target size={20} />;
    }
  };

  const calculateProgress = (goal) => {
    if (!goal.current_progress || !goal.target_value) return 0;
    return Math.min((goal.current_progress / goal.target_value) * 100, 100);
  };

  if (loading) {
    return (
      <div className="goals-loading">
        <Target size={48} />
        <p>Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="goals-manager">
      <header className="goals-header">
        <div>
          <h1>🎯 Study Goals</h1>
          <p>Set and track your learning objectives</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="create-goal-btn"
        >
          <Plus size={20} />
          Create Goal
        </button>
      </header>

      <div className="goals-list">
        {goals.length === 0 ? (
          <div className="no-goals">
            <Target size={64} />
            <h3>No goals set yet</h3>
            <p>Create your first study goal to start tracking progress</p>
          </div>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className="goal-card">
              <div className="goal-header">
                <div className="goal-title">
                  {getGoalTypeIcon(goal.target_type)}
                  <h3>{goal.title}</h3>
                </div>
                <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="goal-action-btn delete-btn"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="goal-description">{goal.description}</p>

              <div className="goal-progress">
                <div className="progress-header">
                  <span>Progress</span>
                  <span>{calculateProgress(goal).toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${calculateProgress(goal)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New Goal</h2>
            
            <div className="form-group">
              <label>Goal Title</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                placeholder="e.g., Read 30 minutes daily"
              />
            </div>

            <div className="form-group">
              <label>Target Value</label>
              <input
                type="number"
                value={newGoal.targetValue}
                onChange={(e) => setNewGoal({...newGoal, targetValue: parseFloat(e.target.value)})}
                min="1"
              />
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowCreateForm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={createGoal}
                className="create-btn"
                disabled={!newGoal.title.trim()}
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsManager;
