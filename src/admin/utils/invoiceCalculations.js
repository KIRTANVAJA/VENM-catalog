/**
 * FRONTEND INVOICE CALCULATION ENGINE
 * Mirrors backend calculation engine for real-time reactive UI updates
 */

export function round2(num) {
  return Math.round((Number(num) || 0) * 100) / 100;
}

export function calculateLineItem({
  quantity = 1,
  unitPrice = 0,
  discountType = 'PERCENTAGE',
  discountValue = 0,
  taxRate = 12,
  taxEnabled = true,
  pricingMode = 'TAX_EXCLUSIVE'
}) {
  const qty = Math.max(1, parseInt(quantity) || 1);
  const price = Math.max(0, round2(unitPrice));
  const discVal = Math.max(0, round2(discountValue));
  const rate = taxEnabled ? Math.max(0, round2(taxRate)) : 0;

  let subtotal = round2(qty * price);
  let discountAmount = 0;

  if (discountType === 'PERCENTAGE') {
    discountAmount = round2((subtotal * Math.min(100, discVal)) / 100);
  } else {
    discountAmount = Math.min(subtotal, discVal);
  }

  let taxableAmount = 0;
  let taxAmount = 0;
  let lineTotal = 0;

  if (!taxEnabled || rate === 0) {
    taxableAmount = round2(subtotal - discountAmount);
    taxAmount = 0;
    lineTotal = taxableAmount;
  } else if (pricingMode === 'TAX_INCLUSIVE') {
    const grossAfterDiscount = round2(subtotal - discountAmount);
    taxableAmount = round2(grossAfterDiscount / (1 + (rate / 100)));
    taxAmount = round2(grossAfterDiscount - taxableAmount);
    lineTotal = grossAfterDiscount;
  } else {
    taxableAmount = round2(subtotal - discountAmount);
    taxAmount = round2((taxableAmount * rate) / 100);
    lineTotal = round2(taxableAmount + taxAmount);
  }

  return {
    quantity: qty,
    unitPrice: price,
    discountType,
    discountValue: discVal,
    discountAmount,
    subtotal,
    taxRate: rate,
    taxableAmount,
    taxAmount,
    lineTotal
  };
}

export function calculateInvoiceTotals({
  items = [],
  taxEnabled = true,
  taxType = 'INTRA_STATE',
  pricingMode = 'TAX_EXCLUSIVE',
  invoiceDiscountType = 'FIXED',
  invoiceDiscountValue = 0,
  shippingCharges = 0,
  packagingCharges = 0,
  additionalCharges = 0,
  amountPaid = 0,
  advancePaid = 0,
  roundGrandTotal = true
}) {
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let taxableAmountSum = 0;
  let totalTaxSum = 0;

  const calculatedItems = items.map((item, idx) => {
    const calc = calculateLineItem({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountType: item.discountType || 'PERCENTAGE',
      discountValue: item.discountValue || 0,
      taxRate: item.taxRate !== undefined ? item.taxRate : 12,
      taxEnabled,
      pricingMode
    });

    subtotal = round2(subtotal + calc.subtotal);
    itemDiscountTotal = round2(itemDiscountTotal + calc.discountAmount);
    taxableAmountSum = round2(taxableAmountSum + calc.taxableAmount);
    totalTaxSum = round2(totalTaxSum + calc.taxAmount);

    return {
      ...item,
      ...calc,
      displayOrder: item.displayOrder !== undefined ? item.displayOrder : idx
    };
  });

  let invoiceDiscountTotal = 0;
  const invDiscVal = Math.max(0, round2(invoiceDiscountValue));

  if (invoiceDiscountType === 'PERCENTAGE') {
    invoiceDiscountTotal = round2((taxableAmountSum * Math.min(100, invDiscVal)) / 100);
  } else {
    invoiceDiscountTotal = Math.min(taxableAmountSum, invDiscVal);
  }

  const totalDiscount = round2(itemDiscountTotal + invoiceDiscountTotal);
  const netTaxableAmount = Math.max(0, round2(taxableAmountSum - invoiceDiscountTotal));

  let finalTax = 0;
  if (taxEnabled && taxableAmountSum > 0 && totalTaxSum > 0) {
    const taxRatio = netTaxableAmount / taxableAmountSum;
    finalTax = round2(totalTaxSum * taxRatio);
  } else if (taxEnabled) {
    finalTax = totalTaxSum;
  }

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (taxEnabled && finalTax > 0) {
    if (taxType === 'INTRA_STATE') {
      cgstAmount = round2(finalTax / 2);
      sgstAmount = round2(finalTax - cgstAmount);
      igstAmount = 0;
    } else {
      igstAmount = finalTax;
      cgstAmount = 0;
      sgstAmount = 0;
    }
  }

  const shipping = Math.max(0, round2(shippingCharges));
  const packaging = Math.max(0, round2(packagingCharges));
  const additional = Math.max(0, round2(additionalCharges));

  const rawGrandTotal = round2(netTaxableAmount + finalTax + shipping + packaging + additional);

  let grandTotal = rawGrandTotal;
  let roundOff = 0;

  if (roundGrandTotal) {
    grandTotal = Math.round(rawGrandTotal);
    roundOff = round2(grandTotal - rawGrandTotal);
  }

  const paid = Math.max(0, round2(amountPaid));
  const advance = Math.max(0, round2(advancePaid));
  const totalPaid = round2(paid + advance);
  const balanceDue = Math.max(0, round2(grandTotal - totalPaid));

  let paymentStatus = 'UNPAID';
  if (totalPaid >= grandTotal && grandTotal > 0) {
    paymentStatus = 'PAID';
  } else if (totalPaid > 0) {
    paymentStatus = 'PARTIALLY_PAID';
  }

  return {
    items: calculatedItems,
    subtotal,
    itemDiscountTotal,
    invoiceDiscountType,
    invoiceDiscountValue: invDiscVal,
    invoiceDiscountTotal,
    totalDiscount,
    taxableAmount: netTaxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax: finalTax,
    shippingCharges: shipping,
    packagingCharges: packaging,
    additionalCharges: additional,
    roundOff,
    grandTotal,
    amountPaid: paid,
    advancePaid: advance,
    totalPaid,
    balanceDue,
    paymentStatus
  };
}

