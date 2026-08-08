@echo off
echo Starting Last-Mile Delivery Failure Predictor System...

if not exist models\failure_model.pkl (
    echo Model artifact not found. Training XGBoost model...
    python models\train_model.py
)

echo Cleaning up any stale process on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo Starting FastAPI Backend on http://127.0.0.1:8000...
start "FastAPI Backend" python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

echo Starting React Frontend on http://localhost:3000...
cd frontend
start "React Frontend" npm run dev

echo ==========================================================
echo System Ready!
echo    - Backend API:  http://127.0.0.1:8000 (or http://localhost:8000)
echo    - Frontend UI:   http://localhost:3000
echo ==========================================================
