import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Edit3,
  ShieldAlert,
  ArrowRight,
  Eye,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { CandidateMedicine, AnalysisResponse } from '../types';
import { api } from '../api/client';

interface CandidateReviewTableProps {
  analysis: AnalysisResponse;
  onCandidateVerified: (candidateId: string, recordId: string) => void;
  onNavigateToInventory: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const CandidateReviewTable: React.FC<CandidateReviewTableProps> = ({
  analysis,
  onCandidateVerified,
  onNavigateToInventory,
  onError,
  onSuccess,
}) => {
  const [candidates, setCandidates] = useState<CandidateMedicine[]>(analysis.candidates);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(
    analysis.candidates.length > 0 ? analysis.candidates[0].id : null
  );
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Field change handler for editable candidate inputs
  const handleFieldChange = (
    id: string,
    field: keyof CandidateMedicine,
    value: any
  ) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Human verification action: PRD FR-04
  const handleVerify = async (candidate: CandidateMedicine) => {
    // Mandate verified physical quantity confirmed by staff
    const quantity = candidate.verified_quantity ?? candidate.visible_package_count;
    if (quantity === undefined || quantity === null || quantity < 0) {
      onError('Please confirm an actual physical verified quantity before confirming stock.');
      return;
    }

    if (!candidate.medicine_name.trim()) {
      onError('Medicine name is required to verify this record.');
      return;
    }

    try {
      setVerifyingId(candidate.id);
      const record = await api.verifyCandidate(
        candidate,
        quantity,
        analysis.image_filename
      );

      // Update local state to show verified checkmark
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidate.id
            ? { ...c, is_verified: true, is_rejected: false, verified_quantity: quantity, verified_record_id: record.id }
            : c
        )
      );

      onCandidateVerified(candidate.id, record.id);
      onSuccess(`Verified & saved "${candidate.medicine_name}" (Qty: ${quantity}) to confirmed inventory.`);
    } catch (err: any) {
      onError(err.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  // Reject action
  const handleReject = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, is_rejected: true, is_verified: false } : c
      )
    );
    onSuccess('Candidate draft rejected. It will not be added to confirmed inventory.');
  };

  const verifiedCount = candidates.filter((c) => c.is_verified).length;
  const rejectedCount = candidates.filter((c) => c.is_rejected).length;
  const pendingCount = candidates.length - verifiedCount - rejectedCount;

  return (
    <div className="space-y-6">
      {/* Top Audit Status Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Visual Audit Review Interface</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 font-mono border border-slate-700">
              {analysis.model_used}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({analysis.processing_time_ms} ms)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Carefully inspect each candidate against the shelf photo or physical box. Missing values are flagged; edit freely before confirming.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <span className="font-semibold text-white">{candidates.length}</span> Detected
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{verifiedCount}</span> Verified
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold">{pendingCount}</span> Needs Verification
            </div>
          )}
        </div>
      </div>

      {/* Main Split Layout: Shelf Photo vs Candidate Review Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Photo with interactive Bounding Box overlays */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sticky top-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 text-teal-400" />
                <span>Visual Evidence Stream</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {analysis.image_filename}
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[4/3] flex items-center justify-center">
              <img
                src={analysis.image_url}
                alt="Audited Shelf"
                className="w-full h-full object-contain"
              />

              {/* Bounding box overlays for detected packages */}
              {candidates.map((cand) => {
                if (!cand.bounding_box) return null;
                const { x, y, w, h } = cand.bounding_box;
                const isActive = activeCandidateId === cand.id;
                const isVerified = cand.is_verified;
                const isRejected = cand.is_rejected;

                return (
                  <button
                    key={cand.id}
                    onClick={() => setActiveCandidateId(cand.id)}
                    style={{
                      left: `${x * 100}%`,
                      top: `${y * 100}%`,
                      width: `${w * 100}%`,
                      height: `${h * 100}%`,
                    }}
                    className={`absolute rounded transition-all cursor-pointer ${
                      isActive
                        ? 'border-2 border-teal-400 bg-teal-400/20 shadow-[0_0_15px_rgba(45,212,191,0.5)] z-20'
                        : isVerified
                        ? 'border-2 border-emerald-500 bg-emerald-500/15 z-10'
                        : isRejected
                        ? 'border-2 border-red-500/50 bg-red-500/10 z-10'
                        : 'border-2 border-amber-400/70 bg-amber-400/10 hover:border-amber-400 z-10'
                    }`}
                    title={cand.medicine_name}
                  >
                    <span className="absolute -top-6 left-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/90 text-white border border-slate-700 truncate max-w-[120px]">
                      {cand.medicine_name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Evidence Legend */}
            {candidates.some((c) => !!c.bounding_box) ? (
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-teal-400 inline-block"></span>
                  <span>Active Candidate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                  <span>Verified Stock</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span>
                  <span>Needs Review</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-teal-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Whole-package visual audit</span>
                </div>
                <span className="text-[10px] text-slate-500">Uninvented bounding bounds</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Candidate Review Cards */}
        <div className="lg:col-span-7 space-y-4">
          {candidates.map((cand, idx) => {
            const isActive = activeCandidateId === cand.id;
            const hasUncertainty = cand.uncertain_fields && cand.uncertain_fields.length > 0;
            const isBatchMissing = !cand.batch_number;
            const isExpiryMissing = !cand.expiry_date;

            return (
              <div
                key={cand.id}
                onClick={() => setActiveCandidateId(cand.id)}
                className={`rounded-2xl border transition-all p-5 ${
                  cand.is_verified
                    ? 'bg-slate-900/40 border-emerald-500/40'
                    : cand.is_rejected
                    ? 'bg-slate-900/20 border-red-500/30 opacity-60'
                    : isActive
                    ? 'bg-slate-900/80 border-teal-500/60 shadow-lg shadow-teal-500/5'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header row: Index, Medicine Name & Verification Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-mono flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Candidate #{idx + 1}</div>
                      <input
                        type="text"
                        value={cand.medicine_name}
                        onChange={(e) => handleFieldChange(cand.id, 'medicine_name', e.target.value)}
                        placeholder="Medicine name"
                        disabled={cand.is_verified}
                        className="text-base font-semibold text-white bg-slate-950/60 border border-slate-700/80 rounded-lg px-2.5 py-1 focus:border-teal-400 focus:outline-none w-full max-w-sm mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div>
                    {cand.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Stock
                      </span>
                    ) : cand.is_rejected ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Draft Needs Check
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid of Editable Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                  {/* Strength / Concentration */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Strength / Dosage
                    </label>
                    <input
                      type="text"
                      value={cand.strength || ''}
                      onChange={(e) => handleFieldChange(cand.id, 'strength', e.target.value)}
                      placeholder="e.g. 500mg, 100ml"
                      disabled={cand.is_verified}
                      className="w-full text-xs font-mono text-slate-200 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 focus:border-teal-400 focus:outline-none"
                    />
                  </div>

                  {/* Batch Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-400">
                        Batch / Lot Number
                      </label>
                      {isBatchMissing && (
                        <span className="text-[10px] text-amber-400 font-medium">
                          Illegible / Missing
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={cand.batch_number || ''}
                        onChange={(e) => handleFieldChange(cand.id, 'batch_number', e.target.value)}
                        placeholder="Enter batch from box"
                        disabled={cand.is_verified}
                        className={`w-full text-xs font-mono rounded-lg px-3 py-2 focus:outline-none transition ${
                          isBatchMissing
                            ? 'bg-amber-950/20 border border-amber-500/40 text-amber-200 placeholder-amber-500/50 focus:border-amber-400'
                            : 'bg-slate-950/60 border border-slate-800 text-slate-200 focus:border-teal-400'
                        }`}
                      />
                      {isBatchMissing && (
                        <AlertTriangle className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-400">
                        Expiry Date (YYYY-MM-DD)
                      </label>
                      {isExpiryMissing && (
                        <span className="text-[10px] text-amber-400 font-medium">
                          Obscured by Glare / Unseen
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        value={cand.expiry_date || ''}
                        onChange={(e) => handleFieldChange(cand.id, 'expiry_date', e.target.value)}
                        disabled={cand.is_verified}
                        className={`w-full text-xs font-mono rounded-lg px-3 py-2 focus:outline-none transition ${
                          isExpiryMissing
                            ? 'bg-amber-950/20 border border-amber-500/40 text-amber-200 focus:border-amber-400'
                            : 'bg-slate-950/60 border border-slate-800 text-slate-200 focus:border-teal-400'
                        }`}
                      />
                      {isExpiryMissing && (
                        <AlertTriangle className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-amber-400 pointer-events-none" />
                      )}
                    </div>
                  </div>

                  {/* Quantity Breakdown: Visible vs Physical Verified */}
                  <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        Photo Visible: <span className="font-bold text-slate-200">{cand.visible_package_count} pkgs</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Confirm actual count:
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-teal-400 font-medium">Verified Qty:</span>
                      <input
                        type="number"
                        min="0"
                        value={cand.verified_quantity ?? cand.visible_package_count}
                        onChange={(e) =>
                          handleFieldChange(
                            cand.id,
                            'verified_quantity',
                            parseInt(e.target.value) || 0
                          )
                        }
                        disabled={cand.is_verified}
                        className="w-16 text-center text-xs font-bold font-mono text-white bg-slate-900 border border-teal-500/50 rounded-lg px-2 py-1.5 focus:border-teal-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Evidence Notes Callout */}
                {cand.evidence_notes && (
                  <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80 mb-4 text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div className="text-slate-300">
                      <span className="font-semibold text-slate-200">Visual Evidence: </span>
                      {cand.evidence_notes}
                    </div>
                  </div>
                )}

                {/* Uncertainty Tags */}
                {hasUncertainty && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                      Flagged Uncertainties:
                    </span>
                    {cand.uncertain_fields.map((field, fIdx) => (
                      <span
                        key={fIdx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {field.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* Verification Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-500">
                    {cand.is_verified ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5" /> Saved to Confirmed Inventory
                      </span>
                    ) : (
                      <span>Requires authorized staff confirmation</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!cand.is_verified && !cand.is_rejected && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReject(cand.id)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          id={`btn-verify-${cand.id}`}
                          onClick={() => handleVerify(cand)}
                          disabled={verifyingId === cand.id}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 rounded-lg shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition"
                        >
                          {verifyingId === cand.id ? (
                            <span>Saving...</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verify & Confirm Stock</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {cand.is_verified && (
                      <button
                        onClick={onNavigateToInventory}
                        className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium underline-offset-4 hover:underline"
                      >
                        <span>View in Stock</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {cand.is_rejected && (
                      <button
                        onClick={() =>
                          setCandidates((prev) =>
                            prev.map((c) =>
                              c.id === cand.id ? { ...c, is_rejected: false } : c
                            )
                          )
                        }
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reopen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Finished review banner */}
          {verifiedCount > 0 && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {verifiedCount} record(s) confirmed and saved
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Confirmed items are now active in SQLite inventory and evaluated for expiry alerts.
                  </p>
                </div>
              </div>

              <button
                onClick={onNavigateToInventory}
                className="px-4 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 transition"
              >
                <span>Open Inventory Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
