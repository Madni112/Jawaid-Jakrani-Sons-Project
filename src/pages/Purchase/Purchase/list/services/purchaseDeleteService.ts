import { supabase } from '../../../../../Context/supabaseClient';

// Helper: format qty with UOM label
export const fmtQty = (qty: number, uom: string): string => {
  let u = (uom || 'unit').toUpperCase();
  if (qty !== 1) {
    if (u === 'BOX') u = 'BOXES';
    else if (u === 'EACH') u = 'UNITS';
    else if (!u.endsWith('S')) u += 'S';
  }
  return `${qty} ${u}`;
};

// Helper: dynamically calculate available stock for a product (product-level, not warehouse-specific)
// Returns { available, uom } based on ALL transactions for that product name
export const getDynamicStock = async (productName: string): Promise<{ available: number; uom: string }> => {
  const pNameLower = productName.trim().toLowerCase();

  // Fetch product UOM
  const { data: prodData } = await supabase.from('products').select('uom').ilike('product_name', productName).maybeSingle();
  const uom = prodData?.uom || 'unit';

  // 1. Opening stock (product-level)
  const { data: openStocks } = await supabase.from('opening_stocks').select('*');
  let opening = 0;
  (openStocks || []).forEach((os: any) => {
    const osName = String(os.product_name || os.item_name || '').trim().toLowerCase();
    if (osName === pNameLower || osName.includes(pNameLower)) {
      opening += Number(os.quantity || os.qty || 0);
    }
  });

  // 2. All GRN accepted qty INCLUDING this purchase's GRN
  const { data: allGrnItems } = await supabase.from('grn_items').select('*, grn_receipts(status)');
  let totalPurchased = 0;
  (allGrnItems || []).forEach((gi: any) => {
    const grnStatus = gi.grn_receipts?.status || '';
    if (!['Confirm', 'Partially Received', 'Billed'].includes(grnStatus)) return;
    const giName = String(gi.product_name || '').trim().toLowerCase();
    if (giName === pNameLower || giName.includes(pNameLower)) {
      totalPurchased += Number(gi.accepted_qty ?? gi.qty ?? 0);
    }
  });

  // 3. Total sales (product-level, not warehouse-specific)
  const { data: sales } = await supabase.from('sales_invoices').select('items, sale_status');
  let totalSold = 0;
  (sales || []).forEach((s: any) => {
    if (['cancel', 'deleted'].includes(String(s.sale_status || '').toLowerCase())) return;
    const itemsArr = Array.isArray(s.items) ? s.items : [];
    itemsArr.forEach((si: any) => {
      const siName = String(si.product_name || si.itemName || '').trim().toLowerCase();
      if (siName === pNameLower || siName.includes(pNameLower)) {
        totalSold += Number(si.qty || si.quantity || 0);
      }
    });
  });

  // 4. Sales returns
  const { data: sReturns } = await supabase.from('sales_returns').select('items, status, inward_status, received_items');
  let totalSalesReturned = 0;
  (sReturns || []).forEach((sr: any) => {
    const statusLower = String(sr.status || '').toLowerCase();
    const inwardLower = String(sr.inward_status || '').toLowerCase();
    if (statusLower === 'cancel' || statusLower === 'deleted' || inwardLower === 'rejected') return;
    const isPending = inwardLower === 'pending inward' || inwardLower === 'pending';
    const receivedItems = Array.isArray(sr.received_items) ? sr.received_items : [];
    const itemsArr = Array.isArray(sr.items) ? sr.items : [];
    itemsArr.forEach((si: any) => {
      const siName = String(si.product_name || si.itemName || '').trim().toLowerCase();
      if (siName === pNameLower || siName.includes(pNameLower)) {
        let acceptedQty = 0;
        if (isPending) {
          acceptedQty = 0;
        } else if (inwardLower === 'partially received') {
          const rec = receivedItems.find((r: any) =>
            (r.skuCode && String(r.skuCode).trim().toLowerCase() === String(si.sku || si.skuCode || '').trim().toLowerCase()) ||
            (r.itemName && String(r.itemName).trim().toLowerCase() === String(si.itemName || si.product_name || '').trim().toLowerCase())
          );
          acceptedQty = rec ? Number(rec.acceptedQty || 0) : 0;
        } else {
          acceptedQty = Number(si.qty || si.quantity || 0);
        }
        totalSalesReturned += acceptedQty;
      }
    });
  });

  // 5. Purchase returns
  const { data: pReturns } = await supabase.from('purchase_returns').select('items, status');
  let totalPurchaseReturned = 0;
  (pReturns || []).forEach((pr: any) => {
    if (['cancel', 'deleted'].includes(String(pr.status || '').toLowerCase())) return;
    const itemsArr = Array.isArray(pr.items) ? pr.items : [];
    itemsArr.forEach((pi: any) => {
      const piName = String(pi.product_name || pi.itemName || '').trim().toLowerCase();
      if (piName === pNameLower || piName.includes(pNameLower)) {
        totalPurchaseReturned += Number(pi.qty || pi.quantity || 0);
      }
    });
  });

  const available = (opening + totalPurchased + totalSalesReturned) - totalSold - totalPurchaseReturned;
  return { available, uom };
};

export const validateAndExecuteDeletePurchase = async (id: string | number): Promise<void> => {
  const { data: targetRecord } = await supabase
    .from('supplier_purchases')
    .select('items, target_warehouse, metadata, purchase_no')
    .eq('id', id)
    .single();

  if (targetRecord?.items) {
    let grnItems: any[] = [];
    if (targetRecord.metadata?.grn_id) {
      const { data: gi } = await supabase.from('grn_items').select('*').eq('grn_id', targetRecord.metadata.grn_id);
      grnItems = gi || [];
    }

    for (const item of targetRecord.items) {
      const pName = item.itemName || item.product_name;
      if (!pName) continue;

      if (targetRecord.metadata?.grn_id) {
        const gItem = grnItems.find((g) =>
          String(g.product_name || '').toLowerCase() === String(pName).toLowerCase()
        );

        if (gItem) {
          const acceptedQty = Number(gItem.accepted_qty ?? 0);

          // Block deletion if any items have already been approved in inward
          if (acceptedQty > 0) {
            throw new Error(
              `Cannot Delete Purchase\n\nProduct: "${pName}" has ${acceptedQty} units already approved in Inward Challan.\n\nPlease raise a Purchase Return instead.`
            );
          }

          const grnRejected = Number(gItem.rejected_qty ?? 0);
          const billQty = Number(item.qty || item.quantity || 0);
          const expectedRej = billQty - acceptedQty;

          // Check 1: Dynamically calculate current available stock and verify >= accepted_qty
          if (acceptedQty > 0) {
            const stockData = await getDynamicStock(pName);
            const currentAvailable = stockData.available;

            if (currentAvailable < acceptedQty) {
              throw new Error(
                `Cannot Delete Purchase\n\nDeletion blocked because some units have already been sold or transferred.`
              );
            }
          }

          // Check 2: GRN rejected qty mismatch
          if (acceptedQty > 0 && expectedRej > 0 && grnRejected !== expectedRej) {
            throw new Error(
              `Cannot Delete Purchase\n\nProduct: "${pName}"\nExpected QC Rejection: ${expectedRej}\nActual GRN Rejection: ${grnRejected}\n\nThe current physical breakdown doesn't match the original purchase bill.`
            );
          }
        }
      } else {
        // Non-GRN: dynamically check full qty
        const qtyToReverse = Number(item.qty || item.quantity || 0);
        if (qtyToReverse > 0) {
          const stockData = await getDynamicStock(pName);
          const currentAvailable = stockData.available;

          if (currentAvailable < qtyToReverse) {
            throw new Error(
              `Cannot Delete Purchase\n\nDeletion blocked because some units have already been sold or transferred.`
            );
          }
        }
      }
    }
  }

  // Only reverse stock if this purchase was NOT linked to a GRN.
  if (!targetRecord?.metadata?.grn_id) {
    if (targetRecord?.items) {
      for (const item of targetRecord.items) {
        const qty = Number(item.qty || item.quantity || 0);
        const pName = item.itemName || item.product_name;

        if (pName) {
          const { data: prod } = await supabase.from('products').select('current_stock').ilike('product_name', pName).maybeSingle();
          if (prod) {
            const newStock = Math.max(0, (Number(prod.current_stock) || 0) - qty);
            await supabase.from('products').update({ current_stock: newStock }).ilike('product_name', pName);
          }
        }
      }
    }
  } else {
    // If it was linked to an auto-generated GRN, completely delete the GRN and its items
    await supabase.from('grn_items').delete().eq('grn_id', targetRecord.metadata.grn_id);
    await supabase.from('grn_receipts').delete().eq('id', targetRecord.metadata.grn_id);
  }

  // Cascade delete financial vouchers linked to this purchase (PAV & VPV)
  const purchaseIdent = targetRecord?.purchase_no || `PUR-${String(id).padStart(4, '0')}`;
  await supabase
    .from('financial_vouchers')
    .delete()
    .or(`original_invoice_no.eq.${purchaseIdent},metadata->>linkedPurchaseNo.eq.${purchaseIdent}`);

  const { error } = await supabase.from('supplier_purchases').delete().eq('id', id);
  if (error) throw error;
};
