import React, { useState, useEffect } from 'react';
import {
  Mail,
  Users,
  UserCheck,
  UserX,
  ShieldBan,
  Download,
  Search,
  Filter,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Eye,
  Check,
  Ban,
  Layers,
  ShoppingBag,
  Scissors,
  Tag,
  Megaphone,
  FileText
} from 'lucide-react';
import {
  apiGetAdminSubscribers,
  apiExportSubscribersCsv,
  apiUpdateSubscriberStatus,
  apiSuppressEmail,
  apiGetEmailCampaigns,
  apiCreateEmailCampaign,
  apiApproveEmailCampaign,
  apiTestEmailCampaign,
  apiSendEmailCampaign
} from '../../services/api';

const CAMPAIGN_TEMPLATES = [
  {
    type: 'COLLECTION_ANNOUNCEMENT',
    name: 'Collection Announcement',
    icon: Layers,
    defaultSubject: 'REVEAL // THE NEW VENM COLLECTION HAS ARRIVED',
    defaultTitle: 'A NEW ERA OF METROPOLITAN GUJARATI SILHOUETTES',
    defaultHtml: `<p>We are proud to present our newest archival collection — where heritage textiles meet contemporary oversized tailoring.</p>
<p>Crafted in limited quantities in Ahmedabad, each piece reflects meticulous hand-finishing, structured fabrics, and an unapologetic silhouette.</p>
<p>Browse the digital lookbook and explore the full lineup now online.</p>`
  },
  {
    type: 'PRODUCT_DROP',
    name: 'Product Drop',
    icon: ShoppingBag,
    defaultSubject: 'LIMITED DROP // ARCHIVAL STATEMENT PIECES NOW LIVE',
    defaultTitle: 'NEW STATEMENT PIECES HAVE ENTERED THE ARCHIVE',
    defaultHtml: `<p>Fresh reference designs have just been added to the VENM public catalog.</p>
<p>Featuring raw denim constructions, tactical closures, and reflective embroidery. Availability is strictly on a bespoke order basis.</p>`
  },
  {
    type: 'CUSTOM_SERVICES',
    name: 'Custom Fashion Services',
    icon: Scissors,
    defaultSubject: 'BESPOKE TAILORING // PRIVATE VENM ATELIER APPOINTMENTS',
    defaultTitle: 'PERSONALIZED EMBROIDERY & BESPOKE CUSTOMIZATION',
    defaultHtml: `<p>Bring your distinct vision to life with the VENM Atelier.</p>
<p>Whether you require fit adjustments, custom festival embroidery, or hybrid fabric sourcing, our Ahmedabad studio coordinates direct consultations via WhatsApp and catalog appointments.</p>`
  },
  {
    type: 'SPECIAL_OFFER',
    name: 'Special Offers',
    icon: Tag,
    defaultSubject: 'EXCLUSIVE PRIVILEGE // PRIVATE SUBSCRIBER ACCESS',
    defaultTitle: 'COMPLIMENTARY BESPOKE FITTING ON YOUR NEXT REQUEST',
    defaultHtml: `<p>As a valued subscriber, enjoy complimentary styling and custom sizing consultations on your next garment inquiry.</p>
<p>Quote your subscriber email when sending your next bespoke request on WhatsApp or the catalog inquiry form.</p>`
  },
  {
    type: 'BRAND_ANNOUNCEMENT',
    name: 'Brand Announcement',
    icon: Megaphone,
    defaultSubject: 'DISPATCH // IMPORTANT UPDATE FROM VENM STUDIO',
    defaultTitle: 'STUDIO DISPATCH // EXPANDING THE VENM UNIVERSE',
    defaultHtml: `<p>Reflecting on our journey fusing Gujarati heritage with avant-garde streetwear.</p>
<p>Explore our updated catalog design, enhanced lookbooks, and upcoming cultural releases directly on the platform.</p>`
  }
];

const AdminEmailMarketing = () => {
  const [activeTab, setActiveTab] = useState('subscribers'); // 'subscribers' | 'campaigns' | 'suppression'

  // Toast notifications
  const [toastMessage, setToastMessage] = useState(null);
  const [isErrorToast, setIsErrorToast] = useState(false);

  const showToast = (msg, isErr = false) => {
    setToastMessage(msg);
    setIsErrorToast(isErr);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ----------------------------------------------------
  // SUBSCRIBERS STATE
  // ----------------------------------------------------
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, suppressed: 0, consentRate: 100 });
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadSubscribers = async () => {
    setIsLoadingSubscribers(true);
    try {
      const data = await apiGetAdminSubscribers({
        search: subscriberSearch,
        status: statusFilter,
        limit: 50
      });
      setSubscribers(data.subscribers || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      showToast('FAILED TO LOAD SUBSCRIBERS: ' + err.message, true);
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadSubscribers();
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await apiExportSubscribersCsv();
      if (!res.ok) throw new Error('Export request failed: ' + res.status);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `venm_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('SUBSCRIBER CSV EXPORT DOWNLOADED');
    } catch (err) {
      showToast('EXPORT FAILED: ' + err.message, true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiUpdateSubscriberStatus(id, newStatus, 'ADMIN_MANUAL_CHANGE');
      showToast(`SUBSCRIBER STATUS UPDATED TO ${newStatus}`);
      loadSubscribers();
    } catch (err) {
      showToast('FAILED TO UPDATE STATUS: ' + err.message, true);
    }
  };

  // ----------------------------------------------------
  // SUPPRESSION STATE
  // ----------------------------------------------------
  const [suppressEmailInput, setSuppressEmailInput] = useState('');
  const [suppressReason, setSuppressReason] = useState('USER_REQUEST');
  const [isSuppressing, setIsSuppressing] = useState(false);

  const handleManualSuppress = async (e) => {
    e.preventDefault();
    if (!suppressEmailInput.trim()) return;
    setIsSuppressing(true);
    try {
      await apiSuppressEmail(suppressEmailInput.trim(), suppressReason);
      showToast(`EMAIL ${suppressEmailInput} ADDED TO SUPPRESSION LIST`);
      setSuppressEmailInput('');
      loadSubscribers();
    } catch (err) {
      showToast('SUPPRESSION FAILED: ' + err.message, true);
    } finally {
      setIsSuppressing(false);
    }
  };

  // ----------------------------------------------------
  // CAMPAIGNS STATE
  // ----------------------------------------------------
  const [campaigns, setCampaigns] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(CAMPAIGN_TEMPLATES[0]);
  const [campaignForm, setCampaignForm] = useState({
    title: CAMPAIGN_TEMPLATES[0].defaultTitle,
    subject: CAMPAIGN_TEMPLATES[0].defaultSubject,
    previewText: 'Exclusive drop notification from VENM Studio.',
    campaignType: CAMPAIGN_TEMPLATES[0].type,
    contentHtml: CAMPAIGN_TEMPLATES[0].defaultHtml
  });
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [activePreviewCampaign, setActivePreviewCampaign] = useState(null);

  const loadCampaigns = async () => {
    try {
      const data = await apiGetEmailCampaigns();
      setCampaigns(data || []);
    } catch (err) {
      console.warn('Failed to load campaigns:', err.message);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setCampaignForm({
      title: template.defaultTitle,
      subject: template.defaultSubject,
      previewText: `Exclusive ${template.name.toLowerCase()} from VENM Studio.`,
      campaignType: template.type,
      contentHtml: template.defaultHtml
    });
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.title || !campaignForm.subject || !campaignForm.contentHtml) {
      showToast('TITLE, SUBJECT AND CONTENT ARE REQUIRED', true);
      return;
    }
    setIsCreatingCampaign(true);
    try {
      const newCamp = await apiCreateEmailCampaign(campaignForm);
      showToast(`CAMPAIGN "${newCamp.title}" CREATED AS DRAFT`);
      loadCampaigns();
      setActivePreviewCampaign(newCamp);
    } catch (err) {
      showToast('FAILED TO CREATE CAMPAIGN: ' + err.message, true);
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleApproveCampaign = async (id) => {
    try {
      const updated = await apiApproveEmailCampaign(id);
      showToast('CAMPAIGN REVIEWED & APPROVED FOR DISPATCH');
      loadCampaigns();
      if (activePreviewCampaign?.id === id) {
        setActivePreviewCampaign(updated.campaign);
      }
    } catch (err) {
      showToast('FAILED TO APPROVE CAMPAIGN: ' + err.message, true);
    }
  };

  const handleSendTest = async (id) => {
    try {
      const res = await apiTestEmailCampaign(id, testEmailAddress || undefined);
      showToast(res.message || 'TEST PREVIEW SENT SUCCESSFULLY');
    } catch (err) {
      showToast('TEST DISPATCH FAILED: ' + err.message, true);
    }
  };

  const handleDispatchCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to dispatch this campaign to all active subscribers with marketing consent?')) {
      return;
    }
    setIsSendingCampaign(true);
    try {
      const res = await apiSendEmailCampaign(id);
      showToast(res.message || 'CAMPAIGN DISPATCHED TO ACTIVE SUBSCRIBERS');
      loadCampaigns();
    } catch (err) {
      showToast('DISPATCH FAILED: ' + err.message, true);
    } finally {
      setIsSendingCampaign(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-fadeIn font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 font-extrabold text-xs tracking-widest uppercase shadow-2xl flex items-center gap-2 border ${
          isErrorToast ? 'bg-red-600 text-white border-red-700' : 'bg-lime-400 text-neutral-900 border-lime-500'
        }`}>
          {isErrorToast ? <AlertTriangle className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-neutral-900" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-800 font-bold uppercase">
            AUDIENCE & MARKETING // COMPLIANCE & CAMPAIGNS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-neutral-900 uppercase">
            EMAIL MARKETING & SUBSCRIBER MANAGEMENT
          </h1>
          <p className="text-xs text-neutral-600 font-sans">
            Privacy-conscious subscriber registry, explicit affirmative consent enforcement, and approved campaign dispatches.
          </p>
        </div>

        {/* Global CSV Export */}
        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          className="px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-neutral-600" />
          <span>{isExporting ? 'EXPORTING CSV...' : 'EXPORT SUBSCRIBER CSV'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">TOTAL CONTACTS</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-3xl font-black text-neutral-900 font-mono">{stats.total}</div>
          <div className="text-[10px] text-neutral-500 font-mono">Recorded in subscriber database</div>
        </div>

        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2 border-l-4 border-l-lime-500">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-800">ACTIVE SUBSCRIBERS</span>
            <UserCheck className="w-4 h-4 text-lime-600" />
          </div>
          <div className="text-3xl font-black text-neutral-900 font-mono">{stats.active}</div>
          <div className="text-[10px] text-lime-700 font-mono font-bold">Valid affirmative marketing consent</div>
        </div>

        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">UNSUBSCRIBED</span>
            <UserX className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-3xl font-black text-neutral-900 font-mono">{stats.unsubscribed}</div>
          <div className="text-[10px] text-neutral-500 font-mono">Excluded from all future dispatches</div>
        </div>

        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">CONSENT RATE</span>
            <Sparkles className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-3xl font-black text-neutral-900 font-mono">{stats.consentRate}%</div>
          <div className="text-[10px] text-neutral-500 font-mono">Active opt-in retention ratio</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-5 py-3 text-xs font-mono tracking-wider uppercase font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'subscribers'
              ? 'border-lime-500 text-neutral-900 bg-lime-400/10'
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          SUBSCRIBERS & AUDIENCE ({stats.total})
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-5 py-3 text-xs font-mono tracking-wider uppercase font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'campaigns'
              ? 'border-lime-500 text-neutral-900 bg-lime-400/10'
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          CAMPAIGN STUDIO & DISPATCH ({campaigns.length})
        </button>

        <button
          onClick={() => setActiveTab('suppression')}
          className={`px-5 py-3 text-xs font-mono tracking-wider uppercase font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'suppression'
              ? 'border-lime-500 text-neutral-900 bg-lime-400/10'
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          SUPPRESSION & OPT-OUT LIST ({stats.suppressed + stats.unsubscribed})
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* TAB 1: SUBSCRIBERS LIST */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === 'subscribers' && (
        <div className="space-y-6">
          {/* Controls: Search & Filter */}
          <div className="bg-white p-4 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search subscriber by email address..."
                  value={subscriberSearch}
                  onChange={(e) => setSubscriberSearch(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-sans"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-mono uppercase font-bold cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono tracking-wider text-neutral-500 font-bold uppercase">
                FILTER:
              </span>
              {[
                { label: 'ALL', value: '' },
                { label: 'ACTIVE', value: 'SUBSCRIBED' },
                { label: 'UNSUBSCRIBED', value: 'UNSUBSCRIBED' },
                { label: 'SUPPRESSED', value: 'SUPPRESSED' }
              ].map((f) => (
                <button
                  key={f.label}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase border cursor-pointer transition-all ${
                    statusFilter === f.value
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-neutral-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-mono uppercase text-neutral-600 tracking-wider">
                  <th className="py-3 px-4">SUBSCRIBER EMAIL</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">MARKETING CONSENT</th>
                  <th className="py-3 px-4">CONSENT SOURCE</th>
                  <th className="py-3 px-4">JOINED DATE</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs font-sans">
                {isLoadingSubscribers ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs font-mono text-neutral-500">
                      LOADING SUBSCRIBER REGISTRY...
                    </td>
                  </tr>
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs font-mono text-neutral-500">
                      NO SUBSCRIBERS FOUND MATCHING CRITERIA.
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => {
                    const isSubscribed = sub.status === 'SUBSCRIBED';
                    const isSuppressed = sub.status === 'SUPPRESSED';
                    return (
                      <tr key={sub.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900">
                          {sub.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-mono uppercase font-extrabold border ${
                            isSubscribed
                              ? 'bg-lime-100 text-lime-900 border-lime-300'
                              : isSuppressed
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {sub.marketingConsent ? (
                            <span className="flex items-center gap-1.5 text-lime-700 font-mono text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>AFFIRMATIVE OPT-IN</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-neutral-500 font-mono text-[11px]">
                              <UserX className="w-3.5 h-3.5" />
                              <span>REVOKED</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-600 text-[11px]">
                          {sub.consentSource || 'POPUP'} (v{sub.consentVersion || '1.0'})
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-600 text-[11px]">
                          {new Date(sub.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isSubscribed ? (
                              <button
                                onClick={() => handleStatusChange(sub.id, 'UNSUBSCRIBED')}
                                className="px-2.5 py-1 text-[10px] font-mono text-red-700 hover:bg-red-50 border border-red-200 uppercase font-bold cursor-pointer"
                                title="Unsubscribe this contact"
                              >
                                Opt-Out
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(sub.id, 'SUBSCRIBED')}
                                className="px-2.5 py-1 text-[10px] font-mono text-lime-800 hover:bg-lime-50 border border-lime-300 uppercase font-bold cursor-pointer"
                                title="Reactivate subscription"
                              >
                                Resubscribe
                              </button>
                            )}
                            {!isSuppressed && (
                              <button
                                onClick={() => handleStatusChange(sub.id, 'SUPPRESSED')}
                                className="px-2.5 py-1 text-[10px] font-mono text-neutral-600 hover:bg-neutral-100 border border-neutral-300 uppercase font-bold cursor-pointer"
                                title="Add to suppression list"
                              >
                                Suppress
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 2: CAMPAIGN STUDIO */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Campaign Preparation Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 border border-neutral-200 shadow-xs space-y-5">
              <div className="border-b border-neutral-200 pb-3 space-y-1">
                <span className="text-[10px] font-mono text-neutral-600 font-bold uppercase tracking-wider">
                  STEP 1 // PREPARE CAMPAIGN
                </span>
                <h3 className="text-lg font-black uppercase text-neutral-900 tracking-wide">
                  Draft New Email Campaign
                </h3>
              </div>

              {/* Template Selectors */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold uppercase text-neutral-700 block">
                  SELECT CAMPAIGN TYPE & TEMPLATE
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CAMPAIGN_TEMPLATES.map((tpl) => {
                    const Icon = tpl.icon;
                    const isSelected = selectedTemplate.type === tpl.type;
                    return (
                      <button
                        key={tpl.type}
                        type="button"
                        onClick={() => handleTemplateSelect(tpl)}
                        className={`p-3 text-left border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-lime-400' : 'text-neutral-500'}`} />
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider">{tpl.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold uppercase text-neutral-700 block">
                    CAMPAIGN INTERNAL TITLE
                  </label>
                  <input
                    type="text"
                    required
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-sans font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold uppercase text-neutral-700 block">
                    EMAIL SUBJECT LINE (VISIBLE TO SUBSCRIBERS)
                  </label>
                  <input
                    type="text"
                    required
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-sans font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold uppercase text-neutral-700 block">
                    PREVIEW TEXT / PREHEADER
                  </label>
                  <input
                    type="text"
                    value={campaignForm.previewText}
                    onChange={(e) => setCampaignForm({ ...campaignForm, previewText: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold uppercase text-neutral-700 block">
                    CAMPAIGN HTML / EDITORIAL BODY
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={campaignForm.contentHtml}
                    onChange={(e) => setCampaignForm({ ...campaignForm, contentHtml: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono block">
                    HTML tags supported. Unsubscribe compliance footer and VENM branding are appended automatically.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingCampaign}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-mono uppercase font-bold tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 text-lime-400" />
                  <span>{isCreatingCampaign ? 'SAVING DRAFT...' : 'CREATE CAMPAIGN DRAFT'}</span>
                </button>
              </form>
            </div>

            {/* Campaign Registry & History */}
            <div className="bg-white p-6 border border-neutral-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-800">
                  CAMPAIGN REGISTRY & TRANSMISSION STATUS
                </h4>
                <span className="text-[10px] font-mono text-neutral-500 font-bold">
                  {campaigns.length} RECORDED
                </span>
              </div>

              {campaigns.length === 0 ? (
                <p className="text-xs text-neutral-500 font-mono py-4 text-center">
                  NO CAMPAIGNS PREPARED YET. USE THE FORM ABOVE TO DRAFT ONE.
                </p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((c) => {
                    const isDraft = c.status === 'DRAFT';
                    const isApproved = c.status === 'APPROVED';
                    const isSent = c.status === 'SENT';

                    return (
                      <div
                        key={c.id}
                        className={`p-4 border transition-all space-y-3 ${
                          activePreviewCampaign?.id === c.id
                            ? 'border-lime-500 bg-lime-50/20 shadow-xs'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase font-extrabold border ${
                            isSent
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : isApproved
                              ? 'bg-lime-100 text-lime-900 border-lime-300'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          }`}>
                            {c.status}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500 font-bold">
                            {new Date(c.createdAt).toLocaleDateString('en-GB')}
                          </span>
                        </div>

                        <div>
                          <h5 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide">
                            {c.title}
                          </h5>
                          <p className="text-xs text-neutral-600 font-mono line-clamp-1">
                            {c.subject}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
                          <button
                            onClick={() => setActivePreviewCampaign(c)}
                            className="px-2.5 py-1 text-[10px] font-mono border border-neutral-300 text-neutral-700 hover:bg-neutral-50 uppercase font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>

                          {isDraft && (
                            <button
                              onClick={() => handleApproveCampaign(c.id)}
                              className="px-2.5 py-1 text-[10px] font-mono bg-lime-400 hover:bg-lime-300 text-black uppercase font-extrabold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Review & Approve</span>
                            </button>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleDispatchCampaign(c.id)}
                              disabled={isSendingCampaign}
                              className="px-3 py-1 text-[10px] font-mono bg-neutral-900 hover:bg-black text-white uppercase font-extrabold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Send className="w-3 h-3 text-lime-400" />
                              <span>{isSendingCampaign ? 'DISPATCHING...' : `Dispatch (${stats.active} Contacts)`}</span>
                            </button>
                          )}

                          {isSent && (
                            <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Dispatched to {c.recipientCount} contact(s)</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Luxury Preview & Test Dispatch */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-neutral-950 p-6 border border-neutral-800 shadow-xl text-neutral-200 space-y-4 sticky top-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-[0.25em] text-lime-400 font-bold uppercase">
                    EMAIL RENDERING PREVIEW
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">
                  LUXURY RESPONSIVE
                </span>
              </div>

              {/* Subject Bar */}
              <div className="p-3 bg-neutral-900 border border-neutral-800 space-y-1">
                <div className="text-[10px] font-mono text-neutral-400 uppercase font-bold">
                  SUBJECT:
                </div>
                <div className="text-xs font-mono font-bold text-white">
                  {activePreviewCampaign?.subject || campaignForm.subject}
                </div>
              </div>

              {/* Rendered Email Container */}
              <div className="border border-neutral-800 bg-[#0A0A0A] p-5 space-y-4 max-h-[460px] overflow-y-auto custom-scrollbar font-sans">
                {/* Header */}
                <div className="text-center pb-4 border-b-2 border-lime-400">
                  <div className="text-xl font-black tracking-[0.3em] font-mono text-white uppercase">
                    V E N M
                  </div>
                  <div className="text-[8px] font-mono tracking-[0.2em] text-lime-400 uppercase">
                    AHMEDABAD // GUJARAT ETHOS
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-3 pt-2">
                  <span className="inline-block px-2 py-0.5 text-[8px] font-mono bg-neutral-900 border border-neutral-800 text-lime-400 uppercase tracking-wider">
                    {activePreviewCampaign?.campaignType || campaignForm.campaignType}
                  </span>

                  <h3 className="text-base font-extrabold uppercase text-white tracking-wide">
                    {activePreviewCampaign?.title || campaignForm.title}
                  </h3>

                  <div
                    className="text-xs text-neutral-300 leading-relaxed font-sans space-y-2"
                    dangerouslySetInnerHTML={{
                      __html: activePreviewCampaign?.contentHtml || campaignForm.contentHtml
                    }}
                  />

                  <div className="text-center pt-3 pb-1">
                    <span className="inline-block px-4 py-2 bg-lime-400 text-black text-[10px] font-mono font-extrabold uppercase tracking-widest">
                      EXPLORE THE DROP &rarr;
                    </span>
                  </div>
                </div>

                {/* Compliance Footer */}
                <div className="pt-4 border-t border-neutral-900 text-[9px] font-mono text-neutral-500 text-center leading-relaxed">
                  <p className="text-neutral-400 font-bold mb-1">VENM LUXURY STREETWEAR & BESPOKE CATALOG</p>
                  <p>Ahmedabad, Gujarat &bull; venm1310@gmail.com</p>
                  <p className="mt-2 text-neutral-500">
                    You received this because you opted in to promotional updates.
                  </p>
                  <div className="mt-1.5 pt-1.5 border-t border-neutral-900 text-neutral-400">
                    <span className="text-lime-400 underline">Unsubscribe from Marketing</span>
                  </div>
                </div>
              </div>

              {/* Test Dispatch Bar */}
              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">
                  SEND TEST PREVIEW TO ADMIN
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="admin@venm.exe or test email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-lime-400 font-mono"
                  />
                  <button
                    onClick={() => handleSendTest(activePreviewCampaign?.id || campaigns[0]?.id)}
                    disabled={!activePreviewCampaign && campaigns.length === 0}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono font-bold uppercase border border-neutral-600 disabled:opacity-40 cursor-pointer"
                  >
                    Send Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 3: SUPPRESSION MANAGEMENT */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === 'suppression' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="border-b border-neutral-200 pb-3 space-y-1">
              <div className="flex items-center gap-2">
                <ShieldBan className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-black uppercase text-neutral-900 tracking-wide">
                  Manual Suppression & Do-Not-Contact List
                </h3>
              </div>
              <p className="text-xs text-neutral-600 font-sans">
                Suppressed email addresses are permanently barred from receiving promotional campaigns under compliance rules.
              </p>
            </div>

            <form onSubmit={handleManualSuppress} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold uppercase text-neutral-700 block">
                  EMAIL ADDRESS TO SUPPRESS
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={suppressEmailInput}
                  onChange={(e) => setSuppressEmailInput(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold uppercase text-neutral-700 block">
                  SUPPRESSION REASON
                </label>
                <select
                  value={suppressReason}
                  onChange={(e) => setSuppressReason(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-sans"
                >
                  <option value="USER_REQUEST">User Direct Opt-Out Request</option>
                  <option value="BOUNCED_ADDRESS">Hard Bounced / Undeliverable</option>
                  <option value="COMPLIANCE_ENFORCEMENT">Regulatory / Legal Compliance</option>
                  <option value="ADMIN_SUPPRESSION">Administrative Exclusion</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSuppressing}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-mono uppercase font-bold tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>{isSuppressing ? 'SUPPRESSING...' : 'ADD TO SUPPRESSION LIST'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailMarketing;

