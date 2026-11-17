import { supabase } from '../../../../Context/supabaseClient';
import { CustomerItem } from '../types/invoiceReceiptTypes';

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

export const resolveCustomerCoaAccount = async (
  customerName: string,
  customersList: CustomerItem[] = []
): Promise<{ code: string; title: string }> => {
  const cleanName = (customerName || '').trim();
  if (!cleanName) return { code: '2020-001', title: 'Walk-in Customer' };

  // 1. Match from customersList
  const matched = customersList.find(c =>
    (c.customer_name || c.customerName || '').trim().toLowerCase() === cleanName.toLowerCase()
  );
  const existingCode = matched?.customer_code || matched?.customerCode || matched?.coa_code;
  if (existingCode && String(existingCode).startsWith('2020-')) {
    return { code: String(existingCode).trim(), title: matched.customer_name || cleanName };
  }

  // 2. Query chart_of_accounts
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
    (allCustCoa || []).forEach((r: any) => {
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
      notes: `Customer account for ${cleanName} (Auto-registered from Invoice Receipt)`
    }]);

    return { code: nextCode, title: cleanName };
  } catch (err) {
    console.warn('resolveCustomerCoaAccount in receipt error:', err);
    return { code: '2020-001', title: cleanName };
  }
};
