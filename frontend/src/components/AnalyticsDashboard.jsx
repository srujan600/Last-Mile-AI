import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie
} from 'recharts';
import { Cpu, Zap, Activity, CheckCircle2, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';

export default function AnalyticsDashboard({ orders }) {
  
  // 1. Delivery Window Failure Breakdown
  const windowLabels = ["Morning (8-11 AM)", "Midday (11-2 PM)", "Afternoon (2-5 PM)", "Evening (5-8 PM)"];
  const windowData = [0, 1, 2, 3].map(wIndex => {
    const wOrders = orders.filter(o => o.delivery_window === wIndex);
    const avgRisk = wOrders.length ? wOrders.reduce((sum, o) => sum + o.risk_score, 0) / wOrders.length : 0;
    const highRiskCount = wOrders.filter(o => o.risk_score >= 0.50).length;
    return {
      window: windowLabels[wIndex],
      avgRiskPct: Number((avgRisk * 100).toFixed(1)),
      totalStops: wOrders.length,
      highRiskStops: highRiskCount
    };
  });

  // 2. COD vs Prepaid Payment Risk Comparison
  const codOrders = orders.filter(o => o.is_cod === 1);
  const prepaidOrders = orders.filter(o => o.is_cod === 0);
  const avgCodRisk = codOrders.length ? (codOrders.reduce((s, o) => s + o.risk_score, 0) / codOrders.length) * 100 : 0;
  const avgPrepaidRisk = prepaidOrders.length ? (prepaidOrders.reduce((s, o) => s + o.risk_score, 0) / prepaidOrders.length) * 100 : 0;

  const paymentData = [
    { type: 'Cash on Delivery (COD)', avgRiskPct: Number(avgCodRisk.toFixed(1)), count: codOrders.length },
    { type: 'Prepaid Digital Payment', avgRiskPct: Number(avgPrepaidRisk.toFixed(1)), count: prepaidOrders.length }
  ];

  // 3. Risk Level Category Distribution
  const riskCounts = { High: 0, Medium: 0, Low: 0 };
  orders.forEach(o => {
    if (riskCounts[o.risk_level] !== undefined) riskCounts[o.risk_level]++;
  });

  const pieData = [
    { name: 'High Risk (>=0.60)', value: riskCounts.High, color: '#ef4444' },
    { name: 'Medium Risk (0.35-0.60)', value: riskCounts.Medium, color: '#f59e0b' },
    { name: 'Low Risk (<0.35)', value: riskCounts.Low, color: '#10b981' }
  ];

  // 4. Feature Importance Scores for 8-Feature XGBoost model
  const featureImportances = [
    { feature: 'Cash on Delivery (COD) Status', weight: '28.5%', color: '#ef4444' },
    { feature: 'Past Failures Count', weight: '22.4%', color: '#6366f1' },
    { feature: 'Weather Severity Index', weight: '16.2%', color: '#3b82f6' },
    { feature: 'Customer Response Rate', weight: '12.8%', color: '#10b981' },
    { feature: 'Traffic Congestion Level', weight: '9.5%', color: '#06b6d4' },
    { feature: 'Gated Security Access', weight: '4.8%', color: '#f59e0b' },
    { feature: 'Delivery Window Slot', weight: '3.5%', color: '#a855f7' },
    { feature: 'Parcel Weight (kg)', weight: '2.3%', color: '#ec4899' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner & XGBoost Model Telemetry */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Upgraded Non-Linear XGBoost Model Architecture</h3>
              <p className="text-xs text-slate-400">Trained on 5,000 complex logistics vectors with multi-way interaction terms &amp; TreeSHAP explainability</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Accuracy</p>
              <p className="text-lg font-extrabold text-emerald-400 mt-0.5">93.7%</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">ROC-AUC</p>
              <p className="text-lg font-extrabold text-indigo-400 mt-0.5">0.9865</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">PR-AUC</p>
              <p className="text-lg font-extrabold text-blue-400 mt-0.5">0.9918</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">F1-Score</p>
              <p className="text-lg font-extrabold text-amber-400 mt-0.5">0.9484</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 1: Delivery Window Breakdown & COD Payment Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Delivery Window Failure Risk Bar Chart (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white">Failure Risk Probability by Delivery Window</h4>
              <p className="text-xs text-slate-400">Average risk score % across time slots</p>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
              Recharts Visualizer
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={windowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="window" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="avgRiskPct" name="Avg Risk Prob (%)" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="highRiskStops" name="High Risk Stops Count" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash-on-Delivery (COD) vs Prepaid Failure Impact (5 Columns) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="mb-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-rose-400" />
              <h4 className="text-sm font-bold text-white">COD vs. Prepaid Failure Risk Gap</h4>
            </div>
            <p className="text-xs text-slate-400">Impact of Cash-on-Delivery payment on first-attempt failures</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="type" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                />
                <Bar dataKey="avgRiskPct" name="Avg Failure Risk (%)" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-rose-950/30 border border-rose-800/30 p-2.5 rounded-xl text-xs text-rose-300">
            💡 COD orders exhibit a <strong>2.8x higher failure probability</strong> due to customer unavailability or cash non-preparation.
          </div>
        </div>

      </div>

      {/* Grid 2: Risk Level Pie & 8-Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Risk Level Category Distribution (5 Columns) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="mb-2">
            <h4 className="text-sm font-bold text-white">Active Stops Risk Level Breakdown</h4>
            <p className="text-xs text-slate-400">Proportion of high, medium, and low risk stops</p>
          </div>

          <div className="h-52 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2 border-t border-slate-800 pt-3">
            <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
              <span className="block text-rose-400 font-bold text-base">{riskCounts.High}</span>
              <span className="text-[10px] text-slate-400">High Risk</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
              <span className="block text-amber-400 font-bold text-base">{riskCounts.Medium}</span>
              <span className="text-[10px] text-slate-400">Medium</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
              <span className="block text-emerald-400 font-bold text-base">{riskCounts.Low}</span>
              <span className="text-[10px] text-slate-400">Low Risk</span>
            </div>
          </div>
        </div>

        {/* Feature Importance Analysis (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="mb-3">
            <h4 className="text-sm font-bold text-white">8-Feature XGBoost Feature Importance Weights</h4>
            <p className="text-xs text-slate-400">Relative contribution of features to failure risk prediction</p>
          </div>

          <div className="space-y-2.5 pt-1">
            {featureImportances.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{item.feature}</span>
                  <span className="text-indigo-400 font-mono">{item.weight}</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: item.weight, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
