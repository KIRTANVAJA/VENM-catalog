/**
 * VENM Reference Pricing & Currency Utilities
 * Formats prices according to Indian numbering system (e.g. ₹1,800, ₹2,50,000)
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

/**
 * Formats a raw number or string amount into Indian Rupee format (e.g. 1800 -> "₹1,800")
 * Handles numbers, strings with/without ₹ symbols, decimals, and invalid values safely.
 */
export function formatINR(amount) {
  if (amount == null || amount === '') return '';
  if (typeof amount === 'number') {
    if (isNaN(amount) || !isFinite(amount)) return '';
    return inrFormatter.format(amount);
  }
  const cleanStr = String(amount).trim();
  if (!cleanStr) return '';

  // Extract numeric characters (allowing decimal point)
  const numericOnly = cleanStr.replace(/[^0-9.]/g, '');
  if (!numericOnly) {
    return cleanStr.startsWith('₹') ? cleanStr : `₹${cleanStr}`;
  }
  const parsed = parseFloat(numericOnly);
  if (isNaN(parsed)) {
    return cleanStr.startsWith('₹') ? cleanStr : `₹${cleanStr}`;
  }
  return inrFormatter.format(parsed);
}

/**
 * Formats product reference pricing based on pricing mode (STARTING_FROM, PRICE_RANGE, CUSTOM_QUOTE)
 * Safely handles null, undefined, empty, and invalid values without throwing runtime exceptions.
 */
export function formatReferencePrice(product) {
  if (!product || typeof product !== 'object') {
    return 'Price on Request';
  }

  const mode = product.priceDisplayMode || 'STARTING_FROM';
  if (mode === 'CUSTOM_QUOTE') {
    return 'Price on Request';
  }

  const estStr = product.estimatedPrice != null ? String(product.estimatedPrice).trim() : '';

  // PRICE_RANGE mode: e.g. minPrice 800, maxPrice 1200 or estimatedPrice contains hyphen/en-dash
  if (mode === 'PRICE_RANGE' || estStr.includes('–') || estStr.includes('-')) {
    if (product.minPrice && product.maxPrice) {
      const minFormatted = formatINR(product.minPrice);
      const maxFormatted = formatINR(product.maxPrice);
      return `Estimated: ${minFormatted} – ${maxFormatted}`;
    }
    if (estStr) {
      const lower = estStr.toLowerCase();
      if (lower.startsWith('estimated')) {
        return estStr;
      }
      return `Estimated: ${estStr}`;
    }
    if (product.minPrice) {
      return `Estimated from ${formatINR(product.minPrice)}`;
    }
  }

  // Pre-formatted text or custom string in estimatedPrice
  if (estStr) {
    const lower = estStr.toLowerCase();
    if (lower.includes('estimated') || lower.includes('from') || lower.includes('request')) {
      return estStr;
    }
    return `Estimated from ${formatINR(estStr)}`;
  }

  // Fallback to minPrice if available
  if (product.minPrice) {
    return `Estimated from ${formatINR(product.minPrice)}`;
  }

  return 'Price on Request';
}
