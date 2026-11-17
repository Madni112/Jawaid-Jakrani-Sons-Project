export interface ReceivableInvoice {
  id: string | number;
  invoiceNo: string;
  customerName: string;
  salesman: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  daysPending: number;
}

export interface PayableVendor {
  id: string | number;
  vendorCode: string;
  vendorName: string;
  city: string;
  phone: string;
  outstandingBalance: number;
}

export interface TrendingProduct {
  id: string | number;
  name: string;
  category: string;
  sku: string;
  totalRevenue: number;
  unitsSold: number;
  transactionCount: number;
  percentageOfTotal: number;
}

export interface LowStockAlert {
  id: string | number;
  name: string;
  category: string;
  warehouse: string;
  currentStock: number;
  minLimit: number;
  deficit: number;
  unit: string;
}

export interface HoldingItemData {
  id: string;
  dcId: number | string;
  gatepassNo: string;
  invoiceNo: string;
  customerName: string;
  salesman: string;
  warehouseGuy: string;
  productName: string;
  orderQty: number;
  dispatchedQty: number;
  holdQty: number;
  rate: number;
  heldAmount: number;
  date: string;
}

export interface CashTransaction {
  id: string | number;
  date: string;
  type: 'Inflow' | 'Outflow';
  source: string;
  party: string;
  amount: number;
  description: string;
}
