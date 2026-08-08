#!/bin/bash

echo "🚀 Starting Last-Mile Delivery Failure Predictor System..."

# 1. Train model / generate dataset if not present
if [ ! -f "models/failure_model.pkl" ]; then
    echo "🤖 Model artifact not found. Training XGBoost model..."
    python models/train_model.py
fi

# 2. Launch FastAPI Backend Engine
echo "⚡ Starting FastAPI Backend on http://localhost:8000..."
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait for backend to initialize
sleep 2

# 3. Launch React Frontend
echo "💻 Starting React Frontend on http://localhost:3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "=========================================================="
echo "✅ Last-Mile Delivery Failure Predictor System Ready!"
echo "   - Backend API:  http://localhost:8000"
echo "   - Frontend UI:   http://localhost:3000"
echo "=========================================================="

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
