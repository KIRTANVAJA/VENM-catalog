import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  apiGetCollectionBySlug,
  apiCreateCollection,
  apiUpdateCollection,
  apiDeleteCollection,
  apiUploadImageToCloudinary
} from '../../services/api';
import { normalizeImagePath } from '../../utils/imageUtils';
import { BRAND_ASSETS } from '../../config/assets';
import {
  Save,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  X,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

const AdminCollectionForm = ({ mode = 'create' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showManualInput, setShowManualInput] = useState(true);

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

  const handleProcessFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(`"${file.name}" is not an image file. Supported formats: JPG, PNG, WEBP, AVIF, GIF.`);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 15MB.`);
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(file.name);

    try {
      const uploadRes = await apiUploadImageToCloudinary(file, 'venm-catalog/collections', (percent) => {
        setUploadProgress(percent);
      });

      const finalUrl = uploadRes?.secure_url || uploadRes?.url;
      if (finalUrl) {
        setFormData((prev) => ({
          ...prev,
          coverImage: finalUrl
        }));
        setToastMessage(finalUrl.startsWith('http') ? 'COVER PHOTO UPLOADED TO CLOUDINARY' : 'COVER PHOTO SAVED TO LOCAL ASSETS');
      } else {
        throw new Error(uploadRes?.message || 'Server did not return a valid image URL.');
      }
    } catch (err) {
      console.warn('[COLLECTION UPLOAD] Upload error:', err.message);
      setUploadError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const cleanedData = {
        ...formData,
        coverImage: normalizeImagePath(formData.coverImage)
      };

      let result;
      if (mode === 'create') {
        result = await apiCreateCollection(cleanedData);
        setToastMessage(`COLLECTION CREATED IN DATABASE (ID: ${result.id})`);
      } else {
        result = await apiUpdateCollection(cleanedData.id || id, cleanedData);
        setToastMessage(`COLLECTION UPDATED IN DATABASE (ID: ${result.id})`);
      }
      if (result) {
        setFormData((prev) => ({ ...prev, ...result }));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('venm_collections_updated', { detail: result }));
        }
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
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 font-extrabold text-xs tracking-widest uppercase shadow-xl flex items-center gap-2 border ${
          toastMessage.startsWith('SAVE FAILED') ? 'bg-red-600 text-white border-red-700' : 'bg-lime-400 text-neutral-900 border-lime-500'
        }`}>
          {toastMessage.startsWith('SAVE FAILED') ? <AlertTriangle className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-neutral-900" />}
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

          {/* Cover Image Drag & Drop Uploader and Live Preview */}
          <div className="space-y-4 p-5 bg-neutral-50 border border-neutral-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
              <div>
                <label className="text-xs font-black text-neutral-900 tracking-widest uppercase flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-neutral-900" />
                  <span>COLLECTION COVER IMAGE *</span>
                </label>
                <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                  Drag & drop an image, select from your device, or edit the direct web path.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="text-[10px] font-mono text-neutral-600 hover:text-black uppercase underline font-bold"
                >
                  {showManualInput ? 'HIDE URL INPUT' : 'EDIT PATH / URL'}
                </button>
              </div>
            </div>

            {/* Upload Error Banner */}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-mono flex items-center justify-between gap-2 animate-fadeIn">
                <span className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{uploadError}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="text-red-700 hover:text-black font-bold uppercase text-[10px] underline shrink-0"
                >
                  DISMISS
                </button>
              </div>
            )}

            {/* Uploading Progress Banner */}
            {isUploading && (
              <div className="p-4 bg-neutral-900 text-white border border-neutral-800 space-y-2.5 font-mono animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-lime-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-lime-400" />
                    <span>UPLOADING COVER PHOTO TO CLOUDINARY...</span>
                  </span>
                  <span className="text-lime-400 font-bold">{uploadProgress > 0 ? `${uploadProgress}%` : 'CONNECTING...'}</span>
                </div>
                {uploadingFileName && (
                  <p className="text-[10px] text-neutral-400 truncate">
                    File: {uploadingFileName}
                  </p>
                )}
                <div className="w-full bg-neutral-800 h-2 overflow-hidden border border-neutral-700">
                  <div
                    className="h-full bg-lime-400 transition-all duration-300"
                    style={{ width: `${Math.max(uploadProgress, 12)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Interactive Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isUploading) setIsDragOver(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isUploading) setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(false);
                if (isUploading) return;
                const file = e.dataTransfer?.files?.[0];
                if (file) handleProcessFile(file);
              }}
              onClick={() => {
                if (!isUploading) fileInputRef.current?.click();
              }}
              className={`p-6 sm:p-8 border-2 border-dashed text-center cursor-pointer transition-all duration-200 select-none ${
                isDragOver
                  ? 'border-lime-500 bg-lime-400/10 scale-[1.01] shadow-md'
                  : 'border-neutral-300 bg-white hover:border-neutral-900 hover:bg-neutral-50/80'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessFile(file);
                }}
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isDragOver ? 'bg-lime-400 text-neutral-900' : 'bg-neutral-100 text-neutral-700'
                }`}>
                  <Upload className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
                    {isDragOver ? 'DROP COVER PHOTO HERE TO UPLOAD' : 'DRAG & DROP IMAGE HERE OR CLICK TO BROWSE'}
                  </p>
                  <p className="text-[11px] font-mono text-neutral-500">
                    Supports JPG, PNG, WebP, AVIF up to 15MB • Uploads directly to Cloudinary CDN
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-1 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-lime-400" />
                  <span>CHOOSE FROM DEVICE</span>
                </button>
              </div>
            </div>

            {/* Live Visual Preview & Current Selection Banner */}
            <div className="p-4 bg-white border border-neutral-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-800">
                    ACTIVE COVER PREVIEW
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                    formData.coverImage?.startsWith('http')
                      ? 'bg-lime-100 text-lime-900 border border-lime-300'
                      : formData.coverImage?.startsWith('/assets')
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {formData.coverImage?.startsWith('http')
                      ? 'REMOTE CDN URL'
                      : formData.coverImage?.startsWith('/assets')
                      ? 'LOCAL ASSET PATH'
                      : 'CUSTOM PATH'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-[10px] font-mono text-neutral-800 hover:text-black uppercase font-bold flex items-center gap-1 underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>CHANGE IMAGE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, coverImage: BRAND_ASSETS.FALLBACK_CAMPAIGN });
                      setToastMessage('RESET TO DEFAULT FALLBACK');
                    }}
                    className="text-[10px] font-mono text-neutral-500 hover:text-red-600 uppercase font-bold flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    <span>RESET</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-4 relative aspect-[16/9] bg-neutral-900 overflow-hidden border border-neutral-200 shadow-sm group">
                  <img
                    src={normalizeImagePath(formData.coverImage)}
                    alt="Cover Preview"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = BRAND_ASSETS.FALLBACK_CAMPAIGN;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
                    <span className="text-[9px] font-mono tracking-widest text-white/90 truncate uppercase font-bold">
                      {formData.name || 'COLLECTION BANNER'}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-2 text-xs">
                  {showManualInput ? (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-neutral-600 uppercase tracking-wider block">
                        DIRECT IMAGE URL / LOCAL PATH:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={formData.coverImage}
                          onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                          onBlur={(e) => {
                            const cleaned = normalizeImagePath(e.target.value, formData.coverImage);
                            setFormData({ ...formData, coverImage: cleaned });
                          }}
                          placeholder="/assets/campaign/... or https://res.cloudinary.com/..."
                          className="flex-1 bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-3 py-2 text-xs text-neutral-900 outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cleaned = normalizeImagePath(formData.coverImage);
                            setFormData({ ...formData, coverImage: cleaned });
                            setToastMessage('PATH CLEANED & NORMALIZED');
                          }}
                          className="px-3 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[10px] font-mono font-bold uppercase whitespace-nowrap"
                        >
                          FORMAT
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase block">SAVED PATH:</span>
                      <p className="text-[11px] font-mono text-neutral-800 break-all bg-neutral-50 p-2 border border-neutral-200">
                        {formData.coverImage}
                      </p>
                    </div>
                  )}

                  <p className="text-[10px] font-mono text-neutral-500">
                    This exact image is displayed on the collection card, collection detail header, and public catalog.
                  </p>
                </div>
              </div>
            </div>
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
