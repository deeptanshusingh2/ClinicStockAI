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
      <div className="bg-white border border-stone-200/70 rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-stone-900">Visual Audit Review Interface</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#edf4ea] text-[#2c4b22] font-mono font-bold border border-[#d1e3ca]">
              {analysis.model_used}
            </span>
            <span className="text-xs text-stone-400 font-mono">
              ({analysis.processing_time_ms} ms)
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Carefully inspect each candidate against the shelf photo or physical box. Missing values are flagged; edit freely before confirming.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-stone-100 border border-stone-200 text-xs text-stone-700 font-bold">
            <span className="text-stone-900">{candidates.length}</span> Detected
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#ebf7ec] border border-[#c4e5c8] text-xs text-[#2c7739] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2c7739]" />
            <span>{verifiedCount}</span> Verified
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{pendingCount}</span> Needs Verification
            </div>
          )}
        </div>
      </div>

      {/* Main Split Layout: Shelf Photo vs Candidate Review Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Photo with interactive Bounding Box overlays */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-stone-200/70 rounded-3xl p-5 sticky top-20 shadow-[0_4px_24px_rgba(30,50,20,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-stone-700 flex items-center gap-2 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 text-[#3b5e2f]" />
                <span>Visual Evidence Stream</span>
              </h3>
              <span className="text-[11px] text-stone-400 font-mono">
                {analysis.image_filename}
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-[4/3] flex items-center justify-center">
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
                        ? 'border-2 border-[#2b4b20] bg-[#e2fa6c]/30 shadow-[0_0_15px_rgba(226,250,108,0.7)] z-20'
                        : isVerified
                        ? 'border-2 border-emerald-500 bg-emerald-500/20 z-10'
                        : isRejected
                        ? 'border-2 border-red-500/50 bg-red-500/10 z-10'
                        : 'border-2 border-amber-500/80 bg-amber-500/10 hover:border-amber-600 z-10'
                    }`}
                    title={cand.medicine_name}
                  >
                    <span className="absolute -top-6 left-0 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-stone-900/90 text-white truncate max-w-[120px] font-bold">
                      {cand.medicine_name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Evidence Legend */}
            {candidates.some((c) => !!c.bounding_box) ? (
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-stone-500 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#3b5e2f] inline-block"></span>
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                  <span>Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
                  <span>Pending</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-1.5 text-[#3b5e2f] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Whole-package visual audit</span>
                </div>
                <span className="text-[10px] text-stone-400">Global package detection</span>
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
                className={`rounded-3xl border transition-all p-6 shadow-[0_4px_24px_rgba(30,50,20,0.04)] bg-white ${
                  cand.is_verified
                    ? 'border-[#c4e5c8] bg-[#f9fdf9]'
                    : cand.is_rejected
                    ? 'border-red-200 opacity-60'
                    : isActive
                    ? 'border-[#4e7140] ring-2 ring-[#4e7140]/10'
                    : 'border-stone-200/70 hover:border-stone-300'
                }`}
              >
                {/* Header row: Index, Medicine Name & Verification Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-stone-100 text-stone-800 text-xs font-mono flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">Candidate #{idx + 1}</div>
                      <input
                        type="text"
                        value={cand.medicine_name}
                        onChange={(e) => handleFieldChange(cand.id, 'medicine_name', e.target.value)}
                        placeholder="Medicine name"
                        disabled={cand.is_verified}
                        className="text-base font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1 focus:border-[#4d7040] focus:bg-white focus:outline-none w-full max-w-sm mt-0.5 transition"
                      />
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div>
                    {cand.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ebf7ec] text-[#2c7739] border border-[#c4e5c8]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Stock
                      </span>
                    ) : cand.is_rejected ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Draft Needs Check
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid of Editable Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                  {/* Strength / Concentration */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Strength / Dosage
                    </label>
                    <input
                      type="text"
                      value={cand.strength || ''}
                      onChange={(e) => handleFieldChange(cand.id, 'strength', e.target.value)}
                      placeholder="e.g. 500mg, 100ml"
                      disabled={cand.is_verified}
                      className="w-full text-xs font-mono text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:border-[#4d7040] focus:bg-white focus:outline-none transition"
                    />
                  </div>

                  {/* Batch Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700">
                        Batch / Lot Number
                      </label>
                      {isBatchMissing && (
                        <span className="text-[10px] text-amber-800 font-bold">
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
                        className={`w-full text-xs font-mono rounded-xl px-3 py-2 focus:outline-none transition ${
                          isBatchMissing
                            ? 'bg-amber-50 border border-amber-300 text-amber-900 focus:border-amber-500'
                            : 'bg-stone-50 border border-stone-200 text-stone-800 focus:border-[#4d7040] focus:bg-white'
                        }`}
                      />
                      {isBatchMissing && (
                        <AlertTriangle className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-amber-600" />
                      )}
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700">
                        Expiry Date (YYYY-MM-DD)
                      </label>
                      {isExpiryMissing && (
                        <span className="text-[10px] text-amber-800 font-bold">
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
                        className={`w-full text-xs font-mono rounded-xl px-3 py-2 focus:outline-none transition ${
                          isExpiryMissing
                            ? 'bg-amber-50 border border-amber-300 text-amber-900 focus:border-amber-500'
                            : 'bg-stone-50 border border-stone-200 text-stone-800 focus:border-[#4d7040] focus:bg-white'
                        }`}
                      />
                      {isExpiryMissing && (
                        <AlertTriangle className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-amber-600 pointer-events-none" />
                      )}
                    </div>
                  </div>

                  {/* Quantity Breakdown: Visible vs Physical Verified */}
                  <div className="bg-[#edf4ea] rounded-2xl p-3 border border-[#d1e3ca] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-[#2c4c21] font-bold">
                        Photo Visible: <span>{cand.visible_package_count} pkgs</span>
                      </div>
                      <div className="text-[10px] text-stone-500 font-medium">
                        Confirm actual count:
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#2c4c21] font-bold">Verified Qty:</span>
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
                        className="w-16 text-center text-xs font-extrabold font-mono text-stone-900 bg-white border border-[#4d7040]/50 rounded-xl px-2 py-1.5 focus:border-[#4d7040] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Evidence Notes Callout */}
                {cand.evidence_notes && (
                  <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 mb-4 text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-[#3c6030] shrink-0 mt-0.5" />
                    <div className="text-stone-700">
                      <span className="font-bold text-stone-900">Visual Evidence: </span>
                      {cand.evidence_notes}
                    </div>
                  </div>
                )}

                {/* Uncertainty Tags */}
                {hasUncertainty && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                      Flagged Uncertainties:
                    </span>
                    {cand.uncertain_fields.map((field, fIdx) => (
                      <span
                        key={fIdx}
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {field.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* Verification Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <div className="text-[11px] text-stone-500 font-medium">
                    {cand.is_verified ? (
                      <span className="text-[#2c7739] flex items-center gap-1 font-bold">
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
                          className="px-3.5 py-1.5 text-xs font-bold text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          id={`btn-verify-${cand.id}`}
                          onClick={() => handleVerify(cand)}
                          disabled={verifyingId === cand.id}
                          className="px-4 py-2 text-xs font-bold text-[#1b3419] bg-[#e2fa6c] hover:bg-[#d6f254] rounded-2xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
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
                        className="text-xs text-[#2c7739] hover:text-[#1e5728] flex items-center gap-1 font-bold underline-offset-4 hover:underline cursor-pointer"
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
                        className="px-3 py-1 text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 font-bold cursor-pointer"
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
            <div className="bg-[#edf4ea] border border-[#d1e3ca] rounded-3xl p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white text-[#2c7739] shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    {verifiedCount} record(s) confirmed and saved
                  </h4>
                  <p className="text-[11px] text-stone-500 font-medium">
                    Confirmed items are now active in SQLite inventory and evaluated for expiry alerts.
                  </p>
                </div>
              </div>

              <button
                onClick={onNavigateToInventory}
                className="px-4 py-2 text-xs font-bold text-[#1b3419] bg-[#e2fa6c] hover:bg-[#d6f254] rounded-2xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
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
