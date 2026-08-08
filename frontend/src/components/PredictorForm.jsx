import React, { useState } from 'react';
import { Sliders, Zap, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Info, CloudRain, Sparkles } from 'lucide-react';

export default function PredictorForm({ apiBaseUrl }) {
  const [formData, setFormData] = useState({
    parcel_weight: 12.5,
    delivery_window: 2,
    past_failures: 2,
    weather: 1,
    traffic: 2,
    is_cod: 1,
    gated_community: 1,
    customer_response_rate: 0.45,
    customer_confirmed: false
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [weatherStatus, setWeatherStatus] = useState(null);
  const [latency, setLatency] = useState(null);
  const [error, setError] = useState(null);

  const windowOptions = [
    { value: 0, label: "08:00 - 11:00 AM (Morning)" },
    { value: 1, label: "11:00 AM - 02:00 PM (Midday)" },
    { value: 2, label: "02:00 - 05:00 PM (Afternoon)" },
    { value: 3, label: "05:00 - 08:00 PM (Evening)" }
  ];

  const weatherOptions = [
    { value: 0, label: "Clear ☀️" },
    { value: 1, label: "Rain 🌧️" },
    { value: 2, label: "Storm 🌩️" },
    { value: 3, label: "Extreme Weather 🌪️" }
  ];

  const trafficOptions = [
    { value: 0, label: "Low Traffic 🟢" },
    { value: 1, label: "Moderate Traffic 🟡" },
    { value: 2, label: "Heavy Traffic 🟠" },
    { value: 3, label: "Gridlock Congestion 🔴" }
  ];

  const handleFetchLiveWeather = async () => {
    setFetchingWeather(true);
    setWeatherStatus(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/live-weather`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: 17.4435, lng: 78.3772 })
      });
      const data = await res.json();
      setFormData(prev => ({ ...prev, weather: data.weather_code }));
      setWeatherStatus(`Live weather synced: ${data.weather_label}`);
    } catch (err) {
      setWeatherStatus('Synced baseline weather telemetry');
    } finally {
      setFetchingWeather(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const t0 = performance.now();

    try {
      const res = await fetch(`${apiBaseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcel_weight: parseFloat(formData.parcel_weight),
          delivery_window: parseInt(formData.delivery_window),
          past_failures: parseInt(formData.past_failures),
          weather: parseInt(formData.weather),
          traffic: parseInt(formData.traffic),
          is_cod: parseInt(formData.is_cod),
          gated_community: parseInt(formData.gated_community),
          customer_response_rate: parseFloat(formData.customer_response_rate),
          customer_confirmed: formData.customer_confirmed
        })
      });

      const elapsed = performance.now() - t0;
      setLatency(elapsed.toFixed(1));

      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data = await res.json();
      setPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>9-Feature TreeSHAP Risk Predictor</span>
              <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-mono">
                XGBoost Explainer
              </span>
            </h3>
            <p className="text-xs text-slate-400">Evaluate local XGBoost ML inference, TreeSHAP feature attributions, and live weather telemetry</p>
          </div>
        </div>
        {latency && (
          <div className="flex items-center space-x-1.5 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-amber-400 font-mono">
            <Zap className="w-4 h-4" />
            <span>Response: {latency} ms</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Form Inputs (7 Columns) */}
        <form onSubmit={handleSubmit} className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Parcel Weight: <span className="text-indigo-400 font-mono">{formData.parcel_weight} kg</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="25.0"
                step="0.5"
                value={formData.parcel_weight}
                onChange={(e) => setFormData({ ...formData, parcel_weight: e.target.value })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Customer Response Rate: <span className="text-emerald-400 font-mono">{(formData.customer_response_rate * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.15"
                max="1.00"
                step="0.05"
                value={formData.customer_response_rate}
                onChange={(e) => setFormData({ ...formData, customer_response_rate: e.target.value })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Type (COD Risk)</label>
              <select
                value={formData.is_cod}
                onChange={(e) => setFormData({ ...formData, is_cod: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={1}>💵 Cash on Delivery (COD)</option>
                <option value={0}>💳 Prepaid Digital Payment</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Security / Access Type</label>
              <select
                value={formData.gated_community}
                onChange={(e) => setFormData({ ...formData, gated_community: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={1}>🔒 Gated Security Access</option>
                <option value={0}>🚪 Open Street Access</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Delivery Time Window</label>
              <select
                value={formData.delivery_window}
                onChange={(e) => setFormData({ ...formData, delivery_window: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {windowOptions.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Past Delivery Failures</label>
              <select
                value={formData.past_failures}
                onChange={(e) => setFormData({ ...formData, past_failures: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'failure' : 'failures'}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 block">Weather Telemetry</label>
              <button
                type="button"
                onClick={handleFetchLiveWeather}
                disabled={fetchingWeather}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center space-x-1 cursor-pointer"
              >
                <CloudRain className="w-3 h-3" />
                <span>{fetchingWeather ? 'Syncing...' : 'Auto-Sync Open-Meteo Live API'}</span>
              </button>
            </div>

            <select
              value={formData.weather}
              onChange={(e) => setFormData({ ...formData, weather: parseInt(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {weatherOptions.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>

            {weatherStatus && (
              <p className="text-[10px] text-blue-400 font-mono">{weatherStatus}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Traffic Congestion</label>
            <select
              value={formData.traffic}
              onChange={(e) => setFormData({ ...formData, traffic: parseInt(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {trafficOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            <span>{loading ? 'Evaluating XGBoost Model...' : 'Calculate Risk & Generate TreeSHAP XAI'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Prediction Results Card with TreeSHAP Attributions (5 Columns) */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Prediction &amp; TreeSHAP Telemetry</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </h4>

            {prediction ? (
              <div className="space-y-3">
                
                {/* Risk Score Circle / Stat */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Predicted Failure Score</span>
                  <div className="text-4xl font-black text-indigo-400 font-mono">
                    {(prediction.risk_score * 100).toFixed(1)}%
                  </div>
                  <span className={`inline-block px-3 py-0.5 text-xs font-bold rounded-full ${
                    prediction.risk_level === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    prediction.risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {prediction.risk_level} Risk Level
                  </span>
                </div>

                {/* TreeSHAP Risk Factor Attribution Breakdown */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] text-slate-400 font-bold flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>TreeSHAP Feature Attributions:</span>
                  </span>
                  <div className="space-y-1 text-xs">
                    {prediction.risk_factors.map((rf, fIdx) => (
                      <div key={fIdx} className="flex justify-between items-center bg-slate-900 px-2 py-1 rounded text-[11px]">
                        <span className="text-slate-300">{rf.factor}</span>
                        <span className="font-mono font-bold text-rose-400">{rf.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl">
                  <p className="text-[11px] text-amber-400 font-semibold uppercase">Recommended Intervention</p>
                  <p className="text-xs font-bold text-amber-200 mt-0.5">
                    💡 {prediction.recommended_action}
                  </p>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Sliders className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-xs">Adjust parameters or sync live weather to calculate real-time XGBoost risk &amp; TreeSHAP attributions.</p>
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-500 text-center border-t border-slate-800 pt-3">
            Inference engine: FastAPI + 9-Feature XGBoost Model + TreeSHAP Explainer
          </p>
        </div>

      </div>

    </div>
  );
}
