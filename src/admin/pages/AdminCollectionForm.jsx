import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  apiGetCollectionBySlug,
  apiCreateCollection,
  apiUpdateCollection,
  apiDeleteCollection
} from '../../services/api';
import { Save, ArrowLeft, Trash2, CheckCircle2 } from 'lucide-react';

const AdminCollectionForm = ({ mode = 'create' }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    tagline: '',
    description: '',
    coverImage: '/assets/campaign/HOMEPAGE_2.webp',
    status: 'ACTIVE',
    featured: true,
    season: 'FESTIVE 2026'
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && id) {
      apiGetCollectionBySlug(id)
        .then((data) => {
          if (data) setFormData({ ...data });
        })
        .catch((err) => {
          console.warn('[COLLECTION FORM] Fetch failed:', err);
        });
    }
  }, [id, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let result;
      if (mode === 'create') {
        result = await apiCreateCollection(formData);
        setToastMessage(`COLLECTION CREATED IN DATABASE (ID: ${result.id})`);
      } else {
        result = await apiUpdateCollection(formData.id, formData);
        setToastMessage(`COLLECTION UPDATED IN DATABASE (ID: ${result.id})`);
      }
      if (result) {
        setFormData((prev) => ({ ...prev, ...result }));
      }
      setTimeout(() => {
        navigate('/admin/collections');
      }, 900);
    } catch (err) {
      setToastMessage(`SAVE FAILED: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this collection from database?')) {
      try {
        await apiDeleteCollection(formData.id);
        navigate('/admin/collections');
      } catch (err) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fadeIn font-sans">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-lime-400 text-neutral-900 px-6 py-3 font-extrabold text-xs tracking-widest uppercase shadow-xl flex items-center gap-2 border border-lime-500">
          <CheckCircle2 className="w-5 h-5 text-neutral-900" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-1">
          <Link to="/admin/collections" className="text-[10px] font-mono text-neutral-600 hover:text-neutral-900 flex items-center gap-1 uppercase font-bold">
            <ArrowLeft className="w-3 h-3" /> BACK TO COLLECTIONS
          </Link>
          <h2 className="text-2xl sm:text-4xl font-black tracking-wider text-neutral-900 uppercase">
            {mode === 'create' ? 'CREATE COLLECTION' : `EDIT: ${formData.name}`}
          </h2>
          {formData.id && (
            <span className="text-[10px] font-mono text-neutral-700 font-bold block">
              COLLECTION ID: {formData.id}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="btn-venm-primary px-6 py-2.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-white" />
            <span>{isSaving ? 'SAVING...' : mode === 'create' ? 'PUBLISH COLLECTION' : 'SAVE CHANGES'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
          <h3 className="text-xs font-mono text-neutral-800 tracking-[0.25em] uppercase border-b border-neutral-200 pb-3 font-bold">
            COLLECTION DETAILS
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">COLLECTION NAME *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    name: val,
                    slug: mode === 'create' ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-') : prev.slug
                  }));
                }}
                placeholder="e.g. NAVRATRI EDIT"
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">SLUG *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. navratri"
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">TAGLINE</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. GUJARATI ETHOS × CYBER STREETWEAR"
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">SEASON / BADGE</label>
              <input
                type="text"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                placeholder="e.g. FESTIVE 2026 or COMING SOON"
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">COVER IMAGE PATH</label>
            <input
              type="text"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              placeholder="/assets/campaign/HOMEPAGE_2.webp"
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">DESCRIPTION</label>
            <textarea
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Collection concept, design philosophy, and seasonal mood..."
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-sans resize-none"
            />
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-neutral-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.status === 'ACTIVE'}
                onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'ACTIVE' : 'COMING_SOON' })}
                className="accent-neutral-900 w-5 h-5"
              />
              <span className="text-xs font-mono font-bold text-neutral-900 uppercase">COLLECTION IS ACTIVE</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="accent-neutral-900 w-5 h-5"
              />
              <span className="text-xs font-mono font-bold text-neutral-900 uppercase">FEATURE ON HOMEPAGE</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          {mode === 'edit' ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs font-mono text-red-600 hover:text-red-700 font-bold flex items-center gap-1 uppercase border border-red-300 px-4 py-2 bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> DELETE COLLECTION
            </button>
          ) : <div />}

          <button
            type="submit"
            disabled={isSaving}
            className="btn-venm-primary px-8 py-3 text-xs font-bold tracking-widest uppercase flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-white" />
            <span>{isSaving ? 'SAVING...' : mode === 'create' ? 'PUBLISH COLLECTION' : 'SAVE CHANGES'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCollectionForm;
