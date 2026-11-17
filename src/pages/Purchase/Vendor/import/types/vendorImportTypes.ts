export interface VendorImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ParsedVendor {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  city: string;
  area: string;
  address: string;
  province: string;
  pageNo: string;
  balance: number;
  balanceNature: 'Credit' | 'Debit';
  isValid: boolean;
  validationError?: string;
  isExisting?: boolean;
  existingId?: string | number;
  existingBalance?: number;
  existingCity?: string;
}
