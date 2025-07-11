// backend/src/services/notifications.js
// Frontend notification service

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.enabled = true;
    this.init();
  }

  async init() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission();
      }
    }
  }

  show(title, options = {}) {
    if (!this.enabled || this.permission !== 'granted') {
      return null;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'sprintstudy',
      requireInteraction: false,
      ...options
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  showSessionComplete(duration) {
    return this.show('Study Session Complete! 🎉', {
      body: `Great work! You studied for ${Math.round(duration / 60)} minutes.`,
      tag: 'session-complete'
    });
  }

  showBreakTime(type = 'short') {
    const message = type === 'long' ? 
      'Time for a long break! Take 15 minutes to recharge.' :
      'Time for a short break! Take 5 minutes to refresh.';
    
    return this.show('Break Time! ☕', {
      body: message,
      tag: 'break-time'
    });
  }

  showGoalAchieved(goalTitle) {
    return this.show('Goal Achieved! 🏆', {
      body: `Congratulations! You've completed: ${goalTitle}`,
      tag: 'goal-achieved'
    });
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

// React Context Provider
import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children, enabled = true }) => {
  const [notificationService, setNotificationService] = useState(null);

  useEffect(() => {
    const service = new NotificationService();
    service.enabled = enabled;
    setNotificationService(service);
  }, [enabled]);

  return (
    <NotificationContext.Provider value={notificationService}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// backend/src/services/insights-generator.js
const { Pool } = require('pg');

const currentUser = process.env.USER || process.env.USERNAME || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'study_planner',
  user: process.env.DB_USER || currentUser,
  password: process.env.DB_PASSWORD || '',
  ssl: false,
});

class InsightsGenerator {
  static async generateInsights() {
    try {
      console.log('🧠 Starting insights generation...');
      
      const insights = [];
      
      // Generate peak performance insights
      const peakHours = await this.analyzePeakPerformanceHours();
      if (peakHours.insight) {
        insights.push(peakHours.insight);
      }
      
      // Generate reading speed insights
      const speedInsights = await this.analyzeReadingSpeed();
      if (speedInsights.insight) {
        insights.push(speedInsights.insight);
      }
      
      // Generate focus pattern insights
      const focusInsights = await this.analyzeFocusPatterns();
      if (focusInsights.insight) {
        insights.push(focusInsights.insight);
      }
      
      // Generate productivity insights
      const productivityInsights = await this.analyzeProductivity();
      if (productivityInsights.insight) {
        insights.push(productivityInsights.insight);
      }
      
      // Store insights in database
      for (const insight of insights) {
        await this.storeInsight(insight);
      }
      
      console.log(`✅ Generated ${insights.length} insights`);
      return insights;
      
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }
  
  static async analyzePeakPerformanceHours() {
    try {
      const result = await pool.query(`
        SELECT 
          EXTRACT(hour FROM session_start) as hour,
          AVG(focus_rating) as avg_focus,
          COUNT(*) as session_count,
          AVG(pages_covered::DECIMAL / NULLIF(total_duration_seconds / 3600.0, 0)) as pages_per_hour
        FROM study_sessions 
        WHERE session_start >= CURRENT_DATE - INTERVAL '30 days'
          AND focus_rating IS NOT NULL
          AND total_duration_seconds > 300
        GROUP BY EXTRACT(hour FROM session_start)
        HAVING COUNT(*) >= 3
        ORDER BY avg_focus DESC, pages_per_hour DESC
        LIMIT 3
      `);
      
      if (result.rows.length > 0) {
        const bestHour = result.rows[0];
        const confidence = Math.min(0.7 + (bestHour.session_count * 0.05), 0.95);
        
        return {
          insight: {
            type: 'peak_performance',
            title: 'Peak Performance Window Identified',
            description: `Your focus is highest around ${bestHour.hour}:00. ` +
                        `You achieve ${bestHour.avg_focus.toFixed(1)}/5 focus score during this time. ` +
                        `Consider scheduling your most challenging study materials during this window.`,
            confidence: confidence,
            actionable: true,
            data: { peakHour: bestHour.hour, avgFocus: bestHour.avg_focus },
            recommendations: [
              `Schedule complex topics around ${bestHour.hour}:00`,
              'Block this time for deep work',
              'Minimize distractions during peak hours'
            ]
          }
        };
      }
      
      return { insight: null };
    } catch (error) {
      console.error('Error analyzing peak performance:', error);
      return { insight: null };
    }
  }
  
  static async analyzeReadingSpeed() {
    try {
      const result = await pool.query(`
        SELECT 
          DATE_TRUNC('week', session_start) as week,
          AVG(pages_covered::DECIMAL / NULLIF(total_duration_seconds / 3600.0, 0)) as avg_pages_per_hour
        FROM study_sessions 
        WHERE session_start >= CURRENT_DATE - INTERVAL '8 weeks'
          AND total_duration_seconds > 600
          AND pages_covered > 0
        GROUP BY DATE_TRUNC('week', session_start)
        ORDER BY week DESC
        LIMIT 8
      `);
      
      if (result.rows.length >= 4) {
        const recent = result.rows.slice(0, 2);
        const older = result.rows.slice(-2);
        
        const recentAvg = recent.reduce((sum, row) => sum + parseFloat(row.avg_pages_per_hour), 0) / recent.length;
        const olderAvg = older.reduce((sum, row) => sum + parseFloat(row.avg_pages_per_hour), 0) / older.length;
        
        const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        if (Math.abs(improvement) > 10) {
          return {
            insight: {
              type: 'reading_speed',
              title: improvement > 0 ? 'Reading Speed Improvement' : 'Reading Speed Decline',
              description: improvement > 0 ? 
                `Your reading speed has improved by ${improvement.toFixed(1)}% over the past month. ` +
                `You're now reading ${recentAvg.toFixed(1)} pages per hour on average. Keep up the great work!` :
                `Your reading speed has decreased by ${Math.abs(improvement).toFixed(1)}% recently. ` +
                `Consider adjusting your study environment or taking more breaks.`,
              confidence: 0.85,
              actionable: improvement < 0,
              data: { improvement: improvement, currentSpeed: recentAvg },
              recommendations: improvement < 0 ? [
                'Take regular breaks to maintain focus',
                'Ensure proper lighting and posture',
                'Consider if material difficulty has increased'
              ] : [
                'Maintain your current study routine',
                'Try tackling more challenging materials'
              ]
            }
          };
        }
      }
      
      return { insight: null };
    } catch (error) {
      console.error('Error analyzing reading speed:', error);
      return { insight: null };
    }
  }
  
  static async analyzeFocusPatterns() {
    try {
      const result = await pool.query(`
        SELECT 
          EXTRACT(dow FROM session_start) as day_of_week,
          AVG(focus_rating) as avg_focus,
          AVG(distractions_count) as avg_distractions,
          COUNT(*) as session_count
        FROM study_sessions 
        WHERE session_start >= CURRENT_DATE - INTERVAL '4 weeks'
          AND focus_rating IS NOT NULL
        GROUP BY EXTRACT(dow FROM session_start)
        HAVING COUNT(*) >= 2
        ORDER BY avg_focus DESC
      `);
      
      if (result.rows.length >= 5) {
        const bestDay = result.rows[0];
        const worstDay = result.rows[result.rows.length - 1];
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        if (bestDay.avg_focus - worstDay.avg_focus > 0.5) {
          return {
            insight: {
              type: 'focus_patterns',
              title: 'Weekly Focus Pattern Detected',
              description: `Your focus is consistently higher on ${dayNames[bestDay.day_of_week]}s ` +
                          `(${bestDay.avg_focus.toFixed(1)}/5) compared to ${dayNames[worstDay.day_of_week]}s ` +
                          `(${worstDay.avg_focus.toFixed(1)}/5). Consider scheduling important study ` +
                          `sessions on your high-focus days.`,
              confidence: 0.80,
              actionable: true,
              data: { 
                bestDay: dayNames[bestDay.day_of_week], 
                worstDay: dayNames[worstDay.day_of_week],
                focusDifference: bestDay.avg_focus - worstDay.avg_focus
              },
              recommendations: [
                `Schedule challenging topics on ${dayNames[bestDay.day_of_week]}s`,
                `Use ${dayNames[worstDay.day_of_week]}s for review or easier materials`,
                'Plan rest days around low-focus periods'
              ]
            }
          };
        }
      }
      
      return { insight: null };
    } catch (error) {
      console.error('Error analyzing focus patterns:', error);
      return { insight: null };
    }
  }
  
  static async analyzeProductivity() {
    try {
      const result = await pool.query(`
        SELECT 
          total_study_minutes,
          pages_read,
          sessions_completed,
          avg_focus_rating,
          daily_goal_minutes,
          goal_achieved
        FROM daily_study_progress 
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
          AND total_study_minutes > 0
        ORDER BY date DESC
      `);
      
      if (result.rows.length >= 14) {
        const goalAchievementRate = result.rows.filter(row => row.goal_achieved).length / result.rows.length;
        const avgSessionLength = result.rows.reduce((sum, row) => 
          sum + (row.total_study_minutes / row.sessions_completed), 0) / result.rows.length;
        
        if (goalAchievementRate < 0.5) {
          return {
            insight: {
              type: 'productivity',
              title: 'Goal Achievement Opportunity',
              description: `You're achieving your daily goals ${(goalAchievementRate * 100).toFixed(0)}% of the time. ` +
                          `Your average session length is ${avgSessionLength.toFixed(0)} minutes. ` +
                          `Consider breaking study time into smaller, more manageable sessions.`,
              confidence: 0.75,
              actionable: true,
              data: { 
                achievementRate: goalAchievementRate,
                avgSessionLength: avgSessionLength
              },
              recommendations: [
                'Try shorter 25-minute focus sessions',
                'Set smaller, more achievable daily goals',
                'Use the Pomodoro technique for better focus'
              ]
            }
          };
        } else if (goalAchievementRate > 0.8) {
          return {
            insight: {
              type: 'productivity',
              title: 'Excellent Goal Achievement',
              description: `Outstanding! You're achieving your daily goals ${(goalAchievementRate * 100).toFixed(0)}% of the time. ` +
                          `Consider increasing your daily target to continue challenging yourself.`,
              confidence: 0.90,
              actionable: true,
              data: { 
                achievementRate: goalAchievementRate,
                avgSessionLength: avgSessionLength
              },
              recommendations: [
                'Consider increasing your daily goal by 15-20%',
                'Add more challenging study materials',
                'Share your success strategies with others'
              ]
            }
          };
        }
      }
      
      return { insight: null };
    } catch (error) {
      console.error('Error analyzing productivity:', error);
      return { insight: null };
    }
  }
  
  static async storeInsight(insight) {
    try {
      await pool.query(`
        INSERT INTO study_insights 
        (insight_type, insight_data, confidence_score, date_range_start, date_range_end, is_actionable)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        insight.type,
        JSON.stringify(insight),
        insight.confidence,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date(),
        insight.actionable
      ]);
    } catch (error) {
      console.error('Error storing insight:', error);
    }
  }
  
  static async getRecentInsights(limit = 10) {
    try {
      const result = await pool.query(`
        SELECT insight_data, confidence_score, created_at
        FROM study_insights 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY created_at DESC, confidence_score DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows.map(row => ({
        ...JSON.parse(row.insight_data),
        confidence: row.confidence_score,
        generated_at: row.created_at
      }));
    } catch (error) {
      console.error('Error getting recent insights:', error);
      return [];
    }
  }
}

module.exports = { generateInsights: InsightsGenerator.generateInsights.bind(InsightsGenerator) };

// backend/src/services/spaced-repetition.js
const { Pool } = require('pg');

const currentUser = process.env.USER || process.env.USERNAME || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'study_planner',
  user: process.env.DB_USER || currentUser,
  password: process.env.DB_PASSWORD || '',
  ssl: false,
});

const updateSpacedRepetition = async () => {
  try {
    // Update review schedule for completed study sessions
    const result = await pool.query(`
      SELECT DISTINCT ss.file_id, spa.page_number, ss.focus_rating
      FROM study_sessions ss
      JOIN session_page_activity spa ON ss.id = spa.session_id
      WHERE ss.session_end >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
        AND ss.focus_rating IS NOT NULL
        AND spa.duration_seconds >= 60
    `);
    
    for (const row of result.rows) {
      await pool.query('SELECT update_review_schedule($1, $2, $3)', [
        row.file_id,
        row.page_number,
        row.focus_rating
      ]);
    }
    
    console.log(`Updated spaced repetition for ${result.rows.length} pages`);
  } catch (error) {
    console.error('Error updating spaced repetition:', error);
  }
};

module.exports = { updateSpacedRepetition };