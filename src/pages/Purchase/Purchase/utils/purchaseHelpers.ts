import * as Yup from 'yup';
import { supabase } from '../../../../Context/supabaseClient';

export const resolveVendorCoaAccount = async (vendorName: string, vendorsList: any[] = []) => {
  const cleanName = (vendorName || '').trim();
  if (!cleanName) return { code: '2010-001', title: 'Demo Vendor' };

  const matched = vendorsList.find(v =>
    (v.vendor_name || v.supplier_name || v.name || '').trim().toLowerCase() === cleanName.toLowerCase()
  );
  const existingCode = matched?.vendor_code || matched?.supplier_code || matched?.coa_code;
  if (existingCode && String(existingCode).startsWith('2010-')) {
    return { code: String(existingCode).trim(), title: matched.vendor_name || cleanName };
  }

  try {
    const { data: coaRows } = await supabase
      .from('chart_of_accounts')
      .select('account_code, account_title')
      .ilike('account_title', cleanName)
      .limit(1);

    if (coaRows && coaRows.length > 0 && coaRows[0].account_code) {
      return { code: coaRows[0].account_code, title: coaRows[0].account_title || cleanName };
    }

    const { data: allVendCoa } = await supabase
      .from('chart_of_accounts')
      .select('account_code')
      .ilike('account_code', '2010-%');

    let maxSeq = 0;
    (allVendCoa || []).forEach(r => {
      const match = String(r.account_code || '').match(/2010-(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });

    const nextCode = `2010-${String(maxSeq + 1).padStart(3, '0')}`;
    await supabase.from('chart_of_accounts').insert([{
      account_code: nextCode,
      account_title: cleanName,
      category_code: '2. LIABILITIES',
      sub_category_code: 'Current Liabilities',
      control_code: 'Vendor',
      notes: `Vendor account for ${cleanName} (Auto-registered from Purchase Bill)`
    }]);

    return { code: nextCode, title: cleanName };
  } catch (err) {
    console.warn('resolveVendorCoaAccount in purchases error:', err);
    return { code: '2010-001', title: cleanName };
  }
};

export const isTileProduct = (p: any): boolean => {
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

  const isNonTile = /jali|jalii|drain|grate|grating|waste|strainer|trap|pipe|pvc|sanitary|faucet|mixer|basin|commode|tap|sink|hardware|grout|bond/i.test(name) ||
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

export const calculatePurchaseLineTotals = (item: any, applyTax: boolean, productList: any[] = []) => {
  const qty = Math.max(0, Number(item.qty) || 0);
  const rate = Math.max(0, Number(item.rate) || 0);
  const pMatch = (productList || []).find((p: any) =>
    p.product_name === item.itemName ||
    p.item_sr_no === item.itemCode ||
    (item.skuCode && (p.item_sr_no === item.skuCode || `SKU-${p.id}` === item.skuCode))
  );
  const isTile = pMatch ? isTileProduct(pMatch) : false;
  const allowLoose = Boolean(pMatch?.allow_loose_sales || isTile);
  const rawPcs = Number(pMatch?.pieces_per_box ?? pMatch?.pcs_per_box ?? pMatch?.pieces_per_packing ?? 0);
  const pcsPerBox = Number(pMatch?.loose_conversion_ratio) > 0
    ? Number(pMatch.loose_conversion_ratio)
    : (rawPcs > 0 ? rawPcs : (isTile ? 4 : 1));

  let grossTotal = qty * rate;
  if (allowLoose && pcsPerBox > 1) {
    const bulkCount = Math.floor(qty);
    const looseCount = Math.round((qty - bulkCount) * pcsPerBox);
    const pieceRate = item.pieceRate !== undefined && item.pieceRate !== ''
      ? Number(item.pieceRate)
      : (Number(pMatch?.loose_purchase_price) > 0
          ? Number(pMatch.loose_purchase_price)
          : (pcsPerBox > 0 ? rate / pcsPerBox : 0));
    grossTotal = Number(((bulkCount * rate) + (looseCount * pieceRate)).toFixed(2));
  }
  const discountAmt = Math.max(0, Number(item.discountAmt) || 0);
  const remainingCost = Math.max(0, grossTotal - discountAmt);

  if (!applyTax) {
    return { grossTotal, gstAmt: 0, discountAmt, netTotal: remainingCost };
  }

  const gstAmt = Math.max(0, Number(item.gstAmt) || 0);
  const netTotal = Math.max(0, remainingCost + gstAmt);

  return { grossTotal, gstAmt, discountAmt, netTotal };
};

export const parseGrnItemsToTilesAndStandard = (
  grnItems: any[],
  products: any[],
  locs: any[]
) => {
  const tileItems: any[] = [];
  const standardItems: any[] = [];

  (grnItems || []).forEach((gi: any, idx: number) => {
    const rawName = String(gi.product_name || gi.itemName || gi.item_name || '').trim();
    const rawSku = String(gi.skuCode || gi.sku_code || '').trim();

    const prod =
      (products || []).find(
        (p: any) =>
          String(p.product_name || '').trim().toLowerCase() === rawName.toLowerCase()
      ) ||
      (products || []).find(
        (p: any) =>
          rawSku &&
          (String(p.item_sr_no || '').trim().toLowerCase() === rawSku.toLowerCase() ||
            `sku-${p.id}`.toLowerCase() === rawSku.toLowerCase())
      );

    const isTile = isTileProduct(prod || { product_name: rawName, uom: gi.uom });

    if (isTile) {
      let pcsPerBox = Number(
        prod?.pieces_per_box || prod?.pcs_per_box || prod?.pieces_per_packing || 0
      );
      if (pcsPerBox <= 1) {
        const match = String(prod?.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
        if (match && Number(match[1]) > 0) pcsPerBox = Number(match[1]);
        else pcsPerBox = 4;
      }

      let sqmPerBox = 1.44;
      const matchSqm = String(prod?.product_description || '').match(/([\d\.]+)\s*sq\.m/i);
      if (matchSqm && Number(matchSqm[1]) > 0) {
        sqmPerBox = Number(matchSqm[1]);
      } else {
        const dimMatch = String(
          `${prod?.sub_category || ''} ${prod?.product_description || ''} ${prod?.item_sr_no || ''} ${rawName}`
        ).match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
        if (dimMatch) {
          const h = Number(dimMatch[1]) || 60;
          const w = Number(dimMatch[2]) || 60;
          sqmPerBox = Number((((h / 100) * (w / 100)) * pcsPerBox).toFixed(2));
        }
      }

      const pBox = Number(prod?.purchase_price || 0);
      const confLooseCost = Number(prod?.loose_purchase_price || 0);
      const pPiece = confLooseCost > 0 ? confLooseCost : Number((pBox / pcsPerBox).toFixed(2));
      const pSqm = Number((pBox / (sqmPerBox || 1)).toFixed(2));

      const totalRawQty = Number(
        gi.accepted_qty != null ? gi.accepted_qty : gi.qty != null ? gi.qty : 1
      );

      let boxQty = totalRawQty;
      let loosePcs = 0;
      if (totalRawQty % 1 !== 0 && pcsPerBox > 1) {
        boxQty = Math.floor(totalRawQty);
        const fraction = totalRawQty - boxQty;
        loosePcs = Math.round(fraction * pcsPerBox);
      }

      const lineTotal = Number(((boxQty * pBox) + (loosePcs * pPiece)).toFixed(2));
      const lineSqm = Number(
        ((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2)
      );

      tileItems.push({
        id: `tile-${idx}-${Date.now()}`,
        itemName: rawName || prod?.product_name || 'Tile Product',
        skuCode: prod?.item_sr_no || rawSku || (prod ? `SKU-${prod.id}` : ''),
        warehouse: gi.warehouse_name || gi.warehouseName || (locs && locs[0]?.name) || 'Main Warehouse',
        boxQty: boxQty,
        loosePcs: loosePcs,
        totalSqm: lineSqm,
        costPricePerBox: pBox,
        costPricePerPiece: pPiece,
        costPricePerSqm: pSqm,
        totalAmount: lineTotal,
        piecesPerBox: pcsPerBox,
        sqmPerBox: sqmPerBox,
      });
    } else {
      const qtyToBill = Number(gi.accepted_qty != null ? gi.accepted_qty : gi.qty || 1);
      standardItems.push({
        itemName: rawName || prod?.product_name || '',
        skuCode: prod?.item_sr_no || rawSku || '',
        qty: qtyToBill,
        rate: Number(prod?.purchase_price || 0),
        uom: gi.uom || prod?.uom || 'Nos',
        taxPercent: 0,
        warehouse: gi.warehouse_name || gi.warehouseName || (locs && locs[0]?.name) || 'Main Warehouse',
        remarks: '',
        discountPer: 0,
        discountAmt: 0,
        gstRate: 18,
        gstAmt: 0,
      });
    }
  });

  return { tileItems, standardItems };
};

export const handleTileProductSelectionHelper = (
  p: any,
  tIdx: number,
  currentTileItem: any,
  setFieldValue: any,
  locations: any[]
) => {
  let pcsPerBox = Number(p.pieces_per_box || p.pcs_per_box || p.pieces_per_packing || 0);
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
    const dimMatch = String(`${p.sub_category || ''} ${p.product_description || ''} ${p.item_sr_no || ''}`).match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
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

  const boxQty = currentTileItem?.boxQty !== undefined ? Number(currentTileItem.boxQty) : 1;
  const loosePcs = currentTileItem?.loosePcs !== undefined ? Number(currentTileItem.loosePcs) : 0;
  const lineTotal = Number(((boxQty * pBox) + (loosePcs * pPiece)).toFixed(2));
  const lineSqm = Number(((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2));

  setFieldValue(`tileItems.${tIdx}.itemName`, p.product_name);
  setFieldValue(`tileItems.${tIdx}.skuCode`, p.item_sr_no || `SKU-${p.id}`);
  setFieldValue(`tileItems.${tIdx}.piecesPerBox`, pcsPerBox);
  setFieldValue(`tileItems.${tIdx}.sqmPerBox`, sqmPerBox);
  setFieldValue(`tileItems.${tIdx}.costPricePerBox`, pBox);
  setFieldValue(`tileItems.${tIdx}.costPricePerPiece`, pPiece);
  setFieldValue(`tileItems.${tIdx}.costPricePerSqm`, pSqm);
  setFieldValue(`tileItems.${tIdx}.boxQty`, boxQty);
  setFieldValue(`tileItems.${tIdx}.loosePcs`, loosePcs);
  setFieldValue(`tileItems.${tIdx}.totalSqm`, lineSqm);
  setFieldValue(`tileItems.${tIdx}.totalAmount`, lineTotal);
  if (!currentTileItem?.warehouse && isEditMode) {
    setFieldValue(`tileItems.${tIdx}.warehouse`, locations[0]?.name || 'Main Warehouse');
  }
};

export const updateTileRowCalcsHelper = (
  field: 'boxQty' | 'loosePcs' | 'costPricePerBox' | 'costPricePerSqm' | 'costPricePerPiece',
  val: number,
  tIdx: number,
  currentTile: any,
  setFieldValue: any
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

export const purchaseValidationSchema = Yup.object().shape({
  supplierName: Yup.string().required('Wholesale Vendor selection is required'),
  purchaseDate: Yup.string().required('Inbound Date is required'),
  purchaseNo: Yup.string().required('Purchase Order Ref is required'),
  gatePasses: Yup.object().nullable().notRequired(),
  settlementMode: Yup.string().required('Payment Method is required'),
  selectedBankTitle: Yup.string().when('settlementMode', {
    is: (val: string) => val === 'Bank' || val === 'Split',
    then: () => Yup.string().required('Please select a Bank account profile'),
    otherwise: () => Yup.string().nullable()
  }),
  cashAmountPaid: Yup.number().when('settlementMode', {
    is: (val: string) => val === 'Cash' || val === 'Split',
    then: () => Yup.number().typeError('Must be numeric').min(0, 'Cannot be negative'),
    otherwise: () => Yup.number().nullable()
  }),
  bankAmountPaid: Yup.number().when('settlementMode', {
    is: (val: string) => val === 'Bank' || val === 'Split',
    then: () => Yup.number().typeError('Must be numeric').min(0, 'Cannot be negative'),
    otherwise: () => Yup.number().nullable()
  }),
  items: Yup.array().of(
    Yup.object().shape({
      itemName: Yup.string().nullable(),
      qty: Yup.number().typeError('Numeric lines only').nullable(),
      rate: Yup.number().typeError('Numeric lines only').nullable(),
      gstRate: Yup.number().min(0).nullable(),
      gstAmt: Yup.number().min(0).nullable(),
      discountPer: Yup.number().min(0).nullable(),
      discountAmt: Yup.number().min(0).nullable()
    })
  ).nullable()
});

export const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
  ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();
