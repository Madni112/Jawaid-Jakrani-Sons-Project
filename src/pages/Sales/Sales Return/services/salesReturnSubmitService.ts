import { supabase } from '../../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import { fetchWorkflowSettings } from '../../../../service/workflowSettingsService';
import { isChallanNumberTaken } from '../../../../utils/challanValidation';
import { resolveCustomerCoaAccount, formatMoney } from '../utils/salesReturnHelpers';

interface SubmitSalesReturnParams {
  values: any;
  isEditMode: boolean;
  editData: any;
  locations: any[];
  productList: any[];
  customers: any[];
  bankAccountsList: any[];
  tenantId?: string | null;
  shouldPrintAfterSave: boolean;
  defaultReturnNo: string;
  selectedInvNo: string;
  navigate: (path: string) => void;
  setLoading: (loading: boolean) => void;
}

export const handleSubmitSalesReturn = async ({
  values,
  isEditMode,
  editData,
  locations,
  productList,
  customers,
  bankAccountsList,
  tenantId,
  shouldPrintAfterSave,
  defaultReturnNo,
  selectedInvNo,
  navigate,
  setLoading
}: SubmitSalesReturnParams) => {
  const validStandardItems = (values.items || []).filter((i: any) => i.itemName && i.itemName.trim() && Number(i.qty || 0) > 0);
  const validTileItems = values.showTileSection
    ? (values.tileItems || []).filter((t: any) => t.itemName && t.itemName.trim() && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0))
    : [];

  if (validStandardItems.length === 0 && validTileItems.length === 0) {
    toast.error('Validation Error: Please enter at least one standard return item or tile item before saving!');
    return;
  }

  const activeWfSettings = await fetchWorkflowSettings();

  // Strict Unique Challan Governance for Sales Return
  if (activeWfSettings?.allow_duplicate_challan_sales_return === false && values.gatePasses) {
    for (const [wh, slip] of Object.entries(values.gatePasses)) {
      const cleanSlip = String(slip || '').trim();
      if (cleanSlip) {
        const { isTaken, existingRecord } = await isChallanNumberTaken('sales_return', cleanSlip, editData?.id, values.returnNo);
        if (isTaken) {
          toast.error(`Sales Return Inward Slip # "${cleanSlip}" already exists in ${existingRecord?.return_no || 'Sales Return Records'}! Duplicate slip numbers are strictly blocked in settings.`);
          return;
        }
      }
    }
  }

  let grossReturnSum = 0;
  validStandardItems.forEach((item: any) => {
    const matchedProd = productList.find((p: any) => (p.product_name || '').toLowerCase() === (item.itemName || '').toLowerCase());
    const isTile = Boolean(matchedProd && (String(matchedProd.category || '').toLowerCase().includes('tile') || String(matchedProd.scenario_name || '').toLowerCase().includes('tile')));
    const allowLoose = Boolean(matchedProd?.allow_loose_sales || isTile);
    const rawPcs = Number(matchedProd?.pieces_per_box ?? matchedProd?.pcs_per_box ?? matchedProd?.pieces_per_packing ?? 0);
    const pcsPerBox = Number(matchedProd?.loose_conversion_ratio) > 0 ? Number(matchedProd.loose_conversion_ratio) : (rawPcs > 0 ? rawPcs : (isTile ? 4 : 1));

    let gross = (Number(item.qty || 0) * Number(item.rate || 0));
    if (allowLoose && pcsPerBox > 1) {
      const bulkCount = Math.floor(Number(item.qty || 0));
      const looseCount = Math.round((Number(item.qty || 0) - bulkCount) * pcsPerBox);
      const piecePrice = item.pieceRate !== undefined && item.pieceRate !== ''
        ? Number(item.pieceRate)
        : (Number(matchedProd?.loose_sale_price) > 0 ? Number(matchedProd.loose_sale_price) : (pcsPerBox > 0 ? Number(item.rate || 0) / pcsPerBox : 0));
      gross = (bulkCount * Number(item.rate || 0)) + (looseCount * piecePrice);
    }
    grossReturnSum += gross;
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
  let totalRefundDisbursed = 0;

  if (values.paymentTerm === 'By Cash') {
    cashRefund = Number(values.amountPaid) || 0;
    totalRefundDisbursed = cashRefund;
  } else if (values.paymentTerm === 'Exchange & Cash Refund') {
    cashRefund = Number(values.cashAmountPaid || values.amountPaid || editData?.cash_amount_paid || 0);
    bankRefund = Number(values.bankAmountPaid || editData?.bank_amount || 0);
    totalRefundDisbursed = cashRefund + bankRefund;
  } else if (values.paymentTerm === 'Exchange On Invoice' || values.paymentTerm === 'On Credit') {
    cashRefund = 0;
    bankRefund = 0;
    totalRefundDisbursed = 0;
  } else if (values.paymentTerm === 'By Bank') {
    bankRefund = Number(values.amountPaid) || 0;
    totalRefundDisbursed = bankRefund;
    if (!values.selectedBankId && bankRefund > 0) {
      toast.error('Please select the disbursing bank account.');
      return;
    }
  } else if (values.paymentTerm === 'Split') {
    cashRefund = Number(values.cashAmountPaid) || 0;
    bankRefund = Number(values.bankAmountPaid) || 0;
    totalRefundDisbursed = cashRefund + bankRefund;
    if (!values.selectedBankId && bankRefund > 0) {
      toast.error('Please select the disbursing bank account for the bank transfer portion.');
      return;
    }
  }

  if (totalRefundDisbursed > grossReturnSum) {
    toast.error(`Validation Error: Refund disbursed (Rs. ${formatMoney(totalRefundDisbursed)}) cannot exceed the total return value (Rs. ${formatMoney(grossReturnSum)}).`);
    return;
  }

  try {
    setLoading(true);

    const { data: customerInvoicesRaw } = await supabase
      .from('sales_invoices')
      .select('*')
      .ilike('customer_name', values.customerName);

    const customerInvoices = [...(customerInvoicesRaw || [])].sort((a, b) => {
      const timeA = new Date(a.invoice_date || a.created_at || 0).getTime();
      const timeB = new Date(b.invoice_date || b.created_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });

    const matchedInvoicesSummary: any[] = [];
    const isExplicitInvoice = Boolean((values.invoiceNo || selectedInvNo || '').trim());
    const explicitLinkedInv = isExplicitInvoice ? (values.invoiceNo || selectedInvNo || '').trim() : null;

    const allReturnLinesForMatching = [
      ...validStandardItems.map((i: any) => ({
        itemName: i.itemName,
        skuCode: i.skuCode,
        qty: Number(i.qty || 0),
        rate: Number(i.rate || 0)
      })),
      ...validTileItems.map((t: any) => {
        const ppb = Math.max(1, Number(t.piecesPerBox) || 4);
        const bQty = Number(t.boxQty || 0);
        const lPcs = Number(t.loosePcs || 0);
        return {
          itemName: t.itemName,
          skuCode: t.skuCode,
          qty: Number((bQty + (lPcs / ppb)).toFixed(3)),
          rate: Number(t.pricePerBox || 0)
        };
      })
    ];

    for (const item of allReturnLinesForMatching) {
      const reqQty = Number(item.qty || 0);
      const enteredRate = Number(item.rate || 0);
      const pName = (item.itemName || '').trim().toLowerCase();

      let remainingToMatch = reqQty;
      if (!customerInvoices || customerInvoices.length === 0) continue;

      const exactRateInvoices = customerInvoices.filter((inv: any) => {
        const pItems = Array.isArray(inv.items) ? inv.items : [];
        return pItems.some((pi: any) => {
          const matchName = (pi.itemName || pi.product_name || '').trim().toLowerCase() === pName;
          const matchRate = Math.abs(Number(pi.rate ?? pi.sale_price ?? pi.price ?? 0) - enteredRate) < 0.01;
          return matchName && matchRate;
        });
      });

      const candidateList = exactRateInvoices.length > 0
        ? exactRateInvoices
        : customerInvoices.filter((inv: any) => {
            const pItems = Array.isArray(inv.items) ? inv.items : [];
            return pItems.some((pi: any) => (pi.itemName || pi.product_name || '').trim().toLowerCase() === pName);
          });

      for (const inv of candidateList) {
        if (remainingToMatch <= 0) break;
        const pItems = Array.isArray(inv.items) ? inv.items : [];
        const matchedLine = pItems.find((pi: any) => (pi.itemName || pi.product_name || '').trim().toLowerCase() === pName);
        if (!matchedLine) continue;

        const soldQty = Number(matchedLine.qty || matchedLine.quantity || 1);
        const deductQty = Math.min(remainingToMatch, soldQty);
        const invoiceRate = Number(matchedLine.rate ?? matchedLine.sale_price ?? matchedLine.price ?? enteredRate);

        matchedInvoicesSummary.push({
          item_name: item.itemName,
          sku: item.skuCode || '',
          invoice_no: inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`,
          invoice_date: inv.invoice_date || inv.created_at,
          invoice_rate: invoiceRate,
          entered_rate: enteredRate,
          deducted_qty: deductQty,
          deducted_value: deductQty * invoiceRate,
          is_exact_rate_match: Math.abs(invoiceRate - enteredRate) < 0.01
        });

        remainingToMatch -= deductQty;
      }
    }

    const createdReturnSlipsMap: Record<string, string> = {};
    const uniqueWhs = Array.from(new Set([
      ...validStandardItems.map((i: any) => (i.warehouse || values.sourceWarehouse || 'WH').trim()),
      ...validTileItems.map((t: any) => (t.warehouse || values.sourceWarehouse || 'WH').trim())
    ]));
    if (uniqueWhs.length === 0 && values.sourceWarehouse) uniqueWhs.push(values.sourceWarehouse.trim());

    const reqLocs = activeWfSettings?.manual_challan_locations_sales_return || [];
    uniqueWhs.forEach(wh => {
      const safePrefix = wh.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const isManualWh = Boolean(activeWfSettings?.require_manual_challan_sales_return && reqLocs.includes(wh));
      const manualSlip = values.gatePasses?.[wh]?.trim();
      const finalSlipNo = (isManualWh && manualSlip)
        ? (manualSlip.toUpperCase().startsWith(`${safePrefix}-`) ? manualSlip.toUpperCase() : `${safePrefix}-${manualSlip}`)
        : `${safePrefix}-RTN-${String(values.returnNo || defaultReturnNo || Date.now()).replace(/[^A-Za-z0-9]/g, '')}`;
      createdReturnSlipsMap[wh] = finalSlipNo;
    });

    const finalGatePassNo = uniqueWhs.length === 1
      ? createdReturnSlipsMap[uniqueWhs[0]]
      : Object.entries(createdReturnSlipsMap).map(([wh, slip]) => `${wh}: ${slip}`).join(' | ');

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
        rate: Number(t.pricePerBox || 0),
        uom: 'BOX',
        total: Number(t.totalAmount || 0),
        isTileItem: true,
        boxQty: bQty,
        loosePcs: lPcs,
        piecesPerBox: ppb,
        sqmPerBox: Number(t.sqmPerBox || 1.44),
        pricePerBox: Number(t.pricePerBox || 0),
        pricePerPiece: Number(t.pricePerPiece || 0),
        pricePerSqm: Number(t.pricePerSqm || 0),
        totalSqm: Number(t.totalSqm || 0)
      };
    });

    const mergedAllReturnItems = [
      ...validStandardItems.map((i: any) => ({
        sku: i.skuCode,
        itemName: i.itemName,
        warehouse: i.warehouse || values.sourceWarehouse,
        qty: Number(i.qty),
        rate: Number(i.rate),
        uom: i.uom || 'Nos',
        total: Number(i.qty) * Number(i.rate)
      })),
      ...convertedTileItems
    ];

    const returnPayload = {
      return_no: (values.returnNo || defaultReturnNo || '').trim(),
      customer_name: values.customerName,
      return_date: values.returnDate,
      gate_pass_no: finalGatePassNo,
      warehouse_name: values.sourceWarehouse,
      source_warehouse: values.sourceWarehouse,
      invoice_no: explicitLinkedInv,
      settlement_mode: values.paymentTerm === 'By Cash' ? 'Cash' : (values.paymentTerm === 'By Bank' ? 'Bank' : (values.paymentTerm === 'Split' ? 'Split' : (values.paymentTerm === 'Exchange & Cash Refund' ? 'Exchange & Cash Refund' : (values.paymentTerm === 'Exchange On Invoice' ? 'Exchange On Invoice' : 'On Credit')))),
      payment_term: values.paymentTerm,
      bank_name: values.selectedBankId || null,
      total_amount: grossReturnSum,
      payout_amount_paid: totalRefundDisbursed,
      cash_amount_paid: cashRefund > 0 ? cashRefund : null,
      bank_amount: bankRefund > 0 ? String(bankRefund) : null,
      status: totalRefundDisbursed >= grossReturnSum - 1 ? 'Refunded' : (values.paymentTerm === 'Exchange & Cash Refund' ? 'Refunded' : (values.paymentTerm === 'On Credit' ? 'Credit Applied' : 'Partial Refund')),
      inward_status: isEditMode ? (editData?.inward_status || 'Pending Inward') : 'Pending Inward',
      remarks: values.remarks || null,
      items: mergedAllReturnItems,
      metadata: {
        cashPayoutPaid: cashRefund,
        bankPayoutPaid: bankRefund,
        selectedBankId: (values.paymentTerm === 'By Bank' || values.paymentTerm === 'Split') ? values.selectedBankId : null,
        settlementMode: values.paymentTerm,
        paymentTerm: values.paymentTerm,
        linkedInvoiceNo: explicitLinkedInv,
        isGeneralReturn: !isExplicitInvoice,
        matchedInvoices: matchedInvoicesSummary,
        gatePasses: values.gatePasses,
        createdReturnSlipsMap: createdReturnSlipsMap,
        showTileSection: values.showTileSection,
        tile_items: validTileItems
      }
    };

    let savedReturnId = editData?.id;

    if (isEditMode) {
      const { error: updateErr } = await supabase
        .from('sales_returns')
        .update(returnPayload)
        .eq('id', editData.id);
      if (updateErr) throw updateErr;
    } else {
      const { data: insertedRtn, error: insertErr } = await supabase
        .from('sales_returns')
        .insert([returnPayload])
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      savedReturnId = insertedRtn?.id;
    }

    // Auto-sync financial vouchers (SRV & CPV)
    try {
      const resolvedCustomer = await resolveCustomerCoaAccount(values.customerName, customers);
      const returnIdentifier = values.returnNo || (savedReturnId ? `RTN-${String(savedReturnId).padStart(4, '0')}` : 'RTN-RETURN');
      const vDate = values.returnDate || new Date().toISOString().split('T')[0];

      // 1. SRV (Sale Return Voucher)
      const { data: existingSrv } = await supabase
        .from('financial_vouchers')
        .select('id, voucher_no, metadata')
        .or(`original_invoice_no.eq.${returnIdentifier},metadata->>linkedReturnNo.eq.${returnIdentifier}`)
        .ilike('voucher_no', 'SRV-%')
        .maybeSingle();

      const srvNarration = `Sales return credit from ${resolvedCustomer.title} (Return #${returnIdentifier}, ${values.items.length} items)`;
      const srvItems = [
        {
          accountCode: resolvedCustomer.code,
          accountTitle: resolvedCustomer.title,
          particulars: `Goods returned on Return #${returnIdentifier}`,
          debit: 0,
          credit: grossReturnSum
        }
      ];

      if (existingSrv) {
        await supabase
          .from('financial_vouchers')
          .update({
            total_amount: grossReturnSum,
            debit: 0,
            credit: grossReturnSum,
            account_code: resolvedCustomer.code,
            account_title: resolvedCustomer.title,
            voucher_date: vDate,
            narration: srvNarration,
            original_invoice_no: returnIdentifier,
            items: srvItems,
            metadata: {
              ...(existingSrv.metadata || {}),
              preset: 'SRV',
              auto_generated: true,
              linkedReturnNo: returnIdentifier,
              moduleSource: 'sales_return'
            }
          })
          .eq('id', existingSrv.id);
      } else {
        const { data: srvRows } = await supabase
          .from('financial_vouchers')
          .select('voucher_no')
          .ilike('voucher_no', 'SRV-%');

        let maxSrvSeq = 0;
        (srvRows || []).forEach(v => {
          const match = String(v.voucher_no || '').match(/SRV-(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (num > maxSrvSeq) maxSrvSeq = num;
          }
        });
        const nextSrvNo = `SRV-${String(maxSrvSeq + 1).padStart(3, '0')}`;

        await supabase.from('financial_vouchers').insert([{
          voucher_no: nextSrvNo,
          voucher_type: 'Sale Amount Return',
          voucher_date: vDate,
          total_amount: grossReturnSum,
          debit: 0,
          credit: grossReturnSum,
          account_code: resolvedCustomer.code,
          account_title: resolvedCustomer.title,
          narration: srvNarration,
          original_invoice_no: returnIdentifier,
          items: srvItems,
          metadata: {
            preset: 'SRV',
            auto_generated: true,
            linkedReturnNo: returnIdentifier,
            moduleSource: 'sales_return'
          }
        }]);
      }

      // 2. CPV (Customer Payment / Refund Voucher) if immediate Cash/Bank refund disbursed
      const { data: existingCpv } = await supabase
        .from('financial_vouchers')
        .select('id, voucher_no, metadata')
        .or(`original_invoice_no.eq.${returnIdentifier},metadata->>linkedReturnNo.eq.${returnIdentifier}`)
        .ilike('voucher_no', 'CPV-%')
        .maybeSingle();

      if (totalRefundDisbursed > 0) {
        const selectedBankObj = bankAccountsList.find((b: any) => String(b.id) === String(values.selectedBankId) || String(b.bankName) === String(values.selectedBankId));
        let bankCoaCode = '1020-001';
        let bankCoaTitle = selectedBankObj ? `${selectedBankObj.bankName} - ${selectedBankObj.accountTitle}` : 'Bank Account';

        if (selectedBankObj) {
          try {
            const { data: bankCoaRows } = await supabase
              .from('chart_of_accounts')
              .select('account_code, account_title')
              .ilike('account_title', `%${selectedBankObj.bankName || ''}%`)
              .limit(1);
            if (bankCoaRows && bankCoaRows[0]) {
              bankCoaCode = bankCoaRows[0].account_code;
              bankCoaTitle = bankCoaRows[0].account_title;
            }
          } catch (bErr) {
            console.warn('Bank COA lookup warning:', bErr);
          }
        }

        const cpvItems: any[] = [
          {
            accountCode: resolvedCustomer.code,
            accountTitle: resolvedCustomer.title,
            particulars: `Refund payout against Return #${returnIdentifier}`,
            debit: totalRefundDisbursed,
            credit: 0
          }
        ];
        if (cashRefund > 0) {
          cpvItems.push({
            accountCode: '1010-001',
            accountTitle: 'Cash in Hand',
            particulars: `Cash refund payout from drawer`,
            debit: 0,
            credit: cashRefund
          });
        }
        if (bankRefund > 0) {
          cpvItems.push({
            accountCode: bankCoaCode,
            accountTitle: bankCoaTitle,
            particulars: `Bank refund wire transfer`,
            debit: 0,
            credit: bankRefund
          });
        }

        const cpvNarration = `Sales return cash/bank refund disbursed to ${resolvedCustomer.title} (Return #${returnIdentifier})`;

        if (existingCpv) {
          await supabase
            .from('financial_vouchers')
            .update({
              total_amount: totalRefundDisbursed,
              debit: totalRefundDisbursed,
              credit: 0,
              account_code: resolvedCustomer.code,
              account_title: resolvedCustomer.title,
              voucher_date: vDate,
              narration: cpvNarration,
              original_invoice_no: returnIdentifier,
              items: cpvItems,
              metadata: {
                ...(existingCpv.metadata || {}),
                preset: 'CPV',
                auto_generated: true,
                linkedReturnNo: returnIdentifier,
                moduleSource: 'sales_return'
              }
            })
            .eq('id', existingCpv.id);
        } else {
          const { data: cpvRows } = await supabase
            .from('financial_vouchers')
            .select('voucher_no')
            .ilike('voucher_no', 'CPV-%');

          let maxCpvSeq = 0;
          (cpvRows || []).forEach(v => {
            const match = String(v.voucher_no || '').match(/CPV-(\d+)/i);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (num > maxCpvSeq) maxCpvSeq = num;
            }
          });
          const nextCpvNo = `CPV-${String(maxCpvSeq + 1).padStart(3, '0')}`;

          await supabase.from('financial_vouchers').insert([{
            voucher_no: nextCpvNo,
            voucher_type: 'Customer Payment Voucher',
            voucher_date: vDate,
            total_amount: totalRefundDisbursed,
            debit: totalRefundDisbursed,
            credit: 0,
            account_code: resolvedCustomer.code,
            account_title: resolvedCustomer.title,
            narration: cpvNarration,
            original_invoice_no: returnIdentifier,
            items: cpvItems,
            metadata: {
              preset: 'CPV',
              auto_generated: true,
              linkedReturnNo: returnIdentifier,
              moduleSource: 'sales_return'
            }
          }]);
        }
      } else if (existingCpv) {
        await supabase.from('financial_vouchers').delete().eq('id', existingCpv.id);
      }
    } catch (vErr) {
      console.warn('Auto-sync financial vouchers for sales return error:', vErr);
    }

    toast.success(isEditMode ? 'Sales Return updated successfully!' : 'Sales Return Note recorded successfully!');
    if (shouldPrintAfterSave && savedReturnId) {
      navigate(`${tenantId ? `/${tenantId}` : ''}/Sales-Return/Debit-Notes/Print/${savedReturnId}`);
    } else {
      navigate(`${tenantId ? `/${tenantId}` : ''}/Sales-Return/Debit-Notes/List`);
    }

  } catch (err: any) {
    toast.error('Submission Error: ' + err.message);
  } finally {
    setLoading(false);
  }
};
