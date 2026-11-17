import * as Yup from 'yup';
import { supabase } from '../../../../Context/supabaseClient';
import { getWarehouseDispatchStatus } from '../../../../utils/locationUtils';

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
      notes: `Vendor account for ${cleanName} (Auto-registered from Purchase Return)`
    }]);

    return { code: nextCode, title: cleanName };
  } catch (err) {
    console.warn('resolveVendorCoaAccount error:', err);
    return { code: '2010-001', title: cleanName };
  }
};

export const parseGatePasses = (raw?: string, defaultWh?: string): Record<string, string> => {
  if (!raw) return {};
  const res: Record<string, string> = {};
  if (raw.includes(' | ') || raw.includes(': ')) {
    raw.split(' | ').forEach(part => {
      const [wh, gp] = part.split(': ');
      if (wh && gp) {
        const safePrefix = wh.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const val = gp.trim().replace(new RegExp(`^${safePrefix}-`, 'i'), '');
        res[wh.trim()] = val;
      }
    });
  } else if (defaultWh) {
    const safePrefix = defaultWh.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const val = raw.trim().replace(new RegExp(`^${safePrefix}-`, 'i'), '');
    res[defaultWh.trim()] = val;
  }
  return res;
};

export const isTileProduct = (p: any): boolean => {
  if (!p) return false;
  const subsub = String(p.sub_sub_category || '').toLowerCase().trim();
  if (subsub) return subsub.includes('tile');
  const cat = String(p.category || '').toLowerCase();
  const sub = String(p.sub_category || '').toLowerCase();
  const scn = String(p.scenario_name || '').toLowerCase();
  const name = String(p.product_name || '').toLowerCase();
  return cat.includes('tile') || sub.includes('tile') || scn.includes('tile') || name.includes('tile');
};

export const formatMoney = (val: number | string | undefined | null): string => {
  const num = Number(val) || 0;
  if (Number.isInteger(num)) {
    return num.toLocaleString('en-US');
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
  ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

export const parsePurchaseItemsForReturn = (
  p: any,
  defaultWarehouse: string,
  productList: any[],
  locations: any[]
) => {
  const standardList: any[] = [];
  const tileList: any[] = [];

  const explicitTileItems = Array.isArray(p.tile_items)
    ? p.tile_items
    : (Array.isArray(p.metadata?.tile_items) ? p.metadata.tile_items : []);

  explicitTileItems.forEach((t: any) => {
    const matched = productList.find(pr =>
      (pr.item_sr_no && pr.item_sr_no === (t.skuCode || t.sku || t.item_sr_no)) ||
      (pr.product_name && pr.product_name.toLowerCase() === (t.itemName || t.product_name || '').toLowerCase())
    );

    let pcsPerBox = Number(t.piecesPerBox || t.pieces_per_box || matched?.pieces_per_box || matched?.piecesPerBox || 0);
    if (pcsPerBox <= 0 && matched) {
      const match = String(matched.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
      if (match && Number(match[1]) > 0) pcsPerBox = Number(match[1]);
    }
    if (pcsPerBox <= 0) pcsPerBox = 4;

    let sqmPerBox = Number(t.sqmPerBox || t.sqm_per_box || matched?.sqm_per_box || matched?.sqmPerBox || 0);
    if (sqmPerBox <= 0 && matched) {
      const matchSqm = String(matched.product_description || '').match(/([\d\.]+)\s*sq\.m/i);
      if (matchSqm && Number(matchSqm[1]) > 0) {
        sqmPerBox = Number(matchSqm[1]);
      } else {
        const dimMatch = String(`${matched.sub_category || ''} ${matched.product_description || ''} ${matched.item_sr_no || ''}`).match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
        if (dimMatch) {
          const h = Number(dimMatch[1]) || 60;
          const w = Number(dimMatch[2]) || 60;
          sqmPerBox = Number((((h / 100) * (w / 100)) * pcsPerBox).toFixed(2));
        }
      }
    }
    if (sqmPerBox <= 0) sqmPerBox = 1.44;

    const bQty = Number(t.boxQty ?? t.boxes ?? (t.uom === 'BOX' ? Math.floor(Number(t.qty || 0)) : (t.qty || 1)));
    const lPcs = Number(t.loosePcs ?? t.loose_pcs ?? (t.uom === 'BOX' ? Math.round(((Number(t.qty || 0)) - Math.floor(Number(t.qty || 0))) * pcsPerBox) : 0));
    const pBox = Number(t.costPricePerBox ?? t.cost_price_per_box ?? t.rate ?? t.cost_price ?? t.purchase_price ?? 0);
    const pPiece = Number(t.costPricePerPiece ?? t.cost_price_per_piece ?? (pcsPerBox > 0 ? Number((pBox / pcsPerBox).toFixed(2)) : 0));
    const pSqm = Number(t.costPricePerSqm ?? t.cost_price_per_sqm ?? (sqmPerBox > 0 ? Number((pBox / sqmPerBox).toFixed(2)) : 0));
    const totSqm = Number(t.totalSqm ?? t.total_sqm ?? (((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2)));
    const totAmount = Number(t.totalAmount ?? t.total_amount ?? t.total ?? (((bQty * pBox) + (lPcs * pPiece)).toFixed(2)));

    tileList.push({
      skuCode: t.skuCode || t.sku || t.item_sr_no || t.item_code || '',
      itemName: t.itemName || t.product_name || '',
      warehouse: t.warehouse || defaultWarehouse || locations[0]?.name || 'Central Warehouse A',
      piecesPerBox: pcsPerBox,
      sqmPerBox: sqmPerBox,
      costPricePerBox: pBox,
      costPricePerPiece: pPiece,
      costPricePerSqm: pSqm,
      boxQty: bQty,
      loosePcs: lPcs,
      totalSqm: totSqm,
      totalAmount: totAmount,
      isTileItem: true
    });
  });

  const rawItems = Array.isArray(p.items) ? p.items : [];
  rawItems.forEach((it: any) => {
    const isTile = it.isTileItem || explicitTileItems.some((ti: any) =>
      (ti.itemName && ti.itemName === it.itemName) || (ti.skuCode && ti.skuCode === it.sku)
    );
    if (!isTile) {
      standardList.push({
        itemName: it.itemName || it.product_name || '',
        sku: it.sku || it.skuCode || it.item_sr_no || it.item_code || '',
        warehouse: it.warehouse || defaultWarehouse || locations[0]?.name || 'Central Warehouse A',
        qty: Number(it.qty || it.quantity || 1),
        rate: Number(it.rate || it.cost_price || it.purchase_price || 0),
        amount: Number(it.amount || it.total || (Number(it.qty || 1) * Number(it.rate || 0))),
        uom: it.uom || 'Nos',
        remarks: it.remarks || ''
      });
    }
  });

  return { standardList, tileList };
};

export const createPurchaseReturnValidationSchema = (
  workflowSettings: any,
  editData: any,
  productList: any[]
) => {
  return Yup.object().shape({
    returnNo: Yup.string().nullable().notRequired(),
    gatePasses: Yup.lazy(() => {
      if (!workflowSettings?.require_manual_challan_purchase_return) {
        return Yup.object().notRequired();
      }
      return Yup.object().test(
        'check-required-purchase-return-slips',
        'Physical outward return challan # is required for all checked locations',
        function (gatePassesObj: any) {
          const items = this.parent.items || [];
          const tileItems = this.parent.showTileSection ? (this.parent.tileItems || []) : [];
          const reqLocs = workflowSettings?.manual_challan_locations_purchase_return || [];
          const activeWarehouses = new Set<string>();
          items.forEach((it: any) => {
            if (!it.itemName || !it.itemName.trim() || Number(it.qty || 0) <= 0) return;
            const wh = (it.warehouse || this.parent.sourceWarehouse || '').trim();
            if (wh && reqLocs.includes(wh)) activeWarehouses.add(wh);
          });
          tileItems.forEach((t: any) => {
            if (!t.itemName || !t.itemName.trim() || (Number(t.boxQty || 0) <= 0 && Number(t.loosePcs || 0) <= 0)) return;
            const wh = (t.warehouse || this.parent.sourceWarehouse || '').trim();
            if (wh && reqLocs.includes(wh)) activeWarehouses.add(wh);
          });
          for (const wh of activeWarehouses) {
            const whStatus = getWarehouseDispatchStatus(wh, items, tileItems, editData, this.parent.sourceWarehouse, productList);
            if (!editData || whStatus.isNewOrIncreased) {
              if (!gatePassesObj?.[wh] || !String(gatePassesObj[wh]).trim()) {
                return this.createError({
                  path: 'gatePasses',
                  message: `Return challan # is required for ${wh}`
                });
              }
            }
          }
          return true;
        }
      );
    }),
    vendorName: Yup.string().required('Wholesale Vendor selection is required'),
    returnDate: Yup.string().required('Return date is required'),
    paymentTerm: Yup.string().required('Reimbursement method is required'),
    amountPaid: Yup.number().when('paymentTerm', {
      is: (val: string) => val === 'By Cash' || val === 'By Bank',
      then: () => Yup.number().typeError('Amount must be numeric').min(0, 'Cannot be negative'),
      otherwise: () => Yup.number().nullable()
    }),
    cashAmountPaid: Yup.number().when('paymentTerm', {
      is: 'Split',
      then: () => Yup.number().typeError('Cash must be numeric').min(0, 'Cannot be negative'),
      otherwise: () => Yup.number().nullable()
    }),
    bankAmountPaid: Yup.number().when('paymentTerm', {
      is: 'Split',
      then: () => Yup.number().typeError('Bank must be numeric').min(0, 'Cannot be negative'),
      otherwise: () => Yup.number().nullable()
    }),
    selectedBankId: Yup.string().when('paymentTerm', {
      is: (val: string) => val === 'By Bank' || val === 'Split',
      then: () => Yup.string().required('Please select the receiving bank account'),
      otherwise: () => Yup.string().nullable()
    }),
    items: Yup.array().of(
      Yup.object().shape({
        itemName: Yup.string(),
        qty: Yup.number().typeError('Numeric only'),
        rate: Yup.number().typeError('Numeric only')
      })
    )
  });
};

export const handleTileReturnProductSelectionHelper = (
  selectedProduct: any,
  tIdx: number,
  chosenWarehouse: string,
  setFieldValue: any,
  locations: any[],
  currentTileItem?: any
) => {
  if (!selectedProduct) {
    setFieldValue(`tileItems.${tIdx}.itemName`, '');
    setFieldValue(`tileItems.${tIdx}.skuCode`, '');
    setFieldValue(`tileItems.${tIdx}.costPricePerBox`, 0);
    setFieldValue(`tileItems.${tIdx}.costPricePerSqm`, 0);
    setFieldValue(`tileItems.${tIdx}.costPricePerPiece`, 0);
    setFieldValue(`tileItems.${tIdx}.totalAmount`, 0);
    setFieldValue(`tileItems.${tIdx}.totalSqm`, 0);
    return;
  }

  let pcsPerBox = Number(selectedProduct.pieces_per_box || selectedProduct.pcs_per_box || selectedProduct.pieces_per_packing || 0);
  if (pcsPerBox <= 1) {
    const match = String(selectedProduct.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
    if (match && Number(match[1]) > 0) pcsPerBox = Number(match[1]);
    else pcsPerBox = 4;
  }

  let sqmPerBox = 1.44;
  const matchSqm = String(selectedProduct.product_description || '').match(/([\d\.]+)\s*sq\.m/i);
  if (matchSqm && Number(matchSqm[1]) > 0) {
    sqmPerBox = Number(matchSqm[1]);
  } else {
    const dimMatch = String(`${selectedProduct.sub_category || ''} ${selectedProduct.product_description || ''} ${selectedProduct.item_sr_no || ''}`).match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
    if (dimMatch) {
      const h = Number(dimMatch[1]) || 60;
      const w = Number(dimMatch[2]) || 60;
      sqmPerBox = Number((((h / 100) * (w / 100)) * pcsPerBox).toFixed(2));
    }
  }

  const pBox = Number(selectedProduct.purchase_price ?? selectedProduct.cost_price ?? selectedProduct.rate ?? selectedProduct.retail_price ?? 0);
  const configuredLoosePrice = Number(selectedProduct.loose_purchase_price || 0);
  const pPiece = configuredLoosePrice > 0 ? configuredLoosePrice : (pcsPerBox > 0 ? Number((pBox / pcsPerBox).toFixed(2)) : 0);
  const pSqm = sqmPerBox > 0 ? Number((pBox / sqmPerBox).toFixed(2)) : 0;

  const bQty = Number(currentTileItem?.boxQty || 1);
  const lPcs = Number(currentTileItem?.loosePcs || 0);
  const totSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
  const totAmount = Number(((bQty * pBox) + (lPcs * pPiece)).toFixed(2));

  setFieldValue(`tileItems.${tIdx}.itemName`, selectedProduct.product_name);
  setFieldValue(`tileItems.${tIdx}.skuCode`, selectedProduct.item_sr_no || selectedProduct.sku || `SKU-${selectedProduct.id}`);
  setFieldValue(`tileItems.${tIdx}.warehouse`, currentTileItem?.warehouse || chosenWarehouse || locations[0]?.name || 'Main Warehouse');
  setFieldValue(`tileItems.${tIdx}.piecesPerBox`, pcsPerBox);
  setFieldValue(`tileItems.${tIdx}.sqmPerBox`, sqmPerBox);
  setFieldValue(`tileItems.${tIdx}.costPricePerBox`, pBox);
  setFieldValue(`tileItems.${tIdx}.costPricePerSqm`, pSqm);
  setFieldValue(`tileItems.${tIdx}.costPricePerPiece`, pPiece);
  setFieldValue(`tileItems.${tIdx}.boxQty`, bQty);
  setFieldValue(`tileItems.${tIdx}.loosePcs`, lPcs);
  setFieldValue(`tileItems.${tIdx}.totalAmount`, totAmount);
  setFieldValue(`tileItems.${tIdx}.totalSqm`, totSqm);
  setFieldValue(`tileItems.${tIdx}.isTileItem`, true);
};

export const handleTileItemChangeHelper = (
  tIdx: number,
  field: 'boxQty' | 'loosePcs' | 'costPricePerBox' | 'costPricePerSqm' | 'costPricePerPiece' | 'totalSqm',
  val: any,
  tileItems: any[],
  setFieldValue: any
) => {
  const item = { ...tileItems[tIdx] };
  const pcsPerBox = Math.max(1, Number(item.piecesPerBox) || 4);
  const sqmPerBox = Math.max(0.01, Number(item.sqmPerBox) || 1.44);

  let bQty = Number(item.boxQty || 0);
  let lPcs = Number(item.loosePcs || 0);
  let pBox = Number(item.costPricePerBox || 0);
  let pSqm = Number(item.costPricePerSqm || 0);
  let pPiece = Number(item.costPricePerPiece || 0);
  let lineSqm = Number(item.totalSqm || 0);

  if (field === 'boxQty') {
    bQty = Math.max(0, Number(val) || 0);
    lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
  } else if (field === 'loosePcs') {
    let rawLoose = Math.max(0, Number(val) || 0);
    if (pcsPerBox > 1 && rawLoose >= pcsPerBox) {
      const extraBoxes = Math.floor(rawLoose / pcsPerBox);
      const remLoose = rawLoose % pcsPerBox;
      bQty = bQty + extraBoxes;
      lPcs = remLoose;
    } else {
      lPcs = rawLoose;
    }
    lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
  } else if (field === 'totalSqm') {
    const enteredSqm = Math.max(0, Number(val) || 0);
    lineSqm = enteredSqm;
    if (sqmPerBox > 0) {
      const totalBoxesFloat = enteredSqm / sqmPerBox;
      bQty = Math.floor(totalBoxesFloat);
      const remFraction = totalBoxesFloat - bQty;
      lPcs = Math.round(remFraction * pcsPerBox);
      if (pcsPerBox > 1 && lPcs >= pcsPerBox) {
        bQty += Math.floor(lPcs / pcsPerBox);
        lPcs = lPcs % pcsPerBox;
      }
    }
  } else if (field === 'costPricePerBox') {
    pBox = Math.max(0, Number(val) || 0);
    pPiece = Number((pBox / pcsPerBox).toFixed(2));
    pSqm = Number((pBox / sqmPerBox).toFixed(2));
    lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
  } else if (field === 'costPricePerSqm') {
    pSqm = Math.max(0, Number(val) || 0);
    pBox = Number((pSqm * sqmPerBox).toFixed(2));
    pPiece = Number((pBox / pcsPerBox).toFixed(2));
    lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
  } else if (field === 'costPricePerPiece') {
    pPiece = Math.max(0, Number(val) || 0);
    lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
  }

  const lineTotal = Number(((bQty * pBox) + (lPcs * pPiece)).toFixed(2));

  setFieldValue(`tileItems.${tIdx}.boxQty`, bQty);
  setFieldValue(`tileItems.${tIdx}.loosePcs`, lPcs);
  setFieldValue(`tileItems.${tIdx}.costPricePerBox`, pBox);
  setFieldValue(`tileItems.${tIdx}.costPricePerSqm`, pSqm);
  setFieldValue(`tileItems.${tIdx}.costPricePerPiece`, pPiece);
  setFieldValue(`tileItems.${tIdx}.totalAmount`, lineTotal);
  setFieldValue(`tileItems.${tIdx}.totalSqm`, lineSqm);
};
