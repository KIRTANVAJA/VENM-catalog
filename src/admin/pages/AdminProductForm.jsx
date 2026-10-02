import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  apiGetProductBySlug,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct
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
  CheckCircle2
} from 'lucide-react';

const AdminProductForm = ({ mode = 'create' }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    collectionSlug: 'navratri',
    collectionName: 'NAVRATRI EDIT',
    category: 'Outerwear',
    description: '',
    details: ['100% Cotton Loopback Fleece', 'Custom VENM Anodized Hardware'],
    images: ['/assets/products/jac3.jpg', '/assets/products/jac2.jpg'],
    isFeatured: true,
    isNavratriEdit: true,
    sizes: ['S', 'M', 'L', 'XL'],
    availability: 'IN STOCK',
    tags: ['NavratriEdit', 'Outerwear'],
    garmentCare: 'Dry clean only.'
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [isErrorToast, setIsErrorToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newDetailText, setNewDetailText] = useState('');

  useEffect(() => {
    if (mode === 'edit' && id) {
      apiGetProductBySlug(id)
        .then((data) => {
          if (data) {
            setFormData({
              ...data,
              details: Array.isArray(data.details) ? data.details : (typeof data.details === 'string' && data.details.startsWith('[') ? JSON.parse(data.details) : []),
              images: Array.isArray(data.images) ? data.images : (typeof data.images === 'string' && data.images.startsWith('[') ? JSON.parse(data.images) : []),
              sizes: Array.isArray(data.sizes) ? data.sizes : (typeof data.sizes === 'string' && data.sizes.startsWith('[') ? JSON.parse(data.sizes) : []),
              tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' && data.tags.startsWith('[') ? JSON.parse(data.tags) : [])
            });
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

  const handleSubmit = async (e, statusOverride = null) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    const finalData = {
      ...formData,
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
            disabled={isSaving}
            className="btn-venm-secondary px-4 py-2.5 text-xs font-bold tracking-widest uppercase disabled:opacity-50"
          >
            {isSaving ? 'SAVING...' : 'SAVE DRAFT'}
          </button>

          <button
            onClick={(e) => handleSubmit(e)}
            disabled={isSaving}
            className="btn-venm-primary px-6 py-2.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-white" />
            <span>{isSaving ? 'SAVING TO DB...' : (mode === 'create' ? 'PUBLISH PRODUCT' : 'SAVE CHANGES')}</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">COLLECTION</label>
              <select
                value={formData.collectionSlug}
                onChange={(e) => {
                  const selName = e.target.options[e.target.selectedIndex].text;
                  setFormData({
                    ...formData,
                    collectionSlug: e.target.value,
                    collectionName: selName
                  });
                }}
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono uppercase"
              >
                <option value="navratri">NAVRATRI EDIT</option>
                <option value="diwali">DIWALI EDIT</option>
                <option value="ethnic">CONTEMPORARY ETHNIC</option>
                <option value="indo-western">INDO-WESTERN</option>
                <option value="denim">RAW DENIM</option>
                <option value="street">STREETWEAR</option>
                <option value="y2k">Y2K KINETIC</option>
                <option value="accessories">ACCESSORIES</option>
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

        {/* Section 2: Images */}
        <div className="bg-white p-6 sm:p-8 border border-neutral-200 space-y-6">
          <h3 className="text-xs font-mono text-neutral-500 tracking-[0.25em] uppercase border-b border-neutral-200 pb-3 font-semibold">
            2. PRODUCT MEDIA & IMAGES
          </h3>

          <div className="space-y-4">
            <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">IMAGE ASSET PATHS</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {formData.images?.map((img, idx) => (
                <div key={idx} className="relative group bg-neutral-50 p-2 border border-neutral-200">
                  <img src={img} alt={`Asset ${idx}`} className="w-full h-40 object-cover bg-neutral-100" />
                  <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>{idx === 0 ? 'MAIN COVER' : `GALLERY ${idx}`}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedImgs = formData.images.filter((_, i) => i !== idx);
                        setFormData({ ...formData, images: updatedImgs });
                      }}
                      className="text-red-600 hover:underline"
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="/assets/products/filename.jpg"
                className="flex-1 bg-neutral-50 border border-neutral-300 px-4 py-2 text-xs text-neutral-900 font-mono"
                id="new-img-input"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('new-img-input');
                  if (input && input.value.trim()) {
                    setFormData({ ...formData, images: [...(formData.images || []), input.value.trim()] });
                    input.value = '';
                  }
                }}
                className="btn-venm-secondary px-4 py-2 text-xs font-mono"
              >
                ADD IMAGE PATH
              </button>
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

          <div className="space-y-3 pt-4 border-t border-neutral-200">
            <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">AVAILABLE SIZES</label>
            <div className="flex flex-wrap gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => {
                const isSelected = formData.sizes?.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleToggleSize(sz)}
                    className={`min-w-[48px] py-2 px-3 text-xs font-mono transition-all border ${
                      isSelected
                        ? 'bg-black text-white border-black font-bold'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:text-black'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
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
            <label className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">SIZING APPROACH INFORMATION</label>
            <input
              type="text"
              value={formData.sizingInfo || ''}
              onChange={(e) => setFormData({ ...formData, sizingInfo: e.target.value })}
              placeholder="e.g. Custom sizing available according to your measurements..."
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

        {/* Footer */}
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
              className="btn-venm-primary px-8 py-3 text-xs font-bold tracking-widest uppercase flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-white" />
              <span>{mode === 'create' ? 'PUBLISH PRODUCT' : 'SAVE CHANGES'}</span>
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
    </div>
  );
};

export default AdminProductForm;
