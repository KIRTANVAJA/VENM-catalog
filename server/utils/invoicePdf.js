import PDFDocument from 'pdfkit';

/**
 * Generate a professional A4 PDF buffer for a VENM Invoice
 * Uses pure vector layout, clean typography, and restrained #C2FF85 accents.
 */
export async function generateInvoicePdf(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
        info: {
          Title: `Invoice ${invoice.invoiceNumber}`,
          Author: invoice.brandName || 'VENM',
          Subject: `${invoice.invoiceType || 'Tax Invoice'} - ${invoice.customerName}`,
          Creator: 'VENM Luxury Catalog & Studio'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const primaryBlack = '#111111';
      const secondaryGray = '#555555';
      const lightGray = '#E5E5E5';
      const accentLime = '#85E321'; // Restrained lime green

      // Page dimensions
      const pageWidth = doc.page.width; // 595.28
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2); // 515.28

      // ==========================================
      // 1. HEADER SECTION
      // ==========================================
      const headerTop = 40;

      // Brand Logo / Title
      doc.fontSize(22)
        .font('Helvetica-Bold')
        .fillColor(primaryBlack)
        .text(invoice.brandName || 'V E N M', margin, headerTop, { characterSpacing: 2 });

      if (invoice.brandTagline) {
        doc.fontSize(8)
          .font('Helvetica')
          .fillColor(secondaryGray)
          .text(invoice.brandTagline.toUpperCase(), margin, headerTop + 26, { characterSpacing: 1.5 });
      }

      // Brand Contact details below logo
      let brandY = headerTop + 40;
      doc.fontSize(8).font('Helvetica').fillColor(secondaryGray);
      if (invoice.brandAddress) {
        doc.text(invoice.brandAddress, margin, brandY);
        brandY += 11;
      }
      const contactBits = [
        invoice.brandPhone && `Tel: ${invoice.brandPhone}`,
        invoice.brandEmail && `Email: ${invoice.brandEmail}`
      ].filter(Boolean).join('  |  ');
      if (contactBits) {
        doc.text(contactBits, margin, brandY);
        brandY += 11;
      }
      if (invoice.brandGstin && invoice.showBrandGstin !== false) {
        doc.font('Helvetica-Bold').text(`GSTIN: ${invoice.brandGstin}`, margin, brandY);
        brandY += 12;
      }

      // Invoice Badge & Meta (Right Aligned)
      const rightColX = pageWidth - margin - 220;
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor(primaryBlack)
        .text((invoice.invoiceType || 'TAX INVOICE').toUpperCase(), rightColX, headerTop, {
          width: 220,
          align: 'right'
        });

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(primaryBlack)
        .text(`# ${invoice.invoiceNumber}`, rightColX, headerTop + 22, {
          width: 220,
          align: 'right'
        });

      let metaY = headerTop + 38;
      doc.fontSize(8).font('Helvetica').fillColor(secondaryGray);
      
      const invDateStr = new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      doc.text(`Invoice Date: ${invDateStr}`, rightColX, metaY, { width: 220, align: 'right' });
      metaY += 12;

      if (invoice.dueDate) {
        const dueDateStr = new Date(invoice.dueDate).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
        doc.text(`Due Date: ${dueDateStr}`, rightColX, metaY, { width: 220, align: 'right' });
        metaY += 12;
      }

      const statusBadge = `STATUS: ${(invoice.status || 'DRAFT').toUpperCase()}  |  PAYMENT: ${(invoice.paymentStatus || 'UNPAID').toUpperCase()}`;
      doc.font('Helvetica-Bold').fillColor(primaryBlack).text(statusBadge, rightColX, metaY, { width: 220, align: 'right' });

      // Horizontal Divider
      const dividerY = Math.max(brandY, metaY + 16) + 10;
      doc.rect(margin, dividerY, contentWidth, 1.5).fill(primaryBlack);

      // ==========================================
      // 2. BILLED TO & SHIP TO SECTION
      // ==========================================
      const partyY = dividerY + 14;
      const colWidth = (contentWidth - 20) / 2;

      // Left Column: Customer Billing
      doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryBlack).text('BILLED TO:', margin, partyY);
      doc.fontSize(10).font('Helvetica-Bold').text(invoice.customerName || 'Walk-in Client', margin, partyY + 12);
      
      let custY = partyY + 26;
      doc.fontSize(8).font('Helvetica').fillColor(secondaryGray);
      if (invoice.billingAddress) {
        doc.text(invoice.billingAddress, margin, custY, { width: colWidth });
        custY += 11;
      }
      const locBits = [invoice.city, invoice.state, invoice.pincode].filter(Boolean).join(', ');
      if (locBits) {
        doc.text(locBits, margin, custY);
        custY += 11;
      }
      if (invoice.customerPhone) {
        doc.text(`Phone: ${invoice.customerPhone}`, margin, custY);
        custY += 11;
      }
      if (invoice.customerEmail) {
        doc.text(`Email: ${invoice.customerEmail}`, margin, custY);
        custY += 11;
      }
      if (invoice.customerGstin) {
        doc.font('Helvetica-Bold').text(`GSTIN: ${invoice.customerGstin}`, margin, custY);
        custY += 12;
      }

      // Right Column: Order & Shipping / Additional Info
      const rightBoxX = margin + colWidth + 20;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryBlack);

      if (invoice.showShippingAddress && invoice.shippingAddress) {
        doc.text('SHIPPED TO:', rightBoxX, partyY);
        doc.fontSize(8).font('Helvetica').fillColor(secondaryGray);
        doc.text(invoice.shippingAddress, rightBoxX, partyY + 12, { width: colWidth });
      } else {
        doc.text('TRANSACTION DETAILS:', rightBoxX, partyY);
        let txY = partyY + 14;
        doc.fontSize(8).font('Helvetica').fillColor(secondaryGray);
        if (invoice.orderId) {
          doc.text(`Order / Ref ID: ${invoice.orderId}`, rightBoxX, txY);
          txY += 11;
        }
        if (invoice.paymentMethod) {
          doc.text(`Payment Mode: ${invoice.paymentMethod}`, rightBoxX, txY);
          txY += 11;
        }
        if (invoice.transactionRef) {
          doc.text(`Txn Ref: ${invoice.transactionRef}`, rightBoxX, txY);
          txY += 11;
        }
        if (invoice.preparedBy) {
          doc.text(`Prepared By: ${invoice.preparedBy}`, rightBoxX, txY);
          txY += 11;
        }
      }

      // ==========================================
      // 3. LINE ITEMS TABLE
      // ==========================================
      let tableY = Math.max(custY, partyY + 70) + 16;

      // Table Headers
      const colX = {
        num: margin,
        desc: margin + 25,
        qty: margin + 270,
        rate: margin + 320,
        disc: margin + 380,
        tax: margin + 430,
        total: margin + 470
      };

      // Header Bar
      doc.rect(margin, tableY, contentWidth, 18).fill('#F2F2F2');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(primaryBlack);
      doc.text('#', colX.num + 4, tableY + 5);
      doc.text('ITEM & SPECIFICATIONS', colX.desc, tableY + 5);
      doc.text('QTY', colX.qty, tableY + 5, { width: 45, align: 'right' });
      doc.text('RATE (₹)', colX.rate, tableY + 5, { width: 55, align: 'right' });
      doc.text('DISC', colX.disc, tableY + 5, { width: 45, align: 'right' });
      doc.text('TAX', colX.tax, tableY + 5, { width: 35, align: 'right' });
      doc.text('TOTAL (₹)', colX.total, tableY + 5, { width: 45, align: 'right' });

      tableY += 22;

      // Table Rows
      const items = invoice.items || [];
      items.forEach((item, idx) => {
        // Page break safety check
        if (tableY > doc.page.height - 180) {
          doc.addPage();
          tableY = 40;
        }

        const rowStart = tableY;
        doc.fontSize(8).font('Helvetica').fillColor(primaryBlack);
        doc.text(String(idx + 1), colX.num + 4, rowStart);

        // Product Title & Specs
        doc.font('Helvetica-Bold').text(item.name || 'Custom Garment', colX.desc, rowStart, { width: 235 });
        let specY = rowStart + 11;

        const specs = [
          item.size && `Size: ${item.size}`,
          item.color && `Colour: ${item.color}`,
          item.sku && `SKU: ${item.sku}`,
          item.hsnCode && invoice.showItemHsn !== false && `HSN: ${item.hsnCode}`
        ].filter(Boolean).join('  |  ');

        if (specs) {
          doc.fontSize(7).font('Helvetica').fillColor(secondaryGray).text(specs, colX.desc, specY, { width: 235 });
          specY += 10;
        }

        if (item.description && invoice.showItemDescription !== false) {
          doc.fontSize(7).font('Helvetica').fillColor(secondaryGray).text(item.description, colX.desc, specY, { width: 235 });
          specY += 10;
        }

        // Numeric Columns
        doc.fontSize(8).font('Helvetica').fillColor(primaryBlack);
        doc.text(String(item.quantity || 1), colX.qty, rowStart, { width: 45, align: 'right' });
        doc.text(Number(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), colX.rate, rowStart, { width: 55, align: 'right' });

        const discDisplay = item.discountAmount > 0
          ? (item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : `₹${item.discountAmount}`)
          : '-';
        doc.text(discDisplay, colX.disc, rowStart, { width: 45, align: 'right' });

        const taxDisplay = invoice.taxEnabled ? `${item.taxRate || 0}%` : '-';
        doc.text(taxDisplay, colX.tax, rowStart, { width: 35, align: 'right' });

        doc.font('Helvetica-Bold').text(
          Number(item.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          colX.total, rowStart, { width: 45, align: 'right' }
        );

        const rowHeight = Math.max(20, (specY - rowStart) + 4);
        tableY += rowHeight;

        // Subtle row underline
        doc.rect(margin, tableY - 2, contentWidth, 0.5).fill(lightGray);
      });

      // ==========================================
      // 4. SUMMARY & TOTALS SECTION
      // ==========================================
      if (tableY > doc.page.height - 180) {
        doc.addPage();
        tableY = 40;
      }

      tableY += 10;
      const summaryLeftX = margin;
      const summaryRightX = pageWidth - margin - 220;

      // Left: Notes, Terms, and Bank Details
      let notesY = tableY;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryBlack);

      if (invoice.showCustomerNotes !== false && (invoice.customerNotes || invoice.customizationNotes)) {
        doc.text('CLIENT NOTES & CUSTOMIZATION:', summaryLeftX, notesY);
        notesY += 11;
        doc.fontSize(7.5).font('Helvetica').fillColor(secondaryGray);
        if (invoice.customerNotes) {
          doc.text(invoice.customerNotes, summaryLeftX, notesY, { width: 260 });
          notesY += 14;
        }
        if (invoice.customizationNotes) {
          doc.text(`Alterations: ${invoice.customizationNotes}`, summaryLeftX, notesY, { width: 260 });
          notesY += 14;
        }
      }

      if (invoice.showTerms !== false && invoice.termsAndConditions) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryBlack).text('TERMS & CONDITIONS:', summaryLeftX, notesY);
        notesY += 11;
        doc.fontSize(6.5).font('Helvetica').fillColor(secondaryGray);
        doc.text(invoice.termsAndConditions, summaryLeftX, notesY, { width: 260 });
        notesY += 30;
      }

      // Right: Calculation Summary Box
      let calcY = tableY;
      const summaryLine = (label, val, isBold = false) => {
        doc.fontSize(8).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fillColor(primaryBlack);
        doc.text(label, summaryRightX, calcY, { width: 120, align: 'left' });
        doc.text(`₹ ${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, summaryRightX + 120, calcY, { width: 100, align: 'right' });
        calcY += 13;
      };

      summaryLine('Subtotal:', invoice.subtotal);

      if (invoice.totalDiscount > 0) {
        summaryLine('Discounts:', -invoice.totalDiscount);
      }

      if (invoice.taxEnabled) {
        summaryLine('Taxable Amount:', invoice.taxableAmount);
        if (invoice.taxType === 'INTRA_STATE') {
          summaryLine('CGST:', invoice.cgstAmount);
          summaryLine('SGST:', invoice.sgstAmount);
        } else {
          summaryLine('IGST:', invoice.igstAmount);
        }
      }

      if (invoice.shippingCharges > 0) summaryLine('Shipping Charges:', invoice.shippingCharges);
      if (invoice.packagingCharges > 0) summaryLine('Packaging Charges:', invoice.packagingCharges);
      if (invoice.additionalCharges > 0) summaryLine('Additional Charges:', invoice.additionalCharges);
      if (invoice.roundOff !== 0) summaryLine('Round Off:', invoice.roundOff);

      // Grand Total Highlight Bar
      calcY += 2;
      doc.rect(summaryRightX - 6, calcY, 232, 22).fill('#F2F2F2');
      doc.rect(summaryRightX - 6, calcY, 4, 22).fill(accentLime); // Subtle lime accent

      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryBlack);
      doc.text('GRAND TOTAL:', summaryRightX + 4, calcY + 6, { width: 110 });
      doc.text(`₹ ${Number(invoice.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryRightX + 110, calcY + 6, { width: 110, align: 'right' });
      calcY += 28;

      if (invoice.showPaymentDetails !== false) {
        if (invoice.amountPaid > 0 || invoice.advancePaid > 0) {
          const totalPaid = (invoice.amountPaid || 0) + (invoice.advancePaid || 0);
          summaryLine('Amount Paid:', totalPaid);
        }
        summaryLine('Balance Due:', invoice.balanceDue, true);
      }

      // ==========================================
      // 5. FOOTER & THANK YOU
      // ==========================================
      const bottomY = doc.page.height - 45;
      doc.rect(margin, bottomY - 10, contentWidth, 0.5).fill(lightGray);

      doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(primaryBlack)
        .text(invoice.thankYouMessage || 'Thank you for choosing VENM. Tradition with a Bite.', margin, bottomY, {
          width: contentWidth,
          align: 'center'
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

