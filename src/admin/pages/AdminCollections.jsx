import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGetCollections, apiDeleteCollection, apiUpdateCollection } from '../../services/api';
import { BRAND_ASSETS } from '../../config/assets';
import { Plus, Edit, Trash2, Eye, Sparkles, Layers } from 'lucide-react';

const AdminCollections = () => {
  const [collections, setCollections] = useState([]);

  const loadCollections = async () => {
    try {
      const data = await apiGetCollections();
      if (Array.isArray(data)) {
        setCollections(data);
      }
    } catch (err) {
      console.warn('[COLLECTIONS ADMIN] Load failed:', err);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleToggleActive = async (col) => {
    const newStatus = !col.isActive;
    setCollections(collections.map((c) => (c.id === col.id ? { ...c, isActive: newStatus } : c)));
    try {
      await apiUpdateCollection(col.id, { isActive: newStatus });
    } catch (err) {}
  };

  const handleDelete = async (colId) => {
    if (window.confirm("Are you sure you want to delete this collection?")) {
      try {
        await apiDeleteCollection(colId);
      } catch (err) {}
      setCollections(collections.filter((c) => c.id !== colId));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-800 font-bold uppercase">
            CATALOG MANAGEMENT // COLLECTIONS
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-wider text-neutral-900 uppercase">
            COLLECTION ARCHIVE ({collections.length})
          </h2>
        </div>
        <Link
          to="/admin/collections/new"
          className="btn-venm-primary px-6 py-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 uppercase self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>CREATE COLLECTION</span>
        </Link>
      </div>

      {/* Grid of Collections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((col) => (
          <div key={col.id} className="bg-white border border-neutral-200 overflow-hidden flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Cover Photo */}
              <div className="relative h-48 bg-neutral-100 overflow-hidden group border-b border-neutral-200">
                <img
                  src={col.coverImage || BRAND_ASSETS.FALLBACK_CAMPAIGN}
                  alt={col.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { e.target.src = BRAND_ASSETS.FALLBACK_CAMPAIGN; }}
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[9px] font-mono tracking-widest uppercase font-bold border ${
                    col.isActive ? 'bg-neutral-900 text-lime-400 border-lime-400/50' : 'bg-neutral-200 text-neutral-800 border-neutral-300'
                  }`}>
                    {col.isActive ? 'ACTIVE EDIT' : 'COMING SOON'}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="px-5 space-y-1.5">
                <span className="text-[10px] font-mono text-neutral-800 font-bold tracking-widest uppercase block">
                  {col.tagline}
                </span>
                <h3 className="text-xl font-black text-neutral-900 uppercase tracking-wider">{col.name}</h3>
                <p className="text-xs text-neutral-700 line-clamp-2 leading-relaxed font-sans font-medium">{col.description}</p>
              </div>
            </div>

            {/* Footer & Actions */}
            <div className="px-5 pb-5 pt-3 border-t border-neutral-200 flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-800 text-[10px] font-bold">{col.productCount || 0} PIECES</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(col)}
                  className={`px-2.5 py-1 text-[10px] border transition-colors uppercase font-bold ${
                    col.isActive ? 'bg-neutral-900 text-lime-400 border-neutral-900' : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                  }`}
                >
                  {col.isActive ? 'DISABLE' : 'ENABLE'}
                </button>
                <Link
                  to={`/admin/collections/${col.id}/edit`}
                  className="p-1.5 bg-neutral-100 hover:bg-neutral-900 text-neutral-900 hover:text-white transition-colors border border-neutral-200"
                  title="Edit Collection"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(col.id)}
                  className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors border border-red-200"
                  title="Delete Collection"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCollections;
