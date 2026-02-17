// components/PredictionResultGraphs.js
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B'];

const PredictionResultGraphs = ({ prediction }) => {
  if (!prediction) return null;

  // === Numeric Chart Data: Age, BMI, Children ===
  const numericData = [
    { name: 'Age', value: prediction.input_data.age },
    { name: 'BMI', value: parseFloat(prediction.input_data_display?.calculated_bmi) },
    { name: 'Children', value: prediction.input_data.children },
  ];

  // === Pie Chart Data: Sex, Smoker, Region ===
  const pieData = [
    { category: "Sex", label: prediction.input_data.sex, value: 1 },
    { category: "Smoker", label: prediction.input_data.smoker === "yes" ? "Yes" : "No", value: 1 },
    { category: "Region", label: prediction.input_data_display?.region, value: 1 },
  ];

  // === Predicted Cost ===
  const costData = [{ name: 'Predicted Cost', value: prediction.predicted_cost }];

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>📊 Visual Analysis of Your Data</h3>

      {/* Numeric Chart */}
      <div style={styles.card}>
        <h5 style={styles.title}>👤 Age, ⚖️ BMI & 👶 Children</h5>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={numericData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill={COLORS[0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* One Pie Chart: Sex, Smoker, Region */}
      <div style={styles.card}>
        <h5 style={styles.title}>🧑 Sex, 🚬 Smoker & 🌍 Region</h5>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="category"
              outerRadius={100}
              label={({ category }) => category} // ✅ only "Sex", "Smoker", "Region"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val, name, props) => {
                // ✅ Show clean tooltip like "Smoker: Yes"
                return [`${props.payload.label}`, `${props.payload.category}`];
              }}
            />
            <Legend
              formatter={(value, entry) => {
                const { payload } = entry;
                return payload.category; // ✅ only "Sex", "Smoker", "Region"
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart: Predicted Cost */}
      <div style={styles.card}>
        <h5 style={styles.title}>💰 Predicted Insurance Cost</h5>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={costData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke={COLORS[1]} strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Inline CSS
const styles = {
  container: { padding: '20px' },
  header: { textAlign: 'center', marginBottom: '20px', fontSize: '22px', fontWeight: 'bold', color: '#111827' },
  card: { background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '30px' },
  title: { marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: '#374151', textAlign: 'center' },
};

export default PredictionResultGraphs;
