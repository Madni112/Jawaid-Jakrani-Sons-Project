import { PresetMeta, VoucherItem } from '../types/voucherTypes';

export const PRESET_DEFINITIONS: Record<string, PresetMeta> = {
  SAV: {
    title: 'Sale Amount Voucher',
    prefix: 'SAV',
    typeName: 'Sale Amount Voucher',
    listRoute: '/Registration/Vouchers/List?type=SAV',
    isSingleRow: true,
    defaultDebitOrCredit: 'Debit',
    amountLabel: 'Sale Amount (PKR)',
    partyLabel: 'Customer Account',
    descPlaceholder: 'e.g. Sale of 50 thaan Latha / Bill # 104',
    badgeColor: 'text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50'
  },
  SRV: {
    title: 'Sale Amount Return',
    prefix: 'SRV',
    typeName: 'Sale Amount Return',
    listRoute: '/Registration/Vouchers/List?type=SRV',
    isSingleRow: true,
    defaultDebitOrCredit: 'Credit',
    amountLabel: 'Return Credit Amount (PKR)',
    partyLabel: 'Customer Account',
    descPlaceholder: 'e.g. Return of 10 thaan defective cloth',
    badgeColor: 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50'
  },
  CRV: {
    title: 'Customer Receive Voucher',
    prefix: 'CRV',
    typeName: 'Customer Receive Voucher',
    listRoute: '/Registration/Vouchers/List?type=CRV',
    isSingleRow: false,
    defaultDebitOrCredit: 'Credit',
    amountLabel: 'Received Amount (PKR)',
    partyLabel: 'Customer Account',
    descPlaceholder: 'e.g. Cash / Bank receipt on account',
    badgeColor: 'text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/50'
  },
  CPV: {
    title: 'Customer Payment Voucher (Refund)',
    prefix: 'CPV',
    typeName: 'Customer Payment Voucher',
    listRoute: '/Registration/Vouchers/List?type=CPV',
    isSingleRow: false,
    defaultDebitOrCredit: 'Debit',
    amountLabel: 'Refund Amount Disbursed (PKR)',
    partyLabel: 'Customer Account',
    descPlaceholder: 'e.g. Cash / Bank refund payout for returned items',
    badgeColor: 'text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50'
  },
  PAV: {
    title: 'Purchase Amount Voucher',
    prefix: 'PAV',
    typeName: 'Purchase Amount Voucher',
    listRoute: '/Registration/Vouchers/List?type=PAV',
    isSingleRow: true,
    defaultDebitOrCredit: 'Credit',
    amountLabel: 'Purchase Amount (PKR)',
    partyLabel: 'Vendor / Supplier Account',
    descPlaceholder: 'e.g. Purchase from mill / weaving invoice # 205',
    badgeColor: 'text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/50'
  },
  PRV: {
    title: 'Purchase Amount Return',
    prefix: 'PRV',
    typeName: 'Purchase Amount Return',
    listRoute: '/Registration/Vouchers/List?type=PRV',
    isSingleRow: true,
    defaultDebitOrCredit: 'Debit',
    amountLabel: 'Return Debit Amount (PKR)',
    partyLabel: 'Vendor / Supplier Account',
    descPlaceholder: 'e.g. Return of damaged thaan to supplier',
    badgeColor: 'text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/50'
  },
  VPV: {
    title: 'Vendor Payment Voucher',
    prefix: 'VPV',
    typeName: 'Vendor Payment Voucher',
    listRoute: '/Registration/Vouchers/List?type=VPV',
    isSingleRow: false,
    defaultDebitOrCredit: 'Debit',
    amountLabel: 'Paid Amount (PKR)',
    partyLabel: 'Vendor / Supplier Account',
    descPlaceholder: 'e.g. Payment disbursed to mill / vendor',
    badgeColor: 'text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/50'
  },
  VRV: {
    title: 'Vendor Receive Voucher (Refund)',
    prefix: 'VRV',
    typeName: 'Vendor Receive Voucher',
    listRoute: '/Registration/Vouchers/List?type=VRV',
    isSingleRow: false,
    defaultDebitOrCredit: 'Credit',
    amountLabel: 'Refund Amount Collected (PKR)',
    partyLabel: 'Vendor / Supplier Account',
    descPlaceholder: 'e.g. Refund received back from vendor for returned items',
    badgeColor: 'text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/50'
  },
  EXP: {
    title: 'Expense Voucher',
    prefix: 'EXP',
    typeName: 'Expense Voucher',
    listRoute: '/Registration/Vouchers/List?type=EXP',
    isSingleRow: false,
    defaultDebitOrCredit: 'Debit',
    amountLabel: 'Expense Amount (PKR)',
    partyLabel: 'Expense Head',
    descPlaceholder: 'e.g. Shop rent, electricity bill, tea, carriage',
    badgeColor: 'text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/50'
  }
};

export const normalizeVoucherType = (type?: string): string => {
  if (!type) return '';
  const t = type.trim();
  if (t === 'JV' || t.toLowerCase().includes('journal')) return 'Journal Voucher';
  if (t === 'CPV' || t.toLowerCase().includes('cash payment')) return 'Cash Payment Voucher';
  if (t === 'CRV' || t.toLowerCase().includes('cash receipt')) return 'Cash Receipt Voucher';
  if (t === 'BPV' || t.toLowerCase().includes('bank payment')) return 'Bank Payment Voucher';
  if (t === 'BRV' || t.toLowerCase().includes('bank receipt')) return 'Bank Receipt Voucher';
  return t;
};

export const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (['-', 'e', 'E', '+'].includes(e.key)) {
    e.preventDefault();
  }
};

export const buildInitialItems = (
  editData: any,
  presetMeta?: PresetMeta,
  activePreset?: string
): VoucherItem[] => {
  if (editData) {
    if (editData.items && Array.isArray(editData.items) && editData.items.length > 0) {
      return editData.items.filter((it: any) => it.accountCode !== '3010-001').map((it: any) => ({
        accountCode: it.accountCode || it.account_code || '',
        description: it.description !== undefined ? it.description : (editData.metadata?.particulars || (String(editData.narration || '').split(' | ')[0]) || ''),
        debit: Number(it.debit || 0),
        credit: Number(it.credit || 0)
      }));
    }
    const d = Number(editData.debit) || (editData.credit ? 0 : Number(editData.total_amount)) || 0;
    const c = Number(editData.credit) || 0;
    const parts = String(editData.narration || '').split(' | ');
    const desc = editData.metadata?.particulars !== undefined
      ? editData.metadata.particulars
      : (parts.length > 1 ? parts[0] : (editData.narration || ''));
    return [
      { accountCode: editData.account_code || '', description: desc, debit: d, credit: c }
    ];
  }

  if (presetMeta && presetMeta.isSingleRow) {
    return [
      { accountCode: '', description: '', debit: 0, credit: 0 }
    ];
  }

  if (activePreset === 'CRV') {
    return [
      { accountCode: '1010-001', description: 'Cash received from customer', debit: 0, credit: 0 },
      { accountCode: '', description: 'Payment on account', debit: 0, credit: 0 }
    ];
  }

  if (activePreset === 'CPV') {
    return [
      { accountCode: '', description: 'Refund paid to customer', debit: 0, credit: 0 },
      { accountCode: '1010-001', description: 'Cash disbursed from drawer', debit: 0, credit: 0 }
    ];
  }

  if (activePreset === 'VPV') {
    return [
      { accountCode: '', description: 'Vendor payment', debit: 0, credit: 0 },
      { accountCode: '1010-001', description: 'Cash disbursed to vendor', debit: 0, credit: 0 }
    ];
  }

  if (activePreset === 'VRV') {
    return [
      { accountCode: '1010-001', description: 'Cash refund received from vendor', debit: 0, credit: 0 },
      { accountCode: '', description: 'Vendor credit balance adjustment', debit: 0, credit: 0 }
    ];
  }

  if (activePreset === 'EXP') {
    return [
      { accountCode: '5020-001', description: 'Shop expense', debit: 0, credit: 0 },
      { accountCode: '1010-001', description: 'Paid via cash', debit: 0, credit: 0 }
    ];
  }

  return [
    { accountCode: '', description: '', debit: 0, credit: 0 },
    { accountCode: '', description: '', debit: 0, credit: 0 }
  ];
};
