export interface HoldingItemRow {
  id: string;
  dcId: number;
  gatepassNo: string;
  invoiceNo: string;
  customerName: string;
  salesman: string;
  productName: string;
  skuCode: string;
  warehouse: string;
  orderQty: number;
  dispatchedQty: number;
  holdQty: number;
  rate: number;
  totalOrderAmount: number;
  heldAmount: number;
  date: string;
  status: string;
  uom: string;
}

export interface CustomerDetails {
  code: string;
  pageNo: string;
}
