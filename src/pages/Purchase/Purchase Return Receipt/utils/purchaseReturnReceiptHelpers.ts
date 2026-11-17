import { supabase } from '../../../../Context/supabaseClient';

export const formatMoney = (val: number | string | undefined | null): string => {
  const num = Number(val) || 0;
  if (Number.isInteger(num)) {
    return num.toLocaleString('en-US');
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
  ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

// Helper to resolve or auto-register Vendor Chart of Accounts (2010-XXXX)
export const resolveVendorCoaAccount = async (vendorName: string, vendorsList: any[] = []) => {
  const cleanName = (vendorName || '').trim();
  if (!cleanName) return { code: '2010-001', title: 'Demo Vendor' };

  const matched = vendorsList.find(
    (v) => (v.vendor_name || v.supplier_name || v.name || '').trim().toLowerCase() === cleanName.toLowerCase()
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
    (allVendCoa || []).forEach((r) => {
      const match = String(r.account_code || '').match(/2010-(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });

    const nextCode = `2010-${String(maxSeq + 1).padStart(3, '0')}`;
    await supabase.from('chart_of_accounts').insert([
      {
        account_code: nextCode,
        account_title: cleanName,
        category_code: '2. LIABILITIES',
        sub_category_code: 'Current Liabilities',
        control_code: 'Vendor',
        notes: `Vendor account for ${cleanName} (Auto-registered from Purchase Return Refund)`,
      },
    ]);

    return { code: nextCode, title: cleanName };
  } catch (err) {
    console.warn('resolveVendorCoaAccount in return receipt error:', err);
    return { code: '2010-001', title: cleanName };
  }
};
