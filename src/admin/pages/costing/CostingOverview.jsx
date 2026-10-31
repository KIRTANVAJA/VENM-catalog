import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Package,
  CreditCard,
  Receipt,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Clock
} from 'lucide-react';
import { apiGetCostingOverview } from '../../../services/api';

const CostingOverview = () => {
  const [period, setPeriod] = useState('THIS_MONTH');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchOverview = async (selectedPeriod = period) => {
    setLoading(true);
    setError(null);
    try {
      const params = { period: selectedPeriod };
      if (selectedPeriod === 'CUSTOM' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const res = await apiGetCostingOverview(params);
      setData(res);
    } catch (err) {
      console.error('Failed to load costing overview:', err);
      setError(err.message || 'Error loading costing metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(period);
  }, [period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleCustomFilterSubmit = (e) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setPeriod('CUSTOM');
      fetchOverview('CUSTOM');
    }
  };

  const metrics = data?.metrics || {};
  const alerts = data?.alerts || {};
  const trend = data?.monthlyTrend || [];

  const getMarginBadgeClass = (margin) => {
    const num = Number(margin) || 0;
    if (num >= 50) return 'bg-lime-400 text-neutral-950 font-black border-lime-500';
    if (num >= 35) return 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300';
    if (num >= 20) return 'bg-amber-100 text-amber-800 font-bold border-amber-300';
    return 'bg-red-100 text-red-800 font-black border-red-300';
  };

  return (
    <div className="space-y-6">
      {/* Date Filter Bar */}
      <div className="bg-white p-4 border border-neutral-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-bold uppercase mr-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
            TIMEFRAME:
          </span>
          {[
            { id: 'TODAY', label: 'Today' },
            { id: 'THIS_WEEK', label: 'This Week' },
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: 'LAST_MONTH', label: 'Last Month' },
            { id: 'THIS_YEAR', label: 'This Year' },
            { id: 'ALL', label: 'All Time' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handlePeriodChange(item.id)}
              className={`px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all border cursor-pointer ${
                period === item.id
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border-neutral-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Form */}
        <form onSubmit={handleCustomFilterSubmit} className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="border border-neutral-300 px-2 py-1 text-xs font-mono bg-white"
          />
          <span className="text-xs text-neutral-400 font-mono">TO</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="border border-neutral-300 px-2 py-1 text-xs font-mono bg-white"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 cursor-pointer"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => fetchOverview(period)}
            className="p-1.5 border border-neutral-300 text-neutral-600 hover:text-black cursor-pointer bg-white"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* Orders Missing Costing Alert Banner */}
      {metrics.ordersMissingCosting > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-mono font-bold uppercase text-amber-900 tracking-wide">
                {metrics.ordersMissingCosting} Order{metrics.ordersMissingCosting > 1 ? 's' : ''} Missing Actual Production Costing
              </p>
              <p className="text-[11px] text-amber-700">
                Invoices have been issued or paid but actual material and variable expenses haven't been finalized.
              </p>
            </div>
          </div>
          <Link
            to="/admin/costing/orders"
            className="px-3 py-1.5 text-xs font-mono font-black tracking-wider uppercase bg-amber-600 hover:bg-amber-700 text-white shadow-xs shrink-0 inline-block text-center"
          >
            Cost Pending Orders &rarr;
          </Link>
        </div>
      )}

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Sales Revenue */}
        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2 border-l-4 border-l-neutral-900">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-800">NET SALES REVENUE</span>
            <DollarSign className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-950 font-mono">
            ₹{(metrics.netSalesRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
            <span>Total Invoiced: ₹{(metrics.totalInvoicedSales || 0).toLocaleString('en-IN')}</span>
            <span className="text-[9px] bg-neutral-100 px-1.5 py-0.5 border border-neutral-200">Excl. Output GST</span>
          </div>
        </div>

        {/* COGS (Direct Costs) */}
        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-800">COST OF GOODS SOLD (COGS)</span>
            <Layers className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-950 font-mono">
            ₹{(metrics.cogs || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">
            Direct blanks, fabric, tailoring & craftwork
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2 border-l-4 border-l-lime-500">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-800">GROSS PROFIT</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 border uppercase ${getMarginBadgeClass(metrics.grossMarginPercent)}`}>
              {metrics.grossMarginPercent || 0}% MARGIN
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-950 font-mono">
            ₹{(metrics.grossProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">
            Revenue minus Direct Production Costs
          </div>
        </div>

        {/* Net Operating Profit & Margin */}
        <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-800">NET OPERATING PROFIT</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 border uppercase ${getMarginBadgeClass(metrics.netMarginPercent)}`}>
              {metrics.netMarginPercent || 0}% NET
            </span>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${(metrics.netOperatingProfit || 0) >= 0 ? 'text-neutral-950' : 'text-red-600'}`}>
            ₹{(metrics.netOperatingProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">
            After variable costs & studio operating overhead
          </div>
        </div>
      </div>

      {/* Secondary Cost Breakdown Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Order Variable Costs */}
        <div className="bg-white p-4 border border-neutral-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-500">ORDER VARIABLE COSTS</span>
          <div className="text-xl font-bold font-mono text-neutral-900">
            ₹{(metrics.variableCosts || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-neutral-500 font-mono">Packaging, courier fees, free gifts</p>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white p-4 border border-neutral-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-500">STUDIO OPERATING EXPENSES</span>
          <div className="text-xl font-bold font-mono text-neutral-900">
            ₹{(metrics.operatingExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-neutral-500 font-mono">Unallocated rent, utilities, software</p>
        </div>

        {/* Contribution Profit */}
        <div className="bg-white p-4 border border-neutral-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-500">CONTRIBUTION PROFIT</span>
          <div className="text-xl font-bold font-mono text-neutral-900">
            ₹{(metrics.contributionProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-neutral-500 font-mono">{metrics.contributionMarginPercent || 0}% of net revenue</p>
        </div>

        {/* Cash Collected vs Receivables */}
        <div className="bg-white p-4 border border-neutral-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-500">COLLECTED / RECEIVABLES</span>
          <div className="text-xl font-bold font-mono text-neutral-900">
            ₹{(metrics.paymentsReceived || 0).toLocaleString('en-IN')} <span className="text-xs text-neutral-400 font-normal">/ ₹{(metrics.outstandingReceivables || 0).toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[10px] text-neutral-500 font-mono">Actual cash inflow vs pending balance</p>
        </div>
      </div>

      {/* 6-Month Profitability Trend Table */}
      <div className="bg-white border border-neutral-200 shadow-xs">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold font-mono tracking-wider text-neutral-900 uppercase">
              MONTHLY PROFITABILITY TREND (LAST 6 MONTHS)
            </h2>
            <p className="text-[11px] text-neutral-500 font-sans">
              Financial performance comparing Net Sales, COGS, Gross Profit, and Net Operating Margin.
            </p>
          </div>
          <Link
            to="/admin/costing/reports"
            className="text-xs font-mono font-bold tracking-wider text-neutral-800 hover:text-black uppercase flex items-center gap-1"
          >
            Detailed Reports &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold tracking-wider text-neutral-600">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Net Sales</th>
                <th className="py-3 px-4 text-right">COGS (Direct)</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-center">Gross Margin</th>
                <th className="py-3 px-4 text-right">Net Operating Profit</th>
                <th className="py-3 px-4 text-center">Net Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {trend.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-neutral-400 font-sans text-xs">
                    No historical sales records found for this period.
                  </td>
                </tr>
              ) : (
                trend.map((m, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-neutral-900 uppercase">{m.month}</td>
                    <td className="py-3 px-4 text-right text-neutral-900">₹{m.revenue.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-rose-600">₹{m.cogs.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold text-neutral-900">₹{m.grossProfit.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 text-[9px] border uppercase ${getMarginBadgeClass(m.grossMargin)}`}>
                        {m.grossMargin}%
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${m.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      ₹{m.netProfit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 text-[9px] border uppercase ${getMarginBadgeClass(m.netMargin)}`}>
                        {m.netMargin}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Margin Alerts Section */}
      {alerts.lowMarginProducts && alerts.lowMarginProducts.length > 0 && (
        <div className="bg-white border border-neutral-200 shadow-xs">
          <div className="p-4 border-b border-neutral-200 bg-amber-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold font-mono tracking-wider text-amber-950 uppercase">
                LOW GROSS MARGIN WARNINGS (&lt; {alerts.lowThreshold}%)
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 px-2 py-0.5 font-bold border border-amber-300">
              {alerts.lowMarginProducts.length} Profiles Flagged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold tracking-wider text-neutral-600">
                <tr>
                  <th className="py-2.5 px-4">Product / Silhouette</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Unit Cost</th>
                  <th className="py-2.5 px-4 text-right">Selling Price</th>
                  <th className="py-2.5 px-4 text-right">Unit Profit</th>
                  <th className="py-2.5 px-4 text-center">Gross Margin</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {alerts.lowMarginProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="py-2.5 px-4 font-bold text-neutral-900">{p.productName}</td>
                    <td className="py-2.5 px-4 text-neutral-600">{p.category || 'N/A'}</td>
                    <td className="py-2.5 px-4 text-right text-rose-600">₹{p.actualUnitCost || p.estimatedUnitCost}</td>
                    <td className="py-2.5 px-4 text-right text-neutral-900">₹{p.actualSellingPrice || p.suggestedSellingPrice}</td>
                    <td className="py-2.5 px-4 text-right text-neutral-900 font-bold">₹{p.grossProfit}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 text-[9px] font-bold border border-red-300 bg-red-100 text-red-800">
                        {p.grossProfitMargin}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        to={`/admin/costing/products/${p.id}/edit`}
                        className="text-[10px] font-mono font-bold uppercase underline text-neutral-800 hover:text-black"
                      >
                        Adjust Pricing
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostingOverview;

