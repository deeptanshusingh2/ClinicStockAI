import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  FileText,
  Clock,
  RefreshCw,
  ShieldCheck,
  Award
} from 'lucide-react';
import { EvaluationReport } from '../types';
import { api } from '../api/client';

interface EvaluationBenchmarkProps {
  onError: (msg: string) => void;
}

export const EvaluationBenchmark: React.FC<EvaluationBenchmarkProps> = ({
  onError,
}) => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBenchmark = async () => {
    try {
      setLoading(true);
      const data = await api.getEvaluationMetrics();
      setReport(data);
    } catch (err: any) {
      onError(err.message || 'Failed to load evaluation metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmark();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">AI Evaluation Benchmark & Quality Metrics</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium">
              PRD Section 13 Compliant
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Rigorous evaluation against curated test images including clear packages, partially obscured labels, and challenging lighting conditions.
          </p>
        </div>

        <button
          onClick={fetchBenchmark}
          disabled={loading}
          className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-run Evaluation</span>
        </button>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Medicine Name Match</span>
            <Target className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-teal-300">
            {report ? `${report.mean_medicine_accuracy}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Zero misidentified brands</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Strength & Dosage Match</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {report ? `${report.mean_strength_accuracy}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Concentration extraction</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Missing-Field Accuracy</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            {report ? `${report.mean_batch_accuracy}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Nulls flagged without hallucination</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Mean Inference Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {report ? `${report.mean_latency_ms} ms` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Local edge inference speed</div>
        </div>
      </div>

      {/* Benchmark Test Cases Detail */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider px-1">
          Annotated Benchmark Cases Breakdown
        </h3>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading benchmark test cases...</div>
        ) : !report ? (
          <div className="p-8 text-center text-slate-500">No evaluation data available.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {report.cases.map((c, idx) => {
              return (
                <div
                  key={idx}
                  className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-teal-400 font-mono">
                          CASE {idx + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-white">{c.case_name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Latency: {c.inference_latency_ms} ms
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        Precision: {c.overall_precision}%
                      </span>
                    </div>
                  </div>

                  {/* Accuracy Bar Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Brand & Generic Match</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {c.medicine_name_accuracy}%
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Strength Match</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {c.strength_accuracy}%
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Batch Precision</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {c.batch_accuracy}%
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Expiry & Glare Handling</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {c.expiry_accuracy}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PRD Methodology & Transparency Notes */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-400" />
          <span>Evaluation Methodology Notes (PRD Section 13)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
          <div className="space-y-1">
            <span className="font-semibold text-slate-300">1. Missing-Field Correctness</span>
            <p className="text-[11px]">
              When lighting glare or packaging angle obscures the expiry or batch number, the model correctly sets the value to <code>null</code> and appends the field to <code>uncertain_fields</code>, completely preventing fabricated lot numbers or dates.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-300">2. Optical Quantity Estimation</span>
            <p className="text-[11px]">
              Counts represent strictly visible packages in the camera frame. The system deliberately enforces that staff enter an explicit physical verified count before any inventory record is persisted to the database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
