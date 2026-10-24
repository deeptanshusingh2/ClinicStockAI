import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Trash2,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { InventoryRecord, UrgencyLevel } from '../types';
import { api } from '../api/client';
import { ManualAddModal } from './ManualAddModal';

interface InventoryDashboardProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
  onNavigateToAudit: () => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  onError,
  onSuccess,
  onNavigateToAudit,
}) => {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await api.getInventory(searchTerm, 'verified');
      setRecords(data);
    } catch (err: any) {
      onError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [searchTerm]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from confirmed inventory?`)) {
      return;
    }
    try {
      await api.deleteInventoryItem(id);
      onSuccess(`Deleted "${name}" from inventory.`);
      loadInventory();
    } catch (err: any) {
      onError(err.message || 'Failed to delete record');
    }
  };

  const handleUpdateQuantity = async (record: InventoryRecord, delta: number) => {
    const newQty = Math.max(0, record.verified_quantity + delta);
    try {
      await api.updateInventoryItem(record.id, { verified_quantity: newQty });
      setRecords((prev) =>
        prev.map((r) => (r.id === record.id ? { ...r, verified_quantity: newQty } : r))
      );
    } catch (err: any) {
      onError('Failed to update quantity');
    }
  };

  const exportCSV = () => {
    if (records.length === 0) {
      onError('No confirmed inventory to export.');
      return;
    }
    const headers = [
      'Medicine Name',
      'Strength',
      'Batch Number',
      'Expiry Date',
      'Verified Quantity',
      'Status',
      'Source',
      'Verified At'
    ];
    const rows = records.map((r) => [
      `"${r.medicine_name}"`,
      `"${r.strength || ''}"`,
      `"${r.batch_number || ''}"`,
      `"${r.expiry_date || ''}"`,
      r.verified_quantity,
      r.status,
      r.source,
      `"${r.verified_at || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ClinicStock_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSuccess('Inventory exported to CSV.');
  };

  // Filter records based on urgency filter
  const filteredRecords = records.filter((r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'expired') return r.urgency === 'expired';
    if (statusFilter === 'critical') return r.urgency === 'critical';
    if (statusFilter === 'warning') return r.urgency === 'warning';
    if (statusFilter === 'good') return !r.urgency || r.urgency === 'upcoming';
    return true;
  });

  const totalUnits = records.reduce((acc, r) => acc + (r.verified_quantity || 0), 0);
  const expiredCount = records.filter((r) => r.urgency === 'expired').length;
  const criticalCount = records.filter((r) => r.urgency === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards matching the warm sage and crisp white design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200/70 rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)]">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
            <span>Total Verified SKUs</span>
            <div className="w-7 h-7 rounded-xl bg-[#edf4ea] text-[#3b5b2e] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-stone-900 font-mono tracking-tight">{records.length}</div>
          <div className="text-[11px] text-stone-400 mt-1 font-medium">Confirmed catalog lines</div>
        </div>

        <div className="bg-white border border-stone-200/70 rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)]">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
            <span>Total Physical Units</span>
            <div className="w-7 h-7 rounded-xl bg-[#ebf7ec] text-[#2c7739] flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#285f31] font-mono tracking-tight">{totalUnits}</div>
          <div className="text-[11px] text-stone-400 mt-1 font-medium">Confirmed in dispensary</div>
        </div>

        <div className="bg-white border border-stone-200/70 rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)]">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
            <span>Critical (&lt;30 Days)</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-800 font-mono tracking-tight">{criticalCount}</div>
          <div className="text-[11px] text-stone-400 mt-1 font-medium">Approaching expiration</div>
        </div>

        <div className="bg-white border border-stone-200/70 rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)]">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
            <span>Expired Batches</span>
            <div className="w-7 h-7 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-red-700 font-mono tracking-tight">{expiredCount}</div>
          <div className="text-[11px] text-stone-400 mt-1 font-medium">Requires quarantine</div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white border border-stone-200/70 rounded-3xl p-4 shadow-[0_4px_24px_rgba(30,50,20,0.04)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search medicine name or batch code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-stone-900 bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 focus:border-[#4d7040] focus:bg-white focus:outline-none transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'expired', label: 'Expired' },
            { id: 'critical', label: '<30d Critical' },
            { id: 'warning', label: '<90d Warning' },
            { id: 'good', label: 'Good Stock' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-[#edf4ea] text-[#28461f] border border-[#cbe0c3]'
                  : 'bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Actions: Add Manual & Export */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={exportCSV}
            className="px-4 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200/70 rounded-2xl flex items-center gap-1.5 transition cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#3e5e32]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-[#1b3419] bg-[#e2fa6c] hover:bg-[#d6f254] rounded-2xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Manually</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-stone-200/70 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(30,50,20,0.04)]">
        {loading ? (
          <div className="p-12 text-center text-stone-500">Loading verified inventory...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">No verified inventory found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Scan a medicine shelf to draft records and verify them, or manually add your first stock entry.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onNavigateToAudit}
                className="px-4 py-2 text-xs font-bold text-[#1b3419] bg-[#e2fa6c] hover:bg-[#d6f254] rounded-2xl transition cursor-pointer"
              >
                Start Shelf Scan
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-2xl transition cursor-pointer"
              >
                Add Medicine Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#edf2e6]/80 text-stone-600 uppercase tracking-wider border-b border-stone-200 text-[11px]">
                <tr>
                  <th className="py-3.5 px-5 font-bold">Medicine & Strength</th>
                  <th className="py-3.5 px-4 font-bold">Batch Code</th>
                  <th className="py-3.5 px-4 font-bold">Expiry Date & Risk</th>
                  <th className="py-3.5 px-4 font-bold">Confirmed Quantity</th>
                  <th className="py-3.5 px-4 font-bold">Audit Source</th>
                  <th className="py-3.5 px-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {filteredRecords.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-[#f6f9f3] transition">
                      {/* Name & Strength */}
                      <td className="py-3 px-5">
                        <div className="font-bold text-stone-900 text-xs">{r.medicine_name}</div>
                        {r.strength && (
                          <div className="text-[11px] text-[#3f6333] font-mono mt-0.5 font-semibold">{r.strength}</div>
                        )}
                      </td>

                      {/* Batch Code */}
                      <td className="py-3 px-4">
                        {r.batch_number ? (
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
                            {r.batch_number}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Expiry Date & Urgency */}
                      <td className="py-3 px-4">
                        {r.expiry_date ? (
                          <div>
                            <div className="font-mono text-xs font-semibold text-stone-800">{r.expiry_date}</div>
                            {r.urgency === 'expired' && (
                              <span className="inline-block mt-0.5 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                Expired ({Math.abs(r.days_until_expiry || 0)}d ago)
                              </span>
                            )}
                            {r.urgency === 'critical' && (
                              <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                Expires in {r.days_until_expiry}d
                              </span>
                            )}
                            {r.urgency === 'warning' && (
                              <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-900 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                                In {r.days_until_expiry} days
                              </span>
                            )}
                            {(!r.urgency || r.urgency === 'upcoming') && (
                              <span className="text-[10px] font-medium text-stone-400">Good standing</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">Unrecorded</span>
                        )}
                      </td>

                      {/* Verified Quantity with Stepper */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateQuantity(r, -1)}
                            className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs transition cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-extrabold text-sm text-stone-900 px-2 min-w-[2rem] text-center">
                            {r.verified_quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(r, 1)}
                            className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs transition cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            r.source === 'photo_assisted'
                              ? 'bg-[#edf4ea] text-[#294620] border-[#d2e4cb]'
                              : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {r.source === 'photo_assisted' ? 'Photo Audited' : 'Manual Entry'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => handleDelete(r.id, r.medicine_name)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Add Modal */}
      <ManualAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRecordCreated={loadInventory}
        onError={onError}
        onSuccess={onSuccess}
      />
    </div>
  );
};
