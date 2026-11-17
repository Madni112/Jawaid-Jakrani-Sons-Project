export interface SalesReturnStandardItem {
  skuCode: string;
  itemName: string;
  warehouse: string;
  qty: number | string;
  rate: number | string;
  uom: string;
  discountPer?: number;
  discountAmt?: number;
  total?: number;
}

export interface SalesReturnTileItem {
  skuCode?: string;
  itemName: string;
  warehouse: string;
  boxQty: number | string;
  loosePcs: number | string;
  piecesPerBox: number;
  sqmPerBox: number;
  pricePerBox: number;
  pricePerPiece: number;
  pricePerSqm: number;
  totalAmount: number;
  totalSqm: number;
  isTileItem?: boolean;
}

export interface SalesReturnFormValues {
  returnNo: string;
  customerName: string;
  sourceWarehouse: string;
  invoiceNo: string;
  gatePassNo: string;
  gatePasses: Record<string, string>;
  returnDate: string;
  paymentTerm: string;
  selectedBankId: string;
  amountPaid: number;
  cashAmountPaid: number | string;
  bankAmountPaid: number | string;
  remarks: string;
  showTileSection: boolean;
  tileItems: SalesReturnTileItem[];
  items: SalesReturnStandardItem[];
}
