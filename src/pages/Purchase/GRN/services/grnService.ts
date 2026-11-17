import { supabase, fetchAllPages } from '../../../../Context/supabaseClient';
import { fetchStockDataset } from '../../../../utils/stockCalculator';
import { GRNFormValues, LocationItem } from '../types/grnTypes';
import { isTileProduct } from '../utils/grnHelpers';

export const fetchGRNMetadata = async (id?: string, prefLoc?: string | null) => {
  const [venRes, prodRes, locRes, grnCountRes, ds] = await Promise.all([
    supabase.from('vendors').select('vendor_name').order('vendor_name'),
    fetchAllPages(supabase.from('products').select('id, product_name, uom, item_sr_no, category, sub_category, sub_sub_category, scenario_name, pieces_per_box, pcs_per_box, pieces_per_packing, product_description, current_stock, purchase_price, loose_conversion_ratio, allow_loose_sales').order('product_name')),
    supabase.from('inventory_locations').select('name, location_type').order('name'),
    supabase.from('grn_receipts').select('*', { count: 'exact', head: true }),
    fetchStockDataset().catch(() => null)
  ]);

  let defaultWhName = '';
  if (locRes.data && locRes.data.length > 0) {
    if (prefLoc === 'SHOP') {
      const shopLoc = locRes.data.find((l: any) => String(l.name).toUpperCase().includes('SHOP'));
      defaultWhName = shopLoc ? shopLoc.name : (locRes.data[0]?.name || '');
    } else if (prefLoc === 'WAREHOUSE') {
      const whLoc = locRes.data.find((l: any) => !String(l.name).toUpperCase().includes('SHOP'));
      defaultWhName = whLoc ? whLoc.name : (locRes.data[0]?.name || '');
    } else {
      defaultWhName = locRes.data[0]?.name || '';
    }
  }

  let originalGrnData: any = null;
  let loadedInitialValues: Partial<GRNFormValues> | null = null;
  let nextGrnNo = '';

  if (id) {
    const { data: grn, error: grnErr } = await supabase.from('grn_receipts').select('*').eq('id', id).single();
    if (grnErr) throw grnErr;

    const { data: items, error: itemsErr } = await supabase.from('grn_items').select('*').eq('grn_id', id);
    if (itemsErr) throw itemsErr;

    const rawRemarks = grn.remarks || '';
    let loadedGatePasses: Record<string, string> = {};

    // 1. Try JSON format [GatePasses: {...}]
    const jsonMatch = rawRemarks.match(/\[GatePasses:\s*(\{.*?\})\]/s);
    if (jsonMatch) {
      try {
        loadedGatePasses = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.warn('Failed to parse GatePasses JSON from remarks:', e);
      }
    }

    // 2. Legacy fallback [Gate Pass: <slip>]
    if (Object.keys(loadedGatePasses).length === 0) {
      const singleMatch = rawRemarks.match(/\[Gate Pass:\s*([^\]]+)\]/i);
      if (singleMatch) {
        const singleSlip = singleMatch[1].trim();
        const allWhs = new Set<string>();
        (items || []).forEach((i: any) => {
          if (i.warehouse_name) allWhs.add(i.warehouse_name);
        });
        if (allWhs.size === 0 && defaultWhName) allWhs.add(defaultWhName);
        allWhs.forEach(wh => {
          loadedGatePasses[wh] = singleSlip;
        });
      }
    }

    const cleanRemarks = rawRemarks
      .replace(/\[GatePasses:\s*\{.*?\}\]\s*/s, '')
      .replace(/\[Gate Pass:\s*[^\]]+\]\s*/i, '')
      .trim();

    originalGrnData = {
      ...grn,
      gatePasses: loadedGatePasses,
      remarks: cleanRemarks,
      grn_items: items
    };

    const loadedTileItems: any[] = [];
    const loadedStandardItems: any[] = [];

    (items || []).forEach((i: any, itIdx: number) => {
      const matchedProd = prodRes.data?.find((p: any) => p.product_name === i.product_name);
      const isTile = isTileProduct(matchedProd || { product_name: i.product_name, uom: i.uom });

      if (isTile) {
        let pcsPerBox = Number(matchedProd?.loose_conversion_ratio || matchedProd?.pieces_per_box || matchedProd?.pcs_per_box || 4);
        if (pcsPerBox <= 1) pcsPerBox = 4;
        let sqmPerBox = 1.44;
        const dimMatch = String(`${matchedProd?.product_description || ''} ${i.product_name || ''}`).match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
        if (dimMatch) {
          const h = Number(dimMatch[1]) || 60;
          const w = Number(dimMatch[2]) || 60;
          sqmPerBox = Number((((h / 100) * (w / 100)) * pcsPerBox).toFixed(2));
        }

        const totalQty = Number(i.qty || 1);
        let boxQty = totalQty;
        let loosePcs = 0;
        if (totalQty % 1 !== 0 && pcsPerBox > 1) {
          boxQty = Math.floor(totalQty);
          loosePcs = Math.round((totalQty - boxQty) * pcsPerBox);
        }
        const totalSqm = Number(((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2));

        const pBox = Number(matchedProd?.purchase_price || 0);
        const confLooseCost = Number(matchedProd?.loose_purchase_price || 0);
        const pPiece = confLooseCost > 0 ? confLooseCost : Number((pBox / pcsPerBox).toFixed(2));
        const pSqm = Number((pBox / (sqmPerBox || 1)).toFixed(2));
        const lineTotal = Number(((boxQty * pBox) + (loosePcs * pPiece)).toFixed(2));

        loadedTileItems.push({
          id: i.id || `tile-${itIdx}`,
          itemName: i.product_name,
          skuCode: matchedProd ? (matchedProd.item_sr_no || `SKU-${matchedProd.id}`) : '',
          warehouseName: i.warehouse_name || '',
          boxQty,
          loosePcs,
          costPricePerBox: pBox,
          costPricePerSqm: pSqm,
          costPricePerPiece: pPiece,
          totalAmount: lineTotal,
          totalSqm,
          piecesPerBox: pcsPerBox,
          sqmPerBox: sqmPerBox,
          accepted_qty: i.accepted_qty,
          rejected_qty: i.rejected_qty,
          hold_qty: i.hold_qty,
          reject_reason: i.reject_reason
        });
      } else {
        loadedStandardItems.push({
          id: i.id,
          itemName: i.product_name,
          skuCode: matchedProd ? (matchedProd.item_sr_no || `SKU-${matchedProd.id}`) : '',
          qty: i.qty,
          uom: i.uom,
          warehouseName: i.warehouse_name,
          accepted_qty: i.accepted_qty,
          rejected_qty: i.rejected_qty,
          hold_qty: i.hold_qty,
          reject_reason: i.reject_reason
        });
      }
    });

    loadedInitialValues = {
      grnNo: grn.grn_no,
      vendorName: grn.vendor_name,
      receiptDate: grn.receipt_date,
      gatePasses: loadedGatePasses,
      status: grn.status,
      remarks: cleanRemarks,
      showTileSection: loadedTileItems.length > 0,
      tileItems: loadedTileItems,
      items: loadedStandardItems.length > 0
        ? loadedStandardItems
        : (loadedTileItems.length > 0 ? [] : [{ itemName: '', skuCode: '', qty: 1, uom: 'Nos', warehouseName: '' }])
    };
    nextGrnNo = grn.grn_no || `GRN-${id}`;
  } else {
    nextGrnNo = `GRN-${String((grnCountRes.count || 0) + 1).padStart(4, '0')}`;
    loadedInitialValues = {
      grnNo: nextGrnNo,
      gatePasses: {}
    };
  }

  const prods = prodRes.data || [];
  return {
    vendors: venRes.data || [],
    productList: prods,
    products: prods,
    locations: locRes.data || [],
    stockDataset: ds,
    defaultWhName,
    originalGrn: originalGrnData,
    originalGrnData,
    loadedInitialValues,
    nextGrnNo
  };
};

export const submitGRN = async (
  values: GRNFormValues,
  locationsOrId?: LocationItem[] | string,
  idOrLocations?: string | LocationItem[],
  originalGrnData?: any
): Promise<{ finalStatus: string }> => {
  const locations: LocationItem[] = Array.isArray(locationsOrId)
    ? locationsOrId
    : (Array.isArray(idOrLocations) ? idOrLocations : []);
  const id: string | undefined = typeof locationsOrId === 'string'
    ? locationsOrId
    : (typeof idOrLocations === 'string' ? idOrLocations : undefined);
  let finalStatus = values.status;

  // Smart Routing: Check if any selected warehouse is a Storage Point
  if (finalStatus === 'Confirm') {
    const hasStoragePoint = values.items.some(item => {
      const loc = locations.find(l => l.name === item.warehouseName);
      return loc && loc.location_type === 'Storage Point';
    });

    if (hasStoragePoint) {
      finalStatus = 'Pending Inward';
    }
  }

  let grnIdToUse = '';

  const cleanRemarks = (values.remarks || '')
    .replace(/\[GatePasses:\s*\{.*?\}\]\s*/s, '')
    .replace(/\[Gate Pass:\s*[^\]]+\]\s*/i, '')
    .trim();

  const activeGps: Record<string, string> = {};
  if (values.gatePasses && typeof values.gatePasses === 'object') {
    for (const [wh, val] of Object.entries(values.gatePasses)) {
      if (val && String(val).trim()) {
        activeGps[wh] = String(val).trim();
      }
    }
  }

  const finalRemarks = Object.keys(activeGps).length > 0
    ? `[GatePasses: ${JSON.stringify(activeGps)}] ${cleanRemarks}`.trim()
    : cleanRemarks;

  if (id) {
    const { error: updateErr } = await supabase
      .from('grn_receipts')
      .update({
        grn_no: values.grnNo,
        vendor_name: values.vendorName,
        receipt_date: values.receiptDate,
        status: finalStatus,
        remarks: finalRemarks
      })
      .eq('id', id);

    if (updateErr) throw updateErr;
    grnIdToUse = id;

    // Delete Old Items
    await supabase.from('grn_items').delete().eq('grn_id', id);
  } else {
    const { data: grnData, error: grnError } = await supabase
      .from('grn_receipts')
      .insert([{
        grn_no: values.grnNo,
        vendor_name: values.vendorName,
        receipt_date: values.receiptDate,
        status: finalStatus,
        remarks: finalRemarks
      }])
      .select()
      .single();

    if (grnError) throw grnError;
    grnIdToUse = grnData.id;
  }

  // Insert New Items
  const validStd = (values.items || []).filter((it: any) => it.itemName && Number(it.qty || 0) > 0);
  const validTiles = values.showTileSection
    ? (values.tileItems || []).filter((t: any) => t.itemName && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0))
    : [];

  if (validStd.length === 0 && validTiles.length === 0) {
    throw new Error('Please enter at least one standard item or tile item before saving.');
  }

  const itemsToInsert: any[] = [];
  validStd.forEach((item: any) => {
    itemsToInsert.push({
      grn_id: grnIdToUse,
      product_name: item.itemName,
      warehouse_name: item.warehouseName || (locations && locations[0]?.name) || '',
      qty: Number(item.qty),
      uom: item.uom || 'Nos',
      accepted_qty: item.accepted_qty ?? null,
      rejected_qty: Number(item.rejected_qty || 0),
      hold_qty: item.accepted_qty != null ? Number(item.hold_qty || 0) : Number(item.qty),
      reject_reason: item.reject_reason || null
    });
  });

  validTiles.forEach((tile: any) => {
    const bQty = Number(tile.boxQty || 0);
    const lPcs = Number(tile.loosePcs || 0);
    const ppb = Number(tile.piecesPerBox || 4);
    const totalQty = Number((bQty + (lPcs / ppb)).toFixed(3));
    itemsToInsert.push({
      grn_id: grnIdToUse,
      product_name: tile.itemName,
      warehouse_name: tile.warehouseName || (locations && locations[0]?.name) || '',
      qty: totalQty,
      uom: 'BOX',
      accepted_qty: tile.accepted_qty ?? null,
      rejected_qty: Number(tile.rejected_qty || 0),
      hold_qty: tile.accepted_qty != null ? Number(tile.hold_qty || 0) : totalQty,
      reject_reason: tile.reject_reason || null
    });
  });

  const { error: itemsError } = await supabase.from('grn_items').insert(itemsToInsert);
  if (itemsError) throw itemsError;

  return { finalStatus };
};
