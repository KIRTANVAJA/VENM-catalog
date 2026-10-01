import React, { useState, useEffect } from 'react';
import { apiGetHomepageSections, apiUpdateHomepageSection } from '../../services/api';
import { Save, Eye, CheckCircle2, Layers, EyeOff, FileText, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminHomepageCMS = () => {
  const [sections, setSections] = useState([]);
  const [activeEditingId, setActiveEditingId] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const loadSections = async () => {
    try {
      setLoading(true);
      const data = await apiGetHomepageSections();
      if (Array.isArray(data) && data.length > 0) {
        setSections(data);
      }
    } catch (err) {
      console.warn('[CMS] Failed to fetch homepage sections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  const activeSection = sections.find((s) => s.sectionKey === activeEditingId) || sections[0];

  const handleToggle = async (sectionKey) => {
    const sec = sections.find((s) => s.sectionKey === sectionKey);
    if (!sec) return;

    const newEnabled = !sec.enabled;
    const updatedList = sections.map((s) => s.sectionKey === sectionKey ? { ...s, enabled: newEnabled } : s);
    setSections(updatedList);

    try {
      await apiUpdateHomepageSection({
        sectionKey,
        content: sec.content,
        enabled: newEnabled,
        displayOrder: sec.displayOrder
      });
      setToastMessage(`SECTION "${sectionKey.toUpperCase()}" ${newEnabled ? 'ENABLED' : 'DISABLED'}`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.warn('Failed to toggle section:', err);
    }
  };

  const handleContentChange = (field, value) => {
    if (!activeSection) return;
    const newContent = {
      ...activeSection.content,
      [field]: value
    };
    setSections(sections.map((s) => s.sectionKey === activeEditingId ? { ...s, content: newContent } : s));
  };

  const handleSaveSection = async () => {
    if (!activeSection) return;

    try {
      await apiUpdateHomepageSection({
        sectionKey: activeSection.sectionKey,
        content: activeSection.content,
        enabled: activeSection.enabled,
        displayOrder: activeSection.displayOrder
      });
      setToastMessage(`SAVED "${activeSection.name || activeSection.sectionKey.toUpperCase()}" CONTENT`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.warn('Failed to save section:', err);
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

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">HERO COVER IMAGE PATH</label>
                <input
                  type="text"
                  value={activeSection.content.heroImage || ''}
                  onChange={(e) => handleContentChange('heroImage', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-mono text-xs outline-none focus:border-neutral-900"
                />
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

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">COVER IMAGE PATH</label>
                <input
                  type="text"
                  value={activeSection.content.coverImage || ''}
                  onChange={(e) => handleContentChange('coverImage', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-mono outline-none focus:border-neutral-900"
                />
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

              <div className="space-y-1">
                <label className="text-neutral-800 font-bold text-[11px] uppercase block">STORY COVER IMAGE</label>
                <input
                  type="text"
                  value={activeSection.content.coverImage || ''}
                  onChange={(e) => handleContentChange('coverImage', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2 text-neutral-900 font-mono outline-none focus:border-neutral-900"
                />
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
    </div>
  );
};

export default AdminHomepageCMS;
