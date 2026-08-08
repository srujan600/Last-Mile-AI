import React from 'react';
import { ShieldAlert, Map, BarChart3, Smartphone, Sliders, Zap } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiStatus, latency }) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">Last-Mile AI</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  XGBoost Local
                </span>
              </div>
              <p className="text-xs text-slate-400">Delivery Failure Predictor & Dispatch Engine</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dispatcher')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'dispatcher'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Dispatcher Panel</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics & Metrics</span>
            </button>

            <button
              onClick={() => setActiveTab('driver')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'driver'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Driver Mobile</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Single Order Predictor</span>
            </button>
          </nav>

          {/* System Telemetry Badge */}
          <div className="hidden lg:flex items-center space-x-3 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-1.5">
              <div className={`w-2 h-2 rounded-full ${apiStatus ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-300 font-mono">{apiStatus ? 'API Online' : 'API Offline'}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1 text-slate-400 font-mono">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{latency ? `${latency}ms` : '< 300ms'}</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
