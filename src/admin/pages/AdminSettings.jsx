import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getSettings, fetchLiveSettings, saveSettingsSection } from '../../data/settings';
import { Settings, MessageCircle, Share2, Search, CheckCircle2, Copy, Save } from 'lucide-react';

const AdminSettings = () => {
  const location = useLocation();
  const [settings, setSettingsState] = useState(getSettings());
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchLiveSettings().then((live) => {
      setSettingsState({ ...live });
    });
  }, []);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/whatsapp')) return 'whatsapp';
    if (path.includes('/social')) return 'social';
    if (path.includes('/seo')) return 'seo';
    return 'general';
  };

  const activeTab = getActiveTab();

  const handleSave = async (sectionKey, data) => {
    await saveSettingsSection(sectionKey, data);
    setToastMessage(`${sectionKey.toUpperCase()} SETTINGS PERSISTED IN DATABASE`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyVariable = (varName) => {
    navigator.clipboard.writeText(varName);
    setToastMessage(`COPIED VARIABLE ${varName}`);
    setTimeout(() => setToastMessage(null), 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fadeIn font-sans">
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
            SYSTEM ARCHITECTURE // SETTINGS
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-wider text-neutral-900 uppercase">
            STOREFRONT & INQUIRY CONFIGURATION
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3 font-mono text-xs">
        {[
          { id: 'general', path: '/admin/settings/general', label: 'GENERAL', icon: Settings },
          { id: 'whatsapp', path: '/admin/settings/whatsapp', label: 'WHATSAPP INQUIRY', icon: MessageCircle },
          { id: 'social', path: '/admin/settings/social', label: 'SOCIAL LINKS', icon: Share2 },
          { id: 'seo', path: '/admin/settings/seo', label: 'SEO METADATA', icon: Search }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`flex items-center gap-2 px-4 py-2.5 transition-all border font-bold uppercase tracking-wider ${
                isActive
                  ? 'bg-lime-400 text-neutral-900 border-lime-500 shadow-xs'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:text-neutral-900 hover:border-neutral-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave('general', settings.general);
          }}
          className="bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6"
        >
          <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-mono text-neutral-800 tracking-[0.25em] uppercase font-bold">
              GENERAL BRAND & CONTACT CONFIGURATION
            </h3>
            <span className="text-[10px] font-mono text-neutral-600 font-bold">DATABASE STORED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">BRAND NAME</label>
              <input
                type="text"
                value={settings.general.brandName || ''}
                onChange={(e) => setSettingsState({ ...settings, general: { ...settings.general, brandName: e.target.value } })}
                className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 outline-none focus:border-neutral-900 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">TAGLINE</label>
              <input
                type="text"
                value={settings.general.tagline || ''}
                onChange={(e) => setSettingsState({ ...settings, general: { ...settings.general, tagline: e.target.value } })}
                className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 outline-none focus:border-neutral-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">CONTACT EMAIL (venm1310@gmail.com)</label>
              <input
                type="email"
                value={settings.general.contactEmail || ''}
                onChange={(e) => setSettingsState({ ...settings, general: { ...settings.general, contactEmail: e.target.value } })}
                className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 outline-none focus:border-neutral-900 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">CONTACT PHONE NUMBER</label>
              <input
                type="text"
                value={settings.general.contactPhone || ''}
                onChange={(e) => setSettingsState({ ...settings, general: { ...settings.general, contactPhone: e.target.value } })}
                className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 outline-none focus:border-neutral-900 font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">FOOTER BRAND TEXT</label>
            <textarea
              rows="3"
              value={settings.general.footerText || ''}
              onChange={(e) => setSettingsState({ ...settings, general: { ...settings.general, footerText: e.target.value } })}
              className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 outline-none focus:border-neutral-900 font-sans resize-none"
            />
          </div>

          <div className="pt-4 border-t border-neutral-200 flex justify-end">
            <button
              type="submit"
              className="btn-venm-primary px-8 py-3 text-xs font-bold tracking-widest uppercase flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-white" />
              <span>SAVE GENERAL SETTINGS</span>
            </button>
          </div>
        </form>
      )}

      {/* WhatsApp Settings */}
      {activeTab === 'whatsapp' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave('whatsapp', settings.whatsapp);
          }}
          className="bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6"
        >
          <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono text-neutral-800 tracking-[0.25em] uppercase font-bold">
                WHATSAPP INQUIRY ROUTING & TEMPLATES
              </h3>
              <p className="text-[11px] font-mono text-neutral-700 font-medium">
                Updates public catalog inquiry buttons and pre-filled WhatsApp message generator.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">
                BUSINESS WHATSAPP NUMBER (+91 96649 84749)
              </label>
              <input
                type="text"
                value={settings.whatsapp.number || ''}
                onChange={(e) => setSettingsState({
                  ...settings,
                  whatsapp: {
                    ...settings.whatsapp,
                    number: e.target.value,
                    rawNumber: e.target.value.replace(/[^0-9]/g, '')
                  }
                })}
                className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 font-mono font-bold outline-none focus:border-neutral-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">INQUIRY BUTTON LABEL</label>
              <input
                type="text"
                value={settings.whatsapp.buttonText || ''}
                onChange={(e) => setSettingsState({ ...settings, whatsapp: { ...settings.whatsapp, buttonText: e.target.value } })}
                className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 font-mono font-bold outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="whatsapp-enabled"
              checked={settings.whatsapp.enabled !== false}
              onChange={(e) => setSettingsState({
                ...settings,
                whatsapp: { ...settings.whatsapp, enabled: e.target.checked }
              })}
              className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
            />
            <label htmlFor="whatsapp-enabled" className="text-xs font-mono text-neutral-900 tracking-wider uppercase font-bold">
              ENABLE WHATSAPP INQUIRIES ACROSS CATALOG
            </label>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[11px] font-bold text-neutral-800 tracking-widest uppercase block">
              DEFAULT INQUIRY MESSAGE TEMPLATE
            </label>

            <textarea
              rows="6"
              value={settings.whatsapp.defaultTemplate || ''}
              onChange={(e) => setSettingsState({ ...settings, whatsapp: { ...settings.whatsapp, defaultTemplate: e.target.value } })}
              className="w-full bg-neutral-50 border border-neutral-300 px-4 py-3 text-xs text-neutral-900 font-mono leading-relaxed outline-none focus:border-neutral-900 resize-none"
            />

            <div className="space-y-2 p-3 bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-mono text-neutral-800 font-bold tracking-widest uppercase block">
                SUPPORTED DYNAMIC VARIABLES (CLICK TO COPY):
              </span>
              <div className="flex flex-wrap gap-2">
                {['{{product_name}}', '{{collection}}', '{{category}}', '{{size}}', '{{product_url}}', '{{brand_name}}'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleCopyVariable(v)}
                    className="px-2.5 py-1 bg-white border border-neutral-300 text-neutral-900 text-[10px] font-mono font-bold flex items-center gap-1 hover:border-neutral-900 hover:bg-neutral-100"
                  >
                    <span>{v}</span>
                    <Copy className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 flex justify-end">
            <button
              type="submit"
              className="btn-venm-primary px-8 py-3 text-xs font-bold tracking-widest uppercase flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-white" />
              <span>SAVE WHATSAPP CONFIGURATION</span>
            </button>
          </div>
        </form>
      )}

      {/* Social Settings */}
      {activeTab === 'social' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave('social', settings.social);
          }}
          className="bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6"
        >
          <h3 className="text-xs font-mono text-neutral-800 tracking-[0.25em] uppercase border-b border-neutral-200 pb-3 font-bold">
            SOCIAL MEDIA CHANNELS
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 uppercase block">INSTAGRAM PROFILE URL</label>
              <input
                type="text"
                value={settings.social.instagram || ''}
                onChange={(e) => setSettingsState({ ...settings, social: { ...settings.social, instagram: e.target.value } })}
                className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 font-mono outline-none focus:border-neutral-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 uppercase block">FACEBOOK PAGE URL</label>
              <input
                type="text"
                value={settings.social.facebook || ''}
                onChange={(e) => setSettingsState({ ...settings, social: { ...settings.social, facebook: e.target.value } })}
                className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 font-mono outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 flex justify-end">
            <button
              type="submit"
              className="btn-venm-primary px-8 py-3 text-xs font-bold tracking-widest uppercase flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-white" />
              <span>SAVE SOCIAL SETTINGS</span>
            </button>
          </div>
        </form>
      )}

      {/* SEO Settings */}
      {activeTab === 'seo' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave('seo', settings.seo);
          }}
          className="bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6"
        >
          <h3 className="text-xs font-mono text-neutral-800 tracking-[0.25em] uppercase border-b border-neutral-200 pb-3 font-bold">
            SEARCH ENGINE OPTIMIZATION & OG METADATA
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 uppercase block">DEFAULT SITE TITLE</label>
              <input
                type="text"
                value={settings.seo.siteTitle || ''}
                onChange={(e) => setSettingsState({ ...settings, seo: { ...settings.seo, siteTitle: e.target.value } })}
                className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 font-mono outline-none focus:border-neutral-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 uppercase block">META DESCRIPTION</label>
              <textarea
                rows="3"
                value={settings.seo.metaDescription || ''}
                onChange={(e) => setSettingsState({ ...settings, seo: { ...settings.seo, metaDescription: e.target.value } })}
                className="w-full bg-neutral-50 border border-neutral-300 px-4 py-2.5 text-xs text-neutral-900 font-sans outline-none focus:border-neutral-900 resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 flex justify-end">
            <button
              type="submit"
              className="btn-venm-primary px-8 py-3 text-xs font-bold tracking-widest uppercase flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-white" />
              <span>SAVE SEO METADATA</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettings;
