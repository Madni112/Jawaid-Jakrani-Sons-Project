import { supabase } from '../../../../Context/supabaseClient';

export interface SyncVoucherBalancesParams {
  values: any;
  editData: any;
  firstItem: any;
  firstAcc: any;
  effectiveTotal: number;
  activePreset: string;
}

export const syncVoucherBalances = async ({
  values,
  editData,
  firstItem,
  firstAcc,
  effectiveTotal,
  activePreset
}: SyncVoucherBalancesParams) => {
  try {
    const vNumStr = String(values.voucherNo || editData?.voucher_no || '').trim().toUpperCase();
    const isOBVoucher = vNumStr.startsWith('OB-') ||
      vNumStr.startsWith('OBV-') ||
      String(values.notes || '').toLowerCase().includes('opening balance') ||
      String(editData?.narration || '').toLowerCase().includes('opening balance');

    if (isOBVoucher) {
      const targetCode = (firstItem.accountCode || editData?.account_code || '').trim();
      const targetTitle = (firstAcc?.account_title || editData?.account_title || '').trim();

      if (targetCode || targetTitle) {
        // 1. Sync to Customers (2020-XXX)
        let custQuery = supabase.from('customers').select('id, balance, currentBalance, opening_balance');
        if (targetCode && targetTitle) {
          custQuery = custQuery.or(`customer_code.eq.${targetCode},account_code.eq.${targetCode},customerCode.eq.${targetCode},customerName.eq.${targetTitle}`);
        } else if (targetCode) {
          custQuery = custQuery.or(`customer_code.eq.${targetCode},account_code.eq.${targetCode},customerCode.eq.${targetCode}`);
        } else {
          custQuery = custQuery.eq('customerName', targetTitle);
        }

        const { data: matchedCust } = await custQuery.maybeSingle();
        if (matchedCust) {
          const custUpdate: any = {};
          if (effectiveTotal > 0) {
            custUpdate.opening_balance = effectiveTotal;
            custUpdate.balance = effectiveTotal;
            custUpdate.currentBalance = effectiveTotal;
          }
          if (Object.keys(custUpdate).length > 0) {
            await supabase.from('customers').update(custUpdate).eq('id', matchedCust.id);
          }
        }

        // 2. Sync to Vendors (2010-XXX)
        let vendQuery = supabase.from('vendors').select('id, balance, currentBalance, opening_balance, vendor_name');
        if (targetCode && targetTitle) {
          vendQuery = vendQuery.or(`vendor_code.eq.${targetCode},account_code.eq.${targetCode},vendorCode.eq.${targetCode},vendor_name.eq.${targetTitle}`);
        } else if (targetCode) {
          vendQuery = vendQuery.or(`vendor_code.eq.${targetCode},account_code.eq.${targetCode},vendorCode.eq.${targetCode}`);
        } else {
          vendQuery = vendQuery.eq('vendor_name', targetTitle);
        }

        const { data: matchedVend } = await vendQuery.maybeSingle();
        if (matchedVend) {
          const isCredit = (firstItem.credit && Number(firstItem.credit) > 0) || !firstItem.debit;
          const signedBal = isCredit ? effectiveTotal : -effectiveTotal;
          await supabase.from('vendors').update({
            balance: signedBal,
            currentBalance: signedBal,
            opening_balance: effectiveTotal,
            balance_nature: isCredit ? 'Credit' : 'Debit'
          }).eq('id', matchedVend.id);
        }

        // 3. Sync to Chart of Accounts (COA)
        if (targetCode) {
          const isCredit = (firstItem.credit && Number(firstItem.credit) > 0) || !firstItem.debit;
          await supabase.from('chart_of_accounts').update({
            opening_balance: effectiveTotal,
            balance_nature: isCredit ? 'Credit' : 'Debit'
          }).eq('account_code', targetCode);
        }
      }
    }

    if (activePreset === 'SAV' || activePreset === 'SRV' || activePreset === 'CRV') {
      const custItem = values.items.find((it: any) => (it.accountCode || '').startsWith('2020-'));
      if (custItem) {
        const custCode = custItem.accountCode.trim();
        const [{ data: allVchs }, { data: coaItem }, { data: custRec }] = await Promise.all([
          supabase.from('financial_vouchers').select('debit, credit, total_amount, items, account_code'),
          supabase.from('chart_of_accounts').select('opening_balance, balance_nature').eq('account_code', custCode).maybeSingle(),
          supabase.from('customers').select('id, opening_balance').or(`customer_code.eq.${custCode},account_code.eq.${custCode}`).maybeSingle()
        ]);

        let totalD = 0;
        let totalC = 0;
        (allVchs || []).forEach((v: any) => {
          if (Array.isArray(v.items) && v.items.length > 0) {
            v.items.forEach((it: any) => {
              if (String(it.accountCode || it.account_code || '').trim() === custCode) {
                totalD += Number(it.debit || 0);
                totalC += Number(it.credit || 0);
              }
            });
          } else if (String(v.account_code || '').trim() === custCode) {
            totalD += Number(v.debit || (v.credit ? 0 : v.total_amount) || 0);
            totalC += Number(v.credit || 0);
          }
        });

        const hasOB = (allVchs || []).some((v: any) =>
          (String(v.voucher_no || '').startsWith('OB-') || Boolean(v.metadata?.isOpeningBalance)) &&
          (String(v.account_code || '').trim() === custCode || (v.items || []).some((it: any) => String(it.accountCode || it.account_code || '').trim() === custCode))
        );
        const op = hasOB ? 0 : Number(coaItem?.opening_balance ?? custRec?.opening_balance ?? 0);
        const isCr = coaItem?.balance_nature?.toLowerCase() === 'credit';
        const exactCustBal = (isCr ? -op : op) + (totalD - totalC);

        if (custRec?.id) {
          await supabase.from('customers').update({ balance: exactCustBal, currentBalance: exactCustBal }).eq('id', custRec.id);
        }
      }
    }

    if (activePreset === 'PAV' || activePreset === 'PRV' || activePreset === 'VPV') {
      const vendItem = values.items.find((it: any) => (it.accountCode || '').startsWith('2010-'));
      if (vendItem) {
        const vendCode = vendItem.accountCode.trim();
        const [{ data: allVchs }, { data: coaItem }, { data: vendRec }] = await Promise.all([
          supabase.from('financial_vouchers').select('debit, credit, total_amount, items, account_code'),
          supabase.from('chart_of_accounts').select('opening_balance, balance_nature').eq('account_code', vendCode).maybeSingle(),
          supabase.from('vendors').select('id, opening_balance').eq('vendor_code', vendCode).maybeSingle()
        ]);

        let totalD = 0;
        let totalC = 0;
        (allVchs || []).forEach((v: any) => {
          if (Array.isArray(v.items) && v.items.length > 0) {
            v.items.forEach((it: any) => {
              if (String(it.accountCode || it.account_code || '').trim() === vendCode) {
                totalD += Number(it.debit || 0);
                totalC += Number(it.credit || 0);
              }
            });
          } else if (String(v.account_code || '').trim() === vendCode) {
            totalD += Number(v.debit || (v.credit ? 0 : v.total_amount) || 0);
            totalC += Number(v.credit || 0);
          }
        });

        const hasOB = (allVchs || []).some((v: any) =>
          (String(v.voucher_no || '').startsWith('OBV-') || String(v.voucher_no || '').startsWith('OB-') || Boolean(v.metadata?.isOpeningBalance)) &&
          (String(v.account_code || '').trim() === vendCode || (v.items || []).some((it: any) => String(it.accountCode || it.account_code || '').trim() === vendCode))
        );
        const op = hasOB ? 0 : Number(coaItem?.opening_balance ?? vendRec?.opening_balance ?? 0);
        const isDr = coaItem?.balance_nature?.toLowerCase() === 'debit';
        const exactVendBal = (isDr ? -op : op) + (totalC - totalD);

        if (vendRec?.id) {
          await supabase.from('vendors').update({ balance: exactVendBal, currentBalance: exactVendBal, current_balance: exactVendBal }).eq('id', vendRec.id);
        }
      }
    }
  } catch (syncErr) {
    console.warn('Customer/Vendor balance sync note:', syncErr);
  }
};

export const saveVoucherToDatabase = async (databasePayload: any, isEditMode: boolean, editDataId?: any) => {
  const executeSave = async (payloadToTry: any) => {
    if (isEditMode) {
      return await supabase
        .from('financial_vouchers')
        .update(payloadToTry)
        .eq('id', editDataId);
    } else {
      return await supabase
        .from('financial_vouchers')
        .insert([payloadToTry]);
    }
  };

  let saveResult = await executeSave(databasePayload);

  if (saveResult.error && (saveResult.error.code === 'PGRST204' || saveResult.error.message?.includes('schema cache'))) {
    const fallbackPayload = { ...databasePayload };
    for (let attempt = 0; attempt < 5 && saveResult.error; attempt++) {
      const errMsg = saveResult.error.message || '';
      const colMatch = errMsg.match(/Could not find the '([^']+)' column/i);
      if (colMatch && colMatch[1]) {
        delete fallbackPayload[colMatch[1]];
        saveResult = await executeSave(fallbackPayload);
      } else {
        break;
      }
    }
  }

  if (saveResult.error) throw saveResult.error;
  return saveResult;
};
