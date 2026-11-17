import { StandardItem, TileItem } from '../types/quotationTypes';

// Helper to identify Tile products based on category or name
export const isTileProduct = (p: any): boolean => {
  if (!p) return false;
  const cat = String(p?.category || '').toLowerCase().trim();
  const sub = String(p?.sub_category || '').toLowerCase().trim();
  const subsub = String(p?.sub_sub_category || '').toLowerCase().trim();
  const name = String(p?.product_name || '').toLowerCase().trim();
  const uom = String(p?.uom || '').toUpperCase().trim();

  // Exclude non-tile/sanitary items that might have dimension numbers in their names (e.g. Jalli 2x4, Waste Pipe 2x4)
  const isNonTileItem =
    /jalli|drain|grate|grating|waste|strainer|trap|pipe|pvc|sanitary|faucet|mixer|basin|commode|tap|sink|hardware|grout|bond/i.test(
      name
    ) || /sanitary|plumbing|hardware|accessories|cp fittings/i.test(cat);
  if (isNonTileItem) return false;

  if (subsub) {
    return subsub.includes('tile');
  }

  const isTileCat = cat.includes('tile') || sub.includes('tile');
  const hasTileInName = name.includes('tile');
  const isBoxUom = uom === 'BOX' || uom === 'SQM' || uom === 'SQ.M';

  if (isTileCat || hasTileInName) return true;

  // Only consider dimensions if uom is BOX/SQM or has tile-related finish keywords like porcelain, ceramic, vitrified, matt, gloss
  if (isBoxUom || /porcelain|ceramic|vitrified|matt|gloss|granite|marble/i.test(name)) {
    if (/\b\d+(\.\d+)?\s*[xX×*]\s*\d+(\.\d+)?\b/.test(name)) {
      return true;
    }
  }

  return false;
};

export const createBlankStandardItem = (idSuffix: string | number = 1): StandardItem => ({
  id: `item-${Date.now()}-${idSuffix}`,
  product_name: '',
  uom: 'PCS',
  unit: 'PCS',
  qty: 1,
  bulk_qty: 1,
  loose_qty: 0,
  allow_loose_sales: false,
  loose_uom: 'PCS',
  loose_conversion_ratio: 1,
  rate: 0,
  discount_percent: 0,
  discount_amount: 0,
  amount: 0,
  notes: '',
  is_tile: false,
});

export const createBlankTileItem = (idSuffix: string | number = 1): TileItem => ({
  id: `tile-${Date.now()}-${idSuffix}`,
  product_name: '',
  box_qty: 1,
  loose_pcs: 0,
  total_sqm: 1.44,
  sqm_per_box: 1.44,
  pcs_per_box: 4,
  rate_per_box: 0,
  rate_per_sqm: 0,
  rate_per_piece: 0,
  discount_percent: 0,
  discount_amount: 0,
  amount: 0,
  notes: '',
  is_tile: true,
});
