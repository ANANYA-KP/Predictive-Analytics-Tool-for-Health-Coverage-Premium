// components/CsvUpload.js
import React, { useState } from 'react';

const CsvUpload = () => {
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
      setError('Please select a CSV file');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid CSV file (.csv)');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/upload-csv', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadData(data);
      } else {
        setError(data.error || 'Error uploading file');
      }
    } catch (err) {
      setError('Error uploading file. Please check your connection.');
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
      const response = await fetch('http://localhost:5000/predict-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: uploadData.file_id })
      });

      const data = await response.json();

      if (response.ok) {
        setPredictions(data);
      } else {
        setError(data.error || 'Error making predictions');
      }
    } catch (err) {
      setError('Error making predictions. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    if (predictions?.download_file) {
      const link = document.createElement('a');
      link.href = `http://localhost:5000/download/${predictions.download_file}`;
      link.download = predictions.download_file;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadData(null);
    setPredictions(null);
    setError('');
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="csv-upload">
      <h1>CSV File Upload & Batch Prediction</h1>
      <p>Upload a CSV file to get insurance cost predictions for multiple records</p>

      <div className="upload-section">
        <h3>Step 1: Upload CSV File</h3>
        <div className="file-requirements">
          <h4>📋 Required CSV Format:</h4>
          <p><strong>Columns:</strong> age, sex, bmi, children, smoker, region</p>
          <div className="format-example">
            <strong>Example:</strong>
            <pre>
{`age,sex,bmi,children,smoker,region
39,female,27.9,0,no,southeast
25,male,26.2,2,yes,northwest
32,female,28.5,1,no,northeast`}
            </pre>
          </div>
          <div className="valid-values">
            <p><strong>Valid Values:</strong></p>
            <ul>
              <li><strong>sex:</strong> male, female</li>
              <li><strong>smoker:</strong> yes, no</li>
              <li><strong>region:</strong> northeast, northwest, southeast, southwest</li>
              <li><strong>age:</strong> 18-100 (whole numbers)</li>
              <li><strong>bmi:</strong> 10.0-50.0 (decimal numbers)</li>
              <li><strong>children:</strong> 0-10 (whole numbers)</li>
            </ul>
          </div>
        </div>
        
        <div className="file-input-container">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="file-input"
          />
          <button 
            onClick={handleUpload} 
            disabled={!file || loading}
            className="upload-btn"
          >
            {loading ? 'Uploading...' : '📤 Upload & Preview'}
          </button>
          
          <button 
            onClick={resetUpload}
            className="reset-btn"
            disabled={loading}
          >
            🔄 Reset
          </button>
        </div>

        {file && (
          <div className="file-info">
            <p><strong>Selected File:</strong> {file.name}</p>
            <p><strong>Size:</strong> {(file.size / 1024).toFixed(1)} KB</p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>

      {uploadData && (
        <div className="preview-section">
          <h3>Step 2: File Preview & Validation</h3>
          <div className="file-summary">
            <div className="summary-grid">
              <div className="summary-item success">
                <span className="summary-label">✅ Total Rows:</span>
                <span className="summary-value">{uploadData.summary.total_rows}</span>
              </div>
              <div className="summary-item success">
                <span className="summary-label">✅ Columns Found:</span>
                <span className="summary-value">{uploadData.summary.columns.join(', ')}</span>
              </div>
              {uploadData.summary.missing_values && Object.values(uploadData.summary.missing_values).some(v => v > 0) && (
                <div className="summary-item warning">
                  <span className="summary-label">⚠️ Missing Values:</span>
                  <span className="summary-value">
                    {Object.entries(uploadData.summary.missing_values)
                      .filter(([k, v]) => v > 0)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="categorical-summary">
            <h4>📊 Categorical Data Summary:</h4>
            <div className="category-grid">
              {Object.entries(uploadData.summary.categorical_value_counts || {}).map(([column, counts]) => (
                <div key={column} className="category-item">
                  <strong>{column}:</strong>
                  <div className="value-counts">
                    {Object.entries(counts).map(([value, count]) => (
                      <span key={value} className="value-count">
                        {value} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="preview-table">
            <h4>🔍 Data Preview (First 10 rows):</h4>
            <div className="table-container">
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
          </div>

          <div className="predict-section">
            <button 
              onClick={handlePredict} 
              disabled={loading}
              className="predict-btn"
            >
              {loading ? '🔄 Processing Predictions...' : '🎯 Generate Predictions'}
            </button>
          </div>
        </div>
      )}

      {predictions && (
        <div className="results-section">
          <h3>Step 3: Prediction Results</h3>
          
          <div className="success-message">
            <p>✅ <strong>Predictions completed successfully!</strong></p>
          </div>
          
          <div className="summary-stats">
            <h4>📈 Summary Statistics:</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Input Rows:</span>
                <span className="stat-value">{predictions.summary.total_input_rows}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Valid Predictions:</span>
                <span className="stat-value">{predictions.summary.total_predictions}</span>
              </div>
              {predictions.summary.rows_skipped > 0 && (
                <div className="stat-item warning">
                  <span className="stat-label">Rows Skipped:</span>
                  <span className="stat-value">{predictions.summary.rows_skipped}</span>
                </div>
              )}
              <div className="stat-item highlight">
                <span className="stat-label">Average Cost:</span>
                <span className="stat-value">₹{predictions.summary.average_cost.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Min Cost:</span>
                <span className="stat-value">₹{predictions.summary.min_cost.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max Cost:</span>
                <span className="stat-value">₹{predictions.summary.max_cost.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Median Cost:</span>
                <span className="stat-value">₹{predictions.summary.median_cost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="results-table">
            <h4>📊 Results Preview (First 10 predictions):</h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Age</th>
                    <th>Sex</th>
                    <th>BMI</th>
                    <th>Children</th>
                    <th>Smoker</th>
                    <th>Region</th>
                    <th className="prediction-col">Predicted Cost</th>
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
                      <td className="prediction-value">₹{row.predicted_cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {predictions.results.length > 10 && (
              <p className="table-note">... and {predictions.results.length - 10} more results</p>
            )}
          </div>

          <div className="download-section">
            <button onClick={downloadResults} className="download-btn">
              💾 Download Complete Results (CSV)
            </button>
            <p className="download-note">
              The complete results file contains all predictions with the original data
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvUpload;