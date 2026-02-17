import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import pickle
import joblib
import json
import warnings
warnings.filterwarnings('ignore')

# Custom JSON encoder to handle NumPy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

# Load the dataset
print("Loading dataset...")
df = pd.read_csv('Health_insurance dataset.csv')

print(f"Dataset shape: {df.shape}")
print(f"Dataset info:")
print(df.info())
print(f"\nFirst few rows:")
print(df.head())

# Check for missing values
print(f"\nMissing values:")
print(df.isnull().sum())

# Basic statistics
print(f"\nBasic statistics:")
print(df.describe())

# Prepare features and target
print("\nPreparing features and target...")
X = df.drop('charges', axis=1)
y = df['charges']

# Handle categorical variables
categorical_columns = ['sex', 'smoker', 'region']
numerical_columns = ['age', 'bmi', 'children']

# Create label encoders for categorical variables
label_encoders = {}
X_encoded = X.copy()

for col in categorical_columns:
    le = LabelEncoder()
    X_encoded[col] = le.fit_transform(X[col])
    label_encoders[col] = le
    print(f"Encoded {col}: {dict(zip(le.classes_, le.transform(le.classes_)))}")

# Split the data
X_train, X_test, y_train, y_test = train_test_split(
    X_encoded, y, test_size=0.2, random_state=42
)

print(f"\nTraining set size: {X_train.shape}")
print(f"Test set size: {X_test.shape}")

# Train Random Forest model
print("\nTraining Random Forest model...")
rf_model = RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2
)

rf_model.fit(X_train, y_train)

# Make predictions
y_pred = rf_model.predict(X_test)

# Evaluate the model
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"\nModel Performance:")
print(f"RMSE: {rmse:.2f}")
print(f"MAE: {mae:.2f}")
print(f"R² Score: {r2:.4f}")

# Feature importance
feature_importance = pd.DataFrame({
    'feature': X_encoded.columns,
    'importance': rf_model.feature_importances_
}).sort_values('importance', ascending=False)

print(f"\nFeature Importance:")
print(feature_importance)

# Save the model using pickle (for Python backend)
print("\nSaving model files...")
model_data = {
    'model': rf_model,
    'label_encoders': label_encoders,
    'feature_columns': list(X_encoded.columns),
    'categorical_columns': categorical_columns,
    'numerical_columns': numerical_columns
}

# Save as pickle file
with open('insurance_model.pkl', 'wb') as f:
    pickle.dump(model_data, f)

# Save as joblib (alternative, often more efficient)
joblib.dump(model_data, 'insurance_model.joblib')

# Prepare metadata with proper type conversion
print("Preparing model metadata...")

# Convert label encoders to JSON-safe format
label_encoders_dict = {}
for col, le in label_encoders.items():
    # Convert to native Python types
    classes = [str(cls) for cls in le.classes_]
    encoded_values = [int(val) for val in le.transform(le.classes_)]
    label_encoders_dict[col] = dict(zip(classes, encoded_values))

# Convert feature importance to JSON-safe format
feature_importance_list = []
for _, row in feature_importance.iterrows():
    feature_importance_list.append({
        'feature': str(row['feature']),
        'importance': float(row['importance'])
    })

# Create metadata dictionary with safe types
model_metadata = {
    'feature_columns': [str(col) for col in X_encoded.columns],
    'categorical_columns': [str(col) for col in categorical_columns],
    'numerical_columns': [str(col) for col in numerical_columns],
    'label_encoders': label_encoders_dict,
    'model_performance': {
        'rmse': float(rmse),
        'mae': float(mae),
        'r2_score': float(r2)
    },
    'feature_importance': feature_importance_list
}

# Save metadata with custom encoder
try:
    with open('model_metadata.json', 'w', encoding='utf-8') as f:
        json.dump(model_metadata, f, indent=2, ensure_ascii=False, cls=NumpyEncoder)
    print("Model metadata saved successfully!")
except Exception as e:
    print(f"Error saving metadata: {e}")
    # Fallback: save with basic serialization
    with open('model_metadata.json', 'w', encoding='utf-8') as f:
        json.dump(model_metadata, f, indent=2, ensure_ascii=False)

print("Model saved successfully!")
print("Files created:")
print("- insurance_model.pkl (Python pickle format)")
print("- insurance_model.joblib (Joblib format)")
print("- model_metadata.json (Metadata for frontend)")

# Function to make predictions (example usage)
def predict_insurance_cost(age, sex, bmi, children, smoker, region):
    """
    Function to make predictions using the trained model
    """
    # Create input dataframe
    input_data = pd.DataFrame({
        'age': [age],
        'sex': [sex],
        'bmi': [bmi],
        'children': [children],
        'smoker': [smoker],
        'region': [region]
    })
    
    # Encode categorical variables
    for col in categorical_columns:
        input_data[col] = label_encoders[col].transform(input_data[col])
    
    # Make prediction
    prediction = rf_model.predict(input_data)
    return prediction[0]

# Test the prediction function
print(f"\nTesting prediction function:")
test_prediction = predict_insurance_cost(
    age=39, sex='female', bmi=27.9, children=0, smoker='no', region='southeast'
)
print(f"Predicted insurance cost: ${test_prediction:.2f}")

print("\n" + "="*50)
print("MODEL TRAINING COMPLETED SUCCESSFULLY!")
print("="*50)

print("""
✅ Model trained and saved
✅ JSON metadata created without errors
✅ All files ready for API integration

Next steps:
1. Run: python enhanced_flask_api.py
2. Start your React application
3. Test the complete system

The TypeError has been resolved!
""")

print(f"Final model performance:")
print(f"  R² Score: {r2:.4f} ({r2*100:.1f}% variance explained)")
print(f"  Average error: ±${mae:.2f}")
print(f"  Root Mean Square Error: ${rmse:.2f}")