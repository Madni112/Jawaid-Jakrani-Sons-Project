export const parseItems = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
};

// Helper to format line item quantity as Boxes + Pcs if it's a tile
export const formatItemLineQty = (
  pName: string,
  rawQty: number,
  productLookupMap: Record<string, any> = {},
  explicitUom?: string
): string => {
  try {
    const safeName = String(pName || '').trim();
    const meta = productLookupMap && safeName ? productLookupMap[safeName.toLowerCase()] : null;
    const pCat = meta?.category || '';
    const sCat = meta?.sub_category || '';
    const pcsPerBox = Number(meta?.pieces_per_box || meta?.pcs_per_box || meta?.pieces_per_packing || 0);
    const isTile = Boolean(
      String(pCat).toLowerCase().includes('tile') ||
      String(sCat).toLowerCase().includes('tile') ||
      String(meta?.scenario_name || '').toLowerCase().includes('tile') ||
      pcsPerBox > 1
    );

    const packPcs = pcsPerBox > 1 ? pcsPerBox : 5;
    const numQty = Number(rawQty || 0);
    if (isTile) {
      const boxes = Math.floor(numQty);
      const loose = Math.round((numQty - boxes) * packPcs);
      if (boxes > 0 && loose > 0) {
        return `${boxes} Box + ${loose} Pcs`;
      } else if (boxes > 0) {
        return `${boxes} Box${boxes > 1 ? 'es' : ''}`;
      } else if (loose > 0) {
        return `${loose} Pcs`;
      }
      return `0 Box`;
    }
    return `${numQty} ${explicitUom || meta?.uom || 'Units'}`;
  } catch {
    return `${rawQty || 0} ${explicitUom || 'Units'}`;
  }
};

// Helper to compile consignment quantities grouped by UOM (e.g. ['10 Boxes + 5 Pcs', '5 EACH'])
export const getConsignmentQtyBreakdown = (
  itemsRaw: any,
  productLookupMap: Record<string, any> = {}
): string[] => {
  try {
    const items = parseItems(itemsRaw);
    if (!Array.isArray(items) || items.length === 0) return ['-'];

    let totalBoxes = 0;
    let totalLoosePcs = 0;
    let hasTile = false;
    const nonTileMap: Record<string, number> = {};

    items.forEach((it: any) => {
      if (!it || typeof it !== 'object') return;
      const pName = String(it.itemName || it.product_name || it.name || '').trim();
      const meta = productLookupMap && pName ? productLookupMap[pName.toLowerCase()] : null;
      const pCat = meta?.category || '';
      const sCat = meta?.sub_category || '';
      const pcsPerBox = Number(meta?.pieces_per_box || meta?.pcs_per_box || meta?.pieces_per_packing || 0);
      const isTile = Boolean(
        String(pCat).toLowerCase().includes('tile') ||
        String(sCat).toLowerCase().includes('tile') ||
        String(meta?.scenario_name || '').toLowerCase().includes('tile') ||
        pcsPerBox > 1
      );
      const packPcs = pcsPerBox > 1 ? pcsPerBox : 5;
      const q = Number(it.qty || it.quantity || 0);

      if (isTile) {
        hasTile = true;
        const b = Math.floor(q);
        const l = Math.round((q - b) * packPcs);
        totalBoxes += b;
        totalLoosePcs += l;
      } else {
        const uom = String(it.uom || meta?.uom || 'EACH').toUpperCase();
        nonTileMap[uom] = (nonTileMap[uom] || 0) + q;
      }
    });

    const lines: string[] = [];
    if (hasTile) {
      const defaultPack = 5;
      const extraBoxes = Math.floor(totalLoosePcs / defaultPack);
      const remLoose = totalLoosePcs % defaultPack;
      const finalBoxes = totalBoxes + extraBoxes;

      if (finalBoxes > 0 && remLoose > 0) {
        lines.push(`${finalBoxes} Box${finalBoxes > 1 ? 'es' : ''} + ${remLoose} Pcs`);
      } else if (finalBoxes > 0) {
        lines.push(`${finalBoxes} Box${finalBoxes > 1 ? 'es' : ''}`);
      } else if (remLoose > 0) {
        lines.push(`${remLoose} Pcs`);
      }
    }

    Object.entries(nonTileMap).forEach(([uom, sum]) => {
      if (sum > 0) {
        lines.push(`${sum.toLocaleString()} ${uom}`);
      }
    });

    return lines.length > 0 ? lines : ['-'];
  } catch {
    return ['-'];
  }
};

// Helper to compile row discounts (item discounts + bill discounts)
export const getRowDiscounts = (row: any, items: any[]) => {
  let totalItemDiscount = 0;
  if (Array.isArray(items)) {
    items.forEach((it: any) => {
      const q = Number(it.qty || it.quantity || 1);
      const r = Number(it.purchase_price ?? it.cost_price ?? it.unit_price ?? it.rate ?? it.price ?? 0);
      const gross = q * r;
      const dPer = Number(it.discountPer ?? it.discount_per ?? 0);
      const dAmt = Number(it.discountAmt ?? it.discount_amt ?? (dPer > 0 ? (gross * dPer) / 100 : 0));
      totalItemDiscount += dAmt;
    });
  }
  const overallBillDiscount = Number(
    row.overall_discount ||
    row.overall_discount_amount ||
    row.bill_discount ||
    row.discount_amount ||
    row.discount ||
    0
  );
  const grandTotalDiscount = totalItemDiscount + overallBillDiscount;
  return { totalItemDiscount, overallBillDiscount, grandTotalDiscount };
};

// Helper to lookup vendor code and page number
export const getVendorDetails = (vendorNameOrId: any, vendorLookupMap: Record<string, any> = {}) => {
  const key = String(vendorNameOrId || '').trim().toLowerCase();
  return vendorLookupMap[key] || null;
};
