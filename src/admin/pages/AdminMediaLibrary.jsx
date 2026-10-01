import React, { useState } from 'react';
import { getAdminMedia, addAdminMedia } from '../../data/adminMock';
import { Upload, Search, Trash2, Eye, CheckCircle2, X } from 'lucide-react';
import { BRAND_ASSETS } from '../../config/assets';

const AdminMediaLibrary = () => {
  const [mediaItems, setMediaItems] = useState(getAdminMedia());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingState, setUploadingState] = useState('idle');

  const [previewMedia, setPreviewMedia] = useState(null);

  const filteredMedia = mediaItems.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSimulatedUpload = (filename = 'new_campaign_look.webp') => {
    setUploadingState('uploading');
    setTimeout(() => {
      const newMediaObj = {
        name: filename,
        category: categoryFilter !== 'ALL' ? categoryFilter : 'Products',
        type: 'image/webp',
        size: '240 KB',
        url: BRAND_ASSETS.FALLBACK_CAMPAIGN,
        usedBy: 'Catalog Asset'
      };
      const updated = addAdminMedia(newMediaObj);
      setMediaItems([...updated]);
      setUploadingState('success');
      setTimeout(() => {
        setUploadingState('idle');
        setUploadModalOpen(false);
      }, 1200);
    }, 1000);
  };

  const handleDeleteMedia = (id) => {
    if (window.confirm('Remove media asset from registry?')) {
      setMediaItems(mediaItems.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fadeIn font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-800 font-bold uppercase">
            MEDIA ASSET REGISTRY // MEDIA LIBRARY
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-wider text-neutral-900 uppercase">
            BRAND MEDIA ASSETS ({filteredMedia.length})
          </h2>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="btn-venm-neon px-6 py-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 uppercase self-start sm:self-auto"
        >
          <Upload className="w-4 h-4 text-neutral-900" />
          <span>UPLOAD MEDIA</span>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-300 focus:border-neutral-900 text-xs text-neutral-900 placeholder-neutral-400 outline-none font-mono"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['ALL', 'Products', 'Collections', 'Homepage', 'Campaigns', 'Brand'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-all font-bold ${
                categoryFilter === cat
                  ? 'bg-lime-400 text-neutral-900 border border-lime-500'
                  : 'bg-neutral-100 text-neutral-700 hover:text-neutral-900 border border-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredMedia.map((media) => (
          <div key={media.id} className="bg-white border border-neutral-200 shadow-sm overflow-hidden group space-y-2 p-3">
            <div className="relative aspect-square bg-neutral-100 overflow-hidden border border-neutral-200">
              <img
                src={media.url}
                alt={media.name}
                onError={(e) => { e.target.src = BRAND_ASSETS.FALLBACK_PRODUCT; }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => setPreviewMedia(media)}
                  className="p-2 bg-white text-neutral-900 hover:bg-lime-400"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteMedia(media.id)}
                  className="p-2 bg-white text-red-600 hover:bg-red-100"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-neutral-800 font-bold tracking-widest uppercase block">
                {media.category} • {media.size}
              </span>
              <h4 className="text-xs font-extrabold text-neutral-900 truncate font-mono">{media.name}</h4>
              <p className="text-[11px] font-mono text-neutral-600 truncate font-medium">Used: {media.usedBy}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Simulation Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white p-6 sm:p-8 max-w-lg w-full border border-neutral-300 shadow-xl space-y-6 relative">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-neutral-200 pb-3">
              <span className="text-[10px] font-mono text-neutral-800 font-bold tracking-widest uppercase">
                MEDIA UPLOADER
              </span>
              <h3 className="text-xl font-black text-neutral-900 uppercase">UPLOAD ASSET</h3>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleSimulatedUpload('dragged_asset.png');
              }}
              className={`p-10 border-2 border-dashed text-center space-y-3 transition-colors ${
                dragOver ? 'border-lime-500 bg-lime-400/10' : 'border-neutral-300 bg-neutral-50'
              }`}
            >
              <Upload className="w-10 h-10 text-neutral-900 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-900 uppercase">DRAG & DROP IMAGE HERE</p>
                <p className="text-[10px] font-mono text-neutral-600 font-medium">SUPPORTS WEBP, PNG, JPG, AVIF (MAX 10MB)</p>
              </div>
              <button
                type="button"
                onClick={() => handleSimulatedUpload('uploaded_asset.webp')}
                className="btn-venm-outline px-4 py-2 text-xs font-mono font-bold uppercase"
              >
                BROWSE FILES
              </button>
            </div>

            {uploadingState === 'uploading' && (
              <div className="p-4 bg-lime-400/20 border border-lime-500 text-neutral-900 text-xs font-mono font-bold text-center animate-pulse">
                UPLOADING MEDIA ASSET TO REGISTRY...
              </div>
            )}

            {uploadingState === 'success' && (
              <div className="p-4 bg-lime-400 text-neutral-900 text-xs font-mono font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> ASSET UPLOADED SUCCESSFULLY!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white p-6 max-w-xl w-full border border-neutral-300 shadow-xl space-y-4 relative">
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-neutral-900 uppercase font-mono border-b border-neutral-200 pb-2">{previewMedia.name}</h3>
            <img
              src={previewMedia.url}
              alt={previewMedia.name}
              onError={(e) => { e.target.src = BRAND_ASSETS.FALLBACK_PRODUCT; }}
              className="w-full max-h-96 object-contain bg-neutral-100 border border-neutral-200"
            />
            <div className="text-xs font-mono text-neutral-700 font-bold flex justify-between">
              <span>Category: {previewMedia.category}</span>
              <span>Size: {previewMedia.size}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMediaLibrary;
