import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  apiGetProductBySlug,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
  apiUploadImageToCloudinary,
  apiGetCollections
} from '../../services/api';
import { getAdminProducts } from '../../data/adminMock';
import {
  Save,
  ArrowLeft,
  Trash2,
  Eye,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Crop,
  Upload,
  ArrowLeftSquare,
  ArrowRightSquare,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';
import ImageAdjusterModal from '../components/ImageAdjusterModal';
import { sanitizeImageUrl, sanitizeImageArray } from '../../lib/pathSanitizer';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB max per file

const AdminProductForm = ({ mode = 'create' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    gender: '', // 'MEN' | 'WOMEN' | 'UNISEX'
    collectionId: '',
    collectionSlug: 'diwali',
    collectionName: 'DIWALI EDIT',
    category: 'Outerwear',
    description: '',
    details: ['100% Cotton Loopback Fleece', 'Custom VENM Anodized Hardware'],
    images: [],
    isFeatured: true,
    isNavratriEdit: true,
    sizes: ['Custom'],
    availability: 'REQUESTABLE',
    tags: ['NavratriEdit', 'Outerwear'],
    garmentCare: 'Dry clean only.'
  });

  const [availableCollections, setAvailableCollections] = useState([]);

  const [toastMessage, setToastMessage] = useState(null);
  const [isErrorToast, setIsErrorToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newDetailText, setNewDetailText] = useState('');

  // Upload Management State
  const [uploadQueue, setUploadQueue] = useState({});
  const [uploadErrors, setUploadErrors] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Image Adjuster Modal State
  const [adjusterImage, setAdjusterImage] = useState(null);
  const [adjusterIndex, setAdjusterIndex] = useState(null);

  const isUploading = Object.values(uploadQueue).some((item) => item.status === 'uploading');
  const activeUploadCount = Object.values(uploadQueue).filter((item) => item.status === 'uploading').length;

  const handleAdjusterSave = (adjustedUrl) => {
    if (adjusterIndex !== null && adjusterIndex >= 0) {
      const updated = [...formData.images];
      updated[adjusterIndex] = adjustedUrl;
      setFormData({ ...formData, images: updated });
    } else {
      setFormData({ ...formData, images: [...formData.images, adjustedUrl] });
    }
  };

  useEffect(() => {
    apiGetCollections()
      .then((cols) => {
        if (Array.isArray(cols) && cols.length > 0) {
          setAvailableCollections(cols);
        }
      })
      .catch((err) => console.warn('[PRODUCT FORM] Failed to load collections:', err));
  }, []);

  useEffect(() => {
    if (mode === 'edit' && id) {
      apiGetProductBySlug(id)
        .then((data) => {
          if (data) {
            const rawImages = Array.isArray(data.images)
              ? data.images
              : (typeof data.images === 'string' && data.images.startsWith('[') ? JSON.parse(data.images) : (data.images ? [data.images] : []));

            const normalizedImages = rawImages
              .map((img) => (typeof img === 'string' ? img : (img?.secure_url || img?.url || '')))
              .filter(Boolean);

            setFormData({
              ...data,
              gender: data.gender || '',
              collectionId: data.collectionId || '',
              collectionSlug: data.collectionSlug || '',
              collectionName: data.collectionName || '',
              details: Array.isArray(data.details) ? data.details : (typeof data.details === 'string' && data.details.startsWith('[') ? JSON.parse(data.details) : []),
              images: normalizedImages,
              sizes: Array.isArray(data.sizes) ? data.sizes : (typeof data.sizes === 'string' && data.sizes.startsWith('[') ? JSON.parse(data.sizes) : []),
              tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' && data.tags.startsWith('[') ? JSON.parse(data.tags) : [])
            });

            // Detect any legacy Base64 images in product record
            const legacyBase64Images = normalizedImages.filter(img => typeof img === 'string' && img.startsWith('data:image/'));
            if (legacyBase64Images.length > 0) {
              setUploadErrors((prev) => [
                ...prev,
                `NOTICE: This product contains ${legacyBase64Images.length} legacy embedded image(s). Please upload new Cloudinary photos to replace them before saving.`
              ]);
            }
          }
        })
        .catch(() => {
          const fallback = getAdminProducts().find((p) => p.id === id || p.slug === id);
          if (fallback) setFormData({ ...fallback });
        });
    }
  }, [id, mode]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: mode === 'create' ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-') : prev.slug
    }));
  };

  const handleAddDetail = () => {
    if (newDetailText.trim()) {
      setFormData((prev) => ({
        ...prev,
        details: [...(prev.details || []), newDetailText.trim()]
      }));
      setNewDetailText('');
    }
  };

  const handleRemoveDetail = (index) => {
    setFormData((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  const handleToggleSize = (size) => {
    const currentSizes = formData.sizes || [];
    const updated = currentSizes.includes(size)
      ? currentSizes.filter((s) => s !== size)
      : [...currentSizes, size];
    setFormData({ ...formData, sizes: updated });
  };

  /**
   * DIRECT CLOUDINARY MULTI-IMAGE UPLOADER
   * Validates file format & file size, generates secure backend upload signatures,
   * uploads directly to Cloudinary without routing through Vercel serverless function,
   * tracks live progress, and prevents Base64 explosion.
   */
  const uploadSingleFile = async (fileId, file) => {
    if (!file) return null;

    setUploadQueue((prev) => (prev[fileId] ? {
      ...prev,
      [fileId]: { ...prev[fileId], status: 'uploading', progress: 0, error: null }
    } : prev));

    try {
      // Direct browser-to-Cloudinary upload with fresh server-signed signature & timestamp
      const uploadRes = await apiUploadImageToCloudinary(file, 'venm-catalog/products', (percent) => {
        setUploadQueue((prev) => (prev[fileId] ? {
          ...prev,
          [fileId]: { ...prev[fileId], progress: percent }
        } : prev));
      });

      if (uploadRes?.secure_url) {
        setUploadQueue((prev) => (prev[fileId] ? {
          ...prev,
          [fileId]: { ...prev[fileId], progress: 100, status: 'completed' }
        } : prev));

        // Append persistent HTTPS URL to product images
        setFormData((prev) => ({
          ...prev,
          images: [...(prev.images || []), uploadRes.secure_url]
        }));

        // Clean up finished item from queue after a brief moment
        setTimeout(() => {
          setUploadQueue((prev) => {
            const next = { ...prev };
            delete next[fileId];
            return next;
          });
        }, 2500);

        return uploadRes.secure_url;
      } else {
        throw new Error('Cloudinary did not return a secure URL.');
      }
    } catch (err) {
      console.error(`[IMAGE UPLOAD] Error uploading ${file.name}:`, err);
      setUploadQueue((prev) => (prev[fileId] ? {
        ...prev,
        [fileId]: { ...prev[fileId], status: 'error', error: err.message || 'Upload failed' }
      } : prev));
      setUploadErrors((prev) => [...prev, `Upload failed for "${file.name}": ${err.message}`]);
      return null;
    }
  };

  const handleDismissQueueItem = (fileId) => {
    setUploadQueue((prev) => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
  };

  const handleFilesSelected = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const validationErrors = [];
    const validFiles = [];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        validationErrors.push(`"${file.name}" has unsupported format (${file.type || 'unknown'}). Allowed formats: JPG, PNG, WebP, GIF, AVIF.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        validationErrors.push(`"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB, exceeding the 10MB maximum limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validationErrors.length > 0) {
      setUploadErrors((prev) => [...prev, ...validationErrors]);
    }

    if (validFiles.length === 0) return;

    // Reset file input value so same files can be re-selected if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Process valid files directly to Cloudinary: each file gets its own queue item & fresh signature
    for (const file of validFiles) {
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      setUploadQueue((prev) => ({
        ...prev,
        [fileId]: {
          id: fileId,
          file, // Retain original File for retries
          name: file.name,
          size: (file.size / 1024).toFixed(0) + ' KB',
          progress: 0,
          status: 'uploading',
          error: null
        }
      }));

      // Upload with fresh signature
      await uploadSingleFile(fileId, file);
    }
  };

  const handleMoveImage = (idx, direction) => {
    const currentImages = [...(formData.images || [])];
    if (direction === 'left' && idx > 0) {
      const temp = currentImages[idx];
      currentImages[idx] = currentImages[idx - 1];
      currentImages[idx - 1] = temp;
      setFormData({ ...formData, images: currentImages });
    } else if (direction === 'right' && idx < currentImages.length - 1) {
      const temp = currentImages[idx];
      currentImages[idx] = currentImages[idx + 1];
      currentImages[idx + 1] = temp;
      setFormData({ ...formData, images: currentImages });
    }
  };

  const handleSetCover = (idx) => {
    if (idx === 0) return;
    const currentImages = [...(formData.images || [])];
    const [selected] = currentImages.splice(idx, 1);
    currentImages.unshift(selected);
    setFormData({ ...formData, images: currentImages });
  };

  const handleRemoveImage = (idx) => {
    const currentImages = formData.images.filter((_, i) => i !== idx);
    setFormData({ ...formData, images: currentImages });
  };

  const handleSubmit = async (e, statusOverride = null) => {
    if (e) e.preventDefault();

    const hasActiveUploads = Object.values(uploadQueue).some((item) => item.status === 'uploading');
    const hasFailedUploads = Object.values(uploadQueue).some((item) => item.status === 'error');

    if (hasActiveUploads) {
      setIsErrorToast(true);
      setToastMessage('UPLOADS IN PROGRESS: PLEASE WAIT FOR IMAGES TO FINISH');
      return;
    }

    if (hasFailedUploads) {
      setIsErrorToast(true);
      setToastMessage('SOME UPLOADS FAILED: RETRY OR DISMISS FAILED IMAGES BEFORE SAVING');
      return;
    }

    // STRICT VALIDATION: Target Audience / Gender is required
    const selectedGender = (formData.gender || '').trim().toUpperCase();
    if (!selectedGender || !['MEN', 'WOMEN', 'UNISEX'].includes(selectedGender)) {
      setIsErrorToast(true);
      setToastMessage('TARGET AUDIENCE IS REQUIRED: Please explicitly select Men, Women, or Unisex.');
      return;
    }

    // NORMALIZE & VALIDATE IMAGES: Strictly ensure only clean URLs (Cloudinary HTTPS or /assets/) are submitted
    const cleanImages = (formData.images || [])
      .map((img) => (typeof img === 'string' ? img.trim() : (img?.secure_url || img?.url || '').trim()))
      .filter(Boolean);

    // Block any Base64 or local blob: data from ever reaching the server payload
    const invalidImage = cleanImages.find(
      (img) => img.startsWith('data:image/') || img.startsWith('blob:') || (img.length > 2000 && !img.startsWith('http://') && !img.startsWith('https://') && !img.startsWith('/'))
    );

    if (invalidImage) {
      setIsErrorToast(true);
      setToastMessage('SAVE BLOCKED: DIRECT BASE64 / LOCAL BLOB IMAGES ARE NOT PERMITTED. PLEASE UPLOAD TO CLOUDINARY OR REMOVE THEM.');
      return;
    }

    if (isSaving) return;

    setIsSaving(true);
    const finalData = {
      ...formData,
      gender: selectedGender,
      images: cleanImages,
      availability: statusOverride || formData.availability
    };

    try {
      let resultProduct;
      if (mode === 'create') {
        resultProduct = await apiCreateProduct(finalData);
        setIsErrorToast(false);
        setToastMessage('PRODUCT CREATED IN DATABASE');
      } else {
        resultProduct = await apiUpdateProduct(formData.id || id, finalData);
        setIsErrorToast(false);
        setToastMessage('PRODUCT UPDATED IN DATABASE');
      }

      if (resultProduct) {
        setFormData((prev) => ({ ...prev, ...resultProduct }));
      }

      setTimeout(() => {
        navigate('/admin/products');
      }, 1000);
    } catch (err) {
      setIsErrorToast(true);
      setToastMessage('SAVE FAILED: ' + (err.message || 'DATABASE ERROR'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiDeleteProduct(formData.id || id);
    } catch (err) {}
    navigate('/admin/products');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fadeIn font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 font-extrabold text-xs tracking-widest uppercase shadow-2xl flex items-center gap-2 border ${
          isErrorToast ? 'bg-red-600 text-white border-red-700' : 'bg-black text-white border-neutral-800'
        }`}>
          {isErrorToast ? <AlertTriangle className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-lime-400" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-1">
          <Link to="/admin/products" className="text-[10px] font-mono text-neutral-500 hover:text-black flex items-center gap-1 uppercase">
            <ArrowLeft className="w-3 h-3" /> BACK TO PRODUCTS
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-wider text-neutral-900 uppercase">
              {mode === 'create' ? 'ADD NEW PRODUCT' : `EDIT: ${formData.name}`}
            </h2>
            <span className="px-2.5 py-1 bg-neutral-100 text-neutral-800 border border-neutral-300 font-mono text-xs font-bold uppercase rounded-none">
              PRODUCT ID: {formData.id || id || 'AUTO-GENERATED'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mode === 'edit' && (
            <Link
              to={`/product/${formData.slug}`}
              target="_blank"
              className="btn-venm-secondary px-4 py-2 text-xs font-mono flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>PREVIEW</span>
            </Link>
          )}

          <button
            onClick={(e) => handleSubmit(e, 'DRAFT')}
            disabled={isSaving || isUploading}
            className="btn-venm-secondary px-4 py-2.5 text-xs font-bold tracking-widest uppercase disabled:opacity-50"
          >
            {isUploading ? `UPLOADING (${activeUploadCount})...` : (isSaving ? 'SAVING...' : 'SAVE DRAFT')}
          </button>

          <button
            onClick={(e) => handleSubmit(e)}
            disabled={isSaving || isUploading}
            className="btn-venm-primary px-6 py-2.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Save className="w-4 h-4 text-white" />
            )}
            <span>
              {isUploading
                ? `UPLOADING (${activeUploadCount} REMAINING)...`
                : (isSaving ? 'SAVING TO DB...' : (mode === 'create' ? 'PUBLISH PRODUCT' : 'SAVE CHANGES'))}
            </span>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Unclassified Legacy Product Banner */}
        {formData.gender === 'UNCLASSIFIED' && (
          <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="space-y-0.5">
              <p className="font-bold uppercase tracking-wider">PRODUCT AUDIENCE UNCLASSIFIED (LEGACY RECORD)</p>
              <p className="text-[11px] text-amber-800 font-sans">
                This product is currently marked for admin review. Please select <strong>Men</strong>, <strong>Women</strong>, or <strong>Unisex</strong> before updating.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div className="bg-white p-6 sm:p-8 border border-neutral-200 space-y-6">
          <h3 className="text-xs font-mono text-neutral-500 tracking-[0.25em] uppercase border-b border-neutral-200 pb-3 font-semibold">
            1. BASIC PRODUCT INFORMATION
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">PRODUCT NAME *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. GARBA CYBER VEST"
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">URL SLUG *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. garba-cyber-vest"
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">COLLECTION</label>
              <select
                value={formData.collectionId || formData.collectionSlug}
                onChange={(e) => {
                  const selVal = e.target.value;
                  const foundCol = availableCollections.find((c) => c.id === selVal || c.slug === selVal);
                  setFormData({
                    ...formData,
                    collectionId: foundCol ? foundCol.id : selVal,
                    collectionSlug: foundCol ? foundCol.slug : selVal,
                    collectionName: foundCol ? foundCol.name : e.target.options[e.target.selectedIndex].text
                  });
                }}
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono uppercase font-bold"
              >
                {availableCollections.length > 0 ? (
                  availableCollections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name} {col.status === 'COMING_SOON' ? '(COMING SOON)' : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="diwali">DIWALI EDIT</option>
                    <option value="indo-western">INDO-WESTERN</option>
                    <option value="street">STREETWEAR</option>
                    <option value="y2k">Y2K KINETIC</option>
                    <option value="accessories">ACCESSORIES</option>
                    <option value="ethnic">CONTEMPORARY ETHNIC</option>
                    <option value="denim">RAW DENIM</option>
                    <option value="navratri">NAVRATRI EDIT</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">CATEGORY</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono"
              >
                <option value="Outerwear">Outerwear</option>
                <option value="Tops">Tops</option>
                <option value="Bottoms">Bottoms</option>
                <option value="Ethnic">Ethnic</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">
                  TARGET AUDIENCE / GENDER *
                </label>
                {formData.gender === 'UNCLASSIFIED' && (
                  <span className="text-[9px] font-mono font-bold text-amber-600 bg-amber-50 px-1 py-0.5 border border-amber-200">
                    REVIEW NEEDED
                  </span>
                )}
              </div>
              <select
                required
                value={formData.gender || ''}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className={`w-full bg-neutral-50 border px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono font-bold ${
                  !formData.gender || formData.gender === 'UNCLASSIFIED'
                    ? 'border-amber-400 focus:border-neutral-900 ring-1 ring-amber-300'
                    : 'border-neutral-300 focus:border-neutral-900'
                }`}
              >
                <option value="">SELECT TARGET AUDIENCE *</option>
                <option value="MEN">Men</option>
                <option value="WOMEN">Women</option>
                <option value="UNISEX">Unisex</option>
                {formData.gender === 'UNCLASSIFIED' && (
                  <option value="UNCLASSIFIED" disabled>
                    ⚠️ Unclassified (Please Select Men, Women, or Unisex)
                  </option>
                )}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">PRODUCT DESCRIPTION</label>
            <textarea
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe garment cut, fit, craftsmanship..."
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-sans leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Section 2: Images (DIRECT STORAGE & MULTI-IMAGE UPLOADER) */}
        <div className="bg-white p-6 sm:p-8 border border-neutral-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 pb-3 gap-2">
            <div>
              <h3 className="text-xs font-mono text-neutral-800 tracking-[0.25em] uppercase font-bold">
                2. PRODUCT MEDIA & MULTIPLE IMAGES
              </h3>
              <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                Supports 5+ high-res images per product. Uploads directly to Cloudinary storage.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-neutral-900 text-lime-400 font-mono text-[11px] font-bold self-start sm:self-auto">
              ATTACHED: {formData.images?.length || 0} / 5+ RECOMMENDED
            </span>
          </div>

          {/* Validation & Error Banners */}
          {uploadErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-300 text-red-700 text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>UPLOAD ISSUES ENCOUNTERED:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setUploadErrors([])}
                  className="text-red-600 hover:text-black uppercase text-[10px] underline font-bold"
                >
                  DISMISS
                </button>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1">
                {uploadErrors.map((errMsg, errIdx) => (
                  <li key={errIdx} className="text-[11px]">{errMsg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Active Upload Queue Progress Cards */}
          {Object.keys(uploadQueue).length > 0 && (
            <div className="p-4 bg-neutral-900 text-white border border-neutral-800 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-lime-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>DIRECT STORAGE UPLOADS IN PROGRESS ({activeUploadCount} ACTIVE)</span>
                </span>
                <span className="text-[10px] text-neutral-400">PUBLISHING LOCKED UNTIL COMPLETED</span>
              </div>

              <div className="space-y-2">
                {Object.values(uploadQueue).map((item) => (
                  <div key={item.id} className="p-2.5 bg-neutral-800 border border-neutral-700 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold truncate max-w-xs">{item.name} ({item.size})</span>
                      <span className={`font-bold uppercase ${
                        item.status === 'completed'
                          ? 'text-lime-400'
                          : item.status === 'error'
                          ? 'text-red-400'
                          : 'text-neutral-300'
                      }`}>
                        {item.status === 'completed' ? '✓ UPLOADED' : item.status === 'error' ? 'FAILED' : `${item.progress}%`}
                      </span>
                    </div>

                    {item.error && (
                      <p className="text-[10px] text-red-300 font-mono break-words">
                        Error: {item.error}
                      </p>
                    )}

                    <div className="w-full bg-neutral-900 h-2 overflow-hidden border border-neutral-700">
                      <div
                        className={`h-full transition-all duration-300 ${
                          item.status === 'completed'
                            ? 'bg-lime-400'
                            : item.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-lime-500'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    {item.status === 'error' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => uploadSingleFile(item.id, item.file)}
                          className="px-2 py-0.5 bg-lime-400 text-neutral-900 font-bold text-[10px] uppercase hover:bg-lime-300 flex items-center gap-1 border border-neutral-900 shadow-xs"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>RETRY UPLOAD</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissQueueItem(item.id)}
                          className="px-2 py-0.5 bg-neutral-700 text-neutral-200 font-bold text-[10px] uppercase hover:bg-neutral-600 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>DISMISS</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drag & Drop Multi-Image Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer?.files) {
                handleFilesSelected(e.dataTransfer.files);
              }
            }}
            className={`p-8 border-2 border-dashed text-center space-y-3 transition-colors ${
              isDragOver
                ? 'border-lime-500 bg-lime-400/10'
                : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100/60'
            }`}
          >
            <Upload className="w-10 h-10 text-neutral-800 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                DRAG & DROP MULTIPLE PRODUCT PHOTOS HERE (SELECT 5+ IMAGES)
              </p>
              <p className="text-[11px] font-mono text-neutral-600">
                Supports JPG, PNG, WebP, AVIF up to 10MB per photo. Uploads directly to Cloudinary storage.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <label className="btn-venm-primary px-5 py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md">
                <Upload className="w-4 h-4 text-white" />
                <span>CHOOSE IMAGES FROM DEVICE (MULTI-SELECT)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFilesSelected(e.target.files);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Grid of Attached Product Images */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-neutral-600 tracking-widest uppercase font-bold">
                ATTACHED IMAGES ({formData.images?.length || 0}) — FIRST IMAGE IS MAIN COVER
              </label>
              <span className="text-[10px] font-mono text-neutral-500">
                DRAG OR USE CONTROLS TO REORDER / SET COVER
              </span>
            </div>

            {(!formData.images || formData.images.length === 0) ? (
              <div className="p-6 text-center bg-neutral-50 border border-neutral-200 space-y-1.5">
                <p className="text-xs font-mono font-bold text-neutral-700 uppercase">
                  NO IMAGES ATTACHED YET
                </p>
                <p className="text-[11px] text-neutral-500 font-sans">
                  Use the multi-file uploader above or select studio samples below to add 4 to 5 photos for this product.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative p-2.5 border transition-all ${
                      idx === 0
                        ? 'bg-neutral-900/5 border-neutral-900 shadow-md ring-1 ring-neutral-900'
                        : 'bg-neutral-50 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="relative aspect-[3/4] bg-neutral-100 border border-neutral-200 overflow-hidden">
                      <img
                        src={img}
                        alt={`Asset ${idx + 1}`}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          e.target.src = '/assets/products/Denim Jacket.jpg';
                        }}
                      />
                      {idx === 0 && (
                        <div className="absolute top-2 left-2 bg-neutral-900 text-lime-400 font-mono text-[9px] font-extrabold px-2 py-0.5 uppercase tracking-wider shadow-md border border-lime-400/30">
                          ★ MAIN COVER
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white font-mono text-[10px] px-1.5 py-0.5">
                        #{idx + 1}
                      </div>
                    </div>

                    {/* Image Action Controls */}
                    <div className="pt-2.5 space-y-2 text-[10px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-700 uppercase">
                          {idx === 0 ? 'MAIN COVER PHOTO' : `IMAGE #${idx + 1}`}
                        </span>

                        {/* Move Order Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, 'left')}
                            disabled={idx === 0}
                            title="Move Image Left / Up"
                            className="p-1 text-neutral-700 hover:text-black hover:bg-neutral-200 disabled:opacity-20 border border-neutral-300"
                          >
                            <ArrowLeftSquare className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, 'right')}
                            disabled={idx === formData.images.length - 1}
                            title="Move Image Right / Down"
                            className="p-1 text-neutral-700 hover:text-black hover:bg-neutral-200 disabled:opacity-20 border border-neutral-300"
                          >
                            <ArrowRightSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-neutral-200">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjusterIndex(idx);
                            setAdjusterImage(img);
                          }}
                          className="px-2 py-1 bg-lime-400 text-neutral-900 hover:bg-lime-300 font-mono font-extrabold uppercase flex items-center gap-1 border border-neutral-900 shadow-xs"
                          title="Adjust Image Ratio, Crop & Fit"
                        >
                          <Crop className="w-3 h-3" />
                          <span>CROP & FIT</span>
                        </button>

                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(idx)}
                            className="px-2 py-1 bg-neutral-900 text-white hover:bg-neutral-800 font-bold uppercase"
                          >
                            SET COVER
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 font-bold uppercase border border-red-300"
                        >
                          REMOVE
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick-Pick Studio Samples */}
            <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-2 mt-4">
              <span className="text-[10px] font-mono text-neutral-600 font-bold uppercase tracking-wider block">
                ⚡ QUICK-SELECT FROM STUDIO CATALOG PHOTOS:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Raw Denim Jacket', path: '/assets/products/Denim Jacket.jpg' },
                  { name: 'Cyber Jean Jacket', path: '/assets/products/Jean Jacket.jpg' },
                  { name: 'Kathiawadi Tee', path: '/assets/products/download (1).jpg' },
                  { name: 'Navratri Campaign Look', path: '/assets/campaign/HOMEPAGE_2.webp' },
                  { name: 'Chunri Kimono Look', path: '/assets/campaign/nas1.webp' },
                  { name: 'Kinetic Kurta Look', path: '/assets/campaign/nas5.webp' },
                  { name: 'Patchwork Bomber', path: '/assets/products/Manfinity Hypemode Men\'s Autumn Patchwork Geometric Pattern Long Sleeve Single-Breasted Casual Denim Jacket.jpg' },
                ].map((sample, sIdx) => {
                  const isAlreadyAdded = formData.images?.includes(sample.path);
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => {
                        if (!isAlreadyAdded) {
                          setFormData({ ...formData, images: [...(formData.images || []), sample.path] });
                        }
                      }}
                      className={`text-[11px] font-mono px-2.5 py-1 border transition-all ${
                        isAlreadyAdded
                          ? 'bg-neutral-200 text-neutral-500 border-neutral-300 cursor-default'
                          : 'bg-white hover:bg-neutral-900 hover:text-white text-neutral-800 border-neutral-300 font-semibold'
                      }`}
                    >
                      + {sample.name} {isAlreadyAdded ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Image URL / Path Input */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="/assets/products/filename.jpg or https://res.cloudinary.com/..."
                  className="flex-1 bg-neutral-50 border border-neutral-300 px-4 py-2 text-xs text-neutral-900 font-mono"
                  id="new-img-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('new-img-input');
                    if (input && input.value.trim()) {
                      const val = input.value.trim();
                      if (val.startsWith('data:image/') || val.startsWith('blob:') || (val.length > 2000 && !val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('/'))) {
                        setUploadErrors((prev) => [
                          ...prev,
                          'DIRECT BASE64 / LOCAL BLOB DATA CANNOT BE ADDED AS A PATH. Please use the "Choose Images" button to upload the image directly to Cloudinary.'
                        ]);
                        return;
                      }
                      const cleanVal = sanitizeImageUrl(val);
                      setFormData({ ...formData, images: [...(formData.images || []), cleanVal] });
                      input.value = '';
                    }
                  }}
                  className="btn-venm-secondary px-4 py-2 text-xs font-mono font-bold whitespace-nowrap"
                >
                  ADD IMAGE PATH
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Details & Sizes */}
        <div className="bg-white p-6 sm:p-8 border border-neutral-200 space-y-6">
          <h3 className="text-xs font-mono text-neutral-500 tracking-[0.25em] uppercase border-b border-neutral-200 pb-3 font-semibold">
            3. SPECIFICATIONS & SIZING OPTIONS
          </h3>

          <div className="space-y-3">
            <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">CRAFTSMANSHIP SPECIFICATIONS</label>
            <div className="space-y-2">
              {formData.details?.map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-neutral-50 border border-neutral-200 text-xs text-neutral-800">
                  <span>• {detail}</span>
                  <button type="button" onClick={() => handleRemoveDetail(idx)} className="text-red-600 p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newDetailText}
                onChange={(e) => setNewDetailText(e.target.value)}
                placeholder="e.g. 100% Water-repellent Technical Nylon"
                className="flex-1 bg-neutral-50 border border-neutral-300 px-4 py-2 text-xs text-neutral-900 font-sans"
              />
              <button
                type="button"
                onClick={handleAddDetail}
                className="btn-venm-secondary px-4 py-2 text-xs font-mono flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> ADD SPEC
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">
                SIZING & PRODUCTION MODEL
              </label>
              <span className="text-[10px] font-mono text-black font-bold bg-lime-300 px-2 py-0.5 uppercase tracking-wider">
                100% BESPOKE / CUSTOM SIZE ONLY
              </span>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200 text-xs font-mono text-neutral-700 leading-relaxed">
              <span className="font-bold text-black">NO READYMADE INVENTORY:</span> All VENM products are crafted strictly to the customer's custom body measurements and specific fit requirements upon order commitment.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-neutral-200">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">REQUEST AVAILABILITY STATUS</label>
              <select
                value={formData.availability || 'REQUESTABLE'}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono font-bold uppercase"
              >
                <option value="REQUESTABLE">REQUESTABLE (REQUEST THIS LOOK ACTIVE)</option>
                <option value="PAUSED">PAUSED (REQUESTS TEMPORARILY PAUSED)</option>
                <option value="COMING_SOON">COMING SOON</option>
                <option value="DRAFT">DRAFT (HIDDEN FROM PUBLIC CATALOG)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 mt-6">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-neutral-900 uppercase block">FEATURE ON HOMEPAGE</span>
                <span className="text-[10px] font-mono text-neutral-500">Display in highlighted style references section</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.isFeatured)}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="accent-black w-5 h-5 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Reference Pricing & Customization Controls */}
        <div className="bg-white p-6 sm:p-8 border border-neutral-200 space-y-6">
          <h3 className="text-xs font-mono text-neutral-500 tracking-[0.25em] uppercase border-b border-neutral-200 pb-3 font-semibold">
            4. ADMIN REFERENCE PRICING & CUSTOMIZATION CONTROL
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">PRICE DISPLAY MODE</label>
              <select
                value={formData.priceDisplayMode || 'STARTING_FROM'}
                onChange={(e) => setFormData({ ...formData, priceDisplayMode: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono uppercase font-bold"
              >
                <option value="STARTING_FROM">STARTING FROM (e.g. Estimated from ₹1,800)</option>
                <option value="PRICE_RANGE">PRICE RANGE (e.g. ₹1,800 – ₹2,500)</option>
                <option value="CUSTOM_QUOTE">CUSTOM QUOTE (Price on Request)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">ESTIMATED DISPLAY PRICE</label>
              <input
                type="text"
                value={formData.estimatedPrice || ''}
                onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                placeholder="e.g. Estimated from ₹1,800"
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">MINIMUM ESTIMATED PRICE (INTEGER/FLOAT)</label>
              <input
                type="text"
                value={formData.minPrice || ''}
                onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                placeholder="e.g. 1800"
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">MAXIMUM ESTIMATED PRICE (INTEGER/FLOAT)</label>
              <input
                type="text"
                value={formData.maxPrice || ''}
                onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
                placeholder="e.g. 2500"
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">CUSTOMIZATION INFORMATION</label>
            <textarea
              rows="2"
              value={formData.customizationInfo || ''}
              onChange={(e) => setFormData({ ...formData, customizationInfo: e.target.value })}
              placeholder="e.g. Custom embroidery, fabric selections, and wash alterations available..."
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">
              CUSTOM MEASUREMENTS & SIZING SPECIFICATIONS
            </label>
            <input
              type="text"
              value={formData.sizingInfo || ''}
              onChange={(e) => setFormData({ ...formData, sizingInfo: e.target.value })}
              placeholder="e.g. Crafted to client's exact body measurements, shoulder drop, and required silhouette..."
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">SOURCE / INSPIRATION ATTRIBUTION</label>
            <input
              type="text"
              value={formData.sourceAttribution || ''}
              onChange={(e) => setFormData({ ...formData, sourceAttribution: e.target.value })}
              placeholder="e.g. VENM Studio Original Reference / Style Concept"
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-sans"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
          {mode === 'edit' ? (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="text-xs font-mono text-red-600 hover:text-red-700 flex items-center gap-1.5 uppercase border border-red-300 px-4 py-2.5 bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>DELETE REFERENCE</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-4">
            <Link to="/admin/products" className="btn-venm-secondary px-6 py-3 text-xs font-mono">
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="btn-venm-primary px-8 py-3 text-xs font-bold tracking-widest uppercase flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Save className="w-4 h-4 text-white" />
              )}
              <span>
                {isUploading
                  ? `UPLOADING (${activeUploadCount} REMAINING)...`
                  : isSaving
                  ? 'SAVING TO DB...'
                  : mode === 'create'
                  ? 'PUBLISH PRODUCT'
                  : 'SAVE CHANGES'}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white p-6 sm:p-8 max-w-md w-full border border-neutral-300 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-extrabold tracking-wider text-neutral-900 uppercase">DELETE PRODUCT?</h3>
                <p className="text-xs text-neutral-500 font-mono">CONFIRM DESTRUCTIVE ACTION</p>
              </div>
            </div>

            <p className="text-xs text-neutral-700 font-sans leading-relaxed">
              Are you sure you want to delete <strong className="text-black uppercase">{formData.name}</strong>? This will remove the record from the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="btn-venm-secondary px-4 py-2 text-xs font-mono"
              >
                CANCEL
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2 text-xs tracking-wider uppercase transition-colors"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Ratio Adjuster Modal */}
      <ImageAdjusterModal
        isOpen={!!adjusterImage}
        imageUrl={adjusterImage}
        onSave={handleAdjusterSave}
        onClose={() => {
          setAdjusterImage(null);
          setAdjusterIndex(null);
        }}
        defaultAspect="3:4"
      />
    </div>
  );
};

export default AdminProductForm;
