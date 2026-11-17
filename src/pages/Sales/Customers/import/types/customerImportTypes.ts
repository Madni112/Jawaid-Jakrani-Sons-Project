export interface CustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ParsedCustomer {
  id: string;
  name: string;
  tier: string;
  phone: string;
  city: string;
  area: string;
  address: string;
  province: string;
  balance: number;
  balanceNature: 'Debit' | 'Credit';
  openingDate?: string;
  assignedCode?: string;
  isValid: boolean;
  validationError?: string;
  isExisting?: boolean;
  existingId?: string | number;
  existingBalance?: number;
  existingCity?: string;
  existingCode?: string;
}
