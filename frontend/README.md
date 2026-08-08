# 💻 Last-Mile Delivery Predictor - Frontend UI

This directory contains the React 19 + Vite frontend application for the **Last-Mile Delivery Failure Predictor & Dispatcher System**.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Server
Start the local Vite dev server (runs on `http://localhost:3000` or `http://localhost:5173`):
```bash
npm run dev
```

### 3. Build for Production
Build the static assets for deployment:
```bash
npm run build
```

---

## 🧩 Components Overview

- **`App.jsx`**: Main UI container with tab navigation for Dispatcher Dashboard, Analytics, Predictor Sandbox, and Driver Mobile simulator.
- **`DispatcherDashboard.jsx`**: Real-time shipment monitoring, filterable by risk tier (*Low*, *Medium*, *High*, *Critical*), driver search, interactive status update actions, and route map modal.
- **`AnalyticsDashboard.jsx`**: High-level visual reports on risk breakdown, carrier reliability, weather impact, and delivery success rates powered by **Recharts**.
- **`PredictorForm.jsx`**: Interactive prediction sandbox allowing dispatchers to manually input shipment parameters and view ML risk scores, root cause breakdown, and mitigation suggestions.
- **`DriverMobileView.jsx`**: Simulated mobile interface for drivers with step-by-step navigation, package info, and status update controls.
- **`AddDeliveryModal.jsx`**: Modal dialog for adding new delivery entries directly into the SQLite database via backend API.
- **`RescheduleModal.jsx`**: Modal dialog for updating delivery time windows and dynamic risk recalculations.
- **`Navbar.jsx`**: Top header navigation and system connection status indicator.

---

## 🔗 Backend API Integration

The frontend connects to the FastAPI backend running at `http://127.0.0.1:8000`. Make sure the backend server is running when using the frontend app.

If running via the root script (`run.bat` or `run.sh`), both backend and frontend will start simultaneously.

---

## 🧰 Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React (`lucide-react`)
- **Charts**: Recharts (`recharts`)
- **Maps**: Leaflet (`leaflet`, `react-leaflet`)
- **Linter**: Oxlint (`oxlint`)
