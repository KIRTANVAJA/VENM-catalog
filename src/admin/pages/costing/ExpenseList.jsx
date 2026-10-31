import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  CreditCard,
  Building
} from 'lucide-react';
import {
  apiGetExpenses,
  apiCreateExpense,
  apiUpdateExpense,
  apiDeleteExpense,
  apiGetCostCategories
} from '../../../services/api';

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({
    totalAmountBeforeTax: 0,
    totalTaxAmount: 0,
    totalExpenseAmount: 0
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('ALL');
  const [expenseType, setExpenseType] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [isAllocated, setIsAllocated] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });

  const [formData, setFormData] = useState({
    description: '',
    categoryId: '',
    categoryName: '',
    expenseType: 'OPERATING',
    expenseDate: new Date().toISOString().slice(0, 10),
    amountBeforeTax: '',
    taxRate: 18,
    isInputTaxCreditEligible: true,
    supplier: '',
    paymentStatus: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    paymentDate: new Date().toISOString().slice(0, 10),
    isAllocatedToOrder: false,
    notes: ''
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, expRes] = await Promise.all([
        apiGetCostCategories(),
        apiGetExpenses({
          search,
          categoryId: categoryId === 'ALL' ? undefined : categoryId,
          expenseType: expenseType === 'ALL' ? undefined : expenseType,
          paymentStatus: paymentStatus === 'ALL' ? undefined : paymentStatus,
          isAllocated: isAllocated === 'ALL' ? undefined : isAllocated
        })
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (expRes.data) setExpenses(expRes.data);
      if (expRes.summary) setSummary(expRes.summary);
    } catch (err) {
      showToast('FAILED TO LOAD EXPENSES: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryId, expenseType, paymentStatus, isAllocated]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      categoryId: categories[0]?.id || '',
      categoryName: categories[0]?.name || 'General',
      expenseType: 'OPERATING',
      expenseDate: new Date().toISOString().slice(0, 10),
      amountBeforeTax: '',
      taxRate: 18,
      isInputTaxCreditEligible: true,
      supplier: '',
      paymentStatus: 'PAID',
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString().slice(0, 10),
      isAllocatedToOrder: false,
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (exp) => {
    setEditingExpense(exp);
    setFormData({
      description: exp.description || '',
      categoryId: exp.categoryId || '',
      categoryName: exp.categoryName || '',
      expenseType: exp.expenseType || 'OPERATING',
      expenseDate: exp.expenseDate ? new Date(exp.expenseDate).toISOString().slice(0, 10) : '',
      amountBeforeTax: exp.amountBeforeTax || '',
      taxRate: exp.taxRate !== undefined ? exp.taxRate : 18,
      isInputTaxCreditEligible: Boolean(exp.isInputTaxCreditEligible),
      supplier: exp.supplier || '',
      paymentStatus: exp.paymentStatus || 'PAID',
      paymentMethod: exp.paymentMethod || 'BANK_TRANSFER',
      paymentDate: exp.paymentDate ? new Date(exp.paymentDate).toISOString().slice(0, 10) : '',
      isAllocatedToOrder: Boolean(exp.isAllocatedToOrder),
      notes: exp.notes || ''
    });
    setModalOpen(true);
  };

  // Live calculation for modal
  const beforeTax = Math.max(0, Number(formData.amountBeforeTax) || 0);
  const taxPct = Math.max(0, Number(formData.taxRate) || 0);
  const taxAmount = Math.round(((beforeTax * (taxPct / 100)) + Number.EPSILON) * 100) / 100;
  const totalAmount = Math.round(((beforeTax + taxAmount) + Number.EPSILON) * 100) / 100;

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      showToast('Description is required', true);
      return;
    }
    if (beforeTax <= 0) {
      showToast('Amount must be greater than 0', true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        amountBeforeTax: beforeTax,
        taxRate: taxPct
      };

      if (editingExpense) {
        await apiUpdateExpense(editingExpense.id, payload);
        showToast('EXPENSE UPDATED SUCCESSFULLY');
      } else {
        await apiCreateExpense(payload);
        showToast('EXPENSE RECORDED SUCCESSFULLY');
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast('SAVE FAILED: ' + err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteModal.item) return;
    try {
      await apiDeleteExpense(deleteModal.item.id);
      showToast('EXPENSE ARCHIVED');
      setDeleteModal({ isOpen: false, item: null });
      loadData();
    } catch (err) {
      showToast('ARCHIVE FAILED: ' + err.message, true);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black font-mono tracking-wider text-neutral-900 uppercase">
            STUDIO & OPERATIONAL EXPENSES
          </h2>
          <p className="text-xs text-neutral-600 font-sans">
            Log overhead, material receipts, packaging supplies, and track Input Tax Credit (ITC) eligibility.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="btn-venm-neon px-5 py-2.5 text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-neutral-900" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-neutral-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-500">
            TOTAL EXPENSES (BEFORE TAX)
          </span>
          <div className="text-2xl font-black font-mono text-neutral-900">
            ₹{summary.totalAmountBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Real net expense base</span>
        </div>

        <div className="bg-white p-4 border border-neutral-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-500">
            INPUT GST PAID (POTENTIAL ITC)
          </span>
          <div className="text-2xl font-black font-mono text-neutral-900">
            ₹{summary.totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-lime-700 font-mono font-bold">Claimable tax credits</span>
        </div>

        <div className="bg-white p-4 border border-neutral-200 shadow-xs space-y-1 border-l-4 border-l-neutral-900">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-500">
            TOTAL CASH OUTFLOW
          </span>
          <div className="text-2xl font-black font-mono text-neutral-900">
            ₹{summary.totalExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Gross outflow with GST</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by expense #, description, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-neutral-300 text-xs font-mono bg-white focus:outline-hidden focus:border-black"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-mono font-bold uppercase bg-neutral-900 text-white hover:bg-black cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value)}
            className="border border-neutral-300 px-2 py-2 text-xs font-mono bg-white"
          >
            <option value="ALL">ALL TYPES</option>
            <option value="OPERATING">OPERATING</option>
            <option value="RAW_MATERIAL">RAW MATERIAL</option>
            <option value="PACKAGING">PACKAGING</option>
            <option value="SHIPPING">SHIPPING</option>
            <option value="MARKETING">MARKETING</option>
            <option value="UTILITY">UTILITY</option>
            <option value="OTHER">OTHER</option>
          </select>

          <select
            value={isAllocated}
            onChange={(e) => setIsAllocated(e.target.value)}
            className="border border-neutral-300 px-2 py-2 text-xs font-mono bg-white"
          >
            <option value="ALL">ALL ALLOCATIONS</option>
            <option value="false">UNALLOCATED (OVERHEAD)</option>
            <option value="true">ORDER ALLOCATED</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-neutral-300 text-neutral-600 hover:text-black cursor-pointer bg-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold tracking-wider text-neutral-600">
              <tr>
                <th className="py-3 px-4">Expense # / Date</th>
                <th className="py-3 px-4">Category & Description</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-right">Base Amount</th>
                <th className="py-3 px-4 text-right">GST Tax</th>
                <th className="py-3 px-4 text-right">Total Outflow</th>
                <th className="py-3 px-4 text-center">ITC Eligible</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-neutral-500 font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    LOADING EXPENSES...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-neutral-400 font-sans">
                    No expense records found. Click "Record Expense" to log overhead or supply receipts.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{exp.expenseNumber}</div>
                      <div className="text-[10px] text-neutral-500">
                        {exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{exp.description}</div>
                      <div className="text-[10px] text-neutral-500">
                        {exp.categoryName} {exp.isAllocatedToOrder ? '• (Order Allocated)' : '• (Operating Overhead)'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-700">{exp.supplier || 'N/A'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 text-[9px] uppercase font-bold border border-neutral-300 bg-neutral-100">
                        {exp.expenseType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-neutral-900">
                      ₹{Number(exp.amountBeforeTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      ₹{Number(exp.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({exp.taxRate}%)
                    </td>
                    <td className="py-3 px-4 text-right font-black text-neutral-950">
                      ₹{Number(exp.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-bold border uppercase ${
                          exp.isInputTaxCreditEligible
                            ? 'bg-lime-400 text-neutral-950 border-lime-500 font-black'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }`}
                      >
                        {exp.isInputTaxCreditEligible ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 text-[9px] uppercase font-bold border ${
                          exp.paymentStatus === 'PAID'
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {exp.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(exp)}
                        className="p-1.5 text-neutral-600 hover:text-black border border-neutral-200 cursor-pointer"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModal({ isOpen: true, item: exp })}
                        className="p-1.5 text-rose-600 hover:text-rose-800 border border-neutral-200 cursor-pointer"
                        title="Archive Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full p-6 border border-neutral-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold font-mono tracking-wider text-neutral-900 uppercase">
                {editingExpense ? 'EDIT EXPENSE RECORD' : 'RECORD NEW EXPENSE'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                  Description / Purchase Detail *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 pcs Luxury Frosted Garment Polybags"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                    Cost Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      const selCat = categories.find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        categoryId: e.target.value,
                        categoryName: selCat ? selCat.name : formData.categoryName
                      });
                    }}
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                    Expense Classification
                  </label>
                  <select
                    value={formData.expenseType}
                    onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white"
                  >
                    <option value="OPERATING">OPERATING (Studio Overhead)</option>
                    <option value="RAW_MATERIAL">RAW MATERIAL</option>
                    <option value="PACKAGING">PACKAGING</option>
                    <option value="SHIPPING">SHIPPING & LOGISTICS</option>
                    <option value="MARKETING">MARKETING & CAMPAIGNS</option>
                    <option value="UTILITY">UTILITY / SOFTWARE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                    Expense Date
                  </label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                    Supplier / Vendor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Surat Textiles / DTDC"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                    Base Amount (Before GST) (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amountBeforeTax}
                    onChange={(e) => setFormData({ ...formData, amountBeforeTax: e.target.value })}
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                    GST Tax Rate (%)
                  </label>
                  <select
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono bg-white"
                  >
                    <option value="0">0% (Exempt / Unregistered)</option>
                    <option value="5">5% (Fabric / Apparel)</option>
                    <option value="12">12% (Standard Apparel)</option>
                    <option value="18">18% (Services / Logistics / Packaging)</option>
                    <option value="28">28% (Luxury)</option>
                  </select>
                </div>
              </div>

              {/* Tax Calculation Pill */}
              <div className="bg-neutral-50 p-3 border border-neutral-200 text-xs font-mono flex justify-between items-center">
                <div>
                  <span className="text-neutral-500">Calculated GST:</span>{' '}
                  <strong className="text-neutral-900">₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div>
                  <span className="text-neutral-500">Gross Outflow:</span>{' '}
                  <strong className="text-neutral-950 font-black">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-1 text-xs font-mono">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isInputTaxCreditEligible}
                    onChange={(e) => setFormData({ ...formData, isInputTaxCreditEligible: e.target.checked })}
                    className="rounded-xs"
                  />
                  <span>Eligible for Input Tax Credit (ITC claimable on GST return)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAllocatedToOrder}
                    onChange={(e) => setFormData({ ...formData, isAllocatedToOrder: e.target.checked })}
                    className="rounded-xs"
                  />
                  <span>Directly allocated to an order (Excluded from Studio Overhead to prevent double counting)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono font-bold uppercase border border-neutral-300 bg-white hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-venm-neon px-5 py-2 text-xs font-bold font-mono tracking-widest uppercase cursor-pointer"
                >
                  {submitting ? 'SAVING...' : editingExpense ? 'UPDATE EXPENSE' : 'RECORD EXPENSE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-neutral-200 space-y-4">
            <h3 className="text-base font-bold font-mono tracking-wider text-neutral-900 uppercase">
              CONFIRM ARCHIVE
            </h3>
            <p className="text-xs text-neutral-600 font-sans">
              Are you sure you want to archive expense record{' '}
              <strong className="text-neutral-900 font-mono">"{deleteModal.item?.expenseNumber}"</strong>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, item: null })}
                className="px-4 py-2 text-xs font-mono font-bold uppercase border border-neutral-300 bg-white hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExpense}
                className="px-4 py-2 text-xs font-mono font-bold uppercase bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;

