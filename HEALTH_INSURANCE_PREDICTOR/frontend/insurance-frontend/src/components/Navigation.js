// components/Navigation.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h3>🏥 Insurance Predictor</h3>
      </div>
      
      <div className="nav-links">
        <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
          Dashboard
        </Link>
        <Link to="/model-info" className={isActive('/model-info') ? 'active' : ''}>
          Model Info
        </Link>
        <Link to="/excel-upload" className={isActive('/excel-upload') ? 'active' : ''}>
          Excel Upload
        </Link>
        <Link to="/individual-prediction" className={isActive('/individual-prediction') ? 'active' : ''}>
          Prediction Form
        </Link>
      </div>

      <div className="nav-user">
        <span>Welcome, {user.username}</span>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
};
export default Navigation;