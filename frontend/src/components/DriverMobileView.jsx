import React, { useState } from 'react';
import { Smartphone, CheckCircle, Navigation, AlertTriangle, ShieldAlert, PhoneCall, ArrowRight, Package, Clock, CloudRain, Car, MessageSquare, DollarSign, Lock, Sparkles } from 'lucide-react';
import RescheduleModal from './RescheduleModal';

const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
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

export default function DriverMobileView({ orders, onReconfirmCustomer, liveLocation, onToggleLiveGPS }) {
  const [completedStops, setCompletedStops] = useState(new Set());
  const [interventions, setInterventions] = useState({});

  // Reschedule State
  const [rescheduleOrder, setRescheduleOrder] = useState(null);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [loadingRescheduleId, setLoadingRescheduleId] = useState(null);

  const toggleComplete = (orderId) => {
    setCompletedStops(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const handleApplyIntervention = (orderId, action) => {
    setInterventions(prev => ({
      ...prev,
      [orderId]: action
    }));
  };

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

  return (
    <div className="flex justify-center items-center py-4">
      
      {/* Mobile Device Frame */}
      <div className="w-full max-w-md bg-slate-950 border-4 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[760px] relative">
        
        {/* Top Speaker / Camera Notch */}
        <div className="w-full bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">Dispatch Driver App</span>
          </div>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
            V-4.0 Hyderabad
          </span>
        </div>

        {/* Driver Header Summary */}
        <div className="bg-slate-900/90 p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Assigned Driver</p>
              <h4 className="text-sm font-bold text-white">Rahul Verma (Vehicle #TS-09-5542)</h4>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400">
                {completedStops.size} / {orders.length} Done
              </span>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${(completedStops.size / Math.max(orders.length, 1)) * 100}%` }}
            />
          </div>

          {/* Live GPS Tracking Banner */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800 text-[11px]">
            <div className="flex items-center space-x-1.5 text-cyan-300 font-mono font-semibold truncate max-w-[240px]">
              <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
              <span className="truncate">📍 Live GPS: {liveLocation?.lat || 17.4435}, {liveLocation?.lng || 78.3772}</span>
            </div>
            <button
              onClick={onToggleLiveGPS}
              className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all shrink-0 cursor-pointer"
            >
              {liveLocation?.isGPSActive ? 'GPS Active 🟢' : 'Enable GPS 📍'}
            </button>
          </div>
        </div>

        {/* Real-time Severe Weather Escalation Toast Alert */}
        {orders.some(o => (o.weather >= 2 || o.weather_severity >= 2 || (o.weather_label && o.weather_label.toLowerCase().includes('downpour')) || (o.weather_label && o.weather_label.toLowerCase().includes('extreme')))) && (
          <div className="bg-rose-950/90 border-b border-rose-500/50 p-3 flex items-start space-x-2.5 shadow-lg shrink-0 animate-pulse">
            <CloudRain className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wide text-rose-300">
                  🌧️ Severe Weather Telemetry Alert
                </span>
                <span className="text-[9px] bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded font-mono font-bold">
                  SLA +15m Margin
                </span>
              </div>
              <p className="text-[11px] text-rose-100 font-semibold mt-0.5 leading-snug">
                Heavy downpour / monsoon active in locality. Driver rain gear alert &amp; WhatsApp pre-confirmations triggered automatically.
              </p>
            </div>
          </div>
        )}

        {/* Sequential Route Stop Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {orders.map((order, idx) => {
            const isDone = completedStops.has(order.order_id);
            const appliedAction = interventions[order.order_id] || order.recommended_action;

            return (
              <div
                key={order.order_id}
                className={`bg-slate-900 border ${
                  isDone
                    ? 'border-emerald-500/30 bg-emerald-950/10 opacity-75'
                    : order.risk_level === 'High' || order.risk_score >= 0.50
                    ? 'border-rose-500/40 shadow-rose-950/20'
                    : 'border-slate-800'
                } rounded-2xl p-4 shadow-lg transition-all space-y-3 relative`}
              >
                {/* Top Badge & Stop Index */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{order.order_id}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {(order.risk_score >= 0.50 || order.risk_level === 'High') && (
                      <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center space-x-0.5 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5 inline" />
                        <span>High Risk</span>
                      </span>
                    )}

                    {order.customer_confirmed ? (
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Confirmed 🟢
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        order.risk_level === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        order.risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {(order.risk_score * 100).toFixed(0)}% Risk
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Details & Address */}
                <div>
                  <h5 className="text-sm font-bold text-white flex items-center justify-between">
                    <span>{order.customer_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      order.is_cod === 1 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {order.is_cod === 1 ? 'COD 💵' : 'Prepaid 💳'}
                    </span>
                  </h5>
                  <p className="text-xs text-slate-300 mt-0.5 leading-snug">{order.address}</p>
                </div>

                {/* Logistics Context Chips */}
                <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-400">
                  <div className="bg-slate-950 px-1.5 py-1 rounded-lg border border-slate-800 flex items-center space-x-1">
                    <Package className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="truncate">{order.parcel_weight_kg} kg</span>
                  </div>
                  <div className="bg-slate-950 px-1.5 py-1 rounded-lg border border-slate-800 flex items-center space-x-1">
                    <CloudRain className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{order.weather_label}</span>
                  </div>
                  <div className="bg-slate-950 px-1.5 py-1 rounded-lg border border-slate-800 flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{order.gated_community === 1 ? 'Gated' : 'Open'}</span>
                  </div>
                  <div className="bg-cyan-950/60 px-1.5 py-1 rounded-lg border border-cyan-500/30 flex items-center space-x-1 text-cyan-300 font-mono font-bold">
                    <Navigation className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{order.distance_from_live_location_km !== null && order.distance_from_live_location_km !== undefined ? order.distance_from_live_location_km : calculateHaversineKm(liveLocation?.lat, liveLocation?.lng, order.lat, order.lng)} km</span>
                  </div>
                </div>

                {/* AI Recommended Intervention Banner */}
                <div className="bg-indigo-950/40 border border-indigo-800/40 p-2.5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-indigo-300 font-semibold flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                      <span>AI Protocol</span>
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{order.applied_rule}</span>
                  </div>
                  <p className="text-xs font-bold text-amber-300">
                    ⚡ {appliedAction}
                  </p>
                </div>

                {/* Suggest Optimal Delivery Time Button */}
                <button
                  onClick={() => handleFetchReschedule(order)}
                  disabled={loadingRescheduleId === order.order_id}
                  className="w-full py-1.5 px-2 bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${loadingRescheduleId === order.order_id ? 'animate-spin' : ''}`} />
                  <span>
                    {loadingRescheduleId === order.order_id ? 'Analyzing Slots...' : 'Suggest Optimal Time'}
                  </span>
                </button>

                {/* Interactive Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {!order.customer_confirmed ? (
                    <button
                      onClick={() => onReconfirmCustomer(order.order_id)}
                      className="py-1.5 px-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg border border-emerald-500 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Ping</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApplyIntervention(order.order_id, "Redirected to Smart Locker")}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-700 transition-colors"
                    >
                      Smart Locker 📦
                    </button>
                  )}

                  <button
                    onClick={() => toggleComplete(order.order_id)}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isDone ? 'Completed' : 'Mark Delivered'}</span>
                  </button>
                </div>

              </div>
            );
          })}
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
          onOverride={() => {
            setRescheduleOrder(null);
            setRescheduleData(null);
          }}
        />
      )}

    </div>
  );
}

