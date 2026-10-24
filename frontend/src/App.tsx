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
  HeartPulse,
  LayoutDashboard
} from 'lucide-react';
import { Header } from './components/Header';
import { SageDashboard } from './components/SageDashboard';
import { ImageUploader } from './components/ImageUploader';
import { CandidateReviewTable } from './components/CandidateReviewTable';
import { InventoryDashboard } from './components/InventoryDashboard';
import { ExpiryAlerts } from './components/ExpiryAlerts';
import { EvaluationBenchmark } from './components/EvaluationBenchmark';
import { ManualAddModal } from './components/ManualAddModal';
import { AnalysisResponse, OllamaStatus } from './types';
import { api } from './api/client';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'audit' | 'inventory' | 'alerts' | 'evaluation'>('dashboard');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [verifiedCount, setVerifiedCount] = useState<number>(0);
  const [alertCount, setAlertCount] = useState<number>(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

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

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const status = await api.getOllamaStatus();
      setOllamaStatus(status);
      if (status.connected && status.model_available) {
        showToast('success', `Connected to Ollama! Active model: ${status.active_model} (${status.available_models.length} model(s) available)`);
      } else if (status.connected && !status.model_available) {
        showToast('error', `Ollama is connected, but model '${status.active_model}' is not installed. Found: ${status.available_models.join(', ')}`);
      } else {
        showToast('error', status.message || 'Ollama is unreachable at http://127.0.0.1:11434. Run `ollama serve`.');
      }
    } catch (err: any) {
      setOllamaStatus({
        connected: false,
        base_url: 'http://127.0.0.1:11434',
        active_model: 'gemma4:e2b',
        available_models: [],
        model_available: false,
        message: 'Ollama is unreachable'
      });
      showToast('error', `Connection test failed: ${err.message || 'Cannot reach server'}`);
    } finally {
      setIsTestingConnection(false);
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
    <div className="min-h-screen bg-[#edf2e6] text-stone-800 flex flex-col font-sans selection:bg-[#4d7040]/20 selection:text-[#28461f]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-900/95 border-emerald-500/50 text-emerald-100'
                : 'bg-red-900/95 border-red-500/50 text-red-100'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className="text-xs font-semibold">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-stone-300 hover:text-white"
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
        onTestConnection={handleTestConnection}
        isTestingConnection={isTestingConnection}
      />

      {/* Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 0: Sage Medical Bento Dashboard */}
        {activeTab === 'dashboard' && (
          <SageDashboard
            onNavigateToAudit={() => setActiveTab('audit')}
            onNavigateToInventory={() => setActiveTab('inventory')}
            onNavigateToAlerts={() => setActiveTab('alerts')}
            onOpenManualAdd={() => setIsAddModalOpen(true)}
            verifiedCount={verifiedCount}
            alertCount={alertCount}
            ollamaStatus={ollamaStatus}
          />
        )}

        {/* Tab 1: Shelf Audit */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {!analysisResult ? (
              <ImageUploader
                onAnalysisStart={handleAnalysisStart}
                onAnalysisComplete={handleAnalysisComplete}
                onError={(msg) => showToast('error', msg)}
                isAnalyzing={isAnalyzing}
                ollamaStatus={ollamaStatus}
                onTestConnection={handleTestConnection}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setAnalysisResult(null)}
                    className="px-4 py-2 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200/80 rounded-2xl shadow-sm flex items-center gap-2 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#3b5b2e]" />
                    <span>Audit Another Shelf Photograph</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="text-xs text-[#3b5b2e] hover:text-[#273d1f] font-bold"
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

      {/* Manual Add Medicine Modal */}
      <ManualAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRecordCreated={() => syncState()}
        onError={(msg) => showToast('error', msg)}
        onSuccess={(msg) => showToast('success', msg)}
      />

      {/* Footer */}
      <footer className="border-t border-[#d8e4d2] bg-[#e4edd0]/60 py-6 mt-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-[#436437]" />
            <span className="font-bold text-stone-800">ClinicStock AI — VisionStock</span>
            <span>&bull; Hackathon Production MVP</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium text-stone-600">
            <span>Model: <span className="font-mono text-stone-800">{ollamaStatus?.active_model || 'Gemma 4'}</span></span>
            <span>&bull;</span>
            <span>Database: <span className="font-mono text-stone-800">SQLite</span></span>
            <span>&bull;</span>
            <span className="text-[#36532b] font-semibold">Human-Verified Stock Principle</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
