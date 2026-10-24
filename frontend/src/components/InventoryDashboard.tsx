import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Trash2,
  Edit2,
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
  const [editingRecord, setEditingRecord] = useState<InventoryRecord | null>(null);

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
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Verified SKUs</span>
            <Layers className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{records.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Confirmed catalog lines</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Physical Units</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-mono">{totalUnits}</div>
          <div className="text-[11px] text-slate-500 mt-1">Confirmed in dispensary</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Critical (&lt;30 Days)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">{criticalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Approaching expiration</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Expired Batches</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono">{expiredCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Requires quarantine</div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine name or batch code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-white bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 focus:border-teal-400 focus:outline-none"
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
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === f.id
                  ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50'
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
            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl flex items-center gap-1.5 transition"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 rounded-xl shadow-md flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Manually</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading verified inventory...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No verified inventory found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Scan a medicine shelf to draft records and verify them, or manually add your first stock entry.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onNavigateToAudit}
                className="px-4 py-2 text-xs font-semibold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-lg transition"
              >
                Start Shelf Scan
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
              >
                Add Medicine Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Medicine & Strength</th>
                  <th className="py-3.5 px-4 font-semibold">Batch Code</th>
                  <th className="py-3.5 px-4 font-semibold">Expiry Date & Risk</th>
                  <th className="py-3.5 px-4 font-semibold">Confirmed Quantity</th>
                  <th className="py-3.5 px-4 font-semibold">Audit Source</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredRecords.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition">
                      {/* Name & Strength */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white text-xs">{r.medicine_name}</div>
                        {r.strength && (
                          <div className="text-[11px] text-teal-400 font-mono mt-0.5">{r.strength}</div>
                        )}
                      </td>

                      {/* Batch Code */}
                      <td className="py-3 px-4">
                        {r.batch_number ? (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {r.batch_number}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Expiry Date & Urgency */}
                      <td className="py-3 px-4">
                        {r.expiry_date ? (
                          <div>
                            <div className="font-mono text-xs text-slate-300">{r.expiry_date}</div>
                            {r.urgency === 'expired' && (
                              <span className="inline-block mt-0.5 text-[10px] font-semibold text-red-400 bg-red-950/40 border border-red-500/30 px-1.5 py-0.2 rounded">
                                Expired ({Math.abs(r.days_until_expiry || 0)}d ago)
                              </span>
                            )}
                            {r.urgency === 'critical' && (
                              <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.2 rounded">
                                Expires in {r.days_until_expiry}d
                              </span>
                            )}
                            {r.urgency === 'warning' && (
                              <span className="inline-block mt-0.5 text-[10px] font-medium text-yellow-300 bg-yellow-950/40 border border-yellow-500/30 px-1.5 py-0.2 rounded">
                                In {r.days_until_expiry} days
                              </span>
                            )}
                            {(!r.urgency || r.urgency === 'upcoming') && (
                              <span className="text-[10px] text-slate-500">Good standing</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Unrecorded</span>
                        )}
                      </td>

                      {/* Verified Quantity with Stepper */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateQuantity(r, -1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-sm text-white px-2">
                            {r.verified_quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(r, 1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            r.source === 'photo_assisted'
                              ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {r.source === 'photo_assisted' ? 'Photo Audited' : 'Manual Entry'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(r.id, r.medicine_name)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
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
