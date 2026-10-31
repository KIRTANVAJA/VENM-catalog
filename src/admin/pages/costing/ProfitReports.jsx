import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  FileText
} from 'lucide-react';
import { apiGetProfitReports, apiExportProfitReportsCSV } from '../../../services/api';

const ProfitReports = () => {
  const [groupBy, setGroupBy] = useState('product');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = { groupBy };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await apiGetProfitReports(params);
      setData(res.data || []);
    } catch (err) {
      showToast('FAILED TO LOAD REPORT: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [groupBy]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadReport();
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await apiExportProfitReportsCSV(groupBy);
      showToast('CSV EXPORT DOWNLOADED');
    } catch (err) {
      showToast('EXPORT FAILED: ' + err.message, true);
    } finally {
      setExporting(false);
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
            FINANCIAL PROFITABILITY REPORTS
          </h2>
          <p className="text-xs text-neutral-600 font-sans">
            Multi-dimensional reporting across products, invoices, collections, and garment categories.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={exporting}
          className="btn-venm-neon px-5 py-2.5 text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
        >
          <Download className="w-4 h-4 text-neutral-900" />
          <span>{exporting ? 'EXPORTING...' : 'EXPORT CSV'}</span>
        </button>
      </div>

      {/* Filter and Group Controls */}
      <div className="bg-white p-4 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono tracking-widest text-neutral-500 font-bold uppercase mr-1">
            REPORT DIMENSION:
          </span>
          {[
            { id: 'product', label: 'By Product' },
            { id: 'invoice', label: 'By Invoice' },
            { id: 'collection', label: 'By Collection' },
            { id: 'category', label: 'By Category' }
          ].map((dim) => (
            <button
              key={dim.id}
              onClick={() => setGroupBy(dim.id)}
              className={`px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all border cursor-pointer ${
                groupBy === dim.id
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border-neutral-300'
              }`}
            >
              {dim.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleFilterSubmit} className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-neutral-300 px-2 py-1 text-xs font-mono bg-white"
          />
          <span className="text-xs text-neutral-400 font-mono">TO</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
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
            onClick={loadReport}
            className="p-1.5 border border-neutral-300 text-neutral-600 hover:text-black cursor-pointer bg-white"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {groupBy === 'product' && (
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold tracking-wider text-neutral-600">
                <tr>
                  <th className="py-3 px-4">Product / Silhouette</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Net Revenue</th>
                  <th className="py-3 px-4 text-right">COGS (Direct)</th>
                  <th className="py-3 px-4 text-right">Allocated Expenses</th>
                  <th className="py-3 px-4 text-right">Gross Profit</th>
                  <th className="py-3 px-4 text-center">Gross Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-neutral-400 font-mono">
                      GENERATING PRODUCT PROFIT REPORT...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-neutral-400 font-sans">
                      No sales data found for the selected period.
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="py-3 px-4 font-bold text-neutral-900">{row.name}</td>
                      <td className="py-3 px-4 text-neutral-600">{row.sku}</td>
                      <td className="py-3 px-4 text-center">{row.unitsSold} pcs</td>
                      <td className="py-3 px-4 text-right font-black text-neutral-950">
                        ₹{Number(row.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600">
                        ₹{Number(row.cogs).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-600">
                        ₹{Number(row.allocatedExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${row.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        ₹{Number(row.grossProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold border uppercase ${
                            row.grossMarginPercent >= 35
                              ? 'bg-lime-400 text-neutral-950 border-lime-500 font-black'
                              : row.grossMarginPercent >= 20
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          {row.grossMarginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {groupBy === 'invoice' && (
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold tracking-wider text-neutral-600">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Net Revenue</th>
                  <th className="py-3 px-4 text-right">Direct Cost</th>
                  <th className="py-3 px-4 text-right">Allocated Cost</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                  <th className="py-3 px-4 text-center">Net Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-neutral-400 font-mono">
                      GENERATING INVOICE PROFIT REPORT...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-neutral-400 font-sans">
                      No costed invoices found for this range.
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="py-3 px-4 font-bold text-neutral-900">{row.invoiceNumber}</td>
                      <td className="py-3 px-4 text-neutral-600">
                        {row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-neutral-800">{row.customerName}</td>
                      <td className="py-3 px-4 text-right font-black text-neutral-950">
                        ₹{Number(row.netRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600">
                        ₹{Number(row.directCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-600">
                        ₹{Number(row.allocatedCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${row.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        ₹{Number(row.netProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold border uppercase ${
                            row.netMarginPercent >= 35
                              ? 'bg-lime-400 text-neutral-950 border-lime-500 font-black'
                              : row.netMarginPercent >= 20
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          {row.netMarginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {(groupBy === 'collection' || groupBy === 'category') && (
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold tracking-wider text-neutral-600">
                <tr>
                  <th className="py-3 px-4">{groupBy === 'collection' ? 'Collection Name' : 'Category Name'}</th>
                  <th className="py-3 px-4 text-center">Active Profiles</th>
                  <th className="py-3 px-4 text-right">Avg Unit Cost</th>
                  <th className="py-3 px-4 text-right">Avg Selling Price</th>
                  <th className="py-3 px-4 text-center">Average Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-neutral-400 font-mono">
                      AGGREGATING DATA...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-neutral-400 font-sans">
                      No profiles found.
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="py-3 px-4 font-bold text-neutral-900">{row.groupName}</td>
                      <td className="py-3 px-4 text-center">{row.productCount} profiles</td>
                      <td className="py-3 px-4 text-right text-rose-600">
                        ₹{Number(row.averageCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-neutral-950">
                        ₹{Number(row.averageSellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold border uppercase ${
                            row.averageMarginPercent >= 35
                              ? 'bg-lime-400 text-neutral-950 border-lime-500 font-black'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {row.averageMarginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfitReports;

