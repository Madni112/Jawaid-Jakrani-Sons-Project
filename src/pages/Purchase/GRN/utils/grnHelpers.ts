import { ProductItem } from '../types/grnTypes';

export const isTileProduct = (p: ProductItem | any): boolean => {
  if (!p) return false;
  const subsub = String(p.sub_sub_category || '').toLowerCase().trim();
  if (subsub) {
    return subsub.includes('tile');
  }
  const cat = String(p.category || '').toLowerCase().trim();
  const sub = String(p.sub_category || '').toLowerCase().trim();
  const scn = String(p.scenario_name || '').toLowerCase().trim();
  const desc = String(p.product_description || '').toLowerCase().trim();
  const name = String(p.product_name || '').toLowerCase().trim();

  const isNonTile =
    /jali|jalii|drain|grate|grating|waste|strainer|trap|pipe|pvc|sanitary|faucet|mixer|basin|commode|tap|sink|hardware|grout|bond/i.test(name) ||
    /sanitary|plumbing|hardware|accessories|cp fittings/i.test(cat);
  if (isNonTile) return false;

  return (
    cat.includes('tile') ||
    sub.includes('tile') ||
    scn.includes('tile') ||
    desc.includes('thickness:') ||
    desc.includes('area/box:') ||
    name.includes('tile')
  );
};

export const handleTileProductSelection = (
  p: ProductItem | any,
  tIdx: number,
  currentTileItem: any,
  setFieldValue: (field: string, value: any) => void,
  defaultWarehouseName?: string
) => {
  let pcsPerBox = Number(p.loose_conversion_ratio || p.pieces_per_box || p.pcs_per_box || p.pieces_per_packing || 0);
  if (pcsPerBox <= 1) {
    const match = String(p.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
    if (match && Number(match[1]) > 0) pcsPerBox = Number(match[1]);
    else pcsPerBox = 4;
  }

  let sqmPerBox = 1.44;
  const matchSqm = String(p.product_description || '').match(/([\d\.]+)\s*sq\.m/i);
  if (matchSqm && Number(matchSqm[1]) > 0) {
    sqmPerBox = Number(matchSqm[1]);
  } else {
    const dimMatch = String(`${p.sub_category || ''} ${p.product_description || ''} ${p.item_sr_no || ''} ${p.product_name || ''}`).match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
    if (dimMatch) {
      const h = Number(dimMatch[1]) || 60;
      const w = Number(dimMatch[2]) || 60;
      sqmPerBox = Number((((h / 100) * (w / 100)) * pcsPerBox).toFixed(2));
    }
  }

  const pBox = Number(p.purchase_price || 0);
  const confLooseCost = Number(p.loose_purchase_price || 0);
  const pPiece = confLooseCost > 0 ? confLooseCost : Number((pBox / pcsPerBox).toFixed(2));
  const pSqm = Number((pBox / (sqmPerBox || 1)).toFixed(2));

  const bQty = Number(currentTileItem.boxQty || 1);
  const lPcs = Number(currentTileItem.loosePcs || 0);
  const totalSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
  const lineTotal = Number(((bQty * pBox) + (lPcs * pPiece)).toFixed(2));

  setFieldValue(`tileItems.${tIdx}.itemName`, p.product_name);
  setFieldValue(`tileItems.${tIdx}.skuCode`, p.item_sr_no || `SKU-${p.id}`);
  setFieldValue(`tileItems.${tIdx}.piecesPerBox`, pcsPerBox);
  setFieldValue(`tileItems.${tIdx}.sqmPerBox`, sqmPerBox);
  setFieldValue(`tileItems.${tIdx}.costPricePerBox`, pBox);
  setFieldValue(`tileItems.${tIdx}.costPricePerPiece`, pPiece);
  setFieldValue(`tileItems.${tIdx}.costPricePerSqm`, pSqm);
  setFieldValue(`tileItems.${tIdx}.totalAmount`, lineTotal);
  setFieldValue(`tileItems.${tIdx}.totalSqm`, totalSqm);
  if (!currentTileItem.warehouseName && defaultWarehouseName) {
    setFieldValue(`tileItems.${tIdx}.warehouseName`, defaultWarehouseName);
  }
};

export const updateTileRowCalcs = (
  field: 'boxQty' | 'loosePcs' | 'costPricePerBox' | 'costPricePerSqm' | 'costPricePerPiece',
  val: number,
  tIdx: number,
  currentTile: any,
  setFieldValue: (field: string, value: any) => void
) => {
  const pcsPerBox = Math.max(1, Number(currentTile.piecesPerBox) || 4);
  const sqmPerBox = Math.max(0.01, Number(currentTile.sqmPerBox) || 1.44);

  let boxQty = Number(field === 'boxQty' ? val : currentTile.boxQty || 0);
  let loosePcs = Number(field === 'loosePcs' ? val : currentTile.loosePcs || 0);
  let pBox = Number(field === 'costPricePerBox' ? val : currentTile.costPricePerBox || 0);
  let pSqm = Number(field === 'costPricePerSqm' ? val : currentTile.costPricePerSqm || 0);
  let pPiece = Number(field === 'costPricePerPiece' ? val : currentTile.costPricePerPiece || 0);

  if (field === 'costPricePerBox') {
    pBox = val;
    pSqm = Number((val / sqmPerBox).toFixed(2));
    pPiece = Number((val / pcsPerBox).toFixed(2));
    setFieldValue(`tileItems.${tIdx}.costPricePerBox`, pBox);
    setFieldValue(`tileItems.${tIdx}.costPricePerSqm`, pSqm);
    setFieldValue(`tileItems.${tIdx}.costPricePerPiece`, pPiece);
  } else if (field === 'costPricePerSqm') {
    pSqm = val;
    pBox = Number((val * sqmPerBox).toFixed(2));
    pPiece = Number((pBox / pcsPerBox).toFixed(2));
    setFieldValue(`tileItems.${tIdx}.costPricePerBox`, pBox);
    setFieldValue(`tileItems.${tIdx}.costPricePerSqm`, pSqm);
    setFieldValue(`tileItems.${tIdx}.costPricePerPiece`, pPiece);
  } else if (field === 'costPricePerPiece') {
    pPiece = val;
    setFieldValue(`tileItems.${tIdx}.costPricePerPiece`, pPiece);
  } else if (field === 'boxQty') {
    boxQty = val;
    setFieldValue(`tileItems.${tIdx}.boxQty`, boxQty);
  } else if (field === 'loosePcs') {
    loosePcs = val;
    setFieldValue(`tileItems.${tIdx}.loosePcs`, loosePcs);
  }

  const lineTotal = Number(((boxQty * pBox) + (loosePcs * pPiece)).toFixed(2));
  const lineSqm = Number(((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2));
  setFieldValue(`tileItems.${tIdx}.totalAmount`, lineTotal);
  setFieldValue(`tileItems.${tIdx}.totalSqm`, lineSqm);
};
