export interface PurchaseReturnStandardItem {
  itemName: string;
  sku: string;
  warehouse: string;
  qty: number | string;
  rate: number | string;
  amount: number | string;
  uom: string;
  remarks?: string;
  isTileItem?: boolean;
}

export interface PurchaseReturnTileItem {
  id?: string;
  itemName: string;
  skuCode?: string;
  sku?: string;
  warehouse: string;
  boxQty: number | string;
  loosePcs: number | string;
  piecesPerBox: number;
  sqmPerBox: number;
  costPricePerBox: number;
  costPricePerPiece: number;
  costPricePerSqm: number;
  totalAmount: number;
  totalSqm: number;
  isTileItem?: boolean;
}

export interface PurchaseReturnFormValues {
  returnNo: string;
  vendorName: string;
  sourceWarehouse: string;
  purchaseNo: string;
  returnDate: string;
  settlementMode: 'Adjust Outstanding' | 'Cash' | 'Bank' | 'Split';
  selectedBankTitle: string;
  cashRefundAmount: number;
  bankRefundAmount: number;
  additionalCharges: number;
  remarks: string;
  gatePasses: Record<string, string>;
  showTileSection: boolean;
  tileItems: PurchaseReturnTileItem[];
  items: PurchaseReturnStandardItem[];
}
