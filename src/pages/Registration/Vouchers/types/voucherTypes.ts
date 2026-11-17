export interface AddVoucherProps {
  voucherTypePreset?: 'SAV' | 'SRV' | 'CRV' | 'CPV' | 'PAV' | 'PRV' | 'VPV' | 'VRV' | 'EXP' | string;
}

export interface PresetMeta {
  title: string;
  prefix: string;
  typeName: string;
  listRoute: string;
  isSingleRow: boolean;
  defaultDebitOrCredit: 'Debit' | 'Credit';
  amountLabel: string;
  partyLabel: string;
  descPlaceholder: string;
  badgeColor: string;
  badgeBg: string;
}

export interface PartyMetadata {
  id?: string | number;
  raw?: any;
  code: string;
  name: string;
  type: string;
  phone: string;
  city: string;
  address: string;
  currentBalance: number;
  balanceNature: string;
}

export interface VoucherItem {
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
}

export interface VoucherFormValues {
  voucherNo: string;
  voucherType: string;
  voucherDate: string;
  notes: string;
  items: VoucherItem[];
}
