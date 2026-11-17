export interface ReturnSlipItem {
  itemName?: string;
  product_name?: string;
  skuCode?: string;
  sku?: string;
  qty?: number;
  acceptedQty?: number;
  rejectedQty?: number;
  holdQty?: number;
  rejectReason?: string;
  disposalAction?: string;
  warehouse?: string;
  uom?: string;
  pcsPerBox?: number;
}

export interface ReturnSlipData {
  id?: number | string;
  return_no?: string;
  invoice_no?: string;
  customer_name?: string;
  return_date?: string;
  gate_pass_no?: string;
  warehouse_name?: string;
  source_warehouse?: string;
  inward_status?: string;
  items?: ReturnSlipItem[];
  received_items?: any[];
  metadata?: any;
}

export const printReturnChallanSlip = (returnRecord: ReturnSlipData) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  const returnNo = returnRecord.return_no || `RTN-${String(returnRecord.id || '').padStart(4, '0')}`;
  const invNo = returnRecord.invoice_no || returnRecord.metadata?.linkedInvoiceNo || '—';
  const custName = returnRecord.customer_name || 'General Customer';
  const retDate = returnRecord.return_date || new Date().toISOString().split('T')[0];
  const whName = returnRecord.warehouse_name || returnRecord.source_warehouse || 'Main Warehouse';
  const status = returnRecord.inward_status || 'Received';

  // Extract gate pass if present
  let gatePass = returnRecord.gate_pass_no;
  if (!gatePass && returnRecord.metadata?.createdReturnSlipsMap) {
    const slips = Object.values(returnRecord.metadata.createdReturnSlipsMap);
    if (slips.length > 0) gatePass = String(slips[0]);
  }

  // Combine items & received_items for full display
  const rawItems = Array.isArray(returnRecord.items) ? returnRecord.items : [];
  const recItems = Array.isArray(returnRecord.received_items) ? returnRecord.received_items : [];

  const itemsHtml = rawItems.map((it: any, idx: number) => {
    const itName = it.itemName || it.product_name || 'Item';
    const itSku = it.skuCode || it.sku || '';
    const matchedRec = recItems.find((r: any) =>
      (r.skuCode && itSku && r.skuCode === itSku) ||
      (r.itemName && itName && String(r.itemName).trim().toLowerCase() === String(itName).trim().toLowerCase())
    );

    const returnedQty = Number(it.qty || 0);
    const acceptedQty = matchedRec ? Number(matchedRec.acceptedQty || 0) : returnedQty;
    const rejectedQty = matchedRec ? Number(matchedRec.rejectedQty || 0) : 0;
    const holdQty = matchedRec ? Number(matchedRec.holdQty || 0) : 0;
    const reason = matchedRec?.rejectReason ? `Reason: ${matchedRec.rejectReason}` : '';
    const disposal = matchedRec?.disposalAction ? `(${matchedRec.disposalAction})` : '';

    return `
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">
          ${itName}
          ${itSku ? `<div style="font-size: 10px; color: #64748b; font-family: monospace;">SKU: ${itSku}</div>` : ''}
        </td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-family: monospace;">
          ${returnedQty} ${it.uom || 'Nos'}
        </td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; color: #047857; font-weight: bold; background: #f0fdf4;">
          ${acceptedQty} ${it.uom || 'Nos'}
        </td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; color: ${rejectedQty > 0 ? '#b91c1c' : '#64748b'}; font-weight: bold; ${rejectedQty > 0 ? 'background: #fef2f2;' : ''}">
          ${rejectedQty > 0 ? `${rejectedQty} ${it.uom || 'Nos'}<div style="font-size: 10px; font-weight: normal; color: #991b1b;">${reason} ${disposal}</div>` : '0'}
        </td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; color: ${holdQty > 0 ? '#b45309' : '#64748b'};">
          ${holdQty}
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Return Inward QC Slip - ${returnNo}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; line-height: 1.4; }
          .header { border-bottom: 2px solid #800020; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .company { font-size: 22px; font-weight: 900; color: #800020; letter-spacing: -0.5px; }
          .title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; }
          .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; }
          .val { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #f1f5f9; padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #334155; }
          .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
          .sig-box { width: 28%; border-top: 1px dashed #64748b; padding-top: 8px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company">AL-MUHAMMADI TILES EMPORIUM</div>
            <div class="title">CUSTOMER SALES RETURN & QC INWARD SLIP</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: bold; color: #64748b;">OFFICIAL DOCUMENT</div>
            <div style="font-size: 14px; font-family: monospace; font-weight: 900; color: #800020;">${returnNo}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <div class="label">Return Note #</div>
            <div class="val" style="color: #be123c; font-family: monospace;">${returnNo}</div>
          </div>
          <div>
            <div class="label">Original Invoice Ref</div>
            <div class="val" style="font-family: monospace;">${invNo}</div>
          </div>
          <div>
            <div class="label">Customer Profile</div>
            <div class="val">${custName}</div>
          </div>
          <div>
            <div class="label">Return Date</div>
            <div class="val">${retDate}</div>
          </div>
          <div style="grid-column: span 2;">
            <div class="label">Receiving Warehouse</div>
            <div class="val">${whName}</div>
          </div>
          <div>
            <div class="label">Return Gate Pass #</div>
            <div class="val" style="font-family: monospace; color: #047857;">${gatePass || 'N/A'}</div>
          </div>
          <div>
            <div class="label">QC Inward Status</div>
            <div class="val" style="color: #047857; text-transform: uppercase;">${status}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th style="text-align: left;">Product Item / Sku</th>
              <th style="text-align: right;">Returned Qty</th>
              <th style="text-align: center;">QC Accepted</th>
              <th style="text-align: center;">QC Rejected</th>
              <th style="text-align: center;">On Hold</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">Warehouse QC Inspector</div>
          <div class="sig-box">Customer / Transporter Sign</div>
          <div class="sig-box">Store In-Charge Approval</div>
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
