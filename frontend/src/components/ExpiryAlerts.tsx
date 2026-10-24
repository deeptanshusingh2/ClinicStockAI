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
      <div className="bg-white border border-stone-200/70 rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-stone-900">Expiry Proximity & Risk Engine</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
              PRD FR-06 Compliant
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Calculated deterministically from verified expiry dates. Strictly excludes unconfirmed drafts to prevent false shortage or expiry alerts.
          </p>
        </div>

        {/* Configurable Threshold Selector */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <span className="text-xs font-bold text-stone-600">Alert Horizon:</span>
          <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200">
            {[30, 60, 90, 180].map((days) => (
              <button
                key={days}
                onClick={() => setThresholdDays(days)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  thresholdDays === days
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
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
        <div className="bg-white border border-red-200 rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)]">
          <div className="flex items-center justify-between text-xs text-red-600 font-bold mb-1">
            <span>Expired Batches</span>
            <AlertOctagon className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-red-700">
            {summary ? summary.expired_count : 0}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 font-medium">Requires immediate quarantine</div>
        </div>

        {/* Critical <=30d */}
        <div className="bg-white border border-amber-200 rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)]">
          <div className="flex items-center justify-between text-xs text-amber-700 font-bold mb-1">
            <span>Critical (&le; 30 Days)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-800">
            {summary ? summary.critical_count : 0}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 font-medium">First-to-expire rotation</div>
        </div>

        {/* Warning 31-90d */}
        <div className="bg-white border border-yellow-200 rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)]">
          <div className="flex items-center justify-between text-xs text-yellow-800 font-bold mb-1">
            <span>Warning (31 - 90 Days)</span>
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-yellow-800">
            {summary ? summary.warning_count : 0}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 font-medium">Monitor dispensing rate</div>
        </div>

        {/* Total in Horizon */}
        <div className="bg-white border border-stone-200/70 rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)]">
          <div className="flex items-center justify-between text-xs text-stone-600 font-bold mb-1">
            <span>Total Flagged in {thresholdDays}d</span>
            <Layers className="w-4 h-4 text-[#3e5f32]" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-stone-900">
            {summary ? summary.total_alerts : 0}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 font-medium">Across verified inventory</div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider px-1">
          Active Expiry Notifications ({summary ? summary.alerts.length : 0})
        </h3>

        {loading ? (
          <div className="p-12 text-center text-stone-500">Evaluating inventory dates...</div>
        ) : !summary || summary.alerts.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center space-y-2 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-[#36572a] mx-auto" />
            <h4 className="text-sm font-bold text-stone-900">No Batches Expiring in {thresholdDays} Days</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              All confirmed batches with recorded expiry dates are beyond your current {thresholdDays}-day horizon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.alerts.map((alert) => {
              const isExpired = alert.urgency === 'expired';
              const isCritical = alert.urgency === 'critical';

              return (
                <div
                  key={alert.id}
                  className={`rounded-3xl border p-5 transition-all shadow-[0_4px_24px_rgba(30,50,20,0.04)] bg-white ${
                    isExpired
                      ? 'border-red-200'
                      : isCritical
                      ? 'border-amber-200'
                      : 'border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">
                        {alert.medicine_name}
                      </h4>
                      {alert.strength && (
                        <span className="text-xs text-[#3b5e2f] font-mono font-semibold">
                          {alert.strength}
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${
                        isExpired
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : isCritical
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                      }`}
                    >
                      {isExpired
                        ? `Expired ${Math.abs(alert.days_until_expiry)}d ago`
                        : `${alert.days_until_expiry} days left`}
                    </span>
                  </div>

                  {/* Batch & Quantity row */}
                  <div className="flex items-center gap-4 text-xs text-stone-700 py-2.5 border-y border-stone-100 my-2">
                    <div>
                      <span className="text-stone-400 text-[11px]">Batch: </span>
                      <span className="font-mono font-semibold text-stone-800">
                        {alert.batch_number || 'Unrecorded'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px]">Expiry: </span>
                      <span className="font-mono font-semibold text-stone-800">
                        {alert.expiry_date}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px]">Stock: </span>
                      <span className="font-bold text-stone-900 font-mono">
                        {alert.verified_quantity} units
                      </span>
                    </div>
                  </div>

                  {/* Advisory Notice */}
                  <p className="text-[11px] text-stone-500 mt-2 flex items-center gap-1.5 font-medium">
                    <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{alert.alert_message}</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disclaimers per PRD FR-06 */}
      <div className="bg-[#edf4ea] border border-[#d2e4cb] rounded-3xl p-5 text-xs text-stone-600 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-[#203a19]">
            Clinical Safety & Regulatory Notice (PRD Section 8)
          </p>
          <p className="text-[11px] text-stone-600">
            A date-based alert does not establish whether a pharmaceutical product is safe for patient use. VisionStock provides visual auditing assistance only; authorized healthcare professionals must inspect packaging integrity and adhere to statutory disposal and dispensing guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};
