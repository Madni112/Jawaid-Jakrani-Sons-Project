import { supabase } from '../../../../Context/supabaseClient';

export const resolveCustomerCoaAccount = async (customerName: string, customersList: any[] = []) => {
  const cleanName = (customerName || '').trim();
  if (!cleanName) return { code: '2020-001', title: 'Walk-in Customer' };

  const matched = customersList.find(c =>
    (c.customer_name || c.customerName || c.name || '').trim().toLowerCase() === cleanName.toLowerCase()
  );
  const existingCode = matched?.customer_code || matched?.customerCode || matched?.coa_code;
  if (existingCode && String(existingCode).startsWith('2020-')) {
    return { code: String(existingCode).trim(), title: matched.customer_name || matched.customerName || cleanName };
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

    const { data: allCustCoa } = await supabase
      .from('chart_of_accounts')
      .select('account_code')
      .ilike('account_code', '2020-%');

    let maxSeq = 0;
    (allCustCoa || []).forEach(r => {
      const match = String(r.account_code || '').match(/2020-(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });

    const nextCode = `2020-${String(maxSeq + 1).padStart(3, '0')}`;
    await supabase.from('chart_of_accounts').insert([{
      account_code: nextCode,
      account_title: cleanName,
      category_code: '1. ASSETS',
      sub_category_code: 'Current Assets',
      control_code: 'Customers',
      notes: `Customer account for ${cleanName} (Auto-registered from Sales Return)`
    }]);

    return { code: nextCode, title: cleanName };
  } catch (err) {
    console.warn('resolveCustomerCoaAccount in sales return error:', err);
    return { code: '2020-001', title: cleanName };
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
  if (p.isTileItem) return true;
  const parent = String(p.sub_sub_category || p.parent_category || p.parentCat || '').toLowerCase().trim();
  if (parent) return parent.includes('tile');
  const cat = String(p.category || '').toLowerCase().trim();
  return cat.includes('tile');
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
    setFieldValue(`tileItems.${tIdx}.pricePerBox`, 0);
    setFieldValue(`tileItems.${tIdx}.pricePerSqm`, 0);
    setFieldValue(`tileItems.${tIdx}.pricePerPiece`, 0);
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

  const pBox = Number(selectedProduct.sale_price ?? selectedProduct.retail_price ?? selectedProduct.sales_price ?? selectedProduct.price ?? 0);
  const configuredLoosePrice = Number(selectedProduct.loose_sale_price || 0);
  const pPiece = configuredLoosePrice > 0 ? configuredLoosePrice : (pcsPerBox > 0 ? Number((pBox / pcsPerBox).toFixed(2)) : 0);
  const pSqm = sqmPerBox > 0 ? Number((pBox / sqmPerBox).toFixed(2)) : 0;

  const bQty = Number(currentTileItem?.boxQty || 1);
  const lPcs = Number(currentTileItem?.loosePcs || 0);
  const totSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
  const totAmount = Number(((bQty * pBox) + (lPcs * pPiece)).toFixed(2));

  setFieldValue(`tileItems.${tIdx}.itemName`, selectedProduct.product_name);
  setFieldValue(`tileItems.${tIdx}.skuCode`, selectedProduct.item_sr_no || `SKU-${selectedProduct.id}`);
  setFieldValue(`tileItems.${tIdx}.warehouse`, currentTileItem?.warehouse || chosenWarehouse || locations[0]?.name || 'Main Warehouse');
  setFieldValue(`tileItems.${tIdx}.piecesPerBox`, pcsPerBox);
  setFieldValue(`tileItems.${tIdx}.sqmPerBox`, sqmPerBox);
  setFieldValue(`tileItems.${tIdx}.pricePerBox`, pBox);
  setFieldValue(`tileItems.${tIdx}.pricePerSqm`, pSqm);
  setFieldValue(`tileItems.${tIdx}.pricePerPiece`, pPiece);
  setFieldValue(`tileItems.${tIdx}.boxQty`, bQty);
  setFieldValue(`tileItems.${tIdx}.loosePcs`, lPcs);
  setFieldValue(`tileItems.${tIdx}.totalAmount`, totAmount);
  setFieldValue(`tileItems.${tIdx}.totalSqm`, totSqm);
  setFieldValue(`tileItems.${tIdx}.isTileItem`, true);
};

export const handleTileItemChangeHelper = (
  tIdx: number,
  field: 'boxQty' | 'loosePcs' | 'pricePerBox' | 'pricePerSqm' | 'pricePerPiece' | 'totalSqm',
  val: any,
  tileItems: any[],
  setFieldValue: any
) => {
  const item = { ...tileItems[tIdx] };
  const pcsPerBox = Math.max(1, Number(item.piecesPerBox) || 4);
  const sqmPerBox = Math.max(0.01, Number(item.sqmPerBox) || 1.44);

  let bQty = Number(item.boxQty || 0);
  let lPcs = Number(item.loosePcs || 0);
  let pBox = Number(item.pricePerBox || 0);
  let pSqm = Number(item.pricePerSqm || 0);
  let pPiece = Number(item.pricePerPiece || 0);
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
  } else if (field === 'pricePerBox') {
    pBox = Math.max(0, Number(val) || 0);
    pPiece = Number((pBox / pcsPerBox).toFixed(2));
    pSqm = Number((pBox / sqmPerBox).toFixed(2));
    lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
  } else if (field === 'pricePerSqm') {
    pSqm = Math.max(0, Number(val) || 0);
    pBox = Number((pSqm * sqmPerBox).toFixed(2));
    pPiece = Number((pBox / pcsPerBox).toFixed(2));
    lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
  } else if (field === 'pricePerPiece') {
    pPiece = Math.max(0, Number(val) || 0);
    lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
  }

  const lineTotal = Number(((bQty * pBox) + (lPcs * pPiece)).toFixed(2));

  setFieldValue(`tileItems.${tIdx}.boxQty`, bQty);
  setFieldValue(`tileItems.${tIdx}.loosePcs`, lPcs);
  setFieldValue(`tileItems.${tIdx}.pricePerBox`, pBox);
  setFieldValue(`tileItems.${tIdx}.pricePerSqm`, pSqm);
  setFieldValue(`tileItems.${tIdx}.pricePerPiece`, pPiece);
  setFieldValue(`tileItems.${tIdx}.totalAmount`, lineTotal);
  setFieldValue(`tileItems.${tIdx}.totalSqm`, lineSqm);
};

import * as Yup from 'yup';
import { getWarehouseDispatchStatus } from '../../../../utils/locationUtils';

export const createSalesReturnValidationSchema = (
  workflowSettings: any,
  editData: any,
  productList: any[]
) => {
  return Yup.object().shape({
    returnNo: Yup.string()
      .trim()
      .required('Return Memo # is required')
      .test('check-unique-return-no', 'This Return Memo # already exists!', async function (value) {
        if (!value) return true;
        const currentReturnId = editData?.id;
        try {
          let query = supabase
            .from('sales_returns')
            .select('id')
            .ilike('return_no', value.trim());
          if (currentReturnId) {
            query = query.neq('id', currentReturnId);
          }
          const { data, error } = await query.maybeSingle();
          if (error) return true;
          return !data;
        } catch {
          return true;
        }
      }),
    customerName: Yup.string().required('Customer selection is required'),
    sourceWarehouse: Yup.string().required('Receiving warehouse selection is required'),
    gatePassNo: Yup.string().nullable().notRequired(),
    gatePasses: Yup.lazy(() => {
      if (!workflowSettings?.require_manual_challan_sales_return) {
        return Yup.object().notRequired();
      }
      return Yup.object().test(
        'check-required-return-slips',
        'Physical return slip # is required for all checked locations',
        function (gatePassesObj: any) {
          const items = this.parent.items || [];
          const tileItems = this.parent.showTileSection ? (this.parent.tileItems || []) : [];
          const reqLocs = workflowSettings?.manual_challan_locations_sales_return || [];
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
                  message: `Return slip # is required for ${wh}`
                });
              }
            }
          }
          return true;
        }
      );
    }),
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
      then: () => Yup.string().required('Please select the disbursing bank account'),
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
