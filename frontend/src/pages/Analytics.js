import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';

const Analytics = () => {
  return (
    <div className="analytics-page">
      <nav className="page-nav">
        <Link to="/" className="nav-link">
          <Home size={20} />
          Home
        </Link>
      </nav>
      <AnalyticsDashboard />
    </div>
  );
};

export default Analytics;
