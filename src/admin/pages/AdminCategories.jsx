import React, { useState, useEffect } from 'react';
import { apiGetCategories, apiCreateCategory, apiUpdateCategory, apiDeleteCategory } from '../../services/api';
import { Plus, Edit, Trash2, Tag, CheckCircle2 } from 'lucide-react';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');

  const loadCategories = async () => {
    try {
      const data = await apiGetCategories();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.warn('[CATEGORIES ADMIN] Load failed:', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const catData = {
      name: formName,
      slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      displayOrder: editingCategory ? editingCategory.displayOrder : categories.length + 1
    };

    try {
      if (editingCategory) {
        await apiUpdateCategory(editingCategory.id, catData);
      } else {
        await apiCreateCategory(catData);
      }
      loadCategories();
    } catch (err) {
      console.warn('Save category error:', err);
    }
    setShowModal(false);
  };

  const handleDelete = async (catId) => {
    if (window.confirm('Delete this category?')) {
      try {
        await apiDeleteCategory(catId);
        setCategories(categories.filter((c) => c.id !== catId));
      } catch (err) {}
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-800 font-bold uppercase">
            CATALOG MANAGEMENT // CATEGORIES
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-wider text-neutral-900 uppercase">
            CATEGORY REGISTRY ({categories.length})
          </h2>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-venm-primary px-6 py-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 uppercase self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>ADD CATEGORY</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-neutral-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-900 font-mono text-[11px] tracking-widest uppercase font-extrabold">
              <th className="py-3.5 px-4">ORDER</th>
              <th className="py-3.5 px-4">CATEGORY NAME</th>
              <th className="py-3.5 px-4">SLUG</th>
              <th className="py-3.5 px-4">STATUS</th>
              <th className="py-3.5 px-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 font-mono">
            {categories.map((cat, idx) => (
              <tr key={cat.id || idx} className="hover:bg-neutral-50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-neutral-600">
                  #{idx + 1}
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-extrabold text-neutral-900 text-sm uppercase tracking-wider block font-sans">
                    {cat.name}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-neutral-700 font-mono text-xs font-medium">
                  {cat.slug}
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-lime-400/20 text-neutral-900 border border-lime-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
                    ACTIVE
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-colors rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white p-6 sm:p-8 max-w-md w-full border border-neutral-300 shadow-xl space-y-6">
            <h3 className="text-lg font-extrabold text-neutral-900 uppercase tracking-wider border-b border-neutral-200 pb-3">
              {editingCategory ? 'EDIT CATEGORY' : 'ADD NEW CATEGORY'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-800 tracking-wider uppercase block">CATEGORY NAME *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingCategory) {
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Outerwear"
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 outline-none focus:border-neutral-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-800 tracking-wider uppercase block">SLUG *</label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. outerwear"
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 outline-none focus:border-neutral-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-venm-outline px-4 py-2 text-xs font-mono font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="btn-venm-neon px-6 py-2 text-xs font-bold tracking-widest uppercase"
                >
                  SAVE CATEGORY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
