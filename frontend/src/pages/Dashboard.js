import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Upload, Clock } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Local Study Planner</h1>
        <p>Your personal study companion</p>
      </header>
      
      <main className="dashboard-main">
        <div className="dashboard-cards">
          <Link to="/files" className="dashboard-card">
            <BookOpen size={48} />
            <h3>My PDFs</h3>
            <p>Manage and organize your study materials</p>
          </Link>
          
          <div className="dashboard-card">
            <Clock size={48} />
            <h3>Study Progress</h3>
            <p>Track your reading time and progress</p>
          </div>
          
          <div className="dashboard-card">
            <Upload size={48} />
            <h3>Upload New PDF</h3>
            <p>Add new study materials</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
