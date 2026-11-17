import { PosOrder, PosSettings } from '../../../../service/posService';

export interface POSOrdersProps {
  embedded?: boolean;
  defaultStatus?: string;
  isReturnsOnly?: boolean;
  onBack?: () => void;
}

export interface RefundItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  original_qty: number;
  return_qty: number;
  selected: boolean;
}

export interface POSOrderStats {
  totalRev: number;
  cashTotal: number;
  cardTotal: number;
  digitalTotal: number;
  avgTicket: number;
  count: number;
}

export type DateFilterMode = 'All' | 'Today' | 'Yesterday' | 'Last7Days' | 'Custom';
