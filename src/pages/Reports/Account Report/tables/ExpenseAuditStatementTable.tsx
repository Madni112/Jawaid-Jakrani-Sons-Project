import React from 'react';

interface ExpenseAuditStatementTableProps {
    activeTab: number;
    paginatedRows: any[];
    startIndex: number;
    reportRows: any[];
    isPrinting: boolean;
    pageSize: number | string;
    currentPage: number;
}

export const ExpenseAuditStatementTable: React.FC<ExpenseAuditStatementTableProps> = ({
    activeTab,
    paginatedRows,
    startIndex,
    reportRows,
    isPrinting,
    pageSize,
    currentPage
}) => {
    if (activeTab === 4) {
        const totalExpenseSum = reportRows.reduce((sum, r) => sum + Number(r.total_amount || r.debit || r.credit || 0), 0);
        const totalCashExpense = reportRows
            .filter(r => String(r.payment_mode || r.voucher_type || '').toLowerCase().includes('cash'))
            .reduce((sum, r) => sum + Number(r.total_amount || r.debit || r.credit || 0), 0);
        const totalBankExpense = reportRows
            .filter(r => String(r.payment_mode || r.voucher_type || '').toLowerCase().includes('bank') || String(r.payment_mode || '').toLowerCase().includes('online'))
            .reduce((sum, r) => sum + Number(r.total_amount || r.debit || r.credit || 0), 0);

        return (
            <div className="space-y-4">
                {/* Visual KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Total Operational Expenses</p>
                        <p className="text-sm font-black text-rose-700 font-mono mt-0.5">
                            Rs. {totalExpenseSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Cash vs Bank Payments</p>
                        <p className="text-[11px] font-black font-mono mt-0.5">
                            <span className="text-emerald-700">Cash: Rs. {totalCashExpense.toLocaleString()}</span> / <span className="text-blue-700">Bank: Rs. {totalBankExpense.toLocaleString()}</span>
                        </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Total Expense Vouchers</p>
                        <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                            {reportRows.length} Vouchers
                        </p>
                    </div>
                </div>

                <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
                    <thead className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                        <tr>
                            <th className="p-1.5 border border-black text-center w-12">S#</th>
                            <th className="p-1.5 border border-black text-center w-28">Processing Date</th>
                            <th className="p-1.5 border border-black w-28">Voucher Ref #</th>
                            <th className="p-1.5 border border-black">Expense Head / Title</th>
                            <th className="p-1.5 border border-black">Paid To / Beneficiary</th>
                            <th className="p-1.5 border border-black text-center w-24">Payment Mode</th>
                            <th className="p-1.5 border border-black">Narration / Description</th>
                            <th className="p-1.5 border border-black text-right w-32 pr-3">Amount (PKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRows.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-400 italic font-mono font-bold">
                                    No operational expense records found matching the chosen date range.
                                </td>
                            </tr>
                        ) : (
                            paginatedRows.map((row, i) => {
                                const dateDisplay = row.voucher_date || String(row.created_at || '').split('T')[0];
                                const voucherRef = row.voucher_no || `EXP-${String(row.id).padStart(4, '0')}`;
                                const expenseHead = row.account_name || (row.account_code ? `Account #${row.account_code}` : 'General Expense');
                                const paidTo = row.party_name || row.customer_name || '-';
                                const payMode = row.payment_mode || (String(row.voucher_type || '').includes('Bank') ? 'Bank' : 'Cash');
                                const narration = row.narration || row.description || row.notes || '-';
                                const amount = Number(row.total_amount || row.debit || row.credit || 0);

                                return (
                                    <tr key={row.id || i} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs text-black">
                                        <td className="p-1.5 border border-black text-center text-gray-400">{startIndex + i + 1}</td>
                                        <td className="p-1.5 border border-black text-center text-gray-700">{dateDisplay}</td>
                                        <td className="p-1.5 border border-black font-bold uppercase text-primary whitespace-nowrap">{voucherRef}</td>
                                        <td className="p-1.5 border border-black font-sans uppercase font-bold text-slate-900">{expenseHead}</td>
                                        <td className="p-1.5 border border-black font-sans text-gray-800">{paidTo}</td>
                                        <td className="p-1.5 border border-black text-center font-sans">
                                            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                                                payMode.toLowerCase() === 'cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {payMode}
                                            </span>
                                        </td>
                                        <td className="p-1.5 border border-black font-sans text-gray-600 text-[10.5px]">{narration}</td>
                                        <td className="p-1.5 border border-black text-right pr-3 font-mono font-black text-rose-700 whitespace-nowrap">
                                            Rs. {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    <tfoot>
                        {!isPrinting && pageSize !== 'all' && (
                            <tr className="bg-amber-50 border-t border-black font-bold font-mono text-xs text-amber-950">
                                <td colSpan={7} className="p-2 border border-black text-right uppercase tracking-wider text-amber-900">
                                    Page {currentPage} Subtotal ({paginatedRows.length} vouchers):
                                </td>
                                <td className="p-2 border border-black text-right pr-3 text-rose-700 font-black whitespace-nowrap">
                                    Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.total_amount || r.debit || r.credit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        )}
                        <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                            <td colSpan={7} className="p-2 border border-black text-right uppercase tracking-wider text-gray-900">
                                Grand Total Operational Expenditures (All {reportRows.length} Vouchers):
                            </td>
                            <td className="p-2 border border-black text-right pr-3 text-rose-700 underline decoration-double text-sm whitespace-nowrap font-black">
                                Rs. {totalExpenseSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        );
    }

    if (activeTab === 5) {
        return (
            <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
                <thead className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                    <tr>
                        <th className="p-1.5 border border-black text-center w-12">Index</th>
                        <th className="p-1.5 border border-black w-28">Category Code</th>
                        <th className="p-1.5 border border-black w-28">Control Code</th>
                        <th className="p-1.5 border border-black w-32">Account Code</th>
                        <th className="p-1.5 border border-black">Chart Account Ledger Title Description</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedRows.map((row, i) => (
                        <tr key={row.id || i} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs text-black">
                            <td className="p-1.5 border border-black text-center text-gray-400">{startIndex + i + 1}</td>
                            <td className="p-1.5 border border-black uppercase text-gray-500">{row.category_code}</td>
                            <td className="p-1.5 border border-black font-sans uppercase font-bold">{row.account_title}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return null;
};
