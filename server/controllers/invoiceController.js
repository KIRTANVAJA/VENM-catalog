import prisma from '../config/db.js';
import { calculateInvoiceTotals, round2 } from '../utils/invoiceCalculations.js';
import { generateInvoicePdf } from '../utils/invoicePdf.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * Generate a unique sequential invoice number
 * Format: [PREFIX]-[YEAR]-[0001]
 */
async function generateUniqueInvoiceNumber(prefix = 'VNM-INV') {
  const currentYear = new Date().getFullYear();
  const searchPattern = `${prefix}-${currentYear}-`;

  // Find all invoices matching the current prefix & year pattern
  const existingInvoices = await prisma.invoice.findMany({
    where: {
      invoiceNumber: { startsWith: searchPattern }
    },
    select: { invoiceNumber: true }
  });

  let maxSeq = 0;
  const regex = new RegExp(`^${prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}-${currentYear}-(\\d+)`);

  for (const inv of existingInvoices) {
    const match = inv.invoiceNumber.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${searchPattern}${String(nextSeq).padStart(4, '0')}`;

  // Collision safety loop
  while (await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } })) {
    nextSeq++;
    candidate = `${searchPattern}${String(nextSeq).padStart(4, '0')}`;
  }

  return candidate;
}

/**
 * GET /api/admin/invoices
 * List invoices with search, filters, pagination, and KPI metrics
 */
export const getInvoices = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { search, status, paymentStatus, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      where.paymentStatus = paymentStatus;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
        { orderId: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.invoiceDate.lte = end;
      }
    }

    const orderBy = {};
    if (['invoiceDate', 'createdAt', 'grandTotal', 'invoiceNumber'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [invoices, total, allInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          items: {
            select: { id: true, name: true, quantity: true, lineTotal: true }
          }
        }
      }),
      prisma.invoice.count({ where }),
      // Overall aggregated stats
      prisma.invoice.findMany({
        select: {
          grandTotal: true,
          amountPaid: true,
          balanceDue: true,
          status: true,
          paymentStatus: true
        }
      })
    ]);

    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let draftCount = 0;
    let paidCount = 0;

    for (const inv of allInvoices) {
      if (inv.status !== 'CANCELLED') {
        totalBilled = round2(totalBilled + (inv.grandTotal || 0));
        totalCollected = round2(totalCollected + (inv.amountPaid || 0));
        totalOutstanding = round2(totalOutstanding + (inv.balanceDue || 0));
      }
      if (inv.status === 'DRAFT') draftCount++;
      if (inv.paymentStatus === 'PAID') paidCount++;
    }

    return res.json({
      invoices,
      pagination: {
        total,
        page,
        currentPage: page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalInvoices: allInvoices.length,
        totalBilled,
        totalCollected,
        totalOutstanding,
        draftCount,
        paidCount
      }
    });

  } catch (error) {
    console.error('[GET INVOICES ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve invoices.' });
  }
};

/**
 * GET /api/admin/invoices/next-number
 * Retrieve next available invoice number
 */
export const getNextNumber = async (req, res) => {
  try {
    const setting = await prisma.invoiceSetting.findFirst();
    const prefix = setting?.invoicePrefix || 'VNM-INV';
    const nextNumber = await generateUniqueInvoiceNumber(prefix);
    return res.json({ nextInvoiceNumber: nextNumber });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate invoice number.' });
  }
};

/**
 * GET /api/admin/invoices/:id
 * Retrieve single invoice with all line items
 */
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    return res.json(invoice);
  } catch (error) {
    console.error('[GET INVOICE BY ID ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to load invoice details.' });
  }
};

/**
 * POST /api/admin/invoices
 * Create new invoice with atomic server-side calculation and database transaction
 */
export const createInvoice = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.customerName || !payload.customerName.trim()) {
      return res.status(400).json({ error: 'Customer Name is required.' });
    }

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required.' });
    }

    // Fetch default invoice settings for defaults
    let setting = await prisma.invoiceSetting.findFirst();
    if (!setting) {
      setting = await prisma.invoiceSetting.create({
        data: {
          brandName: 'VENM',
          brandTagline: 'Tradition with a Bite',
          brandEmail: 'venm1310@gmail.com',
          brandPhone: '+91 74340 96095',
          brandGstin: '24AAAAA0000A1Z5',
          brandAddress: 'Ahmedabad, Gujarat, India',
          invoicePrefix: 'VNM-INV'
        }
      });
    }

    // Generate or validate invoice number
    let invoiceNumber = (payload.invoiceNumber || '').trim();
    if (!invoiceNumber) {
      invoiceNumber = await generateUniqueInvoiceNumber(setting.invoicePrefix || 'VNM-INV');
    }

    // Check duplicate invoice number
    const existingNum = await prisma.invoice.findUnique({
      where: { invoiceNumber }
    });
    if (existingNum) {
      // Regenerate fresh number if collision occurred
      invoiceNumber = await generateUniqueInvoiceNumber(setting.invoicePrefix || 'VNM-INV');
    }

    // Run independent calculation engine
    const calculated = calculateInvoiceTotals({
      items: payload.items,
      taxEnabled: payload.taxEnabled !== undefined ? Boolean(payload.taxEnabled) : setting.defaultTaxEnabled,
      taxType: payload.taxType || setting.defaultTaxType || 'INTRA_STATE',
      pricingMode: payload.pricingMode || setting.defaultPricingMode || 'TAX_EXCLUSIVE',
      invoiceDiscountType: payload.invoiceDiscountType || 'FIXED',
      invoiceDiscountValue: payload.invoiceDiscountValue || 0,
      shippingCharges: payload.shippingCharges || 0,
      packagingCharges: payload.packagingCharges || 0,
      additionalCharges: payload.additionalCharges || 0,
      amountPaid: payload.amountPaid || 0,
      advancePaid: payload.advancePaid || 0,
      roundGrandTotal: true
    });

    const preparedBy = payload.preparedBy || req.user?.name || req.user?.email || 'VENM Administrator';

    // Execute atomic transaction
    const newInvoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          invoiceDate: payload.invoiceDate ? new Date(payload.invoiceDate) : new Date(),
          dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
          invoiceType: payload.invoiceType || 'TAX_INVOICE',
          status: payload.status || 'DRAFT',
          paymentStatus: calculated.paymentStatus,
          paymentMethod: payload.paymentMethod || 'UPI',
          preparedBy,
          orderId: payload.orderId ? payload.orderId.trim() : null,
          orderDate: payload.orderDate ? new Date(payload.orderDate) : null,

          // Brand Snapshot
          brandName: payload.brandName || setting.brandName,
          brandTagline: payload.brandTagline !== undefined ? payload.brandTagline : setting.brandTagline,
          brandLogo: payload.brandLogo || setting.brandLogo || '/assets/brand/logo2.png',
          brandEmail: payload.brandEmail || setting.brandEmail,
          brandPhone: payload.brandPhone || setting.brandPhone,
          brandGstin: payload.brandGstin || setting.brandGstin,
          brandAddress: payload.brandAddress || setting.brandAddress,

          // Customer Details Snapshot
          customerName: payload.customerName.trim(),
          customerPhone: payload.customerPhone?.trim() || null,
          customerEmail: payload.customerEmail?.trim() || null,
          billingAddress: payload.billingAddress?.trim() || null,
          shippingAddress: payload.shippingAddress?.trim() || null,
          city: payload.city?.trim() || null,
          state: payload.state?.trim() || 'Gujarat',
          pincode: payload.pincode?.trim() || null,
          customerGstin: payload.customerGstin?.trim() || null,

          // Configuration
          taxEnabled: calculated.items[0]?.taxRate > 0 || payload.taxEnabled !== false,
          taxType: payload.taxType || 'INTRA_STATE',
          pricingMode: payload.pricingMode || 'TAX_EXCLUSIVE',

          // Totals
          subtotal: calculated.subtotal,
          itemDiscountTotal: calculated.itemDiscountTotal,
          invoiceDiscountType: calculated.invoiceDiscountType,
          invoiceDiscountValue: calculated.invoiceDiscountValue,
          invoiceDiscountTotal: calculated.invoiceDiscountTotal,
          totalDiscount: calculated.totalDiscount,
          taxableAmount: calculated.taxableAmount,
          cgstAmount: calculated.cgstAmount,
          sgstAmount: calculated.sgstAmount,
          igstAmount: calculated.igstAmount,
          totalTax: calculated.totalTax,
          shippingCharges: calculated.shippingCharges,
          packagingCharges: calculated.packagingCharges,
          additionalCharges: calculated.additionalCharges,
          roundOff: calculated.roundOff,
          grandTotal: calculated.grandTotal,
          amountPaid: calculated.amountPaid,
          advancePaid: calculated.advancePaid,
          balanceDue: calculated.balanceDue,
          paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : null,
          transactionRef: payload.transactionRef?.trim() || null,

          // Notes
          customerNotes: payload.customerNotes?.trim() || null,
          customizationNotes: payload.customizationNotes?.trim() || null,
          deliveryNotes: payload.deliveryNotes?.trim() || null,
          paymentTerms: payload.paymentTerms?.trim() || setting.defaultPaymentTerms,
          termsAndConditions: payload.termsAndConditions?.trim() || setting.defaultTerms,
          thankYouMessage: payload.thankYouMessage?.trim() || setting.defaultThankYou,
          internalNotes: payload.internalNotes?.trim() || null,

          // Visibility Toggles
          showBrandLogo: payload.showBrandLogo !== undefined ? Boolean(payload.showBrandLogo) : true,
          showBrandGstin: payload.showBrandGstin !== undefined ? Boolean(payload.showBrandGstin) : true,
          showShippingAddress: payload.showShippingAddress !== undefined ? Boolean(payload.showShippingAddress) : true,
          showItemImages: payload.showItemImages !== undefined ? Boolean(payload.showItemImages) : false,
          showItemHsn: payload.showItemHsn !== undefined ? Boolean(payload.showItemHsn) : true,
          showItemDiscount: payload.showItemDiscount !== undefined ? Boolean(payload.showItemDiscount) : true,
          showItemDescription: payload.showItemDescription !== undefined ? Boolean(payload.showItemDescription) : true,
          showCustomerNotes: payload.showCustomerNotes !== undefined ? Boolean(payload.showCustomerNotes) : true,
          showPaymentDetails: payload.showPaymentDetails !== undefined ? Boolean(payload.showPaymentDetails) : true,
          showTerms: payload.showTerms !== undefined ? Boolean(payload.showTerms) : true,

          // Create Line Items (Snapshot preservation)
          items: {
            create: calculated.items.map((item, idx) => ({
              productId: item.productId || null,
              name: item.name.trim(),
              sku: item.sku?.trim() || null,
              image: item.image || null,
              size: item.size?.trim() || null,
              color: item.color?.trim() || null,
              description: item.description?.trim() || null,
              hsnCode: item.hsnCode?.trim() || '6203',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountType: item.discountType,
              discountValue: item.discountValue,
              discountAmount: item.discountAmount,
              taxRate: item.taxRate,
              taxableAmount: item.taxableAmount,
              taxAmount: item.taxAmount,
              lineTotal: item.lineTotal,
              displayOrder: idx
            }))
          }
        },
        include: {
          items: true
        }
      });

      return inv;
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@venm.exe',
      action: 'INVOICE_CREATED',
      entityType: 'INVOICE',
      entityId: newInvoice.id,
      entityName: newInvoice.invoiceNumber,
      description: `Created invoice ${newInvoice.invoiceNumber} for ${newInvoice.customerName} (₹${newInvoice.grandTotal})`
    });

    return res.status(201).json(newInvoice);

  } catch (error) {
    console.error('[CREATE INVOICE ERROR]:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to create invoice.' });
  }
};

/**
 * PUT /api/admin/invoices/:id
 * Update invoice with lifecycle protection & recalculation
 */
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    if (!payload.customerName || !payload.customerName.trim()) {
      return res.status(400).json({ error: 'Customer Name is required.' });
    }

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required.' });
    }

    // Run calculation engine
    const calculated = calculateInvoiceTotals({
      items: payload.items,
      taxEnabled: payload.taxEnabled !== undefined ? Boolean(payload.taxEnabled) : existing.taxEnabled,
      taxType: payload.taxType || existing.taxType,
      pricingMode: payload.pricingMode || existing.pricingMode,
      invoiceDiscountType: payload.invoiceDiscountType || existing.invoiceDiscountType,
      invoiceDiscountValue: payload.invoiceDiscountValue !== undefined ? payload.invoiceDiscountValue : existing.invoiceDiscountValue,
      shippingCharges: payload.shippingCharges !== undefined ? payload.shippingCharges : existing.shippingCharges,
      packagingCharges: payload.packagingCharges !== undefined ? payload.packagingCharges : existing.packagingCharges,
      additionalCharges: payload.additionalCharges !== undefined ? payload.additionalCharges : existing.additionalCharges,
      amountPaid: payload.amountPaid !== undefined ? payload.amountPaid : existing.amountPaid,
      advancePaid: payload.advancePaid !== undefined ? payload.advancePaid : existing.advancePaid,
      roundGrandTotal: true
    });

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Delete previous line items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      });

      // 2. Update invoice and recreate items
      return await tx.invoice.update({
        where: { id },
        data: {
          invoiceDate: payload.invoiceDate ? new Date(payload.invoiceDate) : existing.invoiceDate,
          dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
          invoiceType: payload.invoiceType || existing.invoiceType,
          status: payload.status || existing.status,
          paymentStatus: calculated.paymentStatus,
          paymentMethod: payload.paymentMethod || existing.paymentMethod,
          orderId: payload.orderId !== undefined ? (payload.orderId?.trim() || null) : existing.orderId,
          orderDate: payload.orderDate ? new Date(payload.orderDate) : existing.orderDate,

          // Brand Snapshot
          brandName: payload.brandName || existing.brandName,
          brandTagline: payload.brandTagline !== undefined ? payload.brandTagline : existing.brandTagline,
          brandLogo: payload.brandLogo || existing.brandLogo,
          brandEmail: payload.brandEmail || existing.brandEmail,
          brandPhone: payload.brandPhone || existing.brandPhone,
          brandGstin: payload.brandGstin || existing.brandGstin,
          brandAddress: payload.brandAddress || existing.brandAddress,

          // Customer Details Snapshot
          customerName: payload.customerName.trim(),
          customerPhone: payload.customerPhone?.trim() || null,
          customerEmail: payload.customerEmail?.trim() || null,
          billingAddress: payload.billingAddress?.trim() || null,
          shippingAddress: payload.shippingAddress?.trim() || null,
          city: payload.city?.trim() || null,
          state: payload.state?.trim() || existing.state,
          pincode: payload.pincode?.trim() || null,
          customerGstin: payload.customerGstin?.trim() || null,

          // Tax & Pricing Mode
          taxEnabled: payload.taxEnabled !== undefined ? Boolean(payload.taxEnabled) : existing.taxEnabled,
          taxType: payload.taxType || existing.taxType,
          pricingMode: payload.pricingMode || existing.pricingMode,

          // Calculations
          subtotal: calculated.subtotal,
          itemDiscountTotal: calculated.itemDiscountTotal,
          invoiceDiscountType: calculated.invoiceDiscountType,
          invoiceDiscountValue: calculated.invoiceDiscountValue,
          invoiceDiscountTotal: calculated.invoiceDiscountTotal,
          totalDiscount: calculated.totalDiscount,
          taxableAmount: calculated.taxableAmount,
          cgstAmount: calculated.cgstAmount,
          sgstAmount: calculated.sgstAmount,
          igstAmount: calculated.igstAmount,
          totalTax: calculated.totalTax,
          shippingCharges: calculated.shippingCharges,
          packagingCharges: calculated.packagingCharges,
          additionalCharges: calculated.additionalCharges,
          roundOff: calculated.roundOff,
          grandTotal: calculated.grandTotal,
          amountPaid: calculated.amountPaid,
          advancePaid: calculated.advancePaid,
          balanceDue: calculated.balanceDue,
          paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : null,
          transactionRef: payload.transactionRef?.trim() || null,

          // Notes
          customerNotes: payload.customerNotes !== undefined ? payload.customerNotes?.trim() : existing.customerNotes,
          customizationNotes: payload.customizationNotes !== undefined ? payload.customizationNotes?.trim() : existing.customizationNotes,
          deliveryNotes: payload.deliveryNotes !== undefined ? payload.deliveryNotes?.trim() : existing.deliveryNotes,
          paymentTerms: payload.paymentTerms !== undefined ? payload.paymentTerms?.trim() : existing.paymentTerms,
          termsAndConditions: payload.termsAndConditions !== undefined ? payload.termsAndConditions?.trim() : existing.termsAndConditions,
          thankYouMessage: payload.thankYouMessage !== undefined ? payload.thankYouMessage?.trim() : existing.thankYouMessage,
          internalNotes: payload.internalNotes !== undefined ? payload.internalNotes?.trim() : existing.internalNotes,

          // Visibility Toggles
          showBrandLogo: payload.showBrandLogo !== undefined ? Boolean(payload.showBrandLogo) : existing.showBrandLogo,
          showBrandGstin: payload.showBrandGstin !== undefined ? Boolean(payload.showBrandGstin) : existing.showBrandGstin,
          showShippingAddress: payload.showShippingAddress !== undefined ? Boolean(payload.showShippingAddress) : existing.showShippingAddress,
          showItemImages: payload.showItemImages !== undefined ? Boolean(payload.showItemImages) : existing.showItemImages,
          showItemHsn: payload.showItemHsn !== undefined ? Boolean(payload.showItemHsn) : existing.showItemHsn,
          showItemDiscount: payload.showItemDiscount !== undefined ? Boolean(payload.showItemDiscount) : existing.showItemDiscount,
          showItemDescription: payload.showItemDescription !== undefined ? Boolean(payload.showItemDescription) : existing.showItemDescription,
          showCustomerNotes: payload.showCustomerNotes !== undefined ? Boolean(payload.showCustomerNotes) : existing.showCustomerNotes,
          showPaymentDetails: payload.showPaymentDetails !== undefined ? Boolean(payload.showPaymentDetails) : existing.showPaymentDetails,
          showTerms: payload.showTerms !== undefined ? Boolean(payload.showTerms) : existing.showTerms,

          items: {
            create: calculated.items.map((item, idx) => ({
              productId: item.productId || null,
              name: item.name.trim(),
              sku: item.sku?.trim() || null,
              image: item.image || null,
              size: item.size?.trim() || null,
              color: item.color?.trim() || null,
              description: item.description?.trim() || null,
              hsnCode: item.hsnCode?.trim() || '6203',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountType: item.discountType,
              discountValue: item.discountValue,
              discountAmount: item.discountAmount,
              taxRate: item.taxRate,
              taxableAmount: item.taxableAmount,
              taxAmount: item.taxAmount,
              lineTotal: item.lineTotal,
              displayOrder: idx
            }))
          }
        },
        include: {
          items: true
        }
      });
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@venm.exe',
      action: 'INVOICE_UPDATED',
      entityType: 'INVOICE',
      entityId: updated.id,
      entityName: updated.invoiceNumber,
      description: `Updated invoice ${updated.invoiceNumber} (${updated.status})`
    });

    return res.json(updated);

  } catch (error) {
    console.error('[UPDATE INVOICE ERROR]:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to update invoice.' });
  }
};

/**
 * PATCH /api/admin/invoices/:id/status
 * Quick lifecycle & payment status transition
 */
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, paymentMethod, paymentDate, transactionRef, amountPaid } = req.body;

    const existing = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (paymentDate) updateData.paymentDate = new Date(paymentDate);
    if (transactionRef !== undefined) updateData.transactionRef = transactionRef;
    
    if (amountPaid !== undefined) {
      const amt = Number(amountPaid) || 0;
      updateData.amountPaid = amt;
      updateData.balanceDue = Math.max(0, existing.grandTotal - amt - existing.advancePaid);
      if (updateData.balanceDue <= 0.01) {
        updateData.paymentStatus = 'PAID';
      } else if (amt > 0) {
        updateData.paymentStatus = 'PARTIALLY_PAID';
      } else {
        updateData.paymentStatus = 'UNPAID';
      }
    }

    // Auto-reconcile balance if marking status as PAID
    if (status === 'PAID' || paymentStatus === 'PAID') {
      updateData.paymentStatus = 'PAID';
      updateData.amountPaid = existing.grandTotal - existing.advancePaid;
      updateData.balanceDue = 0;
      if (!existing.paymentDate && !paymentDate) {
        updateData.paymentDate = new Date();
      }
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { items: { orderBy: { displayOrder: 'asc' } } }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@venm.exe',
      action: 'INVOICE_STATUS_UPDATED',
      entityType: 'INVOICE',
      entityId: updated.id,
      entityName: updated.invoiceNumber,
      description: `Updated status of invoice ${updated.invoiceNumber} to ${updated.status} (Payment: ${updated.paymentStatus})`
    });

    return res.json(updated);
  } catch (error) {
    console.error('[UPDATE INVOICE STATUS ERROR]:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to update invoice status.' });
  }
};

/**
 * DELETE /api/admin/invoices/:id
 * Safe invoice deletion: Drafts can be deleted; Issued/Paid invoices are protected
 */
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    // Preservation rule: Issued or Paid invoices cannot be silently deleted
    if (invoice.status === 'ISSUED' || invoice.status === 'PAID') {
      return res.status(400).json({
        error: `Issued or Paid invoices cannot be deleted to preserve financial audit integrity. Please mark invoice status as CANCELLED instead.`
      });
    }

    await prisma.invoice.delete({
      where: { id }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@venm.exe',
      action: 'INVOICE_DELETED',
      entityType: 'INVOICE',
      entityId: invoice.id,
      entityName: invoice.invoiceNumber,
      description: `Deleted draft invoice ${invoice.invoiceNumber}`
    });

    return res.json({ success: true, message: `Invoice ${invoice.invoiceNumber} deleted.` });

  } catch (error) {
    console.error('[DELETE INVOICE ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to delete invoice.' });
  }
};

/**
 * GET /api/admin/invoices/:id/pdf
 * Stream A4 PDF file for download
 */
export const downloadInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const pdfBuffer = await generateInvoicePdf(invoice);

    const safeFilename = `invoice-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);

  } catch (error) {
    console.error('[DOWNLOAD INVOICE PDF ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to generate invoice PDF.' });
  }
};

/**
 * GET /api/admin/invoice-settings
 * Retrieve business brand invoice defaults
 */
export const getInvoiceSettings = async (req, res) => {
  try {
    let setting = await prisma.invoiceSetting.findFirst();
    if (!setting) {
      setting = await prisma.invoiceSetting.create({
        data: {
          brandName: 'VENM',
          brandTagline: 'Tradition with a Bite',
          brandEmail: 'venm1310@gmail.com',
          brandPhone: '+91 74340 96095',
          brandGstin: '24AAAAA0000A1Z5',
          brandAddress: 'Ahmedabad, Gujarat, India',
          invoicePrefix: 'VNM-INV',
          defaultTaxRate: 12,
          defaultTaxEnabled: true,
          defaultTaxType: 'INTRA_STATE',
          defaultPricingMode: 'TAX_EXCLUSIVE'
        }
      });
    }
    return res.json(setting);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load invoice settings.' });
  }
};

/**
 * PUT /api/admin/invoice-settings
 * Update business brand invoice defaults
 */
export const updateInvoiceSettings = async (req, res) => {
  try {
    const data = req.body;
    let setting = await prisma.invoiceSetting.findFirst();

    if (setting) {
      setting = await prisma.invoiceSetting.update({
        where: { id: setting.id },
        data: {
          brandName: data.brandName !== undefined ? data.brandName.trim() : setting.brandName,
          brandTagline: data.brandTagline !== undefined ? data.brandTagline.trim() : setting.brandTagline,
          brandLogo: data.brandLogo !== undefined ? data.brandLogo : setting.brandLogo,
          brandEmail: data.brandEmail !== undefined ? data.brandEmail.trim() : setting.brandEmail,
          brandPhone: data.brandPhone !== undefined ? data.brandPhone.trim() : setting.brandPhone,
          brandGstin: data.brandGstin !== undefined ? data.brandGstin.trim() : setting.brandGstin,
          brandAddress: data.brandAddress !== undefined ? data.brandAddress.trim() : setting.brandAddress,
          invoicePrefix: data.invoicePrefix !== undefined ? data.invoicePrefix.trim() : setting.invoicePrefix,
          defaultTaxRate: data.defaultTaxRate !== undefined ? Number(data.defaultTaxRate) : setting.defaultTaxRate,
          defaultTaxEnabled: data.defaultTaxEnabled !== undefined ? Boolean(data.defaultTaxEnabled) : setting.defaultTaxEnabled,
          defaultTaxType: data.defaultTaxType || setting.defaultTaxType,
          defaultPricingMode: data.defaultPricingMode || setting.defaultPricingMode,
          defaultPaymentTerms: data.defaultPaymentTerms !== undefined ? data.defaultPaymentTerms : setting.defaultPaymentTerms,
          defaultTerms: data.defaultTerms !== undefined ? data.defaultTerms : setting.defaultTerms,
          defaultThankYou: data.defaultThankYou !== undefined ? data.defaultThankYou : setting.defaultThankYou
        }
      });
    } else {
      setting = await prisma.invoiceSetting.create({ data });
    }

    return res.json(setting);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update invoice settings.' });
  }
};
