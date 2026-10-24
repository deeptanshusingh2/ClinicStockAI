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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-[#edf4ea] text-[#3b5e2f] border border-[#d1e3ca]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-stone-900">Manual Inventory Entry</h3>
            <p className="text-xs text-stone-500">Directly record confirmed stock without photo analysis.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Medicine Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              placeholder="e.g. Amoxicillin Trihydrate"
              className="w-full text-xs text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:border-[#4d7040] focus:bg-white focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Strength / Dosage
              </label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 500mg"
                className="w-full text-xs text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:border-[#4d7040] focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Batch / Lot Number
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. AMX-2024"
                className="w-full text-xs font-mono text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:border-[#4d7040] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full text-xs font-mono text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:border-[#4d7040] focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Verified Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full text-xs font-extrabold font-mono text-stone-900 bg-stone-50 border border-[#4d7040]/40 rounded-xl px-3.5 py-2.5 focus:border-[#4d7040] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Audit Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Physical count from shelf drawer 3"
              className="w-full text-xs text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 focus:border-[#4d7040] focus:bg-white focus:outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-[#1b3419] bg-[#e2fa6c] hover:bg-[#d6f254] rounded-2xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
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
