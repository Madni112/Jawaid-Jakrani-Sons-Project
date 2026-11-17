import { supabase } from '../../../../../Context/supabaseClient';
import { CustomerRecord, COAAccount } from '../types/customerHistoryTypes';
import { getCustomerDisplayName, getCustomerCOA } from '../utils/customerHistoryHelpers';

export const fetchCustomersAndCOAData = async (): Promise<{
  customers: CustomerRecord[];
  coaAccounts: COAAccount[];
}> => {
  const [custRes, coaRes] = await Promise.all([
    supabase.from('customers').select('*').order('customerName', { ascending: true }),
    supabase.from('chart_of_accounts').select('*')
  ]);

  if (custRes.error) throw custRes.error;
  return {
    customers: custRes.data || [],
    coaAccounts: coaRes.data || []
  };
};

export const autoAssign2020CustomerCodesAction = async (): Promise<number> => {
  const { data: allCusts, error: custErr } = await supabase.from('customers').select('*');
  if (custErr) throw custErr;
  if (!allCusts || allCusts.length === 0) return 0;

  const sorted = [...allCusts].sort((a, b) => {
    const codeA = String(a.customer_code || a.customerCode || a.coa_code || '').trim();
    const codeB = String(b.customer_code || b.customerCode || b.coa_code || '').trim();
    if (codeA === '001' || codeA === '2020-001') return -1;
    if (codeB === '001' || codeB === '2020-001') return 1;
    if (codeA === '002' || codeA === '2020-002') return -1;
    if (codeB === '002' || codeB === '2020-002') return 1;
    return (a.customerName || a.name || '').localeCompare(b.customerName || b.name || '');
  });

  const coaInserts: any[] = [];
  const voucherInserts: any[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    const assignedCode = `2020-${String(i + 1).padStart(3, '0')}`;
    const custName = c.customerName || c.customername || c.customer_name || c.name || `Customer #${assignedCode}`;

    try {
      await supabase.from('customers').update({
        customer_code: assignedCode,
        customerCode: assignedCode,
        coa_code: assignedCode
      }).eq('id', c.id);
    } catch {}

    coaInserts.push({
      account_code: assignedCode,
      account_title: custName,
      category_code: '1. ASSETS',
      sub_category_code: 'Current Assets',
      control_code: 'Customers',
      notes: `Customer ledger account for ${custName} (Auto-assigned)`
    });

    const rawBal = c.opening_balance ?? c.openingBalance ?? c.balance ?? c.currentBalance;
    const bal = Math.abs(Number(rawBal) || 0);
    if (bal > 0) {
      const nature = c.balance_nature || c.balanceNature || 'Debit';
      const isDebit = String(nature).toLowerCase() === 'debit';
      voucherInserts.push({
        voucher_no: `OB-${assignedCode}`,
        voucher_type: 'Journal Voucher',
        voucher_date: c.created_at ? c.created_at.split('T')[0] : '2026-10-31',
        account_code: assignedCode,
        account_title: custName,
        total_amount: bal,
        debit: isDebit ? bal : 0,
        credit: !isDebit ? bal : 0,
        narration: `Opening Balance for Customer ${custName}`
      });
    }
  }

  for (const coa of coaInserts) {
    try {
      const { data: existing } = await supabase.from('chart_of_accounts').select('id').eq('account_code', coa.account_code).maybeSingle();
      if (existing?.id) {
        await supabase.from('chart_of_accounts').update(coa).eq('id', existing.id);
      } else {
        await supabase.from('chart_of_accounts').insert([coa]);
      }
    } catch {}
  }

  try {
    await supabase.from('financial_vouchers').delete().like('voucher_no', 'OB-%');
    if (voucherInserts.length > 0) {
      await supabase.from('financial_vouchers').insert(voucherInserts);
    }
  } catch {}

  return sorted.length;
};

export interface SaveCustomerAccountCodeParams {
  selectedCustomer: CustomerRecord;
  cleanCode: string;
  openingBalanceInput: string;
  balanceNatureInput: 'Debit' | 'Credit';
  existingCOA?: COAAccount;
  coaAccounts: COAAccount[];
}

export const saveCustomerAccountCodeAction = async (params: SaveCustomerAccountCodeParams): Promise<void> => {
  const { selectedCustomer, cleanCode, openingBalanceInput, balanceNatureInput, existingCOA, coaAccounts } = params;

  // Check for code uniqueness across other accounts
  const duplicateCode = coaAccounts.find(
    (a) =>
      String(a.account_code).trim().toLowerCase() === cleanCode.toLowerCase() &&
      (!existingCOA || a.id !== existingCOA.id)
  );
  if (duplicateCode) {
    throw new Error(
      `Account code "${cleanCode}" is already used by "${duplicateCode.account_title}". Please enter a unique code.`
    );
  }

  const customerName = getCustomerDisplayName(selectedCustomer).trim();
  const balNum =
    openingBalanceInput !== '' && openingBalanceInput !== undefined
      ? Math.abs(Number(openingBalanceInput) || 0)
      : 0;
  const nature = balanceNatureInput || 'Debit';
  const isDebit = nature === 'Debit';

  // 1. Create or Update Asset Receivable Account (2020-xxx) in chart_of_accounts
  const coaPayload: any = {
    category_code: '1. ASSETS',
    sub_category_code: 'Current Assets',
    control_code: 'Customers',
    account_code: cleanCode,
    account_title: customerName,
    opening_balance: balNum,
    balance_nature: nature,
    notes: `Customer ledger account for ${customerName}${balNum > 0 ? ` (Opening Balance: ${balNum} ${nature})` : ''}`
  };

  if (existingCOA?.id) {
    const { error } = await supabase.from('chart_of_accounts').update(coaPayload).eq('id', existingCOA.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('chart_of_accounts').insert([coaPayload]);
    if (error) throw error;
  }

  // --- TWO-WAY SYNC: UPDATE OR INSERT OPENING BALANCE FINANCIAL VOUCHER ---
  try {
    const oldCode = String(
      selectedCustomer.account_code ||
        selectedCustomer.customer_code ||
        selectedCustomer.customerCode ||
        existingCOA?.account_code ||
        ''
    ).trim();
    const vNum = cleanCode.replace('2020-', '').padStart(3, '0');
    const expectedVoucherNo = `OB-${vNum}`;

    const queryOr = [
      cleanCode ? `account_code.eq.${cleanCode}` : null,
      oldCode ? `account_code.eq.${oldCode}` : null,
      `account_title.eq.${customerName}`,
      `customerName.eq.${customerName}`
    ]
      .filter(Boolean)
      .join(',');

    const { data: vchList } = await supabase
      .from('financial_vouchers')
      .select('id, voucher_no, metadata, original_invoice_no')
      .or(queryOr)
      .is('original_invoice_no', null);

    const existingVoucher = vchList?.find(
      (v: any) =>
        String(v.voucher_no || '').startsWith('OB-') ||
        v.metadata?.isOpeningBalance === true ||
        !v.original_invoice_no
    );

    const voucherPayload: any = {
      voucher_no: expectedVoucherNo,
      account_code: cleanCode,
      account_title: customerName,
      customerName: customerName,
      customer_name: customerName,
      voucher_type: 'Journal Voucher',
      total_amount: balNum,
      debit: isDebit ? balNum : 0,
      credit: !isDebit ? balNum : 0,
      narration: `Opening Balance for Customer ${customerName}`,
      items: [
        {
          accountCode: cleanCode,
          accountTitle: customerName,
          description: `Opening Balance for Customer ${customerName}`,
          debit: isDebit ? balNum : 0,
          credit: !isDebit ? balNum : 0
        }
      ],
      metadata: {
        preset: 'SAV',
        auto_generated: true,
        isOpeningBalance: true,
        balanceNature: nature
      }
    };

    if (existingVoucher?.id) {
      if (balNum > 0) {
        await supabase.from('financial_vouchers').update(voucherPayload).eq('id', existingVoucher.id);
      } else {
        await supabase.from('financial_vouchers').delete().eq('id', existingVoucher.id);
      }
    } else if (balNum > 0) {
      const { data: voucherByNo } = await supabase
        .from('financial_vouchers')
        .select('id')
        .eq('voucher_no', expectedVoucherNo)
        .maybeSingle();

      if (voucherByNo?.id) {
        await supabase.from('financial_vouchers').update(voucherPayload).eq('id', voucherByNo.id);
      } else {
        await supabase.from('financial_vouchers').insert([
          {
            voucher_date: new Date().toISOString().split('T')[0],
            ...voucherPayload
          }
        ]);
      }
    }

    if (oldCode && oldCode !== cleanCode) {
      await supabase.from('financial_vouchers').update({ account_code: cleanCode }).eq('account_code', oldCode);
    }
  } catch (vErr) {
    console.warn('Voucher sync note:', vErr);
  }

  // Update customer record
  try {
    const custUpdates: any = {
      customer_code: cleanCode,
      customerCode: cleanCode,
      customercode: cleanCode,
      coa_code: cleanCode,
      account_code: cleanCode,
      opening_balance: balNum,
      balance: isDebit ? balNum : -balNum,
      currentBalance: isDebit ? balNum : -balNum
    };
    await supabase.from('customers').update(custUpdates).eq('id', selectedCustomer.id);
  } catch (err) {
    console.warn('Customer record sync note:', err);
  }
};

export const deleteCustomerWithCOAAction = async (
  customer: CustomerRecord,
  deleteCOA: boolean
): Promise<void> => {
  const cId = customer.id;
  const cCode =
    customer.customer_code || customer.customerCode || customer.coa_code || customer.account_code;

  // 1. Delete from customers table
  const { error } = await supabase.from('customers').delete().eq('id', cId);
  if (error) throw error;

  // 2. If deleteCOA is checked, also delete from chart_of_accounts & financial_vouchers
  if (deleteCOA && cCode) {
    const cleanCode = String(cCode).trim();
    const vNum = cleanCode.replace(/^2020-/, '').replace(/^0+/, '');
    const normNum = vNum.padStart(3, '0');

    await Promise.allSettled([
      supabase.from('chart_of_accounts').delete().eq('account_code', cleanCode),
      supabase.from('financial_vouchers').delete().eq('account_code', cleanCode),
      supabase.from('financial_vouchers').delete().eq('voucher_no', `OB-${cleanCode}`),
      supabase.from('financial_vouchers').delete().eq('voucher_no', `OB-${normNum}`),
      supabase.from('financial_vouchers').delete().eq('voucher_no', `OB-${vNum}`)
    ]);
  }
};
