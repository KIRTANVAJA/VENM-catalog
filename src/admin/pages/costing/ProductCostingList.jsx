import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Copy,
  Edit2,
  Trash2,
  Layers,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Eye
} from 'lucide-react';
import {
  apiGetProductCostings,
  apiDeleteProductCosting,
  apiDuplicateProductCosting
} from '../../../services/api';

const ProductCostingList = () => {
  const navigate = useNavigate();
  const [costings, setCostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [lowMarginOnly, setLowMarginOnly] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCostings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'ALL') params.category = category;
      if (status !== 'ALL') params.status = status;
      if (lowMarginOnly) params.lowMargin = 'true';

      const res = await apiGetProductCostings(params);
      setCostings(res.data || []);
    } catch (err) {
      showToast('FAILED TO LOAD COSTING PROFILES: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCostings();
  }, [category, status, lowMarginOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCostings();
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await apiDuplicateProductCosting(id);
      showToast('DUPLICATED PROFILE: ' + res.data.productName);
      loadCostings();
    } catch (err) {
      showToast('DUPLICATION FAILED: ' + err.message, true);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      await apiDeleteProductCosting(deleteModal.item.id);
      showToast('COSTING PROFILE REMOVED');
      setDeleteModal({ isOpen: false, item: null });
      loadCostings();
    } catch (err) {
      showToast('DELETE FAILED: ' + err.message, true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 font-extrabold text-xs tracking-widest uppercase shadow-2xl flex items-center gap-2 border ${
            toast.isError ? 'bg-red-600 text-white border-red-700' : 'bg-lime-400 text-neutral-900 border-lime-500'
          }`}
        >
          {toast.isError ? <AlertTriangle className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-neutral-900" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black font-mono tracking-wider text-neutral-900 uppercase">
            PRODUCT COSTING & BILL OF MATERIALS (BOM)
          </h2>
          <p className="text-xs text-neutral-600 font-sans">
            Itemized manufacturing component breakdowns, target margin pricing, and profit simulation.
          </p>
        </div>

        <Link
          to="/admin/costing/products/new"
          className="btn-venm-neon px-5 py-2.5 text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-neutral-900" />
          <span>New Costing Profile</span>
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-neutral-300 text-xs font-mono bg-white focus:outline-hidden focus:border-black"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-mono font-bold uppercase bg-neutral-900 text-white hover:bg-black cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-neutral-300 px-3 py-2 text-xs font-mono bg-white"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>

          <button
            type="button"
            onClick={() => setLowMarginOnly(!lowMarginOnly)}
            className={`px-3 py-2 text-xs font-mono font-bold uppercase border transition-all cursor-pointer ${
              lowMarginOnly
                ? 'bg-amber-100 border-amber-400 text-amber-900 font-black'
                : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Low Margin Only
          </button>

          <button
            type="button"
            onClick={loadCostings}
            className="p-2 border border-neutral-300 text-neutral-600 hover:text-black cursor-pointer bg-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold tracking-wider text-neutral-600">
              <tr>
                <th className="py-3 px-4">Product / Silhouette</th>
                <th className="py-3 px-4">SKU / Category</th>
                <th className="py-3 px-4 text-center">Batch Qty</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Suggested Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Unit Profit</th>
                <th className="py-3 px-4 text-center">Gross Margin</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-neutral-500 font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    LOADING COSTING PROFILES...
                  </td>
                </tr>
              ) : costings.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-neutral-400 font-sans">
                    No product costing profiles found. Click "New Costing Profile" to build your first BOM.
                  </td>
                </tr>
              ) : (
                costings.map((c) => {
                  const unitCost = c.actualUnitCost || c.estimatedUnitCost || 0;
                  const sellPrice = c.actualSellingPrice || c.suggestedSellingPrice || 0;
                  const isLowMargin = (c.grossProfitMargin || 0) < 35;

                  return (
                    <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900">{c.productName}</div>
                        <div className="text-[10px] text-neutral-500 font-sans">
                          {c._count?.components || 0} Cost Components
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-neutral-800">{c.sku || 'N/A'}</div>
                        <div className="text-[10px] text-neutral-500">{c.category || 'Standard'}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-neutral-700">{c.batchQuantity || 1} pcs</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        ₹{Number(unitCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-600">
                        ₹{Number(c.suggestedSellingPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-neutral-950">
                        ₹{Number(sellPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        ₹{Number(c.grossProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono font-bold border uppercase ${
                            isLowMargin
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-lime-400 text-neutral-950 border-lime-500 font-black'
                          }`}
                        >
                          {c.grossProfitMargin || 0}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[9px] uppercase font-bold border ${
                            c.status === 'ACTIVE'
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleDuplicate(c.id)}
                          className="p-1.5 text-neutral-600 hover:text-black border border-neutral-200 hover:border-neutral-400 cursor-pointer"
                          title="Duplicate Profile"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/admin/costing/products/${c.id}/edit`}
                          className="p-1.5 inline-block text-neutral-600 hover:text-black border border-neutral-200 hover:border-neutral-400 cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, item: c })}
                          className="p-1.5 text-rose-600 hover:text-rose-800 border border-neutral-200 hover:border-rose-400 cursor-pointer"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-neutral-200 space-y-4">
            <h3 className="text-base font-bold font-mono tracking-wider text-neutral-900 uppercase">
              CONFIRM REMOVAL
            </h3>
            <p className="text-xs text-neutral-600 font-sans">
              Are you sure you want to delete the costing profile for{' '}
              <strong className="text-neutral-900 font-mono">"{deleteModal.item?.productName}"</strong>? This will remove all associated component breakdowns.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, item: null })}
                className="px-4 py-2 text-xs font-mono font-bold uppercase border border-neutral-300 bg-white hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-mono font-bold uppercase bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCostingList;

