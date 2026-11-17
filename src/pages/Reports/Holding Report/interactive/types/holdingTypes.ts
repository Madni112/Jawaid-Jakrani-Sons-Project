export type ViewPerspective = 'detailed' | 'salesman' | 'gatepass' | 'invoice' | 'customer';

export interface HoldingItemRow {
  id: string;
  dcId: number | string;
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

export interface HoldingKpis {
  totalItems: number;
  totalHeldQty: number;
  totalHeldValue: number;
  totalOrderQty: number;
  totalOrderValue: number;
  uniqueGatepasses: number;
  uniqueInvoices: number;
  uniqueCustomers: number;
  uniqueSalesmen: number;
}

export interface SalesmanSummaryItem {
  salesman: string;
  itemsCount: number;
  totalHeldQty: number;
  totalHeldValue: number;
  custCount: number;
  invCount: number;
  items: HoldingItemRow[];
}

export interface CustomerSummaryItem {
  customer: string;
  itemsCount: number;
  totalHeldQty: number;
  totalHeldValue: number;
  gpCount: number;
  invCount: number;
  items: HoldingItemRow[];
}

export interface GatepassSummaryItem {
  gatepassNo: string;
  customer: string;
  salesman: string;
  date: string;
  itemsCount: number;
  totalOrderQty: number;
  totalDispatchedQty: number;
  totalHeldQty: number;
  totalHeldValue: number;
  status: string;
  items: HoldingItemRow[];
}

export interface InvoiceSummaryItem {
  invoiceNo: string;
  customer: string;
  salesman: string;
  date: string;
  itemsCount: number;
  totalHeldQty: number;
  totalHeldValue: number;
  totalOrderAmount: number;
  items: HoldingItemRow[];
}
