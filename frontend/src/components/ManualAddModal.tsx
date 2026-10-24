import React, { useState } from 'react';
import { X, Plus, Package, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

interface ManualAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordCreated: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const ManualAddModal: React.FC<ManualAddModalProps> = ({
  isOpen,
  onClose,
  onRecordCreated,
  onError,
  onSuccess,
}) => {
  const [medicineName, setMedicineName] = useState('');
  const [strength, setStrength] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) {
      onError('Medicine name is required.');
      return;
    }
    if (quantity < 0) {
      onError('Verified quantity cannot be negative.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createInventoryItem({
        medicine_name: medicineName.trim(),
        strength: strength.trim() || null,
        batch_number: batchNumber.trim() || null,
        expiry_date: expiryDate || null,
        verified_quantity: quantity,
        evidence_notes: notes.trim() || 'Manually entered by clinic staff'
      });

      onSuccess(`Successfully added "${medicineName}" (Qty: ${quantity}) to confirmed inventory.`);
      onRecordCreated();
      onClose();
      // Reset form
      setMedicineName('');
      setStrength('');
      setBatchNumber('');
      setExpiryDate('');
      setQuantity(10);
      setNotes('');
    } catch (err: any) {
      onError(err.message || 'Failed to create inventory record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Manual Inventory Entry</h3>
            <p className="text-xs text-slate-400">Directly record confirmed stock without photo analysis.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Medicine Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              placeholder="e.g. Amoxicillin Trihydrate"
              className="w-full text-xs text-white bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 focus:border-teal-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Strength / Dosage
              </label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 500mg"
                className="w-full text-xs text-white bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 focus:border-teal-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Batch / Lot Number
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. AMX-2024"
                className="w-full text-xs font-mono text-white bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full text-xs font-mono text-white bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 focus:border-teal-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Verified Quantity <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full text-xs font-bold font-mono text-white bg-slate-950 border border-teal-500/50 rounded-lg px-3 py-2.5 focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Audit Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Physical count from shelf drawer 3"
              className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:border-teal-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 rounded-lg shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Add to Confirmed Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
