import { supabase } from '../../../../../Context/supabaseClient';
import { ParsedCustomer } from '../types/customerImportTypes';

export interface BatchImportResult {
  insertedCount: number;
  updatedCount: number;
}

export const executeCustomerBatchImport = async (
  validRows: ParsedCustomer[],
  batchOpeningDate: string
): Promise<BatchImportResult> => {
  // 1. Probe database columns to set only valid columns
  const dbColumns: string[] = [];
  try {
    const { data: probeData } = await supabase.from('customers').select('*').limit(1);
    if (probeData && probeData.length > 0) {
      dbColumns.push(...Object.keys(probeData[0]));
    }
  } catch (e) {
    console.warn('Schema probe notice:', e);
  }

  const hasCol = (colName: string) =>
    dbColumns.some((c) => c.toLowerCase() === colName.toLowerCase());
  const getExactCols = (fieldKey: string) =>
    dbColumns.filter((c) => c.toLowerCase() === fieldKey.toLowerCase());

  const toUpdate = validRows.filter((r) => r.isExisting && r.existingId);
  const toInsert = validRows.filter((r) => !r.isExisting);

  let updatedCount = 0;
  let insertedCount = 0;

  // 2. Process UPDATES for existing customers
  for (const r of toUpdate) {
    const rawBal = Number(r.balance) || 0;
    const computedBal = r.balanceNature === 'Credit' ? -Math.abs(rawBal) : Math.abs(rawBal);
    const locText = [r.city, r.area].filter(Boolean).join(' | ');

    const updatePayload: Record<string, any> = {
      opening_balance: Math.abs(rawBal),
      balance: computedBal,
      currentBalance: computedBal,
    };

    if (r.city && hasCol('city')) updatePayload.city = r.city;
    if (r.province && hasCol('province')) updatePayload.province = r.province;
    if (r.address && hasCol('address')) updatePayload.address = r.address;
    if (r.phone && hasCol('primaryPhone')) updatePayload.primaryPhone = r.phone;
    if (r.phone && hasCol('phone')) updatePayload.phone = r.phone;
    if (r.tier && hasCol('registrationType')) updatePayload.registrationType = r.tier;
    if (hasCol('notes') && locText) {
      updatePayload.notes = `Location: ${locText}`;
    }

    const { error: updateErr } = await supabase
      .from('customers')
      .update(updatePayload)
      .eq('id', r.existingId);

    if (updateErr) {
      console.warn(`Failed to update customer ${r.name}:`, updateErr);
    } else {
      updatedCount++;
    }
  }

  // 3. Process INSERTS for new customers
  if (toInsert.length > 0) {
    const insertPayloads = toInsert.map((r) => {
      const item: any = {};
      const setCol = (key: string, val: any) => {
        const exacts = getExactCols(key);
        if (exacts.length > 0) {
          exacts.forEach((c) => {
            item[c] = val;
          });
        }
      };

      const rawBal = Number(r.balance) || 0;
      const computedBal = r.balanceNature === 'Credit' ? -Math.abs(rawBal) : Math.abs(rawBal);
      const locText = [r.city, r.area].filter(Boolean).join(' | ');

      if (dbColumns.length === 0) {
        item['customerName'] = r.name;
        if (r.assignedCode) {
          item['customer_code'] = r.assignedCode;
          item['customerCode'] = r.assignedCode;
          item['coa_code'] = r.assignedCode;
          item['account_code'] = r.assignedCode;
        }
        item['balance_nature'] = r.balanceNature || 'Debit';
        if (r.phone) item['primaryPhone'] = r.phone;
        item['city'] = r.city;
        item['province'] = r.province || 'Sindh';
        if (r.address) item['address'] = r.address;
        if (r.tier) item['registrationType'] = r.tier;
        item['opening_balance'] = Math.abs(rawBal);
        item['currentBalance'] = computedBal;
        item['balance'] = computedBal;
        if (locText) {
          item['notes'] = `Location: ${locText}`;
        }
      } else {
        setCol('customerName', r.name);
        setCol('customername', r.name);
        setCol('customer_name', r.name);
        setCol('name', r.name);

        if (r.assignedCode) {
          setCol('customer_code', r.assignedCode);
          setCol('customerCode', r.assignedCode);
          setCol('coa_code', r.assignedCode);
          setCol('account_code', r.assignedCode);
        }
        setCol('balance_nature', r.balanceNature || 'Debit');
        setCol('balanceNature', r.balanceNature || 'Debit');

        if (r.tier) {
          setCol('registrationType', r.tier);
          setCol('registrationtype', r.tier);
        }

        if (r.phone) {
          setCol('primaryPhone', r.phone);
          setCol('primaryphone', r.phone);
          setCol('phone', r.phone);
        }

        if (hasCol('city')) setCol('city', r.city);
        if (hasCol('sub_area')) setCol('sub_area', r.city);
        if (hasCol('subArea')) setCol('subArea', r.city);
        if (hasCol('area')) setCol('area', r.area);
        if (hasCol('address') && r.address) setCol('address', r.address);
        if (hasCol('province')) setCol('province', r.province || 'Sindh');

        if (locText) {
          setCol('notes', `Location: ${locText}`);
        }

        setCol('opening_balance', Math.abs(rawBal));
        setCol('openingBalance', Math.abs(rawBal));
        setCol('balance', computedBal);
        setCol('currentBalance', computedBal);
        setCol('current_balance', computedBal);
      }

      return item;
    });

    const batchSize = 50;
    for (let i = 0; i < insertPayloads.length; i += batchSize) {
      let batch = insertPayloads.slice(i, i + batchSize);
      let { error } = await supabase.from('customers').insert(batch);

      // Auto-heal missing columns reported by PostgREST schema cache
      if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
        for (let attempt = 0; attempt < 8 && error; attempt++) {
          const errMsg = error.message || '';
          const colMatch = errMsg.match(/Could not find the '([^']+)' column/i);
          if (colMatch && colMatch[1]) {
            const missingCol = colMatch[1].toLowerCase();
            batch = batch.map((rowItem) => {
              const copy = { ...rowItem };
              const foundKey = Object.keys(copy).find((k) => k.toLowerCase() === missingCol);
              if (foundKey) delete copy[foundKey];
              return copy;
            });
            const retryRes = await supabase.from('customers').insert(batch);
            error = retryRes.error;
          } else {
            break;
          }
        }
      }

      if (error) throw error;
      insertedCount += batch.length;
    }

    // 4. Automatically create / sync Chart of Accounts ledgers for all new customers
    for (const r of toInsert) {
      if (r.assignedCode) {
        const rawBal = Number(r.balance) || 0;
        const coaPayload = {
          account_code: r.assignedCode,
          account_title: r.name,
          category_code: '1. ASSETS',
          sub_category_code: 'Current Assets',
          control_code: 'Customers',
          opening_balance: Math.abs(rawBal),
          balance_nature: r.balanceNature || 'Debit',
          notes: `Customer ledger account for ${r.name} (Auto-assigned from Excel import)`,
        };
        try {
          const { data: existingCOA } = await supabase
            .from('chart_of_accounts')
            .select('id')
            .eq('account_code', r.assignedCode)
            .maybeSingle();

          if (existingCOA?.id) {
            await supabase.from('chart_of_accounts').update(coaPayload).eq('id', existingCOA.id);
          } else {
            await supabase.from('chart_of_accounts').insert([coaPayload]);
          }
        } catch (coaErr) {
          console.warn('COA auto-sync note in Excel import:', coaErr);
        }
      }
    }

    // 5. Automatically create Opening Balance Journal Vouchers (financial_vouchers)
    const voucherInserts: any[] = [];
    for (const r of toInsert) {
      const rawBal = Number(r.balance) || 0;
      const bal = Math.abs(rawBal);
      if (bal > 0 && r.assignedCode) {
        const isDebit = r.balanceNature !== 'Credit';
        const vNum = r.assignedCode.replace('2020-', '');
        voucherInserts.push({
          voucher_no: `OB-${vNum}`,
          voucher_type: 'Journal Voucher',
          voucher_date: r.openingDate || batchOpeningDate || new Date().toISOString().split('T')[0],
          account_code: r.assignedCode,
          account_title: r.name,
          total_amount: bal,
          debit: isDebit ? bal : 0,
          credit: !isDebit ? bal : 0,
          narration: `Opening Balance for Customer ${r.name}`,
          items: [],
        });
      }
    }

    if (voucherInserts.length > 0) {
      try {
        const { error: vErr } = await supabase.from('financial_vouchers').insert(voucherInserts);
        if (vErr) console.warn('Opening balance vouchers insert note:', vErr);
      } catch (vErr) {
        console.warn('Voucher insert note:', vErr);
      }
    }
  }

  return { insertedCount, updatedCount };
};
