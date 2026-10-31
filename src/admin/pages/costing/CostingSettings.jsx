import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  ShieldAlert,
  Package,
  Truck
} from 'lucide-react';
import { apiGetCostingSettings, apiUpdateCostingSettings } from '../../../services/api';

const CostingSettings = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    defaultTargetMargin: 50,
    currency: 'INR',
    defaultPackagingCost: 45,
    defaultShippingCost: 100,
    defaultGiftCost: 0,
    defaultAllocationMethod: 'QUANTITY',
    taxPreference: 'EXCLUSIVE',
    lowMarginThreshold: 35,
    criticalMarginThreshold: 20
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await apiGetCostingSettings();
        if (res.data) {
          setFormData({
            defaultTargetMargin: res.data.defaultTargetMargin ?? 50,
            currency: res.data.currency || 'INR',
            defaultPackagingCost: res.data.defaultPackagingCost ?? 45,
            defaultShippingCost: res.data.defaultShippingCost ?? 100,
            defaultGiftCost: res.data.defaultGiftCost ?? 0,
            defaultAllocationMethod: res.data.defaultAllocationMethod || 'QUANTITY',
            taxPreference: res.data.taxPreference || 'EXCLUSIVE',
            lowMarginThreshold: res.data.lowMarginThreshold ?? 35,
            criticalMarginThreshold: res.data.criticalMarginThreshold ?? 20
          });
        }
      } catch (err) {
        showToast('FAILED TO LOAD SETTINGS: ' + err.message, true);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiUpdateCostingSettings({
        ...formData,
        defaultTargetMargin: Number(formData.defaultTargetMargin),
        defaultPackagingCost: Number(formData.defaultPackagingCost),
        defaultShippingCost: Number(formData.defaultShippingCost),
        defaultGiftCost: Number(formData.defaultGiftCost),
        lowMarginThreshold: Number(formData.lowMarginThreshold),
        criticalMarginThreshold: Number(formData.criticalMarginThreshold)
      });
      showToast('COSTING SETTINGS UPDATED SUCCESSFULLY');
    } catch (err) {
      showToast('SAVE FAILED: ' + err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-neutral-500 font-mono">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-neutral-400" />
        LOADING COSTING SETTINGS...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 font-extrabold text-xs tracking-widest uppercase shadow-2xl flex items-center gap-2 border ${
            toast.isError ? 'bg-red-600 text-white border-red-700' : 'bg-lime-400 text-neutral-900 border-lime-500'
          }`}
        >
          {toast.isError ? <AlertTriangle className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-neutral-900" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-black font-mono tracking-wider text-neutral-900 uppercase">
          GLOBAL COSTING & ALLOCATION PREFERENCES
        </h2>
        <p className="text-xs text-neutral-600 font-sans">
          Configure default retail margins, baseline packaging & shipping rates, and low-margin warning thresholds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Default Pricing & Margins */}
        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-4">
          <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-neutral-800 block border-b border-neutral-100 pb-2">
            1. DEFAULT TARGET MARGIN & CURRENCY
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                Default Target Gross Margin (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="95"
                  required
                  value={formData.defaultTargetMargin}
                  onChange={(e) => setFormData({ ...formData, defaultTargetMargin: e.target.value })}
                  className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono font-bold bg-white focus:outline-hidden focus:border-black"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-neutral-400 text-xs">%</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Default margin applied when calculating Suggested Selling Price on new products
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                Base Currency Code
              </label>
              <input
                type="text"
                disabled
                value={formData.currency}
                className="w-full border border-neutral-200 px-3 py-2 text-xs font-mono bg-neutral-100 text-neutral-500 font-bold"
              />
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Standard Indian Rupee (INR - ₹)
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Order Expense Defaults & Allocation */}
        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-4">
          <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-neutral-800 block border-b border-neutral-100 pb-2">
            2. ORDER VARIABLE EXPENSE DEFAULTS
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                Default Packaging Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.defaultPackagingCost}
                onChange={(e) => setFormData({ ...formData, defaultPackagingCost: e.target.value })}
                className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono font-bold bg-white focus:outline-hidden focus:border-black"
              />
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Rigid box + polybag + stickers
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                Default Shipping Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.defaultShippingCost}
                onChange={(e) => setFormData({ ...formData, defaultShippingCost: e.target.value })}
                className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono font-bold bg-white focus:outline-hidden focus:border-black"
              />
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Domestic express courier fee
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                Default Allocation Method
              </label>
              <select
                value={formData.defaultAllocationMethod}
                onChange={(e) => setFormData({ ...formData, defaultAllocationMethod: e.target.value })}
                className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white"
              >
                <option value="QUANTITY">By Item Quantity (Pro-rata)</option>
                <option value="REVENUE">By Item Revenue (Pro-rata)</option>
                <option value="EQUAL">Equal Split Per Item</option>
              </select>
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Applies when distributing shared expenses
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Margin Safeguard Thresholds */}
        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-4">
          <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-neutral-800 block border-b border-neutral-100 pb-2">
            3. MARGIN SAFEGUARD ALERTS & THRESHOLDS
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-amber-700 mb-1">
                Low Margin Warning Threshold (%)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={formData.lowMarginThreshold}
                onChange={(e) => setFormData({ ...formData, lowMarginThreshold: e.target.value })}
                className="w-full border border-amber-300 px-3 py-2 text-xs font-mono font-bold bg-amber-50/50"
              />
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Products/orders with margin below this % are flagged with yellow alerts
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-red-700 mb-1">
                Critical Margin Alert Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.criticalMarginThreshold}
                onChange={(e) => setFormData({ ...formData, criticalMarginThreshold: e.target.value })}
                className="w-full border border-red-300 px-3 py-2 text-xs font-mono font-bold bg-red-50/50"
              />
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Margins below this % generate critical red highlight alerts
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-venm-neon px-6 py-3 text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4 text-neutral-900" />
            <span>{submitting ? 'SAVING...' : 'SAVE CONFIGURATION'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CostingSettings;

