// components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/');
      const data = await response.json();
      setApiStatus(data);
    } catch (error) {
      setApiStatus({ status: 'error', message: 'API connection failed' });
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Health Insurance Cost Prediction Dashboard</h1>
        <p>Predict insurance costs using machine learning</p>
      </div>

      <div className="status-card">
        <h3>System Status</h3>
        <div className="status-item">
          <span>API Connection:</span>
          <span className={`status ${apiStatus?.status === 'running' ? 'online' : 'offline'}`}>
            {apiStatus?.status === 'running' ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
        <div className="status-item">
          <span>Model Status:</span>
          <span className={`status ${apiStatus?.model_loaded ? 'loaded' : 'error'}`}>
            {apiStatus?.model_loaded ? '🟢 Loaded' : '🔴 Not Loaded'}
          </span>
        </div>
      </div>

      <div className="feature-grid">
        <Link to="/model-info" className="feature-card">
          <h3>📊 Model Information</h3>
          <p>View model parameters, performance metrics, and feature importance</p>
        </Link>

        <Link to="/excel-upload" className="feature-card">
          <h3>📁 Excel Upload</h3>
          <p>Upload Excel files for batch predictions and download results</p>
        </Link>

        <Link to="/individual-prediction" className="feature-card">
          <h3>🎯 Individual Prediction</h3>
          <p>Make single predictions using the interactive form</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;