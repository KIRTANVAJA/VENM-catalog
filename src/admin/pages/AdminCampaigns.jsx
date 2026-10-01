import React, { useState, useEffect } from 'react';
import { apiGetCampaigns, apiUpdateCampaign } from '../../services/api';
import { Sparkles, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([
    {
      id: 'camp-1',
      name: 'NAVRATRI EDIT 2026',
      status: 'ACTIVE',
      startDate: '2026-09-15',
      announcement: 'NAVRATRI EDIT 2026 — EXCLUSIVE ARCHIVAL DROPS NOW LIVE',
      festivalControls: {
        lights: true,
        dandiya: true,
        chunri: false,
        bangles: true,
        festivalGlow: false
      }
    }
  ]);
  const [activeCamp, setActiveCamp] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isErrorToast, setIsErrorToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiGetCampaigns()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCampaigns(data);
          setActiveCamp(data[0]);
        } else {
          setActiveCamp(campaigns[0]);
        }
      })
      .catch(() => {
        setActiveCamp(campaigns[0]);
      });
  }, []);

  if (!activeCamp) return null;

  const handleToggleControl = (controlKey) => {
    const updatedControls = {
      ...activeCamp.festivalControls,
      [controlKey]: !activeCamp.festivalControls?.[controlKey]
    };
    const updatedCamp = { ...activeCamp, festivalControls: updatedControls };
    setActiveCamp(updatedCamp);
    setCampaigns(campaigns.map(c => c.id === updatedCamp.id ? updatedCamp : c));
  };

  const handleSave = async () => {
    if (!activeCamp || isSaving) return;
    setIsSaving(true);
    try {
      const returnedCamp = await apiUpdateCampaign(activeCamp.id, activeCamp);
      const finalCamp = returnedCamp || activeCamp;
      setActiveCamp(finalCamp);
      setCampaigns(prev => prev.map(c => c.id === finalCamp.id ? finalCamp : c));
      setIsErrorToast(false);
      setToastMessage('CAMPAIGN CONTROLS SAVED TO DATABASE');
    } catch (err) {
      setIsErrorToast(true);
      setToastMessage('SAVE FAILED: ' + (err.message || 'DATABASE ERROR'));
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fadeIn font-sans">
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 font-extrabold text-xs tracking-widest uppercase shadow-xl flex items-center gap-2 border ${
          isErrorToast ? 'bg-red-600 text-white border-red-700' : 'bg-lime-400 text-neutral-900 border-lime-500'
        }`}>
          {isErrorToast ? <AlertTriangle className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-neutral-900" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-800 font-bold uppercase">
            CONTENT CMS // CAMPAIGN MANAGER
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-wider text-neutral-900 uppercase">
            SEASONAL CAMPAIGNS & FESTIVAL OVERLAYS
          </h2>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-venm-neon px-6 py-2.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-neutral-900" />
          <span>{isSaving ? 'SAVING TO DB...' : 'SAVE CAMPAIGN CONTROLS'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Campaign List */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-800 font-bold uppercase block">
            CAMPAIGN REGISTRY
          </span>

          <div className="space-y-3">
            {campaigns.map((c) => {
              const isSelected = c.id === activeCamp.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveCamp(c)}
                  className={`p-4 border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-lime-400/10 border-lime-400 text-neutral-900 border-l-4 border-l-lime-400 shadow-sm'
                      : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase font-extrabold ${
                      c.status === 'ACTIVE' ? 'bg-lime-400 text-neutral-900' : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {c.status}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-600 font-bold">{c.startDate}</span>
                  </div>

                  <h4 className="text-base font-extrabold tracking-wider uppercase text-neutral-900">{c.name}</h4>
                  <p className="text-xs text-neutral-700 line-clamp-1 font-mono">{c.announcement}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Campaign Detail & Festival Controls */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-neutral-200 pb-4">
            <span className="text-[10px] font-mono text-neutral-800 font-bold tracking-widest uppercase">
              CAMPAIGN SETTINGS & VISUAL OVERLAYS
            </span>
            <h3 className="text-2xl font-black text-neutral-900 uppercase">{activeCamp.name}</h3>
          </div>

          {/* Form details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-neutral-800 font-bold text-[11px] uppercase block">ANNOUNCEMENT BANNER TEXT</label>
              <input
                type="text"
                value={activeCamp.announcement || ''}
                onChange={(e) => setActiveCamp({ ...activeCamp, announcement: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-neutral-900 font-sans font-medium outline-none focus:border-neutral-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-neutral-800 font-bold text-[11px] uppercase block">CAMPAIGN STATUS</label>
              <select
                value={activeCamp.status}
                onChange={(e) => setActiveCamp({ ...activeCamp, status: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-neutral-900 font-bold outline-none focus:border-neutral-900"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="ENDED">ENDED</option>
              </select>
            </div>
          </div>

          {/* Festival Visual Elements Control Panel */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-neutral-900 tracking-wider uppercase">
                  FESTIVAL VISUAL OVERLAY CONTROLS
                </h4>
                <p className="text-[11px] font-mono text-neutral-700 font-medium">
                  Integrates subtle Gujarati festival motifs into the public storefront
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'lights', label: 'FESTIVAL LIGHTS', desc: 'Ambient top lighting glow' },
                { key: 'dandiya', label: 'DANDIYA SLASHES', desc: 'Diagonal geometric lines' },
                { key: 'chunri', label: 'CHUNRI MOTIFS', desc: 'Bandhani tie-dye accents' },
                { key: 'bangles', label: 'BANGLES GEOMETRY', desc: 'Circular stacked borders' },
                { key: 'festivalGlow', label: 'GARBA ROTATING GLOW', desc: 'Background ring animation' }
              ].map((element) => {
                const isEnabled = activeCamp.festivalControls?.[element.key];
                return (
                  <div
                    key={element.key}
                    onClick={() => handleToggleControl(element.key)}
                    className={`p-3.5 border transition-all cursor-pointer flex items-center justify-between ${
                      isEnabled
                        ? 'bg-lime-400/10 border-lime-400 text-neutral-900 border-l-4 border-l-lime-400'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-extrabold tracking-wider uppercase block text-neutral-900">
                        {element.label}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-700">{element.desc}</span>
                    </div>

                    <span className={`px-2.5 py-0.5 text-[9px] font-mono uppercase font-bold border ${
                      isEnabled ? 'bg-lime-400 text-neutral-900 border-lime-500' : 'bg-neutral-200 text-neutral-700 border-neutral-300'
                    }`}>
                      {isEnabled ? 'ENABLED' : 'OFF'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCampaigns;
