import { supabase } from '../../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import { fetchWorkflowSettings } from '../../../../service/workflowSettingsService';
import { fetchStockDataset, getAvailableStock, formatStockWithBoxesAndPcs } from '../../../../utils/stockCalculator';
import { isChallanNumberTaken } from '../../../../utils/challanValidation';
import { resolveVendorCoaAccount, formatMoney } from '../utils/purchaseReturnHelpers';

interface SubmitPurchaseReturnParams {
  values: any;
  isEditMode: boolean;
  editData: any;
  locations: any[];
  productList: any[];
  vendors: any[];
  bankAccountsList: any[];
  tenantId?: string | null;
  shouldPrintAfterSave: boolean;
  defaultReturnNo: string;
  selectedPoNo: string;
  navigate: (path: string) => void;
  setLoading: (loading: boolean) => void;
}

export const handleSubmitPurchaseReturn = async ({
  values,
  isEditMode,
  editData,
  locations,
  productList,
  vendors,
  bankAccountsList,
  tenantId,
  shouldPrintAfterSave,
  defaultReturnNo,
  selectedPoNo,
  navigate,
  setLoading
}: SubmitPurchaseReturnParams) => {
  const validStandardItems = (values.items || []).filter((i: any) => i.itemName && Number(i.qty || 0) > 0);
  const validTileItems = values.showTileSection
    ? (values.tileItems || []).filter((t: any) => t.itemName && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0))
    : [];

  if (validStandardItems.length === 0 && validTileItems.length === 0) {
    toast.error('Validation Error: Please add at least one item or tile to return.');
    return;
  }

  const activeWfSettings = await fetchWorkflowSettings();

  // Strict Unique Challan Governance for Purchase Return
  if (activeWfSettings?.allow_duplicate_challan_purchase_return === false && values.gatePasses) {
    for (const [wh, slip] of Object.entries(values.gatePasses)) {
      const cleanSlip = String(slip || '').trim();
      if (cleanSlip) {
        const { isTaken, existingRecord } = await isChallanNumberTaken('purchase_return', cleanSlip, editData?.id, values.returnNo);
        if (isTaken) {
          toast.error(`Purchase Return Challan # "${cleanSlip}" already exists in ${existingRecord?.return_no || 'Return Records'}! Duplicate numbers are strictly blocked in settings.`);
          return;
        }
      }
    }
  }

  // Stock availability check if allow_negative_stock is false
  if (activeWfSettings && activeWfSettings.allow_negative_stock === false) {
    const stockDataset = await fetchStockDataset();
    const requestedReturns: Record<string, { qty: number; name: string; code: string; wh: string }> = {};

    validStandardItems.forEach((it: any) => {
      const pName = (it.itemName || it.product_name || '').trim();
      if (!pName) return;
      const key = pName.toLowerCase();
      const q = Number(it.qty || 0);
      if (!requestedReturns[key]) {
        requestedReturns[key] = {
          qty: 0,
          name: pName,
          code: it.skuCode || it.itemCode || '',
          wh: (it.warehouse || values.sourceWarehouse || '').trim()
        };
      }
      requestedReturns[key].qty += q;
    });

    validTileItems.forEach((t: any) => {
      const pName = (t.itemName || t.product_name || '').trim();
      if (!pName) return;
      const key = pName.toLowerCase();
      const matchedProd = productList.find((p: any) => p.product_name === t.itemName || p.item_sr_no === t.skuCode);
      const rawPcs = Number(matchedProd?.pieces_per_box ?? matchedProd?.pcs_per_box ?? 4);
      const pcsPerBox = rawPcs > 0 ? rawPcs : 4;
      const totalBoxes = Number(t.boxQty || 0) + (Number(t.loosePcs || 0) / pcsPerBox);
      if (!requestedReturns[key]) {
        requestedReturns[key] = {
          qty: 0,
          name: pName,
          code: t.skuCode || t.itemCode || '',
          wh: (t.warehouse || values.sourceWarehouse || '').trim()
        };
      }
      requestedReturns[key].qty += totalBoxes;
    });

    if (editData) {
      const oldItems = Array.isArray(editData.items) ? editData.items : JSON.parse(editData.items || '[]');
      oldItems.forEach((oi: any) => {
        const pName = (oi.itemName || oi.product_name || '').trim().toLowerCase();
        if (requestedReturns[pName]) {
          const oldQty = Number(oi.qty || 0);
          requestedReturns[pName].qty -= oldQty;
        }
      });
    }

    for (const key of Object.keys(requestedReturns)) {
      const req = requestedReturns[key];
      if (req.qty > 0.0001) {
        const avail = await getAvailableStock(req.name, req.wh || 'Global / Unassigned', stockDataset, req.code);
        if (req.qty > avail + 0.0001) {
          const matchedProd = productList.find((p: any) =>
            (p.product_name && p.product_name.trim().toLowerCase() === req.name.toLowerCase()) ||
            (p.item_sr_no && p.item_sr_no === req.code)
          );
          const fmtAvail = formatStockWithBoxesAndPcs(avail, matchedProd).inlineText;
          const fmtReq = formatStockWithBoxesAndPcs(req.qty, matchedProd).inlineText;

          toast.error(
            `Cannot Save Purchase Return: "${req.name}" return quantity exceeds available stock (${fmtAvail} available, but ${fmtReq} returning). Negative stock is disabled in settings.`,
            { duration: 7000 }
          );
          return;
        }
      }
    }
  }

  let grossReturnSum = 0;
  validStandardItems.forEach((item: any) => {
    const matchedProd = productList.find((p: any) => p.product_name === item.itemName || p.item_sr_no === item.skuCode);
    const isTile = Boolean(matchedProd && (String(matchedProd.category || '').toLowerCase().includes('tile') || String(matchedProd.sub_category || '').toLowerCase().includes('tile')));
    const allowLoose = Boolean(matchedProd?.allow_loose_sales || isTile);
    const rawPcs = Number(matchedProd?.pieces_per_box ?? matchedProd?.pcs_per_box ?? matchedProd?.pieces_per_packing ?? 0);
    const pcsPerBox = Number(matchedProd?.loose_conversion_ratio) > 0 ? Number(matchedProd.loose_conversion_ratio) : (rawPcs > 0 ? rawPcs : (isTile ? 4 : 1));

    let gross = (Number(item.qty || 0) * Number(item.rate || 0));
    if (allowLoose && pcsPerBox > 1) {
      const bulkCount = Math.floor(Number(item.qty || 0));
      const looseCount = Math.round((Number(item.qty || 0) - bulkCount) * pcsPerBox);
      const pcCost = item.pieceRate !== undefined && item.pieceRate !== ''
        ? Number(item.pieceRate)
        : (Number(matchedProd?.loose_purchase_price) > 0 ? Number(matchedProd.loose_purchase_price) : (pcsPerBox > 0 ? Number(item.rate || 0) / pcsPerBox : 0));
      gross = (bulkCount * Number(item.rate || 0)) + (looseCount * pcCost);
    }
    grossReturnSum += (gross - Number(item.discountAmt || 0));
  });

  let tileGrossSum = 0;
  validTileItems.forEach((t: any) => {
    tileGrossSum += Number(t.totalAmount || 0);
  });
  grossReturnSum += tileGrossSum;

  if (grossReturnSum <= 0) {
    toast.error('Validation Error: Return items total value must be greater than 0 PKR!');
    return;
  }

  let cashRefund = 0;
  let bankRefund = 0;
  let totalRefundCollected = 0;

  if (values.paymentTerm === 'By Cash') {
    cashRefund = Number(values.amountPaid) || 0;
    totalRefundCollected = cashRefund;
  } else if (values.paymentTerm === 'By Bank') {
    bankRefund = Number(values.amountPaid) || 0;
    totalRefundCollected = bankRefund;
    if (!values.selectedBankId && bankRefund > 0) {
      toast.error('Please select the receiving bank account.');
      return;
    }
  } else if (values.paymentTerm === 'Split') {
    cashRefund = Number(values.cashAmountPaid) || 0;
    bankRefund = Number(values.bankAmountPaid) || 0;
    totalRefundCollected = cashRefund + bankRefund;
    if (!values.selectedBankId && bankRefund > 0) {
      toast.error('Please select the receiving bank account for the bank transfer refund.');
      return;
    }
  }

  if (totalRefundCollected > grossReturnSum) {
    toast.error(`Validation Error: Refund collected (Rs. ${formatMoney(totalRefundCollected)}) cannot exceed the total return value (Rs. ${formatMoney(grossReturnSum)}).`);
    return;
  }

  try {
    setLoading(true);

    if (values.returnNo) {
      let query = supabase.from('purchase_returns').select('id').eq('return_no', values.returnNo);
      if (isEditMode && editData?.id) {
        query = query.neq('id', editData.id);
      }
      const { data: existingRecords, error: checkError } = await query;
      if (checkError) {
        toast.error('Failed to validate Debit Note Return #.');
        setLoading(false);
        return;
      }
      if (existingRecords && existingRecords.length > 0) {
        toast.error('Debit Note Return # already exists!');
        setLoading(false);
        return;
      }
    }

    const convertedTileItems = validTileItems.map((t: any) => {
      const ppb = Math.max(1, Number(t.piecesPerBox) || 4);
      const bQty = Number(t.boxQty || 0);
      const lPcs = Number(t.loosePcs || 0);
      const totalBoxes = Number((bQty + (lPcs / ppb)).toFixed(3));
      return {
        sku: t.skuCode || '',
        itemName: t.itemName,
        warehouse: t.warehouse || values.sourceWarehouse,
        qty: totalBoxes,
        rate: Number(t.costPricePerBox || 0),
        uom: 'BOX',
        total: Number(t.totalAmount || 0),
        isTileItem: true,
        boxQty: bQty,
        loosePcs: lPcs,
        piecesPerBox: ppb,
        sqmPerBox: Number(t.sqmPerBox || 1.44),
        costPricePerBox: Number(t.costPricePerBox || 0),
        costPricePerPiece: Number(t.costPricePerPiece || 0),
        costPricePerSqm: Number(t.costPricePerSqm || 0),
        totalSqm: Number(t.totalSqm || 0)
      };
    });

    const mergedAllReturnItems = [
      ...validStandardItems.map((i: any) => ({
        sku: i.skuCode || '',
        itemName: i.itemName,
        warehouse: i.warehouse || values.sourceWarehouse,
        qty: Number(i.qty || 0),
        rate: Number(i.rate || 0),
        uom: i.uom || 'Nos',
        discountPer: Number(i.discountPer || 0),
        discountAmt: Number(i.discountAmt || 0),
        total: (Number(i.qty || 0) * Number(i.rate || 0)) - Number(i.discountAmt || 0)
      })),
      ...convertedTileItems
    ];

    const { data: vendorPurchasesRaw } = await supabase
      .from('supplier_purchases')
      .select('*')
      .ilike('vendor_name', values.vendorName);

    let vendorPurchases = [...(vendorPurchasesRaw || [])].sort((a, b) => {
      const timeA = new Date(a.purchase_date || a.created_at || 0).getTime();
      const timeB = new Date(b.purchase_date || b.created_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });

    if (values.purchaseNo) {
      vendorPurchases = vendorPurchases.filter((p: any) =>
        p.purchase_no === values.purchaseNo ||
        String(p.id) === String(values.purchaseNo).replace(/\D/g, '')
      );
    }

    const matchedInvoicesSummary: any[] = [];
    let primaryLinkedPo = values.purchaseNo || selectedPoNo || null;

    for (const item of mergedAllReturnItems) {
      const reqQty = Number(item.qty || 0);
      const enteredRate = Number(item.rate || 0);
      const pName = (item.itemName || '').trim().toLowerCase();

      let remainingToMatch = reqQty;
      if (!vendorPurchases || vendorPurchases.length === 0) continue;

      const exactRatePurchases = vendorPurchases.filter((pur: any) => {
        const pItems = Array.isArray(pur.items) ? pur.items : [];
        return pItems.some((pi: any) => {
          const matchName = (pi.itemName || pi.product_name || '').trim().toLowerCase() === pName;
          const matchRate = Math.abs(Number(pi.rate ?? pi.purchase_price ?? pi.cost_price ?? 0) - enteredRate) < 0.01;
          return matchName && matchRate;
        });
      });

      const candidateList = exactRatePurchases.length > 0
        ? exactRatePurchases
        : vendorPurchases.filter((pur: any) => {
          const pItems = Array.isArray(pur.items) ? pur.items : [];
          return pItems.some((pi: any) => (pi.itemName || pi.product_name || '').trim().toLowerCase() === pName);
        });

      for (const pur of candidateList) {
        if (remainingToMatch <= 0) break;
        const pItems = Array.isArray(pur.items) ? pur.items : [];
        const matchedLine = pItems.find((pi: any) => (pi.itemName || pi.product_name || '').trim().toLowerCase() === pName);
        if (!matchedLine) continue;

        const purQty = Number(matchedLine.qty || matchedLine.quantity || 1);
        const deductQty = Math.min(remainingToMatch, purQty);
        const invoiceRate = Number(matchedLine.rate ?? matchedLine.purchase_price ?? matchedLine.cost_price ?? enteredRate);

        matchedInvoicesSummary.push({
          item_name: item.itemName,
          sku: item.skuCode || '',
          purchase_no: pur.purchase_no || `PUR-${pur.id}`,
          purchase_date: pur.purchase_date || pur.created_at,
          invoice_rate: invoiceRate,
          entered_rate: enteredRate,
          deducted_qty: deductQty,
          deducted_value: deductQty * invoiceRate,
          is_exact_rate_match: Math.abs(invoiceRate - enteredRate) < 0.01
        });

        if (!primaryLinkedPo) {
          primaryLinkedPo = pur.purchase_no || `PUR-${pur.id}`;
        }

        remainingToMatch -= deductQty;
      }

      if (remainingToMatch > 0) {
        toast.error(`Validation Error: Cannot return ${reqQty} units of '${pName}'. You only have ${reqQty - remainingToMatch} units available in purchase history from this vendor.`);
        setLoading(false);
        return;
      }
    }

    const createdReturnSlipsMap: Record<string, string> = {};
    const uniqueWhs = Array.from(new Set(mergedAllReturnItems.map((i: any) => (i.warehouse || values.sourceWarehouse || 'WH').trim())));
    if (uniqueWhs.length === 0 && values.sourceWarehouse) uniqueWhs.push(values.sourceWarehouse.trim());

    const reqLocs = activeWfSettings?.manual_challan_locations_purchase_return || [];
    uniqueWhs.forEach(wh => {
      const safePrefix = wh.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const isManualWh = Boolean(activeWfSettings?.require_manual_challan_purchase_return && reqLocs.includes(wh));
      const manualSlip = values.gatePasses?.[wh]?.trim();
      const finalSlipNo = (isManualWh && manualSlip)
        ? (manualSlip.toUpperCase().startsWith(`${safePrefix}-`) ? manualSlip.toUpperCase() : `${safePrefix}-${manualSlip}`)
        : `${safePrefix}-PRTN-${Date.now().toString().slice(-6)}`;
      createdReturnSlipsMap[wh] = finalSlipNo;
    });

    const finalGatePassNo = uniqueWhs.length === 1
      ? createdReturnSlipsMap[uniqueWhs[0]]
      : Object.entries(createdReturnSlipsMap).map(([wh, slip]) => `${wh}: ${slip}`).join(' | ');

    const safeWhPrefix = (values.sourceWarehouse || locations[0]?.name || 'WH').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const finalReturnNo = (values.returnNo || defaultReturnNo || '').trim() || `${safeWhPrefix}-PRTN-${Date.now().toString().slice(-6)}`;

    const databasePayload = {
      return_no: finalReturnNo,
      vendor_name: values.vendorName,
      source_warehouse: values.sourceWarehouse,
      warehouse_name: values.sourceWarehouse,
      purchase_no: primaryLinkedPo,
      return_date: values.returnDate,
      payment_term: values.paymentTerm,
      remarks: values.remarks.trim(),
      total_amount: grossReturnSum,
      amount_paid: totalRefundCollected,
      amount_received: totalRefundCollected,
      status: totalRefundCollected >= grossReturnSum ? 'Refunded' : 'Pending',
      items: mergedAllReturnItems,
      metadata: {
        gate_pass_no: finalGatePassNo,
        selectedBankId: (values.paymentTerm === 'By Bank' || values.paymentTerm === 'Split') ? values.selectedBankId : null,
        linkedPurchaseNo: primaryLinkedPo,
        matchedInvoices: matchedInvoicesSummary,
        cashAmount: values.paymentTerm === 'Split' ? cashRefund : (values.paymentTerm === 'By Cash' ? totalRefundCollected : 0),
        bankAmount: values.paymentTerm === 'Split' ? bankRefund : (values.paymentTerm === 'By Bank' ? totalRefundCollected : 0),
        paymentTerm: values.paymentTerm,
        gatePasses: values.gatePasses,
        createdReturnSlipsMap: createdReturnSlipsMap,
        showTileSection: values.showTileSection,
        tile_items: validTileItems
      }
    };

    let savedRecordId = editData?.id;
    if (isEditMode) {
      // Roll back old return stock (+)
      const { data: oldRtn } = await supabase
        .from('purchase_returns')
        .select('items, source_warehouse')
        .eq('id', editData.id)
        .single();

      if (oldRtn?.items) {
        for (const oldItem of oldRtn.items) {
          const oQty = Number(oldItem.qty || oldItem.quantity || 0);
          const oName = oldItem.itemName || oldItem.product_name;

          const { data: prod } = await supabase.from('products').select('current_stock').ilike('product_name', oName).maybeSingle();
          if (prod) {
            await supabase.from('products').update({ current_stock: (Number(prod.current_stock) || 0) + oQty }).ilike('product_name', oName);
          }
        }
      }

      // Update record
      const { error: updateErr } = await supabase
        .from('purchase_returns')
        .update(databasePayload)
        .eq('id', editData.id);
      if (updateErr) throw updateErr;

      // Deduct new return stock (-)
      for (const newItem of mergedAllReturnItems) {
        const nQty = Number(newItem.qty || 0);
        const nName = newItem.itemName;

        const { data: prod } = await supabase.from('products').select('current_stock').ilike('product_name', nName).maybeSingle();
        if (prod) {
          await supabase.from('products').update({ current_stock: Math.max(0, (Number(prod.current_stock) || 0) - nQty) }).ilike('product_name', nName);
        }
      }
    } else {
      // Insert new return record
      const { data: insertedRecord, error: insertErr } = await supabase
        .from('purchase_returns')
        .insert([databasePayload])
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      savedRecordId = insertedRecord?.id;

      // Deduct stock (-)
      for (const item of mergedAllReturnItems) {
        const qty = Number(item.qty || 0);
        const pName = item.itemName;

        const { data: prod } = await supabase.from('products').select('current_stock').ilike('product_name', pName).maybeSingle();
        if (prod) {
          await supabase.from('products').update({ current_stock: Math.max(0, (Number(prod.current_stock) || 0) - qty) }).ilike('product_name', pName);
        }
      }
    }

    // Auto-post financial vouchers (PRV & VRV)
    try {
      const vendorAcc = await resolveVendorCoaAccount(values.vendorName, vendors);
      const returnIdent = values.returnNo || finalReturnNo;

      await supabase
        .from('financial_vouchers')
        .delete()
        .eq('original_invoice_no', returnIdent);

      // Auto-post PRV
      if (grossReturnSum > 0) {
        const prvNo = `PRV-${returnIdent.replace(/^PR-?|^RTN-?/i, '')}`;
        await supabase
          .from('financial_vouchers')
          .insert([{
            voucher_no: prvNo,
            voucher_type: 'Purchase Return Voucher',
            voucher_date: values.returnDate,
            customerName: values.vendorName,
            customer_name: values.vendorName,
            original_invoice_no: returnIdent,
            narration: `Purchase return goods credit for ${returnIdent} | Vendor: ${values.vendorName} | Warehouse: ${values.sourceWarehouse}${values.remarks ? ` | Remarks: ${values.remarks}` : ''}`,
            notes: `Auto-generated Purchase Return Voucher for ${returnIdent}`,
            total_amount: grossReturnSum,
            items: [
              {
                accountCode: vendorAcc.code,
                description: `Debit Vendor ${values.vendorName} (${vendorAcc.title}) on goods return`,
                debit: grossReturnSum,
                credit: 0
              },
              {
                accountCode: '5010-002',
                description: `Credit Purchase Return / Inventory adjustment for ${returnIdent}`,
                debit: 0,
                credit: grossReturnSum
              }
            ],
            metadata: {
              preset: 'PRV',
              auto_generated: true,
              moduleSource: 'purchase_return',
              returnNo: returnIdent,
              vendorName: values.vendorName,
              totalAmount: grossReturnSum
            }
          }]);
      }

      // Auto-post VRV if refund was collected
      if (totalRefundCollected > 0) {
        const vrvNo = `VRV-${returnIdent.replace(/^PR-?|^RTN-?/i, '')}`;
        const selectedBankObj = bankAccountsList.find(b => String(b.id) === String(values.selectedBankId) || String(b.bankName) === String(values.selectedBankId));
        const cashPortion = values.paymentTerm === 'Split' ? cashRefund : (values.paymentTerm === 'By Cash' ? totalRefundCollected : 0);
        const bankPortion = values.paymentTerm === 'Split' ? bankRefund : (values.paymentTerm === 'By Bank' ? totalRefundCollected : 0);

        const refundItems = [
          ...(cashPortion > 0 ? [{
            accountCode: '1010-001',
            description: `Cash received from vendor refund for ${returnIdent}`,
            debit: cashPortion,
            credit: 0
          }] : []),
          ...(bankPortion > 0 ? [{
            accountCode: '1020-001',
            description: `Bank deposit from vendor refund (${selectedBankObj?.bankName || 'Bank'}) for ${returnIdent}`,
            debit: bankPortion,
            credit: 0
          }] : []),
          {
            accountCode: vendorAcc.code,
            description: `Credit Vendor ${values.vendorName} (${vendorAcc.title}) on refund settlement`,
            debit: 0,
            credit: totalRefundCollected
          }
        ];

        await supabase
          .from('financial_vouchers')
          .insert([{
            voucher_no: vrvNo,
            voucher_type: 'Vendor Receive Voucher',
            voucher_date: values.returnDate,
            customerName: values.vendorName,
            customer_name: values.vendorName,
            original_invoice_no: returnIdent,
            narration: `Vendor refund received on return ${returnIdent} | Mode: ${values.paymentTerm} | Amount: Rs. ${totalRefundCollected}`,
            notes: `Auto-generated Vendor Receive Voucher for return ${returnIdent}`,
            total_amount: totalRefundCollected,
            items: refundItems,
            metadata: {
              preset: 'VRV',
              auto_generated: true,
              moduleSource: 'purchase_return',
              returnNo: returnIdent,
              cashAmount: cashPortion,
              bankAmount: bankPortion,
              paymentTerm: values.paymentTerm
            }
          }]);
      }
    } catch (vErr) {
      console.warn('Auto-post financial vouchers for purchase return error:', vErr);
    }

    toast.success(isEditMode ? 'Purchase Return updated successfully!' : 'Purchase Return (Debit Note) logged successfully!');
    if (shouldPrintAfterSave && savedRecordId) {
      navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Return/Print/${savedRecordId}`);
    } else {
      navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Return/List`);
    }
  } catch (err: any) {
    toast.error('Submission Error: ' + err.message);
  } finally {
    setLoading(false);
  }
};
