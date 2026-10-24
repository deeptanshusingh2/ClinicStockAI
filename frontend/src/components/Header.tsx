import React from 'react';
import {
  LayoutDashboard,
  Scan,
  Database,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { OllamaStatus } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'audit' | 'inventory' | 'alerts' | 'evaluation';
  setActiveTab: (tab: 'dashboard' | 'audit' | 'inventory' | 'alerts' | 'evaluation') => void;
  ollamaStatus: OllamaStatus | null;
  verifiedCount: number;
  alertCount: number;
  onTestConnection?: () => void;
  isTestingConnection?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  ollamaStatus,
  verifiedCount,
  alertCount,
  onTestConnection,
  isTestingConnection = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#d8e4d2] bg-[#edf2e6]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#4e6f40] to-[#364f2a] flex items-center justify-center shadow-md shadow-[#4e6f40]/20 group-hover:scale-105 transition">
              <Scan className="w-5 h-5 text-[#e5f96b]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-stone-900 tracking-tight">
                  ClinicStock AI
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3c592f] text-[#e3fb6f]">
                  VisionStock
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block font-medium">
                AI drafts medicine inventory; authorized staff verify it.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-1.5 bg-[#e2ebd9] p-1 rounded-2xl border border-[#d3dfcb]">
            {/* Dashboard Tab */}
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-[#2a4520] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            {/* Shelf Audit Tab */}
            <button
              id="nav-tab-audit"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white text-[#2a4520] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Shelf Audit</span>
            </button>

            {/* Confirmed Stock Tab */}
            <button
              id="nav-tab-inventory"
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-white text-[#2a4520] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Confirmed Stock</span>
              {verifiedCount > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[#d6e5cd] text-[#29421f] font-semibold">
                  {verifiedCount}
                </span>
              )}
            </button>

            {/* Expiry Risk Tab */}
            <button
              id="nav-tab-alerts"
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-white text-amber-800 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Expiry Risk</span>
              {alertCount > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                  {alertCount}
                </span>
              )}
            </button>

            {/* AI Benchmark Tab */}
            <button
              id="nav-tab-evaluation"
              onClick={() => setActiveTab('evaluation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'evaluation'
                  ? 'bg-white text-[#2a4520] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Benchmark</span>
            </button>
          </nav>

          {/* Model & System Status Badge with Test Connection Button */}
          <div className="flex items-center gap-2">
            <div
              id="ollama-status-badge"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shadow-sm ${
                ollamaStatus?.connected
                  ? 'bg-[#e7f5e8] border-[#b9e4bc] text-[#205b2a]'
                  : 'bg-[#fbeeed] border-[#f6c7c5] text-[#b02a28]'
              }`}
              title={ollamaStatus?.message || (ollamaStatus?.connected ? 'Ollama Vision Engine Connected' : 'Ollama Disconnected')}
            >
              {ollamaStatus?.connected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold text-emerald-800">Connected</span>
                  <span className="font-mono text-emerald-900 text-[11px] bg-white/70 px-1.5 py-0.5 rounded border border-emerald-300">
                    {ollamaStatus.active_model}
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <WifiOff className="w-3.5 h-3.5 text-red-500" />
                  <span className="font-bold text-red-700">Offline</span>
                </>
              )}
            </div>

            {onTestConnection && (
              <button
                id="btn-test-connection"
                onClick={onTestConnection}
                disabled={isTestingConnection}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-[#d0dcce] transition disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
                title="Test live connection to Ollama API (http://127.0.0.1:11434)"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#3b592f] ${isTestingConnection ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
