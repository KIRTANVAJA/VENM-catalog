import PDFDocument from 'pdfkit';

/**
 * Format currency in Indian numbering format (e.g. ₹ 14,872.00)
 */
function formatINR(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

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

/**
 * Generate a professional A4 PDF buffer for a VENM Invoice
 * Uses precise vector typesetting, dynamic row heights, clean pagination,
 * and elegant luxury streetwear aesthetics.
 */
export async function generateInvoicePdf(invoice) {
  return new Promise((resolve, reject) => {
    try {
      // Colors
      const primaryBlack = '#111111';
      const secondaryGray = '#555555';
      const mutedGray = '#777777';
      const lightBorder = '#E5E5E5';
      const tableHeaderBg = '#F6F6F6';
      const accentGreen = '#16A34A';
      const accentLime = '#85E321';

      // Dimensions (A4: 595.28 x 841.89 pt)
      const margin = 36; // 0.5 in margins for maximum printable layout
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const contentWidth = pageWidth - (margin * 2); // 523.28 pt
      const pageBottomLimit = pageHeight - margin - 35; // 770.89 pt (before footer)

      const doc = new PDFDocument({
        size: 'A4',
        margin: margin,
        bufferPages: true,
        info: {
          Title: `Invoice ${invoice.invoiceNumber || 'VENM'}`,
          Author: invoice.brandName || 'VENM',
          Subject: `${invoice.invoiceType || 'Tax Invoice'} - ${invoice.customerName || 'Customer'}`,
          Creator: 'VENM Luxury Catalog & Studio'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Table Column Definitions
      const col = {
        num: { x: margin, w: 24, align: 'center' },
        desc: { x: margin + 28, w: 236, align: 'left' },
        qty: { x: margin + 268, w: 34, align: 'right' },
        rate: { x: margin + 306, w: 56, align: 'right' },
        disc: { x: margin + 366, w: 46, align: 'right' },
        tax: { x: margin + 416, w: 38, align: 'right' },
        total: { x: margin + 458, w: 65, align: 'right' }
      };

      /**
       * Helper: Render Table Header
       */
      const renderTableHeader = (y) => {
        const hHeight = 18;
        doc.rect(margin, y, contentWidth, hHeight).fill(tableHeaderBg);
        doc.rect(margin, y, contentWidth, 0.75).fill(primaryBlack);
        doc.rect(margin, y + hHeight, contentWidth, 0.75).fill(primaryBlack);

        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(primaryBlack);
        doc.text('#', col.num.x, y + 5, { width: col.num.w, align: col.num.align });
        doc.text('ITEM DESCRIPTION & SPECIFICATIONS', col.desc.x, y + 5, { width: col.desc.w, align: col.desc.align });
        doc.text('QTY', col.qty.x, y + 5, { width: col.qty.w, align: col.qty.align });
        doc.text('RATE (₹)', col.rate.x, y + 5, { width: col.rate.w, align: col.rate.align });
        doc.text('DISC', col.disc.x, y + 5, { width: col.disc.w, align: col.disc.align });
        doc.text('TAX', col.tax.x, y + 5, { width: col.tax.w, align: col.tax.align });
        doc.text('TOTAL (₹)', col.total.x, y + 5, { width: col.total.w, align: col.total.align });

        return y + hHeight + 3;
      };

      /**
       * Helper: Render Continuation Header (on Page 2+)
       */
      const renderContinuationHeader = (pageNumber) => {
        let y = margin;
        doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryBlack)
          .text(invoice.brandName || 'VENM', margin, y);
        doc.fontSize(8).font('Helvetica').fillColor(secondaryGray)
          .text(`${(invoice.invoiceType || 'TAX INVOICE').toUpperCase()} #${invoice.invoiceNumber || ''} (CONTINUED)`, margin, y, {
            width: contentWidth,
            align: 'right'
          });
        y += 16;
        doc.rect(margin, y, contentWidth, 0.5).fill(lightBorder);
        y += 8;
        return renderTableHeader(y);
      };

      // ==========================================
      // PAGE 1: HEADER & METADATA
      // ==========================================
      let currentY = margin;

      // Brand Logo / Title
      doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryBlack)
        .text(invoice.brandName || 'VENM', margin, currentY, { characterSpacing: 1.5 });

      if (invoice.brandTagline) {
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(secondaryGray)
          .text(invoice.brandTagline.toUpperCase(), margin, currentY + 25, { characterSpacing: 1.2 });
      }

      // Brand Business Details
      let brandY = currentY + 38;
      doc.fontSize(7.5).font('Helvetica').fillColor(secondaryGray);
      if (invoice.brandAddress) {
        doc.text(invoice.brandAddress, margin, brandY, { width: 240 });
        brandY += doc.heightOfString(invoice.brandAddress, { width: 240 }) + 2;
      }
      const contactPieces = [];
      if (invoice.brandPhone) contactPieces.push(`Tel: ${invoice.brandPhone}`);
      if (invoice.brandEmail) contactPieces.push(`Email: ${invoice.brandEmail}`);
      if (contactPieces.length > 0) {
        doc.text(contactPieces.join('   |   '), margin, brandY, { width: 240 });
        brandY += 10;
      }
      if (invoice.brandGstin && invoice.showBrandGstin !== false) {
        doc.font('Helvetica-Bold').fillColor(primaryBlack).text(`GSTIN: ${invoice.brandGstin}`, margin, brandY);
        brandY += 11;
      }

      // Invoice Badge & Meta (Right Column)
      const rightColX = pageWidth - margin - 220;
      doc.fontSize(15).font('Helvetica-Bold').fillColor(primaryBlack)
        .text((invoice.invoiceType || 'TAX INVOICE').toUpperCase().replace('_', ' '), rightColX, currentY, {
          width: 220,
          align: 'right'
        });

      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryBlack)
        .text(`# ${invoice.invoiceNumber || 'DRAFT'}`, rightColX, currentY + 20, {
          width: 220,
          align: 'right'
        });

      let metaY = currentY + 36;
      doc.fontSize(8).font('Helvetica').fillColor(secondaryGray);

      const invDateStr = invoice.invoiceDate
        ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-';
      doc.text(`Invoice Date: ${invDateStr}`, rightColX, metaY, { width: 220, align: 'right' });
      metaY += 12;

      if (invoice.dueDate) {
        const dueDateStr = new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        doc.text(`Due Date: ${dueDateStr}`, rightColX, metaY, { width: 220, align: 'right' });
        metaY += 12;
      }

      // Status Labels
      const statusStr = `STATUS: ${(invoice.status || 'DRAFT').toUpperCase()}   |   PAYMENT: ${(invoice.paymentStatus || 'UNPAID').toUpperCase().replace('_', ' ')}`;
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(primaryBlack)
        .text(statusStr, rightColX, metaY, { width: 220, align: 'right' });
      metaY += 14;

      // Divider below Header
      const headerBottom = Math.max(brandY, metaY) + 6;
      doc.rect(margin, headerBottom, contentWidth, 1).fill(primaryBlack);

      // ==========================================
      // BILLED TO & TRANSACTION DETAILS
      // ==========================================
      const partyY = headerBottom + 10;
      const halfW = (contentWidth - 20) / 2;

      // Left Column: Customer Details
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(mutedGray).text('BILLED TO:', margin, partyY);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(primaryBlack).text(invoice.customerName || 'Walk-in Client', margin, partyY + 11);

      let custY = partyY + 24;
      doc.fontSize(7.5).font('Helvetica').fillColor(secondaryGray);
      if (invoice.billingAddress) {
        doc.text(invoice.billingAddress, margin, custY, { width: halfW });
        custY += doc.heightOfString(invoice.billingAddress, { width: halfW }) + 2;
      }
      const locBits = [invoice.city, invoice.state, invoice.pincode].filter(Boolean).join(', ');
      if (locBits) {
        doc.text(locBits, margin, custY, { width: halfW });
        custY += 10;
      }
      if (invoice.customerPhone) {
        doc.text(`Phone: ${invoice.customerPhone}`, margin, custY);
        custY += 10;
      }
      if (invoice.customerEmail) {
        doc.text(`Email: ${invoice.customerEmail}`, margin, custY);
        custY += 10;
      }
      if (invoice.customerGstin) {
        doc.font('Helvetica-Bold').fillColor(primaryBlack).text(`Customer GSTIN: ${invoice.customerGstin}`, margin, custY);
        custY += 11;
      }

      // Right Column: Transaction / Shipping Info
      const rightPartyX = margin + halfW + 20;
      let txY = partyY;

      if (invoice.showShippingAddress && invoice.shippingAddress) {
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(mutedGray).text('SHIPPED TO:', rightPartyX, txY);
        txY += 11;
        doc.fontSize(7.5).font('Helvetica').fillColor(secondaryGray);
        doc.text(invoice.shippingAddress, rightPartyX, txY, { width: halfW });
        txY += doc.heightOfString(invoice.shippingAddress, { width: halfW }) + 6;
      } else {
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(mutedGray).text('TRANSACTION DETAILS:', rightPartyX, txY);
        txY += 11;
      }

      doc.fontSize(7.5).font('Helvetica').fillColor(secondaryGray);
      if (invoice.orderId) {
        doc.text(`Order Reference: ${invoice.orderId}`, rightPartyX, txY);
        txY += 10;
      }
      if (invoice.paymentMethod) {
        doc.text(`Payment Mode: ${invoice.paymentMethod.replace('_', ' ')}`, rightPartyX, txY);
        txY += 10;
      }
      if (invoice.transactionRef) {
        doc.text(`Txn Ref / UTR: ${invoice.transactionRef}`, rightPartyX, txY);
        txY += 10;
      }
      if (invoice.state) {
        doc.text(`Place of Supply: ${invoice.state}`, rightPartyX, txY);
        txY += 10;
      }
      if (invoice.taxType) {
        doc.text(`Tax Scheme: ${invoice.taxType === 'INTER_STATE' ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}`, rightPartyX, txY);
        txY += 10;
      }
      if (invoice.preparedBy) {
        doc.text(`Prepared By: ${invoice.preparedBy}`, rightPartyX, txY);
        txY += 10;
      }

      // Divider below party details
      const partyBottom = Math.max(custY, txY) + 6;
      doc.rect(margin, partyBottom, contentWidth, 0.5).fill(lightBorder);

      // ==========================================
      // LINE ITEMS TABLE (With Dynamic Row Height)
      // ==========================================
      currentY = renderTableHeader(partyBottom + 8);

      const items = invoice.items || [];
      items.forEach((item, idx) => {
        // 1. Measure text components for exact dynamic row height
        doc.fontSize(8.5).font('Helvetica-Bold');
        const nameText = item.name || 'Custom Garment';
        const nameHeight = doc.heightOfString(nameText, { width: col.desc.w });

        const specParts = [];
        if (item.size) specParts.push(`Size: ${item.size}`);
        if (item.color) specParts.push(`Colour: ${item.color}`);
        if (item.sku) specParts.push(`SKU: ${item.sku}`);
        if (item.hsnCode && invoice.showItemHsn !== false) specParts.push(`HSN: ${item.hsnCode}`);
        const specText = specParts.join('   •   ');

        doc.fontSize(7).font('Helvetica');
        const specHeight = specText ? doc.heightOfString(specText, { width: col.desc.w }) : 0;

        const hasDesc = Boolean(item.description && invoice.showItemDescription !== false);
        const descText = hasDesc ? item.description.trim() : '';
        const descHeight = hasDesc ? doc.heightOfString(descText, { width: col.desc.w, lineGap: 1.5 }) : 0;

        const paddingTop = 6;
        const paddingBottom = 6;
        const textBlockHeight = nameHeight + (specText ? specHeight + 2 : 0) + (descHeight > 0 ? descHeight + 2 : 0);
        const rowHeight = Math.max(22, textBlockHeight + paddingTop + paddingBottom);

        // 2. Page Break check: does this row fit?
        if (currentY + rowHeight > pageBottomLimit) {
          doc.addPage();
          currentY = renderContinuationHeader(doc.bufferedPageRange().count);
        }

        const rowStart = currentY;

        // 3. Render Item Number (centered vertically with product name)
        doc.fontSize(8).font('Helvetica').fillColor(mutedGray);
        doc.text(String(idx + 1), col.num.x, rowStart + paddingTop, { width: col.num.w, align: col.num.align });

        // 4. Render Product Name & Specifications
        let itemY = rowStart + paddingTop;
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primaryBlack);
        doc.text(nameText, col.desc.x, itemY, { width: col.desc.w });
        itemY += nameHeight + 2;

        if (specText) {
          doc.fontSize(7).font('Helvetica').fillColor(secondaryGray);
          doc.text(specText, col.desc.x, itemY, { width: col.desc.w });
          itemY += specHeight + 2;
        }

        if (descText) {
          doc.fontSize(7).font('Helvetica').fillColor(mutedGray);
          doc.text(descText, col.desc.x, itemY, { width: col.desc.w, lineGap: 1.5 });
        }

        // 5. Render Numeric Columns (aligned to top row padding)
        const numY = rowStart + paddingTop;
        doc.fontSize(8).font('Helvetica').fillColor(primaryBlack);

        // Qty
        doc.text(String(item.quantity || 1), col.qty.x, numY, { width: col.qty.w, align: col.qty.align });

        // Rate
        doc.text(formatINR(item.unitPrice), col.rate.x, numY, { width: col.rate.w, align: col.rate.align });

        // Discount
        const discDisplay = item.discountAmount > 0
          ? (item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : `-${formatINR(item.discountAmount)}`)
          : '-';
        doc.text(discDisplay, col.disc.x, numY, { width: col.disc.w, align: col.disc.align });

        // Tax
        const taxDisplay = invoice.taxEnabled ? (item.taxRate > 0 ? `${item.taxRate}%` : '0%') : '-';
        doc.text(taxDisplay, col.tax.x, numY, { width: col.tax.w, align: col.tax.align });

        // Line Total
        doc.font('Helvetica-Bold').text(formatINR(item.lineTotal), col.total.x, numY, { width: col.total.w, align: col.total.align });

        // Row Separator Line
        currentY = rowStart + rowHeight;
        doc.rect(margin, currentY - 0.5, contentWidth, 0.5).fill(lightBorder);
      });

      // ==========================================
      // SUMMARY & TOTALS SECTION
      // ==========================================
      // Measure required space for the financial breakdown
      const summaryBlockHeight = 145;
      if (currentY + summaryBlockHeight > pageBottomLimit) {
        doc.addPage();
        currentY = renderContinuationHeader(doc.bufferedPageRange().count);
      }

      currentY += 12;
      const summaryTop = currentY;
      const leftColW = 270;
      const rightColW = 225;
      const rightColXPos = pageWidth - margin - rightColW;

      // ------------------------------------------
      // Left: Amount in Words, Notes, Terms
      // ------------------------------------------
      let leftY = summaryTop;

      // Amount in Words Box
      doc.rect(margin, leftY, leftColW, 26).fill('#FAFAFA');
      doc.rect(margin, leftY, leftColW, 0.5).fill(lightBorder);
      doc.fontSize(7).font('Helvetica-Bold').fillColor(mutedGray).text('AMOUNT IN WORDS', margin + 6, leftY + 4);
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(primaryBlack).text(numberToWords(invoice.grandTotal), margin + 6, leftY + 13, { width: leftColW - 12 });
      leftY += 32;

      // Payment Information / Terms
      if (invoice.showPaymentDetails !== false && (invoice.paymentMethod || invoice.transactionRef || invoice.paymentTerms)) {
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(mutedGray).text('PAYMENT DETAILS & INSTRUCTIONS:', margin, leftY);
        leftY += 10;
        doc.fontSize(7.5).font('Helvetica').fillColor(secondaryGray);
        if (invoice.paymentMethod) {
          doc.text(`Payment Mode: ${invoice.paymentMethod.replace('_', ' ')}`, margin, leftY);
          leftY += 10;
        }
        if (invoice.transactionRef) {
          doc.text(`Reference / UTR: ${invoice.transactionRef}`, margin, leftY);
          leftY += 10;
        }
        if (invoice.paymentTerms) {
          doc.text(`Terms: ${invoice.paymentTerms}`, margin, leftY, { width: leftColW });
          leftY += doc.heightOfString(invoice.paymentTerms, { width: leftColW }) + 2;
        }
        leftY += 4;
      }

      // Customer Notes
      if (invoice.showCustomerNotes !== false && (invoice.customerNotes || invoice.customizationNotes)) {
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(mutedGray).text('CLIENT NOTES:', margin, leftY);
        leftY += 10;
        doc.fontSize(7.5).font('Helvetica').fillColor(secondaryGray);
        if (invoice.customerNotes) {
          doc.text(invoice.customerNotes, margin, leftY, { width: leftColW });
          leftY += doc.heightOfString(invoice.customerNotes, { width: leftColW }) + 3;
        }
        if (invoice.customizationNotes) {
          doc.text(`Customization: ${invoice.customizationNotes}`, margin, leftY, { width: leftColW });
          leftY += doc.heightOfString(`Customization: ${invoice.customizationNotes}`, { width: leftColW }) + 3;
        }
        leftY += 4;
      }

      // Terms and Conditions
      if (invoice.showTerms !== false && invoice.termsAndConditions) {
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(mutedGray).text('TERMS & CONDITIONS:', margin, leftY);
        leftY += 10;
        doc.fontSize(7).font('Helvetica').fillColor(secondaryGray);
        const termsText = invoice.termsAndConditions.trim();
        doc.text(termsText, margin, leftY, { width: leftColW, lineGap: 1.5 });
        leftY += doc.heightOfString(termsText, { width: leftColW, lineGap: 1.5 }) + 6;
      }

      // ------------------------------------------
      // Right: Calculation Summary Table
      // ------------------------------------------
      let rightY = summaryTop;
      const labelW = 120;
      const valW = rightColW - labelW;
      const valX = rightColXPos + labelW;

      const renderSummaryRow = (label, valStr, isBold = false, isAccent = false) => {
        doc.fontSize(8).font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(isAccent ? accentGreen : primaryBlack);
        doc.text(label, rightColXPos, rightY, { width: labelW, align: 'left' });
        doc.text(valStr, valX, rightY, { width: valW, align: 'right' });
        rightY += 13;
      };

      renderSummaryRow('Subtotal:', `₹ ${formatINR(invoice.subtotal)}`);

      if (invoice.itemDiscountTotal > 0) {
        renderSummaryRow('Item Discounts:', `-₹ ${formatINR(invoice.itemDiscountTotal)}`, false, true);
      }

      if (invoice.invoiceDiscountTotal > 0) {
        const discLabel = invoice.invoiceDiscountType === 'PERCENTAGE'
          ? `Invoice Discount (${invoice.invoiceDiscountValue}%):`
          : 'Invoice Discount:';
        renderSummaryRow(discLabel, `-₹ ${formatINR(invoice.invoiceDiscountTotal)}`, false, true);
      }

      if (invoice.taxEnabled) {
        renderSummaryRow('Taxable Amount:', `₹ ${formatINR(invoice.taxableAmount)}`);
        if (invoice.taxType === 'INTER_STATE') {
          renderSummaryRow('IGST (Integrated Tax):', `₹ ${formatINR(invoice.igstAmount)}`);
        } else {
          renderSummaryRow('CGST (Central Tax):', `₹ ${formatINR(invoice.cgstAmount)}`);
          renderSummaryRow('SGST (State Tax):', `₹ ${formatINR(invoice.sgstAmount)}`);
        }
      }

      if (invoice.shippingCharges > 0) {
        renderSummaryRow('Shipping Charges:', `₹ ${formatINR(invoice.shippingCharges)}`);
      }
      if (invoice.packagingCharges > 0) {
        renderSummaryRow('Packaging Charges:', `₹ ${formatINR(invoice.packagingCharges)}`);
      }
      if (invoice.additionalCharges > 0) {
        renderSummaryRow('Additional Charges:', `₹ ${formatINR(invoice.additionalCharges)}`);
      }
      if (invoice.roundOff !== 0) {
        const roSign = invoice.roundOff > 0 ? '+' : '';
        renderSummaryRow('Round Off:', `${roSign}₹ ${formatINR(invoice.roundOff)}`);
      }

      // Grand Total Highlight Bar
      rightY += 2;
      const gtHeight = 22;
      doc.rect(rightColXPos, rightY, rightColW, gtHeight).fill(primaryBlack);
      doc.rect(rightColXPos, rightY, 3, gtHeight).fill(accentLime);

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
      doc.text('GRAND TOTAL:', rightColXPos + 8, rightY + 6, { width: labelW - 8, align: 'left' });
      doc.fontSize(10).font('Helvetica-Bold').fillColor(accentLime);
      doc.text(`₹ ${formatINR(invoice.grandTotal)}`, valX - 6, rightY + 5, { width: valW, align: 'right' });
      rightY += gtHeight + 6;

      // Payment Breakdown & Balance Due
      if (invoice.showPaymentDetails !== false) {
        if (invoice.advancePaid > 0) {
          renderSummaryRow('Advance Paid:', `₹ ${formatINR(invoice.advancePaid)}`);
        }
        if (invoice.amountPaid > 0) {
          renderSummaryRow('Amount Paid:', `₹ ${formatINR(invoice.amountPaid)}`);
        }
        const isSettled = (invoice.balanceDue || 0) <= 0.01;
        renderSummaryRow(
          'BALANCE DUE:',
          `₹ ${formatINR(invoice.balanceDue)}`,
          true,
          isSettled
        );
      }

      // Signature Area (Right-aligned under totals or bottom)
      const afterSectionY = Math.max(leftY, rightY) + 20;
      if (afterSectionY < pageBottomLimit - 40) {
        const sigY = pageBottomLimit - 50;
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(primaryBlack)
          .text(`For ${invoice.brandName || 'VENM'}`, rightColXPos, sigY, { width: rightColW, align: 'right' });
        doc.rect(rightColXPos + 60, sigY + 28, rightColW - 60, 0.5).fill(lightBorder);
        doc.fontSize(6.5).font('Helvetica').fillColor(mutedGray)
          .text('Authorized Signatory', rightColXPos, sigY + 31, { width: rightColW, align: 'right' });
      }

      // ==========================================
      // FOOTER & PAGE NUMBERING (ALL PAGES)
      // ==========================================
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = range.start; i < range.start + totalPages; i++) {
        doc.switchToPage(i);
        const footerY = pageHeight - margin - 12;

        // Subtle divider
        doc.rect(margin, footerY - 5, contentWidth, 0.5).fill(lightBorder);

        // Left Brand Message
        doc.fontSize(7).font('Helvetica').fillColor(mutedGray)
          .text(
            invoice.thankYouMessage || 'Thank you for choosing VENM. Tradition with a Bite.',
            margin,
            footerY,
            { width: contentWidth / 2, align: 'left' }
          );

        // Right Page Counter
        const pageText = totalPages > 1 ? `Page ${i + 1} of ${totalPages}` : 'Original for Recipient';
        doc.fontSize(7).font('Helvetica').fillColor(mutedGray)
          .text(pageText, margin + (contentWidth / 2), footerY, {
            width: contentWidth / 2,
            align: 'right'
          });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
