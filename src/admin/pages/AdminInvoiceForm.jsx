import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Search,
  Layers,
  Sparkles,
  ShoppingBag,
  HelpCircle,
  X,
  CreditCard
} from 'lucide-react';
import {
  apiGetInvoice,
  apiCreateInvoice,
  apiUpdateInvoice,
  apiGetNextInvoiceNumber,
  apiGetInvoiceSettings,
  apiGetProducts,
  apiGetAllInquiries
} from '../../services/api';
import { calculateInvoiceTotals, round2 } from '../utils/invoiceCalculations';

const EMPTY_ITEM = {
  productId: null,
  name: '',
  sku: '',
  image: '',
  size: '',
  color: '',
  description: '',
  hsnCode: '6203',
  quantity: 1,
  unitPrice: 0,
  discountType: 'PERCENTAGE',
  discountValue: 0,
  taxRate: 12
};

const AdminInvoiceForm = ({ mode = 'create' }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Catalog products for quick-add picker
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Inquiries for customer linkage
  const [inquiries, setInquiries] = useState([]);
  const [isInquiryPickerOpen, setIsInquiryPickerOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    invoiceType: 'TAX_INVOICE',
    status: 'DRAFT',
    paymentStatus: 'UNPAID',
    paymentMethod: 'UPI',
    preparedBy: '',
    orderId: '',
    orderDate: '',

    // Brand
    brandName: 'VENM',
    brandTagline: 'Tradition with a Bite',
    brandLogo: '/assets/brand/logo2.png',
    brandEmail: 'venm1310@gmail.com',
    brandPhone: '+91 74340 96095',
    brandGstin: '24AAAAA0000A1Z5',
    brandAddress: 'Ahmedabad, Gujarat, India',

    // Customer
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    billingAddress: '',
    shippingAddress: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '',
    customerGstin: '',

    // Tax & Pricing
    taxEnabled: true,
    taxType: 'INTRA_STATE',
    pricingMode: 'TAX_EXCLUSIVE',

    // Items
    items: [{ ...EMPTY_ITEM, name: 'Bespoke Garment Piece' }],

    // Discounts & Charges
    invoiceDiscountType: 'FIXED',
    invoiceDiscountValue: 0,
    shippingCharges: 0,
    packagingCharges: 0,
    additionalCharges: 0,

    // Payments
    amountPaid: 0,
    advancePaid: 0,
    paymentDate: '',
    transactionRef: '',

    // Notes
    customerNotes: '',
    customizationNotes: '',
    deliveryNotes: '',
    paymentTerms: 'Full payment due within 7 days of invoice date.',
    termsAndConditions: '1. Goods once customized or sold cannot be returned without prior authorization.\n2. All bespoke tailoring alterations must be claimed within 15 days of delivery.\n3. Subject to Ahmedabad jurisdiction.',
    thankYouMessage: 'Thank you for choosing VENM. Tradition with a Bite.',
    internalNotes: '',

    // Visibility
    showBrandLogo: true,
    showBrandGstin: true,
    showShippingAddress: true,
    showItemImages: false,
    showItemHsn: true,
    showItemDiscount: true,
    showItemDescription: true,
    showCustomerNotes: true,
    showPaymentDetails: true,
    showTerms: true
  });

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Load catalog products for quick picker
        apiGetProducts()
          .then((prods) => setCatalogProducts(Array.isArray(prods) ? prods : []))
          .catch(() => {});

        // Load inquiries for order linkage
        apiGetAllInquiries()
          .then((inqs) => setInquiries(Array.isArray(inqs) ? inqs : []))
          .catch(() => {});

        if (mode === 'edit' && id) {
          const inv = await apiGetInvoice(id);
          setFormData({
            ...inv,
            invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().slice(0, 10) : '',
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : '',
            orderDate: inv.orderDate ? new Date(inv.orderDate).toISOString().slice(0, 10) : '',
            paymentDate: inv.paymentDate ? new Date(inv.paymentDate).toISOString().slice(0, 10) : '',
            items: inv.items?.length > 0 ? inv.items : [{ ...EMPTY_ITEM }]
          });
        } else {
          // Create Mode: fetch default settings and next invoice number
          const [setting, nextNum] = await Promise.all([
            apiGetInvoiceSettings().catch(() => null),
            apiGetNextInvoiceNumber().catch(() => null)
          ]);

          setFormData((prev) => ({
            ...prev,
            invoiceNumber: nextNum?.nextInvoiceNumber || 'VNM-INV-2026-0001',
            brandName: setting?.brandName || prev.brandName,
            brandTagline: setting?.brandTagline || prev.brandTagline,
            brandEmail: setting?.brandEmail || prev.brandEmail,
            brandPhone: setting?.brandPhone || prev.brandPhone,
            brandGstin: setting?.brandGstin || prev.brandGstin,
            brandAddress: setting?.brandAddress || prev.brandAddress,
            taxEnabled: setting?.defaultTaxEnabled !== undefined ? setting.defaultTaxEnabled : prev.taxEnabled,
            taxType: setting?.defaultTaxType || prev.taxType,
            pricingMode: setting?.defaultPricingMode || prev.pricingMode,
            paymentTerms: setting?.defaultPaymentTerms || prev.paymentTerms,
            termsAndConditions: setting?.defaultTerms || prev.termsAndConditions,
            thankYouMessage: setting?.defaultThankYou || prev.thankYouMessage
          }));
        }
      } catch (err) {
        showToast('FAILED TO INITIALIZE FORM: ' + err.message, true);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, id]);

  // Live Reactive Calculations
  const totals = calculateInvoiceTotals({
    items: formData.items,
    taxEnabled: formData.taxEnabled,
    taxType: formData.taxType,
    pricingMode: formData.pricingMode,
    invoiceDiscountType: formData.invoiceDiscountType,
    invoiceDiscountValue: formData.invoiceDiscountValue,
    shippingCharges: formData.shippingCharges,
    packagingCharges: formData.packagingCharges,
    additionalCharges: formData.additionalCharges,
    amountPaid: formData.amountPaid,
    advancePaid: formData.advancePaid,
    roundGrandTotal: true
  });

  // Line item handlers
  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, items: updated });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...EMPTY_ITEM, name: `Line Item ${formData.items.length + 1}` }]
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      showToast('AT LEAST ONE LINE ITEM IS REQUIRED', true);
      return;
    }
    const updated = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updated });
  };

  const handleSelectCatalogProduct = (prod) => {
    // Extract price number from string like "Estimated from ₹1,800"
    let unitPrice = 0;
    if (prod.estimatedPrice) {
      const match = prod.estimatedPrice.match(/\d+[\d,]*/);
      if (match) unitPrice = parseFloat(match[0].replace(/,/g, ''));
    }

    let parsedImages = [];
    try {
      parsedImages = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
    } catch (e) {}

    const newItem = {
      ...EMPTY_ITEM,
      productId: prod.id,
      name: prod.name,
      sku: prod.slug || '',
      image: parsedImages?.[0] || '',
      unitPrice,
      description: prod.description ? prod.description.substring(0, 150) : '',
      taxRate: formData.taxEnabled ? 12 : 0
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });

    setIsProductPickerOpen(false);
    showToast(`ADDED "${prod.name}" TO INVOICE`);
  };

  const handleSelectInquiry = (inq) => {
    setFormData({
      ...formData,
      orderId: inq.id,
      orderDate: inq.createdAt ? new Date(inq.createdAt).toISOString().slice(0, 10) : '',
      customerName: inq.clientName || formData.customerName,
      customerPhone: inq.clientPhone || inq.clientContact || formData.customerPhone,
      customerEmail: inq.clientEmail || formData.customerEmail,
      customizationNotes: inq.note || inq.requestType || formData.customizationNotes
    });
    setIsInquiryPickerOpen(false);
    showToast(`LINKED INQUIRY DETAILS FOR ${inq.clientName || 'CLIENT'}`);
  };

  const handleSubmit = async (submitStatus = 'DRAFT') => {
    if (!formData.customerName || !formData.customerName.trim()) {
      showToast('CUSTOMER NAME IS REQUIRED', true);
      return;
    }

    if (!formData.items || formData.items.length === 0) {
      showToast('AT LEAST ONE LINE ITEM IS REQUIRED', true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        status: submitStatus
      };

      if (mode === 'edit') {
        const updated = await apiUpdateInvoice(id, payload);
        showToast(`INVOICE #${updated.invoiceNumber} UPDATED SUCCESSFULLY`);
        navigate(`/admin/invoices/${updated.id}`);
      } else {
        const created = await apiCreateInvoice(payload);
        showToast(`INVOICE #${created.invoiceNumber} CREATED SUCCESSFULLY`);
        navigate(`/admin/invoices/${created.id}`);
      }
    } catch (err) {
      showToast('SAVE FAILED: ' + err.message, true);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-neutral-500">
        LOADING INVOICE FORM & DATA...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 font-extrabold text-xs tracking-widest uppercase shadow-2xl flex items-center gap-2 border ${
            toast.isError
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-lime-400 text-neutral-900 border-lime-500'
          }`}
        >
          {toast.isError ? <AlertTriangle className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-neutral-900" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/invoices"
            className="p-2 border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-500">
              {mode === 'edit' ? 'MODIFY INVOICE RECORD' : 'CREATE INVOICE RECORD'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-wide flex items-center gap-2">
              <span>{mode === 'edit' ? `EDIT INVOICE #${formData.invoiceNumber}` : 'NEW INVOICE GENERATOR'}</span>
              <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold border ${
                formData.status === 'ISSUED' ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-neutral-100 text-neutral-700 border-neutral-300'
              }`}>
                {formData.status}
              </span>
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleSubmit('DRAFT')}
            disabled={submitting}
            className="px-4 py-2 text-xs font-mono font-bold uppercase border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-neutral-600" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('ISSUED')}
            disabled={submitting}
            className="btn-venm-neon px-5 py-2 text-xs font-mono font-extrabold uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-neutral-900" />
            <span>Issue Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Details (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. INVOICE META & BRAND */}
          <div className="bg-white p-6 border border-neutral-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-600">
                SECTION 01 // DOCUMENT INFORMATION
              </span>
              <span className="text-[10px] font-mono text-neutral-400">FINANCIAL CLASSIFICATION</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">INVOICE NUMBER *</label>
                <input
                  type="text"
                  required
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">INVOICE DATE *</label>
                <input
                  type="date"
                  required
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">DUE DATE</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">INVOICE TYPE</label>
                <select
                  value={formData.invoiceType}
                  onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                >
                  <option value="TAX_INVOICE">TAX INVOICE (GST)</option>
                  <option value="PROFORMA">PROFORMA INVOICE / ESTIMATE</option>
                  <option value="COMMERCIAL">COMMERCIAL INVOICE</option>
                  <option value="RECEIPT">PAYMENT RECEIPT</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">LINKED ORDER / INQUIRY ID</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. INQ-123"
                    value={formData.orderId || ''}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setIsInquiryPickerOpen(true)}
                    className="px-2.5 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 text-[10px] font-mono uppercase font-bold shrink-0 cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">PREPARED BY</label>
                <input
                  type="text"
                  value={formData.preparedBy || ''}
                  onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* 2. CUSTOMER DETAILS */}
          <div className="bg-white p-6 border border-neutral-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-600">
                SECTION 02 // CUSTOMER & BILLING DETAILS
              </span>
              <span className="text-[10px] font-mono text-neutral-400">NO REGISTRATION REQUIRED</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1 sm:col-span-1">
                <label className="font-bold uppercase text-neutral-700">CUSTOMER NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Patel"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="font-bold uppercase text-neutral-700">PHONE NUMBER</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.customerPhone || ''}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="font-bold uppercase text-neutral-700">EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="client@domain.com"
                  value={formData.customerEmail || ''}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold uppercase text-neutral-700">BILLING ADDRESS</label>
                <textarea
                  rows={2}
                  placeholder="Street address, building, apartment..."
                  value={formData.billingAddress || ''}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="font-bold uppercase text-neutral-700">CUSTOMER GSTIN</label>
                <input
                  type="text"
                  placeholder="e.g. 24ABCDE1234F1Z5"
                  value={formData.customerGstin || ''}
                  onChange={(e) => setFormData({ ...formData, customerGstin: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono uppercase text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">CITY</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">STATE</label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">PIN CODE</label>
                <input
                  type="text"
                  placeholder="380001"
                  value={formData.pincode || ''}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* 3. LINE ITEMS TABLE */}
          <div className="bg-white p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-600 block">
                  SECTION 03 // LINE ITEMS & CUSTOM WORK
                </span>
                <span className="text-xs font-bold uppercase text-neutral-900">
                  Products, bespoke alterations & fabric charges ({formData.items.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(true)}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-neutral-700" />
                  <span>+ Catalog Product</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-lime-400" />
                  <span>+ Custom Line Item</span>
                </button>
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-4">
              {formData.items.map((item, idx) => {
                const itemCalc = totals.items[idx] || {};

                return (
                  <div
                    key={idx}
                    className="p-4 bg-neutral-50 border border-neutral-200 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                      <span className="text-[11px] font-mono font-bold text-neutral-700 uppercase">
                        ITEM #{idx + 1} {item.sku && `[SKU: ${item.sku}]`}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={formData.items.length === 1}
                        className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer disabled:opacity-30"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                      {/* Name */}
                      <div className="sm:col-span-5 space-y-1">
                        <label className="font-bold text-neutral-700 uppercase text-[10px]">ITEM / SERVICE NAME *</label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full bg-white border border-neutral-300 p-1.5 text-neutral-900 font-medium focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      {/* Size & Color */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-bold text-neutral-700 uppercase text-[10px]">SIZE</label>
                        <input
                          type="text"
                          placeholder="M / 32 / Custom"
                          value={item.size || ''}
                          onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
                          className="w-full bg-white border border-neutral-300 p-1.5 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-bold text-neutral-700 uppercase text-[10px]">COLOUR</label>
                        <input
                          type="text"
                          placeholder="Raw Black"
                          value={item.color || ''}
                          onChange={(e) => handleItemChange(idx, 'color', e.target.value)}
                          className="w-full bg-white border border-neutral-300 p-1.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <label className="font-bold text-neutral-700 uppercase text-[10px]">HSN CODE</label>
                        <input
                          type="text"
                          value={item.hsnCode || '6203'}
                          onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                          className="w-full bg-white border border-neutral-300 p-1.5 font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      {/* Description */}
                      <div className="sm:col-span-12 space-y-1">
                        <label className="font-bold text-neutral-700 uppercase text-[10px]">DESCRIPTION / ALTERATION SPECS</label>
                        <input
                          type="text"
                          placeholder="Hand-embroidered accents, customized sleeves..."
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-white border border-neutral-300 p-1.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-bold text-neutral-700 uppercase text-[10px]">QTY</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-neutral-300 p-1.5 font-mono font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="font-bold text-neutral-700 uppercase text-[10px]">UNIT PRICE (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full bg-white border border-neutral-300 p-1.5 font-mono font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      {/* Discount Type & Value */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="font-bold text-neutral-700 uppercase text-[10px]">DISCOUNT</label>
                        <div className="flex">
                          <select
                            value={item.discountType || 'PERCENTAGE'}
                            onChange={(e) => handleItemChange(idx, 'discountType', e.target.value)}
                            className="bg-neutral-200 border border-neutral-300 p-1.5 font-mono text-[10px] font-bold"
                          >
                            <option value="PERCENTAGE">%</option>
                            <option value="FIXED">₹</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discountValue || 0}
                            onChange={(e) => handleItemChange(idx, 'discountValue', e.target.value)}
                            className="w-full bg-white border border-neutral-300 p-1.5 font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                          />
                        </div>
                      </div>

                      {/* Tax Rate */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-bold text-neutral-700 uppercase text-[10px]">GST TAX %</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          disabled={!formData.taxEnabled}
                          value={formData.taxEnabled ? (item.taxRate !== undefined ? item.taxRate : 12) : 0}
                          onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                          className="w-full bg-white border border-neutral-300 p-1.5 font-mono text-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-400 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      {/* Line Total Display */}
                      <div className="sm:col-span-2 space-y-1 text-right">
                        <label className="font-bold text-neutral-700 uppercase text-[10px]">LINE TOTAL</label>
                        <div className="p-1.5 font-mono font-black text-neutral-900 text-sm">
                          ₹{Number(itemCalc.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. NOTES & TERMS */}
          <div className="bg-white p-6 border border-neutral-200 shadow-xs space-y-4">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-600 block border-b border-neutral-200 pb-2">
              SECTION 04 // INVOICE NOTES & TERMS
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">CLIENT-FACING NOTE</label>
                <textarea
                  rows={2}
                  placeholder="Notes for client regarding bespoke delivery or garments..."
                  value={formData.customerNotes || ''}
                  onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">CUSTOMIZATION INSTRUCTIONS</label>
                <textarea
                  rows={2}
                  placeholder="Tailoring instructions, measurement details..."
                  value={formData.customizationNotes || ''}
                  onChange={(e) => setFormData({ ...formData, customizationNotes: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold uppercase text-neutral-700">TERMS & CONDITIONS</label>
                <textarea
                  rows={3}
                  value={formData.termsAndConditions || ''}
                  onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono text-[11px] text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculation Engine, Tax Settings & Payment (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* TAX & PRICING CONFIGURATION */}
          <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-4">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-600 block border-b border-neutral-200 pb-2">
              TAX & PRICING MODE
            </span>

            <div className="space-y-3 text-xs">
              {/* Tax Toggle */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200">
                <div className="space-y-0.5">
                  <span className="font-bold uppercase text-neutral-900 block">GST TAX CALCULATION</span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {formData.taxEnabled ? 'Tax rows active' : 'Tax disabled on document'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.taxEnabled}
                    onChange={(e) => setFormData({ ...formData, taxEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lime-500"></div>
                </label>
              </div>

              {formData.taxEnabled && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-neutral-700">TAX TREATMENT</label>
                    <select
                      value={formData.taxType}
                      onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono font-bold text-neutral-900"
                    >
                      <option value="INTRA_STATE">INTRA-STATE (CGST + SGST)</option>
                      <option value="INTER_STATE">INTER-STATE (IGST)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-neutral-700">PRICING MODE</label>
                    <select
                      value={formData.pricingMode}
                      onChange={(e) => setFormData({ ...formData, pricingMode: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono font-bold text-neutral-900"
                    >
                      <option value="TAX_EXCLUSIVE">TAX EXCLUSIVE (Tax added on top)</option>
                      <option value="TAX_INCLUSIVE">TAX INCLUSIVE (Tax included in unit price)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* DISCOUNTS & EXTRA CHARGES */}
          <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-3 text-xs">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-600 block border-b border-neutral-200 pb-2">
              DISCOUNTS & EXTRA CHARGES
            </span>

            {/* Overall Invoice Discount */}
            <div className="space-y-1">
              <label className="font-bold uppercase text-neutral-700">INVOICE-LEVEL DISCOUNT</label>
              <div className="flex">
                <select
                  value={formData.invoiceDiscountType}
                  onChange={(e) => setFormData({ ...formData, invoiceDiscountType: e.target.value })}
                  className="bg-neutral-200 border border-neutral-300 p-1.5 font-mono text-xs font-bold"
                >
                  <option value="FIXED">₹ (Fixed)</option>
                  <option value="PERCENTAGE">% (Percent)</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.invoiceDiscountValue}
                  onChange={(e) => setFormData({ ...formData, invoiceDiscountValue: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-1.5 font-mono text-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">SHIPPING (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shippingCharges}
                  onChange={(e) => setFormData({ ...formData, shippingCharges: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-1.5 font-mono text-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">PACKAGING (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.packagingCharges}
                  onChange={(e) => setFormData({ ...formData, packagingCharges: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-1.5 font-mono text-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* FINANCIAL SUMMARY BOX */}
          <div className="bg-neutral-900 text-white p-5 border border-neutral-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-lime-400">
                LIVE SUMMARY // AUTO-CALCULATED
              </span>
              <span className="text-[10px] font-mono text-neutral-400">INR (₹)</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal (Qty × Rate):</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>

              {totals.totalDiscount > 0 && (
                <div className="flex justify-between text-lime-400">
                  <span>Discounts Applied:</span>
                  <span>-₹{totals.totalDiscount.toFixed(2)}</span>
                </div>
              )}

              {formData.taxEnabled && (
                <>
                  <div className="flex justify-between text-neutral-400">
                    <span>Taxable Amount:</span>
                    <span>₹{totals.taxableAmount.toFixed(2)}</span>
                  </div>

                  {formData.taxType === 'INTRA_STATE' ? (
                    <>
                      <div className="flex justify-between text-neutral-400">
                        <span>CGST:</span>
                        <span>₹{totals.cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>SGST:</span>
                        <span>₹{totals.sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-neutral-400">
                      <span>IGST:</span>
                      <span>₹{totals.igstAmount.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}

              {(totals.shippingCharges > 0 || totals.packagingCharges > 0) && (
                <div className="flex justify-between text-neutral-400">
                  <span>Shipping & Packaging:</span>
                  <span>₹{(totals.shippingCharges + totals.packagingCharges).toFixed(2)}</span>
                </div>
              )}

              {totals.roundOff !== 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>Round Off:</span>
                  <span>{totals.roundOff > 0 ? `+₹${totals.roundOff.toFixed(2)}` : `-₹${Math.abs(totals.roundOff).toFixed(2)}`}</span>
                </div>
              )}

              <div className="border-t border-neutral-700 pt-3 flex justify-between items-center text-sm">
                <span className="font-extrabold uppercase text-white">GRAND TOTAL:</span>
                <span className="font-black text-lg text-lime-400">
                  ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="border-t border-neutral-800 pt-2 flex justify-between items-center text-xs">
                <span className="text-neutral-400">Amount Paid:</span>
                <span className="text-white">₹{totals.totalPaid.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-amber-400">
                <span>Balance Due:</span>
                <span>₹{totals.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* PAYMENT & SETTLEMENT */}
          <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-3 text-xs">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-600 block border-b border-neutral-200 pb-2">
              PAYMENT & SETTLEMENT
            </span>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">PAYMENT STATUS</label>
                <div className="p-2 bg-neutral-100 font-mono font-bold text-neutral-900 border border-neutral-200">
                  {totals.paymentStatus}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-neutral-700">AMOUNT PAID (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono text-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-neutral-700">ADVANCE PAID (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.advancePaid}
                    onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono text-neutral-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">PAYMENT METHOD</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono text-neutral-900 font-bold"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer (IMPS/NEFT)</option>
                  <option value="CASH">Cash Payment</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">TRANSACTION / UTR REFERENCE</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-123456789"
                  value={formData.transactionRef || ''}
                  onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 font-mono text-neutral-900"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- CATALOG PRODUCT PICKER MODAL ----------------- */}
      {isProductPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-sans animate-fadeIn"
        >
          <div className="relative w-full max-w-3xl bg-white border border-neutral-200 p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase font-bold">
                  CATALOG INVENTORY
                </span>
                <h3 className="text-lg font-black uppercase text-neutral-900">
                  Select Product from VENM Catalog
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by name or collection..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 pr-1">
              {catalogProducts
                .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                .map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectCatalogProduct(prod)}
                    className="p-3 border border-neutral-200 hover:border-lime-500 hover:bg-lime-50/20 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase">{prod.name}</h4>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {prod.collectionName || 'Catalog Reference'} &bull; {prod.estimatedPrice || 'Price on request'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-mono uppercase bg-neutral-900 text-white font-bold">
                      Select Item
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- INQUIRY PICKER MODAL ----------------- */}
      {isInquiryPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-sans animate-fadeIn"
        >
          <div className="relative w-full max-w-2xl bg-white border border-neutral-200 p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase font-bold">
                  CLIENT INQUIRIES & ORDERS
                </span>
                <h3 className="text-lg font-black uppercase text-neutral-900">
                  Link Client from Storefront Inquiry
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInquiryPickerOpen(false)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 pr-1">
              {inquiries.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-neutral-500">
                  NO CLIENT INQUIRIES RECORDED YET.
                </div>
              ) : (
                inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    onClick={() => handleSelectInquiry(inq)}
                    className="p-3 border border-neutral-200 hover:border-lime-500 hover:bg-lime-50/20 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase">
                        {inq.clientName || 'Unnamed Client'}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {inq.clientPhone || inq.clientContact || 'No phone'} &bull; For: {inq.productName}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-mono uppercase bg-neutral-900 text-white font-bold">
                      Autofill Client
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoiceForm;

