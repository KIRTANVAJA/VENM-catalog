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
  DollarSign
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
      // Load invoices to see which ones are costed and which are pending
      const res = await apiGetInvoices({
        search,
        limit: 50,
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
            ORDER COSTING & INVOICE MARGIN ATTRIBUTION
          </h2>
          <p className="text-xs text-neutral-600 font-sans">
            Link actual production costs, packaging, and courier delivery to specific customer invoices.
          </p>
        </div>

        <Link
          to="/admin/invoices"
          className="px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
        >
          <Receipt className="w-3.5 h-3.5 text-neutral-600" />
          <span>View Invoices &rarr;</span>
        </Link>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    ? 'bg-white text-neutral-950 shadow-xs'
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

      {/* Table */}
      <div className="bg-white border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold tracking-wider text-neutral-600">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client / Order</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Net Revenue</th>
                <th className="py-3 px-4 text-right">Direct Cost</th>
                <th className="py-3 px-4 text-right">Allocated Cost</th>
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
                    LOADING ORDERS & INVOICES...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-neutral-400 font-sans">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const oc = inv.orderCosting;
                  const isCosted = Boolean(oc);

                  // Net revenue = taxableAmount or subtotal - discounts
                  const netRev = oc
                    ? Number(oc.netRevenue)
                    : Number(inv.taxableAmount || (inv.subtotal - (inv.discountTotal || 0)));

                  const directCost = oc ? Number(oc.totalDirectCost) : 0;
                  const allocatedCost = oc ? Number(oc.totalAllocatedCost) : 0;
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
                      <td className="py-3 px-4 text-right font-black text-neutral-950">
                        ₹{netRev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600">
                        {isCosted ? `₹${directCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-600">
                        {isCosted ? `₹${allocatedCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
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
                              : 'bg-lime-400 hover:bg-lime-500 text-neutral-950 font-black shadow-xs'
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

