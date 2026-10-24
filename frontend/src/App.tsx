import React, { useState, useEffect } from 'react';
import {
  Scan,
  Database,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  ShieldCheck,
  HeartPulse
} from 'lucide-react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { CandidateReviewTable } from './components/CandidateReviewTable';
import { InventoryDashboard } from './components/InventoryDashboard';
import { ExpiryAlerts } from './components/ExpiryAlerts';
import { EvaluationBenchmark } from './components/EvaluationBenchmark';
import { AnalysisResponse, OllamaStatus } from './types';
import { api } from './api/client';

export function App() {
  const [activeTab, setActiveTab] = useState<'audit' | 'inventory' | 'alerts' | 'evaluation'>('audit');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [verifiedCount, setVerifiedCount] = useState<number>(0);
  const [alertCount, setAlertCount] = useState<number>(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Poll Ollama status and sync counts
  const syncState = async () => {
    try {
      const status = await api.getOllamaStatus();
      setOllamaStatus(status);
    } catch {
      // Ignored
    }

    try {
      const inv = await api.getInventory(undefined, 'verified');
      setVerifiedCount(inv.length);
    } catch {
      // Ignored
    }

    try {
      const alerts = await api.getExpiryAlerts(90);
      setAlertCount(alerts.total_alerts);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    syncState();
    const interval = setInterval(syncState, 15000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
  };

  const handleAnalysisComplete = (result: AnalysisResponse) => {
    setIsAnalyzing(false);
    setAnalysisResult(result);
    showToast('success', `Detected ${result.total_detected} candidate medicine packages.`);
  };

  const handleCandidateVerified = () => {
    syncState();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/90 border-red-500/50 text-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className="text-xs font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main App Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ollamaStatus={ollamaStatus}
        verifiedCount={verifiedCount}
        alertCount={alertCount}
      />

      {/* Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Shelf Audit */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {!analysisResult ? (
              <ImageUploader
                onAnalysisStart={handleAnalysisStart}
                onAnalysisComplete={handleAnalysisComplete}
                onError={(msg) => showToast('error', msg)}
                isAnalyzing={isAnalyzing}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setAnalysisResult(null)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex items-center gap-2 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                    <span>Audit Another Shelf Photograph</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="text-xs text-teal-400 hover:text-teal-300 font-medium"
                  >
                    View Confirmed Stock ({verifiedCount}) &rarr;
                  </button>
                </div>

                <CandidateReviewTable
                  analysis={analysisResult}
                  onCandidateVerified={handleCandidateVerified}
                  onNavigateToInventory={() => setActiveTab('inventory')}
                  onError={(msg) => showToast('error', msg)}
                  onSuccess={(msg) => showToast('success', msg)}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Confirmed Inventory */}
        {activeTab === 'inventory' && (
          <InventoryDashboard
            onError={(msg) => showToast('error', msg)}
            onSuccess={(msg) => showToast('success', msg)}
            onNavigateToAudit={() => {
              setAnalysisResult(null);
              setActiveTab('audit');
            }}
          />
        )}

        {/* Tab 3: Expiry Alerts */}
        {activeTab === 'alerts' && (
          <ExpiryAlerts
            onError={(msg) => showToast('error', msg)}
            onNavigateToInventory={() => setActiveTab('inventory')}
          />
        )}

        {/* Tab 4: Evaluation Benchmark */}
        {activeTab === 'evaluation' && (
          <EvaluationBenchmark onError={(msg) => showToast('error', msg)} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-slate-400">ClinicStock AI — VisionStock</span>
            <span>&bull; Hackathon MVP v1.0</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Model: <span className="font-mono text-slate-400">{ollamaStatus?.active_model || 'Gemma 4'}</span></span>
            <span>&bull;</span>
            <span>Database: <span className="font-mono text-slate-400">SQLite</span></span>
            <span>&bull;</span>
            <span className="text-teal-400">Human-Verified Stock Principle</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
