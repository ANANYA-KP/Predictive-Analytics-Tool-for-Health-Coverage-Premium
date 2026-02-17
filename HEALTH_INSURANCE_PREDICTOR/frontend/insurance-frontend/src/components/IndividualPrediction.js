// components/IndividualPrediction.js
import React, { useState, useEffect } from 'react';
import PredictionResultGraphs from './PredictionResultGraphs';

const IndividualPrediction = () => {
  const [formData, setFormData] = useState({
    age: '',
    sex: '',
    height: '',
    weight: '',
    heightUnit: 'cm',
    weightUnit: 'kg',
    children: '',
    smoker: '',
    district: '',
    region: ''
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modelInfo, setModelInfo] = useState(null);

  // Karnataka districts organized by correct geographical regions
  const karnatakaDistricts = {
    northeast: ['Bidar', 'Kalaburagi', 'Yadgir', 'Raichur', 'Koppal', 'Ballari'],
    northwest: ['Belagavi', 'Bagalkot', 'Vijayapura', 'Dharwad', 'Gadag', 'Haveri', 'Uttara Kannada'],
    southeast: [
      'Bengaluru Urban', 'Bengaluru Rural', 'Ramanagara', 'Tumakuru',
      'Kolar', 'Chikkaballapur', 'Chitradurga', 'Davanagere'
    ],
    southwest: [
      'Mysuru', 'Mandya', 'Hassan', 'Kodagu', 'Chamarajanagar',
      'Dakshina Kannada', 'Udupi', 'Shivamogga', 'Chikkamagaluru'
    ]
  };

  // Get region based on district
  const getRegionForDistrict = (district) => {
    for (const [region, districts] of Object.entries(karnatakaDistricts)) {
      if (districts.includes(district)) {
        return region;
      }
    }
    return '';
  };

  const formatRegionName = (region) =>
    region ? region.charAt(0).toUpperCase() + region.slice(1) : '';

  // Flatten all districts for dropdown
  const allDistricts = Object.values(karnatakaDistricts).flat().sort();

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const response = await fetch('http://localhost:5000/model-info');
      const data = await response.json();
      setModelInfo(data);
    } catch (err) {
      console.error('Error fetching model info:', err);
    }
  };

  // BMI calculation
  const calculateBMI = (height, weight, heightUnit, weightUnit) => {
    let heightInMeters, weightInKg;

    if (heightUnit === 'cm') {
      heightInMeters = parseFloat(height) / 100;
    } else if (heightUnit === 'inches') {
      heightInMeters = parseFloat(height) * 0.0254;
    } else {
      throw new Error('Invalid height unit');
    }

    if (weightUnit === 'kg') {
      weightInKg = parseFloat(weight);
    } else if (weightUnit === 'lbs') {
      weightInKg = parseFloat(weight) * 0.453592;
    } else {
      throw new Error('Invalid weight unit');
    }

    return weightInKg / (heightInMeters * heightInMeters);
  };

  const getCalculatedBMI = () => {
    if (formData.height && formData.weight) {
      try {
        return calculateBMI(
          formData.height,
          formData.weight,
          formData.heightUnit,
          formData.weightUnit
        ).toFixed(2);
      } catch {
        return null;
      }
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const updatedFormData = {
      ...formData,
      [name]: value
    };

    // Auto-set region when district is selected
    if (name === 'district' && value) {
      updatedFormData.region = getRegionForDistrict(value);
    }

    setFormData(updatedFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPrediction(null);

    try {
      const bmi = calculateBMI(
        formData.height,
        formData.weight,
        formData.heightUnit,
        formData.weightUnit
      );

      const dataToSend = {
        age: parseInt(formData.age),
        sex: formData.sex,
        bmi: parseFloat(bmi.toFixed(2)),
        children: parseInt(formData.children),
        smoker: formData.smoker,
        region: formData.region
      };

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok) {
        result.input_data_display = {
          ...result.input_data,
          height: `${formData.height} ${formData.heightUnit}`,
          weight: `${formData.weight} ${formData.weightUnit}`,
          calculated_bmi: bmi.toFixed(2),
          district: formData.district,
          region: formatRegionName(formData.region)
        };
        setPrediction(result);
      } else {
        setError(result.error || 'Prediction failed');
      }
    } catch (err) {
      setError(
        err.message.includes('Invalid')
          ? err.message
          : 'Network error. Make sure the API server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      age: '',
      sex: '',
      height: '',
      weight: '',
      heightUnit: 'cm',
      weightUnit: 'kg',
      children: '',
      smoker: '',
      district: '',
      region: ''
    });
    setPrediction(null);
    setError('');
  };

  const calculatedBMI = getCalculatedBMI();

  return (
    <div className="individual-prediction">
      <h1>Individual Insurance Cost Prediction</h1>
      <p>Enter the details below to get an estimated insurance cost for Karnataka</p>

      <div className="prediction-container">
        {/* ===== Prediction Form ===== */}
        <form onSubmit={handleSubmit} className="prediction-form">
          <div className="form-row">
            <div className="form-group">
              <label>Age:</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="18"
                max="100"
                required
              />
            </div>

            <div className="form-group">
              <label>Sex:</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleInputChange}
                required
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Height:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  min="50"
                  max="250"
                  step="0.1"
                  required
                  style={{ flex: 2 }}
                />
                <select
                  name="heightUnit"
                  value={formData.heightUnit}
                  onChange={handleInputChange}
                  style={{ flex: 1 }}
                >
                  <option value="cm">cm</option>
                  <option value="inches">inches</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Weight:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  min="20"
                  max="300"
                  step="0.1"
                  required
                  style={{ flex: 2 }}
                />
                <select
                  name="weightUnit"
                  value={formData.weightUnit}
                  onChange={handleInputChange}
                  style={{ flex: 1 }}
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>
          </div>

          {calculatedBMI && (
            <div className="form-row">
              <div className="form-group">
                <label>Calculated BMI:</label>
                <div
                  style={{
                    padding: '10px',
                    backgroundColor: '#f0f8ff',
                    border: '1px solid #b0d4f1',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    color: '#2c5282'
                  }}
                >
                  {calculatedBMI}
                </div>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Children:</label>
              <input
                type="number"
                name="children"
                value={formData.children}
                onChange={handleInputChange}
                min="0"
                max="10"
                required
              />
            </div>

            <div className="form-group">
              <label>Smoker:</label>
              <select
                name="smoker"
                value={formData.smoker}
                onChange={handleInputChange}
                required
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>District (Karnataka):</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                required
              >
                <option value="">Select District</option>
                {allDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            {formData.region && (
              <div className="form-group">
                <label>Region:</label>
                <div
                  style={{
                    padding: '10px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    color: '#0369a1',
                    textTransform: 'capitalize'
                  }}
                >
                  {formatRegionName(formData.region)}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="predict-btn">
              {loading ? 'Predicting...' : '🎯 Predict Cost'}
            </button>

            <button type="button" onClick={resetForm} className="reset-btn">
              🔄 Reset Form
            </button>
          </div>
        </form>

        {/* ===== Error Message ===== */}
        {error && (
          <div className="error-result">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {/* ===== Prediction Result ===== */}
        {prediction && (
          <div className="prediction-result">
            <h3>🎯 Prediction Result</h3>
            <div className="result-cost">
              <span className="cost-label">Estimated Annual Insurance Cost:</span>
              <span className="cost-value">₹{prediction.predicted_cost}</span>
            </div>

            <div className="input-summary">
              <h4>Input Summary:</h4>
              <div className="summary-grid">
                <div><strong>Age:</strong> {prediction.input_data.age} years</div>
                <div><strong>Sex:</strong> {prediction.input_data.sex}</div>
                <div><strong>Height:</strong> {prediction.input_data_display?.height}</div>
                <div><strong>Weight:</strong> {prediction.input_data_display?.weight}</div>
                <div><strong>BMI:</strong> {prediction.input_data_display?.calculated_bmi}</div>
                <div><strong>Children:</strong> {prediction.input_data.children}</div>
                <div><strong>Smoker:</strong> {prediction.input_data.smoker}</div>
                <div><strong>District:</strong> {prediction.input_data_display?.district}</div>
                <div><strong>Region:</strong> {prediction.input_data_display?.region}</div>
              </div>
            </div>

            {/* ===== Render Graphs Component ===== */}
            <PredictionResultGraphs prediction={prediction} />
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualPrediction;
