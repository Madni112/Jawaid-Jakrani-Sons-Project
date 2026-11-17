export interface PurchaseStandardItem {
  itemName: string;
  skuCode: string;
  qty: number | string;
  rate: number | string;
  uom: string;
  warehouse: string;
  remarks?: string;
  discountPer?: number;
  discountAmt?: number;
  gstRate?: number;
  gstAmt?: number;
  pieceRate?: number | string;
  total?: number;
}

export interface PurchaseTileItem {
  id: string;
  itemName: string;
  skuCode: string;
  warehouse: string;
  boxQty: number | string;
  loosePcs: number | string;
  totalSqm: number;
  costPricePerBox: number;
  costPricePerPiece: number;
  costPricePerSqm: number;
  totalAmount: number;
  piecesPerBox: number;
  sqmPerBox: number;
}

export interface PurchaseFormValues {
  grnId: string | null;
  grnNo?: string | null;
  purchaseNo: string;
  supplierName: string;
  targetWarehouse: string;
  purchaseDate: string;
  refInvoiceNo: string;
  applyTax: boolean;
  showDiscount: boolean;
  showAdditionalCharges: boolean;
  additionalCharges: number;
  settlementMode: 'Cash' | 'Bank' | 'Split';
  selectedBankTitle: string;
  cashAmountPaid: number;
  bankAmountPaid: number;
  remarks: string;
  gatePasses: Record<string, any>;
  showTileSection: boolean;
  tileItems: PurchaseTileItem[];
  items: PurchaseStandardItem[];
}
