import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  apiGetCampaigns,
  apiUpdateCampaign,
  apiCreateCampaign,
  apiGetCollections,
  apiUpdateCollection,
  apiCreateCollection,
  apiGetSettings,
  apiUpdateSettings,
  apiUpdateHomepageSection,
  apiGetProducts,
  apiUpdateProduct
} from '../../services/api';
import {
  Flame,
  Save,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Plus,
  Trash2,
  Star,
  ExternalLink,
  Image as ImageIcon,
  Type,
  Package,
  Search,
  Check,
  Eye,
  RefreshCw,
  Crop
} from 'lucide-react';
import ImageAdjusterModal from '../components/ImageAdjusterModal';

const STUDIO_SAMPLES = [
  { name: 'Navratri Campaign Look', path: '/assets/campaign/HOMEPAGE_2.webp' },
  { name: 'Diwali Festive Look', path: '/assets/campaign/nas8.jpg' },
  { name: 'Ethnic Draped Look', path: '/assets/campaign/nas1.webp' },
  { name: 'Indo-Western Look', path: '/assets/campaign/nas9.jpg' },
  { name: 'Denim Jacket Look', path: '/assets/products/Denim Jacket.jpg' },
  { name: 'Jean Jacket Look', path: '/assets/products/Jean Jacket.jpg' }
];

const AdminActiveFest = () => {
  const [title, setTitle] = useState('NAVRATRI EDIT');
  const [coverPhoto, setCoverPhoto] = useState('/assets/campaign/HOMEPAGE_2.webp');
  const [photos, setPhotos] = useState([
    '/assets/campaign/HOMEPAGE_2.webp',
    '/assets/campaign/nas8.jpg',
    '/assets/campaign/nas1.webp'
  ]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Products state
  const [allProducts, setAllProducts] = useState([]);
  const [assignedProductIds, setAssignedProductIds] = useState([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [allCollections, setAllCollections] = useState([]);
  const [existingSetting, setExistingSetting] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isErrorToast, setIsErrorToast] = useState(false);

  const [adjusterImage, setAdjusterImage] = useState(null);
  const [adjusterIndex, setAdjusterIndex] = useState(null);

  const handleAdjusterSave = (adjustedUrl) => {
    if (adjusterIndex !== null && adjusterIndex >= 0) {
      const updated = [...photos];
      updated[adjusterIndex] = adjustedUrl;
      setPhotos(updated);
      if (adjusterIndex === 0 || coverPhoto === photos[adjusterIndex]) {
        setCoverPhoto(adjustedUrl);
      }
    } else {
      setPhotos((prev) => [...prev, adjustedUrl]);
      if (!coverPhoto) setCoverPhoto(adjustedUrl);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [camps, cols, settings, prods] = await Promise.all([
          apiGetCampaigns().catch(() => []),
          apiGetCollections().catch(() => []),
          apiGetSettings().catch(() => ({})),
          apiGetProducts({ status: 'ALL' }).catch(() => [])
        ]);

        if (!isMounted) return;

        const loadedProducts = Array.isArray(prods) ? prods : [];
        setAllProducts(loadedProducts);
        setAllCollections(Array.isArray(cols) ? cols : []);

        const activeFestSetting = settings?.active_fest;
        if (activeFestSetting) {
          setExistingSetting(activeFestSetting);
        }

        const activeCamp = Array.isArray(camps) ? camps.find((c) => c.status === 'ACTIVE') || camps[0] : null;
        if (activeCamp) {
          setActiveCampaignId(activeCamp.id);
        }

        const currentTitle = activeFestSetting?.name || activeCamp?.name || 'NAVRATRI EDIT';
        const currentCover = activeFestSetting?.coverImage || activeCamp?.image || '/assets/campaign/HOMEPAGE_2.webp';
        const currentPhotos = Array.isArray(activeFestSetting?.galleryImages) && activeFestSetting.galleryImages.length > 0
          ? activeFestSetting.galleryImages
          : [currentCover, '/assets/campaign/nas8.jpg', '/assets/campaign/nas1.webp'].filter(Boolean);

        // Determine assigned products:
        // Priority 1: explicitly saved assignedProductIds in settings
        // Priority 2: products where isNavratriEdit === true or collectionSlug === 'navratri'
        let initialAssignedIds = [];
        if (Array.isArray(activeFestSetting?.assignedProductIds) && activeFestSetting.assignedProductIds.length > 0) {
          initialAssignedIds = activeFestSetting.assignedProductIds;
        } else {
          initialAssignedIds = loadedProducts
            .filter((p) => p.isNavratriEdit === true || p.collectionSlug === 'navratri')
            .map((p) => p.id);
        }

        setTitle(currentTitle);
        setCoverPhoto(currentCover);
        setPhotos(currentPhotos);
        setAssignedProductIds(initialAssignedIds);
      } catch (err) {
        console.warn('[ADMIN ACTIVE FEST] Load failed:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (message, isError = false) => {
    setToastMessage(message);
    setIsErrorToast(isError);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ----------------------------------------------------
  // PHOTO HANDLERS
  // ----------------------------------------------------
  const handleAddPhoto = (urlToAdd) => {
    const trimmed = (urlToAdd || newPhotoUrl).trim();
    if (!trimmed) return;

    if (!photos.includes(trimmed)) {
      setPhotos((prev) => [...prev, trimmed]);
      if (!coverPhoto) setCoverPhoto(trimmed);
      showToast('PHOTO ADDED TO FESTIVAL');
    }
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (indexToRemove) => {
    const target = photos[indexToRemove];
    const updated = photos.filter((_, idx) => idx !== indexToRemove);

    let nextCover = coverPhoto;
    if (coverPhoto === target) {
      nextCover = updated[0] || '';
    }

    setPhotos(updated);
    setCoverPhoto(nextCover);
    showToast('PHOTO REMOVED');
  };

  const handleSetCoverPhoto = (url) => {
    setCoverPhoto(url);
    showToast('UPDATED MAIN COVER PHOTO');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      handleAddPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // PRODUCT HANDLERS
  // ----------------------------------------------------
  const handleAddProduct = (productId) => {
    const idToAdd = productId || selectedProductIdToAdd;
    if (!idToAdd) return;

    if (!assignedProductIds.includes(idToAdd)) {
      const productObj = allProducts.find((p) => p.id === idToAdd);
      setAssignedProductIds((prev) => [...prev, idToAdd]);
      showToast(`ADDED "${productObj?.name || 'PRODUCT'}" TO FESTIVAL`);
    }
    setSelectedProductIdToAdd('');
  };

  const handleRemoveProduct = (productId) => {
    const productObj = allProducts.find((p) => p.id === productId);
    setAssignedProductIds((prev) => prev.filter((id) => id !== productId));
    showToast(`REMOVED "${productObj?.name || 'PRODUCT'}" FROM FESTIVAL`);
  };

  const handleAddAllCatalog = () => {
    const allIds = allProducts.map((p) => p.id);
    setAssignedProductIds(allIds);
    showToast('ALL CATALOG PRODUCTS ADDED TO FESTIVAL');
  };

  // ----------------------------------------------------
  // SAVE CONTROLLER
  // ----------------------------------------------------
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const cleanTitle = title.trim() || 'ACTIVE FEST';
      const cleanSlug = cleanTitle
        .toLowerCase()
        .replace(/edit/g, '')
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'navratri';

      const festivalPayload = {
        ...existingSetting,
        name: cleanTitle.toUpperCase(),
        navLabel: 'ACTIVE FEST',
        slug: cleanSlug,
        coverImage: coverPhoto || photos[0] || '/assets/campaign/HOMEPAGE_2.webp',
        galleryImages: photos,
        assignedProductIds: assignedProductIds,
        announcement: `VENM × ${cleanTitle.toUpperCase()}: THE FESTIVE EDIT IS NOW LIVE`,
        status: 'ACTIVE'
      };

      // 1. Update Setting in DB
      await apiUpdateSettings('active_fest', festivalPayload);

      // Store in localStorage for instant local reactivity (safely wrapped to avoid browser quota limits)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('venm_active_fest', JSON.stringify(festivalPayload));
        } catch (e) {
          console.warn('[LOCALSTORAGE CACHE SKIPPED DUE TO STORAGE QUOTA]', e.message);
        }
      }

      // 2. Update Products in DB:
      // A. For assigned products: mark isNavratriEdit: true and collectionSlug: 'active-fest'
      const assignedSet = new Set(assignedProductIds);
      const updatePromises = [];

      for (const prod of allProducts) {
        if (assignedSet.has(prod.id)) {
          // Should be marked as festive
          if (!prod.isNavratriEdit || prod.collectionSlug !== 'active-fest') {
            updatePromises.push(
              apiUpdateProduct(prod.id, {
                isNavratriEdit: true,
                collectionSlug: 'active-fest',
                collectionName: cleanTitle.toUpperCase()
              }).catch((e) => console.warn(`Failed to mark product ${prod.id} festive:`, e))
            );
          }
        } else {
          // Unassigned product: if it was marked as festive, unmark it
          if (prod.isNavratriEdit || prod.collectionSlug === 'active-fest' || prod.collectionSlug === 'navratri') {
            updatePromises.push(
              apiUpdateProduct(prod.id, {
                isNavratriEdit: false
              }).catch((e) => console.warn(`Failed to unmark product ${prod.id}:`, e))
            );
          }
        }
      }

      await Promise.all(updatePromises);

      // 3. Sync Campaign table in DB
      const campPayload = {
        name: cleanTitle.toUpperCase(),
        slug: 'active-fest',
        image: festivalPayload.coverImage,
        announcement: festivalPayload.announcement,
        status: 'ACTIVE'
      };

      if (activeCampaignId) {
        await apiUpdateCampaign(activeCampaignId, campPayload).catch(() => {});
      } else {
        const created = await apiCreateCampaign(campPayload).catch(() => null);
        if (created?.id) setActiveCampaignId(created.id);
      }

      // 4. Sync Collection table in DB
      const existingCol = allCollections.find((c) => c.slug === 'active-fest' || c.slug === cleanSlug || c.slug === 'navratri');
      const colPayload = {
        name: cleanTitle.toUpperCase(),
        slug: 'active-fest',
        coverImage: festivalPayload.coverImage,
        status: 'ACTIVE',
        featured: true
      };

      if (existingCol) {
        await apiUpdateCollection(existingCol.id, colPayload).catch(() => {});
      } else {
        await apiCreateCollection(colPayload).catch(() => {});
      }

      // 5. Update Homepage featured_collection spotlight section in DB
      await apiUpdateHomepageSection({
        sectionKey: 'featured_collection',
        name: 'FEATURED COLLECTION SPOTLIGHT',
        enabled: true,
        content: {
          collectionSlug: 'active-fest',
          title: cleanTitle.toUpperCase(),
          tagline: `${cleanTitle.toUpperCase()} // ACTIVE FESTIVAL LOOKS`,
          description: `Exclusive archival reference looks and custom bespoke silhouettes for ${cleanTitle.toUpperCase()}.`,
          coverImage: festivalPayload.coverImage,
          ctaText: `EXPLORE ${cleanTitle.toUpperCase()} REFERENCES`,
          ctaLink: '/collection/active-fest'
        }
      }).catch(() => {});

      showToast(`SAVED! TITLE, PHOTOS & ${assignedProductIds.length} PRODUCTS ARE LIVE`);
    } catch (err) {
      console.error('[ACTIVE FEST] Save error:', err);
      showToast(`SAVE FAILED: ${err.message || 'DATABASE ERROR'}`, true);
    } finally {
      setIsSaving(false);
    }
  };

  // Products currently in fest
  const assignedProducts = allProducts.filter((p) => assignedProductIds.includes(p.id));

  // Products available to add (not yet in fest)
  const availableToAdd = allProducts.filter((p) => {
    if (assignedProductIds.includes(p.id)) return false;
    if (!productSearchQuery.trim()) return true;
    const q = productSearchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24 animate-fadeIn font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 font-extrabold text-xs tracking-widest uppercase shadow-2xl flex items-center gap-2 border ${
            isErrorToast
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-lime-400 text-neutral-900 border-lime-500'
          }`}
        >
          {isErrorToast ? <AlertTriangle className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-neutral-900" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-lime-400 text-neutral-900 text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              <span>ACTIVE FEST CONTROLLER</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase font-semibold">
              // TITLE, PHOTOS & PRODUCTS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-neutral-900 uppercase">
            ACTIVE FEST (TITLE, PHOTOS & PRODUCTS)
          </h1>
          <p className="text-xs text-neutral-500 font-mono">
            Rename your active festival (e.g. Navratri or Diwali), manage photos, and choose which products appear in the active fest.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-venm-primary px-6 py-2.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2 self-start sm:self-auto disabled:opacity-50 shadow-md"
        >
          <Save className="w-4 h-4 text-white" />
          <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. FESTIVAL TITLE */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-neutral-900" />
            <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
              1. FESTIVAL TITLE
            </h2>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 uppercase">Change Name Anytime</span>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-neutral-900 uppercase tracking-wider block">
            FESTIVAL NAME (E.G. NAVRATRI, DIWALI, EID)
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Type festival name (e.g. Navratri, Diwali, Festive Edit...)"
            className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-3 text-sm text-neutral-900 font-extrabold uppercase outline-none"
          />

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-mono text-neutral-500 uppercase font-semibold">QUICK PRESETS:</span>
            {['NAVRATRI EDIT', 'DIWALI EDIT', 'FESTIVE EDIT', 'EID EDIT'].map((presetName) => (
              <button
                key={presetName}
                type="button"
                onClick={() => setTitle(presetName)}
                className={`text-[10px] font-mono px-2.5 py-1 border transition-all ${
                  title.toUpperCase() === presetName
                    ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                }`}
              >
                {presetName}
              </button>
            ))}
          </div>

          {/* Live Preview Box */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">CURRENT FESTIVAL TITLE:</span>
            <span className="font-mono font-bold text-neutral-900 uppercase">
              {title.toUpperCase() || 'ACTIVE FEST'}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. PHOTOS (COVER PHOTO & GALLERY PHOTOS) */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-neutral-900" />
            <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
              2. FESTIVAL PHOTOS ({photos.length})
            </h2>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 uppercase">Add & Remove Photos</span>
        </div>

        {/* Main Cover Photo Preview Banner */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-4 bg-neutral-50 border border-neutral-200">
          <div className="md:col-span-4 relative aspect-[4/3] bg-neutral-900 overflow-hidden border border-neutral-300 shadow-inner group">
            <img
              src={coverPhoto || photos[0] || '/assets/campaign/HOMEPAGE_2.webp'}
              alt="Main Cover Photo"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
              <span className="text-[9px] font-mono tracking-widest bg-lime-400 text-neutral-900 font-bold px-2 py-0.5 inline-block self-start uppercase">
                ★ MAIN COVER PHOTO
              </span>
              <p className="text-xs font-bold text-white uppercase tracking-wider mt-1 truncate">
                {title.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="md:col-span-8 space-y-3 text-xs">
            <h3 className="font-extrabold uppercase text-neutral-900 tracking-wider">
              MAIN COVER PHOTO URL / PATH
            </h3>
            <p className="text-[11px] text-neutral-500 font-mono">
              Displayed as the primary spotlight banner image for {title}.
            </p>
            <input
              type="text"
              value={coverPhoto}
              onChange={(e) => setCoverPhoto(e.target.value)}
              placeholder="/assets/campaign/... or https://..."
              className="w-full bg-white border border-neutral-300 px-3 py-2 text-neutral-900 font-mono outline-none focus:border-neutral-900 text-xs"
            />
          </div>
        </div>

        {/* Photos Grid with Remove and Set Cover */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              ALL CURRENT PHOTOS IN THIS FESTIVAL:
            </label>
            <span className="text-[10px] font-mono text-neutral-500">
              Hover photo to remove or set as main cover
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photoUrl, idx) => {
              const isCover = coverPhoto === photoUrl;
              return (
                <div
                  key={idx}
                  className={`group relative aspect-square bg-neutral-100 border transition-all overflow-hidden ${
                    isCover
                      ? 'ring-2 ring-lime-400 border-lime-400 shadow-md'
                      : 'border-neutral-300 hover:border-neutral-900'
                  }`}
                >
                  <img
                    src={photoUrl}
                    alt={`Fest photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-black/80 text-white">
                      #{idx + 1}
                    </span>
                    {isCover && (
                      <span className="px-1.5 py-0.5 text-[9px] font-mono font-extrabold bg-lime-400 text-neutral-900 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>COVER</span>
                      </span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  <div className="absolute inset-0 bg-neutral-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjusterIndex(idx);
                        setAdjusterImage(photoUrl);
                      }}
                      className="w-full px-2 py-1 text-[10px] font-mono font-bold bg-white text-neutral-900 uppercase hover:bg-neutral-100 flex items-center justify-center gap-1"
                    >
                      <Crop className="w-3 h-3 text-neutral-900" />
                      <span>CROP & FIT</span>
                    </button>
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetCoverPhoto(photoUrl)}
                        className="w-full px-2 py-1 text-[10px] font-mono font-bold bg-lime-400 text-neutral-900 uppercase hover:bg-lime-300"
                      >
                        SET COVER
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="w-full px-2 py-1 text-[10px] font-mono font-bold bg-red-600 text-white uppercase hover:bg-red-700 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>REMOVE</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add New Photos Form */}
        <div className="bg-neutral-50 p-4 sm:p-5 border border-neutral-200 space-y-4 text-xs">
          <span className="font-extrabold text-neutral-900 uppercase tracking-wider block">
            + ADD MORE PHOTOS TO THIS FESTIVAL:
          </span>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              placeholder="Paste photo URL (e.g. /assets/campaign/nas8.jpg or https://...)"
              className="flex-1 bg-white border border-neutral-300 px-3.5 py-2.5 text-neutral-900 font-mono outline-none focus:border-neutral-900"
            />
            <button
              type="button"
              onClick={() => handleAddPhoto(newPhotoUrl)}
              className="btn-venm-primary px-5 py-2.5 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>ADD BY URL</span>
            </button>

            <label className="btn-venm-secondary px-5 py-2.5 text-xs font-bold tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1.5">
              <Upload className="w-4 h-4" />
              <span>UPLOAD FROM PC</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Quick Studio Photo Chips */}
          <div className="pt-2 border-t border-neutral-200 space-y-2">
            <span className="text-[10px] font-mono text-neutral-600 font-bold uppercase block">
              ⚡ QUICK-PICK CATALOG STUDIO PHOTOS:
            </span>
            <div className="flex flex-wrap gap-2">
              {STUDIO_SAMPLES.map((sample, sIdx) => {
                const isAdded = photos.includes(sample.path);
                return (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => handleAddPhoto(sample.path)}
                    className={`text-[11px] font-mono px-2.5 py-1 border transition-all ${
                      isAdded
                        ? 'bg-neutral-200 text-neutral-500 border-neutral-300 cursor-default'
                        : 'bg-white hover:bg-neutral-900 hover:text-white text-neutral-800 border-neutral-300 font-semibold'
                    }`}
                  >
                    + {sample.name} {isAdded ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. FESTIVAL PRODUCTS (ADD & REMOVE PRODUCTS) */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-neutral-900" />
            <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
              3. FESTIVAL PRODUCTS ({assignedProducts.length} ASSIGNED)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/products/create"
              className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>NEW PRODUCT</span>
            </Link>
            <button
              type="button"
              onClick={handleAddAllCatalog}
              className="px-3 py-1 bg-neutral-900 text-white hover:bg-neutral-800 text-[10px] font-mono font-bold uppercase tracking-wider"
            >
              ADD ALL CATALOG
            </button>
          </div>
        </div>

        {/* Add Products Selector Bar */}
        <div className="bg-neutral-50 p-4 sm:p-5 border border-neutral-200 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider block">
              + ADD PRODUCT FROM CATALOG TO {title.toUpperCase()}:
            </span>
            <p className="text-[11px] text-neutral-500 font-mono">
              Select any existing product from your catalog to assign it to this active festival.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <select
                value={selectedProductIdToAdd}
                onChange={(e) => setSelectedProductIdToAdd(e.target.value)}
                className="w-full bg-white border border-neutral-300 px-3.5 py-2.5 text-xs text-neutral-900 font-mono uppercase outline-none focus:border-neutral-900"
              >
                <option value="">-- Choose a product to add to fest ({availableToAdd.length} available) --</option>
                {availableToAdd.map((p) => {
                  const priceStr = p.estimatedPrice || (p.minPrice ? `₹${p.minPrice}` : '');
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.category ? `[${p.category}]` : ''} {priceStr ? `— ${priceStr}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              disabled={!selectedProductIdToAdd}
              onClick={() => handleAddProduct(selectedProductIdToAdd)}
              className="btn-venm-primary px-6 py-2.5 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>ADD TO FEST</span>
            </button>
          </div>

          {/* Quick-Filter Available Catalog Products */}
          {availableToAdd.length > 0 && (
            <div className="pt-2 border-t border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-600 font-bold uppercase">
                  ⚡ QUICK-ADD UNASSIGNED PRODUCTS ({availableToAdd.length}):
                </span>
                <input
                  type="text"
                  placeholder="Filter available..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="bg-white border border-neutral-300 text-[10px] font-mono px-2 py-0.5 outline-none w-36"
                />
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-white border border-neutral-200">
                {availableToAdd.slice(0, 15).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddProduct(p.id)}
                    className="text-[11px] font-mono px-2.5 py-1 bg-neutral-50 hover:bg-neutral-900 hover:text-white border border-neutral-300 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3 h-3 text-neutral-500" />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assigned Products Cards List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              PRODUCTS CURRENTLY IN THIS FESTIVAL ({assignedProducts.length}):
            </label>
            <span className="text-[10px] font-mono text-neutral-500">
              Changes take effect on live store when you click Save
            </span>
          </div>

          {assignedProducts.length === 0 ? (
            <div className="p-8 text-center bg-neutral-50 border border-dashed border-neutral-300 space-y-2">
              <Package className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-xs font-mono font-bold text-neutral-700 uppercase">
                NO PRODUCTS ASSIGNED TO THIS FESTIVAL YET
              </p>
              <p className="text-[11px] text-neutral-500 font-mono">
                Select a product from the dropdown above to showcase it in {title}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignedProducts.map((product, idx) => {
                const img = Array.isArray(product.images) && product.images.length > 0
                  ? product.images[0]
                  : (product.image || '/assets/campaign/HOMEPAGE_2.webp');
                const price = product.estimatedPrice || (product.minPrice ? `₹${product.minPrice}` : 'REQUEST QUOTE');

                return (
                  <div
                    key={product.id || idx}
                    className="p-3 bg-neutral-50 border border-neutral-200 hover:border-neutral-900 transition-colors flex gap-3 items-center group relative"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-20 bg-neutral-200 border border-neutral-300 overflow-hidden flex-shrink-0 relative">
                      <img
                        src={img}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/assets/campaign/HOMEPAGE_2.webp'; }}
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[8px] font-mono text-center py-0.5">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 text-[8px] font-mono font-bold bg-lime-400 text-neutral-900 uppercase">
                          IN FEST
                        </span>
                        <span className="text-[9px] font-mono text-neutral-500 uppercase truncate">
                          {product.category || 'Outerwear'}
                        </span>
                      </div>

                      <h4 className="text-xs font-extrabold text-neutral-900 uppercase truncate">
                        {product.name}
                      </h4>

                      <p className="text-[10px] font-mono text-neutral-600 font-semibold truncate">
                        {price}
                      </p>

                      {/* Quick links & remove button */}
                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          to={`/product/${product.slug || product.id}`}
                          target="_blank"
                          title="View on store"
                          className="text-[9px] font-mono text-neutral-500 hover:text-neutral-900 flex items-center gap-0.5 underline uppercase"
                        >
                          <Eye className="w-2.5 h-2.5" />
                          <span>VIEW</span>
                        </Link>
                        <span className="text-neutral-300 text-xs">|</span>
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          title="Edit in admin"
                          className="text-[9px] font-mono text-neutral-500 hover:text-neutral-900 uppercase"
                        >
                          EDIT
                        </Link>
                      </div>
                    </div>

                    {/* Remove Action Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.id)}
                      title="Remove from this festival"
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Sticky Bottom Save Bar */}
      {/* ---------------------------------------------------- */}
      <div className="sticky bottom-4 z-40 bg-neutral-900 text-white p-4 border border-neutral-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase">
            ACTIVE FESTIVAL: <span className="text-lime-400 font-black">{title.toUpperCase()}</span> ({photos.length} Photos, {assignedProductIds.length} Products)
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/collection/navratri"
            target="_blank"
            className="flex-1 sm:flex-initial btn-venm-secondary text-white border-neutral-700 hover:border-white px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-center flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>VIEW LIVE</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-initial btn-venm-primary bg-lime-400 text-neutral-900 hover:bg-lime-300 px-8 py-2.5 text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'SAVING...' : 'SAVE TITLE, PHOTOS & PRODUCTS'}</span>
          </button>
        </div>
      </div>

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

export default AdminActiveFest;
