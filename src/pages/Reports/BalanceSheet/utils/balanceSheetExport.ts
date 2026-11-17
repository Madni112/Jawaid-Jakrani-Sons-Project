import { exportToExcel, ExcelColumn } from '../../../../utils/excelExport';
import { getBrandConfig } from '../../../../utils/brand';
import { FinancialSummary } from '../../../../service/financialCalculations';

export const exportBalanceSheetToExcel = async (
  activePerspective: 'summary' | 'balance_sheet',
  metrics: FinancialSummary,
  asOfDate: string,
  businessName?: string
) => {
  if (activePerspective === 'summary') {
    const columns: ExcelColumn[] = [
      { header: 'Commercial Metric / Dimension', key: 'metric', width: 34 },
      { header: 'Period / Account Group', key: 'category', width: 24 },
      { header: 'Primary Value (Rs. / Pcs)', key: 'value', width: 26, type: 'currency' },
      { header: 'Comparative Benchmark', key: 'benchmark', width: 28 },
      { header: 'Operational Status', key: 'status', width: 20 },
    ];

    const netLiquidFunds = (metrics.cashBalance || 0) + (metrics.totalBankBalance || 0);
    const netWorkingCapital = (metrics.totalReceivables || 0) - (metrics.totalPayables || 0);

    const exportData: any[] = [
      { isSectionHeader: true, sectionTitle: '1. HIGH-LEVEL COMMERCIAL EXECUTIVE KPIS' },
      {
        metric: 'Total Commercial Assets',
        category: 'Balance Sheet GAAP',
        value: metrics.totalAssets || 0,
        benchmark: 'Total Enterprise Asset Pool',
        status: 'Audited Active',
      },
      {
        metric: 'Total External Liabilities',
        category: 'Balance Sheet GAAP',
        value: metrics.totalLiabilities || 0,
        benchmark: 'Total Supplier Payables',
        status: 'Payable Due',
      },
      {
        metric: 'Net Owner Equity (Capital)',
        category: 'Balance Sheet GAAP',
        value: metrics.totalEquity || 0,
        benchmark: 'Assets minus Liabilities',
        status: 'Net Worth',
      },
      {
        metric: 'Immediate Liquid Funds (Cash + Bank)',
        category: 'Liquidity Pool',
        value: netLiquidFunds,
        benchmark: `Cash: Rs. ${Number(metrics.cashBalance || 0).toLocaleString()} | Bank: Rs. ${Number(
          metrics.totalBankBalance || 0
        ).toLocaleString()}`,
        status: 'Liquid Available',
      },
      {
        metric: 'Merchandise Inventory Stock Assets',
        category: 'Warehouse Holdings',
        value: metrics.inventoryAssetValue || 0,
        benchmark: 'Current Stock Valuation',
        status: 'On-Hand',
      },
      {
        metric: "Today's Gross Sales Revenue",
        category: 'Sales Cycle',
        value: metrics.todaysSales || 0,
        benchmark: 'Daily Billing Run',
        status: 'Real-time',
      },
      {
        metric: 'This Month Total Sales (MTD)',
        category: 'Sales Cycle',
        value: metrics.thisMonthSales || 0,
        benchmark: 'Monthly Revenue',
        status: 'MTD Realized',
      },
      {
        metric: 'This Month Procurement Purchases (MTD)',
        category: 'Procurement Cycle',
        value: metrics.thisMonthPurchases || 0,
        benchmark: 'Monthly Vendor Invoices',
        status: 'MTD Inflow',
      },
      {
        metric: 'Accounts Receivable (Client Debt)',
        category: 'Credit Exposure',
        value: metrics.totalReceivables || 0,
        benchmark: 'Outstanding Invoices',
        status: 'Pending Recovery',
      },
      {
        metric: 'Accounts Payable (Vendor Debt)',
        category: 'Credit Exposure',
        value: metrics.totalPayables || 0,
        benchmark: 'Outstanding Supplier Invoices',
        status: 'Pending Payment',
      },
      {
        metric: 'Net Working Capital Exposure',
        category: 'Working Capital',
        value: netWorkingCapital,
        benchmark: 'Receivables minus Payables',
        status: netWorkingCapital >= 0 ? 'Surplus Positive' : 'Deficit Watch',
      },

      { isSectionHeader: true, sectionTitle: '2. CORPORATE BANK ACCOUNTS AUDIT LEDGER' },
      ...(metrics.bankAccounts || []).map((b) => ({
        metric: `🏦 ${b.bankName} (${b.accountTitle})`,
        category: b.accountNumber ? `A/C #${b.accountNumber}` : 'General Account',
        value: b.netBalance || 0,
        benchmark: `Inflow: Rs. ${Number(b.totalInflow || 0).toLocaleString()} | Outflow: Rs. ${Number(
          b.totalOutflow || 0
        ).toLocaleString()}`,
        status: 'Active',
      })),

      { isSectionHeader: true, sectionTitle: '3. 6-MONTH COMMERCIAL REVENUE & PROCUREMENT TRAJECTORY' },
      ...(metrics.monthlySalesTrend || []).map((tr) => ({
        metric: `Month: ${tr.month}`,
        category: 'Sales vs Purchases',
        value: tr.sales || 0,
        benchmark: `Purchases Outlay: Rs. ${Number(tr.purchases || 0).toLocaleString()}`,
        status: tr.sales - tr.purchases >= 0 ? 'Profitable Net +' : 'Negative Inflow',
      })),
    ];

    await exportToExcel({
      fileName: `Commercial_Executive_Summary_${asOfDate}.xlsx`,
      sheetName: 'Executive Summary',
      companyName: businessName || getBrandConfig().fullName,
      reportTitle: `Commercial Executive Performance Statement (As of ${asOfDate})`,
      filterSummary: {
        'As Of Date': asOfDate,
        Perspective: 'Commercial Executive Summary & Corporate Trajectory',
        'Statement Type': 'Executive Briefing Memo',
      },
      columns,
      data: exportData,
      summaryRow: false,
      theme: 'emerald',
    });
  } else {
    // Standard Balance Sheet Excel
    const columns: ExcelColumn[] = [
      { header: 'Account Classification Code', key: 'code', width: 24 },
      { header: 'Account Description / Group', key: 'title', width: 38 },
      { header: 'Category Type', key: 'category', width: 18 },
      { header: 'Debit Balance (Rs.)', key: 'debit', width: 22, type: 'currency' },
      { header: 'Credit Balance (Rs.)', key: 'credit', width: 22, type: 'currency' },
    ];

    const exportData = [
      {
        code: '1010',
        title: 'Cash Box & Liquid App Drawer',
        category: 'ASSET',
        debit: metrics.cashBalance || 0,
        credit: 0,
      },
      {
        code: '1020',
        title: 'Corporate Bank Ledger Accounts',
        category: 'ASSET',
        debit: metrics.totalBankBalance || 0,
        credit: 0,
      },
      {
        code: '1030',
        title: 'Accounts Receivable (Customers Debt)',
        category: 'ASSET',
        debit: metrics.totalReceivables || 0,
        credit: 0,
      },
      {
        code: '1040',
        title: 'Merchandise Inventory Stock Assets',
        category: 'ASSET',
        debit: metrics.inventoryAssetValue || 0,
        credit: 0,
      },
      {
        code: 'TOTAL ASSETS',
        title: 'TOTAL COMMERCIAL ASSETS',
        category: 'ASSETS TOTAL',
        debit: metrics.totalAssets || 0,
        credit: 0,
      },
      {
        code: '2010',
        title: 'Accounts Payable (Supplier Unpaid Bills)',
        category: 'LIABILITY',
        debit: 0,
        credit: metrics.totalPayables || 0,
      },
      {
        code: 'TOTAL LIAB',
        title: 'TOTAL LIABILITIES',
        category: 'LIABILITIES TOTAL',
        debit: 0,
        credit: metrics.totalLiabilities || 0,
      },
      {
        code: '3010',
        title: 'Owner Equity & Retained Earnings',
        category: 'EQUITY',
        debit: 0,
        credit: metrics.totalEquity || 0,
      },
      {
        code: 'TOTAL LIAB+EQ',
        title: 'TOTAL LIABILITIES & EQUITY',
        category: 'BALANCE TOTAL',
        debit: 0,
        credit: (metrics.totalLiabilities || 0) + (metrics.totalEquity || 0),
      },
    ];

    await exportToExcel({
      fileName: `Corporate_Balance_Sheet_${asOfDate}.xlsx`,
      sheetName: 'Balance Sheet',
      companyName: businessName || getBrandConfig().fullName,
      reportTitle: `Corporate GAAP Balance Sheet Statement (As of ${asOfDate})`,
      filterSummary: {
        'As Of Date': asOfDate,
        'Accounting Standard': 'GAAP (Assets = Liabilities + Equity)',
      },
      columns,
      data: exportData,
      summaryRow: false,
      theme: 'emerald',
    });
  }
};
