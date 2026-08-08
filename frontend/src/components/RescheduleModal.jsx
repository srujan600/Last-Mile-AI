import React, { useState } from 'react';
import { 
  AlertTriangle, Clock, Calendar, CheckCircle2, ShieldAlert, Sparkles, X, 
  ArrowRight, CloudRain, Car, UserCheck, Send, Check
} from 'lucide-react';

export default function RescheduleModal({ order, recommendation, onClose, onAccept, onOverride }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  if (!recommendation) return null;

  const {
    current_scheduled_time,
    current_risk_score,
    current_risk_level,
    risk_breakdown,
    suggested_time_window,
    suggested_delivery_window_id,
    suggested_risk_score,
    suggested_risk_level,
    risk_reduction_pct,
    mitigation_notes,
    available_windows
  } = recommendation;

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await onAccept(order.order_id, {
        accepted_time_window: suggested_time_window,
        accepted_delivery_window_id: suggested_delivery_window_id,
        notify_customer: notifyCustomer
      });
    } catch (err) {
      console.error("Failed to accept reschedule:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRiskPct = Math.round(current_risk_score * 100);
  const suggestedRiskPct = Math.round(suggested_risk_score * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-b border-rose-500/30 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full font-mono">
                  High-Risk Warning ({currentRiskPct}% Risk)
                </span>
                <span className="text-xs text-slate-400 font-mono">Order #{order.order_id}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Optimal Delivery Rescheduling Engine
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* Customer & Delivery Context */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Customer &amp; Address</span>
              <span className="font-bold text-white text-sm">{order.customer_name}</span>
              <span className="text-slate-400 block text-[11px] mt-0.5">{order.address}</span>
            </div>
            <div className="text-right font-mono">
              <span className="text-slate-400 block font-medium font-sans">Payment / Gate</span>
              <span className="font-bold text-amber-400">{order.is_cod ? 'COD Payment 💵' : 'Prepaid 💳'}</span>
              <span className="text-slate-400 block text-[11px] mt-0.5">{order.gated_community ? 'Gated Access' : 'Open Locality'}</span>
            </div>
          </div>

          {/* Time Comparison Cards: Current Scheduled vs Suggested Low-Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Current Scheduled Time */}
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Current Scheduled Time
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/30 text-rose-300 rounded-full font-mono">
                  {currentRiskPct}% Risk (HIGH)
                </span>
              </div>

              <div className="py-2">
                <p className="text-xl font-black text-white">{current_scheduled_time}</p>
                <p className="text-xs text-rose-300/80 mt-1 font-medium">
                  High probability of delivery failure / RTO
                </p>
              </div>

              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-rose-900">
                <div 
                  className="bg-rose-500 h-full transition-all"
                  style={{ width: `${currentRiskPct}%` }}
                />
              </div>
            </div>

            {/* Suggested Low-Risk Time */}
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-lg shadow-emerald-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1 text-emerald-300 animate-spin" />
                  Suggested Low-Risk Time
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/30 text-emerald-300 rounded-full font-mono">
                  {suggestedRiskPct}% Risk (LOW)
                </span>
              </div>

              <div className="py-2">
                <p className="text-xl font-black text-emerald-300">{suggested_time_window}</p>
                <p className="text-xs text-emerald-400 mt-1 font-bold flex items-center space-x-1">
                  <ArrowRight className="w-3.5 h-3.5 inline text-emerald-400" />
                  <span>{risk_reduction_pct}% Risk Reduction</span>
                </p>
              </div>

              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-emerald-900">
                <div 
                  className="bg-emerald-400 h-full transition-all"
                  style={{ width: `${suggestedRiskPct}%` }}
                />
              </div>
            </div>

          </div>

          {/* Risk Breakdown Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>Risk Factor Breakdown (Formula Evaluation)</span>
            </h4>

            <div className="space-y-3">
              {/* Traffic Delay Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Car className="w-3.5 h-3.5 text-amber-400" />
                    <span>Traffic Delay Expectation:</span>
                  </span>
                  <span className="font-mono font-bold text-rose-400">{risk_breakdown.traffic_pct}% Delay Penalty</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-amber-500 h-full" style={{ width: `${risk_breakdown.traffic_pct}%` }} />
                </div>
              </div>

              {/* Weather Severity Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                    <span>Weather Alert Impact:</span>
                  </span>
                  <span className="font-mono font-bold text-blue-400">{risk_breakdown.weather_pct}% Weather Risk</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-blue-500 h-full" style={{ width: `${risk_breakdown.weather_pct}%` }} />
                </div>
              </div>

              {/* Driver Hours of Service */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Driver Hours of Service Shift:</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-400">{risk_breakdown.driver_hours_pct}% Fatigue Factor</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full" style={{ width: `${risk_breakdown.driver_hours_pct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Mitigation Narrative Banner */}
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-1.5">
            <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Risk Mitigation Rationale:</span>
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {mitigation_notes}
            </p>
          </div>

          {/* Customer Notification Checkbox */}
          <div className="flex items-center space-x-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              id="notify_wa"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="notify_wa" className="text-xs font-semibold text-slate-200 cursor-pointer">
              Automatically send WhatsApp notification &amp; confirmation link to customer
            </label>
          </div>

        </div>

        {/* Action Buttons Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-end space-x-3 shrink-0">
          <button
            onClick={() => onOverride(order.order_id)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            Override &amp; Keep Original Time
          </button>

          <button
            onClick={handleAccept}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Rescheduling...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Accept &amp; Notify Customer</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
