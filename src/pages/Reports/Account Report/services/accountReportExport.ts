import { toast } from 'react-hot-toast';
import { exportToExcel, ExcelColumn } from '../../../../utils/excelExport';
import { getBrandConfig } from '../../../../utils/brand';

interface AccountReportExportParams {
    reportRows: any[];
    activeTab: number;
    activeViewMode: 'summary' | 'detailed';
    businessName: string | null;
    setExporting: (exporting: boolean) => void;
}

export const exportAccountReportToExcel = async ({
    reportRows,
    activeTab,
    activeViewMode,
    businessName,
    setExporting
}: AccountReportExportParams) => {
    if (!reportRows || reportRows.length === 0) {
        toast.error('No report data available to export');
        return;
    }
    setExporting(true);
    try {
        let columns: ExcelColumn[] = [];
        let exportData: any[] = [];
        let filename = `Account_Report_Tab_${activeTab}`;

        if (activeTab === 13) {
            filename = `Customer_Balance_Detail_Report_${new Date().toISOString().split('T')[0]}`;
            columns = [
                { header: 'S#', key: 'sno', width: 8, alignment: { horizontal: 'center' } },
                { header: 'Customer Name', key: 'customer_name', width: 30 },
                { header: 'Customer Code', key: 'customer_code', width: 16, alignment: { horizontal: 'center' } },
                { header: 'Page #', key: 'page_no', width: 12, alignment: { horizontal: 'center' } },
                { header: 'Customer Category', key: 'category', width: 22 },
                { header: 'Contact / Phone', key: 'phone', width: 18 },
                { header: 'Opening Balance (PKR)', key: 'opening_balance', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                { header: 'Period Debit / Sales (PKR)', key: 'period_debit', width: 25, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                { header: 'Period Credit / Receipts (PKR)', key: 'period_credit', width: 25, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                { header: 'Net Closing Balance (PKR)', key: 'closing_balance', width: 24, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                { header: 'Account Status', key: 'status', width: 22, alignment: { horizontal: 'center' } },
            ];
            exportData = reportRows.map((r, i) => {
                let status = 'Settled (0.00)';
                if (r.closing_balance > 0.01) status = 'Debit Due (Receivable)';
                else if (r.closing_balance < -0.01) status = 'Credit Advance (Payable)';
                return {
                    sno: i + 1,
                    customer_name: r.customer_name,
                    customer_code: r.customer_code || '-',
                    page_no: r.page_no || '-',
                    category: r.category,
                    phone: r.phone,
                    opening_balance: Number(r.opening_balance || 0),
                    period_debit: Number(r.period_debit || 0),
                    period_credit: Number(r.period_credit || 0),
                    closing_balance: Number(r.closing_balance || 0),
                    status
                };
            });
        } else if (activeTab === 3) {
            filename = `Vendor_Balance_Detail_Report_${new Date().toISOString().split('T')[0]}`;
            columns = [
                { header: 'S#', key: 'sno', width: 6, alignment: { horizontal: 'center' } },
                { header: 'Date', key: 'date', width: 14, alignment: { horizontal: 'center' } },
                { header: 'Invoice No', key: 'refNo', width: 18 },
                { header: 'Entry Type', key: 'type', width: 22 },
                { header: 'Particulars / Description', key: 'notes', width: 38 },
                { header: 'Credit / Purchases (PKR)', key: 'credit', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                { header: 'Debit / Payments (PKR)', key: 'debit', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                { header: 'Net Running Payable (PKR)', key: 'runningBalance', width: 24, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            ];

            const flattenedRows: any[] = [];

            reportRows.forEach((vend) => {
                const openBal = Number(vend.opening_balance || 0);
                const pCredit = Number(vend.period_credit || 0);
                const pDebit = Number(vend.period_debit || 0);
                const closeBal = Number(vend.closing_balance || 0);
                const txList = vend.transactions || [];

                // 1. Vendor Header Banner Box in Excel
                const bannerText = `🏢 ${vend.vendor_name.toUpperCase()}  |  Phone: ${vend.phone || '-'}  |  Opening: Rs. ${openBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Purchases (Cr): Rs. ${pCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Payments (Dr): Rs. ${pDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Net Closing: Rs. ${closeBal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${closeBal > 0.01 ? '(Payable/Cr)' : closeBal < -0.01 ? '(Advance/Dr)' : ''}`;

                flattenedRows.push({
                    _isHeader: true,
                    _bannerText: bannerText
                });

                // 2. Transactions under this Vendor
                if (txList.length === 0) {
                    flattenedRows.push({
                        sno: '-',
                        date: '-',
                        refNo: '-',
                        type: 'No Transactions',
                        notes: 'No procurement or payment activity logged within selected date range.',
                        credit: 0,
                        debit: 0,
                        runningBalance: closeBal
                    });
                } else {
                    txList.forEach((tx: any, tIdx: number) => {
                        flattenedRows.push({
                            sno: tIdx + 1,
                            date: tx.date || '',
                            refNo: tx.refNo || '',
                            type: tx.type || '',
                            notes: tx.notes || '',
                            credit: Number(tx.credit || 0),
                            debit: Number(tx.debit || 0),
                            runningBalance: Number(tx.runningBalance || 0)
                        });
                    });
                }

                // 3. Subtotal row for this vendor
                flattenedRows.push({
                    _isSubtotal: true,
                    sno: '',
                    date: '',
                    refNo: '',
                    type: '',
                    notes: `VENDOR PERIOD TOTAL (${vend.vendor_name}):`,
                    credit: pCredit,
                    debit: pDebit,
                    runningBalance: closeBal
                });
            });

            exportData = flattenedRows;
        } else if (activeTab === 1) {
            filename = `Customer_Account_Ledger_${new Date().toISOString().split('T')[0]}`;
            columns = [
                { header: 'S#', key: 'sno', width: 6, alignment: { horizontal: 'center' } },
                { header: 'Date', key: 'date', width: 14, alignment: { horizontal: 'center' } },
                { header: 'Invoice No', key: 'refNo', width: 18 },
                { header: 'Entry Type', key: 'type', width: 22 },
                { header: 'Particulars / Description', key: 'notes', width: 38 },
                { header: 'Debit / Sales (PKR)', key: 'debit', width: 20, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                { header: 'Credit / Recv (PKR)', key: 'credit', width: 20, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                { header: 'Running Balance (PKR)', key: 'runningBalance', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            ];

            const flattenedRows: any[] = [];

            reportRows.forEach((cust) => {
                const openBal = Number(cust.opening_balance || 0);
                const pDebit = Number(cust.period_debit || 0);
                const pCredit = Number(cust.period_credit || 0);
                const closeBal = Number(cust.closing_balance || 0);
                const txList = cust.transactions || [];

                // 1. Customer Header Banner Box in Excel
                const bannerText = `👤 ${cust.customer_name.toUpperCase()}  |  Category: ${cust.category || 'Retail / General'}  |  Phone: ${cust.phone || '-'}  |  Opening: Rs. ${openBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Sales (Dr): Rs. ${pDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Paid/Recv (Cr): Rs. ${pCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Net Closing: Rs. ${closeBal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${closeBal > 0.01 ? '(Dr)' : closeBal < -0.01 ? '(Cr)' : ''}`;
                
                flattenedRows.push({
                    _isHeader: true,
                    _bannerText: bannerText
                });

                // 2. Transactions under this Customer
                if (txList.length === 0) {
                    flattenedRows.push({
                        sno: '-',
                        date: '-',
                        refNo: '-',
                        type: 'No Transactions',
                        notes: 'No activity logged within selected date range.',
                        debit: 0,
                        credit: 0,
                        runningBalance: closeBal
                    });
                } else {
                    txList.forEach((tx: any, tIdx: number) => {
                        flattenedRows.push({
                            sno: tIdx + 1,
                            date: tx.date || '',
                            refNo: tx.refNo || '',
                            type: tx.type || '',
                            notes: tx.notes || '',
                            debit: Number(tx.debit || 0),
                            credit: Number(tx.credit || 0),
                            runningBalance: Number(tx.runningBalance || 0)
                        });
                    });
                }

                // 3. Subtotal row for this customer
                flattenedRows.push({
                    _isSubtotal: true,
                    sno: '',
                    date: '',
                    refNo: '',
                    type: '',
                    notes: `CUSTOMER PERIOD TOTAL (${cust.customer_name}):`,
                    debit: pDebit,
                    credit: pCredit,
                    runningBalance: closeBal
                });
            });

            exportData = flattenedRows;
        } else if (activeTab === 11) {
            filename = `General_Trial_Balance_Report_${new Date().toISOString().split('T')[0]}`;
            if (activeViewMode === 'detailed') {
                columns = [
                    { header: 'Account / Sub-Head Code', key: 'code', width: 22, alignment: { horizontal: 'center' } },
                    { header: 'Classification / Category', key: 'category', width: 20 },
                    { header: 'Account Title / Sub-Ledger Name', key: 'title', width: 42 },
                    { header: 'Reference / Breakdown', key: 'ref', width: 30 },
                    { header: 'Debit Balance (PKR)', key: 'debit', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                    { header: 'Credit Balance (PKR)', key: 'credit', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                    { header: 'Net Balance (PKR)', key: 'balance', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                ];
                const flattened: any[] = [];
                reportRows.forEach((r) => {
                    flattened.push({
                        _isHeader: true,
                        _bannerText: `ACCOUNT [${r.code}] - ${r.title.toUpperCase()} (${r.category}) | Debit: Rs. ${Number(r.debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} | Credit: Rs. ${Number(r.credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    });
                    (r.details || []).forEach((dt: any) => {
                        flattened.push({
                            code: r.code,
                            category: r.category,
                            title: dt.name,
                            ref: dt.ref || '-',
                            debit: Number(dt.debit || 0),
                            credit: Number(dt.credit || 0),
                            balance: Number(Math.abs(dt.balance || (dt.debit - dt.credit))),
                        });
                    });
                    flattened.push({
                        _isSubtotal: true,
                        code: '',
                        category: '',
                        title: `SUBTOTAL FOR [${r.code}] ${r.title}:`,
                        ref: '',
                        debit: Number(r.debit || 0),
                        credit: Number(r.credit || 0),
                        balance: Number(r.debit || 0) - Number(r.credit || 0),
                    });
                });
                exportData = flattened;
            } else {
                columns = [
                    { header: 'S#', key: 'sno', width: 8, alignment: { horizontal: 'center' } },
                    { header: 'Account Code', key: 'code', width: 16, alignment: { horizontal: 'center' } },
                    { header: 'Classification', key: 'category', width: 20 },
                    { header: 'Account Title / Description', key: 'title', width: 44 },
                    { header: 'Debit Balance (PKR)', key: 'debit', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                    { header: 'Credit Balance (PKR)', key: 'credit', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
                ];
                exportData = reportRows.map((r, i) => ({
                    sno: i + 1,
                    code: r.code,
                    category: r.category,
                    title: r.title,
                    debit: Number(r.debit || 0),
                    credit: Number(r.credit || 0)
                }));
            }
        } else {
            const first = reportRows[0] || {};
            columns = Object.keys(first).map(k => ({
                header: k.replace(/_/g, ' ').toUpperCase(),
                key: k,
                width: 20
            }));
            exportData = reportRows;
        }

        const tabTitleMap: Record<number, string> = {
            1: 'CUSTOMER ACCOUNT LEDGER STATEMENT',
            2: 'CUSTOMER ACCOUNT BALANCE SUMMARY',
            3: 'VENDOR BALANCE DETAIL & ACCOUNT LEDGER',
            4: 'OPERATIONAL EXPENSE STATEMENT',
            5: 'CHART OF ACCOUNTS CATALOG',
            6: 'VENDOR OUTSTANDING BALANCES LEDGER',
            7: 'CUSTOMER RECOVERY COLLECTION STATEMENT',
            8: 'CORPORATE VOUCHERS AUDIT SUMMARY',
            9: 'DAILY CASH & BANK DAYBOOK STATEMENT',
            10: 'SALESMAN SALES & CASH COLLECTION SHEET',
            11: `GENERAL TRIAL BALANCE AUDIT WORKBOOK${activeViewMode === 'detailed' ? ' (DETAILED)' : ' (SUMMARY)'}`,
            12: 'ACCOUNT DEBIT AGING MATRIX SHEET',
            13: 'CUSTOMER BALANCE DETAIL AUDIT REPORT'
        };

        const reportHeading = tabTitleMap[activeTab] || `FINANCIAL STATEMENT - TAB ${activeTab}`;

        await exportToExcel({
            filename,
            sheetName: reportHeading.slice(0, 31),
            title: businessName || getBrandConfig().fullName,
            subtitle: reportHeading,
            columns,
            data: exportData
        });
        toast.success('Report exported to Excel successfully!');
    } catch (err: any) {
        console.error('Export Excel failed:', err);
        toast.error('Export failed: ' + err.message);
    } finally {
        setExporting(false);
    }
};
