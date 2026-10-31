import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Save,
  HelpCircle,
  RefreshCw,
  Sliders
} from 'lucide-react';
import {
  apiGetProductCostingById,
  apiCreateProductCosting,
  apiUpdateProductCosting,
  apiGetCostCategories,
  apiGetProducts
} from '../../../services/api';

const ProductCostingForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = mode === 'edit' || Boolean(id);

  // Categories & Catalog Products for selector
  const [categories, setCategories] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    sku: '',
    category: '',
    collection: '',
    productType: 'STANDARD',
    size: '',
    color: '',
    batchQuantity: 1,
    targetMargin: 50,
    actualSellingPrice: 0,
    status: 'ACTIVE',
    notes: '',
    components: []
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  };

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Load Categories
        const catRes = await apiGetCostCategories();
        if (catRes.data) setCategories(catRes.data);

        // Load Catalog Products for linking
        const prodRes = await apiGetProducts({ limit: 100 });
        if (prodRes.products) setCatalogProducts(prodRes.products);

        // If edit mode, load existing profile
        if (isEdit && id) {
          const res = await apiGetProductCostingById(id);
          const data = res.data;
          setFormData({
            productId: data.productId || '',
            productName: data.productName || '',
            sku: data.sku || '',
            category: data.category || '',
            collection: data.collection || '',
            productType: data.productType || 'STANDARD',
            size: data.size || '',
            color: data.color || '',
            batchQuantity: data.batchQuantity || 1,
            targetMargin: data.targetMargin || 50,
            actualSellingPrice: data.actualSellingPrice || 0,
            status: data.status || 'ACTIVE',
            notes: data.notes || '',
            components: (data.components || []).map((c) => ({
              categoryId: c.categoryId || '',
              categoryName: c.categoryName || '',
              description: c.description || '',
              quantity: c.quantity || 1,
              unit: c.unit || 'pcs',
              unitCost: c.unitCost || 0,
              costType: c.costType || 'ACTUAL',
              supplier: c.supplier || '',
              paymentStatus: c.paymentStatus || 'PAID',
              notes: c.notes || ''
            }))
          });
        } else {
          // Default initial component row for new profile
          setFormData((prev) => ({
            ...prev,
            components: [
              {
                categoryId: '',
                categoryName: 'Base Garment',
                description: 'Blank Heavyweight Silhouette',
                quantity: 1,
                unit: 'pcs',
                unitCost: 450,
                costType: 'ACTUAL',
                supplier: '',
                paymentStatus: 'PAID',
                notes: ''
              }
            ]
          }));
        }
      } catch (err) {
        showToast('ERROR INITIALIZING FORM: ' + err.message, true);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEdit]);

  // Handle Catalog Product Link
  const handleSelectCatalogProduct = (productId) => {
    if (!productId) {
      setFormData((prev) => ({ ...prev, productId: '' }));
      return;
    }
    const found = catalogProducts.find((p) => p.id === productId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        productId: found.id,
        productName: found.name || prev.productName,
        sku: found.sku || prev.sku,
        actualSellingPrice: Number(found.price) || prev.actualSellingPrice,
        category: found.category || prev.category,
        collection: found.collection || prev.collection
      }));
    }
  };

  // Component Row Handlers
  const handleAddComponent = () => {
    setFormData((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        {
          categoryId: '',
          categoryName: 'Tailoring & Stitching',
          description: '',
          quantity: 1,
          unit: 'pcs',
          unitCost: 0,
          costType: 'ACTUAL',
          supplier: '',
          paymentStatus: 'PAID',
          notes: ''
        }
      ]
    }));
  };

  const handleUpdateComponent = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.components];
      updated[index] = { ...updated[index], [field]: value };

      // If categoryId changed, automatically update categoryName
      if (field === 'categoryId') {
        const cat = categories.find((c) => c.id === value);
        if (cat) updated[index].categoryName = cat.name;
      }
      return { ...prev, components: updated };
    });
  };

  const handleRemoveComponent = (index) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  // Real-time Pricing Calculations
  const batchQty = Math.max(1, Number(formData.batchQuantity) || 1);
  const targetMargin = Number(formData.targetMargin) || 0;
  const actualSellPrice = Math.max(0, Number(formData.actualSellingPrice) || 0);

  let totalActual = 0;
  let totalEstimated = 0;

  formData.components.forEach((c) => {
    const q = Math.max(0, Number(c.quantity) || 0);
    const u = Math.max(0, Number(c.unitCost) || 0);
    const sub = q * u;
    if (c.costType === 'ESTIMATED') {
      totalEstimated += sub;
    } else {
      totalActual += sub;
    }
  });

  const totalCost = totalActual > 0 ? totalActual : totalEstimated;
  const unitCost = Math.round(((totalCost / batchQty) + Number.EPSILON) * 100) / 100;

  // Formula: Suggested Selling Price = Cost Base / (1 - (Target Margin / 100))
  let suggestedSellingPrice = 0;
  let marginError = null;
  if (targetMargin >= 100) {
    marginError = 'Target margin must be < 100%';
  } else if (targetMargin < 0) {
    marginError = 'Margin cannot be negative';
    suggestedSellingPrice = unitCost;
  } else {
    suggestedSellingPrice = Math.round(((unitCost / (1 - (targetMargin / 100))) + Number.EPSILON) * 100) / 100;
  }

  const effectivePrice = actualSellPrice > 0 ? actualSellPrice : suggestedSellingPrice;
  const grossProfit = Math.round(((effectivePrice - unitCost) + Number.EPSILON) * 100) / 100;
  const grossMargin = effectivePrice > 0 ? Math.round((((effectivePrice - unitCost) / effectivePrice) * 100) * 10) / 10 : 0;
  const markupPercent = unitCost > 0 ? Math.round((((effectivePrice - unitCost) / unitCost) * 100) * 10) / 10 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName.trim()) {
      showToast('Product Name is required', true);
      return;
    }
    if (marginError) {
      showToast(marginError, true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        batchQuantity: batchQty,
        targetMargin,
        actualSellingPrice: actualSellPrice,
        components: formData.components.map((c) => ({
          ...c,
          quantity: Number(c.quantity) || 1,
          unitCost: Number(c.unitCost) || 0
        }))
      };

      if (isEdit && id) {
        await apiUpdateProductCosting(id, payload);
        showToast('COSTING PROFILE UPDATED SUCCESSFULLY');
      } else {
        await apiCreateProductCosting(payload);
        showToast('COSTING PROFILE CREATED SUCCESSFULLY');
      }

      setTimeout(() => {
        navigate('/admin/costing/products');
      }, 1000);
    } catch (err) {
      showToast('SAVE FAILED: ' + err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/costing/products"
            className="p-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-black font-mono tracking-wider text-neutral-900 uppercase">
              {isEdit ? 'EDIT COSTING PROFILE' : 'CREATE COSTING PROFILE'}
            </h2>
            <p className="text-xs text-neutral-500 font-sans">
              Define the itemized bill of materials and optimize retail margin.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-venm-neon px-5 py-2.5 text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Save className="w-4 h-4 text-neutral-900" />
          <span>{submitting ? 'SAVING...' : 'SAVE COSTING PROFILE'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product Info & BOM Components (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Basic Specifications */}
          <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-neutral-800">
                1. PRODUCT SPECIFICATIONS
              </span>
              {/* Optional Catalog Link */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Link Catalog Item:</span>
                <select
                  value={formData.productId}
                  onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                  className="border border-neutral-300 px-2 py-1 text-xs font-mono bg-neutral-50 max-w-[200px]"
                >
                  <option value="">-- Choose Catalog Product --</option>
                  {catalogProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                  Product / Silhouette Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g. Heavyweight Acid Wash Hoodie"
                  className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                  SKU / Style Code
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. VNM-HDY-001"
                  className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Hoodies, Tees, Denim"
                  className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                  Collection
                </label>
                <input
                  type="text"
                  value={formData.collection}
                  onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                  placeholder="e.g. Drop 01, Venomous Winter"
                  className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                  Batch Quantity (BOM Base)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.batchQuantity}
                  onChange={(e) => setFormData({ ...formData, batchQuantity: e.target.value })}
                  className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-black"
                />
                <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                  1 for single piece / custom look; or batch run count
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Bill of Materials (Cost Components) */}
          <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-neutral-800">
                  2. BILL OF MATERIALS (BOM COMPONENTS)
                </span>
                <p className="text-[11px] text-neutral-500 font-sans">
                  Direct blanks, fabric yardage, artisan stitching, screen printing, tags & luxury packaging.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddComponent}
                className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-neutral-900 text-white hover:bg-black flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-lime-400" />
                <span>Add Component</span>
              </button>
            </div>

            {formData.components.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 font-sans border border-dashed border-neutral-200">
                No cost components added yet. Click "Add Component" above.
              </div>
            ) : (
              <div className="space-y-3">
                {formData.components.map((comp, idx) => {
                  const compTotal = Math.round(((Number(comp.quantity || 0) * Number(comp.unitCost || 0)) + Number.EPSILON) * 100) / 100;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xs space-y-2.5 transition-all hover:border-neutral-300"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-neutral-500">
                          #{idx + 1} Component
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-black text-neutral-900">
                            Total: ₹{compTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveComponent(idx)}
                            className="text-neutral-400 hover:text-red-600 cursor-pointer p-1"
                            title="Remove component"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        {/* Cost Category */}
                        <div className="sm:col-span-4">
                          <label className="block text-[9px] font-mono font-bold uppercase text-neutral-600 mb-1">
                            Cost Category
                          </label>
                          <select
                            value={comp.categoryId}
                            onChange={(e) => handleUpdateComponent(idx, 'categoryId', e.target.value)}
                            className="w-full border border-neutral-300 px-2 py-1.5 text-xs font-mono bg-white"
                          >
                            <option value="">-- Choose Category --</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name} ({cat.costType})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-8">
                          <label className="block text-[9px] font-mono font-bold uppercase text-neutral-600 mb-1">
                            Item Description
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. French Terry 400 GSM, Screen Print 3 colors"
                            value={comp.description}
                            onChange={(e) => handleUpdateComponent(idx, 'description', e.target.value)}
                            className="w-full border border-neutral-300 px-2.5 py-1.5 text-xs font-mono bg-white"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-3">
                          <label className="block text-[9px] font-mono font-bold uppercase text-neutral-600 mb-1">
                            Qty
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={comp.quantity}
                            onChange={(e) => handleUpdateComponent(idx, 'quantity', e.target.value)}
                            className="w-full border border-neutral-300 px-2 py-1.5 text-xs font-mono bg-white"
                          />
                        </div>

                        {/* Unit */}
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-mono font-bold uppercase text-neutral-600 mb-1">
                            Unit
                          </label>
                          <input
                            type="text"
                            value={comp.unit}
                            onChange={(e) => handleUpdateComponent(idx, 'unit', e.target.value)}
                            placeholder="pcs, mtr, hr"
                            className="w-full border border-neutral-300 px-2 py-1.5 text-xs font-mono bg-white"
                          />
                        </div>

                        {/* Unit Cost */}
                        <div className="sm:col-span-3">
                          <label className="block text-[9px] font-mono font-bold uppercase text-neutral-600 mb-1">
                            Unit Cost (₹)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={comp.unitCost}
                            onChange={(e) => handleUpdateComponent(idx, 'unitCost', e.target.value)}
                            className="w-full border border-neutral-300 px-2 py-1.5 text-xs font-mono bg-white font-bold"
                          />
                        </div>

                        {/* Type */}
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-mono font-bold uppercase text-neutral-600 mb-1">
                            Type
                          </label>
                          <select
                            value={comp.costType}
                            onChange={(e) => handleUpdateComponent(idx, 'costType', e.target.value)}
                            className="w-full border border-neutral-300 px-1 py-1.5 text-xs font-mono bg-white"
                          >
                            <option value="ACTUAL">ACTUAL</option>
                            <option value="ESTIMATED">ESTIMATED</option>
                          </select>
                        </div>

                        {/* Supplier */}
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-mono font-bold uppercase text-neutral-600 mb-1">
                            Supplier
                          </label>
                          <input
                            type="text"
                            placeholder="Vendor"
                            value={comp.supplier}
                            onChange={(e) => handleUpdateComponent(idx, 'supplier', e.target.value)}
                            className="w-full border border-neutral-300 px-2 py-1.5 text-xs font-mono bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing Engine & Real-Time Margin Simulator */}
        <div className="space-y-6">
          <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-5 sticky top-6">
            <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-neutral-800 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-lime-600" />
                PRICING & MARGIN SIMULATOR
              </span>
              <span className="text-[9px] font-mono uppercase bg-neutral-100 px-1.5 py-0.5 border border-neutral-200">
                LIVE
              </span>
            </div>

            {/* Total Production Cost Breakdown */}
            <div className="space-y-2 bg-neutral-50 p-4 border border-neutral-200 text-xs font-mono">
              <div className="flex justify-between text-neutral-600">
                <span>Total BOM Cost:</span>
                <span className="font-bold text-neutral-900">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Batch Quantity:</span>
                <span className="text-neutral-900">{batchQty} pcs</span>
              </div>
              <div className="flex justify-between text-base font-black text-rose-600 pt-2 border-t border-neutral-200">
                <span>Unit Cost (COGS):</span>
                <span>₹{unitCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Target Gross Margin Slider & Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span className="uppercase text-neutral-700">Target Margin:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.targetMargin}
                    onChange={(e) => setFormData({ ...formData, targetMargin: e.target.value })}
                    className="w-16 border border-neutral-300 px-2 py-1 text-xs font-mono text-right font-bold bg-white"
                  />
                  <span>%</span>
                </div>
              </div>

              <input
                type="range"
                min="5"
                max="95"
                step="1"
                value={formData.targetMargin}
                onChange={(e) => setFormData({ ...formData, targetMargin: e.target.value })}
                className="w-full accent-neutral-900 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>20% (Low)</span>
                <span>50% (Standard)</span>
                <span>75% (Luxury)</span>
              </div>
            </div>

            {/* Suggested Selling Price Output */}
            <div className="bg-lime-50 border border-lime-300 p-3.5 space-y-1">
              <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-lime-900 block">
                SUGGESTED SELLING PRICE
              </span>
              <div className="text-2xl font-black font-mono text-neutral-950">
                ₹{suggestedSellingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-lime-800 font-mono">
                Formula: Unit Cost / (1 - {targetMargin}%)
              </p>
            </div>

            {/* Actual Selling Price Input */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                Actual Set Selling Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-400 text-xs">₹</span>
                <input
                  type="number"
                  step="any"
                  value={formData.actualSellingPrice}
                  onChange={(e) => setFormData({ ...formData, actualSellingPrice: e.target.value })}
                  placeholder={String(suggestedSellingPrice)}
                  className="w-full pl-7 pr-3 py-2 border border-neutral-300 text-sm font-mono font-bold bg-white focus:outline-hidden focus:border-black"
                />
              </div>
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Leave as 0 to inherit suggested price automatically
              </span>
            </div>

            {/* Live Profit Metrics Summary */}
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-neutral-600">Unit Gross Profit:</span>
                <span className="font-bold text-neutral-900">
                  ₹{grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-neutral-600">Effective Margin:</span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono font-black border uppercase ${
                    grossMargin >= 50
                      ? 'bg-lime-400 text-neutral-950 border-lime-500'
                      : grossMargin >= 35
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}
                >
                  {grossMargin}%
                </span>
              </div>

              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-neutral-600">Cost Markup %:</span>
                <span className="font-bold text-neutral-800">{markupPercent}%</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-venm-neon py-3 text-xs font-bold font-mono tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4 text-neutral-900" />
                <span>{submitting ? 'SAVING...' : 'SAVE COSTING PROFILE'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductCostingForm;

