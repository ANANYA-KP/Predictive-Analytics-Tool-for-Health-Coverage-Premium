// src/index.js - Fixed version without web-vitals
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, install web-vitals:
// npm install web-vitals
// Then uncomment the lines below:
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();