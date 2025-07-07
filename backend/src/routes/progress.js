const express = require('express');
const router = express.Router();

// Enhanced progress storage with daily tracking
let progressData = {};
let dailyStats = {};

// Get comprehensive reading progress for a file
router.get('/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    if (!progressData[fileId]) {
      progressData[fileId] = {
        fileId: fileId,
        currentPage: 1,
        totalPages: 100,
        timeSpent: 0,
        totalSessionTime: 0,
        sessionsCount: 0,
        averageReadingSpeed: 0,
        estimatedFinishTime: 0,
        lastAccessed: new Date().toISOString(),
        dailyProgress: {},
        weeklyGoal: 0,
        streakDays: 0
      };
    }
    
    // Add today's progress if not exists
    if (!progressData[fileId].dailyProgress[today]) {
      progressData[fileId].dailyProgress[today] = {
        timeSpent: 0,
        pagesRead: 0,
        sessionsCount: 0,
        goalMet: false
      };
    }
    
    // Calculate progress metrics
    const progress = progressData[fileId];
    const completionPercentage = (progress.currentPage / progress.totalPages) * 100;
    
    // Calculate reading streaks
    const sortedDays = Object.keys(progress.dailyProgress).sort().reverse();
    let streakDays = 0;
    for (const day of sortedDays) {
      if (progress.dailyProgress[day].timeSpent > 0) {
        streakDays++;
      } else {
        break;
      }
    }
    progress.streakDays = streakDays;
    
    res.json({
      ...progress,
      completionPercentage: completionPercentage,
      todaysProgress: progress.dailyProgress[today],
      streakDays: streakDays
    });
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Update reading progress with time tracking
router.post('/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const { currentPage, totalPages, sessionTime, totalTime, readingSpeed, estimatedFinishTime } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    if (!progressData[fileId]) {
      progressData[fileId] = {
        fileId: fileId,
        currentPage: 1,
        totalPages: 100,
        timeSpent: 0,
        totalSessionTime: 0,
        sessionsCount: 0,
        averageReadingSpeed: 0,
        estimatedFinishTime: 0,
        lastAccessed: new Date().toISOString(),
        dailyProgress: {},
        weeklyGoal: 1800, // 30 minutes default
        streakDays: 0
      };
    }
    
    const progress = progressData[fileId];
    
    // Update basic progress
    if (currentPage !== undefined) progress.currentPage = currentPage;
    if (totalPages !== undefined) progress.totalPages = totalPages;
    if (readingSpeed !== undefined) progress.averageReadingSpeed = readingSpeed;
    if (estimatedFinishTime !== undefined) progress.estimatedFinishTime = estimatedFinishTime;
    
    // Update time tracking
    if (sessionTime !== undefined) {
      progress.totalSessionTime += sessionTime;
      progress.sessionsCount += 1;
    }
    
    if (totalTime !== undefined) {
      progress.timeSpent = totalTime;
    }
    
    progress.lastAccessed = new Date().toISOString();
    
    // Update daily progress
    if (!progress.dailyProgress[today]) {
      progress.dailyProgress[today] = {
        timeSpent: 0,
        pagesRead: 0,
        sessionsCount: 0,
        goalMet: false
      };
    }
    
    if (sessionTime) {
      progress.dailyProgress[today].timeSpent += sessionTime;
      progress.dailyProgress[today].sessionsCount += 1;
      progress.dailyProgress[today].goalMet = progress.dailyProgress[today].timeSpent >= progress.weeklyGoal / 7;
    }
    
    // Update global daily stats
    if (!dailyStats[today]) {
      dailyStats[today] = {
        totalTime: 0,
        totalPages: 0,
        totalSessions: 0,
        filesWorkedOn: new Set(),
        goalsMet: 0
      };
    }
    
    if (sessionTime) {
      dailyStats[today].totalTime += sessionTime;
      dailyStats[today].totalSessions += 1;
      dailyStats[today].filesWorkedOn.add(fileId);
      
      if (progress.dailyProgress[today].goalMet) {
        dailyStats[today].goalsMet += 1;
      }
    }
    
    res.json({
      message: 'Progress updated with time tracking',
      fileId: fileId,
      currentPage: progress.currentPage,
      timeSpent: progress.timeSpent,
      todaysProgress: progress.dailyProgress[today],
      streakDays: progress.streakDays,
      completionPercentage: (progress.currentPage / progress.totalPages) * 100,
      updatedAt: progress.lastAccessed
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get daily dashboard statistics
router.get('/dashboard/today', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayStats = dailyStats[today] || {
      totalTime: 0,
      totalPages: 0,
      totalSessions: 0,
      filesWorkedOn: new Set(),
      goalsMet: 0
    };
    
    // Calculate weekly stats
    const weekDates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    
    const weeklyStats = weekDates.reduce((acc, date) => {
      const dayStats = dailyStats[date] || { totalTime: 0, totalPages: 0, totalSessions: 0, goalsMet: 0 };
      acc.totalTime += dayStats.totalTime;
      acc.totalPages += dayStats.totalPages;
      acc.totalSessions += dayStats.totalSessions;
      acc.goalsMet += dayStats.goalsMet;
      return acc;
    }, { totalTime: 0, totalPages: 0, totalSessions: 0, goalsMet: 0 });
    
    // Get active streaks across all files
    const allStreaks = Object.values(progressData).map(p => p.streakDays || 0);
    const maxStreak = Math.max(0, ...allStreaks);
    
    res.json({
      today: {
        timeSpent: todayStats.totalTime,
        pagesRead: todayStats.totalPages,
        sessionsCompleted: todayStats.totalSessions,
        filesWorkedOn: todayStats.filesWorkedOn.size,
        goalsMet: todayStats.goalsMet
      },
      thisWeek: {
        totalTime: weeklyStats.totalTime,
        totalPages: weeklyStats.totalPages,
        totalSessions: weeklyStats.totalSessions,
        averageDailyTime: Math.round(weeklyStats.totalTime / 7),
        goalsMet: weeklyStats.goalsMet
      },
      streaks: {
        currentMaxStreak: maxStreak,
        filesWithActiveStreaks: allStreaks.filter(s => s > 0).length
      },
      motivation: {
        level: maxStreak >= 7 ? 'Excellent' : maxStreak >= 3 ? 'Good' : 'Getting Started',
        message: generateMotivationalMessage(todayStats, maxStreak)
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

// Get historical progress data for analytics
router.get('/analytics/trends', (req, res) => {
  try {
    const { days = 30 } = req.query;
    const trendData = [];
    
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = dailyStats[dateStr] || {
        totalTime: 0,
        totalPages: 0,
        totalSessions: 0,
        goalsMet: 0
      };
      
      trendData.push({
        date: dateStr,
        timeSpent: dayData.totalTime,
        pagesRead: dayData.totalPages,
        sessions: dayData.totalSessions,
        goalsMet: dayData.goalsMet,
        efficiency: dayData.totalPages > 0 ? dayData.totalTime / dayData.totalPages : 0
      });
    }
    
    res.json(trendData);
  } catch (error) {
    console.error('Error getting trend data:', error);
    res.status(500).json({ error: 'Failed to get trend data' });
  }
});

// Get all progress data
router.get('/', (req, res) => {
  try {
    const allProgress = Object.values(progressData).map(progress => ({
      ...progress,
      completionPercentage: (progress.currentPage / progress.totalPages) * 100
    }));
    
    res.json(allProgress);
  } catch (error) {
    console.error('Error getting all progress:', error);
    res.status(500).json({ error: 'Failed to get all progress' });
  }
});

// Helper function to generate motivational messages
function generateMotivationalMessage(todayStats, streak) {
  if (streak >= 7) {
    return "🔥 Amazing! You're on a hot streak! Keep the momentum going!";
  } else if (streak >= 3) {
    return "💪 Great consistency! You're building a solid study habit!";
  } else if (todayStats.totalTime > 0) {
    return "🚀 Good start today! Every minute of study counts!";
  } else {
    return "📚 Ready to start your study session? Let's build that reading habit!";
  }
}

module.exports = router;
