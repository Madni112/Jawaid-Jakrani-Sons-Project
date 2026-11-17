/**
 * Location classification helper for Shop (Sale Point) vs Warehouse (Storage Point).
 */
export const isShopLocation = (name?: string): boolean => {
  const n = String(name || '').trim().toUpperCase();
  if (!n) return false;
  return (
    n.includes('SHOWROOM') ||
    n.includes('SHOP') ||
    n.includes('SALE') ||
    n.includes('RETAIL') ||
    n.includes('TILAK') ||
    n === 'SHOP'
  );
};

export const isWarehouseLocation = (name?: string): boolean => {
  return !isShopLocation(name);
};

export interface WarehouseDispatchStatus {
  hasExistingSlip: boolean;
  existingSlip: string;
  isNewOrIncreased: boolean;
  isWarehouseNew: boolean;
  isQtyIncreased: boolean;
  addedQty: number;
  formattedAddedQty: string;
}

export const getWarehouseDispatchStatus = (
  wh: string,
  currentItems: any[],
  currentTileItems: any[] | undefined,
  editData: any,
  defaultWh: string = '',
  productsList?: any[]
): WarehouseDispatchStatus => {
  if (!editData) {
    return {
      hasExistingSlip: false,
      existingSlip: '',
      isNewOrIncreased: true,
      isWarehouseNew: true,
      isQtyIncreased: false,
      addedQty: 0,
      formattedAddedQty: ''
    };
  }

  // Parse existing slips from editData
  const parsedSlips: Record<string, string> = (() => {
    const raw = editData.gate_pass_no || editData.gatePasses || editData.metadata?.gatePasses;
    if (!raw) return {};
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
    try {
      const str = String(raw).trim();
      if (str.includes(':')) {
        const parts = str.split(' | ');
        const obj: Record<string, string> = {};
        parts.forEach((p: string) => {
          const [k, v] = p.split(':');
          if (k && v) obj[k.trim()] = v.trim();
        });
        return obj;
      }
      const fallbackWh = editData.warehouse_name || editData.dispatch_warehouse || editData.source_warehouse || defaultWh;
      return fallbackWh ? { [fallbackWh]: str } : {};
    } catch {
      return {};
    }
  })();

  const existingSlip = parsedSlips[wh] || '';
  const hasExistingSlip = Boolean(existingSlip && existingSlip.trim().length > 0);

  // Original items in editData
  const rawItems: any[] = Array.isArray(editData.items)
    ? editData.items
    : (typeof editData.items === 'string' ? JSON.parse(editData.items || '[]') : []);

  const rawTileItems: any[] = (Array.isArray(editData.tile_items) && editData.tile_items.length > 0)
    ? editData.tile_items
    : ((Array.isArray(editData.tile_return_items) && editData.tile_return_items.length > 0)
        ? editData.tile_return_items
        : ((Array.isArray(rawItems[0]?._tileItems) && rawItems[0]._tileItems.length > 0)
            ? rawItems[0]._tileItems
            : rawItems.filter((i: any) => i.isTileItem)));

  const oldNormal: any[] = rawItems.filter((i: any) => !i.isTileItem);
  const oldTile: any[] = rawTileItems;

  const editDefaultWh = (editData.dispatch_warehouse || editData.source_warehouse || editData.warehouse || defaultWh || '').trim().toLowerCase();
  const targetWh = (wh || '').trim().toLowerCase();

  let originalQty = 0;
  oldNormal.forEach((i: any) => {
    const itemWh = (i.warehouse || editDefaultWh).trim().toLowerCase();
    if (itemWh === targetWh) {
      originalQty += Number(i.qty || i.quantity || 0);
    }
  });

  oldTile.forEach((t: any) => {
    const tileWh = (t.warehouse || editDefaultWh).trim().toLowerCase();
    if (tileWh === targetWh) {
      const ppb = Math.max(1, Number(t.piecesPerBox || t.pcs_per_box || 4));
      originalQty += Number(t.boxQty ?? t.qty ?? 0) + (Number(t.loosePcs || 0) / ppb);
    }
  });

  // Current items
  let currentQty = 0;
  (currentItems || []).forEach((i: any) => {
    const itemWh = (i.warehouse || defaultWh).trim().toLowerCase();
    if (itemWh === targetWh) {
      currentQty += Number(i.qty || i.quantity || 0);
    }
  });

  (currentTileItems || []).forEach((t: any) => {
    const tileWh = (t.warehouse || defaultWh).trim().toLowerCase();
    if (tileWh === targetWh) {
      const ppb = Math.max(1, Number(t.piecesPerBox || t.pcs_per_box || 4));
      currentQty += Number(t.boxQty ?? t.qty ?? 0) + (Number(t.loosePcs || 0) / ppb);
    }
  });

  const isWarehouseNew = originalQty === 0 && currentQty > 0;
  const isQtyIncreased = currentQty > originalQty + 0.0001;
  const isNewOrIncreased = isWarehouseNew || isQtyIncreased;
  const addedQty = Math.max(0, currentQty - originalQty);

  // Helper to resolve packaging (piecesPerBox) for box/tile products
  let detectedPpb = 1;
  let hasBoxProductInWh = false;

  const findProd = (nameOrCode: string) => {
    if (!productsList || !nameOrCode) return null;
    const clean = String(nameOrCode).trim().toLowerCase();
    return productsList.find((p: any) =>
      String(p.product_name || '').trim().toLowerCase() === clean ||
      String(p.item_sr_no || '').trim().toLowerCase() === clean
    );
  };

  const checkItemPpb = (it: any) => {
    if (!it) return 1;
    if (Number(it.piecesPerBox || it.pcsPerBox || it.pcs_per_box) > 1) {
      return Number(it.piecesPerBox || it.pcsPerBox || it.pcs_per_box);
    }
    const matched = findProd(it.itemName || it.product_name || it.skuCode);
    if (matched) {
      const rawPcs = Number(
        matched.loose_conversion_ratio ||
        matched.pieces_per_box ||
        matched.pcs_per_box ||
        matched.pieces_per_packing ||
        0
      );
      if (rawPcs > 1) return rawPcs;
      const descMatch = String(matched.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
      if (descMatch && Number(descMatch[1]) > 0) return Number(descMatch[1]);
      const cat = String(matched.category || matched.sub_sub_category || '').toLowerCase();
      const uom = String(matched.uom || '').toLowerCase();
      if (cat.includes('tile') || uom === 'box' || uom === 'boxes') return 4;
    }
    if (it.isTileItem || String(it.uom || '').toLowerCase() === 'box' || String(it.uom || '').toLowerCase() === 'boxes') {
      return 4;
    }
    return 1;
  };

  // Inspect all items relevant to this warehouse
  (currentItems || []).forEach((i: any) => {
    const itemWh = (i.warehouse || defaultWh).trim().toLowerCase();
    if (itemWh === targetWh) {
      const ppb = checkItemPpb(i);
      if (ppb > 1) {
        hasBoxProductInWh = true;
        detectedPpb = ppb;
      }
    }
  });

  (currentTileItems || []).forEach((t: any) => {
    const tileWh = (t.warehouse || defaultWh).trim().toLowerCase();
    if (tileWh === targetWh) {
      const ppb = Math.max(1, Number(t.piecesPerBox || t.pcs_per_box || checkItemPpb(t) || 4));
      hasBoxProductInWh = true;
      detectedPpb = ppb;
    }
  });

  oldNormal.forEach((i: any) => {
    const itemWh = (i.warehouse || editDefaultWh).trim().toLowerCase();
    if (itemWh === targetWh) {
      const ppb = checkItemPpb(i);
      if (ppb > 1) {
        hasBoxProductInWh = true;
        detectedPpb = ppb;
      }
    }
  });

  oldTile.forEach((t: any) => {
    const tileWh = (t.warehouse || editDefaultWh).trim().toLowerCase();
    if (tileWh === targetWh) {
      const ppb = Math.max(1, Number(t.piecesPerBox || t.pcs_per_box || checkItemPpb(t) || 4));
      hasBoxProductInWh = true;
      detectedPpb = ppb;
    }
  });

  // If detectedPpb is still 1 or not flagged, but addedQty has a decimal fraction:
  // Automatically identify the closest packing ratio from common standards [12, 6, 4, 8, 10, 16, 24]
  const frac = Math.abs(addedQty % 1);
  if (frac > 0.005 && frac < 0.995) {
    hasBoxProductInWh = true;
    if (detectedPpb <= 1) {
      const candidates = [12, 6, 4, 8, 10, 16, 24, 20, 2, 3, 5];
      let bestPpb = 12;
      let minDiff = 1;
      for (const c of candidates) {
        const diff = Math.abs(Math.round(addedQty * c) - (addedQty * c));
        if (diff < minDiff) {
          minDiff = diff;
          bestPpb = c;
        }
      }
      detectedPpb = bestPpb;
    }
  }

  let formattedAddedQty = '';
  if (hasBoxProductInWh && detectedPpb > 1) {
    const totalPieces = Math.round(addedQty * detectedPpb);
    const boxes = Math.floor(totalPieces / detectedPpb);
    const loose = totalPieces % detectedPpb;
    if (boxes > 0 && loose > 0) {
      formattedAddedQty = `${boxes} ${boxes === 1 ? 'Box' : 'Boxes'} + ${loose} Pcs`;
    } else if (boxes > 0) {
      formattedAddedQty = `${boxes} ${boxes === 1 ? 'Box' : 'Boxes'}`;
    } else if (loose > 0) {
      formattedAddedQty = `${loose} Pcs`;
    } else {
      formattedAddedQty = `0 Pcs`;
    }
  } else {
    if (Number.isInteger(addedQty)) {
      formattedAddedQty = String(addedQty);
    } else {
      const candidates = [12, 6, 4, 8, 10, 16, 24, 20, 2, 3, 5];
      let bestPpb = 12;
      let minDiff = 1;
      for (const c of candidates) {
        const diff = Math.abs(Math.round(addedQty * c) - (addedQty * c));
        if (diff < minDiff) {
          minDiff = diff;
          bestPpb = c;
        }
      }
      const totalPieces = Math.round(addedQty * bestPpb);
      const boxes = Math.floor(totalPieces / bestPpb);
      const loose = totalPieces % bestPpb;
      if (boxes > 0 && loose > 0) {
        formattedAddedQty = `${boxes} ${boxes === 1 ? 'Box' : 'Boxes'} + ${loose} Pcs`;
      } else if (boxes > 0) {
        formattedAddedQty = `${boxes} ${boxes === 1 ? 'Box' : 'Boxes'}`;
      } else if (loose > 0) {
        formattedAddedQty = `${loose} Pcs`;
      } else {
        formattedAddedQty = `${addedQty.toFixed(2)}`;
      }
    }
  }

  return {
    hasExistingSlip,
    existingSlip,
    isNewOrIncreased,
    isWarehouseNew,
    isQtyIncreased,
    addedQty,
    formattedAddedQty
  };
};
