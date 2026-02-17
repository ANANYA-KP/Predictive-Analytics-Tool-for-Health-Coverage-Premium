from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import json
import io
import os
from werkzeug.utils import secure_filename
import tempfile

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Load the trained model
print("Loading model...")
try:
    model_data = joblib.load('insurance_model.joblib')
    model = model_data['model']
    label_encoders = model_data['label_encoders']
    feature_columns = model_data['feature_columns']
    categorical_columns = model_data['categorical_columns']
    numerical_columns = model_data['numerical_columns']
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Load model metadata
try:
    with open('model_metadata.json', 'r') as f:
        model_metadata = json.load(f)
    print("Model metadata loaded successfully!")
except Exception as e:
    print(f"Error loading metadata: {e}")
    model_metadata = {}

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "Insurance Cost Prediction API",
        "status": "running",
        "model_loaded": model is not None,
        "endpoints": {
            "POST /login": "Dummy authentication",
            "GET /model-info": "Get model information and performance",
            "POST /predict": "Single prediction",
            "POST /upload-csv": "Upload and preview CSV file",
            "POST /predict-csv": "Batch prediction from CSV file",
            "POST /download/<filename>": "Download results file"
        }
    })

@app.route('/login', methods=['POST'])
def login():
    """Dummy login endpoint"""
    data = request.json
    username = data.get('username', '')
    password = data.get('password', '')
    
    # Dummy validation - accept any non-empty credentials
    if username and password:
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "username": username,
                "role": "analyst",
                "token": f"dummy_token_{username}"
            }
        })
    else:
        return jsonify({
            "success": False,
            "message": "Please provide username and password"
        }), 400

@app.route('/model-info', methods=['GET'])
def get_model_info():
    """Get comprehensive model information and performance metrics"""
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    # Get model parameters
    model_params = {
        "n_estimators": model.n_estimators,
        "max_depth": model.max_depth,
        "min_samples_split": model.min_samples_split,
        "min_samples_leaf": model.min_samples_leaf,
        "random_state": model.random_state
    }
    
    response = {
        "model_type": "Random Forest Regressor",
        "model_parameters": model_params,
        "feature_columns": feature_columns,
        "categorical_columns": categorical_columns,
        "numerical_columns": numerical_columns,
        "categorical_options": {
            col: list(label_encoders[col].classes_) 
            for col in categorical_columns
        },
        "performance_metrics": model_metadata.get('model_performance', {}),
        "feature_importance": model_metadata.get('feature_importance', []),
        "training_info": {
            "total_features": len(feature_columns),
            "categorical_features": len(categorical_columns),
            "numerical_features": len(numerical_columns)
        }
    }
    
    return jsonify(response)

@app.route('/predict', methods=['POST'])
def predict_single():
    """Single prediction endpoint"""
    try:
        if model is None:
            return jsonify({"error": "Model not loaded"}), 500
        
        data = request.json
        required_fields = ['age', 'sex', 'bmi', 'children', 'smoker', 'region']
        
        # Validate required fields
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400
        
        # Create input dataframe
        input_data = pd.DataFrame({
            'age': [data['age']],
            'sex': [data['sex']],
            'bmi': [data['bmi']],
            'children': [data['children']],
            'smoker': [data['smoker']],
            'region': [data['region']]
        })
        
        # Encode categorical variables
        for col in categorical_columns:
            try:
                input_data[col] = label_encoders[col].transform(input_data[col])
            except ValueError as e:
                return jsonify({
                    "error": f"Invalid value for {col}. Valid values: {list(label_encoders[col].classes_)}"
                }), 400
        
        # Make prediction
        prediction = model.predict(input_data)
        predicted_cost = float(prediction[0])
        
        return jsonify({
            "predicted_cost": round(predicted_cost, 2),
            "input_data": data,
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/upload-csv', methods=['POST'])
def upload_csv():
    """Upload and preview CSV file"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.lower().endswith('.csv'):
            return jsonify({"error": "Please upload a CSV file (.csv)"}), 400
        
        # Read CSV file
        try:
            # Try different encodings in case of encoding issues
            try:
                df = pd.read_csv(file, encoding='utf-8')
            except UnicodeDecodeError:
                file.seek(0)
                df = pd.read_csv(file, encoding='latin-1')
            except:
                file.seek(0)
                df = pd.read_csv(file, encoding='cp1252')
        except Exception as e:
            return jsonify({"error": f"Error reading CSV file: {str(e)}"}), 400
        
        # Validate columns
        required_columns = ['age', 'sex', 'bmi', 'children', 'smoker', 'region']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return jsonify({
                "error": f"Missing required columns: {missing_columns}",
                "required_columns": required_columns,
                "found_columns": list(df.columns)
            }), 400
        
        # Clean column names (strip whitespace)
        df.columns = df.columns.str.strip()
        
        # Preview data (first 10 rows)
        preview_data = df.head(10).to_dict('records')
        
        # Data summary
        summary = {
            "total_rows": len(df),
            "columns": list(df.columns),
            "data_types": df.dtypes.astype(str).to_dict(),
            "missing_values": df.isnull().sum().to_dict(),
            "preview": preview_data,
            "categorical_value_counts": {}
        }
        
        # Add value counts for categorical columns
        for col in categorical_columns:
            if col in df.columns:
                summary["categorical_value_counts"][col] = df[col].value_counts().to_dict()
        
        # Store file temporarily for prediction
        filename = secure_filename(file.filename)
        temp_filename = f"temp_{filename}"
        temp_path = os.path.join(UPLOAD_FOLDER, temp_filename)
        
        # Reset file pointer and save
        file.seek(0)
        df.to_csv(temp_path, index=False)
        
        return jsonify({
            "success": True,
            "message": "CSV file uploaded successfully",
            "file_id": temp_filename,
            "summary": summary
        })
        
    except Exception as e:
        return jsonify({"error": f"Error processing CSV file: {str(e)}"}), 500

@app.route('/predict-csv', methods=['POST'])
def predict_csv():
    """Batch prediction from CSV file"""
    try:
        if model is None:
            return jsonify({"error": "Model not loaded"}), 500
        
        data = request.json
        file_id = data.get('file_id')
        
        if not file_id:
            return jsonify({"error": "No file_id provided"}), 400
        
        file_path = os.path.join(UPLOAD_FOLDER, file_id)
        
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found. Please upload again."}), 404
        
        # Read CSV file
        df = pd.read_csv(file_path)
        
        # Clean column names
        df.columns = df.columns.str.strip()
        
        # Validate required columns
        required_columns = ['age', 'sex', 'bmi', 'children', 'smoker', 'region']
        if not all(col in df.columns for col in required_columns):
            return jsonify({"error": "Invalid file format or missing columns"}), 400
        
        # Prepare data for prediction
        df_pred = df[required_columns].copy()
        
        # Clean data
        df_pred = df_pred.dropna()  # Remove rows with missing values
        
        if len(df_pred) == 0:
            return jsonify({"error": "No valid data rows found after cleaning"}), 400
        
        # Encode categorical variables
        for col in categorical_columns:
            try:
                df_pred[col] = label_encoders[col].transform(df_pred[col])
            except ValueError as e:
                invalid_values = set(df[col].dropna().astype(str).unique()) - set(label_encoders[col].classes_)
                return jsonify({
                    "error": f"Invalid values in column '{col}': {list(invalid_values)}",
                    "valid_values": list(label_encoders[col].classes_)
                }), 400
        
        # Make predictions
        predictions = model.predict(df_pred)
        
        # Add predictions to original dataframe (for valid rows)
        df_results = df.loc[df_pred.index].copy()
        df_results['predicted_cost'] = np.round(predictions, 2)
        
        # Calculate summary statistics
        summary_stats = {
            "total_predictions": len(predictions),
            "total_input_rows": len(df),
            "valid_rows_processed": len(df_results),
            "rows_skipped": len(df) - len(df_results),
            "average_cost": float(np.mean(predictions)),
            "min_cost": float(np.min(predictions)),
            "max_cost": float(np.max(predictions)),
            "median_cost": float(np.median(predictions)),
            "std_cost": float(np.std(predictions))
        }
        
        # Convert results to list of dictionaries
        results = df_results.to_dict('records')
        
        # Save results file
        results_filename = f"results_{file_id}"
        results_path = os.path.join(UPLOAD_FOLDER, results_filename)
        df_results.to_csv(results_path, index=False)
        
        return jsonify({
            "success": True,
            "message": "Predictions completed successfully",
            "summary": summary_stats,
            "results": results,
            "download_file": results_filename
        })
        
    except Exception as e:
        return jsonify({"error": f"Error making predictions: {str(e)}"}), 500

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download results file"""
    try:
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Cleanup old temporary files (optional)
@app.route('/cleanup', methods=['POST'])
def cleanup_temp_files():
    """Clean up temporary files"""
    try:
        count = 0
        for filename in os.listdir(UPLOAD_FOLDER):
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            os.remove(file_path)
            count += 1
        
        return jsonify({
            "success": True,
            "message": f"Cleaned up {count} temporary files"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

# Updated Requirements (removed Excel dependencies):
# flask==2.3.2
# flask-cors==4.0.0
# pandas==2.0.3
# joblib==1.3.1
# scikit-learn==1.3.0
# numpy==1.24.3
# werkzeug==2.3.6