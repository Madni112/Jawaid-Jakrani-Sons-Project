import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface ExportParams {
  activeTab: string;
  fromDate: string;
  toDate: string;
  customerLedgerRows: any[];
  vendorLedgerRows: any[];
  filteredCombinedRows: any[];
  filteredExpenseRows: any[];
  dailyBookRows: any[];
  dailyActivityRows?: any[];
  dailyActivityDateMode?: 'single' | 'range';
  pnlData: any;
  pnlBasis: string;
  pnlIncludeOB: boolean;
}

export const exportMainReportToExcel = ({
  activeTab,
  fromDate,
  toDate,
  customerLedgerRows,
  vendorLedgerRows,
  filteredCombinedRows,
  filteredExpenseRows,
  dailyBookRows,
  dailyActivityRows = [],
  dailyActivityDateMode = 'single',
  pnlData,
  pnlBasis,
  pnlIncludeOB
}: ExportParams) => {
  let exportData: any[] = [];
  const filename = `Report_${activeTab}_${fromDate}_${toDate}.xlsx`;

  if (activeTab === 'customer-ledger') {
    exportData = customerLedgerRows.map(r => ({
      'S#': r.index,
      'Date': r.date,
      'Ref / Doc #': r.refNo,
      'Customer Name (Code)': `${r.partyName} (${r.accountCode})`,
      'City': r.city || '',
      'Area': r.area || '',
      'Entry Type': r.entryType,
      'Sales (Dr)': r.sales,
      'Return (Cr)': r.returns,
      'Received (Cr)': r.received,
      'Running Balance': r.runningBalance
    }));
  } else if (activeTab === 'vendor-ledger') {
    exportData = vendorLedgerRows.map(r => ({
      'S#': r.index,
      'Date': r.date,
      'Ref / Doc #': r.refNo,
      'Vendor Name (Code)': `${r.partyName} (${r.accountCode})`,
      'City': r.city || '',
      'Area': r.area || '',
      'Entry Type': r.entryType,
      'Purchase (Cr)': r.purchases,
      'Return (Dr)': r.returns,
      'Payment (Dr)': r.payments,
      'Running Balance': r.runningBalance
    }));
  } else if (activeTab === 'combined-ledger') {
    exportData = filteredCombinedRows.map((r, i) => ({
      'S#': i + 1,
      'Date': r.date,
      'Ref / Doc #': r.refNo,
      'Party Name': r.partyName,
      'Party Type': r.partyType,
      'Code': r.accountCode,
      'City': r.city,
      'Area': r.area,
      'Entry Type': r.entryType,
      'Debit (Dr)': r.debit,
      'Credit (Cr)': r.credit,
      'Running Balance': r.runningBalance
    }));
  } else if (activeTab === 'profit-loss' && pnlData) {
    if (pnlBasis === 'cash') {
      exportData = [
        { 'Calculation Basis': 'Cash Basis (Realized Pocket Profit)', 'Line Item': 'Cash Collected / Received from Customers', 'Amount (PKR)': pnlData.cashFromCustomers },
        { 'Calculation Basis': 'Cash Basis (Realized Pocket Profit)', 'Line Item': 'Less: Cash Paid to Suppliers / Vendors', 'Amount (PKR)': -pnlData.cashPaidToVendors },
        { 'Calculation Basis': 'Cash Basis (Realized Pocket Profit)', 'Line Item': 'Net Trading Cash Generated', 'Amount (PKR)': pnlData.cashFromCustomers - pnlData.cashPaidToVendors },
        ...Object.entries(pnlData.expenseMap).map(([k, v]) => ({
          'Calculation Basis': 'Cash Basis (Realized Pocket Profit)',
          'Line Item': `Operating Expense: ${k}`,
          'Amount (PKR)': -Number(v)
        })),
        { 'Calculation Basis': 'Cash Basis (Realized Pocket Profit)', 'Line Item': 'Total Operating Expenses Paid', 'Amount (PKR)': -pnlData.totalExpenses },
        { 'Calculation Basis': 'Cash Basis (Realized Pocket Profit)', 'Line Item': 'Net Realized Cash Profit / (Loss)', 'Amount (PKR)': pnlData.netCashProfit },
        { 'Calculation Basis': 'Market Standing', 'Line Item': pnlIncludeOB ? 'Total Customer Receivables (Including Prior OB)' : 'Period Customer Receivables (Excluding Prior OB)', 'Amount (PKR)': pnlIncludeOB ? pnlData.totalReceivables : (pnlData.periodReceivables ?? (pnlData.periodSales - pnlData.periodSalesReturns - pnlData.cashFromCustomers)) },
        { 'Calculation Basis': 'Market Standing', 'Line Item': pnlIncludeOB ? 'Less: Total Vendor Payables (Including Prior OB)' : 'Less: Period Vendor Payables (Excluding Prior OB)', 'Amount (PKR)': -(pnlIncludeOB ? pnlData.totalPayables : (pnlData.periodPayables ?? (pnlData.periodCogs - pnlData.cashPaidToVendors))) },
        { 'Calculation Basis': 'Market Standing', 'Line Item': 'Net Market Outstanding Position', 'Amount (PKR)': (pnlIncludeOB ? pnlData.totalReceivables : (pnlData.periodReceivables ?? (pnlData.periodSales - pnlData.periodSalesReturns - pnlData.cashFromCustomers))) - (pnlIncludeOB ? pnlData.totalPayables : (pnlData.periodPayables ?? (pnlData.periodCogs - pnlData.cashPaidToVendors))) }
      ];
    } else {
      const effGrossSales = pnlData.periodSales + (pnlIncludeOB ? pnlData.customerOB : 0);
      const effCOGS = pnlData.periodCogs + (pnlIncludeOB ? pnlData.vendorOB : 0);
      const effNetSales = Math.max(0, effGrossSales - pnlData.periodSalesReturns);
      const effGrossProfit = effNetSales - effCOGS;
      const effNetProfit = effGrossProfit - pnlData.totalExpenses;

      exportData = [
        ...(pnlIncludeOB ? [
          { 'Calculation Basis': 'Accrual Basis (Trading P&L)', 'Line Item': 'Customer Opening Balance (Prior Sales)', 'Amount (PKR)': pnlData.customerOB },
          { 'Calculation Basis': 'Accrual Basis (Trading P&L)', 'Line Item': 'Period Sales Revenue (SAV & Invoices)', 'Amount (PKR)': pnlData.periodSales }
        ] : []),
        { 'Calculation Basis': 'Accrual Basis (Trading P&L)', 'Line Item': 'Gross Sales Revenue', 'Amount (PKR)': effGrossSales },
        { 'Calculation Basis': 'Accrual Basis (Trading P&L)', 'Line Item': 'Less: Sales Returns (SRV)', 'Amount (PKR)': -pnlData.periodSalesReturns },
        { 'Calculation Basis': 'Accrual Basis (Trading P&L)', 'Line Item': 'Net Sales Turnover', 'Amount (PKR)': effNetSales },
        ...(pnlIncludeOB && pnlData.vendorOB > 0 ? [
          { 'Calculation Basis': 'Accrual Basis (Trading P&L)', 'Line Item': 'Vendor Opening Balance (Prior Purchases)', 'Amount (PKR)': -pnlData.vendorOB },
          { 'Calculation Basis': 'Accrual Basis (Trading P&L)', 'Line Item': 'Period Purchases / Material (PAV)', 'Amount (PKR)': -pnlData.periodCogs }
        ] : []),
        { 'Calculation Basis': 'Accrual Basis (Trading P&L)', 'Line Item': 'Cost of Goods Sold (Purchases / Material)', 'Amount (PKR)': -effCOGS },
        { 'Calculation Basis': 'Accrual Basis (Trading P&L)', 'Line Item': 'Gross Trading Profit', 'Amount (PKR)': effGrossProfit },
        ...Object.entries(pnlData.expenseMap).map(([k, v]) => ({
          'Calculation Basis': 'Accrual Basis (Trading P&L)',
          'Line Item': `Operating Expense: ${k}`,
          'Amount (PKR)': -Number(v)
        })),
        { 'Calculation Basis': 'Accrual Basis (Trading P&L)', 'Line Item': 'Total Operating Expenses', 'Amount (PKR)': -pnlData.totalExpenses },
        { 'Calculation Basis': 'Accrual Basis (Trading P&L)', 'Line Item': 'Net Trading Profit / (Loss)', 'Amount (PKR)': effNetProfit },
        { 'Calculation Basis': 'Market Standing', 'Line Item': pnlIncludeOB ? 'Total Customer Receivables (Including Prior OB)' : 'Period Customer Receivables (Excluding Prior OB)', 'Amount (PKR)': pnlIncludeOB ? pnlData.totalReceivables : (pnlData.periodReceivables ?? (pnlData.periodSales - pnlData.periodSalesReturns - pnlData.cashFromCustomers)) },
        { 'Calculation Basis': 'Market Standing', 'Line Item': pnlIncludeOB ? 'Less: Total Vendor Payables (Including Prior OB)' : 'Less: Period Vendor Payables (Excluding Prior OB)', 'Amount (PKR)': -(pnlIncludeOB ? pnlData.totalPayables : (pnlData.periodPayables ?? (pnlData.periodCogs - pnlData.cashPaidToVendors))) },
        { 'Calculation Basis': 'Market Standing', 'Line Item': 'Net Market Outstanding Position', 'Amount (PKR)': (pnlIncludeOB ? pnlData.totalReceivables : (pnlData.periodReceivables ?? (pnlData.periodSales - pnlData.periodSalesReturns - pnlData.cashFromCustomers))) - (pnlIncludeOB ? pnlData.totalPayables : (pnlData.periodPayables ?? (pnlData.periodCogs - pnlData.cashPaidToVendors))) }
      ];
    }
  } else if (activeTab === 'expense-report') {
    exportData = filteredExpenseRows.map(r => ({
      'S#': r.index,
      'Date': r.date,
      'Voucher #': r.voucherNo,
      'Chart of Accounts': r.coaCodeTitle,
      'Paid Via': r.paidVia,
      'Amount (PKR)': r.amount
    }));
  } else if (activeTab === 'daily-book') {
    exportData = dailyBookRows.map(r => ({
      'S#': r.index,
      'Date': r.date,
      'Voucher / Ref #': r.voucherNo,
      'Account Title (Code)': r.accountCode ? `${r.accountTitle} (${r.accountCode})` : r.accountTitle,
      'Entry Type': r.entryType,
      'Payment Mode': r.paymentMode,
      'Cash / Bank In (Dr)': r.cashIn,
      'Cash / Bank Out (Cr)': r.cashOut,
      'Net Drawer Cash': r.netDrawerCash
    }));
  } else if (activeTab === 'daily-activity') {
    const groupTitles: Record<string, string> = {
      sales: '1. Sales & Customer Returns',
      purchases: '2. Purchases & Vendor Returns',
      customer_receipts: '3. Customer Receipts',
      vendor_payments: '4. Vendor Payments',
      stock_movements: '5. Stock Movements (In/Out)',
      expenses: '6. Operational Expenses'
    };

    exportData = dailyActivityRows.map((r, idx) => {
      const rowData: Record<string, any> = {
        'S#': idx + 1,
        'Business Group': groupTitles[r.hierarchyGroup] || 'Other'
      };
      if (dailyActivityDateMode === 'range') {
        rowData['Date'] = r.date;
      }
      rowData['Time'] = r.time;
      rowData['Event Type'] = r.type;
      rowData['Ref / Doc #'] = r.refNo;
      rowData['Party / Account'] = r.partyName;
      rowData['Party Type'] = r.partyType;
      rowData['Activity Details'] = r.details;
      rowData['Warehouse'] = r.warehouse || '—';
      rowData['Value (PKR)'] = r.amount;
      rowData['Status'] = r.status;
      return rowData;
    });
  }

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, filename);
  toast.success('Downloaded ' + filename);
};
