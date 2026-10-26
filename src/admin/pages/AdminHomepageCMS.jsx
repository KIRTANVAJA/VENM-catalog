import React, { useState, useEffect, useRef } from 'react';
import {
  apiGetHomepageSections,
  apiUpdateHomepageSection,
  apiUploadImageToCloudinary,
  apiResolveLocalImage
} from '../../services/api';
import {
  Save, Eye, CheckCircle2, Layers, EyeOff, FileText, Image as ImageIcon,
  Upload, RefreshCw, Sliders, Move, ZoomIn, Crop, Maximize2, Sparkles, Check,
  RotateCcw, Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { normalizeImagePath } from '../../utils/imageUtils';
import ImageAdjusterModal from '../components/ImageAdjusterModal';

const AdminHomepageCMS = () => {
  const [sections, setSections] = useState([]);
  const [activeEditingId, setActiveEditingId] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [isHeroDragging, setIsHeroDragging] = useState(false);
  const [adjusterModalOpen, setAdjusterModalOpen] = useState(false);
  const [resolvingPath, setResolvingPath] = useState(false);
  const [showFramingControls, setShowFramingControls] = useState(true);

  const heroFileInputRef = useRef(null);
  const featuredColFileInputRef = useRef(null);
  const storyFileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSections() {
      try {
        const data = await apiGetHomepageSections();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setSections(data.map((s) => ({ ...s, sectionKey: s.sectionKey || s.id })));
        }
      } catch (err) {
        console.warn('[CMS] Failed to fetch homepage sections:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSections();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeSection = sections.find((s) => (s.sectionKey || s.id) === activeEditingId) || sections[0];

  const handleToggle = async (targetKey) => {
    const sec = sections.find((s) => (s.sectionKey || s.id) === targetKey);
    if (!sec) return;

    const newEnabled = !sec.enabled;
    const sKey = sec.sectionKey || sec.id;
    const updatedList = sections.map((s) => (s.sectionKey || s.id) === targetKey ? { ...s, enabled: newEnabled } : s);
    setSections(updatedList);

    try {
      const updated = await apiUpdateHomepageSection({
        sectionKey: sKey,
        content: sec.content,
        enabled: newEnabled,
        displayOrder: sec.displayOrder
      });
      try {
        const stored = JSON.parse(localStorage.getItem('venm_homepage_cms') || '{}');
        stored[sKey] = updated || { ...sec, enabled: newEnabled };
        localStorage.setItem('venm_homepage_cms', JSON.stringify(stored));
      } catch (e) {}
      setToastMessage(`SECTION "${sKey.toUpperCase()}" ${newEnabled ? 'ENABLED' : 'DISABLED'}`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.warn('Failed to toggle section:', err);
    }
  };

  const handleContentChange = (field, value) => {
    if (!activeSection) return;
    const currentKey = activeSection.sectionKey || activeSection.id;
    const newContent = {
      ...activeSection.content,
      [field]: value
    };
    setSections(sections.map((s) => (s.sectionKey || s.id) === currentKey ? { ...s, content: newContent } : s));
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToastMessage('ONLY IMAGE FILES (JPG, PNG, WEBP, AVIF) ARE SUPPORTED');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setToastMessage('PROCESSING & ATTACHING IMAGE...');
    try {
      // 1. Attempt Cloudinary upload first if configured
      let uploadUrl = null;
      try {
        const res = await apiUploadImageToCloudinary(file, 'venm-catalog/campaign');
        if (res?.secure_url) uploadUrl = res.secure_url;
      } catch (cloudErr) {
        console.info('[CMS UPLOAD] Cloudinary upload skipped, falling back to local file:', cloudErr.message);
      }

      // 2. If Cloudinary not configured, use FileReader Data URL
      if (!uploadUrl) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          handleContentChange(field, dataUrl);
          setToastMessage(`IMAGE "${file.name}" ATTACHED SUCCESSFULLY`);
          setTimeout(() => setToastMessage(null), 2500);
        };
        reader.readAsDataURL(file);
        return;
      }

      handleContentChange(field, uploadUrl);
      setToastMessage('IMAGE UPLOADED & ATTACHED');
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      setToastMessage('UPLOAD ERROR: ' + (err.message || 'FAILED'));
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleResolvePath = async (customPath) => {
    const pathToResolve = (customPath || activeSection?.content?.heroImage || '').trim();
    if (!pathToResolve) return;
    setResolvingPath(true);
    try {
      const res = await apiResolveLocalImage(pathToResolve, 'campaign');
      if (res?.resolvedUrl) {
        handleContentChange('heroImage', res.resolvedUrl);
        setToastMessage('PATH RESOLVED & ASSET IMPORTED');
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (err) {
      console.warn('[PATH RESOLVE] Backend resolution skipped, using client normalizer:', err);
      const normalized = normalizeImagePath(pathToResolve);
      handleContentChange('heroImage', normalized);
      setToastMessage(`NORMALIZED TO "${normalized}"`);
      setTimeout(() => setToastMessage(null), 2500);
    } finally {
      setResolvingPath(false);
    }
  };

  const handleResetFraming = () => {
    if (!activeSection) return;
    const currentKey = activeSection.sectionKey || activeSection.id;
    const newContent = {
      ...activeSection.content,
      imagePositionX: 50,
      imagePositionY: 50,
      imageScale: 1,
      imageOpacity: 35,
      overlayDarkness: 50,
      fitMode: 'cover'
    };
    setSections(sections.map((s) => (s.sectionKey || s.id) === currentKey ? { ...s, content: newContent } : s));
    setToastMessage('HERO FRAMING RESET TO DEFAULTS');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleSaveSection = async () => {
    if (!activeSection) return;
    const sKey = activeSection.sectionKey || activeSection.id;

    // Clean and normalize all image URLs before saving
    const cleanedContent = { ...activeSection.content };
    if (cleanedContent.heroImage) {
      cleanedContent.heroImage = normalizeImagePath(cleanedContent.heroImage);
    }
    if (cleanedContent.coverImage) {
      cleanedContent.coverImage = normalizeImagePath(cleanedContent.coverImage);
    }

    try {
      const updated = await apiUpdateHomepageSection({
        sectionKey: sKey,
        content: cleanedContent,
        enabled: activeSection.enabled,
        displayOrder: activeSection.displayOrder
      });
      try {
        const stored = JSON.parse(localStorage.getItem('venm_homepage_cms') || '{}');
        stored[sKey] = updated || { ...activeSection, content: cleanedContent };
        localStorage.setItem('venm_homepage_cms', JSON.stringify(stored));
        window.dispatchEvent(new CustomEvent('venm_settings_updated', { detail: { homepage_cms: stored } }));
      } catch (e) {}
      setToastMessage(`SAVED "${activeSection.name || sKey.toUpperCase()}" CONTENT`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.warn('Failed to save section:', err);
      setToastMessage(`SAVE FAILED: ${err.message || 'DATABASE ERROR'}`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  if (loading || !activeSection) {
    return (
      <div className="p-8 text-center font-mono text-xs text-neutral-600">
        LOADING PAGES & HOMEPAGE CMS...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fadeIn font-sans">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-lime-400 text-neutral-900 px-6 py-3 font-extrabold text-xs tracking-widest uppercase shadow-xl flex items-center gap-2 border border-lime-500">
          <CheckCircle2 className="w-5 h-5 text-neutral-900" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-800 font-bold uppercase">
            CONTENT MANAGEMENT // PAGES & SECTIONS CMS
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-wider text-neutral-900 uppercase">
            PAGE CONTENT & SECTION CONTROL
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/" target="_blank" className="btn-venm-outline px-4 py-2 text-xs font-mono font-bold flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>PREVIEW LIVE STOREFRONT</span>
          </Link>

          <button
            onClick={handleSaveSection}
            className="btn-venm-neon px-6 py-2.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-neutral-900" />
            <span>SAVE SECTION CHANGES</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Section List Order Manager */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-800 font-bold uppercase block">
            MANAGED PAGE SECTIONS
          </span>

          <div className="space-y-2">
            {sections.map((sec, idx) => {
              const isSelected = sec.sectionKey === activeEditingId;
              return (
                <div
                  key={sec.sectionKey}
                  onClick={() => setActiveEditingId(sec.sectionKey)}
                  className={`p-4 border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-lime-400/10 border-lime-400 text-neutral-900 border-l-4 border-l-lime-400 shadow-sm'
                      : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-neutral-600 font-bold block uppercase">
                      SECTION #{idx + 1} • {sec.sectionKey.includes('about') ? 'ABOUT PAGE' : 'HOMEPAGE'}
                    </span>
                    <h4 className="text-xs font-extrabold tracking-wider uppercase text-neutral-900">
                      {sec.name || sec.sectionKey.replace('_', ' ').toUpperCase()}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggle(sec.sectionKey)}
                      className={`px-2.5 py-1 text-[9px] font-mono font-bold border transition-colors uppercase ${
                        sec.enabled ? 'bg-lime-400 text-neutral-900 border-lime-500' : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                      }`}
                    >
                      {sec.enabled ? 'VISIBLE' : 'HIDDEN'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Section Content Editor Form */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <div>
              <span className="text-[10px] font-mono text-neutral-800 font-bold tracking-widest uppercase block">
                EDITING SECTION CONTENT ({activeSection.sectionKey.toUpperCase()})
              </span>
              <h3 className="text-xl font-black text-neutral-900 uppercase">
                {activeSection.name || activeSection.sectionKey.replace('_', ' ').toUpperCase()}
              </h3>
            </div>
            <span className={`px-3 py-1 text-xs font-mono font-bold uppercase border ${
              activeSection.enabled ? 'bg-lime-400/20 border-lime-400 text-neutral-900' : 'bg-neutral-100 border-neutral-300 text-neutral-600'
            }`}>
              STATUS: {activeSection.enabled ? 'VISIBLE ON PUBLIC PAGE' : 'HIDDEN FROM PUBLIC PAGE'}
            </span>
          </div>

          {/* 1. HERO BANNER SECTION */}
          {activeSection.sectionKey === 'hero' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">CAMPAIGN BADGE TEXT</label>
                <input
                  type="text"
                  value={activeSection.content.campaignBadge || ''}
                  onChange={(e) => handleContentChange('campaignBadge', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">HERO MAIN TITLE</label>
                <input
                  type="text"
                  value={activeSection.content.title || ''}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">SUBTITLE / SLOGAN</label>
                <input
                  type="text"
                  value={activeSection.content.subtitle || ''}
                  onChange={(e) => handleContentChange('subtitle', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-neutral-900 font-medium outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">DESCRIPTION TEXT</label>
                <textarea
                  rows="2"
                  value={activeSection.content.description || ''}
                  onChange={(e) => handleContentChange('description', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-sans outline-none focus:border-neutral-900 resize-none"
                />
              </div>

              <div className="space-y-4 p-5 bg-neutral-100 border border-neutral-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-neutral-900 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-neutral-800" />
                      HERO COVER IMAGE (BACKGROUND BANNER STUDIO)
                    </label>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase">
                      Drag & drop any photo from your desktop, paste any path, or adjust framing in real time
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjusterModalOpen(true)}
                      className="px-3 py-1 bg-white hover:bg-neutral-900 hover:text-white border border-neutral-300 text-neutral-800 text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-colors"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>CROP & ROTATE STUDIO</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetFraming}
                      title="Reset position and zoom"
                      className="px-2.5 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 text-neutral-700 text-[10px] font-mono font-bold uppercase flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>RESET FRAMING</span>
                    </button>
                  </div>
                </div>

                {/* Interactive Drag & Drop Banner Frame Preview */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsHeroDragging(true);
                  }}
                  onDragLeave={() => setIsHeroDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsHeroDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload('heroImage', file);
                  }}
                  className={`relative w-full h-56 sm:h-64 bg-neutral-950 border-2 overflow-hidden group transition-all ${
                    isHeroDragging
                      ? 'border-lime-500 scale-[1.01] shadow-2xl ring-4 ring-lime-400/20'
                      : 'border-neutral-400 hover:border-neutral-900'
                  }`}
                >
                  {/* Live Rendered Banner Image */}
                  <img
                    src={normalizeImagePath(activeSection.content.heroImage || '/assets/campaign/IMG_0628.jpg')}
                    alt="Hero Banner Preview"
                    style={{
                      objectPosition: `${activeSection.content.imagePositionX ?? 50}% ${activeSection.content.imagePositionY ?? 50}%`,
                      transform: `scale(${activeSection.content.imageScale ?? 1})`,
                      opacity: (activeSection.content.imageOpacity ?? 35) / 100,
                      objectFit: activeSection.content.fitMode || 'cover'
                    }}
                    className="w-full h-full transition-all duration-300"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/campaign/HOMEPAGE_2.webp';
                    }}
                  />

                  {/* Live Scrim Gradient Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(to bottom, rgba(255,255,255,${((activeSection.content.overlayDarkness ?? 50) * 0.9) / 100}), rgba(255,255,255,${((activeSection.content.overlayDarkness ?? 50) * 0.45) / 100}), rgba(255,255,255,${((activeSection.content.overlayDarkness ?? 50) * 0.95) / 100}))`
                    }}
                  />

                  {/* Headline Mock Overlay to test readability */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
                    <span className="text-[10px] font-mono tracking-widest text-neutral-800 bg-white/80 px-2 py-0.5 border border-neutral-300 mb-2 font-bold uppercase">
                      {activeSection.content.campaignBadge || 'VENM REFERENCE CATALOG'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black tracking-widest text-neutral-900 uppercase">
                      {activeSection.content.title || 'VENM REFERENCE CATALOG'}
                    </h3>
                  </div>

                  {/* Drag & Drop Overlay Indicator */}
                  {isHeroDragging && (
                    <div className="absolute inset-0 bg-lime-400/30 border-4 border-dashed border-lime-500 flex flex-col items-center justify-center backdrop-blur-xs z-30 animate-pulse pointer-events-none">
                      <Upload className="w-10 h-10 text-neutral-900" />
                      <span className="font-mono font-black text-xs text-neutral-900 bg-lime-400 px-3.5 py-1.5 mt-2 tracking-widest uppercase shadow-lg">
                        DROP ANY PHOTO TO SET AS HERO BANNER
                      </span>
                    </div>
                  )}

                  {/* Corner Badge */}
                  <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2">
                    <div className="bg-neutral-900/90 text-lime-400 font-mono text-[10px] px-2.5 py-1 border border-white/20 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping inline-block" />
                      LIVE PREVIEW: {activeSection.content.heroImage || '/assets/campaign/IMG_0628.jpg'}
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 z-20">
                    <div className="bg-neutral-900/80 text-white font-mono text-[10px] px-2 py-1 border border-white/20">
                      POS: {activeSection.content.imagePositionX ?? 50}% {activeSection.content.imagePositionY ?? 50}% | ZOOM: {activeSection.content.imageScale ?? 1}x
                    </div>
                  </div>
                </div>

                {/* Quick File Select & Drag Button */}
                <div
                  onClick={() => heroFileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-400 bg-white hover:bg-neutral-50 p-4 text-center cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    ref={heroFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('heroImage', file);
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Upload className="w-5 h-5 text-neutral-800" />
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      CLICK TO CHOOSE ANY PHOTO FROM COMPUTER OR DRAG & DROP ONTO FRAME ABOVE
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Supports any JPG, PNG, WEBP, AVIF from anywhere on your computer or USB drive
                    </span>
                  </div>
                </div>

                {/* Add ANY Image Path Input with Instant Resolver */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-neutral-800 font-bold text-[11px] uppercase block">
                      OR ADD ANY IMAGE FROM ANYWHERE VIA FILE PATH OR URL
                    </label>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">
                      Paste Windows path (D:\...), web link, or relative asset
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={activeSection.content.heroImage || ''}
                      placeholder="e.g. D:\photos\look.jpg, C:\Users\..., /assets/..., or https://..."
                      onChange={(e) => handleContentChange('heroImage', e.target.value)}
                      className="flex-1 bg-white border border-neutral-300 px-3 py-2 text-neutral-900 font-mono text-xs outline-none focus:border-neutral-900"
                    />
                    <button
                      type="button"
                      disabled={resolvingPath}
                      onClick={() => handleResolvePath()}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-mono font-bold uppercase transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      {resolvingPath ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>IMPORTING...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-lime-400" />
                          <span>RESOLVE & IMPORT</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* FRAME ADJUSTMENT & POSITIONING CONTROLS */}
                {/* ---------------------------------------------------- */}
                <div className="bg-white border border-neutral-300 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <span className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-neutral-800" />
                      FRAME ADJUSTMENT & FOCAL POINT CONTROLS
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFramingControls(!showFramingControls)}
                      className="text-[10px] font-mono text-neutral-600 hover:text-neutral-900 font-bold uppercase"
                    >
                      {showFramingControls ? 'HIDE CONTROLS' : 'SHOW CONTROLS'}
                    </button>
                  </div>

                  {showFramingControls && (
                    <div className="space-y-4 pt-1 animate-fadeIn">
                      {/* 9-Point Alignment Grid Presets */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-neutral-600 uppercase block">
                          🎯 9-POINT QUICK ALIGNMENT / FOCAL PRESETS:
                        </span>
                        <div className="grid grid-cols-3 gap-2 max-w-sm">
                          {[
                            { label: 'TOP-LEFT', x: 0, y: 0 },
                            { label: 'TOP-CENTER', x: 50, y: 0 },
                            { label: 'TOP-RIGHT', x: 100, y: 0 },
                            { label: 'LEFT', x: 0, y: 50 },
                            { label: 'CENTER', x: 50, y: 50 },
                            { label: 'RIGHT', x: 100, y: 50 },
                            { label: 'BTM-LEFT', x: 0, y: 100 },
                            { label: 'BTM-CENTER', x: 50, y: 100 },
                            { label: 'BTM-RIGHT', x: 100, y: 100 },
                          ].map((pos, pIdx) => {
                            const isCurrent =
                              (activeSection.content.imagePositionX ?? 50) === pos.x &&
                              (activeSection.content.imagePositionY ?? 50) === pos.y;
                            return (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                  const currentKey = activeSection.sectionKey || activeSection.id;
                                  const updatedContent = {
                                    ...activeSection.content,
                                    imagePositionX: pos.x,
                                    imagePositionY: pos.y
                                  };
                                  setSections(
                                    sections.map((s) =>
                                      (s.sectionKey || s.id) === currentKey ? { ...s, content: updatedContent } : s
                                    )
                                  );
                                }}
                                className={`text-[10px] font-mono py-1.5 px-2 border transition-all text-center ${
                                  isCurrent
                                    ? 'bg-neutral-900 text-lime-400 border-neutral-900 font-black'
                                    : 'bg-neutral-50 hover:bg-neutral-200 text-neutral-700 border-neutral-200 font-medium'
                                }`}
                              >
                                {pos.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sliders Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200">
                        {/* Horizontal Position X Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-bold text-neutral-800 uppercase">HORIZONTAL POSITION (X)</span>
                            <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 border border-neutral-300">
                              {activeSection.content.imagePositionX ?? 50}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={activeSection.content.imagePositionX ?? 50}
                            onChange={(e) => handleContentChange('imagePositionX', Number(e.target.value))}
                            className="w-full accent-neutral-900 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                            <span>0% (LEFT)</span>
                            <span>50% (CENTER)</span>
                            <span>100% (RIGHT)</span>
                          </div>
                        </div>

                        {/* Vertical Position Y Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-bold text-neutral-800 uppercase">VERTICAL POSITION (Y)</span>
                            <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 border border-neutral-300">
                              {activeSection.content.imagePositionY ?? 50}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={activeSection.content.imagePositionY ?? 50}
                            onChange={(e) => handleContentChange('imagePositionY', Number(e.target.value))}
                            className="w-full accent-neutral-900 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                            <span>0% (TOP)</span>
                            <span>50% (CENTER)</span>
                            <span>100% (BOTTOM)</span>
                          </div>
                        </div>

                        {/* Zoom / Scale Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-bold text-neutral-800 uppercase">ZOOM / FRAME SCALE</span>
                            <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 border border-neutral-300">
                              {activeSection.content.imageScale ?? 1}x
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="2.5"
                            step="0.05"
                            value={activeSection.content.imageScale ?? 1}
                            onChange={(e) => handleContentChange('imageScale', Number(e.target.value))}
                            className="w-full accent-neutral-900 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                            <span>1.0x (NORMAL)</span>
                            <span>1.5x</span>
                            <span>2.5x (MAX ZOOM)</span>
                          </div>
                        </div>

                        {/* Banner Visibility Opacity Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-bold text-neutral-800 uppercase">BANNER OPACITY / VISIBILITY</span>
                            <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 border border-neutral-300">
                              {activeSection.content.imageOpacity ?? 35}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={activeSection.content.imageOpacity ?? 35}
                            onChange={(e) => handleContentChange('imageOpacity', Number(e.target.value))}
                            className="w-full accent-neutral-900 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                            <span>10% (SUBTLE)</span>
                            <span>50% (VIBRANT)</span>
                            <span>100% (FULL BOLD)</span>
                          </div>
                        </div>

                        {/* Text Scrim Contrast Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-bold text-neutral-800 uppercase">TEXT SCRIM / WHITE OVERLAY</span>
                            <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 border border-neutral-300">
                              {activeSection.content.overlayDarkness ?? 50}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={activeSection.content.overlayDarkness ?? 50}
                            onChange={(e) => handleContentChange('overlayDarkness', Number(e.target.value))}
                            className="w-full accent-neutral-900 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                            <span>0% (CLEAR)</span>
                            <span>50% (BALANCED)</span>
                            <span>100% (HIGH CONTRAST)</span>
                          </div>
                        </div>

                        {/* Fit Mode */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-neutral-800 uppercase block">
                            FRAME FIT MODE
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleContentChange('fitMode', 'cover')}
                              className={`py-2 text-[10px] font-mono font-bold border uppercase transition-all ${
                                (activeSection.content.fitMode || 'cover') === 'cover'
                                  ? 'bg-neutral-900 text-lime-400 border-neutral-900'
                                  : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
                              }`}
                            >
                              COVER (FILL ENTIRE FRAME)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleContentChange('fitMode', 'contain')}
                              className={`py-2 text-[10px] font-mono font-bold border uppercase transition-all ${
                                activeSection.content.fitMode === 'contain'
                                  ? 'bg-neutral-900 text-lime-400 border-neutral-900'
                                  : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
                              }`}
                            >
                              CONTAIN (FIT WHOLE IMAGE)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick-Select Studio Campaign Looks */}
                <div className="pt-1 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-neutral-600 uppercase block">
                    ⚡ QUICK-SELECT FROM STUDIO CAMPAIGN LOOKS:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'VENM Editorial Shoot (Steps)', path: '/assets/campaign/IMG_0628.jpg' },
                      { name: 'Navratri Campaign 2026', path: '/assets/campaign/HOMEPAGE_2.webp' },
                      { name: 'Cyber Chunri Kimono', path: '/assets/campaign/nas1.webp' },
                      { name: 'Kinetic Festive Kurta', path: '/assets/campaign/nas5.webp' },
                      { name: 'VENM Brand Banner', path: '/assets/campaign/banner.png' },
                    ].map((sample, idx) => {
                      const currentVal = activeSection.content.heroImage || '';
                      const isSelected = currentVal === sample.path || currentVal.includes(sample.name);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleContentChange('heroImage', sample.path)}
                          className={`text-[10px] font-mono px-2.5 py-1 border transition-all ${
                            isSelected
                              ? 'bg-neutral-900 text-lime-400 border-neutral-900 font-bold shadow-sm'
                              : 'bg-white hover:bg-neutral-900 hover:text-white text-neutral-800 border-neutral-300 font-medium'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{sample.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-neutral-800 font-bold text-[11px] uppercase block">PRIMARY CTA LABEL</label>
                  <input
                    type="text"
                    value={activeSection.content.primaryCtaText || ''}
                    onChange={(e) => handleContentChange('primaryCtaText', e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-800 font-bold text-[11px] uppercase block">PRIMARY CTA DESTINATION LINK</label>
                  <input
                    type="text"
                    value={activeSection.content.primaryCtaLink || ''}
                    onChange={(e) => handleContentChange('primaryCtaLink', e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-neutral-900 font-mono text-xs outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-neutral-800 font-bold text-[11px] uppercase block">SECONDARY CTA LABEL</label>
                  <input
                    type="text"
                    value={activeSection.content.secondaryCtaText || ''}
                    onChange={(e) => handleContentChange('secondaryCtaText', e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-800 font-bold text-[11px] uppercase block">SECONDARY CTA DESTINATION LINK</label>
                  <input
                    type="text"
                    value={activeSection.content.secondaryCtaLink || ''}
                    onChange={(e) => handleContentChange('secondaryCtaLink', e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-neutral-900 font-mono text-xs outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. FEATURED COLLECTION SPOTLIGHT */}
          {activeSection.sectionKey === 'featured_collection' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">SPOTLIGHT TITLE</label>
                <input
                  type="text"
                  value={activeSection.content.title || ''}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">TAGLINE</label>
                <input
                  type="text"
                  value={activeSection.content.tagline || ''}
                  onChange={(e) => handleContentChange('tagline', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-mono outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">SPOTLIGHT DESCRIPTION</label>
                <textarea
                  rows="3"
                  value={activeSection.content.description || ''}
                  onChange={(e) => handleContentChange('description', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-neutral-900 font-sans outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-3 p-4 bg-neutral-100 border border-neutral-300">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-900 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-neutral-800" />
                    FEATURED SPOTLIGHT COVER IMAGE
                  </label>
                  <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">
                    COLLECTION PREVIEW
                  </span>
                </div>

                <div className="relative w-full h-40 bg-neutral-900 border border-neutral-300 overflow-hidden group">
                  <img
                    src={normalizeImagePath(activeSection.content.coverImage || '/assets/campaign/HOMEPAGE_2.webp')}
                    alt="Featured Collection Preview"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/campaign/HOMEPAGE_2.webp';
                    }}
                  />
                  <div className="absolute inset-0 bg-neutral-950/20 pointer-events-none" />
                  <div className="absolute bottom-2 left-2 bg-neutral-900/90 text-lime-400 font-mono text-[10px] px-2.5 py-1 border border-white/20 font-bold uppercase tracking-wider">
                    COVER: {activeSection.content.coverImage || '/assets/campaign/HOMEPAGE_2.webp'}
                  </div>
                </div>

                <div
                  onClick={() => featuredColFileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-400 bg-white hover:bg-neutral-50 p-3 text-center cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    ref={featuredColFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('coverImage', file);
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Upload className="w-4 h-4 text-neutral-700" />
                    <span className="text-xs font-bold text-neutral-900 uppercase">
                      CHOOSE COVER PHOTO FROM DEVICE
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-700 font-bold text-[10px] uppercase block">
                    COVER IMAGE PATH (AUTO-NORMALIZED)
                  </label>
                  <input
                    type="text"
                    value={activeSection.content.coverImage || ''}
                    placeholder="/assets/campaign/HOMEPAGE_2.webp"
                    onChange={(e) => handleContentChange('coverImage', normalizeImagePath(e.target.value))}
                    className="w-full bg-white border border-neutral-300 px-3 py-2 text-neutral-900 font-mono text-xs outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-neutral-800 font-bold text-[11px] uppercase block">CTA TEXT</label>
                  <input
                    type="text"
                    value={activeSection.content.ctaText || ''}
                    onChange={(e) => handleContentChange('ctaText', e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-800 font-bold text-[11px] uppercase block">CTA LINK</label>
                  <input
                    type="text"
                    value={activeSection.content.ctaLink || ''}
                    onChange={(e) => handleContentChange('ctaLink', e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-neutral-900 font-mono outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. BRAND STATEMENT */}
          {activeSection.sectionKey === 'brand_statement' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">SECTION BADGE</label>
                <input
                  type="text"
                  value={activeSection.content.badge || ''}
                  onChange={(e) => handleContentChange('badge', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">MANIFESTO LINE 1</label>
                <input
                  type="text"
                  value={activeSection.content.line1 || ''}
                  onChange={(e) => handleContentChange('line1', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">MANIFESTO LINE 2</label>
                <input
                  type="text"
                  value={activeSection.content.line2 || ''}
                  onChange={(e) => handleContentChange('line2', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">MANIFESTO LINE 3</label>
                <input
                  type="text"
                  value={activeSection.content.line3 || ''}
                  onChange={(e) => handleContentChange('line3', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">PHILOSOPHY DESCRIPTION</label>
                <textarea
                  rows="3"
                  value={activeSection.content.description || ''}
                  onChange={(e) => handleContentChange('description', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-neutral-900 font-sans outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-neutral-800 font-bold text-[11px] uppercase block">CTA LABEL</label>
                  <input
                    type="text"
                    value={activeSection.content.ctaText || ''}
                    onChange={(e) => handleContentChange('ctaText', e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-800 font-bold text-[11px] uppercase block">CTA LINK</label>
                  <input
                    type="text"
                    value={activeSection.content.ctaLink || ''}
                    onChange={(e) => handleContentChange('ctaLink', e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-neutral-900 font-mono outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. LOOKBOOK SECTION */}
          {activeSection.sectionKey === 'lookbook' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">LOOKBOOK TITLE</label>
                <input
                  type="text"
                  value={activeSection.content.title || ''}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">LOOKBOOK SUBTITLE</label>
                <input
                  type="text"
                  value={activeSection.content.subtitle || ''}
                  onChange={(e) => handleContentChange('subtitle', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">DESCRIPTION</label>
                <input
                  type="text"
                  value={activeSection.content.description || ''}
                  onChange={(e) => handleContentChange('description', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-sans outline-none focus:border-neutral-900"
                />
              </div>
            </div>
          )}

          {/* 5. ABOUT PAGE STORY */}
          {activeSection.sectionKey === 'about_story' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">BADGE TEXT</label>
                <input
                  type="text"
                  value={activeSection.content.badge || ''}
                  onChange={(e) => handleContentChange('badge', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">PAGE MANIFESTO TITLE</label>
                <input
                  type="text"
                  value={activeSection.content.title || ''}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">SUBTITLE</label>
                <input
                  type="text"
                  value={activeSection.content.subtitle || ''}
                  onChange={(e) => handleContentChange('subtitle', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-medium outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">STORY HEADLINE</label>
                <input
                  type="text"
                  value={activeSection.content.headline || ''}
                  onChange={(e) => handleContentChange('headline', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">BRAND STORY PARAGRAPH 1</label>
                <textarea
                  rows="2"
                  value={activeSection.content.paragraph1 || ''}
                  onChange={(e) => handleContentChange('paragraph1', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-sans outline-none focus:border-neutral-900 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">BRAND STORY PARAGRAPH 2</label>
                <textarea
                  rows="3"
                  value={activeSection.content.paragraph2 || ''}
                  onChange={(e) => handleContentChange('paragraph2', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-sans outline-none focus:border-neutral-900 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">BRAND STORY PARAGRAPH 3</label>
                <textarea
                  rows="2"
                  value={activeSection.content.paragraph3 || ''}
                  onChange={(e) => handleContentChange('paragraph3', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-sans outline-none focus:border-neutral-900 resize-none"
                />
              </div>

              <div className="space-y-3 p-4 bg-neutral-100 border border-neutral-300">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-900 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-neutral-800" />
                    MANIFESTO STORY COVER IMAGE
                  </label>
                  <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">
                    STORY IMAGE
                  </span>
                </div>

                <div className="relative w-full h-40 bg-neutral-900 border border-neutral-300 overflow-hidden group">
                  <img
                    src={normalizeImagePath(activeSection.content.coverImage || '/assets/campaign/HOMEPAGE_2.webp')}
                    alt="Story Cover Preview"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/campaign/HOMEPAGE_2.webp';
                    }}
                  />
                  <div className="absolute inset-0 bg-neutral-950/20 pointer-events-none" />
                  <div className="absolute bottom-2 left-2 bg-neutral-900/90 text-lime-400 font-mono text-[10px] px-2.5 py-1 border border-white/20 font-bold uppercase tracking-wider">
                    STORY COVER: {activeSection.content.coverImage || '/assets/campaign/HOMEPAGE_2.webp'}
                  </div>
                </div>

                <div
                  onClick={() => storyFileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-400 bg-white hover:bg-neutral-50 p-3 text-center cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    ref={storyFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('coverImage', file);
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Upload className="w-4 h-4 text-neutral-700" />
                    <span className="text-xs font-bold text-neutral-900 uppercase">
                      CHOOSE STORY PHOTO FROM DEVICE
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-700 font-bold text-[10px] uppercase block">
                    STORY IMAGE PATH (AUTO-NORMALIZED)
                  </label>
                  <input
                    type="text"
                    value={activeSection.content.coverImage || ''}
                    placeholder="/assets/campaign/HOMEPAGE_2.webp"
                    onChange={(e) => handleContentChange('coverImage', normalizeImagePath(e.target.value))}
                    className="w-full bg-white border border-neutral-300 px-3 py-2 text-neutral-900 font-mono text-xs outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">IMAGE CAPTION</label>
                <input
                  type="text"
                  value={activeSection.content.caption || ''}
                  onChange={(e) => handleContentChange('caption', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-sans outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-neutral-800 font-bold text-[11px] uppercase block">BOTTOM CTA LABEL</label>
                  <input
                    type="text"
                    value={activeSection.content.ctaText || ''}
                    onChange={(e) => handleContentChange('ctaText', e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-800 font-bold text-[11px] uppercase block">BOTTOM CTA DESTINATION LINK</label>
                  <input
                    type="text"
                    value={activeSection.content.ctaLink || ''}
                    onChange={(e) => handleContentChange('ctaLink', e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-neutral-900 font-mono outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* FALLBACK FOR UNRECOGNIZED SECTIONS */}
          {!['hero', 'featured_collection', 'brand_statement', 'lookbook', 'about_story'].includes(activeSection.sectionKey) && (
            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">SECTION TITLE</label>
                <input
                  type="text"
                  value={activeSection.content.title || activeSection.name}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-neutral-900 font-bold outline-none focus:border-neutral-900"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleToggle(activeSection.sectionKey)}
              className={`px-4 py-2 text-xs font-mono font-bold border transition-colors uppercase flex items-center gap-1.5 ${
                activeSection.enabled ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-lime-400 text-neutral-900 border-lime-500'
              }`}
            >
              {activeSection.enabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{activeSection.enabled ? 'HIDE SECTION ON PUBLIC SITE' : 'SHOW SECTION ON PUBLIC SITE'}</span>
            </button>

            <button
              onClick={handleSaveSection}
              className="btn-venm-neon px-6 py-2.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-neutral-900" />
              <span>SAVE SECTION CHANGES</span>
            </button>
          </div>
        </div>
      </div>

      {adjusterModalOpen && (
        <ImageAdjusterModal
          isOpen={adjusterModalOpen}
          imageUrl={normalizeImagePath(activeSection?.content?.heroImage || '/assets/campaign/IMG_0628.jpg')}
          defaultAspect="16:9"
          onSave={(adjustedUrl) => {
            handleContentChange('heroImage', adjustedUrl);
            setToastMessage('TRANSFORMED IMAGE SAVED TO HERO BANNER');
            setTimeout(() => setToastMessage(null), 2500);
          }}
          onClose={() => setAdjusterModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminHomepageCMS;
