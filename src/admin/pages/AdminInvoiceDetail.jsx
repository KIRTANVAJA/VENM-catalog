import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Building,
  CreditCard,
  ExternalLink,
  Share2,
  X,
  FileCheck,
  Send,
  Calendar,
  User,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import {
  apiGetInvoice,
  apiDeleteInvoice,
  apiDownloadInvoicePdf,
  apiUpdateInvoiceStatus
} from '../../services/api';

/**
 * Format currency in Indian format
 */
const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(val) || 0);
};

/**
 * Convert number to Indian currency words
 */
function numberToWords(number) {
  const n = Math.round(Number(number) || 0);
  if (n === 0) return 'Rupees Zero Only';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(num) {
    if ((num = num.toString()).length > 9) return 'Overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
  }

  return `Rupees ${inWords(n)} Only`;
}

const AdminInvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: 0,
    paymentMethod: 'UPI',
    transactionRef: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetInvoice(id);
      setInvoice(data);
      setPaymentForm(prev => ({
        ...prev,
        amountPaid: data.balanceDue > 0 ? data.balanceDue : 0,
        paymentMethod: data.paymentMethod || 'UPI'
      }));
    } catch (err) {
      console.error('Failed to load invoice:', err);
      setError(err.message || 'Invoice not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setActionLoading(true);
      await apiDownloadInvoicePdf(invoice.id, invoice.invoiceNumber);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`Are you sure you want to change invoice status to ${newStatus}?`)) return;
    try {
      setActionLoading(true);
      const updated = await apiUpdateInvoiceStatus(invoice.id, { status: newStatus });
      setInvoice(updated);
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const amt = Number(paymentForm.amountPaid) || 0;
      const totalPaid = (invoice.amountPaid || 0) + amt;

      const updated = await apiUpdateInvoiceStatus(invoice.id, {
        amountPaid: totalPaid,
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        transactionRef: paymentForm.transactionRef,
        status: invoice.status === 'DRAFT' ? 'ISSUED' : invoice.status
      });

      setInvoice(updated);
      setPaymentModalOpen(false);
    } catch (err) {
      alert(`Payment recording failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete invoice ${invoice.invoiceNumber}? This cannot be undone.`)) return;
    try {
      setActionLoading(true);
      await apiDeleteInvoice(invoice.id);
      navigate('/admin/invoices');
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-neutral-400">Loading Invoice Record...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 rounded-lg text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold uppercase tracking-wider">Invoice Not Found</h2>
          <p className="text-sm text-neutral-400">{error || 'Unable to retrieve invoice record.'}</p>
          <button
            onClick={() => navigate('/admin/invoices')}
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs uppercase tracking-wider font-semibold transition"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-20 font-sans print:bg-white print:text-black print:pb-0">
      {/* SCREEN ACTION TOPBAR (Hidden in Print) */}
      <div className="print:hidden border-b border-neutral-800 bg-neutral-900/90 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-4">
            <Link
              to="/admin/invoices"
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition"
              title="Back to Invoices"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold tracking-tight text-white">{invoice.invoiceNumber}</h1>
                {/* Status Badges */}
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                    invoice.status === 'PAID'
                      ? 'bg-lime-400/10 text-lime-400 border-lime-400/30'
                      : invoice.status === 'ISSUED'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : invoice.status === 'CANCELLED'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-neutral-700/30 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {invoice.status}
                </span>

                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                    invoice.paymentStatus === 'PAID'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : invoice.paymentStatus === 'PARTIALLY_PAID'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {invoice.paymentStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Created {new Date(invoice.createdAt).toLocaleDateString()} for {invoice.customerName}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Quick Status Transitions */}
            {invoice.status === 'DRAFT' && (
              <button
                onClick={() => handleStatusChange('ISSUED')}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded text-xs uppercase tracking-wider font-semibold transition"
              >
                Mark Issued
              </button>
            )}

            {invoice.paymentStatus !== 'PAID' && invoice.status !== 'CANCELLED' && (
              <button
                onClick={() => setPaymentModalOpen(true)}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded text-xs uppercase tracking-wider font-semibold transition flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Record Payment
              </button>
            )}

            {invoice.status !== 'CANCELLED' && (
              <button
                onClick={() => handleStatusChange('CANCELLED')}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 rounded text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
            )}

            {/* Edit Invoice */}
            <Link
              to={`/admin/invoices/${invoice.id}/edit`}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Link>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 transition"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-lime-400 hover:bg-lime-500 text-black font-semibold rounded text-xs uppercase tracking-wider flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>

            {/* Safe Delete for Draft */}
            {invoice.status === 'DRAFT' && (
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="p-1.5 text-neutral-500 hover:text-red-400 rounded hover:bg-neutral-800 transition"
                title="Delete Draft"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* INVOICE CANVAS / A4 PAPER CONTAINER */}
      <div className="max-w-4xl mx-auto mt-8 print:mt-0 px-4 sm:px-6 print:px-0">
        <div className="bg-white text-neutral-900 rounded shadow-2xl p-8 sm:p-12 print:p-0 print:shadow-none border border-neutral-200 print:border-none">
          
          {/* HEADER: BRAND & INVOICE META */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b-2 border-neutral-900">
            {/* Brand Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {invoice.showBrandLogo && invoice.brandLogo ? (
                  <img
                    src={invoice.brandLogo}
                    alt={invoice.brandName || 'VENM'}
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <div className="text-3xl font-black tracking-tighter text-neutral-900">
                    {invoice.brandName || 'VENM'}
                    <span className="text-lime-500">.</span>
                  </div>
                )}
              </div>
              {invoice.brandTagline && (
                <p className="text-xs font-semibold tracking-wider uppercase text-neutral-600">
                  {invoice.brandTagline}
                </p>
              )}
              <div className="text-xs text-neutral-600 space-y-0.5 pt-1">
                {invoice.brandAddress && <p>{invoice.brandAddress}</p>}
                {invoice.brandEmail && <p>Email: {invoice.brandEmail}</p>}
                {invoice.brandPhone && <p>Phone: {invoice.brandPhone}</p>}
                {invoice.showBrandGstin && invoice.brandGstin && (
                  <p className="font-mono font-semibold text-neutral-800">GSTIN: {invoice.brandGstin}</p>
                )}
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="sm:text-right space-y-1">
              <div className="inline-block bg-neutral-900 text-white font-mono text-xs px-2.5 py-1 uppercase tracking-widest font-bold">
                {invoice.invoiceType.replace('_', ' ')}
              </div>
              <h2 className="text-2xl font-mono font-bold tracking-tight text-neutral-900 pt-1">
                {invoice.invoiceNumber}
              </h2>
              <div className="text-xs text-neutral-600 space-y-0.5 pt-2">
                <p>
                  <span className="text-neutral-500">Date:</span>{' '}
                  <span className="font-medium text-neutral-900">
                    {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                  </span>
                </p>
                {invoice.dueDate && (
                  <p>
                    <span className="text-neutral-500">Due Date:</span>{' '}
                    <span className="font-medium text-neutral-900">
                      {new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </p>
                )}
                {invoice.orderId && (
                  <p>
                    <span className="text-neutral-500">Order Ref:</span>{' '}
                    <span className="font-mono font-medium text-neutral-900">{invoice.orderId}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* BILLED TO & SHIPPED TO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-neutral-200 text-xs">
            {/* Bill To */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Billed To</p>
              <h3 className="text-sm font-bold text-neutral-900">{invoice.customerName}</h3>
              {invoice.customerPhone && <p className="text-neutral-700">Phone: {invoice.customerPhone}</p>}
              {invoice.customerEmail && <p className="text-neutral-700">Email: {invoice.customerEmail}</p>}
              {invoice.billingAddress && <p className="text-neutral-700 pt-1 whitespace-pre-line">{invoice.billingAddress}</p>}
              <p className="text-neutral-700">
                {[invoice.city, invoice.state, invoice.pincode].filter(Boolean).join(', ')}
              </p>
              {invoice.customerGstin && (
                <p className="font-mono font-semibold text-neutral-800 pt-1">Customer GSTIN: {invoice.customerGstin}</p>
              )}
            </div>

            {/* Ship To / Additional Details */}
            <div className="space-y-1 sm:pl-6 sm:border-l border-neutral-200">
              {invoice.showShippingAddress && invoice.shippingAddress ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Shipped To</p>
                  <p className="text-neutral-700 whitespace-pre-line">{invoice.shippingAddress}</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Billing & Supply Details</p>
                  <p className="text-neutral-700">Place of Supply: <span className="font-semibold text-neutral-900">{invoice.state || 'Gujarat'}</span></p>
                  <p className="text-neutral-700">Tax Type: <span className="font-semibold text-neutral-900">{invoice.taxType === 'INTER_STATE' ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}</span></p>
                  <p className="text-neutral-700">Pricing Mode: <span className="font-semibold text-neutral-900">{invoice.pricingMode === 'TAX_INCLUSIVE' ? 'Tax Inclusive' : 'Tax Exclusive'}</span></p>
                  {invoice.preparedBy && (
                    <p className="text-neutral-700 pt-1">Prepared By: <span className="font-medium text-neutral-900">{invoice.preparedBy}</span></p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* LINE ITEMS TABLE */}
          <div className="py-6 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-900 text-[10px] uppercase font-bold tracking-wider text-neutral-700">
                  <th className="py-2.5 pr-2 w-8">#</th>
                  <th className="py-2.5 px-2">Item Description</th>
                  {invoice.showItemHsn && <th className="py-2.5 px-2 text-center w-16">HSN</th>}
                  <th className="py-2.5 px-2 text-center w-16">Size/Col</th>
                  <th className="py-2.5 px-2 text-right w-12">Qty</th>
                  <th className="py-2.5 px-2 text-right w-20">Rate</th>
                  {invoice.showItemDiscount && <th className="py-2.5 px-2 text-right w-20">Disc</th>}
                  <th className="py-2.5 px-2 text-right w-24">Taxable</th>
                  {invoice.taxEnabled && <th className="py-2.5 px-2 text-right w-24">Tax</th>}
                  <th className="py-2.5 pl-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-neutral-50/50">
                      <td className="py-3 pr-2 text-neutral-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-start gap-2.5">
                          {invoice.showItemImages && item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-9 h-9 object-cover rounded border border-neutral-200 flex-shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-bold text-neutral-900">{item.name}</p>
                            {item.sku && <p className="text-[10px] text-neutral-500 font-mono">SKU: {item.sku}</p>}
                            {invoice.showItemDescription && item.description && (
                              <p className="text-[11px] text-neutral-600 mt-0.5">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      {invoice.showItemHsn && (
                        <td className="py-3 px-2 text-center font-mono text-neutral-600">{item.hsnCode || '-'}</td>
                      )}
                      <td className="py-3 px-2 text-center text-neutral-700">
                        {[item.size, item.color].filter(Boolean).join(' / ') || '-'}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-medium">{item.quantity}</td>
                      <td className="py-3 px-2 text-right font-mono">{formatINR(item.unitPrice)}</td>
                      {invoice.showItemDiscount && (
                        <td className="py-3 px-2 text-right font-mono text-neutral-600">
                          {item.discountAmount > 0 ? `-${formatINR(item.discountAmount)}` : '-'}
                        </td>
                      )}
                      <td className="py-3 px-2 text-right font-mono font-medium">{formatINR(item.taxableAmount)}</td>
                      {invoice.taxEnabled && (
                        <td className="py-3 px-2 text-right font-mono text-neutral-700">
                          {item.taxRate > 0 ? (
                            <div>
                              <span>{formatINR(item.taxAmount)}</span>
                              <span className="text-[10px] text-neutral-500 block">({item.taxRate}%)</span>
                            </div>
                          ) : (
                            '0.00'
                          )}
                        </td>
                      )}
                      <td className="py-3 pl-2 text-right font-mono font-bold text-neutral-900">
                        {formatINR(item.lineTotal)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="py-4 text-center text-neutral-500 italic">
                      No items recorded in invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FINANCIAL SUMMARY & TOTALS */}
          <div className="pt-4 border-t-2 border-neutral-900 grid grid-cols-1 sm:grid-cols-12 gap-8">
            {/* Left Column: Words, Payment Details, Terms */}
            <div className="sm:col-span-7 space-y-5 text-xs text-neutral-700">
              {/* Words */}
              <div className="bg-neutral-50 p-3 rounded border border-neutral-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Amount in Words</p>
                <p className="font-semibold text-neutral-900 italic mt-0.5">
                  {numberToWords(invoice.grandTotal)}
                </p>
              </div>

              {/* Payment Details */}
              {invoice.showPaymentDetails && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Payment Information</p>
                  <p>Method: <span className="font-medium text-neutral-900">{invoice.paymentMethod || 'UPI / Bank Transfer'}</span></p>
                  {invoice.transactionRef && (
                    <p>Reference / UTR: <span className="font-mono font-medium text-neutral-900">{invoice.transactionRef}</span></p>
                  )}
                  {invoice.paymentDate && (
                    <p>Payment Date: <span className="font-medium text-neutral-900">{new Date(invoice.paymentDate).toLocaleDateString()}</span></p>
                  )}
                  {invoice.paymentTerms && (
                    <p className="text-neutral-600 pt-0.5">{invoice.paymentTerms}</p>
                  )}
                </div>
              )}

              {/* Customer Notes */}
              {invoice.showCustomerNotes && invoice.customerNotes && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Customer Notes</p>
                  <p className="text-neutral-600 whitespace-pre-line">{invoice.customerNotes}</p>
                </div>
              )}

              {/* Terms & Conditions */}
              {invoice.showTerms && invoice.termsAndConditions && (
                <div className="space-y-1 text-[11px] text-neutral-500">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">Terms & Conditions</p>
                  <p className="whitespace-pre-line leading-relaxed">{invoice.termsAndConditions}</p>
                </div>
              )}
            </div>

            {/* Right Column: Breakdown & Grand Total */}
            <div className="sm:col-span-5 space-y-2 text-xs">
              <div className="space-y-2 pb-3 border-b border-neutral-200 font-mono">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal:</span>
                  <span>{formatINR(invoice.subtotal)}</span>
                </div>

                {invoice.itemDiscountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Item Discounts:</span>
                    <span>-{formatINR(invoice.itemDiscountTotal)}</span>
                  </div>
                )}

                {invoice.invoiceDiscountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>
                      Invoice Discount {invoice.invoiceDiscountType === 'PERCENTAGE' ? `(${invoice.invoiceDiscountValue}%)` : ''}:
                    </span>
                    <span>-{formatINR(invoice.invoiceDiscountTotal)}</span>
                  </div>
                )}

                {invoice.shippingCharges > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Shipping Charges:</span>
                    <span>+{formatINR(invoice.shippingCharges)}</span>
                  </div>
                )}

                {invoice.packagingCharges > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Packaging Charges:</span>
                    <span>+{formatINR(invoice.packagingCharges)}</span>
                  </div>
                )}

                {invoice.additionalCharges > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Additional Charges:</span>
                    <span>+{formatINR(invoice.additionalCharges)}</span>
                  </div>
                )}

                {invoice.taxEnabled && (
                  <>
                    <div className="flex justify-between text-neutral-600 pt-1">
                      <span>Taxable Value:</span>
                      <span>{formatINR(invoice.taxableAmount)}</span>
                    </div>

                    {invoice.taxType === 'INTER_STATE' ? (
                      <div className="flex justify-between text-neutral-700">
                        <span>Integrated GST (IGST):</span>
                        <span>{formatINR(invoice.igstAmount)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-neutral-700">
                          <span>Central GST (CGST):</span>
                          <span>{formatINR(invoice.cgstAmount)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-700">
                          <span>State GST (SGST):</span>
                          <span>{formatINR(invoice.sgstAmount)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}

                {invoice.roundOff !== 0 && (
                  <div className="flex justify-between text-neutral-500 text-[11px]">
                    <span>Round-off:</span>
                    <span>{invoice.roundOff > 0 ? `+${formatINR(invoice.roundOff)}` : formatINR(invoice.roundOff)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total Box */}
              <div className="bg-neutral-900 text-white p-3.5 rounded flex justify-between items-center font-mono">
                <span className="font-bold uppercase tracking-wider text-sm">Grand Total</span>
                <span className="font-extrabold text-lg text-lime-400">{formatINR(invoice.grandTotal)}</span>
              </div>

              {/* Paid / Balance Due */}
              <div className="space-y-1.5 pt-2 font-mono">
                {invoice.advancePaid > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Advance Paid:</span>
                    <span>{formatINR(invoice.advancePaid)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-700">
                  <span>Amount Paid:</span>
                  <span className="font-bold text-neutral-900">{formatINR(invoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-neutral-200">
                  <span className="font-bold uppercase tracking-wider">Balance Due:</span>
                  <span className={`font-bold ${invoice.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatINR(invoice.balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURE & BRAND FOOTER */}
          <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-neutral-500">
            <div>
              <p className="font-medium text-neutral-800">{invoice.thankYouMessage || 'Thank you for choosing VENM.'}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">This is a computer-generated tax invoice and requires no physical seal.</p>
            </div>

            <div className="text-right space-y-8 sm:w-48">
              <p className="font-semibold text-neutral-800 uppercase tracking-wider text-[11px]">
                For {invoice.brandName || 'VENM'}
              </p>
              <div className="border-t border-neutral-400 pt-1 text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                Authorized Signatory
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full p-6 text-white space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="font-bold tracking-tight text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-lime-400" />
                Record Payment for {invoice.invoiceNumber}
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1 font-semibold">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amountPaid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                  className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-white font-mono text-lg focus:border-lime-400 outline-none"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Current Balance Due: <span className="font-mono text-red-400">{formatINR(invoice.balanceDue)}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1 font-semibold">
                  Payment Method
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-white text-sm focus:border-lime-400 outline-none"
                >
                  <option value="UPI">UPI / GooglePay / PhonePe</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash on Delivery / Direct</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1 font-semibold">
                  Transaction Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR123456789 or UPI Ref"
                  value={paymentForm.transactionRef}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                  className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-white text-sm focus:border-lime-400 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1 font-semibold">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-white text-sm focus:border-lime-400 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-lime-400 hover:bg-lime-500 text-black font-bold rounded text-xs uppercase tracking-wider transition"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoiceDetail;
