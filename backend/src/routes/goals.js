const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Enhanced goal storage with planning capabilities
let goals = [];
let goalAnalytics = {};

// Create new goal with deadline planning
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      targetType,
      targetValue,
      startDate,
      endDate,
      fileId,
      examDate
    } = req.body;

    const goalId = uuidv4();
    const now = new Date();
    const deadline = endDate ? new Date(endDate) : null;
    const daysUntilDeadline = deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : null;

    const goal = {
      id: goalId,
      title,
      description,
      target_type: targetType,
      target_value: targetValue,
      current_progress: 0,
      start_date: startDate,
      end_date: endDate,
      exam_date: examDate,
      file_id: fileId,
      is_completed: false,
      created_at: new Date().toISOString(),
      
      // Phase 2: Planning calculations
      days_until_deadline: daysUntilDeadline,
      recommended_daily_time: 0,
      recommended_daily_pages: 0,
      is_on_track: true,
      urgency_level: 'normal' // low, normal, high, critical
    };

    // Calculate recommendations based on goal type
    if (targetType === 'daily_minutes') {
      goal.recommended_daily_time = targetValue;
    } else if (targetType === 'completion_date' && daysUntilDeadline > 0) {
      // Estimate based on typical reading speed (assume 1-2 pages per minute)
      const estimatedTotalPages = 100; // Will be updated with actual PDF data
      goal.recommended_daily_pages = Math.ceil(estimatedTotalPages / daysUntilDeadline);
      goal.recommended_daily_time = Math.ceil(goal.recommended_daily_pages * 2); // 2 minutes per page estimate
    }

    // Set urgency level
    if (daysUntilDeadline) {
      if (daysUntilDeadline <= 3) goal.urgency_level = 'critical';
      else if (daysUntilDeadline <= 7) goal.urgency_level = 'high';
      else if (daysUntilDeadline <= 14) goal.urgency_level = 'normal';
      else goal.urgency_level = 'low';
    }

    goals.push(goal);

    // Initialize goal analytics
    goalAnalytics[goalId] = {
      dailyProgress: {},
      streakDays: 0,
      missedDays: 0,
      adjustmentHistory: []
    };

    res.json({ 
      success: true, 
      goalId: goalId,
      recommendations: {
        dailyTime: goal.recommended_daily_time,
        dailyPages: goal.recommended_daily_pages,
        urgency: goal.urgency_level,
        daysRemaining: daysUntilDeadline
      },
      message: 'Goal created with smart planning recommendations' 
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal progress and recalculate recommendations
router.put('/:goalId/progress', async (req, res) => {
  try {
    const { goalId } = req.params;
    const { progress, sessionTime, pagesRead, currentPage, totalPages } = req.body;
    
    const goal = goals.find(g => g.id === goalId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    const analytics = goalAnalytics[goalId];
    
    // Update progress
    goal.current_progress = progress || goal.current_progress;
    goal.updated_at = new Date().toISOString();
    
    // Record daily progress
    if (!analytics.dailyProgress[today]) {
      analytics.dailyProgress[today] = {
        timeSpent: 0,
        pagesRead: 0,
        goalMet: false
      };
    }
    
    analytics.dailyProgress[today].timeSpent += sessionTime || 0;
    analytics.dailyProgress[today].pagesRead += pagesRead || 0;
    
    // Check if daily goal met
    const dailyTarget = goal.target_type === 'daily_minutes' ? goal.target_value * 60 : goal.recommended_daily_time * 60;
    analytics.dailyProgress[today].goalMet = analytics.dailyProgress[today].timeSpent >= dailyTarget;
    
    // Recalculate recommendations based on actual progress
    if (goal.end_date && totalPages && currentPage) {
      const deadline = new Date(goal.end_date);
      const now = new Date();
      const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      const pagesRemaining = totalPages - currentPage;
      
      if (daysRemaining > 0) {
        goal.recommended_daily_pages = Math.ceil(pagesRemaining / daysRemaining);
        
        // Adjust based on actual reading speed if available
        const recentSessions = Object.values(analytics.dailyProgress).slice(-7); // Last 7 days
        const avgPagesPerDay = recentSessions.reduce((sum, day) => sum + day.pagesRead, 0) / recentSessions.length || 1;
        const avgTimePerPage = recentSessions.reduce((sum, day) => sum + day.timeSpent, 0) / 
                              recentSessions.reduce((sum, day) => sum + day.pagesRead, 0) || 120; // Default 2 minutes per page
        
        goal.recommended_daily_time = Math.ceil(goal.recommended_daily_pages * (avgTimePerPage / 60));
        goal.is_on_track = avgPagesPerDay >= goal.recommended_daily_pages;
        
        // Update urgency based on progress
        if (!goal.is_on_track && daysRemaining <= 7) {
          goal.urgency_level = 'critical';
        }
      }
    }
    
    // Calculate streak
    const sortedDays = Object.keys(analytics.dailyProgress).sort().reverse();
    analytics.streakDays = 0;
    for (const day of sortedDays) {
      if (analytics.dailyProgress[day].goalMet) {
        analytics.streakDays++;
      } else {
        break;
      }
    }

    res.json({ 
      success: true, 
      goal: goal,
      analytics: {
        streakDays: analytics.streakDays,
        todaysProgress: analytics.dailyProgress[today],
        isOnTrack: goal.is_on_track,
        updatedRecommendations: {
          dailyTime: goal.recommended_daily_time,
          dailyPages: goal.recommended_daily_pages,
          urgency: goal.urgency_level
        }
      },
      message: 'Goal progress updated with smart recommendations' 
    });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    res.status(500).json({ error: 'Failed to update goal progress' });
  }
});

// Get all goals with current status
router.get('/', async (req, res) => {
  try {
    const enrichedGoals = goals.map(goal => {
      const analytics = goalAnalytics[goal.id] || { dailyProgress: {}, streakDays: 0 };
      const today = new Date().toISOString().split('T')[0];
      const todaysProgress = analytics.dailyProgress[today] || { timeSpent: 0, pagesRead: 0, goalMet: false };
      
      return {
        ...goal,
        todaysProgress: todaysProgress,
        streakDays: analytics.streakDays,
        progressPercentage: goal.target_type === 'daily_minutes' 
          ? Math.min(100, (todaysProgress.timeSpent / (goal.target_value * 60)) * 100)
          : Math.min(100, goal.current_progress)
      };
    });

    res.json(enrichedGoals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Get goal planning recommendations
router.get('/:goalId/planning', async (req, res) => {
  try {
    const { goalId } = req.params;
    const goal = goals.find(g => g.id === goalId);
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const analytics = goalAnalytics[goalId];
    const now = new Date();
    const deadline = goal.end_date ? new Date(goal.end_date) : null;
    const daysRemaining = deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : null;
    
    // Calculate detailed planning recommendations
    const planning = {
      timeManagement: {
        recommendedDailyTime: goal.recommended_daily_time,
        recommendedSessionLength: Math.min(45, Math.max(25, goal.recommended_daily_time)),
        recommendedBreakInterval: 25, // Pomodoro-style
        optimalStudyTimes: ['09:00', '14:00', '19:00'] // Suggest peak focus times
      },
      
      progressForecasting: {
        currentPace: 0,
        requiredPace: 0,
        completionDate: null,
        riskLevel: 'low'
      },
      
      adaptiveRecommendations: {
        increaseIntensity: false,
        takeBreak: false,
        adjustGoal: false,
        suggestions: []
      }
    };

    // Calculate current pace from recent sessions
    const recentDays = Object.keys(analytics.dailyProgress || {}).slice(-7);
    if (recentDays.length > 0) {
      const recentProgress = recentDays.reduce((sum, day) => 
        sum + (analytics.dailyProgress[day].timeSpent || 0), 0) / recentDays.length;
      planning.progressForecasting.currentPace = recentProgress / 60; // minutes per day
    }

    // Generate adaptive recommendations
    if (daysRemaining && daysRemaining <= 7 && !goal.is_on_track) {
      planning.adaptiveRecommendations.increaseIntensity = true;
      planning.adaptiveRecommendations.suggestions.push(
        `⚡ Urgent: Increase daily study time to ${Math.ceil(goal.recommended_daily_time * 1.5)} minutes`
      );
    }

    if (analytics.streakDays >= 7) {
      planning.adaptiveRecommendations.suggestions.push(
        `🔥 Great streak! Consider a well-deserved break day`
      );
    }

    if (goal.urgency_level === 'critical') {
      planning.adaptiveRecommendations.suggestions.push(
        `🚨 Critical deadline approaching. Focus on key sections only`
      );
    }

    res.json(planning);
  } catch (error) {
    console.error('Error fetching planning:', error);
    res.status(500).json({ error: 'Failed to fetch planning recommendations' });
  }
});

// Delete goal
router.delete('/:goalId', async (req, res) => {
  try {
    const { goalId } = req.params;
    goals = goals.filter(g => g.id !== goalId);
    delete goalAnalytics[goalId];
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
