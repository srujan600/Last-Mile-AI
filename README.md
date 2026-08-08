# 🚚 Last-Mile AI - Delivery Failure Predictor & Dispatcher Operations

An end-to-end intelligent delivery risk management platform featuring an **XGBoost machine learning model**, **FastAPI backend**, and a modern **React 19 + Vite frontend** with real-time dispatcher analytics and driver simulation.

---

## 🌟 Key Features

- 🧠 **ML Failure Prediction**: XGBoost model predicting delivery failure risk based on traffic, weather, carrier history, time windows, and package characteristics.
- 📊 **Dispatcher Dashboard**: Real-time delivery monitoring, risk filtering (*Low*, *Medium*, *High*, *Critical*), status management, and dynamic route maps.
- 📈 **Analytics & Insights**: Risk breakdown charts, carrier reliability stats, and weather impact analysis powered by Recharts.
- 📱 **Driver Mobile View**: Simulated mobile view for drivers with step-by-step navigation and status update controls.
- ⚡ **Automated One-Click Startup**: Scripts for Windows (`run.bat`) and Unix/Linux/macOS (`run.sh`) to automatically train the model and start both backend & frontend servers simultaneously.

---

## 🏗️ Project Architecture

```
iare hackathon/
├── backend/            # FastAPI Python server & API routes
│   └── app/            # Business logic, schemas, and rule engines
├── frontend/           # React 19 + Vite + Tailwind CSS frontend UI
│   └── src/            # Components, styles, assets
├── models/             # ML training pipeline and saved model artifacts
│   └── train_model.py  # Model training script
├── data/               # Mock delivery datasets and sample data
├── run.bat             # One-click start script for Windows
├── run.sh              # One-click start script for Unix/Linux/macOS
└── test_backend.py     # Backend test suite
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.9+
- **Node.js**: 18+ & npm

### Quick Start (One-Click)

#### Windows
Double-click `run.bat` or run in terminal:
```cmd
run.bat
```

#### Linux / macOS
```bash
chmod +x run.sh
./run.sh
```

This will automatically:
1. Train the ML model if not already present (`models/failure_model.pkl`).
2. Start the **FastAPI Backend** at `http://localhost:8000`.
3. Start the **React Frontend** at `http://localhost:3000`.

---

## 🛠️ Manual Installation & Setup

### 1. Backend Setup

```bash
# Install Python dependencies
python -m pip install fastapi uvicorn xgboost scikit-learn pandas numpy

# Train the model
python models/train_model.py

# Run FastAPI server
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend Swagger API Docs will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

---

## 🧰 Tech Stack

- **Machine Learning**: XGBoost, Scikit-Learn, Pandas, NumPy
- **Backend**: Python, FastAPI, Uvicorn
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Leaflet
