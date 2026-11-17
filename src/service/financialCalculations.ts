import { supabase, fetchAllPages } from '../Context/supabaseClient';
import { BankBalanceItem, TopStockProduct, FinancialSummary } from './financial/types';
import { recalculateInvoiceSettlementStatus } from './financial/invoiceSettlement';
import { calculateCashAndBankFlows } from './financial/cashAndBankCalculations';
import { calculateReceivablesAndPayables } from './financial/receivablesAndPayables';
import {
  calculateInventoryValuationAndTrends,
  calculateFinancialTrends
} from './financial/inventoryValuation';

// Re-export types and standalone helper functions
export type { BankBalanceItem, TopStockProduct, FinancialSummary };
export { recalculateInvoiceSettlementStatus };

export const fetchFinancialMetrics = async (): Promise<FinancialSummary> => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfCurrentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;

    const isThisMonth = (dateStr?: string | null) => {
      if (!dateStr) return false;
      const clean = String(dateStr).split('T')[0];
      if (clean >= startOfCurrentMonthStr) return true;
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    };

    // 1. Fetch data from Supabase tables & RPC in parallel with full fault tolerance
    const [
      salesInvoicesRes,
      supplierPurchasesRes,
      salesReturnsRes,
      salesReturnReceiptsRes,
      purchaseReturnsRes,
      purchaseReturnReceiptsRes,
      vouchersRes,
      banksRes,
      productsRes,
      customerReceiptsRes,
      openStocksRes,
      customersRes
    ] = await Promise.allSettled([
      fetchAllPages(supabase.from('sales_invoices').select('*')),
      fetchAllPages(supabase.from('supplier_purchases').select('*')),
      fetchAllPages(supabase.from('sales_returns').select('*')),
      fetchAllPages(supabase.from('sales_return_receipts').select('*')),
      fetchAllPages(supabase.from('purchase_returns').select('*')),
      fetchAllPages(supabase.from('purchase_return_receipts').select('*')),
      fetchAllPages(supabase.from('financial_vouchers').select('*')),
      fetchAllPages(supabase.from('banks').select('*')),
      fetchAllPages(supabase.from('products').select('*')),
      fetchAllPages(supabase.from('customer_recoveries').select('*')),
      fetchAllPages(supabase.from('opening_stocks').select('*')),
      fetchAllPages(supabase.from('customers').select('*'))
    ]);

    const invoicesList =
      salesInvoicesRes.status === 'fulfilled' && Array.isArray(salesInvoicesRes.value.data)
        ? salesInvoicesRes.value.data
        : [];
    const purchasesList =
      supplierPurchasesRes.status === 'fulfilled' && Array.isArray(supplierPurchasesRes.value.data)
        ? supplierPurchasesRes.value.data
        : [];
    const salesReturnsList =
      salesReturnsRes.status === 'fulfilled' && Array.isArray(salesReturnsRes.value.data)
        ? salesReturnsRes.value.data
        : [];
    const salesReturnRecList =
      salesReturnReceiptsRes.status === 'fulfilled' && Array.isArray(salesReturnReceiptsRes.value.data)
        ? salesReturnReceiptsRes.value.data
        : [];
    const purchaseReturnsList =
      purchaseReturnsRes.status === 'fulfilled' && Array.isArray(purchaseReturnsRes.value.data)
        ? purchaseReturnsRes.value.data
        : [];
    const purchaseReturnRecList =
      purchaseReturnReceiptsRes.status === 'fulfilled' &&
      Array.isArray(purchaseReturnReceiptsRes.value.data)
        ? purchaseReturnReceiptsRes.value.data
        : [];
    const vouchersList =
      vouchersRes.status === 'fulfilled' && Array.isArray(vouchersRes.value.data)
        ? vouchersRes.value.data
        : [];
    const banksList =
      banksRes.status === 'fulfilled' && Array.isArray(banksRes.value.data) ? banksRes.value.data : [];
    const productsList =
      productsRes.status === 'fulfilled' && Array.isArray(productsRes.value.data)
        ? productsRes.value.data
        : [];
    const customerRecList =
      customerReceiptsRes.status === 'fulfilled' && Array.isArray(customerReceiptsRes.value.data)
        ? customerReceiptsRes.value.data
        : [];
    const openStocksList =
      openStocksRes.status === 'fulfilled' && Array.isArray(openStocksRes.value.data)
        ? openStocksRes.value.data
        : [];
    const customersList =
      customersRes.status === 'fulfilled' && Array.isArray(customersRes.value.data)
        ? customersRes.value.data
        : [];

    // --- 2. Calculate Today's & Monthly Net Sales & Purchases ---
    let todaysSales = 0;
    let thisMonthSales = 0;

    invoicesList.forEach((inv: any) => {
      const invAmt = Number(inv.total_amount || 0);
      const invDateStr = String(inv.created_at || inv.invoice_date || '').split('T')[0];

      if (invDateStr === todayStr) {
        todaysSales += invAmt;
      }

      if (invDateStr) {
        const d = new Date(invDateStr);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          thisMonthSales += invAmt;
        }
      }
    });

    salesReturnsList.forEach((ret: any) => {
      const retAmt = Number(ret.total_amount || ret.total_net_amount || 0);
      const retDateStr = String(ret.created_at || ret.return_date || '').split('T')[0];

      if (retDateStr === todayStr) {
        todaysSales -= retAmt;
      }

      if (retDateStr) {
        const d = new Date(retDateStr);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          thisMonthSales -= retAmt;
        }
      }
    });

    todaysSales = Math.max(0, todaysSales);
    thisMonthSales = Math.max(0, thisMonthSales);

    let thisMonthPurchases = 0;
    purchasesList.forEach((pur: any) => {
      const purAmt = Number(pur.total_amount || 0);
      const purDateStr = String(pur.created_at || pur.purchase_date || '').split('T')[0];
      if (purDateStr) {
        const d = new Date(purDateStr);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          thisMonthPurchases += purAmt;
        }
      }
    });

    purchaseReturnsList.forEach((pret: any) => {
      const pretAmt = Number(pret.total_amount || pret.total_net_amount || 0);
      const pretDateStr = String(pret.created_at || pret.return_date || '').split('T')[0];
      if (pretDateStr) {
        const d = new Date(pretDateStr);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          thisMonthPurchases -= pretAmt;
        }
      }
    });
    thisMonthPurchases = Math.max(0, thisMonthPurchases);

    // --- 3. Cash and Bank Balances ---
    const cashBankResult = calculateCashAndBankFlows({
      invoicesList,
      purchasesList,
      salesReturnsList,
      salesReturnRecList,
      purchaseReturnsList,
      purchaseReturnRecList,
      vouchersList,
      banksList,
      customerRecList,
      isThisMonth
    });

    // --- 4. Receivables and Payables ---
    const recPayResult = calculateReceivablesAndPayables({
      invoicesList,
      purchasesList,
      salesReturnsList,
      purchaseReturnsList,
      vouchersList,
      customersList,
      isThisMonth
    });

    // --- 5. Inventory Asset Valuation ---
    const inventoryResult = calculateInventoryValuationAndTrends({
      productsList,
      openStocksList,
      purchasesList,
      invoicesList,
      salesReturnsList,
      purchaseReturnsList,
      startOfCurrentMonthStr
    });

    // --- 6. Balance Sheet Equation Totals ---
    const totalAssets =
      cashBankResult.netCashBalance +
      cashBankResult.totalBankBalance +
      recPayResult.totalReceivables +
      inventoryResult.inventoryAssetValue;
    const thisMonthAssets = inventoryResult.thisMonthStockMovement;
    const totalLiabilities = recPayResult.totalPayables;
    const totalEquity = totalAssets - totalLiabilities;

    // --- 7. Trends ---
    const { monthlySalesTrend, cashFlowTrend } = calculateFinancialTrends({
      invoicesList,
      salesReturnsList,
      purchasesList,
      purchaseReturnsList,
      currentYear,
      currentMonth
    });

    return {
      cashBalance: cashBankResult.netCashBalance,
      totalCashInflow: cashBankResult.cashInflow,
      totalCashOutflow: cashBankResult.cashOutflow,
      thisMonthCashInflow: cashBankResult.thisMonthCashInflow,
      thisMonthCashOutflow: cashBankResult.thisMonthCashOutflow,
      totalBankBalance: cashBankResult.totalBankBalance,
      thisMonthBankInflow: cashBankResult.thisMonthBankInflow,
      thisMonthBankOutflow: cashBankResult.thisMonthBankOutflow,
      bankAccounts: cashBankResult.bankAccountsList,
      todaysSales,
      thisMonthSales,
      thisMonthPurchases,
      totalReceivables: recPayResult.totalReceivables,
      thisMonthReceivables: recPayResult.thisMonthReceivables,
      totalGrossReceivables: recPayResult.totalGrossReceivables,
      totalCustomerRecovered: recPayResult.totalCustomerRecovered,
      totalPayables: recPayResult.totalPayables,
      thisMonthPayables: recPayResult.thisMonthPayables,
      totalGrossPayables: recPayResult.totalGrossPayables,
      totalVendorDisbursed: recPayResult.totalVendorDisbursed,
      inventoryAssetValue: inventoryResult.inventoryAssetValue,
      monthOpeningStockValue: inventoryResult.monthOpeningStockValue,
      thisMonthStockInflowVal: inventoryResult.thisMonthStockInflowVal,
      thisMonthStockOutflowVal: inventoryResult.thisMonthStockOutflowVal,
      thisMonthStockMovement: inventoryResult.thisMonthStockMovement,
      baseOpeningStockValue: inventoryResult.baseOpeningStockValue,
      totalPurchasesStockVal: inventoryResult.totalPurchasesStockVal,
      totalSalesStockVal: inventoryResult.totalSalesStockVal,
      totalSalesReturnsStockVal: inventoryResult.totalSalesReturnsStockVal,
      totalPurchaseReturnsStockVal: inventoryResult.totalPurchaseReturnsStockVal,
      totalStockUnits: inventoryResult.totalStockUnits,
      topStockProducts: inventoryResult.topStockProducts,
      totalAssets,
      thisMonthAssets,
      totalLiabilities,
      totalEquity,
      monthlySalesTrend,
      cashFlowTrend
    };
  } catch (err) {
    console.error('Error calculating financial metrics:', err);
    return {
      cashBalance: 0,
      totalCashInflow: 0,
      totalCashOutflow: 0,
      thisMonthCashInflow: 0,
      thisMonthCashOutflow: 0,
      totalBankBalance: 0,
      thisMonthBankInflow: 0,
      thisMonthBankOutflow: 0,
      bankAccounts: [],
      todaysSales: 0,
      thisMonthSales: 0,
      thisMonthPurchases: 0,
      totalReceivables: 0,
      thisMonthReceivables: 0,
      totalGrossReceivables: 0,
      totalCustomerRecovered: 0,
      totalPayables: 0,
      thisMonthPayables: 0,
      totalGrossPayables: 0,
      totalVendorDisbursed: 0,
      inventoryAssetValue: 0,
      monthOpeningStockValue: 0,
      thisMonthStockInflowVal: 0,
      thisMonthStockOutflowVal: 0,
      thisMonthStockMovement: 0,
      baseOpeningStockValue: 0,
      totalPurchasesStockVal: 0,
      totalSalesStockVal: 0,
      totalSalesReturnsStockVal: 0,
      totalPurchaseReturnsStockVal: 0,
      totalStockUnits: 0,
      topStockProducts: [],
      totalAssets: 0,
      thisMonthAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      monthlySalesTrend: [],
      cashFlowTrend: []
    };
  }
};
