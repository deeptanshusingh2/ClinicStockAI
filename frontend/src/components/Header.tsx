import React from 'react';
import {
  Scan,
  Database,
  AlertTriangle,
  BarChart3,
  Cpu,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { OllamaStatus } from '../types';

interface HeaderProps {
  activeTab: 'audit' | 'inventory' | 'alerts' | 'evaluation';
  setActiveTab: (tab: 'audit' | 'inventory' | 'alerts' | 'evaluation') => void;
  ollamaStatus: OllamaStatus | null;
  verifiedCount: number;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  ollamaStatus,
  verifiedCount,
  alertCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">ClinicStock AI</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  VisionStock
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI drafts the inventory; authorized staff verify it.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-tab-audit"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'audit'
                  ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30 shadow-sm shadow-teal-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>Shelf Audit</span>
            </button>

            <button
              id="nav-tab-inventory"
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'inventory'
                  ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30 shadow-sm shadow-teal-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Confirmed Stock</span>
              {verifiedCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.2 rounded-full bg-slate-800 text-teal-300 border border-teal-500/20">
                  {verifiedCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-alerts"
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'alerts'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Expiry Risk</span>
              {alertCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {alertCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-evaluation"
              onClick={() => setActiveTab('evaluation')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'evaluation'
                  ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">AI Benchmark</span>
            </button>
          </nav>

          {/* Model & System Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                ollamaStatus?.connected
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-700/80 text-teal-300'
              }`}
              title={ollamaStatus?.message || 'VisionStock Ready'}
            >
              {ollamaStatus?.connected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono">{ollamaStatus.active_model}</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  <span>Vision AI Engine (Active)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
