import prisma from '../config/db.js';
import { 
  round2, 
  calculateProductCosting, 
  calculateOrderCosting, 
  calculateFinancialMetrics 
} from '../utils/costingCalculations.js';
import { logActivity } from '../utils/activityLogger.js';

// ==========================================
// 19 DEFAULT COST CATEGORIES
// ==========================================
const DEFAULT_CATEGORIES = [
  { name: 'Base Garment', slug: 'base-garment', costType: 'DIRECT_MATERIAL', description: 'Blank t-shirts, hoodies, pants, base apparel' },
  { name: 'Raw Fabric', slug: 'raw-fabric', costType: 'DIRECT_MATERIAL', description: 'Cotton, denim, fleece, french terry yardage' },
  { name: 'Paint & Inks', slug: 'paint-inks', costType: 'DIRECT_MATERIAL', description: 'Fabric acrylics, screen inks, puff binders' },
  { name: 'Tailoring & Stitching', slug: 'tailoring-stitching', costType: 'DIRECT_LABOR', description: 'Pattern cutting, assembly, machine stitching' },
  { name: 'Making Charges', slug: 'making-charges', costType: 'DIRECT_LABOR', description: 'Artisan craftwork, custom silhouette finishing' },
  { name: 'Screen Printing & DTG', slug: 'screen-printing-dtg', costType: 'DIRECT_LABOR', description: 'Screen preparation, printing pulls, curing' },
  { name: 'Embroidery & Patchwork', slug: 'embroidery-patchwork', costType: 'DIRECT_LABOR', description: 'Direct embroidery, appliqué, chenille patches' },
  { name: 'Washing & Treatments', slug: 'washing-treatments', costType: 'DIRECT_LABOR', description: 'Acid wash, stone wash, distress, enzyme wash' },
  { name: 'Neck Tags & Brand Labels', slug: 'neck-tags-brand-labels', costType: 'DIRECT_MATERIAL', description: 'Woven labels, wash care tags, hang tags' },
  { name: 'Luxury Packaging & Polybags', slug: 'luxury-packaging-polybags', costType: 'PACKAGING', description: 'Custom frosted zip bags, garment covers' },
  { name: 'Shipping Boxes & Cartons', slug: 'shipping-boxes-cartons', costType: 'PACKAGING', description: 'Rigid magnetic boxes, outer corrugated mailers' },
  { name: 'Stickers & Brand Stationery', slug: 'stickers-brand-stationery', costType: 'PACKAGING', description: 'Vinyl stickers, authenticity cards, thank you notes' },
  { name: 'Free Promotional Gifts', slug: 'free-promotional-gifts', costType: 'PROMOTIONAL', description: 'Complimentary keychains, lanyards, tote bags' },
  { name: 'Courier & Shipping Fees', slug: 'courier-shipping-fees', costType: 'SHIPPING_FULFILLMENT', description: 'BlueDart, Delhivery, DTDC, DHL shipping charges' },
  { name: 'Payment Gateway Fees', slug: 'payment-gateway-fees', costType: 'OVERHEAD', description: 'Razorpay / Stripe transaction deduction fees' },
  { name: 'Quality Control & Inspection', slug: 'quality-control-inspection', costType: 'OVERHEAD', description: 'Finishing check, thread trimming, inspection' },
  { name: 'Sampling & Prototyping', slug: 'sampling-prototyping', costType: 'OVERHEAD', description: 'First article samples, pattern fit testing' },
  { name: 'Alterations & Rework', slug: 'alterations-rework', costType: 'OVERHEAD', description: 'Customer sizing alteration, correction labor' },
  { name: 'Miscellaneous Overheads', slug: 'miscellaneous-overheads', costType: 'OTHER', description: 'Studio consumables, needles, thread, utilities' }
];

/**
 * Generate unique sequential expense number (EXP-2026-0001)
 */
async function generateUniqueExpenseNumber(prefix = 'EXP') {
  const currentYear = new Date().getFullYear();
  const searchPattern = `${prefix}-${currentYear}-`;

  const existing = await prisma.expense.findMany({
    where: { expenseNumber: { startsWith: searchPattern } },
    select: { expenseNumber: true }
  });

  let maxSeq = 0;
  const regex = new RegExp(`^${prefix}-${currentYear}-(\\d+)`);
  for (const exp of existing) {
    const match = exp.expenseNumber?.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${searchPattern}${String(nextSeq).padStart(4, '0')}`;

  while (await prisma.expense.findUnique({ where: { expenseNumber: candidate } })) {
    nextSeq++;
    candidate = `${searchPattern}${String(nextSeq).padStart(4, '0')}`;
  }

  return candidate;
}

// ==========================================
// 1. COST CATEGORIES
// ==========================================

export const getCostCategories = async (req, res) => {
  try {
    let categories = await prisma.costCategory.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    // Auto-seed defaults if table is empty
    if (categories.length === 0) {
      const seeded = await prisma.$transaction(
        DEFAULT_CATEGORIES.map((cat, index) =>
          prisma.costCategory.create({
            data: {
              ...cat,
              isDefault: true,
              isActive: true,
              displayOrder: index + 1
            }
          })
        )
      );
      categories = seeded;
    }

    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    console.error('getCostCategories error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCostCategory = async (req, res) => {
  try {
    const { name, costType, description, displayOrder } = req.body;
    if (!name || !costType) {
      return res.status(400).json({ success: false, message: 'Name and Cost Type are required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existing = await prisma.costCategory.findFirst({
      where: { OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug }] }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists.' });
    }

    const count = await prisma.costCategory.count();
    const category = await prisma.costCategory.create({
      data: {
        name,
        slug,
        costType,
        description: description || null,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : count + 1,
        isDefault: false,
        isActive: true
      }
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('createCostCategory error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCostCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, costType, description, isActive, displayOrder } = req.body;

    const existing = await prisma.costCategory.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const data = {};
    if (name) {
      data.name = name;
      data.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (costType) data.costType = costType;
    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (displayOrder !== undefined) data.displayOrder = Number(displayOrder);

    const updated = await prisma.costCategory.update({
      where: { id },
      data
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateCostCategory error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCostCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.costCategory.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Safety check: Cannot delete default categories or categories in use
    const [compCount, expCount] = await Promise.all([
      prisma.productCostComponent.count({ where: { categoryId: id } }),
      prisma.expense.count({ where: { categoryId: id } })
    ]);

    if (compCount > 0 || expCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: Category is linked to ${compCount} cost components and ${expCount} expenses. Deactivate it instead.`
      });
    }

    await prisma.costCategory.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('deleteCostCategory error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. COSTING SETTINGS
// ==========================================

export const getCostingSettings = async (req, res) => {
  try {
    let settings = await prisma.costingSetting.findFirst();
    if (!settings) {
      settings = await prisma.costingSetting.create({
        data: {
          defaultTargetMargin: 50.0,
          currency: 'INR',
          defaultPackagingCost: 45.0,
          defaultShippingCost: 100.0,
          defaultGiftCost: 0.0,
          defaultAllocationMethod: 'QUANTITY',
          taxPreference: 'EXCLUSIVE',
          lowMarginThreshold: 35.0,
          criticalMarginThreshold: 20.0
        }
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('getCostingSettings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCostingSettings = async (req, res) => {
  try {
    const {
      defaultTargetMargin,
      currency,
      defaultPackagingCost,
      defaultShippingCost,
      defaultGiftCost,
      defaultAllocationMethod,
      taxPreference,
      lowMarginThreshold,
      criticalMarginThreshold
    } = req.body;

    let settings = await prisma.costingSetting.findFirst();

    const data = {
      defaultTargetMargin: defaultTargetMargin !== undefined ? Number(defaultTargetMargin) : undefined,
      currency: currency || undefined,
      defaultPackagingCost: defaultPackagingCost !== undefined ? Number(defaultPackagingCost) : undefined,
      defaultShippingCost: defaultShippingCost !== undefined ? Number(defaultShippingCost) : undefined,
      defaultGiftCost: defaultGiftCost !== undefined ? Number(defaultGiftCost) : undefined,
      defaultAllocationMethod: defaultAllocationMethod || undefined,
      taxPreference: taxPreference || undefined,
      lowMarginThreshold: lowMarginThreshold !== undefined ? Number(lowMarginThreshold) : undefined,
      criticalMarginThreshold: criticalMarginThreshold !== undefined ? Number(criticalMarginThreshold) : undefined
    };

    if (settings) {
      settings = await prisma.costingSetting.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.costingSetting.create({ data });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('updateCostingSettings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. PRODUCT COSTING
// ==========================================

export const getProductCostings = async (req, res) => {
  try {
    const { search, category, collection, status, lowMargin, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(10, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;
    if (collection && collection !== 'ALL') where.collection = collection;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { productName: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (lowMargin === 'true') {
      const settings = await prisma.costingSetting.findFirst();
      const threshold = settings?.lowMarginThreshold || 35.0;
      where.grossProfitMargin = { lt: threshold };
    }

    const [costings, total] = await Promise.all([
      prisma.productCosting.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, price: true, images: true } },
          _count: { select: { components: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.productCosting.count({ where })
    ]);

    res.json({
      success: true,
      data: costings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('getProductCostings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductCostingById = async (req, res) => {
  try {
    const { id } = req.params;
    const costing = await prisma.productCosting.findUnique({
      where: { id },
      include: {
        product: true,
        components: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!costing) {
      return res.status(404).json({ success: false, message: 'Product costing profile not found.' });
    }

    res.json({ success: true, data: costing });
  } catch (error) {
    console.error('getProductCostingById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProductCosting = async (req, res) => {
  try {
    const {
      productId,
      productName,
      sku,
      category,
      collection,
      productType,
      size,
      color,
      batchQuantity = 1,
      targetMargin = 50,
      actualSellingPrice = 0,
      status = 'ACTIVE',
      notes,
      components = []
    } = req.body;

    if (!productName || !productName.trim()) {
      return res.status(400).json({ success: false, message: 'Product Name is required.' });
    }

    // Run financial math engine
    const calculated = calculateProductCosting({
      components,
      targetMargin,
      actualSellingPrice,
      batchQuantity
    });

    if (calculated.calculationError) {
      return res.status(400).json({ success: false, message: calculated.calculationError });
    }

    // Create record with nested components
    const costing = await prisma.productCosting.create({
      data: {
        productId: productId || null,
        productName: productName.trim(),
        sku: sku ? sku.trim() : null,
        category: category || null,
        collection: collection || null,
        productType: productType || 'STANDARD',
        size: size || null,
        color: color || null,
        batchQuantity: calculated.batchQuantity,
        targetMargin: calculated.targetMargin,
        estimatedUnitCost: calculated.estimatedUnitCost,
        actualUnitCost: calculated.actualUnitCost > 0 ? calculated.actualUnitCost : calculated.estimatedUnitCost,
        estimatedSellingPrice: calculated.suggestedSellingPrice,
        actualSellingPrice: calculated.actualSellingPrice,
        suggestedSellingPrice: calculated.suggestedSellingPrice,
        grossProfit: calculated.grossProfit,
        grossProfitMargin: calculated.grossProfitMargin,
        markupPercentage: calculated.markupPercentage,
        status,
        notes: notes || null,
        components: {
          create: calculated.components.map(c => ({
            categoryId: c.categoryId || null,
            categoryName: c.categoryName || 'General',
            description: c.description || '',
            quantity: c.quantity || 1,
            unit: c.unit || 'pcs',
            unitCost: c.unitCost || 0,
            totalCost: c.totalCost || 0,
            costType: c.costType || 'ACTUAL',
            supplier: c.supplier || null,
            expenseDate: c.expenseDate ? new Date(c.expenseDate) : null,
            paymentStatus: c.paymentStatus || 'PAID',
            receiptUrl: c.receiptUrl || null,
            notes: c.notes || null
          }))
        }
      },
      include: { components: true }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@venm.com',
      action: 'COSTING_PROFILE_CREATED',
      entityType: 'COSTING',
      entityName: costing.productName,
      description: `Created costing profile for "${costing.productName}" (Unit Cost: ₹${costing.actualUnitCost}, Margin: ${costing.grossProfitMargin}%)`
    });

    res.status(201).json({ success: true, data: costing });
  } catch (error) {
    console.error('createProductCosting error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProductCosting = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productId,
      productName,
      sku,
      category,
      collection,
      productType,
      size,
      color,
      batchQuantity = 1,
      targetMargin = 50,
      actualSellingPrice = 0,
      status = 'ACTIVE',
      notes,
      components = []
    } = req.body;

    const existing = await prisma.productCosting.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product costing profile not found.' });
    }

    const calculated = calculateProductCosting({
      components,
      targetMargin,
      actualSellingPrice,
      batchQuantity
    });

    if (calculated.calculationError) {
      return res.status(400).json({ success: false, message: calculated.calculationError });
    }

    // Atomic update pattern: delete old components, update parent with new components
    await prisma.productCostComponent.deleteMany({
      where: { productCostingId: id }
    });

    const updated = await prisma.productCosting.update({
      where: { id },
      data: {
        productId: productId !== undefined ? productId : existing.productId,
        productName: productName ? productName.trim() : existing.productName,
        sku: sku !== undefined ? sku : existing.sku,
        category: category !== undefined ? category : existing.category,
        collection: collection !== undefined ? collection : existing.collection,
        productType: productType || existing.productType,
        size: size !== undefined ? size : existing.size,
        color: color !== undefined ? color : existing.color,
        batchQuantity: calculated.batchQuantity,
        targetMargin: calculated.targetMargin,
        estimatedUnitCost: calculated.estimatedUnitCost,
        actualUnitCost: calculated.actualUnitCost > 0 ? calculated.actualUnitCost : calculated.estimatedUnitCost,
        estimatedSellingPrice: calculated.suggestedSellingPrice,
        actualSellingPrice: calculated.actualSellingPrice,
        suggestedSellingPrice: calculated.suggestedSellingPrice,
        grossProfit: calculated.grossProfit,
        grossProfitMargin: calculated.grossProfitMargin,
        markupPercentage: calculated.markupPercentage,
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes,
        components: {
          create: calculated.components.map(c => ({
            categoryId: c.categoryId || null,
            categoryName: c.categoryName || 'General',
            description: c.description || '',
            quantity: c.quantity || 1,
            unit: c.unit || 'pcs',
            unitCost: c.unitCost || 0,
            totalCost: c.totalCost || 0,
            costType: c.costType || 'ACTUAL',
            supplier: c.supplier || null,
            expenseDate: c.expenseDate ? new Date(c.expenseDate) : null,
            paymentStatus: c.paymentStatus || 'PAID',
            receiptUrl: c.receiptUrl || null,
            notes: c.notes || null
          }))
        }
      },
      include: { components: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateProductCosting error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProductCosting = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.productCosting.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product costing profile not found.' });
    }

    await prisma.productCostComponent.deleteMany({ where: { productCostingId: id } });
    await prisma.productCosting.delete({ where: { id } });

    res.json({ success: true, message: 'Costing profile deleted successfully.' });
  } catch (error) {
    console.error('deleteProductCosting error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const duplicateProductCosting = async (req, res) => {
  try {
    const { id } = req.params;
    const original = await prisma.productCosting.findUnique({
      where: { id },
      include: { components: true }
    });

    if (!original) {
      return res.status(404).json({ success: false, message: 'Original profile not found.' });
    }

    const copy = await prisma.productCosting.create({
      data: {
        productId: original.productId,
        productName: `${original.productName} (Copy)`,
        sku: original.sku ? `${original.sku}-COPY` : null,
        category: original.category,
        collection: original.collection,
        productType: original.productType,
        size: original.size,
        color: original.color,
        batchQuantity: original.batchQuantity,
        targetMargin: original.targetMargin,
        estimatedUnitCost: original.estimatedUnitCost,
        actualUnitCost: original.actualUnitCost,
        estimatedSellingPrice: original.estimatedSellingPrice,
        actualSellingPrice: original.actualSellingPrice,
        suggestedSellingPrice: original.suggestedSellingPrice,
        grossProfit: original.grossProfit,
        grossProfitMargin: original.grossProfitMargin,
        markupPercentage: original.markupPercentage,
        status: 'DRAFT',
        notes: original.notes,
        components: {
          create: original.components.map(c => ({
            categoryId: c.categoryId,
            categoryName: c.categoryName,
            description: c.description,
            quantity: c.quantity,
            unit: c.unit,
            unitCost: c.unitCost,
            totalCost: c.totalCost,
            costType: c.costType,
            supplier: c.supplier,
            paymentStatus: c.paymentStatus,
            notes: c.notes
          }))
        }
      },
      include: { components: true }
    });

    res.status(201).json({ success: true, data: copy });
  } catch (error) {
    console.error('duplicateProductCosting error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. ORDER COSTING & INVOICE INTEGRATION
// ==========================================

export const getOrderCostings = async (req, res) => {
  try {
    const { search, status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(10, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status && status !== 'ALL') where.status = status;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { orderId: { contains: q, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: q, mode: 'insensitive' } } },
        { invoice: { customerName: { contains: q, mode: 'insensitive' } } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [orderCostings, total] = await Promise.all([
      prisma.orderCosting.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              invoiceDate: true,
              customerName: true,
              customerPhone: true,
              customerEmail: true,
              orderId: true,
              grandTotal: true,
              taxableAmount: true,
              paymentStatus: true,
              status: true
            }
          },
          items: true,
          expenseAllocations: true
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.orderCosting.count({ where })
    ]);

    res.json({
      success: true,
      data: orderCostings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('getOrderCostings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderCostingByInvoiceId = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId || invoiceId === 'undefined' || invoiceId === 'null') {
      return res.status(400).json({ success: false, message: 'Valid Invoice ID or Number is required.' });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { id: invoiceId },
          { invoiceNumber: invoiceId }
        ]
      },
      include: {
        items: true,
        orderCosting: {
          include: {
            items: true,
            expenseAllocations: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: `Invoice "${invoiceId}" not found.` });
    }

    // If costing already exists, return it
    if (invoice.orderCosting) {
      return res.json({
        success: true,
        isNew: false,
        data: invoice.orderCosting,
        invoice
      });
    }

    // Otherwise, generate draft pre-populated from invoice items
    const settings = await prisma.costingSetting.findFirst();
    const defaultPackaging = settings?.defaultPackagingCost || 45.0;
    const defaultShipping = settings?.defaultShippingCost || 100.0;
    const defaultAllocation = settings?.defaultAllocationMethod || 'QUANTITY';

    // Match each item against existing ProductCosting profiles to prefill unit costs
    const populatedItems = await Promise.all(
      invoice.items.map(async item => {
        let matchedCosting = null;
        if (item.productId) {
          matchedCosting = await prisma.productCosting.findFirst({
            where: { productId: item.productId, status: 'ACTIVE' },
            orderBy: { updatedAt: 'desc' }
          });
        }
        if (!matchedCosting && item.sku) {
          matchedCosting = await prisma.productCosting.findFirst({
            where: { sku: item.sku, status: 'ACTIVE' },
            orderBy: { updatedAt: 'desc' }
          });
        }
        if (!matchedCosting && item.name) {
          matchedCosting = await prisma.productCosting.findFirst({
            where: { productName: { equals: item.name, mode: 'insensitive' } },
            orderBy: { updatedAt: 'desc' }
          });
        }

        const unitCost = matchedCosting ? Number(matchedCosting.actualUnitCost || matchedCosting.estimatedUnitCost || 0) : 0;
        const qty = item.quantity || 1;
        const sellingPrice = Number(item.unitPrice || 0);
        const discountAmount = Number(item.discountAmount || 0);
        const netItemRevenue = Math.max(0, (sellingPrice * qty) - discountAmount);
        const totalCost = round2(unitCost * qty);

        return {
          invoiceItemId: item.id,
          productId: item.productId || null,
          name: item.name,
          sku: item.sku || null,
          size: item.size || null,
          color: item.color || null,
          quantity: qty,
          sellingPrice,
          discountAmount,
          netItemRevenue,
          isPromotionalGift: false,
          unitCost,
          totalCost,
          allocatedExpense: 0,
          grossProfit: round2(netItemRevenue - totalCost),
          grossProfitMargin: netItemRevenue > 0 ? round2(((netItemRevenue - totalCost) / netItemRevenue) * 100) : 0,
          costComponents: matchedCosting?.components || null
        };
      })
    );

    // Initial default shared expenses
    const defaultExpenses = [
      { categoryName: 'Luxury Packaging & Polybags', description: 'Box + Silk Paper + Polybag', amount: defaultPackaging, allocationMethod: defaultAllocation },
      { categoryName: 'Courier & Shipping Fees', description: 'Outward Courier Delivery', amount: Number(invoice.shippingCharge || defaultShipping), allocationMethod: defaultAllocation }
    ];

    const draftCalculation = calculateOrderCosting({
      invoice,
      items: populatedItems,
      expenseAllocations: defaultExpenses,
      allocationMethod: defaultAllocation
    });

    res.json({
      success: true,
      isNew: true,
      invoice,
      data: {
        invoiceId: invoice.id,
        orderId: invoice.orderId,
        status: 'PENDING',
        allocationMethod: defaultAllocation,
        ...draftCalculation
      }
    });
  } catch (error) {
    console.error('getOrderCostingByInvoiceId error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveOrderCosting = async (req, res) => {
  try {
    const {
      invoiceId,
      status = 'COMPLETED',
      allocationMethod = 'QUANTITY',
      items = [],
      expenseAllocations = [],
      notes
    } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ success: false, message: 'Invoice ID is required.' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Calculate complete financial costing with strict accounting principles
    const calculation = calculateOrderCosting({
      invoice,
      items,
      expenseAllocations,
      allocationMethod
    });

    // Check if costing record already exists for this invoice (1-to-1 unique relation)
    const existing = await prisma.orderCosting.findUnique({
      where: { invoiceId }
    });

    let savedCosting;

    if (existing) {
      // Clear existing item costs and expense allocations
      await prisma.orderItemCosting.deleteMany({ where: { orderCostingId: existing.id } });
      await prisma.orderExpenseAllocation.deleteMany({ where: { orderCostingId: existing.id } });

      savedCosting = await prisma.orderCosting.update({
        where: { id: existing.id },
        data: {
          orderId: invoice.orderId || existing.orderId,
          status,
          allocationMethod,
          totalDirectCost: calculation.totalDirectCost,
          totalAllocatedCost: calculation.totalAllocatedCost,
          totalOrderCost: calculation.totalOrderCost,
          netRevenue: calculation.netRevenue,
          grossProfit: calculation.grossProfit,
          grossProfitMargin: calculation.grossProfitMargin,
          netProfit: calculation.netProfit,
          netProfitMargin: calculation.netProfitMargin,
          notes: notes !== undefined ? notes : existing.notes,
          items: {
            create: calculation.items.map(it => ({
              invoiceItemId: it.invoiceItemId || null,
              productId: it.productId || null,
              name: it.name,
              sku: it.sku || null,
              size: it.size || null,
              color: it.color || null,
              quantity: it.quantity,
              sellingPrice: it.sellingPrice,
              discountAmount: it.discountAmount,
              netItemRevenue: it.netItemRevenue,
              isPromotionalGift: Boolean(it.isPromotionalGift),
              unitCost: it.unitCost,
              totalCost: it.totalCost,
              allocatedExpense: it.allocatedExpense,
              grossProfit: it.grossProfit,
              grossProfitMargin: it.grossProfitMargin,
              costComponents: it.costComponents || null,
              notes: it.notes || null
            }))
          },
          expenseAllocations: {
            create: (expenseAllocations || []).map(exp => ({
              expenseId: exp.expenseId || null,
              categoryName: exp.categoryName || 'General',
              description: exp.description || '',
              amount: round2(Number(exp.amount) || 0),
              allocationMethod: exp.allocationMethod || allocationMethod
            }))
          }
        },
        include: { items: true, expenseAllocations: true, invoice: true }
      });
    } else {
      savedCosting = await prisma.orderCosting.create({
        data: {
          invoiceId,
          orderId: invoice.orderId || null,
          status,
          allocationMethod,
          totalDirectCost: calculation.totalDirectCost,
          totalAllocatedCost: calculation.totalAllocatedCost,
          totalOrderCost: calculation.totalOrderCost,
          netRevenue: calculation.netRevenue,
          grossProfit: calculation.grossProfit,
          grossProfitMargin: calculation.grossProfitMargin,
          netProfit: calculation.netProfit,
          netProfitMargin: calculation.netProfitMargin,
          notes: notes || null,
          items: {
            create: calculation.items.map(it => ({
              invoiceItemId: it.invoiceItemId || null,
              productId: it.productId || null,
              name: it.name,
              sku: it.sku || null,
              size: it.size || null,
              color: it.color || null,
              quantity: it.quantity,
              sellingPrice: it.sellingPrice,
              discountAmount: it.discountAmount,
              netItemRevenue: it.netItemRevenue,
              isPromotionalGift: Boolean(it.isPromotionalGift),
              unitCost: it.unitCost,
              totalCost: it.totalCost,
              allocatedExpense: it.allocatedExpense,
              grossProfit: it.grossProfit,
              grossProfitMargin: it.grossProfitMargin,
              costComponents: it.costComponents || null,
              notes: it.notes || null
            }))
          },
          expenseAllocations: {
            create: (expenseAllocations || []).map(exp => ({
              expenseId: exp.expenseId || null,
              categoryName: exp.categoryName || 'General',
              description: exp.description || '',
              amount: round2(Number(exp.amount) || 0),
              allocationMethod: exp.allocationMethod || allocationMethod
            }))
          }
        },
        include: { items: true, expenseAllocations: true, invoice: true }
      });
    }

    await logActivity({
      adminUserId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@venm.com',
      action: 'ORDER_COSTING_SAVED',
      entityType: 'COSTING',
      entityName: invoice.invoiceNumber,
      description: `Saved order costing for ${invoice.invoiceNumber}: Net Revenue ₹${savedCosting.netRevenue}, Total Cost ₹${savedCosting.totalOrderCost}, Net Profit ₹${savedCosting.netProfit} (${savedCosting.netProfitMargin}%)`
    });

    res.json({ success: true, data: savedCosting });
  } catch (error) {
    console.error('saveOrderCosting error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOrderCosting = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.orderCosting.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order costing not found.' });
    }

    await prisma.orderItemCosting.deleteMany({ where: { orderCostingId: id } });
    await prisma.orderExpenseAllocation.deleteMany({ where: { orderCostingId: id } });
    await prisma.orderCosting.delete({ where: { id } });

    res.json({ success: true, message: 'Order costing deleted.' });
  } catch (error) {
    console.error('deleteOrderCosting error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. EXPENSE MANAGEMENT
// ==========================================

export const getExpenses = async (req, res) => {
  try {
    const {
      search,
      categoryId,
      expenseType,
      paymentStatus,
      isAllocated,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(10, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = { isArchived: false };

    if (categoryId && categoryId !== 'ALL') where.categoryId = categoryId;
    if (expenseType && expenseType !== 'ALL') where.expenseType = expenseType;
    if (paymentStatus && paymentStatus !== 'ALL') where.paymentStatus = paymentStatus;
    if (isAllocated !== undefined && isAllocated !== 'ALL') {
      where.isAllocatedToOrder = isAllocated === 'true';
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { expenseNumber: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { supplier: { contains: q, mode: 'insensitive' } },
        { categoryName: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    const [expenses, total, summary] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: true },
        orderBy: { expenseDate: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where,
        _sum: {
          amountBeforeTax: true,
          taxAmount: true,
          totalAmount: true
        }
      })
    ]);

    res.json({
      success: true,
      data: expenses,
      summary: {
        totalAmountBeforeTax: round2(summary._sum.amountBeforeTax || 0),
        totalTaxAmount: round2(summary._sum.taxAmount || 0),
        totalExpenseAmount: round2(summary._sum.totalAmount || 0)
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('getExpenses error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    console.error('getExpenseById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const {
      expenseDate,
      categoryId,
      categoryName,
      description,
      expenseType = 'OPERATING',
      amountBeforeTax = 0,
      taxRate = 0,
      isInputTaxCreditEligible = false,
      supplier,
      paymentStatus = 'PAID',
      paymentMethod,
      paymentDate,
      invoiceId,
      productId,
      receiptUrl,
      notes,
      isAllocatedToOrder = false
    } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    const beforeTax = Math.max(0, Number(amountBeforeTax) || 0);
    const taxPct = Math.max(0, Number(taxRate) || 0);
    const calculatedTax = round2(beforeTax * (taxPct / 100));
    const totalAmount = round2(beforeTax + calculatedTax);

    const expenseNumber = await generateUniqueExpenseNumber();

    // Resolve category name if categoryId was given
    let resolvedCategoryName = categoryName || 'General';
    if (categoryId) {
      const cat = await prisma.costCategory.findUnique({ where: { id: categoryId } });
      if (cat) resolvedCategoryName = cat.name;
    }

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        categoryId: categoryId || null,
        categoryName: resolvedCategoryName,
        description: description.trim(),
        expenseType,
        amountBeforeTax: beforeTax,
        taxRate: taxPct,
        taxAmount: calculatedTax,
        totalAmount,
        isInputTaxCreditEligible: Boolean(isInputTaxCreditEligible),
        currency: 'INR',
        supplier: supplier ? supplier.trim() : null,
        paymentStatus,
        paymentMethod: paymentMethod || null,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        invoiceId: invoiceId || null,
        productId: productId || null,
        receiptUrl: receiptUrl || null,
        notes: notes || null,
        isAllocatedToOrder: Boolean(isAllocatedToOrder),
        createdBy: req.user?.email || 'admin'
      }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@venm.com',
      action: 'EXPENSE_RECORDED',
      entityType: 'EXPENSE',
      entityName: expense.expenseNumber,
      description: `Recorded expense ${expense.expenseNumber} for ${expense.description} (₹${expense.totalAmount})`
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error('createExpense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      expenseDate,
      categoryId,
      categoryName,
      description,
      expenseType,
      amountBeforeTax,
      taxRate,
      isInputTaxCreditEligible,
      supplier,
      paymentStatus,
      paymentMethod,
      paymentDate,
      invoiceId,
      productId,
      receiptUrl,
      notes,
      isAllocatedToOrder
    } = req.body;

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    const beforeTax = amountBeforeTax !== undefined ? Math.max(0, Number(amountBeforeTax)) : Number(existing.amountBeforeTax);
    const taxPct = taxRate !== undefined ? Math.max(0, Number(taxRate)) : Number(existing.taxRate);
    const calculatedTax = round2(beforeTax * (taxPct / 100));
    const totalAmount = round2(beforeTax + calculatedTax);

    let resolvedCategoryName = categoryName || existing.categoryName;
    if (categoryId && categoryId !== existing.categoryId) {
      const cat = await prisma.costCategory.findUnique({ where: { id: categoryId } });
      if (cat) resolvedCategoryName = cat.name;
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        expenseDate: expenseDate ? new Date(expenseDate) : existing.expenseDate,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        categoryName: resolvedCategoryName,
        description: description ? description.trim() : existing.description,
        expenseType: expenseType || existing.expenseType,
        amountBeforeTax: beforeTax,
        taxRate: taxPct,
        taxAmount: calculatedTax,
        totalAmount,
        isInputTaxCreditEligible: isInputTaxCreditEligible !== undefined ? Boolean(isInputTaxCreditEligible) : existing.isInputTaxCreditEligible,
        supplier: supplier !== undefined ? (supplier ? supplier.trim() : null) : existing.supplier,
        paymentStatus: paymentStatus || existing.paymentStatus,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : existing.paymentDate,
        invoiceId: invoiceId !== undefined ? invoiceId : existing.invoiceId,
        productId: productId !== undefined ? productId : existing.productId,
        receiptUrl: receiptUrl !== undefined ? receiptUrl : existing.receiptUrl,
        notes: notes !== undefined ? notes : existing.notes,
        isAllocatedToOrder: isAllocatedToOrder !== undefined ? Boolean(isAllocatedToOrder) : existing.isAllocatedToOrder
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateExpense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    // Soft archive or hard delete
    await prisma.expense.update({
      where: { id },
      data: { isArchived: true }
    });

    res.json({ success: true, message: 'Expense archived successfully.' });
  } catch (error) {
    console.error('deleteExpense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. DASHBOARD OVERVIEW & FINANCIAL METRICS
// ==========================================

export const getCostingOverview = async (req, res) => {
  try {
    const { period = 'THIS_MONTH', startDate: customStart, endDate: customEnd } = req.query;

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (period === 'TODAY') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'THIS_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'THIS_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'LAST_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === 'THIS_YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (period === 'ALL') {
      startDate = new Date('2020-01-01');
      endDate = new Date('2099-12-31');
    } else if (period === 'CUSTOM' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
    }

    // Fetch invoices, order costings, and expenses within date range
    const [invoices, orderCostings, expenses, pendingInvoicesCount, settings] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          invoiceDate: { gte: startDate, lte: endDate },
          status: { not: 'CANCELLED' }
        }
      }),
      prisma.orderCosting.findMany({
        where: {
          invoice: {
            invoiceDate: { gte: startDate, lte: endDate },
            status: { not: 'CANCELLED' }
          }
        }
      }),
      prisma.expense.findMany({
        where: {
          expenseDate: { gte: startDate, lte: endDate },
          isArchived: false
        }
      }),
      prisma.invoice.count({
        where: {
          status: { notIn: ['CANCELLED', 'DRAFT'] },
          orderCosting: null
        }
      }),
      prisma.costingSetting.findFirst()
    ]);

    // Calculate period financial metrics
    const metrics = calculateFinancialMetrics({
      invoices,
      orderCostings,
      expenses
    });

    // Low margin threshold alerts
    const lowThreshold = settings?.lowMarginThreshold || 35.0;
    const criticalThreshold = settings?.criticalMarginThreshold || 20.0;

    const [lowMarginProducts, lowMarginOrders] = await Promise.all([
      prisma.productCosting.findMany({
        where: {
          status: 'ACTIVE',
          grossProfitMargin: { lt: lowThreshold }
        },
        take: 10,
        orderBy: { grossProfitMargin: 'asc' }
      }),
      prisma.orderCosting.findMany({
        where: {
          grossProfitMargin: { lt: lowThreshold }
        },
        include: {
          invoice: {
            select: { invoiceNumber: true, customerName: true, grandTotal: true }
          }
        },
        take: 10,
        orderBy: { grossProfitMargin: 'asc' }
      })
    ]);

    // Monthly breakdown for trend charts (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(mDate.getFullYear(), mDate.getMonth(), 1);
      const mEnd = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = mStart.toLocaleString('default', { month: 'short', year: '2-digit' });

      const [mInvoices, mOrderCostings, mExpenses] = await Promise.all([
        prisma.invoice.findMany({
          where: { invoiceDate: { gte: mStart, lte: mEnd }, status: { not: 'CANCELLED' } }
        }),
        prisma.orderCosting.findMany({
          where: { invoice: { invoiceDate: { gte: mStart, lte: mEnd }, status: { not: 'CANCELLED' } } }
        }),
        prisma.expense.findMany({
          where: { expenseDate: { gte: mStart, lte: mEnd }, isArchived: false }
        })
      ]);

      const mMetrics = calculateFinancialMetrics({
        invoices: mInvoices,
        orderCostings: mOrderCostings,
        expenses: mExpenses
      });

      monthlyTrend.push({
        month: monthLabel,
        revenue: mMetrics.netSalesRevenue,
        cogs: mMetrics.cogs,
        grossProfit: mMetrics.grossProfit,
        netProfit: mMetrics.netOperatingProfit,
        grossMargin: mMetrics.grossMarginPercent,
        netMargin: mMetrics.netMarginPercent
      });
    }

    res.json({
      success: true,
      period,
      startDate,
      endDate,
      metrics: {
        ...metrics,
        ordersMissingCosting: pendingInvoicesCount
      },
      monthlyTrend,
      alerts: {
        lowThreshold,
        criticalThreshold,
        lowMarginProducts,
        lowMarginOrders
      }
    });
  } catch (error) {
    console.error('getCostingOverview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. PROFIT REPORTS & CSV EXPORT
// ==========================================

export const getProfitReports = async (req, res) => {
  try {
    const { groupBy = 'product', startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    let reportData = [];

    if (groupBy === 'product') {
      // Group by distinct items in OrderItemCosting
      const items = await prisma.orderItemCosting.findMany({
        where: Object.keys(dateFilter).length > 0 ? { orderCosting: { invoice: { invoiceDate: dateFilter } } } : {},
        include: { orderCosting: { include: { invoice: true } } }
      });

      const grouped = {};
      for (const it of items) {
        const key = it.name || 'Unnamed Product';
        if (!grouped[key]) {
          grouped[key] = {
            name: key,
            sku: it.sku || 'N/A',
            unitsSold: 0,
            revenue: 0,
            cogs: 0,
            allocatedExpenses: 0,
            grossProfit: 0
          };
        }
        grouped[key].unitsSold += it.quantity;
        grouped[key].revenue += Number(it.netItemRevenue) || 0;
        grouped[key].cogs += Number(it.totalCost) || 0;
        grouped[key].allocatedExpenses += Number(it.allocatedExpense) || 0;
        grouped[key].grossProfit += Number(it.grossProfit) || 0;
      }

      reportData = Object.values(grouped).map(g => {
        const revenue = round2(g.revenue);
        const cogs = round2(g.cogs);
        const profit = round2(g.grossProfit);
        const margin = revenue > 0 ? round2((profit / revenue) * 100) : 0;
        return {
          ...g,
          revenue,
          cogs,
          grossProfit: profit,
          grossMarginPercent: margin
        };
      }).sort((a, b) => b.revenue - a.revenue);

    } else if (groupBy === 'invoice') {
      const orderCostings = await prisma.orderCosting.findMany({
        where: Object.keys(dateFilter).length > 0 ? { invoice: { invoiceDate: dateFilter } } : {},
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              invoiceDate: true,
              customerName: true,
              grandTotal: true,
              paymentStatus: true
            }
          }
        },
        orderBy: { invoice: { invoiceDate: 'desc' } }
      });

      reportData = orderCostings.map(oc => ({
        invoiceNumber: oc.invoice?.invoiceNumber,
        invoiceDate: oc.invoice?.invoiceDate,
        customerName: oc.invoice?.customerName,
        netRevenue: Number(oc.netRevenue),
        directCost: Number(oc.totalDirectCost),
        allocatedCost: Number(oc.totalAllocatedCost),
        totalCost: Number(oc.totalOrderCost),
        grossProfit: Number(oc.grossProfit),
        grossMarginPercent: Number(oc.grossProfitMargin),
        netProfit: Number(oc.netProfit),
        netMarginPercent: Number(oc.netProfitMargin),
        paymentStatus: oc.invoice?.paymentStatus
      }));

    } else if (groupBy === 'collection' || groupBy === 'category') {
      const costings = await prisma.productCosting.findMany({
        where: { status: 'ACTIVE' }
      });

      const field = groupBy === 'collection' ? 'collection' : 'category';
      const grouped = {};

      for (const pc of costings) {
        const key = pc[field] || 'Uncategorized';
        if (!grouped[key]) {
          grouped[key] = {
            groupName: key,
            productCount: 0,
            avgCost: 0,
            avgSellingPrice: 0,
            avgMargin: 0,
            totalCostSum: 0,
            totalSellingSum: 0
          };
        }
        grouped[key].productCount += 1;
        grouped[key].totalCostSum += Number(pc.actualUnitCost || pc.estimatedUnitCost || 0);
        grouped[key].totalSellingSum += Number(pc.actualSellingPrice || pc.suggestedSellingPrice || 0);
      }

      reportData = Object.values(grouped).map(g => {
        const avgCost = round2(g.totalCostSum / g.productCount);
        const avgPrice = round2(g.totalSellingSum / g.productCount);
        const avgMargin = avgPrice > 0 ? round2(((avgPrice - avgCost) / avgPrice) * 100) : 0;
        return {
          groupName: g.groupName,
          productCount: g.productCount,
          averageCost: avgCost,
          averageSellingPrice: avgPrice,
          averageMarginPercent: avgMargin
        };
      }).sort((a, b) => b.productCount - a.productCount);
    }

    res.json({ success: true, groupBy, count: reportData.length, data: reportData });
  } catch (error) {
    console.error('getProfitReports error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportProfitReportsCSV = async (req, res) => {
  try {
    const { groupBy = 'product' } = req.query;

    let csvContent = '';

    if (groupBy === 'invoice') {
      const orderCostings = await prisma.orderCosting.findMany({
        include: { invoice: true },
        orderBy: { invoice: { invoiceDate: 'desc' } }
      });

      csvContent = 'Invoice Number,Date,Customer,Net Revenue (INR),Direct Cost (INR),Allocated Cost (INR),Total Cost (INR),Gross Profit (INR),Gross Margin %,Net Profit (INR),Net Margin %\n';
      orderCostings.forEach(oc => {
        const row = [
          `"${oc.invoice?.invoiceNumber || ''}"`,
          `"${oc.invoice?.invoiceDate ? new Date(oc.invoice.invoiceDate).toLocaleDateString() : ''}"`,
          `"${oc.invoice?.customerName || ''}"`,
          oc.netRevenue,
          oc.totalDirectCost,
          oc.totalAllocatedCost,
          oc.totalOrderCost,
          oc.grossProfit,
          `${oc.grossProfitMargin}%`,
          oc.netProfit,
          `${oc.netProfitMargin}%`
        ];
        csvContent += row.join(',') + '\n';
      });
    } else {
      // Default to product breakdown
      const items = await prisma.orderItemCosting.findMany();
      const grouped = {};
      for (const it of items) {
        const key = it.name || 'Unnamed Product';
        if (!grouped[key]) {
          grouped[key] = { name: key, sku: it.sku || '', units: 0, revenue: 0, cogs: 0, profit: 0 };
        }
        grouped[key].units += it.quantity;
        grouped[key].revenue += Number(it.netItemRevenue) || 0;
        grouped[key].cogs += Number(it.totalCost) || 0;
        grouped[key].profit += Number(it.grossProfit) || 0;
      }

      csvContent = 'Product Name,SKU,Units Sold,Net Revenue (INR),COGS (INR),Gross Profit (INR),Gross Margin %\n';
      Object.values(grouped).forEach(g => {
        const rev = round2(g.revenue);
        const cogs = round2(g.cogs);
        const profit = round2(g.profit);
        const margin = rev > 0 ? round2((profit / rev) * 100) : 0;
        const row = [
          `"${g.name.replace(/"/g, '""')}"`,
          `"${g.sku}"`,
          g.units,
          rev,
          cogs,
          profit,
          `${margin}%`
        ];
        csvContent += row.join(',') + '\n';
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=venm-profit-report-${groupBy}-${new Date().toISOString().slice(0, 10)}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('exportProfitReportsCSV error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

