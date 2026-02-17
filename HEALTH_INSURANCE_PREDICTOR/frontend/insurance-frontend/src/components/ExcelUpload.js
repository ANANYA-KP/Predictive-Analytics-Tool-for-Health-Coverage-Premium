// components/ExcelUpload.js
import React, { useState } from 'react';

const ExcelUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadData, setUploadData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setUploadData(null);
    setPredictions(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/upload-excel', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadData(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!uploadData?.file_id) {
      setError('No file uploaded');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/predict-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: uploadData.file_id })
      });

      const data = await response.json();

      if (response.ok) {
        setPredictions(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error making predictions');
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    if (predictions?.download_file) {
      window.open(`http://localhost:5000/download/${predictions.download_file}`, '_blank');
    }
  };

  return (
    <div className="excel-upload">
      <h1>Excel File Upload & Batch Prediction</h1>

      <div className="upload-section">
        <h3>Step 1: Upload Excel File</h3>
        <p>Upload an Excel file with columns: age, sex, bmi, children, smoker, region</p>
        
        <div className="file-input-container">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="file-input"
          />
          <button 
            onClick={handleUpload} 
            disabled={!file || loading}
            className="upload-btn"
          >
            {loading ? 'Uploading...' : 'Upload & Preview'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {uploadData && (
        <div className="preview-section">
          <h3>Step 2: File Preview</h3>
          <div className="file-summary">
            <p><strong>File:</strong> {uploadData.file_id}</p>
            <p><strong>Rows:</strong> {uploadData.summary.total_rows}</p>
            <p><strong>Columns:</strong> {uploadData.summary.columns.join(', ')}</p>
          </div>

          <div className="preview-table">
            <h4>Data Preview (First 10 rows):</h4>
            <table>
              <thead>
                <tr>
                  {uploadData.summary.columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploadData.summary.preview.map((row, idx) => (
                  <tr key={idx}>
                    {uploadData.summary.columns.map(col => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button 
            onClick={handlePredict} 
            disabled={loading}
            className="predict-btn"
          >
            {loading ? 'Processing...' : 'Generate Predictions'}
          </button>
        </div>
      )}

      {predictions && (
        <div className="results-section">
          <h3>Step 3: Prediction Results</h3>
          
          <div className="summary-stats">
            <h4>Summary Statistics:</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span>Total Predictions:</span> {predictions.summary.total_predictions}
              </div>
              <div className="stat-item">
                <span>Average Cost:</span> ₹{predictions.summary.average_cost.toFixed(2)}
              </div>
              <div className="stat-item">
                <span>Min Cost:</span> ₹{predictions.summary.min_cost.toFixed(2)}
              </div>
              <div className="stat-item">
                <span>Max Cost:</span> ₹{predictions.summary.max_cost.toFixed(2)}
              </div>
              <div className="stat-item">
                <span>Median Cost:</span> ₹{predictions.summary.median_cost.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="results-table">
            <h4>Results Preview:</h4>
            <table>
              <thead>
                <tr>
                  <th>Age</th>
                  <th>Sex</th>
                  <th>BMI</th>
                  <th>Children</th>
                  <th>Smoker</th>
                  <th>Region</th>
                  <th>Predicted Cost</th>
                </tr>
              </thead>
              <tbody>
                {predictions.results.slice(0, 10).map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.age}</td>
                    <td>{row.sex}</td>
                    <td>{row.bmi}</td>
                    <td>{row.children}</td>
                    <td>{row.smoker}</td>
                    <td>{row.region}</td>
                    <td>₹{row.predicted_cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={downloadResults} className="download-btn">
            📥 Download Complete Results
          </button>
        </div>
      )}
    </div>
  );
};

export default ExcelUpload;