import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  DollarSign,
  Plus,
  Layers
} from 'lucide-react';
import { apiGetInvoices, apiGetOrderCostings } from '../../../services/api';

const OrderCostingList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiGetInvoices({
        search,
        limit: 100,
        status: 'ALL'
      });
      setInvoices(res.invoices || []);
    } catch (err) {
      showToast('FAILED TO LOAD INVOICES: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Filter based on whether orderCosting exists or matches filter
  const filteredInvoices = invoices.filter((inv) => {
    if (inv.status === 'CANCELLED') return false;
    const hasCosting = Boolean(inv.orderCosting);
    if (statusFilter === 'PENDING') return !hasCosting;
    if (statusFilter === 'COMPLETED') return hasCosting;
    return true;
  });

  const totalBilledSales = invoices.reduce((acc, inv) => acc + Number(inv.grandTotal || 0), 0);
  const costedCount = invoices.filter((inv) => Boolean(inv.orderCosting)).length;
  const pendingCount = invoices.length - costedCount;

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
        <div>
          <h2 className="text-xl font-black font-mono tracking-wider text-neutral-900 uppercase">
            ORDER COSTING & INVOICE MARGIN ATTRIBUTION
          </h2>
          <p className="text-xs text-neutral-600 font-sans">
            Every invoice on VENM is listed here. Select any order to itemize production blanks, custom materials, and courier fees.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/admin/invoices/new"
            className="btn-venm-neon px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-neutral-900" />
            <span>Create New Invoice</span>
          </Link>
          <Link
            to="/admin/invoices"
            className="px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-neutral-600" />
            <span>Manage Invoices &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Top Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-neutral-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-500">
            TOTAL INVOICED ORDERS
          </span>
          <div className="text-2xl font-black font-mono text-neutral-900">
            {invoices.length}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Issued on VENM catalog</span>
        </div>

        <div className="bg-white p-4 border border-neutral-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-500">
            TOTAL SALES VALUE
          </span>
          <div className="text-2xl font-black font-mono text-neutral-900">
            ₹{totalBilledSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Gross billed orders</span>
        </div>

        <div className="bg-white p-4 border border-neutral-200 shadow-xs space-y-1 border-l-4 border-l-lime-500">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-800">
            COSTED ORDERS
          </span>
          <div className="text-2xl font-black font-mono text-neutral-900">
            {costedCount}
          </div>
          <span className="text-[10px] text-lime-700 font-mono font-bold">Actual margins recorded</span>
        </div>

        <div className="bg-white p-4 border border-neutral-200 shadow-xs space-y-1 border-l-4 border-l-amber-500">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-800">
            PENDING COSTING
          </span>
          <div className="text-2xl font-black font-mono text-amber-600">
            {pendingCount}
          </div>
          <span className="text-[10px] text-amber-700 font-mono">Awaiting production cost input</span>
        </div>
      </div>

      {/* Quick Start Dropdown Selector & Search Controls */}
      <div className="bg-white p-4 border border-neutral-200 shadow-xs space-y-4">
        {/* Quick Selector */}
        {invoices.length > 0 && (
          <div className="p-3 bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-lime-600 shrink-0" />
              <span className="text-xs font-mono font-bold uppercase text-neutral-900">
                QUICK SELECT INVOICE TO COST:
              </span>
            </div>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) navigate(`/admin/costing/orders/${e.target.value}`);
              }}
              className="border border-neutral-300 px-3 py-1.5 text-xs font-mono bg-white font-bold w-full sm:w-auto min-w-[280px]"
            >
              <option value="">-- Choose an Invoice to Cost --</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customerName} (₹{inv.grandTotal}) {inv.orderCosting ? '✓ Costed' : '• Pending'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by invoice #, customer, order ID..."
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
            <div className="flex items-center gap-1 border border-neutral-300 p-0.5 bg-neutral-100">
              {[
                { id: 'ALL', label: 'All Invoices' },
                { id: 'PENDING', label: 'Pending Costing' },
                { id: 'COMPLETED', label: 'Costed' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-white text-neutral-950 shadow-xs font-black'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

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
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold tracking-wider text-neutral-600">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client / Order</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Invoice Total</th>
                <th className="py-3 px-4 text-right">Net Revenue</th>
                <th className="py-3 px-4 text-right">Direct Cost</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-center">Net Margin</th>
                <th className="py-3 px-4 text-center">Costing Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-neutral-500 font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    LOADING ALL INVOICES ON VENM...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-neutral-400 font-sans">
                    No matching invoices found in this view.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const oc = inv.orderCosting;
                  const isCosted = Boolean(oc);

                  const netRev = oc
                    ? Number(oc.netRevenue)
                    : Number(inv.taxableAmount !== undefined && inv.taxableAmount !== null ? inv.taxableAmount : (inv.subtotal - (inv.discountTotal || 0)));

                  const directCost = oc ? Number(oc.totalDirectCost) : 0;
                  const netProfit = oc ? Number(oc.netProfit) : 0;
                  const netMargin = oc ? Number(oc.netProfitMargin) : 0;

                  return (
                    <tr key={inv.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          to={`/admin/invoices/${inv.id}`}
                          className="font-bold text-neutral-900 hover:underline flex items-center gap-1"
                        >
                          {inv.invoiceNumber}
                        </Link>
                        <span className="text-[10px] text-neutral-500 font-sans">{inv.invoiceType || 'TAX INVOICE'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900">{inv.customerName}</div>
                        <div className="text-[10px] text-neutral-500">{inv.orderId ? `Order: ${inv.orderId}` : 'Direct Sale'}</div>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-neutral-900">
                        ₹{Number(inv.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-neutral-950">
                        ₹{netRev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600">
                        {isCosted ? `₹${directCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {isCosted ? `₹${netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCosted ? (
                          <span
                            className={`px-2 py-0.5 text-[9px] font-mono font-bold border uppercase ${
                              netMargin >= 35
                                ? 'bg-lime-400 text-neutral-950 border-lime-500'
                                : netMargin >= 20
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                            }`}
                          >
                            {netMargin}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-400 font-mono">Uncosted</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCosted ? (
                          <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-neutral-900 text-white font-bold border border-neutral-900">
                            {oc.status || 'COMPLETED'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/costing/orders/${inv.id}`}
                          className={`px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                            isCosted
                              ? 'bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900'
                              : 'btn-venm-neon'
                          }`}
                        >
                          <span>{isCosted ? 'Edit Costing' : 'Cost Order'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderCostingList;
