import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Receipt,
  Plus,
  Trash2,
  DollarSign,
  Layers,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Gift,
  HelpCircle
} from 'lucide-react';
import {
  apiGetOrderCostingByInvoiceId,
  apiSaveOrderCosting,
  apiGetCostCategories
} from '../../../services/api';

const OrderCostingDetail = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState(null);

  // Costing Form State
  const [allocationMethod, setAllocationMethod] = useState('QUANTITY');
  const [costingStatus, setCostingStatus] = useState('COMPLETED');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [expenseAllocations, setExpenseAllocations] = useState([]);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const catRes = await apiGetCostCategories();
        if (catRes.data) setCategories(catRes.data);

        const res = await apiGetOrderCostingByInvoiceId(invoiceId);
        setInvoice(res.invoice);

        if (res.data) {
          setAllocationMethod(res.data.allocationMethod || 'QUANTITY');
          setCostingStatus(res.data.status || 'COMPLETED');
          setNotes(res.data.notes || '');
          setItems(res.data.items || []);
          setExpenseAllocations(res.data.expenseAllocations || []);
        }
      } catch (err) {
        showToast('FAILED TO LOAD ORDER COSTING: ' + err.message, true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [invoiceId]);

  // Handle Item Unit Cost Change
  const handleItemCostChange = (index, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], unitCost: Math.max(0, Number(value) || 0) };
      return updated;
    });
  };

  // Toggle Promotional Gift Flag
  const handleToggleGift = (index) => {
    setItems((prev) => {
      const updated = [...prev];
      const isGift = !updated[index].isPromotionalGift;
      updated[index] = {
        ...updated[index],
        isPromotionalGift: isGift,
        sellingPrice: isGift ? 0 : (updated[index].originalPrice || updated[index].sellingPrice || 0)
      };
      return updated;
    });
  };

  // Shared Expenses Handlers
  const handleAddExpense = () => {
    setExpenseAllocations((prev) => [
      ...prev,
      {
        categoryName: 'Luxury Packaging & Polybags',
        description: 'Protective wrap & luxury outer box',
        amount: 45,
        allocationMethod
      }
    ]);
  };

  const handleUpdateExpense = (index, field, value) => {
    setExpenseAllocations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveExpense = (index) => {
    setExpenseAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  // Live Math Calculations
  const netRevenue = invoice
    ? (invoice.taxableAmount !== undefined && invoice.taxableAmount !== null
        ? Number(invoice.taxableAmount)
        : Math.max(0, Number(invoice.subtotal || 0) - Number(invoice.discountTotal || 0)))
    : 0;

  const totalAllocatedCost = Math.round(
    (expenseAllocations.reduce((acc, exp) => acc + (Math.max(0, Number(exp.amount)) || 0), 0) + Number.EPSILON) * 100
  ) / 100;

  const totalQuantity = items.reduce((acc, it) => acc + (Math.max(1, Number(it.quantity)) || 1), 0);
  const totalNetItemRev = items.reduce((acc, it) => {
    if (it.isPromotionalGift) return acc;
    const price = Math.max(0, Number(it.sellingPrice) || 0);
    const disc = Math.max(0, Number(it.discountAmount) || 0);
    const qty = Math.max(1, Number(it.quantity) || 1);
    return acc + Math.max(0, (price * qty) - disc);
  }, 0);

  let totalDirectCost = 0;

  const calculatedItems = items.map((it) => {
    const qty = Math.max(1, Number(it.quantity) || 1);
    const isGift = Boolean(it.isPromotionalGift);
    const sellPrice = isGift ? 0 : Math.max(0, Number(it.sellingPrice) || 0);
    const disc = isGift ? 0 : Math.max(0, Number(it.discountAmount) || 0);
    const itemRev = isGift ? 0 : Math.max(0, (sellPrice * qty) - disc);

    const unitCost = Math.max(0, Number(it.unitCost) || 0);
    const directCost = Math.round(((qty * unitCost) + Number.EPSILON) * 100) / 100;
    totalDirectCost += directCost;

    // Allocated share
    let itemAllocated = 0;
    if (totalAllocatedCost > 0) {
      if (allocationMethod === 'EQUAL') {
        itemAllocated = Math.round(((totalAllocatedCost / (items.length || 1)) + Number.EPSILON) * 100) / 100;
      } else if (allocationMethod === 'QUANTITY') {
        const ratio = totalQuantity > 0 ? qty / totalQuantity : (1 / (items.length || 1));
        itemAllocated = Math.round(((totalAllocatedCost * ratio) + Number.EPSILON) * 100) / 100;
      } else if (allocationMethod === 'REVENUE') {
        const ratio = totalNetItemRev > 0 ? itemRev / totalNetItemRev : (qty / (totalQuantity || 1));
        itemAllocated = Math.round(((totalAllocatedCost * ratio) + Number.EPSILON) * 100) / 100;
      }
    }

    const itemGrossProfit = Math.round(((itemRev - directCost) + Number.EPSILON) * 100) / 100;
    const itemMargin = itemRev > 0 ? Math.round((((itemRev - directCost) / itemRev) * 100) * 10) / 10 : (isGift ? -100 : 0);

    return {
      ...it,
      itemRev,
      directCost,
      itemAllocated,
      itemGrossProfit,
      itemMargin
    };
  });

  totalDirectCost = Math.round((totalDirectCost + Number.EPSILON) * 100) / 100;
  const totalOrderCost = Math.round(((totalDirectCost + totalAllocatedCost) + Number.EPSILON) * 100) / 100;
  const effectiveRevenue = netRevenue > 0 ? netRevenue : totalNetItemRev;

  const grossProfit = Math.round(((effectiveRevenue - totalDirectCost) + Number.EPSILON) * 100) / 100;
  const grossMargin = effectiveRevenue > 0 ? Math.round((((effectiveRevenue - totalDirectCost) / effectiveRevenue) * 100) * 10) / 10 : 0;

  const netProfit = Math.round(((effectiveRevenue - totalOrderCost) + Number.EPSILON) * 100) / 100;
  const netMargin = effectiveRevenue > 0 ? Math.round((((effectiveRevenue - totalOrderCost) / effectiveRevenue) * 100) * 10) / 10 : 0;

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await apiSaveOrderCosting({
        invoiceId,
        status: costingStatus,
        allocationMethod,
        notes,
        items: calculatedItems.map((it) => ({
          ...it,
          unitCost: Number(it.unitCost) || 0
        })),
        expenseAllocations: expenseAllocations.map((exp) => ({
          ...exp,
          amount: Number(exp.amount) || 0,
          allocationMethod
        }))
      });

      showToast('ORDER COSTING SAVED SUCCESSFULLY');
      setTimeout(() => {
        navigate('/admin/costing/orders');
      }, 1000);
    } catch (err) {
      showToast('FAILED TO SAVE ORDER COSTING: ' + err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-neutral-500 font-mono">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-neutral-400" />
        INITIALIZING ORDER COSTING...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center text-neutral-600 font-mono">
        Invoice record not found.{' '}
        <Link to="/admin/costing/orders" className="underline font-bold text-black">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/costing/orders"
            className="p-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-mono tracking-wider text-neutral-900 uppercase">
                ORDER COSTING: {invoice.invoiceNumber}
              </h2>
              <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-neutral-900 text-white font-bold">
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-sans">
              Customer: <strong className="text-neutral-800">{invoice.customerName}</strong> &bull; Order ID: {invoice.orderId || 'Direct'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="btn-venm-neon px-5 py-2.5 text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Save className="w-4 h-4 text-neutral-900" />
          <span>{submitting ? 'SAVING...' : 'SAVE ORDER COSTING'}</span>
        </button>
      </div>

      {/* Invoice Overview Pill */}
      <div className="bg-white p-4 border border-neutral-200 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-[10px] text-neutral-400 block uppercase">INVOICE GRAND TOTAL</span>
          <span className="text-base font-black text-neutral-900">
            ₹{Number(invoice.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-neutral-400 block uppercase">OUTPUT GST COLLECTED</span>
          <span className="text-base font-bold text-neutral-600">
            ₹{Number(invoice.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[9px] text-neutral-400 block">Excl. from revenue</span>
        </div>
        <div>
          <span className="text-[10px] text-neutral-400 block uppercase">NET SALES REVENUE</span>
          <span className="text-base font-black text-lime-700">
            ₹{effectiveRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-neutral-400 block uppercase">PAYMENT STATUS</span>
          <span className="text-xs font-bold uppercase px-2 py-0.5 bg-neutral-100 border border-neutral-200 inline-block mt-0.5">
            {invoice.paymentStatus}
          </span>
        </div>
      </div>

      {/* Section A: Item Direct Costs */}
      <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-4">
        <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-neutral-800">
              SECTION A: PRODUCT DIRECT PRODUCTION COSTS (COGS)
            </span>
            <p className="text-[11px] text-neutral-500 font-sans">
              Enter or adjust actual blank, fabric, and tailoring costs for each item in this order.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold tracking-wider text-neutral-600">
              <tr>
                <th className="py-2.5 px-3">Item / Style</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Selling Price</th>
                <th className="py-2.5 px-3 text-center">Free Gift?</th>
                <th className="py-2.5 px-3 text-right">Actual Unit Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Total Direct Cost</th>
                <th className="py-2.5 px-3 text-right">Allocated Expense</th>
                <th className="py-2.5 px-3 text-right">Gross Profit</th>
                <th className="py-2.5 px-3 text-center">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {calculatedItems.map((it, idx) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  <td className="py-3 px-3">
                    <div className="font-bold text-neutral-900">{it.name}</div>
                    <div className="text-[10px] text-neutral-500">
                      {it.sku || 'No SKU'} {it.size ? `• Size: ${it.size}` : ''} {it.color ? `• Color: ${it.color}` : ''}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">{it.quantity}</td>
                  <td className="py-3 px-3 text-right font-bold text-neutral-900">
                    {it.isPromotionalGift ? (
                      <span className="text-neutral-400 line-through">₹{it.sellingPrice}</span>
                    ) : (
                      `₹${it.sellingPrice}`
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleGift(idx)}
                      className={`px-2 py-0.5 text-[9px] uppercase font-bold border transition-all cursor-pointer ${
                        it.isPromotionalGift
                          ? 'bg-amber-100 text-amber-900 border-amber-400 font-black'
                          : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                      }`}
                    >
                      {it.isPromotionalGift ? 'GIFT (₹0)' : 'NO'}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={it.unitCost}
                      onChange={(e) => handleItemCostChange(idx, e.target.value)}
                      className="w-24 border border-neutral-300 px-2 py-1 text-right font-bold text-rose-600 bg-white"
                    />
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600">
                    ₹{it.directCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-neutral-600">
                    ₹{it.itemAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${it.itemGrossProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    ₹{it.itemGrossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-bold border uppercase ${
                        it.itemMargin >= 35
                          ? 'bg-lime-400 text-neutral-950 border-lime-500 font-black'
                          : it.itemMargin >= 20
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}
                    >
                      {it.itemMargin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section B: Shared Order Variable Costs */}
      <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-4">
        <div className="border-b border-neutral-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-neutral-800">
              SECTION B: SHARED ORDER VARIABLE EXPENSES
            </span>
            <p className="text-[11px] text-neutral-500 font-sans">
              Packaging, courier shipping, stickers, payment gateway fees, or custom gifts allocated to this order.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-600 uppercase font-bold">Allocation Rule:</span>
            <select
              value={allocationMethod}
              onChange={(e) => setAllocationMethod(e.target.value)}
              className="border border-neutral-300 px-2 py-1 text-xs font-mono bg-white"
            >
              <option value="QUANTITY">By Item Quantity (Pro-rata)</option>
              <option value="REVENUE">By Item Revenue (Pro-rata)</option>
              <option value="EQUAL">Equal Split</option>
            </select>

            <button
              type="button"
              onClick={handleAddExpense}
              className="px-3 py-1 text-xs font-mono font-bold uppercase bg-neutral-900 text-white hover:bg-black flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-lime-400" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {expenseAllocations.length === 0 ? (
          <div className="p-6 text-center text-neutral-400 font-sans text-xs border border-dashed border-neutral-200">
            No shared order expenses allocated. Click "Add Expense" to record packaging or shipping.
          </div>
        ) : (
          <div className="space-y-2">
            {expenseAllocations.map((exp, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-neutral-50 border border-neutral-200 items-center text-xs font-mono"
              >
                <div className="sm:col-span-4">
                  <select
                    value={exp.categoryName}
                    onChange={(e) => handleUpdateExpense(idx, 'categoryName', e.target.value)}
                    className="w-full border border-neutral-300 px-2 py-1 text-xs font-mono bg-white"
                  >
                    <option value="Luxury Packaging & Polybags">Luxury Packaging & Polybags</option>
                    <option value="Courier & Shipping Fees">Courier & Shipping Fees</option>
                    <option value="Stickers & Brand Stationery">Stickers & Brand Stationery</option>
                    <option value="Free Promotional Gifts">Free Promotional Gifts</option>
                    <option value="Payment Gateway Fees">Payment Gateway Fees</option>
                    <option value="Alterations & Rework">Alterations & Rework</option>
                    <option value="Miscellaneous Overheads">Miscellaneous Overheads</option>
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Expense Description..."
                    value={exp.description}
                    onChange={(e) => handleUpdateExpense(idx, 'description', e.target.value)}
                    className="w-full border border-neutral-300 px-2 py-1 text-xs font-mono bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={exp.amount}
                      onChange={(e) => handleUpdateExpense(idx, 'amount', e.target.value)}
                      className="w-full pl-6 pr-2 py-1 border border-neutral-300 text-xs font-mono font-bold bg-white text-right"
                    />
                  </div>
                </div>

                <div className="sm:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveExpense(idx)}
                    className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section C: Final Order Profitability Card */}
      <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-4">
        <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-neutral-800 block border-b border-neutral-100 pb-2">
          SECTION C: FINAL ORDER FINANCIAL RECONCILIATION
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">NET SALES REVENUE</span>
            <div className="text-xl font-black font-mono text-neutral-900">
              ₹{effectiveRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Excludes Output GST</span>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">TOTAL DIRECT COGS</span>
            <div className="text-xl font-black font-mono text-rose-600">
              ₹{totalDirectCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Blanks, fabric & artisan making</span>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">GROSS ORDER PROFIT</span>
            <div className="text-xl font-black font-mono text-neutral-900">
              ₹{grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-700">Gross Margin: {grossMargin}%</span>
          </div>

          <div className="p-4 bg-neutral-900 text-white space-y-1">
            <span className="text-[10px] font-mono uppercase text-lime-400 block font-bold">NET CONTRIBUTION PROFIT</span>
            <div className="text-xl font-black font-mono text-white">
              ₹{netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] font-mono text-lime-400 font-bold">Net Margin: {netMargin}%</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold uppercase text-neutral-700">Costing Status:</span>
            <select
              value={costingStatus}
              onChange={(e) => setCostingStatus(e.target.value)}
              className="border border-neutral-300 px-3 py-1.5 text-xs font-mono bg-white"
            >
              <option value="COMPLETED">COMPLETED</option>
              <option value="PENDING">PENDING</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="btn-venm-neon px-6 py-2.5 text-xs font-bold font-mono tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4 text-neutral-900" />
            <span>{submitting ? 'SAVING...' : 'CONFIRM & SAVE ORDER COSTING'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCostingDetail;

