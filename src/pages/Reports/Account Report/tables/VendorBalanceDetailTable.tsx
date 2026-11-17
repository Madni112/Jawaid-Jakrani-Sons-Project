import React from 'react';

interface VendorBalanceDetailTableProps {
    paginatedRows: any[];
    startIndex: number;
    expandedCustomerIds: Set<any>;
    isPrinting: boolean;
    pageSize: number | string;
    reportRows: any[];
}

export const VendorBalanceDetailTable: React.FC<VendorBalanceDetailTableProps> = ({
    paginatedRows,
    startIndex,
    expandedCustomerIds,
    isPrinting,
    pageSize,
    reportRows
}) => {
    return (
        <div>
            <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
                <thead className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                    <tr>
                        <th className="p-1.5 border border-black text-center w-8">S#</th>
                        <th className="p-1.5 border border-black">Vendor / Supplier Name</th>
                        <th className="p-1.5 border border-black text-center w-32">Contact / Phone</th>
                        <th className="p-1.5 border border-black text-right w-36">Opening Balance (PKR)</th>
                        <th className="p-1.5 border border-black text-right w-36">Period Purchases (Cr)</th>
                        <th className="p-1.5 border border-black text-right w-36">Period Payments (Dr)</th>
                        <th className="p-1.5 border border-black text-right w-36">Net Closing Balance</th>
                        <th className="p-1.5 border border-black text-center w-28">Account Status</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedRows.map((row, i) => {
                        const openBal = Number(row.opening_balance || 0);
                        const pCredit = Number(row.period_credit || 0);
                        const pDebit = Number(row.period_debit || 0);
                        const closeBal = Number(row.closing_balance || 0);
                        const isExpanded = expandedCustomerIds.has(row.id);
                        const hasTransactions = row.transactions && row.transactions.length > 0;

                        return (
                            <React.Fragment key={row.id || i}>
                                <tr className={`border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs ${isExpanded ? 'bg-slate-50/70' : ''}`}>
                                    <td className="p-1.5 border border-black text-center text-gray-400">{startIndex + i + 1}</td>
                                    <td className="p-1.5 border border-black font-sans text-black font-bold">
                                        <div>{row.vendor_name}</div>
                                        {row.address && row.address !== '-' && (
                                            <div className="text-[9px] text-gray-500 font-normal truncate max-w-xs">{row.address}</div>
                                        )}
                                    </td>
                                    <td className="p-1.5 border border-black text-center text-gray-600 font-mono text-[10px]">{row.phone || '-'}</td>
                                    <td className={`p-1.5 border border-black text-right font-mono ${openBal > 0.01 ? 'text-red-600 font-bold' : openBal < -0.01 ? 'text-emerald-700 font-bold' : 'text-gray-500'}`}>
                                        Rs. {openBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-1.5 border border-black text-right text-red-600 font-bold font-mono">
                                        Rs. {pCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-1.5 border border-black text-right text-emerald-700 font-bold font-mono">
                                        Rs. {pDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className={`p-1.5 border border-black text-right font-mono text-xs ${closeBal > 0.01 ? 'text-red-700 font-black' : closeBal < -0.01 ? 'text-blue-700 font-black' : 'text-gray-600 font-bold'}`}>
                                        <div>Rs. {closeBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </td>
                                    <td className="p-1.5 border border-black text-center font-sans">
                                        {closeBal > 0.01 ? (
                                            <span className="px-2 py-0.5 rounded text-[9.5px] font-black bg-red-50 text-red-700 border border-red-200">
                                                Payable (Cr)
                                            </span>
                                        ) : closeBal < -0.01 ? (
                                            <span className="px-2 py-0.5 rounded text-[9.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                Advance (Dr)
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                                Settled (0.00)
                                            </span>
                                        )}
                                    </td>
                                </tr>

                                {/* Expanded Transaction Details Sub-Table (Seamless Rows) */}
                                {isExpanded && (
                                    <tr className="bg-slate-50 border-b-2 border-black">
                                        <td colSpan={8} className="p-0 border border-black">
                                            <table className="w-full text-[10px] border-collapse font-sans bg-white">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[9.5px] uppercase font-mono">
                                                        <th className="p-1.5 pl-6 text-left w-28">Date</th>
                                                        <th className="p-1.5 text-left w-36">Entry Type</th>
                                                        <th className="p-1.5 text-left w-28 font-mono">Ref / Doc #</th>
                                                        <th className="p-1.5 text-left">Description / Particulars</th>
                                                        <th className="p-1.5 text-right w-36 text-red-700">Credit (Purchases)</th>
                                                        <th className="p-1.5 text-right w-36 text-emerald-700">Debit (Payments)</th>
                                                        <th className="p-1.5 pr-4 text-right w-36 font-mono">Running Balance</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {hasTransactions ? (
                                                        row.transactions.map((tx: any, tIdx: number) => (
                                                            <tr key={tIdx} className="border-b border-slate-200 hover:bg-slate-50 font-mono text-[10.5px]">
                                                                <td className="p-1.5 pl-6 text-slate-600">
                                                                    {tx.date && tx.date !== 'Opening' ? tx.date : 'Opening Bal'}
                                                                </td>
                                                                <td className="p-1.5 font-sans font-semibold text-slate-800">
                                                                    {tx.type}
                                                                </td>
                                                                <td className="p-1.5 font-bold text-slate-900 font-mono">
                                                                    {tx.refNo || '-'}
                                                                </td>
                                                                <td className="p-1.5 font-sans text-slate-600">
                                                                    {tx.notes || '-'}
                                                                </td>
                                                                <td className="p-1.5 text-right font-bold text-red-600 font-mono">
                                                                    {tx.credit > 0 ? `Rs. ${tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                                                </td>
                                                                <td className="p-1.5 text-right font-bold text-emerald-700 font-mono">
                                                                    {tx.debit > 0 ? `Rs. ${tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                                                </td>
                                                                <td className={`p-1.5 pr-4 text-right font-bold font-mono ${tx.runningBalance > 0.01 ? 'text-red-700' : tx.runningBalance < -0.01 ? 'text-blue-700' : 'text-gray-600'}`}>
                                                                    Rs. {tx.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={7} className="p-3 text-center text-gray-400 italic">
                                                                No procurement or payment activity logged within selected date range.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
                <tfoot>
                    {!isPrinting && pageSize !== 'all' && (
                        <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                            <td colSpan={3} className="p-2 border border-black text-right uppercase tracking-wider">
                                Page Subtotal (This Page):
                            </td>
                            <td className="p-2 border border-black text-right font-bold">
                                Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.opening_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 border border-black text-right text-red-700 font-bold">
                                Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.period_credit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 border border-black text-right text-emerald-700 font-bold">
                                Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.period_debit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 border border-black text-right text-primary font-bold">
                                Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.closing_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 border border-black text-center text-gray-500 text-[10px] font-sans uppercase">
                                {paginatedRows.length} On Page
                            </td>
                        </tr>
                    )}
                    <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                        <td colSpan={3} className="p-2 border border-black text-right uppercase tracking-wider text-black">
                            Grand Totals Summary (All {reportRows.length} Records):
                        </td>
                        <td className="p-2 border border-black text-right text-black font-black text-xs">
                            Rs. {reportRows.reduce((sum, r) => sum + Number(r.opening_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right text-red-700 font-black text-xs">
                            Rs. {reportRows.reduce((sum, r) => sum + Number(r.period_credit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right text-emerald-700 font-black text-xs">
                            Rs. {reportRows.reduce((sum, r) => sum + Number(r.period_debit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right text-primary font-black underline decoration-double text-sm">
                            Rs. {reportRows.reduce((sum, r) => sum + Number(r.closing_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-center text-gray-500 text-[10px] font-sans uppercase">
                            {reportRows.length} Vendors
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};
