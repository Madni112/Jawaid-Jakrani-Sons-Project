const resolvePcsPerBox = (prod: any, sampleQty?: number): number => {
  if (prod) {
    const looseRatio = Number(prod.loose_conversion_ratio || 0);
    const boxPcs = Number(prod.pieces_per_box || prod.pcs_per_box || prod.pieces_per_packing || 0);
    if (looseRatio > 1) return looseRatio;
    if (boxPcs > 1) return boxPcs;
    const isTile = Boolean(
      String(prod.category || '').toLowerCase().includes('tile') ||
      String(prod.scenario_name || '').toLowerCase().includes('tile')
    );
    if (isTile) return 4;
  }
  if (typeof sampleQty === 'number' && Math.abs(sampleQty - Math.round(sampleQty)) > 0.0001) {
    const fraction = Math.abs(sampleQty - Math.floor(sampleQty));
    for (const cand of [12, 6, 4, 8, 10, 16, 24, 20, 25, 50, 100]) {
      const pcs = fraction * cand;
      if (Math.abs(pcs - Math.round(pcs)) < 0.02) {
        return cand;
      }
    }
  }
  return 1;
};

const formatQtyWithPcs = (prod: any, qty: number): string => {
  if (qty <= 0) return '0';
  const pcsPerBox = resolvePcsPerBox(prod, qty);
  if (pcsPerBox > 1) {
    const totPcs = Math.round(qty * pcsPerBox);
    const b = Math.floor(totPcs / pcsPerBox);
    const p = totPcs % pcsPerBox;
    if (b > 0 && p > 0) return `${b} Boxes + ${p} Pcs`;
    if (b > 0) return `${b} Boxes`;
    if (p > 0) return `${p} Pcs`;
    return '0 Pcs';
  }
  if (Math.abs(qty - Math.round(qty)) > 0.0001) {
    const fraction = Math.abs(qty - Math.floor(qty));
    for (const cand of [12, 6, 4, 8, 10, 16, 24]) {
      const pcs = fraction * cand;
      if (Math.abs(pcs - Math.round(pcs)) < 0.02) {
        const tot = Math.round(qty * cand);
        const b = Math.floor(tot / cand);
        const p = tot % cand;
        if (b > 0 && p > 0) return `${b} Boxes + ${p} Pcs`;
        if (b > 0) return `${b} Boxes`;
        if (p > 0) return `${p} Pcs`;
      }
    }
    return `${Math.round(qty * 100) / 100} ${prod?.uom || 'Units'}`;
  }
  return `${Math.round(qty)} ${prod?.uom || 'Boxes'}`;
};

const cleanShortNumber = (str?: string) => {
  if (!str) return '';
  return str.replace(/^AL-?MUHAMMADI[A-Z\s]*-/i, '');
};

const formatDate = (dateString?: string) => {
  if (!dateString) return new Date().toISOString().split('T')[0];
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

export const printDeliveryChallanSlip = (challan: any, productsMaster: any[] = [], isPurchaseReturn: boolean = false) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  const rawTitle = isPurchaseReturn
    ? (challan.return_no || `RTN-${String(challan.id || 0).padStart(4, '0')}`)
    : (challan.challan_no || `DC-${String(challan.id || 0).padStart(4, '0')}`);

  const gatePassDisplay = cleanShortNumber(challan.gate_pass_no || rawTitle);

  const rawItems = Array.isArray(challan.items) ? challan.items : [];
  let totalOrderedBoxes = 0;
  let totalDispatchedBoxes = 0;
  let totalHoldBoxes = 0;

  const itemsHtml = rawItems
    .map((item: any, idx: number) => {
      const prodName = String(item.pDescription || item.itemName || item.product_name || '').trim();
      const prod = productsMaster.find(p => 
        String(p?.product_name || '').trim().toLowerCase() === prodName.toLowerCase() ||
        (p?.product_code && (p.product_code === item.skuCode || p.product_code === item.pCode || p.product_code === item.item_code))
      );

      const orderedQty = Number(item.orderQty > 0 ? item.orderQty : (item.qty || 0));
      const dispatchedQty = Number(
        item.dispatchedQty !== undefined && item.dispatchedQty !== null
          ? item.dispatchedQty
          : (challan.status === 'Dispatched' ? orderedQty : (orderedQty > 0 ? orderedQty : 0))
      );
      const holdQty = Number(
        item.holdQty !== undefined && item.holdQty !== null
          ? item.holdQty
          : Math.max(0, orderedQty - dispatchedQty)
      );

      totalOrderedBoxes += orderedQty;
      totalDispatchedBoxes += dispatchedQty;
      totalHoldBoxes += holdQty;

      const dispOrdered = formatQtyWithPcs(prod, orderedQty);
      const dispDispatched = dispatchedQty > 0 ? formatQtyWithPcs(prod, dispatchedQty) : '0';
      const dispHold = holdQty > 0 ? formatQtyWithPcs(prod, holdQty) : '0';

      const sku = item.skuCode || item.pCode || item.item_code || '';
      const showSku = sku && sku !== '-' && sku.toLowerCase() !== prodName.toLowerCase();

      return `
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">
            ${prodName || 'Item'}
            ${showSku ? `<span style="font-size: 10px; font-family: monospace; color: #64748b; margin-left: 6px;">(${sku})</span>` : ''}
          </td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-family: monospace;">${dispOrdered}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; color: ${dispatchedQty > 0 ? '#047857' : '#64748b'}; font-weight: bold;">
            ${dispDispatched} Dispatched
          </td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; color: ${holdQty > 0 ? '#b45309' : '#64748b'}; font-weight: ${holdQty > 0 ? 'bold' : 'normal'};">
            ${dispHold} Hold
          </td>
        </tr>
      `;
    })
    .join('');

  const refLabel = isPurchaseReturn ? 'Purchase Ref #' : 'Invoice Ref #';
  const refVal = isPurchaseReturn
    ? (challan.purchase_no ? `PUR-${challan.purchase_no.replace(/^PUR-?/i, '')}` : 'General Settlement')
    : (challan.invoice_no || 'Direct Challan');

  const slipLabel = isPurchaseReturn ? 'Debit Note #' : 'Gate Pass / Slip #';
  const partyLabel = isPurchaseReturn ? 'Supplier / Vendor' : 'Customer / Consignee';
  const partyVal = isPurchaseReturn
    ? (challan.vendor_name || challan.supplier_name || 'Vendor')
    : (challan.customer_name || 'Customer');

  const dispatchDate = formatDate(challan.dc_date || challan.challan_date || challan.return_date || challan.created_at);
  const warehouse = challan.dispatch_warehouse || challan.source_warehouse || challan.warehouse_name || 'Main Warehouse';

  const hasHold = totalHoldBoxes > 0;
  const isApproved = challan.status === 'Dispatched' || (totalDispatchedBoxes > 0 && !hasHold);
  const statusText = isApproved
    ? 'Dispatched (Approved)'
    : (hasHold ? 'Partial Dispatch (Hold Remaining)' : (challan.status || 'Pending Dispatch'));
  const statusColor = isApproved ? '#047857' : '#b45309';

  const docTitle = isPurchaseReturn
    ? 'OUTWARD RETURN CHALLAN / DEBIT NOTE'
    : 'OUTWARD DELIVERY CHALLAN / GATE PASS';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${isPurchaseReturn ? 'Outward Return Slip' : 'Outward Delivery Slip'} - ${gatePassDisplay || rawTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
          .header { border-bottom: 2px solid #800020; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .company { font-size: 22px; font-weight: 900; color: #800020; letter-spacing: -0.5px; }
          .title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; }
          .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; }
          .val { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px; word-break: break-word; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #f1f5f9; padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #334155; }
          .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
          .sig-box { width: 28%; border-top: 1px dashed #64748b; padding-top: 8px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; }
          @media print {
            body { padding: 10mm 12mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company">Jawaid Jakwani & Sons</div>
            <div class="title">${docTitle}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: bold; color: #64748b;">ORIGINAL COPY</div>
            <div style="font-size: 14px; font-family: monospace; font-weight: 900; color: #800020;">${gatePassDisplay || rawTitle}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <div class="label">${refLabel}</div>
            <div class="val" style="color: #be123c; font-family: monospace;">${refVal}</div>
          </div>
          <div>
            <div class="label">${slipLabel}</div>
            <div class="val" style="font-family: monospace;">${gatePassDisplay || rawTitle}</div>
          </div>
          <div>
            <div class="label">${partyLabel}</div>
            <div class="val">${partyVal}</div>
          </div>
          <div>
            <div class="label">Dispatch Date</div>
            <div class="val">${dispatchDate}</div>
          </div>
          <div style="grid-column: span 2;">
            <div class="label">Dispatch Warehouse</div>
            <div class="val">${warehouse}</div>
          </div>
          <div style="grid-column: span 2;">
            <div class="label">Dispatch Status</div>
            <div class="val" style="color: ${statusColor};">${statusText}</div>
          </div>
          ${!isPurchaseReturn && (challan.driver_name || challan.vehicle_no || challan.transport_name || challan.transportation) ? `
            <div style="grid-column: span 4; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 4px;">
              <div class="label">Carrier / Vehicle / Driver Details</div>
              <div class="val" style="font-size: 12px; font-weight: 700;">
                ${[
                  challan.driver_name ? `Driver: ${challan.driver_name}` : null,
                  challan.vehicle_no ? `Vehicle: ${challan.vehicle_no}` : null,
                  (challan.transport_name || challan.transportation) ? `Transit: ${challan.transport_name || challan.transportation}` : null
                ].filter(Boolean).join(' • ') || 'Counter Handover'}
              </div>
            </div>
          ` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th style="text-align: left;">Product Description</th>
              <th style="text-align: right;">Total Ordered / Packing</th>
              <th style="text-align: center;">Dispatched Qty</th>
              <th style="text-align: center;">Hold / Remaining</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr style="background: #f8fafc; font-weight: bold;">
              <td colspan="2" style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right; text-transform: uppercase; font-size: 11px; color: #334155;">
                Summary:
              </td>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">
                ${formatQtyWithPcs(null, totalOrderedBoxes)} Ordered
              </td>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; color: #047857;">
                ${formatQtyWithPcs(null, totalDispatchedBoxes)} Dispatched
              </td>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; color: ${totalHoldBoxes > 0 ? '#b45309' : '#64748b'};">
                ${totalHoldBoxes > 0 ? `${formatQtyWithPcs(null, totalHoldBoxes)} Hold` : '0 Hold'}
              </td>
            </tr>
          </tbody>
        </table>

        ${challan.remarks ? `
          <div style="margin-top: 15px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; color: #334155;">
            <strong style="text-transform: uppercase; color: #0f172a; display: block; margin-bottom: 2px;">Remarks:</strong>
            ${challan.remarks}
          </div>
        ` : ''}

        <div class="signatures">
          <div class="sig-box">Dispatched / Loaded By</div>
          <div class="sig-box">${isPurchaseReturn ? 'Inspected / QC Officer' : 'Carrier / Driver Signature'}</div>
          <div class="sig-box">${isPurchaseReturn ? 'Store In-Charge Approval' : "Receiver's Stamp & Signature"}</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
};
