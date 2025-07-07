import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import GoalsManager from '../components/goals/GoalsManager';

const Goals = () => {
  return (
    <div className="goals-page">
      <nav className="page-nav">
        <Link to="/" className="nav-link">
          <Home size={20} />
          Home
        </Link>
      </nav>
      <GoalsManager />
    </div>
  );
};

export default Goals;
