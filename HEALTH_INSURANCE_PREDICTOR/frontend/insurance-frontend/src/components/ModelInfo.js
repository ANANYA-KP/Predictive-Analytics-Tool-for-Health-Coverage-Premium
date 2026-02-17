// components/ModelInfo.js
import React, { useState, useEffect } from 'react';

const ModelInfo = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const response = await fetch('http://localhost:5000/model-info');
      if (response.ok) {
        const data = await response.json();
        setModelInfo(data);
      } else {
        throw new Error('Failed to fetch model info');
      }
    } catch (err) {
      setError('Error loading model information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading model information...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="model-info">
      <h1>Model Information & Performance</h1>

      <div className="info-grid">
        <div className="info-card">
          <h3>Model Details</h3>
          <div className="info-item">
            <span>Type:</span> {modelInfo.model_type}
          </div>
          <div className="info-item">
            <span>Total Features:</span> {modelInfo.training_info?.total_features}
          </div>
          <div className="info-item">
            <span>Categorical Features:</span> {modelInfo.training_info?.categorical_features}
          </div>
          <div className="info-item">
            <span>Numerical Features:</span> {modelInfo.training_info?.numerical_features}
          </div>
        </div>

        <div className="info-card">
          <h3>Model Parameters</h3>
          {Object.entries(modelInfo.model_parameters || {}).map(([key, value]) => (
            <div key={key} className="info-item">
              <span>{key}:</span> {value?.toString()}
            </div>
          ))}
        </div>

        <div className="info-card">
          <h3>Performance Metrics</h3>
          {modelInfo.performance_metrics && (
            <>
              <div className="info-item">
                <span>R² Score:</span> {modelInfo.performance_metrics.r2_score?.toFixed(4)}
              </div>
              <div className="info-item">
                <span>RMSE:</span> ₹{modelInfo.performance_metrics.rmse?.toFixed(2)}
              </div>
              <div className="info-item">
                <span>MAE:</span> ₹{modelInfo.performance_metrics.mae?.toFixed(2)}
              </div>
            </>
          )}
        </div>

        <div className="info-card full-width">
          <h3>Feature Importance</h3>
          <div className="feature-importance">
            {modelInfo.feature_importance?.map((item, index) => (
              <div key={index} className="importance-item">
                <span className="feature-name">{item.feature}</span>
                <div className="importance-bar">
                  <div 
                    className="importance-fill" 
                    style={{width: `${(item.importance * 100)}%`}}
                  ></div>
                </div>
                <span className="importance-value">{(item.importance * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="info-card full-width">
          <h3>Valid Input Values</h3>
          <div className="input-values">
            {Object.entries(modelInfo.categorical_options || {}).map(([column, options]) => (
              <div key={column} className="value-group">
                <strong>{column}:</strong> {options.join(', ')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelInfo;