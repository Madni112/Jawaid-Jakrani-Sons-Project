export interface BankBalanceItem {
  id: string | number;
  bankName: string;
  accountTitle: string;
  accountNumber?: string;
  openingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  netBalance: number;
}

export interface TopStockProduct {
  id: string | number;
  name: string;
  qty: number;
  unitPrice: number;
  totalValuation: number;
}

export interface FinancialSummary {
  baseOpeningStockValue: number;
  totalPurchasesStockVal: number;
  totalSalesStockVal: number;
  totalSalesReturnsStockVal: number;
  totalPurchaseReturnsStockVal: number;
  totalStockUnits: number;
  topStockProducts: TopStockProduct[];
  cashBalance: number;
  totalCashInflow: number;
  totalCashOutflow: number;
  thisMonthCashInflow: number;
  thisMonthCashOutflow: number;
  totalBankBalance: number;
  thisMonthBankInflow: number;
  thisMonthBankOutflow: number;
  bankAccounts: BankBalanceItem[];
  todaysSales: number;
  thisMonthSales: number;
  thisMonthPurchases: number;
  totalReceivables: number;
  thisMonthReceivables: number;
  totalGrossReceivables: number;
  totalCustomerRecovered: number;
  totalPayables: number;
  thisMonthPayables: number;
  totalGrossPayables: number;
  totalVendorDisbursed: number;
  inventoryAssetValue: number;
  monthOpeningStockValue: number;
  thisMonthStockInflowVal: number;
  thisMonthStockOutflowVal: number;
  thisMonthStockMovement: number;
  totalAssets: number;
  thisMonthAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  monthlySalesTrend: { month: string; sales: number; purchases: number }[];
  cashFlowTrend: { month: string; inflow: number; outflow: number }[];
}
