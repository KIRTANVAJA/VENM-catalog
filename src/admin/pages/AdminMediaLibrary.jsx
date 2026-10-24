import React, { useState, useEffect, useRef } from 'react';
import { getAdminMedia, addAdminMedia } from '../../data/adminMock';
import {
  apiGetMedia,
  apiCreateMedia,
  apiDeleteMedia,
  apiGetUploadSignature,
  apiDirectCloudinaryUpload
} from '../../services/api';
import { Upload, Search, Trash2, Eye, CheckCircle2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { BRAND_ASSETS } from '../../config/assets';

const AdminMediaLibrary = () => {
  const [mediaItems, setMediaItems] = useState(getAdminMedia());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingState, setUploadingState] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [previewMedia, setPreviewMedia] = useState(null);
  const fileInputRef = useRef(null);

  const loadMedia = async () => {
    try {
      const data = await apiGetMedia();
      if (Array.isArray(data) && data.length > 0) {
        setMediaItems(data);
      }
    } catch (err) {
      console.warn('[MEDIA] Fetch failed, using local mock:', err);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const filteredMedia = mediaItems.filter((m) => {
    const matchesSearch = (m.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploadingState('uploading');
    setUploadError(null);
    setUploadProgress(0);

    try {
      // 1. Get signed upload credentials
      let sigData;
      try {
        sigData = await apiGetUploadSignature('venm-catalog/media');
      } catch (e) {
        sigData = { configured: false };
      }

      let persistentUrl = BRAND_ASSETS.FALLBACK_CAMPAIGN;
      let assetSize = `${Math.round(file.size / 1024)} KB`;

      if (sigData && sigData.configured) {
        // Direct Cloudinary upload
        const result = await apiDirectCloudinaryUpload(file, sigData, (p) => {
          setUploadProgress(p);
        });
        persistentUrl = result.secure_url;
      }

      const newMediaObj = {
        name: file.name,
        category: categoryFilter !== 'ALL' ? categoryFilter : 'Products',
        type: file.type || 'image/webp',
        size: assetSize,
        url: persistentUrl,
        usedBy: 'Catalog Asset'
      };

      try {
        const created = await apiCreateMedia(newMediaObj);
        setMediaItems((prev) => [created, ...prev]);
      } catch (err) {
        const updated = addAdminMedia(newMediaObj);
        setMediaItems([...updated]);
      }

      setUploadingState('success');
      setTimeout(() => {
        setUploadingState('idle');
        setUploadModalOpen(false);
      }, 1200);

    } catch (err) {
      console.error('[MEDIA UPLOAD] Failed:', err);
      setUploadError(err.message || 'Upload failed');
      setUploadingState('error');
    }
  };

  const handleSimulatedUpload = async (filename = 'new_campaign_look.webp') => {
    setUploadingState('uploading');
    const newMediaObj = {
      name: filename,
      category: categoryFilter !== 'ALL' ? categoryFilter : 'Products',
      type: 'image/webp',
      size: '240 KB',
      url: BRAND_ASSETS.FALLBACK_CAMPAIGN,
      usedBy: 'Catalog Asset'
    };

    try {
      const created = await apiCreateMedia(newMediaObj);
      setMediaItems((prev) => [created, ...prev]);
    } catch (err) {
      const updated = addAdminMedia(newMediaObj);
      setMediaItems([...updated]);
    }

    setUploadingState('success');
    setTimeout(() => {
      setUploadingState('idle');
      setUploadModalOpen(false);
    }, 1200);
  };

  const handleDeleteMedia = async (id) => {
    if (window.confirm('Remove media asset from registry?')) {
      try {
        await apiDeleteMedia(id);
      } catch (err) {}
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
          onClick={() => {
            setUploadError(null);
            setUploadingState('idle');
            setUploadModalOpen(true);
          }}
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

      {/* Upload Modal */}
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
                DIRECT STORAGE UPLOADER
              </span>
              <h3 className="text-xl font-black text-neutral-900 uppercase">UPLOAD BRAND ASSET</h3>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-mono flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer?.files?.[0];
                if (file) {
                  handleFileUpload(file);
                } else {
                  handleSimulatedUpload('dragged_asset.png');
                }
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

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-venm-primary px-5 py-2.5 text-xs font-mono font-bold uppercase shadow-sm"
                >
                  BROWSE FILES
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </div>
            </div>

            {uploadingState === 'uploading' && (
              <div className="p-4 bg-neutral-900 text-white border border-neutral-800 space-y-2 font-mono">
                <div className="flex items-center justify-between text-xs text-lime-400 font-bold">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>UPLOADING TO STORAGE DIRECTLY...</span>
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 overflow-hidden border border-neutral-700">
                  <div
                    className="bg-lime-400 h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadingState === 'success' && (
              <div className="p-4 bg-lime-400 text-neutral-900 text-xs font-mono font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> ASSET UPLOADED TO REGISTRY!
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
