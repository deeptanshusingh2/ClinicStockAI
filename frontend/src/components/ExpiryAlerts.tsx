import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Package,
  Layers,
  Info
} from 'lucide-react';
import { ExpiryAlertsSummary, UrgencyLevel } from '../types';
import { api } from '../api/client';

interface ExpiryAlertsProps {
  onError: (msg: string) => void;
  onNavigateToInventory: () => void;
}

export const ExpiryAlerts: React.FC<ExpiryAlertsProps> = ({
  onError,
  onNavigateToInventory,
}) => {
  const [summary, setSummary] = useState<ExpiryAlertsSummary | null>(null);
  const [thresholdDays, setThresholdDays] = useState<number>(90);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAlerts = async (days: number) => {
    try {
      setLoading(true);
      const data = await api.getExpiryAlerts(days);
      setSummary(data);
    } catch (err: any) {
      onError(err.message || 'Failed to fetch expiry alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(thresholdDays);
  }, [thresholdDays]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Threshold Selector & Protocol Disclaimer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Expiry Proximity & Risk Engine</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              PRD FR-06 Compliant
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Calculated deterministically from verified expiry dates. Strictly excludes unconfirmed drafts to prevent false shortage or expiry alerts.
          </p>
        </div>

        {/* Configurable Threshold Selector */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <span className="text-xs font-medium text-slate-400">Alert Horizon:</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[30, 60, 90, 180].map((days) => (
              <button
                key={days}
                onClick={() => setThresholdDays(days)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  thresholdDays === days
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expired */}
        <div className="bg-slate-900/40 border border-red-500/30 rounded-2xl p-4 shadow-lg shadow-red-500/5">
          <div className="flex items-center justify-between text-xs text-red-400 mb-1">
            <span className="font-semibold">Expired Batches</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-red-400">
            {summary ? summary.expired_count : 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Requires immediate quarantine</div>
        </div>

        {/* Critical <=30d */}
        <div className="bg-slate-900/40 border border-amber-500/30 rounded-2xl p-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span className="font-semibold">Critical (&le; 30 Days)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-300">
            {summary ? summary.critical_count : 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">First-to-expire rotation</div>
        </div>

        {/* Warning 31-90d */}
        <div className="bg-slate-900/40 border border-yellow-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-yellow-300 mb-1">
            <span className="font-semibold">Warning (31 - 90 Days)</span>
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-yellow-300">
            {summary ? summary.warning_count : 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Monitor dispensing rate</div>
        </div>

        {/* Total in Horizon */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Total Flagged in {thresholdDays}d</span>
            <Layers className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {summary ? summary.total_alerts : 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across verified inventory</div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Active Expiry Notifications ({summary ? summary.alerts.length : 0})
        </h3>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Evaluating inventory dates...</div>
        ) : !summary || summary.alerts.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-semibold text-white">No Batches Expiring in {thresholdDays} Days</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All confirmed batches with recorded expiry dates are beyond your current {thresholdDays}-day horizon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.alerts.map((alert) => {
              const isExpired = alert.urgency === 'expired';
              const isCritical = alert.urgency === 'critical';
              const isWarning = alert.urgency === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl border p-4.5 transition-all shadow-md ${
                    isExpired
                      ? 'bg-red-950/20 border-red-500/40 shadow-red-500/5'
                      : isCritical
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-amber-500/5'
                      : 'bg-yellow-950/15 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {alert.medicine_name}
                      </h4>
                      {alert.strength && (
                        <span className="text-xs text-teal-400 font-mono">
                          {alert.strength}
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        isExpired
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : isCritical
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                      }`}
                    >
                      {isExpired
                        ? `Expired ${Math.abs(alert.days_until_expiry)}d ago`
                        : `${alert.days_until_expiry} days left`}
                    </span>
                  </div>

                  {/* Batch & Quantity row */}
                  <div className="flex items-center gap-4 text-xs text-slate-300 py-2 border-y border-slate-800/60 my-2">
                    <div>
                      <span className="text-slate-500 text-[11px]">Batch: </span>
                      <span className="font-mono font-medium text-slate-200">
                        {alert.batch_number || 'Unrecorded'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px]">Expiry: </span>
                      <span className="font-mono font-medium text-slate-200">
                        {alert.expiry_date}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px]">Stock: </span>
                      <span className="font-bold text-white font-mono">
                        {alert.verified_quantity} units
                      </span>
                    </div>
                  </div>

                  {/* Advisory Notice */}
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{alert.alert_message}</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disclaimers per PRD FR-06 */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-slate-300">
            Clinical Safety & Regulatory Notice (PRD Section 8)
          </p>
          <p className="text-[11px] text-slate-400">
            A date-based alert does not establish whether a pharmaceutical product is safe for patient use. VisionStock provides visual auditing assistance only; authorized healthcare professionals must inspect packaging integrity and adhere to statutory disposal and dispensing guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};
