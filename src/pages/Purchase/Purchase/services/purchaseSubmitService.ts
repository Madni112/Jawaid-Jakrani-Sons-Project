import { supabase } from '../../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import { fetchWorkflowSettings } from '../../../../service/workflowSettingsService';
import { getWarehouseDispatchStatus } from '../../../../utils/locationUtils';
import { isChallanNumberTaken } from '../../../../utils/challanValidation';
import { resolveVendorCoaAccount, calculatePurchaseLineTotals } from '../utils/purchaseHelpers';
import { PurchaseFormValues } from '../types/purchaseTypes';

interface SubmitPurchaseParams {
  values: PurchaseFormValues;
  isEditMode: boolean;
  editData: any;
  locations: any[];
  productList: any[];
  suppliers: any[];
  tenantId?: string | null;
  submitAction: 'save' | 'print';
  navigate: (path: string) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
}

export const handleSubmitPurchase = async ({
  values,
  isEditMode,
  editData,
  locations,
  productList,
  suppliers,
  tenantId,
  submitAction,
  navigate,
  setLoading,
  setSubmitting
}: SubmitPurchaseParams) => {
  try {
    setLoading(true);

    if (values.purchaseNo) {
      let query = supabase.from('supplier_purchases').select('id').eq('purchase_no', values.purchaseNo);
      if (isEditMode && editData?.id) {
        query = query.neq('id', editData.id);
      }
      const { data: existingRecords, error: checkError } = await query;
      if (checkError) throw checkError;
      if (existingRecords && existingRecords.length > 0) {
        toast.error('Purchase Order Ref already exists!');
        setLoading(false);
        setSubmitting(false);
        return;
      }
    }

    const validStandardItems = (values.items || []).filter((i: any) => i.itemName && Number(i.qty || 0) > 0);
    const validTileItems = values.showTileSection
      ? (values.tileItems || []).filter((t: any) => t.itemName && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0))
      : [];

    if (validStandardItems.length === 0 && validTileItems.length === 0) {
      toast.error('Please enter at least one standard item or tile item before saving.');
      setLoading(false);
      setSubmitting(false);
      return;
    }

    const standardItemsTotal = validStandardItems.reduce((acc: any, item: any) => {
      return acc + calculatePurchaseLineTotals(item, values.applyTax, productList).netTotal;
    }, 0);
    const tileTotalSum = validTileItems.reduce((acc: number, t: any) => acc + Number(t.totalAmount || 0), 0);
    const totalBillAmount = standardItemsTotal + tileTotalSum + Number(values.additionalCharges || 0);

    const totalPaid = (values.settlementMode === 'Cash' ? Number(values.cashAmountPaid || 0) : 0) +
      (values.settlementMode === 'Bank' ? Number(values.bankAmountPaid || 0) : 0) +
      (values.settlementMode === 'Split' ? (Number(values.cashAmountPaid || 0) + Number(values.bankAmountPaid || 0)) : 0);

    // Block overpayment
    if (totalPaid > totalBillAmount + 0.01) {
      toast.error(`Overpayment detected! Total paid (Rs. ${totalPaid.toLocaleString()}) exceeds bill total (Rs. ${totalBillAmount.toLocaleString()}). Please correct the payment amount.`);
      setLoading(false);
      setSubmitting(false);
      return;
    }

    const remainingBalance = Math.max(0, totalBillAmount - totalPaid);

    let paymentTermLabel = 'By Cash';
    if (values.settlementMode === 'Bank') paymentTermLabel = 'By Bank';
    else if (values.settlementMode === 'Split') paymentTermLabel = 'Cash & Bank Combined';

    let grnIdToUse = values.grnId || null;

    // On edit: validate new qty >= already accepted qty in GRN
    if (isEditMode) {
      const linkedGrnId = values.grnId || editData?.metadata?.grn_id || editData?.grn_id || null;
      if (linkedGrnId) {
        const { data: existingGrnItems } = await supabase
          .from('grn_items')
          .select('product_name, warehouse_name, accepted_qty')
          .eq('grn_id', linkedGrnId);

        if (existingGrnItems && existingGrnItems.length > 0) {
          const acceptedByProduct: Record<string, number> = {};
          existingGrnItems.forEach((g: any) => {
            const pKey = String(g.product_name || '').trim().toLowerCase();
            const acc = Number(g.accepted_qty || 0);
            if (acc > 0) {
              acceptedByProduct[pKey] = (acceptedByProduct[pKey] || 0) + acc;
            }
          });

          for (const [pKey, acceptedTotal] of Object.entries(acceptedByProduct)) {
            if (acceptedTotal <= 0) continue;
            let newTotalForProduct = values.items
              .filter((i: any) => String(i.itemName || '').trim().toLowerCase() === pKey)
              .reduce((sum: number, i: any) => sum + Number(i.qty || 0), 0);

            if (values.showTileSection && Array.isArray(values.tileItems)) {
              const tileTotal = values.tileItems
                .filter((t: any) => String(t.itemName || '').trim().toLowerCase() === pKey)
                .reduce((sum: number, t: any) => {
                  const ppb = Math.max(1, Number(t.piecesPerBox) || 4);
                  const bQty = Number(t.boxQty || 0);
                  const lPcs = Number(t.loosePcs || 0);
                  return sum + (bQty + (lPcs / ppb));
                }, 0);
              newTotalForProduct += tileTotal;
            }

            if (newTotalForProduct < (acceptedTotal - 0.0001)) {
              const originalProdName = existingGrnItems.find((g: any) => String(g.product_name || '').trim().toLowerCase() === pKey)?.product_name || pKey;
              toast.error(
                `Cannot reduce below approved qty!\n\nProduct: "${originalProdName}"\nAlready Approved in GRN: ${acceptedTotal}\nYour New Total Qty: ${newTotalForProduct}\n\nMinimum allowed total qty is ${acceptedTotal}.`,
                { duration: 6000 }
              );
              setLoading(false);
              setSubmitting(false);
              return;
            }
          }
        }
      }
    }

    const workflowSettings = await fetchWorkflowSettings();

    const standardGrnItems = validStandardItems.map((item: any) => {
      const wh = item.warehouse || values.targetWarehouse || locations[0]?.name || 'Main Warehouse';
      const isWhRequireInward = Boolean(
        workflowSettings?.require_inward_challan &&
        (workflowSettings?.inward_challan_locations || []).includes(wh)
      );
      return {
        grn_id: grnIdToUse,
        product_name: item.itemName,
        warehouse_name: wh,
        qty: Number(item.qty),
        uom: item.uom || 'NOS',
        accepted_qty: isWhRequireInward ? 0 : Number(item.qty),
        rejected_qty: 0,
        hold_qty: isWhRequireInward ? Number(item.qty) : 0
      };
    });

    const tileGrnItems = validTileItems.map((t: any) => {
      const wh = t.warehouse || values.targetWarehouse || locations[0]?.name || 'Main Warehouse';
      const isWhRequireInward = Boolean(
        workflowSettings?.require_inward_challan &&
        (workflowSettings?.inward_challan_locations || []).includes(wh)
      );
      const ppb = Math.max(1, Number(t.piecesPerBox) || 4);
      const bQty = Number(t.boxQty || 0);
      const lPcs = Number(t.loosePcs || 0);
      const totalBoxes = Number((bQty + (lPcs / ppb)).toFixed(3));
      return {
        grn_id: grnIdToUse,
        product_name: t.itemName,
        warehouse_name: wh,
        qty: totalBoxes,
        uom: 'BOX',
        accepted_qty: isWhRequireInward ? 0 : totalBoxes,
        rejected_qty: 0,
        hold_qty: isWhRequireInward ? totalBoxes : 0
      };
    });

    const itemsToInsert = [...standardGrnItems, ...tileGrnItems];

    // Validate gate pass / inward slip for required receiving warehouses
    const isManualPurchaseSettingOn = Boolean(workflowSettings?.require_manual_gatepass_purchase);
    const reqManualPurchaseLocs = workflowSettings?.manual_gatepass_locations_purchase || [];
    const isStrictChallanPurchase = workflowSettings?.allow_duplicate_challan_purchase === false;

    if ((isManualPurchaseSettingOn && reqManualPurchaseLocs.length > 0) || isStrictChallanPurchase) {
      const uniqueWhs = new Set<string>();
      itemsToInsert.forEach((it: any) => {
        const w = (it.warehouse_name || values.targetWarehouse || locations[0]?.name || 'Main Warehouse').trim();
        if (w) uniqueWhs.add(w);
      });
      for (const wh of uniqueWhs) {
        if (isManualPurchaseSettingOn && reqManualPurchaseLocs.includes(wh)) {
          const whStatus = getWarehouseDispatchStatus(wh, values.items, values.tileItems, editData, values.targetWarehouse, productList);
          if (!isEditMode || whStatus.isNewOrIncreased) {
            const enteredSlip = values.gatePasses?.[wh]?.trim();
            if (!enteredSlip) {
              toast.error(`Please enter Inward Receiving Slip / Gate Pass # for ${wh}!`);
              setLoading(false);
              setSubmitting(false);
              return;
            }
          }
        }

        if (isStrictChallanPurchase) {
          const enteredSlip = values.gatePasses?.[wh]?.trim();
          if (enteredSlip) {
            const safePrefix = wh.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const checkNo = enteredSlip.toUpperCase().startsWith(`${safePrefix}-`) ? enteredSlip.toUpperCase() : `${safePrefix}-${enteredSlip}`;
            const { isTaken, existingRecord } = await isChallanNumberTaken('purchase', checkNo, editData?.id || values.grnId, values.purchaseNo);
            if (isTaken) {
              toast.error(`Inward Slip # "${enteredSlip}" already exists in ${existingRecord?.grn_no || 'Purchase Records'}! Duplicate slip numbers are strictly blocked in settings.`);
              setLoading(false);
              setSubmitting(false);
              return;
            }
          }
        }
      }
    }

    const createdGrnIds: any[] = [];
    if (!isEditMode && !grnIdToUse) {
      const itemsByWarehouse: Record<string, any[]> = {};
      itemsToInsert.forEach((it: any) => {
        const wh = (it.warehouse_name || values.targetWarehouse || locations[0]?.name || 'Main Warehouse').trim();
        if (!itemsByWarehouse[wh]) itemsByWarehouse[wh] = [];
        itemsByWarehouse[wh].push(it);
      });

      for (const [whName, whItems] of Object.entries(itemsByWarehouse)) {
        const safePrefix = whName.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const isWhRequireInward = Boolean(
          workflowSettings?.require_inward_challan &&
          (workflowSettings?.inward_challan_locations || []).includes(whName)
        );
        const grnStatus = isWhRequireInward ? 'Pending Inward' : 'Confirm';

        const isManualWh = Boolean(
          workflowSettings?.require_manual_gatepass_purchase &&
          (workflowSettings?.manual_gatepass_locations_purchase || []).includes(whName)
        );
        const manualSlip = values.gatePasses?.[whName]?.trim();
        const finalGrnNo = (isManualWh && manualSlip)
          ? (manualSlip.toUpperCase().startsWith(`${safePrefix}-`) ? manualSlip.toUpperCase() : `${safePrefix}-${manualSlip}`)
          : `${safePrefix}-GRN-${values.purchaseNo || Date.now()}`;

        const grnRemarks = isWhRequireInward
          ? `[MANUAL] Pending Warehouse Inward Verification for ${values.purchaseNo || ''} (${whName})`
          : `[AUTOMATIC] Direct Inward / Auto-Confirmed Purchase for ${values.purchaseNo || ''} (${whName})`;

        const { data: grnData, error: grnError } = await supabase
          .from('grn_receipts')
          .insert([{
            grn_no: finalGrnNo,
            vendor_name: values.supplierName,
            receipt_date: values.purchaseDate,
            status: grnStatus,
            remarks: grnRemarks
          }])
          .select('id')
          .single();

        if (grnError) throw grnError;
        if (grnData?.id) {
          createdGrnIds.push(grnData.id);
          if (!grnIdToUse) grnIdToUse = grnData.id;

          const itemsWithGrnId = whItems.map(i => ({ ...i, grn_id: grnData.id }));
          if (itemsWithGrnId.length > 0) {
            const { error: grnItemsError } = await supabase.from('grn_items').insert(itemsWithGrnId);
            if (grnItemsError) throw grnItemsError;
          }
        }
      }
    }

    const convertedTileItemsForPayload = validTileItems.map((t: any) => {
      const ppb = Math.max(1, Number(t.piecesPerBox) || 4);
      const bQty = Number(t.boxQty || 0);
      const lPcs = Number(t.loosePcs || 0);
      const totalBoxes = Number((bQty + (lPcs / ppb)).toFixed(3));
      return {
        itemName: t.itemName,
        skuCode: t.skuCode,
        warehouse: t.warehouse || locations[0]?.name || 'Main Warehouse',
        qty: totalBoxes,
        rate: Number(t.costPricePerBox || 0),
        discountPer: 0,
        discountAmt: 0,
        gstRate: 0,
        gstAmt: 0,
        amount: Number(t.totalAmount || 0),
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

    const mergedItemsToSave = [...validStandardItems, ...convertedTileItemsForPayload];

    const databasePayload: any = {
      purchase_no: values.purchaseNo,
      supplier_name: values.supplierName,
      vendor_name: values.supplierName,
      target_warehouse: values.targetWarehouse || locations[0]?.name || 'Main Warehouse',
      purchase_date: values.purchaseDate,
      purchase_type: values.applyTax ? 'GST Standard Item' : 'No Tax',
      payment_term: paymentTermLabel,
      amount_paid: totalPaid,
      cash_amount_paid: values.settlementMode === 'Bank' ? 0 : Number(values.cashAmountPaid || 0),
      bank_amount_paid: values.settlementMode === 'Cash' ? 0 : Number(values.bankAmountPaid || 0),
      selected_bank_title: values.selectedBankTitle || null,
      additional_charges: Number(values.additionalCharges || 0),
      total_amount: totalBillAmount,
      remaining_balance: remainingBalance,
      remarks: values.remarks.trim() || null,
      notes: values.remarks.trim() || null,
      items: mergedItemsToSave,
      metadata: {
        settlementMode: values.settlementMode,
        selectedBankTitle: values.selectedBankTitle,
        cashAmountPaid: values.cashAmountPaid,
        bankAmountPaid: values.bankAmountPaid,
        applyTax: values.applyTax,
        grn_id: grnIdToUse,
        grn_no: values.grnNo || editData?.metadata?.grn_no || null,
        gatePasses: values.gatePasses,
        showTileSection: values.showTileSection,
        tile_items: validTileItems
      }
    };

    if (isEditMode) {
      const { error } = await supabase.from('supplier_purchases').update(databasePayload).eq('id', editData.id);
      if (error) throw error;

      const linkedGrnId = values.grnId || editData?.metadata?.grn_id || editData?.grn_id || null;
      if (linkedGrnId) {
        const { data: existingGrnItems } = await supabase
          .from('grn_items')
          .select('*')
          .eq('grn_id', linkedGrnId);

        await supabase.from('grn_items').delete().eq('grn_id', linkedGrnId);

        const updatedGrnItems = itemsToInsert.map((item: any) => {
          const matched = (existingGrnItems || []).find((eg: any) =>
            eg.product_name === item.product_name &&
            String(eg.warehouse_name).toUpperCase() === String(item.warehouse_name).toUpperCase()
          );

          const prevAccepted = matched ? Number(matched.accepted_qty || 0) : 0;
          const prevRejected = matched ? Number(matched.rejected_qty || 0) : 0;
          const itemQty = Number(item.qty || 0);

          const isWhRequireInward = Boolean(
            workflowSettings?.require_inward_challan &&
            (workflowSettings?.inward_challan_locations || []).includes(item.warehouse_name)
          );

          const acceptedQty = !isWhRequireInward ? itemQty : Math.min(itemQty, prevAccepted);
          const rejectedQty = !isWhRequireInward ? 0 : Math.min(Math.max(0, itemQty - acceptedQty), prevRejected);
          const holdQty = Math.max(0, Number((itemQty - acceptedQty - rejectedQty).toFixed(3)));

          return {
            grn_id: linkedGrnId,
            product_name: item.product_name,
            warehouse_name: item.warehouse_name,
            qty: itemQty,
            uom: item.uom || 'NOS',
            accepted_qty: acceptedQty,
            rejected_qty: rejectedQty,
            hold_qty: holdQty
          };
        });
        if (updatedGrnItems.length > 0) {
          await supabase.from('grn_items').insert(updatedGrnItems);
        }

        const hasPendingHold = updatedGrnItems.some(it => Number(it.hold_qty || 0) > 0);
        await supabase.from('grn_receipts').update({
          vendor_name: values.supplierName,
          receipt_date: values.purchaseDate,
          status: hasPendingHold ? 'Pending Inward' : 'Confirm'
        }).eq('id', linkedGrnId);
      }

      // Auto-sync financial vouchers (PAV & VPV) on update
      try {
        const resolvedVendor = await resolveVendorCoaAccount(values.supplierName, suppliers);
        const purchaseIdentifier = values.purchaseNo || editData?.purchase_no || `PUR-${String(editData.id).padStart(4, '0')}`;
        const vDate = values.purchaseDate || new Date().toISOString().split('T')[0];

        // 1. Update PAV
        const { data: existingPav } = await supabase
          .from('financial_vouchers')
          .select('id, metadata')
          .or(`original_invoice_no.eq.${purchaseIdentifier},metadata->>linkedPurchaseNo.eq.${purchaseIdentifier}`)
          .ilike('voucher_no', 'PAV-%')
          .maybeSingle();

        if (existingPav) {
          await supabase.from('financial_vouchers').update({
            total_amount: totalBillAmount,
            debit: 0,
            credit: totalBillAmount,
            account_code: resolvedVendor.code,
            account_title: resolvedVendor.title,
            voucher_date: vDate,
            narration: `Purchase procurement bill from ${resolvedVendor.title} (Bill #${purchaseIdentifier}, ${values.items.length} items)`,
            original_invoice_no: purchaseIdentifier,
            items: [
              {
                accountCode: resolvedVendor.code,
                accountTitle: resolvedVendor.title,
                particulars: `Purchase Bill #${purchaseIdentifier}`,
                debit: 0,
                credit: totalBillAmount
              }
            ]
          }).eq('id', existingPav.id);
        }

        // 2. Update VPV
        const { data: existingVpv } = await supabase
          .from('financial_vouchers')
          .select('id, metadata')
          .or(`original_invoice_no.eq.${purchaseIdentifier},metadata->>linkedPurchaseNo.eq.${purchaseIdentifier}`)
          .ilike('voucher_no', 'VPV-%')
          .maybeSingle();

        if (totalPaid > 0) {
          const paidCash = values.settlementMode === 'Bank' ? 0 : Number(values.cashAmountPaid || 0);
          const paidBank = values.settlementMode === 'Cash' ? 0 : Number(values.bankAmountPaid || 0);

          let bankCoaCode = '1020-001';
          let bankCoaTitle = values.selectedBankTitle || 'Bank Account';
          if (paidBank > 0 && values.selectedBankTitle) {
            const { data: bankCoaRows } = await supabase
              .from('chart_of_accounts')
              .select('account_code, account_title')
              .ilike('account_title', `%${values.selectedBankTitle.trim()}%`)
              .limit(1);
            if (bankCoaRows && bankCoaRows[0]) {
              bankCoaCode = bankCoaRows[0].account_code;
              bankCoaTitle = bankCoaRows[0].account_title;
            }
          }

          const vpvItems: any[] = [
            {
              accountCode: resolvedVendor.code,
              accountTitle: resolvedVendor.title,
              particulars: `Payment for Purchase Bill #${purchaseIdentifier}`,
              debit: totalPaid,
              credit: 0
            }
          ];
          if (paidCash > 0) {
            vpvItems.push({
              accountCode: '1010-001',
              accountTitle: 'Cash in Hand',
              particulars: `Cash paid from drawer`,
              debit: 0,
              credit: paidCash
            });
          }
          if (paidBank > 0) {
            vpvItems.push({
              accountCode: bankCoaCode,
              accountTitle: bankCoaTitle,
              particulars: `Bank wire payment from ${bankCoaTitle}`,
              debit: 0,
              credit: paidBank
            });
          }

          if (existingVpv) {
            await supabase.from('financial_vouchers').update({
              total_amount: totalPaid,
              debit: totalPaid,
              credit: 0,
              account_code: resolvedVendor.code,
              account_title: resolvedVendor.title,
              voucher_date: vDate,
              items: vpvItems
            }).eq('id', existingVpv.id);
          } else {
            const modeDesc = paidCash > 0 && paidBank > 0 ? 'Cash & Bank' : (paidBank > 0 ? 'Bank' : 'Cash');
            const { data: vpvRows } = await supabase
              .from('financial_vouchers')
              .select('voucher_no')
              .or('voucher_no.ilike.VPV-%,voucher_no.ilike.VPR-%');

            const usedSeqs = new Set<number>();
            (vpvRows || []).forEach((v: any) => {
              const match = String(v.voucher_no || '').match(/(?:VPV|VPR)-(\d+)/i);
              if (match && match[1]) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num > 0) usedSeqs.add(num);
              }
            });
            let nextSeq = 1;
            while (usedSeqs.has(nextSeq)) {
              nextSeq++;
            }
            const nextVpvNo = `VPV-${String(nextSeq).padStart(3, '0')}`;

            await supabase.from('financial_vouchers').insert([{
              voucher_no: nextVpvNo,
              voucher_type: 'Vendor Payment Voucher',
              voucher_date: vDate,
              total_amount: totalPaid,
              debit: totalPaid,
              credit: 0,
              account_code: resolvedVendor.code,
              account_title: resolvedVendor.title,
              customer_name: resolvedVendor.title,
              customerName: resolvedVendor.title,
              party_name: resolvedVendor.title,
              narration: `Payment disbursed to ${resolvedVendor.title} for Purchase Bill #${purchaseIdentifier} (${modeDesc})`,
              original_invoice_no: purchaseIdentifier,
              items: vpvItems,
              metadata: {
                preset: 'VPV',
                auto_generated: true,
                linkedPurchaseNo: purchaseIdentifier,
                settlementMode: values.settlementMode,
                moduleSource: 'purchase_bill'
              }
            }]);
          }
        } else if (existingVpv) {
          await supabase.from('financial_vouchers').delete().eq('id', existingVpv.id);
        }
      } catch (vchErr) {
        console.warn('Voucher auto-sync in update purchase warning:', vchErr);
      }

      toast.success('Procurement inventory batch updated successfully!');
      if (submitAction === 'print') {
        navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/Print/${editData.id}`);
      } else {
        navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/List`);
      }
    } else {
      // Insert mode
      const { data: insertedData, error } = await supabase.from('supplier_purchases').insert([databasePayload]).select('id').single();
      if (error) throw error;
      if (values.grnId) {
        await supabase.from('grn_receipts').update({ status: 'Billed' }).eq('id', values.grnId);
      } else if (grnIdToUse) {
        const targetWh = (values.targetWarehouse || locations[0]?.name || 'Main Warehouse').trim();
        const isWhRequireInward = Boolean(
          workflowSettings?.require_inward_challan &&
          (workflowSettings?.inward_challan_locations || []).includes(targetWh)
        );
        if (!isWhRequireInward) {
          await supabase.from('grn_receipts').update({ status: 'Confirm' }).eq('id', grnIdToUse);
        }
      }

      // 1-step workflow stock update
      for (const item of mergedItemsToSave) {
        if (!item.itemName || !item.itemName.trim()) continue;
        const wh = (item.warehouse || values.targetWarehouse || locations[0]?.name || 'Main Warehouse').trim();
        const isWhRequireInward = Boolean(
          workflowSettings?.require_inward_challan &&
          (workflowSettings?.inward_challan_locations || []).includes(wh)
        );
        if (!isWhRequireInward) {
          try {
            const { data: prod } = await supabase
              .from('products')
              .select('id, current_stock')
              .eq('product_name', item.itemName)
              .maybeSingle();

            if (prod) {
              const addedQty = Number(item.qty || 0);
              const newStock = Number(prod.current_stock || 0) + addedQty;
              await supabase
                .from('products')
                .update({ current_stock: newStock })
                .eq('id', prod.id);
            }
          } catch (stkErr) {
            console.warn('Could not auto-increment product stock:', stkErr);
          }
        }
      }

      // Auto-sync financial vouchers (PAV & VPV) on insert
      try {
        const resolvedVendor = await resolveVendorCoaAccount(values.supplierName, suppliers);
        const purchaseIdentifier = values.purchaseNo || `PUR-${String(insertedData?.id || Date.now()).slice(-4)}`;
        const vDate = values.purchaseDate || new Date().toISOString().split('T')[0];

        // 1. Generate PAV
        const { data: pavRows } = await supabase
          .from('financial_vouchers')
          .select('voucher_no')
          .ilike('voucher_no', 'PAV-%');

        const usedPavSeqs = new Set<number>();
        (pavRows || []).forEach((v: any) => {
          const match = String(v.voucher_no || '').match(/PAV-(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > 0) usedPavSeqs.add(num);
          }
        });
        let nextPavSeq = 1;
        while (usedPavSeqs.has(nextPavSeq)) {
          nextPavSeq++;
        }
        const nextPavNo = `PAV-${String(nextPavSeq).padStart(3, '0')}`;

        await supabase.from('financial_vouchers').insert([{
          voucher_no: nextPavNo,
          voucher_type: 'Purchase Accrual Voucher',
          voucher_date: vDate,
          total_amount: totalBillAmount,
          debit: 0,
          credit: totalBillAmount,
          account_code: resolvedVendor.code,
          account_title: resolvedVendor.title,
          customer_name: resolvedVendor.title,
          customerName: resolvedVendor.title,
          party_name: resolvedVendor.title,
          narration: `Purchase procurement bill from ${resolvedVendor.title} (Bill #${purchaseIdentifier}, ${values.items.length} items)`,
          original_invoice_no: purchaseIdentifier,
          items: [
            {
              accountCode: resolvedVendor.code,
              accountTitle: resolvedVendor.title,
              particulars: `Purchase Bill #${purchaseIdentifier}`,
              debit: 0,
              credit: totalBillAmount
            }
          ],
          metadata: {
            preset: 'PAV',
            auto_generated: true,
            linkedPurchaseNo: purchaseIdentifier,
            moduleSource: 'purchase_bill'
          }
        }]);

        // 2. Generate VPV if totalPaid > 0
        if (totalPaid > 0) {
          const paidCash = values.settlementMode === 'Bank' ? 0 : Number(values.cashAmountPaid || 0);
          const paidBank = values.settlementMode === 'Cash' ? 0 : Number(values.bankAmountPaid || 0);

          let bankCoaCode = '1020-001';
          let bankCoaTitle = values.selectedBankTitle || 'Bank Account';
          if (paidBank > 0 && values.selectedBankTitle) {
            const { data: bankCoaRows } = await supabase
              .from('chart_of_accounts')
              .select('account_code, account_title')
              .ilike('account_title', `%${values.selectedBankTitle.trim()}%`)
              .limit(1);
            if (bankCoaRows && bankCoaRows[0]) {
              bankCoaCode = bankCoaRows[0].account_code;
              bankCoaTitle = bankCoaRows[0].account_title;
            }
          }

          const vpvItems: any[] = [
            {
              accountCode: resolvedVendor.code,
              accountTitle: resolvedVendor.title,
              particulars: `Payment for Purchase Bill #${purchaseIdentifier}`,
              debit: totalPaid,
              credit: 0
            }
          ];
          if (paidCash > 0) {
            vpvItems.push({
              accountCode: '1010-001',
              accountTitle: 'Cash in Hand',
              particulars: `Cash paid from drawer`,
              debit: 0,
              credit: paidCash
            });
          }
          if (paidBank > 0) {
            vpvItems.push({
              accountCode: bankCoaCode,
              accountTitle: bankCoaTitle,
              particulars: `Bank wire payment from ${bankCoaTitle}`,
              debit: 0,
              credit: paidBank
            });
          }

          const modeDesc = paidCash > 0 && paidBank > 0
            ? `Cash: Rs. ${paidCash} + Bank: Rs. ${paidBank}`
            : paidBank > 0
            ? `Bank Transfer: Rs. ${paidBank} (${bankCoaCode})`
            : `Cash Payment: Rs. ${paidCash}`;

          const { data: vpvRows } = await supabase
            .from('financial_vouchers')
            .select('voucher_no')
            .or('voucher_no.ilike.VPV-%,voucher_no.ilike.VPR-%');

          const usedSeqs = new Set<number>();
          (vpvRows || []).forEach(v => {
            const match = String(v.voucher_no || '').match(/(?:VPV|VPR)-(\d+)/i);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > 0) usedSeqs.add(num);
            }
          });
          let nextSeq = 1;
          while (usedSeqs.has(nextSeq)) {
            nextSeq++;
          }
          const nextVpvNo = `VPV-${String(nextSeq).padStart(3, '0')}`;

          await supabase.from('financial_vouchers').insert([{
            voucher_no: nextVpvNo,
            voucher_type: 'Vendor Payment Voucher',
            voucher_date: vDate,
            total_amount: totalPaid,
            debit: totalPaid,
            credit: 0,
            account_code: resolvedVendor.code,
            account_title: resolvedVendor.title,
            customer_name: resolvedVendor.title,
            customerName: resolvedVendor.title,
            party_name: resolvedVendor.title,
            narration: `Payment disbursed to ${resolvedVendor.title} for Purchase Bill #${purchaseIdentifier} (${modeDesc})`,
            original_invoice_no: purchaseIdentifier,
            items: vpvItems,
            metadata: {
              preset: 'VPV',
              auto_generated: true,
              linkedPurchaseNo: purchaseIdentifier,
              settlementMode: values.settlementMode,
              moduleSource: 'purchase_bill'
            }
          }]);
        }
      } catch (vchErr) {
        console.warn('Voucher auto-sync in insert purchase warning:', vchErr);
      }

      toast.success('Procurement inventory batch recorded successfully!');
      if (submitAction === 'print' && insertedData?.id) {
        navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/Print/${insertedData.id}`);
      } else {
        navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/List`);
      }
    }
  } catch (err: any) {
    toast.error('Submission Interrupted: ' + err.message);
  } finally {
    setLoading(false);
    setSubmitting(false);
  }
};
