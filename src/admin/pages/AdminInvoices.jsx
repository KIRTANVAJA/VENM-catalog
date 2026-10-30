import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  Receipt,
  X,
  CreditCard,
  Building,
  RefreshCw
} from 'lucide-react';
import {
  apiGetInvoices,
  apiDeleteInvoice,
  apiDownloadInvoicePdf,
  apiGetInvoiceSettings,
  apiUpdateInvoiceSettings
} from '../../services/api';

const AdminInvoices = () => {
  const navigate = useNavigate();

  // State
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    draftCount: 0,
    paidCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, invoice: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await apiGetInvoices({
        page,
        limit: 15,
        search,
        status: status === 'ALL' ? undefined : status,
        paymentStatus: paymentStatus === 'ALL' ? undefined : paymentStatus
      });
      setInvoices(data.invoices || []);
      if (data.stats) setStats(data.stats);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalRecords(data.pagination.total || 0);
      }
    } catch (err) {
      showToast('FAILED TO LOAD INVOICES: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [page, status, paymentStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadInvoices();
  };

  // Open settings modal
  const handleOpenSettings = async () => {
    try {
      const s = await apiGetInvoiceSettings();
      setSettingsForm(s);
      setIsSettingsOpen(true);
    } catch (err) {
      showToast('FAILED TO LOAD SETTINGS: ' + err.message, true);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await apiUpdateInvoiceSettings(settingsForm);
      showToast('INVOICE SETTINGS SAVED TO DATABASE');
      setIsSettingsOpen(false);
    } catch (err) {
      showToast('SAVE FAILED: ' + err.message, true);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Safe delete handler
  const confirmDelete = async () => {
    if (!deleteModal.invoice) return;
    setIsDeleting(true);
    try {
      await apiDeleteInvoice(deleteModal.invoice.id);
      showToast(`INVOICE ${deleteModal.invoice.invoiceNumber} DELETED`);
      setDeleteModal({ isOpen: false, invoice: null });
      loadInvoices();
    } catch (err) {
      showToast(err.message || 'DELETION NOT PERMITTED', true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPdf = async (inv) => {
    try {
      showToast(`GENERATING PDF FOR #${inv.invoiceNumber}...`);
      await apiDownloadInvoicePdf(inv.id, inv.invoiceNumber);
      showToast(`PDF DOWNLOADED SUCCESSFULLY`);
    } catch (err) {
      showToast('PDF GENERATION FAILED: ' + err.message, true);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-fadeIn font-sans">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-800 font-bold uppercase">
            BILLING & FINANCIAL OPS // TAX COMPLIANCE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-neutral-900 uppercase">
            INVOICE MANAGEMENT
          </h1>
          <p className="text-xs text-neutral-600 font-sans">
            Issue, recalculate, print and archive professional GST tax invoices and client quotes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleOpenSettings}
            className="px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Settings className="w-4 h-4 text-neutral-600" />
            <span>Invoice Settings</span>
          </button>

          <Link
            to="/admin/invoices/new"
            className="btn-venm-neon px-5 py-2.5 text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-neutral-900" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">TOTAL BILLED</span>
            <FileText className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
            ₹{stats.totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Across {stats.totalInvoices} issued documents</div>
        </div>

        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2 border-l-4 border-l-lime-500">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-800">TOTAL COLLECTED</span>
            <CheckCircle2 className="w-4 h-4 text-lime-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
            ₹{stats.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-lime-700 font-mono font-bold">{stats.paidCount} fully settled invoices</div>
        </div>

        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">OUTSTANDING BALANCE</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
            ₹{stats.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Pending client collection</div>
        </div>

        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">DRAFT INVOICES</span>
            <Clock className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">{stats.draftCount}</div>
          <div className="text-[10px] text-neutral-500 font-mono">Unissued editable drafts</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice #, customer name, phone, order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold uppercase text-neutral-500">STATUS:</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-neutral-50 border border-neutral-300 px-2.5 py-1.5 text-xs font-mono font-bold text-neutral-800 focus:outline-none focus:border-neutral-900"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ISSUED">ISSUED</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold uppercase text-neutral-500">PAYMENT:</span>
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="bg-neutral-50 border border-neutral-300 px-2.5 py-1.5 text-xs font-mono font-bold text-neutral-800 focus:outline-none focus:border-neutral-900"
            >
              <option value="ALL">ALL PAYMENTS</option>
              <option value="PAID">PAID</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="UNPAID">UNPAID</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-neutral-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-mono uppercase text-neutral-600 tracking-wider">
              <th className="py-3 px-4">INVOICE #</th>
              <th className="py-3 px-4">DATE</th>
              <th className="py-3 px-4">CUSTOMER</th>
              <th className="py-3 px-4">ORDER REF</th>
              <th className="py-3 px-4 text-right">TOTAL (₹)</th>
              <th className="py-3 px-4">PAYMENT STATUS</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-xs font-sans">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs font-mono text-neutral-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-neutral-600" />
                    <span>RETRIEVING INVOICES FROM DATABASE...</span>
                  </div>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs font-mono text-neutral-500 space-y-2">
                  <p>NO INVOICES FOUND MATCHING YOUR CRITERIA.</p>
                  <Link
                    to="/admin/invoices/new"
                    className="inline-block mt-2 px-4 py-2 bg-neutral-900 text-white font-mono text-[10px] uppercase font-bold"
                  >
                    + CREATE FIRST INVOICE
                  </Link>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const isPaid = inv.paymentStatus === 'PAID';
                const isPartial = inv.paymentStatus === 'PARTIALLY_PAID';
                const isIssued = inv.status === 'ISSUED';
                const isDraft = inv.status === 'DRAFT';

                return (
                  <tr key={inv.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* Invoice Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                      <Link
                        to={`/admin/invoices/${inv.id}`}
                        className="hover:text-lime-600 underline underline-offset-2 flex items-center gap-1.5"
                      >
                        <Receipt className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{inv.invoiceNumber}</span>
                      </Link>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono text-neutral-600 text-[11px]">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900">{inv.customerName}</div>
                      {inv.customerPhone && (
                        <div className="text-[10px] font-mono text-neutral-500">{inv.customerPhone}</div>
                      )}
                    </td>

                    {/* Order ID */}
                    <td className="py-3.5 px-4 font-mono text-neutral-600 text-[11px]">
                      {inv.orderId ? (
                        <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200">
                          {inv.orderId}
                        </span>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>

                    {/* Grand Total */}
                    <td className="py-3.5 px-4 font-mono font-black text-right text-neutral-900">
                      ₹{Number(inv.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Payment Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-mono uppercase font-extrabold border ${
                          isPaid
                            ? 'bg-lime-100 text-lime-900 border-lime-300'
                            : isPartial
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-red-100 text-red-900 border-red-300'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>

                    {/* Invoice Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-mono uppercase font-extrabold border ${
                          isIssued
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : isDraft
                            ? 'bg-neutral-100 text-neutral-700 border-neutral-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/invoices/${inv.id}`}
                          title="View / Print Invoice"
                          className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(inv)}
                          title="Download PDF"
                          className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          to={`/admin/invoices/${inv.id}/edit`}
                          title="Edit Invoice"
                          className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>

                        {isDraft && (
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, invoice: inv })}
                            title="Delete Draft"
                            className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs font-mono text-neutral-600 border-t border-neutral-200 pt-4">
          <div>
            Showing {(page - 1) * 15 + 1} - {Math.min(page * 15, totalRecords)} of {totalRecords} records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-neutral-300 disabled:opacity-40 hover:bg-neutral-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 border border-neutral-300 disabled:opacity-40 hover:bg-neutral-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ----------------- INVOICE SETTINGS MODAL ----------------- */}
      {isSettingsOpen && settingsForm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-sans animate-fadeIn"
        >
          <div className="relative w-full max-w-2xl bg-white border border-neutral-200 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-6">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase font-bold">
                  TAX & INVOICE PREFERENCES
                </span>
                <h3 className="text-xl font-black uppercase text-neutral-900 tracking-wide">
                  Default Brand & Invoice Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-neutral-700">BRAND NAME</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.brandName || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brandName: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-neutral-700">TAGLINE</label>
                  <input
                    type="text"
                    value={settingsForm.brandTagline || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brandTagline: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-neutral-700">BRAND GSTIN</label>
                  <input
                    type="text"
                    value={settingsForm.brandGstin || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brandGstin: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-neutral-700">INVOICE PREFIX</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.invoicePrefix || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, invoicePrefix: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-neutral-700">BUSINESS EMAIL</label>
                  <input
                    type="email"
                    value={settingsForm.brandEmail || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brandEmail: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-neutral-700">CONTACT PHONE</label>
                  <input
                    type="text"
                    value={settingsForm.brandPhone || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brandPhone: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">REGISTERED BUSINESS ADDRESS</label>
                <textarea
                  rows={2}
                  value={settingsForm.brandAddress || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, brandAddress: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-neutral-700">DEFAULT GST TAX RATE (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={settingsForm.defaultTaxRate || 12}
                    onChange={(e) => setSettingsForm({ ...settingsForm, defaultTaxRate: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-neutral-700">DEFAULT TAX MODE</label>
                  <select
                    value={settingsForm.defaultTaxType || 'INTRA_STATE'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, defaultTaxType: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                  >
                    <option value="INTRA_STATE">INTRA-STATE (CGST + SGST)</option>
                    <option value="INTER_STATE">INTER-STATE (IGST)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">DEFAULT TERMS & CONDITIONS</label>
                <textarea
                  rows={3}
                  value={settingsForm.defaultTerms || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, defaultTerms: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 font-mono text-[11px] focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-neutral-700">DEFAULT THANK YOU NOTE</label>
                <input
                  type="text"
                  value={settingsForm.defaultThankYou || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, defaultThankYou: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 font-bold uppercase font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="btn-venm-neon px-5 py-2 font-mono font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- SAFE DELETE CONFIRMATION MODAL ----------------- */}
      {deleteModal.isOpen && deleteModal.invoice && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-sans animate-fadeIn"
        >
          <div className="w-full max-w-md bg-white border border-neutral-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 text-red-600 border border-red-200 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-neutral-900 uppercase">
                  DELETE INVOICE #{deleteModal.invoice.invoiceNumber}?
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Are you sure you want to permanently delete draft invoice{' '}
                  <strong className="text-neutral-900">{deleteModal.invoice.invoiceNumber}</strong> for{' '}
                  <strong className="text-neutral-900">{deleteModal.invoice.customerName}</strong>?
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, invoice: null })}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-mono border border-neutral-300 text-neutral-700 uppercase font-bold hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-mono bg-red-600 hover:bg-red-700 text-white uppercase font-bold cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoices;

