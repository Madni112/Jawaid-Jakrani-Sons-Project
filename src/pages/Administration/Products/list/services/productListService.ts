import { supabase, fetchAllPages } from '../../../../../Context/supabaseClient';
import { logActivity } from '../../../../../service/auditLogger';
import { ProductCatalogItem, SortConfig } from '../types/productListTypes';

export const PRODUCT_PAGE_COLS =
  'id, product_name, item_sr_no, category, sub_category, sub_sub_category, bin, uom, retail_price, purchase_price, mrp, min_stock_alert, product_description, item_type, pieces_per_box, pcs_per_box, pieces_per_packing, scenario_name, service_charges';

export const stockForProduct = (productName: string, serverBalances: any[] | null) => {
  const n = String(productName || '').trim().toLowerCase();
  const rows = (serverBalances || []).filter((r) => String(r.product_name || '').trim().toLowerCase() === n);
  const byWh: Record<string, any> = {};
  let total = 0;
  rows.forEach((r) => {
    const qty = Number(r.quantity) || 0;
    total += qty;
    const wh = String(r.warehouse_name || 'Global / Unassigned').trim();
    byWh[wh] = {
      opening: 0,
      purchased: 0,
      sold: 0,
      salesReturned: 0,
      purchaseReturned: 0,
      hold: 0,
      rejected: 0,
      transferredIn: 0,
      transferredOut: 0,
      available: qty,
      onHand: qty,
    };
  });
  return { total, byWh };
};

export const applyFilters = (q: any, term: string) => {
  const t = term.trim();
  if (!t) return q;
  const esc = t.replace(/[%_\\]/g, (m) => `\\${m}`);
  return q.or(
    `product_name.ilike.%${esc}%,item_sr_no.ilike.%${esc}%,category.ilike.%${esc}%,product_description.ilike.%${esc}%`
  );
};

export const fetchInventoryProductsLegacy = async (setMasterLocations: (locs: string[]) => void): Promise<ProductCatalogItem[]> => {
  const query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: baseProducts, error } = await query;
  if (error) throw error;

  if (!baseProducts || baseProducts.length === 0) {
    return [];
  }

  const { data: openStocks } = await fetchAllPages(supabase.from('opening_stocks').select('*'));
  const { data: purchases } = await fetchAllPages(
    supabase.from('supplier_purchases').select('id, purchase_no, items, payment_term, metadata, target_warehouse')
  );
  const { data: sales } = await fetchAllPages(
    supabase.from('sales_invoices').select('items, sale_status, receipt_status, dispatch_warehouse')
  );
  const { data: sReturns } = await fetchAllPages(supabase.from('sales_returns').select('*'));
  const { data: pReturns } = await fetchAllPages(supabase.from('purchase_returns').select('*'));
  const { data: deliveryChallans } = await fetchAllPages(
    supabase.from('delivery_challans').select('*').order('created_at', { ascending: false })
  );
  const [{ data: rData }, { data: iData }] = await Promise.all([
    fetchAllPages(supabase.from('grn_receipts').select('*')),
    fetchAllPages(supabase.from('grn_items').select('*')),
  ]);

  const itemsByGrn: Record<string, any[]> = {};
  (iData || []).forEach((it: any) => {
    const gId = String(it.grn_id || '');
    if (!itemsByGrn[gId]) itemsByGrn[gId] = [];
    itemsByGrn[gId].push(it);
  });
  const grnReceipts = (rData || []).map((g: any) => ({
    ...g,
    grn_items: itemsByGrn[String(g.id)] || [],
  }));
  const { data: stockTransfers } = await fetchAllPages(
    supabase.from('stock_transfers').select('items, from_location, to_location, status')
  );
  const { data: locationsMaster } = await supabase.from('inventory_locations').select('name');

  if (locationsMaster) {
    setMasterLocations(locationsMaster.map((l: any) => String(l.name).trim()));
  }

  return baseProducts.map((product) => {
    const name = String(product.product_name || '').trim().toLowerCase();

    const whBreakdowns: Record<string, any> = {};
    const getWh = (whName: string) => {
      const key = String(whName || 'Global / Unassigned').trim();
      if (!whBreakdowns[key]) {
        whBreakdowns[key] = { opening: 0, purchased: 0, sold: 0, salesReturned: 0, purchaseReturned: 0, hold: 0, rejected: 0 };
      }
      return whBreakdowns[key];
    };

    // 1. Live stock from opening_stocks
    let liveStock = 0;
    (openStocks || []).forEach((os: any) => {
      const osName = String(
        os.product_name || os.item_name || os.itemName || os.item_details || os.itemDetails || ''
      ).trim().toLowerCase();
      if (osName === name || osName.includes(name) || name.includes(osName)) {
        const qty = Number(os.quantity || os.qty || 0);
        liveStock += qty;
        getWh(os.warehouse_name || os.location || 'Global / Unassigned').opening += qty;
      }
    });

    // 2. Purchased stock calculation
    let totalPurchased = 0;
    (purchases || []).forEach((p: any) => {
      const termClean = String(p.payment_term || '').trim().toLowerCase();
      const metadata = typeof p.metadata === 'string' ? JSON.parse(p.metadata || '{}') : (p.metadata || {});
      const hasGrn =
        metadata?.grn_id ||
        (Array.isArray(metadata?.grn_ids) && metadata.grn_ids.length > 0) ||
        (grnReceipts || []).some(
          (g: any) =>
            (p.purchase_no && g.grn_no?.includes(p.purchase_no)) ||
            (p.id && g.metadata?.linkedPurchaseId === p.id)
        );

      if (termClean !== 'cancel' && termClean !== 'deleted' && termClean !== 'draft' && !hasGrn) {
        const itemsArray = Array.isArray(p.items) ? p.items : JSON.parse(p.items || '[]');
        itemsArray.forEach((item: any) => {
          const pName = String(item.product_name || item.itemName || item.item_name || '').trim().toLowerCase();
          if (pName === name || pName.includes(name)) {
            const qty = Number(item.qty || item.quantity || 0);
            totalPurchased += qty;
            const resolvedWh =
              item.warehouse ||
              item.location ||
              p.target_warehouse ||
              p.receiving_warehouse ||
              p.warehouse ||
              'Global / Unassigned';
            getWh(resolvedWh).purchased += qty;
          }
        });
      }
    });

    // 2.5 GRN stock calculation
    let totalRejected = 0;
    let totalPurchaseHold = 0;
    (grnReceipts || []).forEach((grn: any) => {
      if (['Pending Inward', 'Confirm', 'Partially Received', 'Billed', 'Rejected'].includes(grn.status)) {
        (grn.grn_items || []).forEach((item: any) => {
          const pName = String(item.product_name || '').trim().toLowerCase();
          if (pName === name || pName.includes(name)) {
            const isUnverified =
              item.accepted_qty == null ||
              (item.accepted_qty === 0 &&
                item.rejected_qty === 0 &&
                Number(item.qty) > 0 &&
                ['Pending Inward', 'Partially Received'].includes(grn.status));
            const accepted = isUnverified ? 0 : Number(item.accepted_qty ?? item.qty ?? 0);
            const rejected = Number(item.rejected_qty ?? 0);
            const holdQty = Number(item.hold_qty ?? 0) + (isUnverified ? Number(item.qty) : 0);

            const fullQty = accepted + rejected;

            totalPurchased += fullQty;
            totalRejected += rejected;
            totalPurchaseHold += holdQty;

            const warehouse =
              item.warehouse_name || grn.target_warehouse || grn.warehouse || 'Global / Unassigned';
            getWh(warehouse).purchased += fullQty;
            getWh(warehouse).rejected += rejected;
            getWh(warehouse).purchaseHold = (getWh(warehouse).purchaseHold || 0) + holdQty;
          }
        });
      }
    });

    // 3. Sold stock calculation
    let totalSold = 0;
    (sales || []).forEach((s: any) => {
      const statusClean = String(s.sale_status || '').trim().toLowerCase();
      if (statusClean !== 'cancel' && statusClean !== 'deleted') {
        const itemsArray = Array.isArray(s.items) ? s.items : JSON.parse(s.items || '[]');
        itemsArray.forEach((item: any) => {
          const sName = String(item.product_name || item.itemName || item.item_name || '').trim().toLowerCase();
          if (sName === name || sName.includes(name)) {
            const qty = Number(item.qty || item.quantity || 0);
            totalSold += qty;
            getWh(
              item.warehouse || item.location || s.dispatch_warehouse || s.warehouse || 'Global / Unassigned'
            ).sold += qty;
          }
        });
      }
    });

    // 4. Sales returns calculation
    let totalSalesReturned = 0;
    (sReturns || []).forEach((sr: any) => {
      const statusClean = String(sr.status || '').trim().toLowerCase();
      const inwardClean = String(sr.inward_status || '').trim().toLowerCase();
      if (statusClean === 'cancel' || statusClean === 'deleted' || inwardClean === 'rejected') return;

      const isPending = inwardClean === 'pending inward' || inwardClean === 'pending';
      const itemsArray = Array.isArray(sr.items) ? sr.items : JSON.parse(sr.items || '[]');
      const receivedItems = Array.isArray(sr.received_items)
        ? sr.received_items
        : JSON.parse(sr.received_items || '[]');

      itemsArray.forEach((item: any) => {
        const srName = String(item.product_name || item.itemName || item.item_name || '').trim().toLowerCase();
        if (srName === name || srName.includes(name)) {
          let acceptedQty = 0;
          if (isPending) {
            acceptedQty = 0;
          } else if (inwardClean === 'partially received') {
            const rec = receivedItems.find(
              (r: any) =>
                (r.skuCode &&
                  String(r.skuCode).trim().toLowerCase() ===
                    String(item.sku || item.skuCode || '').trim().toLowerCase()) ||
                (r.itemName &&
                  String(r.itemName).trim().toLowerCase() ===
                    String(item.itemName || item.product_name || '').trim().toLowerCase())
            );
            acceptedQty = rec ? Number(rec.acceptedQty || 0) : 0;
          } else {
            acceptedQty = Number(item.qty || item.quantity || 0);
          }

          if (acceptedQty > 0) {
            totalSalesReturned += acceptedQty;
            getWh(
              item.warehouse ||
                item.location ||
                sr.receiving_warehouse ||
                sr.warehouse_name ||
                sr.warehouse ||
                'Global / Unassigned'
            ).salesReturned += acceptedQty;
          }
        }
      });
    });

    // 5. Purchase returns calculation
    let totalPurchaseReturned = 0;
    (pReturns || []).forEach((pr: any) => {
      const statusClean = String(pr.status || '').trim().toLowerCase();
      if (statusClean !== 'cancel' && statusClean !== 'deleted') {
        const itemsArray = Array.isArray(pr.items) ? pr.items : JSON.parse(pr.items || '[]');
        itemsArray.forEach((item: any) => {
          const prName = String(item.product_name || item.itemName || item.item_name || '').trim().toLowerCase();
          if (prName === name || prName.includes(name)) {
            const qty = Number(item.qty || item.quantity || 0);
            totalPurchaseReturned += qty;
            getWh(
              item.warehouse || item.location || pr.dispatch_warehouse || pr.warehouse || 'Global / Unassigned'
            ).purchaseReturned += qty;
          }
        });
      }
    });

    // 7. Stock Transfers
    (stockTransfers || []).forEach((st: any) => {
      const itemsArray = Array.isArray(st.items)
        ? st.items
        : typeof st.items === 'string'
        ? JSON.parse(st.items || '[]')
        : [];
      itemsArray.forEach((item: any) => {
        const stName = String(item.product_name || item.itemName || '').trim().toLowerCase();
        if (stName === name) {
          const qty = Number(item.qty || item.quantity || item.transfer_qty || 0);
          const srcWh = String(st.from_location || item.from_location || 'Global / Unassigned').trim();
          const destWh = String(st.to_location || item.to_location || 'Global / Unassigned').trim();

          getWh(srcWh).transferredOut = (getWh(srcWh).transferredOut || 0) + qty;
          getWh(destWh).transferredIn = (getWh(destWh).transferredIn || 0) + qty;
        }
      });
    });

    // 6. Committed Stock (Hold Units from Delivery Challans)
    let totalHold = 0;
    (deliveryChallans || []).forEach((dc: any) => {
      const statusClean = String(dc.status || '').trim().toLowerCase();
      if (statusClean !== 'cancel' && statusClean !== 'deleted') {
        const itemsArray = Array.isArray(dc.items)
          ? dc.items
          : typeof dc.items === 'string'
          ? JSON.parse(dc.items || '[]')
          : [];
        itemsArray.forEach((item: any) => {
          const dcName = String(item.product_name || item.itemName || item.pDescription || '').trim().toLowerCase();
          if (dcName === name || dcName.includes(name)) {
            const orderQty = Number(item.orderQty ?? item.qty ?? 0);
            const dispatchedQty = Number(
              item.dispatchedQty ??
                (statusClean === 'approved' || statusClean === 'dispatched' || statusClean === 'fully dispatched'
                  ? orderQty
                  : 0)
            );
            let holdQty = 0;
            if (statusClean === 'pending approval' || statusClean === 'pending') {
              holdQty = orderQty;
            } else {
              holdQty = Number(item.holdQty !== undefined ? item.holdQty : Math.max(0, orderQty - dispatchedQty));
            }
            totalHold += holdQty;
            getWh(
              item.warehouse || item.location || dc.dispatch_warehouse || dc.warehouse || 'Global / Unassigned'
            ).hold += holdQty;
          }
        });
      }
    });

    const trueRemainingStock =
      liveStock + totalPurchased + totalSalesReturned - totalSold - totalPurchaseReturned - totalRejected;
    const onHandStock = trueRemainingStock + totalHold;

    const finalWhBreakdowns: Record<string, any> = {};
    Object.keys(whBreakdowns).forEach((key) => {
      const w = whBreakdowns[key];
      const transferredIn = w.transferredIn || 0;
      const transferredOut = w.transferredOut || 0;
      const wAvailable =
        w.opening + w.purchased + w.salesReturned + transferredIn - w.sold - w.purchaseReturned - (w.rejected || 0) - transferredOut;
      const wOnHand = wAvailable + w.hold;
      finalWhBreakdowns[key] = {
        ...w,
        opening: w.opening,
        transferredIn,
        transferredOut,
        available: wAvailable,
        onHand: wOnHand,
        rejected: w.rejected || 0,
        purchaseHold: w.purchaseHold || 0,
      };
    });

    return {
      ...product,
      current_stock: trueRemainingStock,
      breakdown: {
        opening: liveStock,
        purchased: totalPurchased,
        purchaseHold: totalPurchaseHold,
        sold: totalSold,
        salesReturned: totalSalesReturned,
        purchaseReturned: totalPurchaseReturned,
        hold: totalHold,
        rejected: totalRejected,
        onHand: onHandStock,
        available: trueRemainingStock,
      },
      warehouseBreakdowns: finalWhBreakdowns,
    };
  });
};

export const loadServerPage = async (
  term: string,
  sortConfig: SortConfig | null,
  currentPage: number,
  pageSize: number,
  serverBalances: any[] | null
): Promise<{ total: number; products: ProductCatalogItem[] }> => {
  const sortKey = sortConfig?.key || 'created_at';
  const asc = sortConfig ? sortConfig.direction !== 'desc' : false;

  let countQ = supabase.from('products').select('id', { count: 'exact', head: true });
  countQ = applyFilters(countQ, term);
  const { count } = await countQ;

  const total = count ?? 0;
  if (total === 0) {
    return { total: 0, products: [] };
  }

  const stockSort = sortKey === 'current_stock';

  if (stockSort) {
    let allQ = supabase.from('products').select('id, product_name');
    allQ = applyFilters(allQ, term);
    const { data: allRows } = await allQ;

    const enriched = (allRows || []).map((p: any) => ({
      p,
      stock: stockForProduct(p.product_name, serverBalances).total,
    }));
    enriched.sort((a, b) => (asc ? a.stock - b.stock : b.stock - a.stock));

    const pageIds = enriched.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((x) => x.p.id);
    if (pageIds.length === 0) {
      return { total, products: [] };
    }

    let detQ = supabase.from('products').select(PRODUCT_PAGE_COLS);
    detQ = applyFilters(detQ, term);
    const { data: details } = await detQ;
    const byId: Record<string, any> = {};
    (details || []).forEach((d: any) => {
      byId[d.id] = d;
    });

    const sortedPage = enriched
      .filter((x) => pageIds.includes(x.p.id))
      .sort((a, b) => (asc ? a.stock - b.stock : b.stock - a.stock))
      .map((x) => byId[x.p.id])
      .filter(Boolean);

    const products = sortedPage.map((row: any) => {
      const { total: stock, byWh } = stockForProduct(row.product_name, serverBalances);
      return {
        ...row,
        current_stock: stock,
        breakdown: {
          opening: 0,
          purchased: 0,
          sold: 0,
          salesReturned: 0,
          purchaseReturned: 0,
          hold: 0,
          rejected: 0,
          onHand: stock,
          available: stock,
        },
        warehouseBreakdowns: byWh,
      };
    });

    return { total, products };
  }

  let q = supabase.from('products').select(PRODUCT_PAGE_COLS);
  q = applyFilters(q, term);
  q = q.order(sortKey, { ascending: asc });
  q = q.range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

  const { data, error } = await q;
  if (error) throw error;

  const products = (data || []).map((row: any) => {
    const { total: stock, byWh } = stockForProduct(row.product_name, serverBalances);
    return {
      ...row,
      current_stock: stock,
      breakdown: {
        opening: 0,
        purchased: 0,
        sold: 0,
        salesReturned: 0,
        purchaseReturned: 0,
        hold: 0,
        rejected: 0,
        onHand: stock,
        available: stock,
      },
      warehouseBreakdowns: byWh,
    };
  });

  return { total, products };
};

export const deleteProductCatalogEntry = async (
  id: string | number,
  targetProd?: ProductCatalogItem,
  user?: any
) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;

  logActivity({
    action: 'DELETE',
    tableName: 'products',
    details: {
      product_name: targetProd?.product_name || id,
      item_code: targetProd?.item_sr_no,
      category: targetProd?.category,
      event: 'Deleted Product Master',
    },
    performedBy: user?.name || user?.email || 'User',
  });
};
