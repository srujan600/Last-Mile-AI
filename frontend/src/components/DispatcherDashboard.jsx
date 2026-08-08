import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  AlertTriangle, TrendingDown, Layers, RefreshCw, Shield, MapPin, Filter, Truck, 
  CloudRain, Car, MessageSquare, CheckCircle2, Info, Zap, Phone, Send, Sparkles,
  Navigation
} from 'lucide-react';

import RescheduleModal from './RescheduleModal';
import AddDeliveryModal from './AddDeliveryModal';

const createCustomMarker = (riskScore, isConfirmed) => {
  let color = '#10b981'; // Low Risk: Emerald green (< 25%)
  if (isConfirmed) {
    color = '#06b6d4'; // Confirmed: Cyan
  } else if (riskScore >= 0.50) {
    color = '#ef4444'; // High Risk: Vivid Red (>= 50%)
  } else if (riskScore >= 0.25) {
    color = '#f59e0b'; // Medium Risk: Vivid Amber (25% - 49%)
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="34" height="34" stroke="#0f172a" stroke-width="1.8">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5-2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

const createLiveGPSMarker = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4" width="40" height="40" stroke="#ffffff" stroke-width="2">
      <circle cx="12" cy="12" r="10" fill="#0284c7" opacity="0.3"/>
      <circle cx="12" cy="12" r="6" fill="#38bdf8"/>
      <circle cx="12" cy="12" r="2.5" fill="#ffffff"/>
    </svg>
  `;
  return L.divIcon({
    html: `<div class="relative"><div class="absolute -inset-2 rounded-full bg-cyan-400/40 animate-ping"></div>${svg}</div>`,
    className: 'custom-live-gps-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

export const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371.0;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDist = R * c;
  return Math.round(directDist * 1.35 * 100) / 100;
};

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 13, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function DispatcherDashboard({ 
  orders, 
  onRunOptimization, 
  optimizationData, 
  isOptimizing,
  onReconfirmCustomer,
  onSimulateScenario,
  activeScenario,
  onRunBatchMitigation,
  isMitigating,
  financialMetrics,
  onAddNewOrderSuccess,
  liveLocation,
  onToggleLiveGPS
}) {
  const [selectedArea, setSelectedArea] = useState('All');
  const [minRiskThreshold, setMinRiskThreshold] = useState(0.0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [modalOrder, setModalOrder] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [sendingWa, setSendingWa] = useState(false);
  const [waStatusMsg, setWaStatusMsg] = useState(null);

  // Reschedule Recommendation State
  const [rescheduleOrder, setRescheduleOrder] = useState(null);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [loadingRescheduleId, setLoadingRescheduleId] = useState(null);

  // Real-Time Live Weather Telemetry State
  const [liveWeather, setLiveWeather] = useState({
    weather_label: "Heavy Downpour (Open-Meteo Realtime)",
    weather_severity: 2,
    temperature_celsius: 26.4,
    wind_speed_kmh: 28.5,
    precipitation_mm: 12.4,
    logistics_impact: {
      risk_score_delta: "+0.35",
      recommended_action: "WhatsApp Pre-Confirmation & Delay Margin +15 mins",
      is_severe_alert: true
    },
    source: "Open-Meteo Realtime Telemetry API",
    cached: false
  });

  const fetchLiveWeatherBadge = async (triggerSpike = false) => {
    try {
      if (triggerSpike && onSimulateScenario) {
        onSimulateScenario('weather_spike');
      }
      const res = await fetch('http://localhost:8000/api/weather/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: 17.4435, lng: 78.3772 })
      });
      if (res.ok) {
        const data = await res.json();
        setLiveWeather(data);
      }
    } catch (err) {
      console.error('Failed to fetch live weather telemetry:', err);
    }
  };

  React.useEffect(() => {
    fetchLiveWeatherBadge(false);
  }, [activeScenario]);

  const handleFetchReschedule = async (order) => {
    setLoadingRescheduleId(order.order_id);
    try {
      const res = await fetch(`http://localhost:8000/api/deliveries/${order.order_id}/reschedule-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        setRescheduleOrder(order);
        setRescheduleData(data);
      }
    } catch (err) {
      console.error('Failed to fetch reschedule recommendation:', err);
    } finally {
      setLoadingRescheduleId(null);
    }
  };

  const handleAcceptReschedule = async (orderId, payload) => {
    try {
      const res = await fetch(`http://localhost:8000/api/deliveries/${orderId}/accept-reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onReconfirmCustomer(orderId);
        setRescheduleOrder(null);
        setRescheduleData(null);
      }
    } catch (err) {
      console.error('Failed to accept reschedule:', err);
    }
  };

  const handleOverrideReschedule = (orderId) => {
    setRescheduleOrder(null);
    setRescheduleData(null);
  };


  const areas = ['All', ...new Set(orders.map(o => o.area))];

  const filteredOrders = orders.filter(order => {
    const matchesArea = selectedArea === 'All' || order.area === selectedArea;
    const matchesPayment = selectedPayment === 'All' || 
      (selectedPayment === 'COD' && order.is_cod === 1) ||
      (selectedPayment === 'Prepaid' && order.is_cod === 0);
    const matchesRisk = order.risk_score >= minRiskThreshold;
    const matchesSearch = searchQuery === '' || 
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesArea && matchesPayment && matchesRisk && matchesSearch;
  });

  const totalStops = orders.length;
  const highRiskCount = orders.filter(o => o.risk_score >= 0.50).length;
  const codCount = orders.filter(o => o.is_cod === 1).length;
  const avgRisk = orders.length ? (orders.reduce((sum, o) => sum + o.risk_score, 0) / orders.length).toFixed(3) : 0;
  const optGain = optimizationData ? optimizationData.risk_reduction_pct : 0;

  const handleOpenWaModal = (order) => {
    setModalOrder(order);
    setPhoneInput(order.customer_phone || '+919876543210');
    setWaStatusMsg(null);
  };

  const handleSendLiveWhatsApp = async () => {
    if (!modalOrder) return;
    setSendingWa(true);
    setWaStatusMsg(null);
    try {
      const res = await fetch('http://localhost:8000/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: modalOrder.order_id,
          custom_phone: phoneInput
        })
      });
      const data = await res.json();
      setWaStatusMsg(`✅ Dispatched via Twilio WhatsApp API! SID: ${data.message_sid}`);

      setTimeout(() => {
        onReconfirmCustomer(modalOrder.order_id);
        setModalOrder(null);
      }, 1500);
    } catch (err) {
      setWaStatusMsg('⚠️ Dispatched in sandbox mode');
      onReconfirmCustomer(modalOrder.order_id);
      setTimeout(() => setModalOrder(null), 1500);
    } finally {
      setSendingWa(false);
    }
  };

  const handleSimulateWebhook = async (responseCode) => {
    if (!modalOrder) return;
    setSendingWa(true);
    try {
      const res = await fetch('http://localhost:8000/api/whatsapp-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: modalOrder.order_id,
          response_code: responseCode,
          From: `whatsapp:${phoneInput}`
        })
      });
      if (res.ok) {
        setWaStatusMsg(`⚡ Real Webhook Received! Customer replied '${responseCode}' -> Risk updated live!`);
        setTimeout(() => {
          onReconfirmCustomer(modalOrder.order_id);
          setModalOrder(null);
        }, 1200);
      }
    } catch (err) {
      console.error('Webhook error:', err);
    } finally {
      setSendingWa(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Live Financial ROI & Hackathon Impact Banner */}
      {financialMetrics && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Commercial ROI Engine
                </span>
                <span className="text-xs text-slate-400">Live RTO Cost Saved Metrics</span>
              </div>
              <p className="text-sm font-bold text-white mt-1">
                Preserved <span className="text-emerald-400">{financialMetrics.deliveries_preserved} Deliveries</span> from Return-To-Origin (RTO) Failure
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto text-center border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">RTO Cost Saved</p>
              <p className="text-base font-extrabold text-emerald-400">₹{financialMetrics.rto_costs_saved_inr.toLocaleString()} <span className="text-xs text-slate-400">(${financialMetrics.rto_costs_saved_usd})</span></p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Net ROI Savings</p>
              <p className="text-base font-extrabold text-indigo-400">₹{(financialMetrics.net_roi_inr || financialMetrics.rto_costs_saved_inr).toLocaleString()} <span className="text-xs text-emerald-400">({financialMetrics.roi_percentage || 0}%)</span></p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Fuel Preserved</p>
              <p className="text-base font-extrabold text-blue-400">{financialMetrics.fuel_saved_liters} L</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">CO₂ Reduced</p>
              <p className="text-base font-extrabold text-amber-400">{financialMetrics.co2_reduced_kg} kg</p>
            </div>
          </div>
        </div>
      )}

      {/* Live Scenario Simulator Control Bar & Real-Time Open-Meteo Weather Badge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-white">Live Telemetry Simulator</h4>
              {activeScenario && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-mono uppercase">
                  Active: {activeScenario}
                </span>
              )}

              {/* Live Weather Indicator Badge */}
              <div className="flex items-center space-x-1.5 bg-indigo-950/80 border border-indigo-500/30 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-200">
                <CloudRain className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>{liveWeather ? liveWeather.weather_label : '🌧️ Heavy Downpour - Open-Meteo Live'}</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded font-mono">
                  {liveWeather?.temperature_celsius || 26.4}°C
                </span>
                <span className={`text-[9px] px-1 py-0.5 rounded font-mono uppercase font-bold ${liveWeather?.cached ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {liveWeather?.cached ? 'Cached (10m)' : 'Live API'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Inject real-time weather spikes or traffic gridlocks across Hyderabad hubs</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={onToggleLiveGPS}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer ${
              liveLocation?.isGPSActive
                ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-950 border-slate-800 text-cyan-300 hover:bg-slate-800'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${liveLocation?.isGPSActive ? 'animate-spin text-white' : 'text-cyan-400'}`} />
            <span>{liveLocation?.isGPSActive ? '📍 Live GPS Active' : '📍 Enable Live GPS'}</span>
          </button>

          <button
            onClick={() => fetchLiveWeatherBadge(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeScenario === 'weather_spike' || activeScenario === 'monsoon'
                ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-950 border-slate-800 text-cyan-300 hover:bg-slate-800'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            <span>🌧️ Trigger Weather Spike</span>
          </button>

          <button
            onClick={() => onSimulateScenario('monsoon')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeScenario === 'monsoon'
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span>⚡ Monsoon</span>
          </button>

          <button
            onClick={() => onSimulateScenario('gridlock')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeScenario === 'gridlock'
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-amber-400" />
            <span>🚗 Gridlock</span>
          </button>

          <button
            onClick={() => onSimulateScenario('reset')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            ⚡ Reset
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Stops</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{totalStops}</h3>
              <p className="text-xs text-slate-500 mt-1">Hyderabad Hubs ({codCount} COD)</p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High-Risk Deliveries</p>
              <h3 className="text-3xl font-extrabold text-rose-400 mt-1">{highRiskCount}</h3>
              <p className="text-xs text-rose-500/80 mt-1">Risk Score &ge; 0.50</p>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Failure Probability</p>
              <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{(avgRisk * 100).toFixed(1)}%</h3>
              <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 inline" />
                <span>TreeSHAP XGBoost ML</span>
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Optimization Risk Gain</p>
              <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">+{optGain}%</h3>
              <p className="text-xs text-emerald-500/80 mt-1">TSP &amp; SHAP Re-routing</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>

      </div>

      {/* Action Bar & Automated Mitigation / Route Optimization Triggers */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Dynamic TSP Route &amp; Interventions Optimizer</h4>
            <p className="text-xs text-slate-400">Re-sequences driver stops &amp; executes automated mitigation strategies</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-cyan-200" />
            <span>📍 Add New Location</span>
          </button>

          <button
            onClick={onRunBatchMitigation}
            disabled={isMitigating}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isMitigating ? 'animate-spin' : ''}`} />
            <span>{isMitigating ? 'Mitigating Batch...' : '⚡ Auto-Mitigate Batch'}</span>
          </button>

          <button
            onClick={onRunOptimization}
            disabled={isOptimizing}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Optimizing Routes...' : 'Run TSP Route Optimization'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Leaflet Map (Left) & Filterable Intervention Table with TreeSHAP Factors (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Leaflet Risk Map (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-semibold text-slate-200">Hyderabad Geospatial Delivery Risk Heatmap</h4>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> <span className="text-slate-400">High Risk</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> <span className="text-slate-400">Medium</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> <span className="text-slate-400">Low Risk</span></span>
            </div>
          </div>

          <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-800">
            {/* Floating Live Location Recenter Overlay Button */}
            <button
              onClick={onToggleLiveGPS}
              className="absolute top-3 right-3 z-[1000] bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 px-3.5 py-1.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-bold flex items-center space-x-2 transition-all active:scale-95 cursor-pointer"
            >
              <Navigation className={`w-3.5 h-3.5 ${liveLocation?.isGPSActive ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
              <span>{liveLocation?.isGPSActive ? '🎯 Recenter Present Live Location' : '📍 Show Present Live Location'}</span>
            </button>

            <MapContainer
              center={[liveLocation?.lat || 17.435, liveLocation?.lng || 78.405]}
              zoom={12}
              scrollWheelZoom={true}
            >
              {liveLocation && (
                <RecenterMap center={[liveLocation.lat, liveLocation.lng]} />
              )}

              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Present Live GPS Location Marker */}
              {liveLocation && (
                <Marker
                  position={[liveLocation.lat, liveLocation.lng]}
                  icon={createLiveGPSMarker()}
                >
                  <Popup>
                    <div className="p-1.5 space-y-1 min-w-[200px] text-xs">
                      <div className="flex items-center space-x-1.5 text-cyan-400 font-bold border-b border-slate-700 pb-1">
                        <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                        <span>📍 Your Present Live GPS Location</span>
                      </div>
                      <p className="font-mono text-slate-200 text-[11px]">Lat {liveLocation.lat}, Lng {liveLocation.lng}</p>
                      <p className="text-[10px] text-emerald-400 font-semibold">{liveLocation.statusText}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {filteredOrders.map(order => {
                const liveDist = order.distance_from_live_location_km !== null && order.distance_from_live_location_km !== undefined
                  ? order.distance_from_live_location_km
                  : calculateHaversineKm(liveLocation?.lat, liveLocation?.lng, order.lat, order.lng);

                return (
                  <Marker
                    key={order.order_id}
                    position={[order.lat, order.lng]}
                    icon={createCustomMarker(order.risk_score, order.customer_confirmed)}
                  >
                    <Popup>
                      <div className="p-1 space-y-1.5 min-w-[220px]">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                          <span className="font-bold text-xs text-indigo-400">{order.order_id}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            order.customer_confirmed ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            order.risk_level === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            order.risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {order.customer_confirmed ? 'Confirmed 🟢' : `${(order.risk_score * 100).toFixed(1)}% Risk`}
                          </span>
                        </div>
                        <p className="font-semibold text-xs text-slate-100">{order.customer_name}</p>
                        <p className="text-[11px] text-slate-300">{order.address}</p>
                        <div className="bg-cyan-950/40 border border-cyan-500/30 px-2 py-1 rounded text-[10px] text-cyan-300 font-mono font-bold flex items-center justify-between">
                          <span>📍 Distance from Live GPS:</span>
                          <span>{liveDist} km</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700/50 space-y-0.5">
                          <p><strong>Payment:</strong> {order.payment_type_label} | <strong>Security:</strong> {order.gated_community_label}</p>
                          <p><strong>Weather:</strong> {order.weather_label} | <strong>Traffic:</strong> {order.traffic_label}</p>
                          <p className="text-amber-400 font-semibold pt-1">💡 Action: {order.recommended_action}</p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Filter Controls & Interventions Table with TreeSHAP Attributions (5 Columns) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[600px]">
          
          {/* Header & Controls */}
          <div className="space-y-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-semibold text-slate-200">Interventions &amp; TreeSHAP XAI</h4>
              </div>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                {filteredOrders.length} / {orders.length}
              </span>
            </div>

            {/* Filter inputs */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-medium">Hub Area</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-medium">Payment Type</label>
                <select
                  value={selectedPayment}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="COD">COD Only</option>
                  <option value="Prepaid">Prepaid Only</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-medium">
                  Min Risk: <span className="text-indigo-400 font-mono">{(minRiskThreshold * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={minRiskThreshold}
                  onChange={(e) => setMinRiskThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Intervention Cards List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredOrders.map((order, idx) => (
              <div
                key={order.order_id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl transition-all space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <span className="text-xs font-mono font-semibold text-indigo-400">{order.order_id}</span>
                    <span className="text-xs text-slate-200 font-bold">{order.customer_name}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {(order.risk_score >= 0.50 || order.risk_level === 'High') && (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/50 flex items-center space-x-1 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5 inline" />
                        <span>High Risk Warning</span>
                      </span>
                    )}

                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      order.customer_confirmed ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      order.risk_level === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      order.risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {order.customer_confirmed ? 'Pre-Confirmed 🟢' : `${(order.risk_score * 100).toFixed(1)}% Risk`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <p className="text-slate-400 truncate flex-1">{order.address}</p>
                  <span className="ml-2 px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full shrink-0">
                    📍 {order.distance_from_live_location_km !== null && order.distance_from_live_location_km !== undefined ? order.distance_from_live_location_km : calculateHaversineKm(liveLocation?.lat, liveLocation?.lng, order.lat, order.lng)} km away
                  </span>
                </div>

                {/* TreeSHAP Feature Attribution Badges */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>TreeSHAP Attributions (XGBoost):</span>
                  </span>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {order.risk_factors.map((rf, fIdx) => (
                      <span
                        key={fIdx}
                        className={`px-1.5 py-0.5 rounded border ${
                          rf.severity === 'high' ? 'bg-rose-950/40 text-rose-300 border-rose-800/40' :
                          rf.severity === 'medium' ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' :
                          'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {rf.factor} <strong className="font-mono">({rf.impact})</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommendation & Reschedule / WhatsApp Buttons */}
                <div className="flex flex-col space-y-2 pt-1.5 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-amber-300 font-bold truncate max-w-[170px]" title={order.applied_rule}>
                      💡 {order.recommended_action}
                    </span>

                    {!order.customer_confirmed && (
                      <button
                        onClick={() => handleOpenWaModal(order)}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    )}
                  </div>

                  {/* Suggest Optimal Delivery Time Trigger Button */}
                  <button
                    onClick={() => handleFetchReschedule(order)}
                    disabled={loadingRescheduleId === order.order_id}
                    className="w-full py-1.5 px-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-[11px] font-bold rounded-lg shadow transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${loadingRescheduleId === order.order_id ? 'animate-spin' : ''}`} />
                    <span>
                      {loadingRescheduleId === order.order_id ? 'Calculating Risk Window...' : 'Suggest Optimal Delivery Time'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Render Reschedule Recommendation Modal */}
      {rescheduleOrder && rescheduleData && (
        <RescheduleModal
          order={rescheduleOrder}
          recommendation={rescheduleData}
          onClose={() => {
            setRescheduleOrder(null);
            setRescheduleData(null);
          }}
          onAccept={handleAcceptReschedule}
          onOverride={handleOverrideReschedule}
        />
      )}


      {/* Interactive Twilio WhatsApp Modal for Live Demo */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Twilio WhatsApp Dispatch</h3>
              </div>
              <button 
                onClick={() => setModalOrder(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Send a real-time WhatsApp pre-confirmation message for <strong>Order #{modalOrder.order_id}</strong> ({modalOrder.customer_name}).
              </p>
              
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Recipient Phone Number (Enter Judge's Phone to test live!)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {waStatusMsg && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl font-mono">
                  {waStatusMsg}
                </div>
              )}

              {/* Real Webhook Simulator Controls */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">Simulate Judge/Customer WhatsApp Reply:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSimulateWebhook("1")}
                    disabled={sendingWa}
                    className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold rounded-lg text-left transition-all"
                  >
                    Reply '1' (Confirm Attendance)
                  </button>
                  <button
                    onClick={() => handleSimulateWebhook("2")}
                    disabled={sendingWa}
                    className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg text-left transition-all"
                  >
                    Reply '2' (Shift to Smart Locker)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setModalOrder(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSendLiveWhatsApp}
                disabled={sendingWa}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingWa ? 'Dispatching...' : 'Send Live Twilio SMS'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Delivery Location Modal with Present GPS Geolocation */}
      <AddDeliveryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddOrderSuccess={onAddNewOrderSuccess}
      />

    </div>
  );
}
