/**
 * VENM Costing & Profit Management System - Financial Calculation Utilities
 * 
 * Strict accounting principles:
 * - Net Sales Revenue = Taxable amount (excluding Sales Tax / GST collected for government).
 * - Direct Cost (COGS) = Direct product manufacturing / acquisition + direct components.
 * - Gross Profit = Net Sales Revenue - COGS.
 * - Contribution Profit = Gross Profit - Order Variable Costs (allocated shipping, packaging, gift, gateway fees).
 * - Net Operating Profit = Contribution Profit - Operating Expenses (excluding order-allocated expenses).
 * - Free Gifts / Promotional Items: ₹0 selling price, actual production cost recorded in order direct costs.
 */

export function round2(num) {
  if (num === null || num === undefined || isNaN(num)) return 0;
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate Product Costing metrics from components and pricing parameters
 * 
 * @param {Array} components - Array of cost components
 * @param {number} targetMargin - Target gross margin percentage (e.g. 50 for 50%)
 * @param {number} actualSellingPrice - Actual set selling price
 * @param {number} batchQuantity - Batch quantity (default: 1)
 */
export function calculateProductCosting({
  components = [],
  targetMargin = 50,
  actualSellingPrice = 0,
  batchQuantity = 1
}) {
  const validBatchQty = Math.max(1, Number(batchQuantity) || 1);
  const validTargetMargin = Number(targetMargin) || 0;
  const validSellingPrice = Math.max(0, Number(actualSellingPrice) || 0);

  let estimatedTotalCost = 0;
  let actualTotalCost = 0;

  const processedComponents = (components || []).map(comp => {
    const qty = Math.max(0, Number(comp.quantity) || 0);
    const unitCost = Math.max(0, Number(comp.unitCost) || 0);
    const totalCost = round2(qty * unitCost);

    if (comp.costType === 'ESTIMATED') {
      estimatedTotalCost += totalCost;
    } else {
      // Default to actual if not specified or ACTUAL
      actualTotalCost += totalCost;
    }

    return {
      ...comp,
      quantity: qty,
      unitCost: round2(unitCost),
      totalCost: round2(totalCost)
    };
  });

  estimatedTotalCost = round2(estimatedTotalCost);
  actualTotalCost = round2(actualTotalCost);

  // If only actual or only estimated was provided, use the available one for unit cost calculation
  const totalCost = actualTotalCost > 0 ? actualTotalCost : estimatedTotalCost;
  const unitCost = round2(totalCost / validBatchQty);
  const estimatedUnitCost = round2(estimatedTotalCost / validBatchQty);
  const actualUnitCost = round2(actualTotalCost / validBatchQty);

  // Suggested Selling Price formula: Cost Base / (1 - (Target Margin % / 100))
  let suggestedSellingPrice = 0;
  let calculationError = null;

  if (validTargetMargin >= 100) {
    calculationError = 'Target margin must be strictly less than 100%';
    suggestedSellingPrice = 0;
  } else if (validTargetMargin < 0) {
    calculationError = 'Target margin cannot be negative';
    suggestedSellingPrice = unitCost;
  } else {
    const marginRatio = validTargetMargin / 100;
    suggestedSellingPrice = round2(unitCost / (1 - marginRatio));
  }

  // Use actualSellingPrice if provided, otherwise suggestedSellingPrice for profit metrics
  const effectiveSellingPrice = validSellingPrice > 0 ? validSellingPrice : suggestedSellingPrice;

  // Gross Profit = Selling Price - Unit Cost
  const grossProfit = round2(effectiveSellingPrice - unitCost);

  // Gross Profit Margin % = (Gross Profit / Selling Price) * 100
  const grossProfitMargin = effectiveSellingPrice > 0 
    ? round2((grossProfit / effectiveSellingPrice) * 100) 
    : 0;

  // Markup % = (Gross Profit / Unit Cost) * 100
  const markupPercentage = unitCost > 0 
    ? round2((grossProfit / unitCost) * 100) 
    : 0;

  return {
    components: processedComponents,
    estimatedTotalCost,
    actualTotalCost,
    estimatedUnitCost,
    actualUnitCost,
    unitCost,
    batchQuantity: validBatchQty,
    targetMargin: validTargetMargin,
    suggestedSellingPrice,
    actualSellingPrice: validSellingPrice,
    grossProfit,
    grossProfitMargin,
    markupPercentage,
    calculationError
  };
}

/**
 * Calculate Order Costing with item-level direct costs and shared expense allocations
 * 
 * @param {Object} invoice - Invoice database record or payload
 * @param {Array} items - Order items with unit costs and promotional flags
 * @param {Array} expenseAllocations - Shared order expenses (packaging, shipping, gifts, etc.)
 * @param {string} allocationMethod - 'EQUAL' | 'QUANTITY' | 'REVENUE' | 'MANUAL'
 */
export function calculateOrderCosting({
  invoice,
  items = [],
  expenseAllocations = [],
  allocationMethod = 'QUANTITY'
}) {
  // Net Sales Revenue excludes sales tax/GST collected for government
  // In our invoice model, taxableAmount = subtotal - totalDiscount
  let netRevenue = 0;
  if (invoice) {
    if (invoice.taxableAmount !== undefined && invoice.taxableAmount !== null) {
      netRevenue = Number(invoice.taxableAmount);
    } else {
      const sub = Number(invoice.subtotal) || 0;
      const disc = Number(invoice.discountTotal) || 0;
      netRevenue = Math.max(0, sub - disc);
    }
  }

  // Calculate total shared expense amount
  const totalAllocatedCost = round2(
    (expenseAllocations || []).reduce((acc, exp) => acc + (Math.max(0, Number(exp.amount)) || 0), 0)
  );

  // Calculate totals for allocation ratios
  const totalQuantity = (items || []).reduce((acc, it) => acc + (Math.max(1, Number(it.quantity)) || 1), 0);
  const totalNetItemRevenue = (items || []).reduce((acc, it) => {
    if (it.isPromotionalGift) return acc;
    const price = Math.max(0, Number(it.sellingPrice) || 0);
    const disc = Math.max(0, Number(it.discountAmount) || 0);
    const qty = Math.max(1, Number(it.quantity) || 1);
    return acc + Math.max(0, (price * qty) - disc);
  }, 0);

  let totalDirectCost = 0;

  // Process items and allocate shared expenses
  const processedItems = (items || []).map(item => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const isGift = Boolean(item.isPromotionalGift);
    const sellingPrice = isGift ? 0 : Math.max(0, Number(item.sellingPrice) || 0);
    const discountAmount = isGift ? 0 : Math.max(0, Number(item.discountAmount) || 0);
    const netItemRevenue = isGift ? 0 : round2(Math.max(0, (sellingPrice * qty) - discountAmount));

    const unitCost = Math.max(0, Number(item.unitCost) || 0);
    const itemDirectCost = round2(qty * unitCost);
    totalDirectCost += itemDirectCost;

    // Expense allocation per item
    let allocatedExpense = 0;
    if (totalAllocatedCost > 0) {
      if (allocationMethod === 'EQUAL') {
        allocatedExpense = round2(totalAllocatedCost / (items.length || 1));
      } else if (allocationMethod === 'QUANTITY') {
        const ratio = totalQuantity > 0 ? qty / totalQuantity : (1 / (items.length || 1));
        allocatedExpense = round2(totalAllocatedCost * ratio);
      } else if (allocationMethod === 'REVENUE') {
        const ratio = totalNetItemRevenue > 0 ? netItemRevenue / totalNetItemRevenue : (qty / (totalQuantity || 1));
        allocatedExpense = round2(totalAllocatedCost * ratio);
      } else if (allocationMethod === 'MANUAL') {
        allocatedExpense = Math.max(0, Number(item.allocatedExpense) || 0);
      }
    }

    const itemGrossProfit = round2(netItemRevenue - itemDirectCost);
    const itemGrossProfitMargin = netItemRevenue > 0 
      ? round2((itemGrossProfit / netItemRevenue) * 100) 
      : (isGift ? -100 : 0);

    return {
      ...item,
      isPromotionalGift: isGift,
      sellingPrice: round2(sellingPrice),
      discountAmount: round2(discountAmount),
      netItemRevenue: round2(netItemRevenue),
      quantity: qty,
      unitCost: round2(unitCost),
      totalCost: round2(itemDirectCost),
      allocatedExpense: round2(allocatedExpense),
      grossProfit: round2(itemGrossProfit),
      grossProfitMargin: round2(itemGrossProfitMargin)
    };
  });

  totalDirectCost = round2(totalDirectCost);
  const totalOrderCost = round2(totalDirectCost + totalAllocatedCost);
  netRevenue = round2(netRevenue > 0 ? netRevenue : totalNetItemRevenue);

  // Gross Profit = Net Revenue - Total Direct Cost (COGS)
  const grossProfit = round2(netRevenue - totalDirectCost);
  const grossProfitMargin = netRevenue > 0 
    ? round2((grossProfit / netRevenue) * 100) 
    : 0;

  // Net Profit (Contribution Profit) = Net Revenue - Total Order Cost (Direct + Allocated)
  const netProfit = round2(netRevenue - totalOrderCost);
  const netProfitMargin = netRevenue > 0 
    ? round2((netProfit / netRevenue) * 100) 
    : 0;

  return {
    netRevenue,
    totalDirectCost,
    totalAllocatedCost,
    totalOrderCost,
    grossProfit,
    grossProfitMargin,
    netProfit,
    netProfitMargin,
    items: processedItems,
    expenseAllocations
  };
}

/**
 * Calculate aggregate financial metrics across a set of invoices, order costings, and expenses
 */
export function calculateFinancialMetrics({
  invoices = [],
  orderCostings = [],
  expenses = []
}) {
  let totalInvoicedSales = 0;
  let netSalesRevenue = 0;
  let paymentsReceived = 0;
  let outstandingReceivables = 0;

  for (const inv of invoices) {
    if (inv.status === 'CANCELLED') continue;

    totalInvoicedSales += Number(inv.grandTotal) || 0;
    
    // Taxable amount is net revenue (excluding tax)
    const taxable = inv.taxableAmount !== undefined && inv.taxableAmount !== null
      ? Number(inv.taxableAmount)
      : Math.max(0, (Number(inv.subtotal) || 0) - (Number(inv.discountTotal) || 0));
    netSalesRevenue += taxable;

    paymentsReceived += Number(inv.paidAmount) || 0;
    outstandingReceivables += Number(inv.dueAmount) || 0;
  }

  // Cost of Goods Sold (COGS) from order costings
  let cogs = 0;
  let variableCosts = 0;

  for (const oc of orderCostings) {
    cogs += Number(oc.totalDirectCost) || 0;
    variableCosts += Number(oc.totalAllocatedCost) || 0;
  }

  // Operating Expenses = Expenses that are NOT allocated to specific orders
  // (Prevents double counting!)
  let operatingExpenses = 0;
  for (const exp of expenses) {
    if (exp.isArchived) continue;
    if (!exp.isAllocatedToOrder) {
      // For financial P&L, amountBeforeTax represents real expense before input tax credit
      // If tax is claimable (isInputTaxCreditEligible), cost is amountBeforeTax, else totalAmount
      const costAmount = exp.isInputTaxCreditEligible 
        ? Number(exp.amountBeforeTax) || 0 
        : Number(exp.totalAmount) || 0;
      operatingExpenses += costAmount;
    }
  }

  totalInvoicedSales = round2(totalInvoicedSales);
  netSalesRevenue = round2(netSalesRevenue);
  paymentsReceived = round2(paymentsReceived);
  outstandingReceivables = round2(outstandingReceivables);
  cogs = round2(cogs);
  variableCosts = round2(variableCosts);
  operatingExpenses = round2(operatingExpenses);

  // Gross Profit = Net Sales Revenue - COGS
  const grossProfit = round2(netSalesRevenue - cogs);
  const grossMarginPercent = netSalesRevenue > 0 
    ? round2((grossProfit / netSalesRevenue) * 100) 
    : 0;

  // Contribution Profit = Gross Profit - Variable Costs
  const contributionProfit = round2(grossProfit - variableCosts);
  const contributionMarginPercent = netSalesRevenue > 0 
    ? round2((contributionProfit / netSalesRevenue) * 100) 
    : 0;

  // Net Operating Profit = Contribution Profit - Operating Expenses
  const netOperatingProfit = round2(contributionProfit - operatingExpenses);
  const netMarginPercent = netSalesRevenue > 0 
    ? round2((netOperatingProfit / netSalesRevenue) * 100) 
    : 0;

  return {
    totalInvoicedSales,
    netSalesRevenue,
    paymentsReceived,
    outstandingReceivables,
    cogs,
    variableCosts,
    operatingExpenses,
    grossProfit,
    grossMarginPercent,
    contributionProfit,
    contributionMarginPercent,
    netOperatingProfit,
    netMarginPercent
  };
}

