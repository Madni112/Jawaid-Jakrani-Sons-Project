import React from 'react';
import { MdChevronRight, MdExpandMore, MdUnfoldMore, MdUnfoldLess } from 'react-icons/md';

interface CustomerBalanceDetailTableProps {
    paginatedRows: any[];
    startIndex: number;
    toggleAllCustomerDetails: () => void;
    expandedCustomerIds: Set<any>;
    toggleCustomerExpanded: (id: any) => void;
    isPrinting: boolean;
    pageSize: number | string;
    reportRows: any[];
}

export const CustomerBalanceDetailTable: React.FC<CustomerBalanceDetailTableProps> = ({
    paginatedRows,
    startIndex,
    toggleAllCustomerDetails,
    expandedCustomerIds,
    toggleCustomerExpanded,
    isPrinting,
    pageSize,
    reportRows
}) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-2 print-hidden-element print:hidden">
                <span className="text-xs text-slate-500 font-medium">
                    Click <span className="font-bold text-slate-700">"Details"</span> or <span className="font-bold text-slate-700">"Expand All"</span> to inspect individual invoices, receipts, and returns per customer.
                </span>
                <button
                    type="button"
                    onClick={toggleAllCustomerDetails}
                    className="text-[10.5px] font-bold px-2.5 py-1 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1 shadow-2xs transition cursor-pointer"
                >
                    {expandedCustomerIds.size > 0 ? (
                        <><MdUnfoldLess size={14} className="text-slate-600" /> Collapse All Details</>
                    ) : (
                        <><MdUnfoldMore size={14} className="text-emerald-700" /> Expand All Details</>
                    )}
                </button>
            </div>

            <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
                <thead className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                    <tr>
                        <th className="p-1.5 border border-black text-center w-8">S#</th>
                        <th className="p-1.5 border border-black w-[22%] min-w-[160px] max-w-[280px]">Customer Name</th>
                        <th className="p-1.5 border border-black text-center w-32">Customer Category</th>
                        <th className="p-1.5 border border-black text-center w-28">Contact / Phone</th>
                        <th className="p-1.5 border border-black text-right w-32">Opening Balance (PKR)</th>
                        <th className="p-1.5 border border-black text-right w-32">Period Debit / Sales (PKR)</th>
                        <th className="p-1.5 border border-black text-right w-32">Period Credit / Receipts (PKR)</th>
                        <th className="p-1.5 border border-black text-right w-36">Net Closing Balance (PKR)</th>
                        <th className="p-1.5 border border-black text-center w-28">Account Status</th>
                        <th className="p-1.5 border border-black text-center w-16 print-hidden-element print:hidden">Detail</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedRows.map((row, i) => {
                        const openBal = Number(row.opening_balance || 0);
                        const pDebit = Number(row.period_debit || 0);
                        const pCredit = Number(row.period_credit || 0);
                        const closeBal = Number(row.closing_balance || 0);
                        const isExpanded = expandedCustomerIds.has(row.id);
                        const hasTransactions = row.transactions && row.transactions.length > 0;

                        return (
                            <React.Fragment key={row.id || i}>
                                <tr className={`border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs ${isExpanded ? 'bg-slate-50/70' : ''}`}>
                                    <td className="p-1.5 border border-black text-center text-gray-400 align-top">{startIndex + i + 1}</td>
                                    <td className="p-1.5 border border-black font-sans text-black font-bold align-top">
                                        <div>{row.customer_name}</div>
                                        {(() => {
                                            const code = row.customer_code && row.customer_code !== '-' ? row.customer_code : '';
                                            const pageNo = row.page_no && row.page_no !== '-' ? row.page_no : '';
                                            if (!code && !pageNo) return null;
                                            return (
                                                <div className="text-[10px] font-mono text-slate-700 flex flex-wrap items-center gap-1 mt-0.5 font-normal">
                                                    {code && (
                                                        <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-300 font-bold uppercase text-slate-800 text-[9.5px]">
                                                            {code}
                                                        </span>
                                                    )}
                                                    {code && pageNo && <span className="text-slate-400 font-bold">|</span>}
                                                    {pageNo && (
                                                        <span className="text-slate-600 font-semibold text-[9.5px]">
                                                            {String(pageNo).toUpperCase().startsWith('P#') ? pageNo : `P# ${pageNo}`}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                        {row.address && row.address !== '-' && (
                                            <div className="text-[9px] text-gray-500 font-normal truncate max-w-xs mt-0.5">{row.address}</div>
                                        )}
                                    </td>
                                    <td className="p-1.5 border border-black text-center font-sans">
                                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                            {row.category || 'Retail / General'}
                                        </span>
                                    </td>
                                    <td className="p-1.5 border border-black text-center text-gray-600 font-mono text-[10px]">{row.phone || '-'}</td>
                                    <td className={`p-1.5 border border-black text-right font-mono ${openBal > 0.01 ? 'text-red-600 font-bold' : openBal < -0.01 ? 'text-emerald-700 font-bold' : 'text-gray-500'}`}>
                                        Rs. {openBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-1.5 border border-black text-right text-red-600 font-bold font-mono">
                                        Rs. {pDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-1.5 border border-black text-right text-emerald-700 font-bold font-mono">
                                        Rs. {pCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className={`p-1.5 border border-black text-right font-mono text-xs ${closeBal > 0.01 ? 'text-red-700 font-black' : closeBal < -0.01 ? 'text-blue-700 font-black' : 'text-gray-600 font-bold'}`}>
                                        <div>Rs. {closeBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        {row.balance_reasons && row.balance_reasons.length > 0 && (
                                            <div className="text-[8.5px] font-sans font-normal text-slate-500 mt-0.5 max-w-[210px] ml-auto leading-tight">
                                                {row.balance_reasons.slice(0, 2).join(' • ')}
                                                {row.balance_reasons.length > 2 && ` (+${row.balance_reasons.length - 2} more)`}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-1.5 border border-black text-center font-sans">
                                        {closeBal > 0.01 ? (
                                            <span className="px-2 py-0.5 rounded text-[9.5px] font-black bg-red-50 text-red-700 border border-red-200">
                                                Debit Due (Dr)
                                            </span>
                                        ) : closeBal < -0.01 ? (
                                            <span className="px-2 py-0.5 rounded text-[9.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                Credit Adv (Cr)
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                                Settled (0.00)
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-1.5 border border-black text-center print-hidden-element print:hidden font-sans">
                                        <button
                                            type="button"
                                            onClick={() => toggleCustomerExpanded(row.id)}
                                            className={`p-1 rounded text-[10px] font-bold flex items-center justify-center mx-auto transition cursor-pointer ${
                                                isExpanded
                                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                            }`}
                                            title={isExpanded ? 'Collapse transaction details' : 'Expand transaction details'}
                                        >
                                            {isExpanded ? <MdExpandMore size={14} /> : <MdChevronRight size={14} />}
                                        </button>
                                    </td>
                                </tr>

                                {/* Expanded Transaction Details Sub-Table */}
                                {isExpanded && (
                                    <tr className="bg-slate-50/90 border-b-2 border-black">
                                        <td colSpan={10} className="p-3 pl-8 pr-4 border border-black bg-slate-50/70">
                                            <div className="bg-white rounded-lg border border-slate-300 p-3 shadow-2xs space-y-2">
                                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-800 pb-1.5 border-b border-slate-200 flex justify-between">
                                                    <span>Itemized Invoices, Receipts & Returns Breakdown ({row.customer_name})</span>
                                                    <span className="text-slate-500 font-mono">
                                                        Total Transactions: {row.transactions ? row.transactions.length : 0}
                                                    </span>
                                                </div>

                                                {hasTransactions ? (
                                                    <table className="w-full text-[10px] border-collapse font-sans">
                                                        <thead>
                                                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[9.5px] uppercase font-mono">
                                                                <th className="p-1 text-left w-24">Date</th>
                                                                <th className="p-1 text-left w-36">Entry Type</th>
                                                                <th className="p-1 text-left w-32">Invoice No</th>
                                                                <th className="p-1 text-left">Description / Particulars</th>
                                                                <th className="p-1 text-right w-28 text-red-700">Debit (Sales)</th>
                                                                <th className="p-1 text-right w-28 text-emerald-700">Credit (Receipts)</th>
                                                                <th className="p-1 text-right w-32">Running Balance</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {row.transactions.map((tx: any, tIdx: number) => (
                                                                <tr key={tIdx} className="border-b border-slate-200 hover:bg-slate-50 font-mono text-[10px]">
                                                                    <td className="p-1 text-slate-600">
                                                                        {tx.date && tx.date !== 'Opening' ? tx.date : 'Opening Bal'}
                                                                    </td>
                                                                    <td className="p-1 font-sans font-semibold text-slate-800">
                                                                        {tx.type}
                                                                    </td>
                                                                    <td className="p-1 font-bold text-slate-900">
                                                                        {tx.refNo}
                                                                    </td>
                                                                    <td className="p-1 font-sans text-slate-600">
                                                                        {tx.notes}
                                                                    </td>
                                                                    <td className="p-1 text-right font-bold text-red-600">
                                                                        {tx.debit > 0 ? `Rs. ${tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                                                    </td>
                                                                    <td className="p-1 text-right font-bold text-emerald-600">
                                                                        {tx.credit > 0 ? `Rs. ${tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                                                    </td>
                                                                    <td className={`p-1 text-right font-bold ${tx.runningBalance > 0.01 ? 'text-red-700' : tx.runningBalance < -0.01 ? 'text-blue-700' : 'text-slate-600'}`}>
                                                                        Rs. {tx.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {tx.runningBalance > 0.01 ? 'Dr' : tx.runningBalance < -0.01 ? 'Cr' : ''}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="py-2 text-center text-slate-400 font-sans text-[10.5px]">
                                                        No invoices, receipts, or returns found within this selected period.
                                                    </div>
                                                )}
                                            </div>
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
                            <td colSpan={4} className="p-2 border border-black text-right uppercase tracking-wider">
                                Page Subtotal (This Page):
                            </td>
                            <td className="p-2 border border-black text-right font-bold">
                                Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.opening_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 border border-black text-right text-red-700 font-bold">
                                Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.period_debit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 border border-black text-right text-emerald-700 font-bold">
                                Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.period_credit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 border border-black text-right text-primary font-bold">
                                Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.closing_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td colSpan={2} className="p-2 border border-black text-center text-gray-500 text-[10px] font-sans uppercase">
                                {paginatedRows.length} On Page
                            </td>
                        </tr>
                    )}
                    <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                        <td colSpan={4} className="p-2 border border-black text-right uppercase tracking-wider text-black">
                            Grand Totals Summary (All {reportRows.length} Records):
                        </td>
                        <td className="p-2 border border-black text-right text-black font-black text-xs">
                            Rs. {reportRows.reduce((sum, r) => sum + Number(r.opening_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right text-red-700 font-black text-xs">
                            Rs. {reportRows.reduce((sum, r) => sum + Number(r.period_debit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right text-emerald-700 font-black text-xs">
                            Rs. {reportRows.reduce((sum, r) => sum + Number(r.period_credit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right text-primary font-black underline decoration-double text-sm">
                            Rs. {reportRows.reduce((sum, r) => sum + Number(r.closing_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td colSpan={2} className="p-2 border border-black text-center text-gray-500 text-[10px] font-sans uppercase">
                            {reportRows.length} Accounts
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};
