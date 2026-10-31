import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Tags,
  ShieldCheck
} from 'lucide-react';
import {
  apiGetCostCategories,
  apiCreateCostCategory,
  apiUpdateCostCategory,
  apiDeleteCostCategory
} from '../../../services/api';

const CostCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });

  const [formData, setFormData] = useState({
    name: '',
    costType: 'DIRECT_MATERIAL',
    description: '',
    displayOrder: 1,
    isActive: true
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await apiGetCostCategories();
      setCategories(res.data || []);
    } catch (err) {
      showToast('FAILED TO LOAD CATEGORIES: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      costType: 'DIRECT_MATERIAL',
      description: '',
      displayOrder: categories.length + 1,
      isActive: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      costType: cat.costType,
      description: cat.description || '',
      displayOrder: cat.displayOrder || 1,
      isActive: cat.isActive !== undefined ? cat.isActive : true
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Category name is required', true);
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await apiUpdateCostCategory(editingCategory.id, formData);
        showToast('CATEGORY UPDATED');
      } else {
        await apiCreateCostCategory(formData);
        showToast('CATEGORY CREATED');
      }
      setModalOpen(false);
      loadCategories();
    } catch (err) {
      showToast('SAVE FAILED: ' + err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      await apiDeleteCostCategory(deleteModal.item.id);
      showToast('CATEGORY DELETED');
      setDeleteModal({ isOpen: false, item: null });
      loadCategories();
    } catch (err) {
      showToast('DELETE FAILED: ' + err.message, true);
    }
  };

  const getCostTypeBadgeClass = (type) => {
    switch (type) {
      case 'DIRECT_MATERIAL':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DIRECT_LABOR':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PACKAGING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'SHIPPING_FULFILLMENT':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'OVERHEAD':
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
      case 'PROMOTIONAL':
        return 'bg-lime-100 text-lime-900 border-lime-400';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black font-mono tracking-wider text-neutral-900 uppercase">
            COST CATEGORY TAXONOMY
          </h2>
          <p className="text-xs text-neutral-600 font-sans">
            Configurable direct and indirect cost classifications powering BOM profiles and expense allocation.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-venm-neon px-5 py-2.5 text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-neutral-900" />
          <span>New Cost Category</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold tracking-wider text-neutral-600">
              <tr>
                <th className="py-3 px-4 text-center">Order</th>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4 text-center">Cost Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Default</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-neutral-500 font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    LOADING CATEGORIES...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-neutral-400 font-sans">
                    No categories found. Click "New Cost Category" to create one.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-neutral-400 font-bold">{cat.displayOrder}</td>
                    <td className="py-3 px-4 font-bold text-neutral-900">{cat.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold border uppercase ${getCostTypeBadgeClass(cat.costType)}`}>
                        {cat.costType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-sans text-xs">{cat.description || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      {cat.isDefault ? (
                        <span className="text-[10px] font-mono text-neutral-500 font-bold">SYSTEM</span>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-400">CUSTOM</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold border ${
                          cat.isActive
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-100 text-neutral-400 border-neutral-300'
                        }`}
                      >
                        {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-neutral-600 hover:text-black border border-neutral-200 cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!cat.isDefault && (
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ isOpen: true, item: cat })}
                          className="p-1.5 text-rose-600 hover:text-rose-800 border border-neutral-200 cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold font-mono tracking-wider text-neutral-900 uppercase">
                {editingCategory ? 'EDIT COST CATEGORY' : 'CREATE COST CATEGORY'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leather Trims & Hardware"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                  Cost Classification Type *
                </label>
                <select
                  value={formData.costType}
                  onChange={(e) => setFormData({ ...formData, costType: e.target.value })}
                  className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white"
                >
                  <option value="DIRECT_MATERIAL">DIRECT MATERIAL (Fabrics, Blanks, Trims, Inks)</option>
                  <option value="DIRECT_LABOR">DIRECT LABOR (Tailoring, Printing, Embroidery)</option>
                  <option value="PACKAGING">PACKAGING (Boxes, Polybags, Stickers)</option>
                  <option value="SHIPPING_FULFILLMENT">SHIPPING & FULFILLMENT (Couriers)</option>
                  <option value="OVERHEAD">OVERHEAD (Gateway fees, QA, Utilities)</option>
                  <option value="PROMOTIONAL">PROMOTIONAL (Gifts, Samples)</option>
                  <option value="OTHER">OTHER OVERHEAD</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Details regarding what is tracked in this category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-black"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                    Active Status
                  </label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white"
                  >
                    <option value="true">ACTIVE</option>
                    <option value="false">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono font-bold uppercase border border-neutral-300 bg-white hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-venm-neon px-5 py-2 text-xs font-bold font-mono tracking-widest uppercase cursor-pointer"
                >
                  {submitting ? 'SAVING...' : editingCategory ? 'UPDATE' : 'CREATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-neutral-200 space-y-4">
            <h3 className="text-base font-bold font-mono tracking-wider text-neutral-900 uppercase">
              CONFIRM REMOVAL
            </h3>
            <p className="text-xs text-neutral-600 font-sans">
              Are you sure you want to delete category{' '}
              <strong className="text-neutral-900 font-mono">"{deleteModal.item?.name}"</strong>?
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
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCategories;

