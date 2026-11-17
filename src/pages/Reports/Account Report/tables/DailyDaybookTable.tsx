import React from 'react';

interface DailyDaybookTableProps {
    paginatedRows: any[];
    startIndex: number;
    reportRows: any[];
    isPrinting: boolean;
    pageSize: number | string;
}

export const DailyDaybookTable: React.FC<DailyDaybookTableProps> = ({
    paginatedRows,
    startIndex,
    reportRows,
    isPrinting,
    pageSize
}) => {
    return (
        <div className="space-y-4">
            {/* Daybook KPI Summary Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 print:grid-cols-4">
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded print:border-black">
                    <div className="text-[10px] uppercase font-bold text-emerald-800">Total Cash In / Receipts</div>
                    <div className="text-base font-black text-emerald-700 font-mono">
                        Rs. {reportRows.reduce((s, r) => s + (Number(r.cash_in) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-300 rounded print:border-black">
                    <div className="text-[10px] uppercase font-bold text-rose-800">Total Cash Out / Payments</div>
                    <div className="text-base font-black text-rose-700 font-mono">
                        Rs. {reportRows.reduce((s, r) => s + (Number(r.cash_out) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-300 rounded print:border-black">
                    <div className="text-[10px] uppercase font-bold text-blue-800">Net Flow (Period)</div>
                    <div className={`text-base font-black font-mono ${(reportRows.reduce((s, r) => s + (Number(r.cash_in) || 0) - (Number(r.cash_out) || 0), 0)) >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                        Rs. {reportRows.reduce((s, r) => s + (Number(r.cash_in) || 0) - (Number(r.cash_out) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-300 rounded print:border-black">
                    <div className="text-[10px] uppercase font-bold text-slate-800">Closing Cash / Bank Balance</div>
                    <div className="text-base font-black text-slate-900 font-mono">
                        Rs. {(reportRows.length > 0 ? reportRows[reportRows.length - 1].balance : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
                <thead className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                    <tr>
                        <th className="p-1.5 border border-black text-center w-10">S#</th>
                        <th className="p-1.5 border border-black text-center w-24">Date</th>
                        <th className="p-1.5 border border-black w-28">Invoice No</th>
                        <th className="p-1.5 border border-black w-28">Transaction Type</th>
                        <th className="p-1.5 border border-black">Party / Account Title</th>
                        <th className="p-1.5 border border-black text-center w-16">Mode</th>
                        <th className="p-1.5 border border-black">Narration / Description</th>
                        <th className="p-1.5 border border-black text-right w-28 text-emerald-700">Cash IN (PKR)</th>
                        <th className="p-1.5 border border-black text-right w-28 text-rose-700">Cash OUT (PKR)</th>
                        <th className="p-1.5 border border-black text-right w-28 pr-3 text-slate-900">Balance (PKR)</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedRows.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="p-8 text-center text-gray-400 italic">No cash or bank transactions found for the selected date range.</td>
                        </tr>
                    ) : (
                        paginatedRows.map((row, i) => (
                            <tr key={i} className={`border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs ${row.is_bf ? 'bg-amber-50/70 font-bold' : ''}`}>
                                <td className="p-1.5 border border-black text-center text-gray-400">{row.is_bf ? 'B/F' : startIndex + i + 1}</td>
                                <td className="p-1.5 border border-black text-center text-gray-600">{row.date}</td>
                                <td className="p-1.5 border border-black text-primary font-black uppercase">
                                    {row.is_bf ? (
                                        <span className="bg-amber-200 text-amber-950 text-[9px] px-1.5 py-0.5 rounded font-black border border-amber-400">B/F</span>
                                    ) : (
                                        row.doc_no
                                    )}
                                </td>
                                <td className="p-1.5 border border-black font-sans font-bold text-[10px] uppercase text-purple-700">
                                    {row.is_bf ? (
                                        <span className="text-amber-900 font-black">OPENING BALANCE</span>
                                    ) : (
                                        row.type
                                    )}
                                </td>
                                <td className="p-1.5 border border-black font-sans font-bold text-gray-900">{row.party}</td>
                                <td className="p-1.5 border border-black text-center font-sans font-bold text-gray-600 text-[10px] uppercase">{row.payment_mode}</td>
                                <td className="p-1.5 border border-black font-sans text-gray-600 truncate max-w-xs text-[10px]">{row.narration}</td>
                                <td className="p-1.5 border border-black text-right font-black text-emerald-700">
                                    {Number(row.cash_in) > 0 ? `Rs. ${Number(row.cash_in).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                </td>
                                <td className="p-1.5 border border-black text-right font-black text-rose-700">
                                    {Number(row.cash_out) > 0 ? `Rs. ${Number(row.cash_out).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                </td>
                                <td className={`p-1.5 border border-black text-right pr-3 font-black ${Number(row.balance) >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
                                    Rs. {Number(row.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
                <tfoot>
                    {!isPrinting && pageSize !== 'all' && (
                        <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                            <td colSpan={7} className="p-2 border border-black text-right uppercase">Page Subtotal:</td>
                            <td className="p-2 border border-black text-right font-black text-emerald-700">
                                Rs. {paginatedRows.reduce((s, r) => s + (Number(r.cash_in) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 border border-black text-right font-black text-rose-700">
                                Rs. {paginatedRows.reduce((s, r) => s + (Number(r.cash_out) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 border border-black text-right pr-3 font-black text-slate-900">
                                Rs. {(paginatedRows.length > 0 ? paginatedRows[paginatedRows.length - 1].balance : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    )}
                    <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                        <td colSpan={7} className="p-2 border border-black text-right uppercase text-gray-800">Grand Total ({reportRows.length} Transactions):</td>
                        <td className="p-2 border border-black text-right text-emerald-700 underline decoration-double font-black">
                            Rs. {reportRows.reduce((s, r) => s + (Number(r.cash_in) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right text-rose-700 underline decoration-double font-black">
                            Rs. {reportRows.reduce((s, r) => s + (Number(r.cash_out) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right pr-3 text-slate-900 underline decoration-double font-black">
                            Rs. {(reportRows.length > 0 ? reportRows[reportRows.length - 1].balance : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};
