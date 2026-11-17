import React from 'react';

interface CustomerLedgerReportTableProps {
    paginatedRows: any[];
    startIndex: number;
    reportRows: any[];
}

export const CustomerLedgerReportTable: React.FC<CustomerLedgerReportTableProps> = ({
    paginatedRows,
    startIndex,
    reportRows
}) => {
    return (
        <div className="space-y-6">
            {paginatedRows.length === 0 ? (
                <div className="p-8 text-center text-gray-400 border border-black bg-gray-50 italic">
                    No customer ledger records found for the selected date range.
                </div>
            ) : (
                paginatedRows.map((cust, cIdx) => {
                    const openBal = Number(cust.opening_balance || 0);
                    const pDebit = Number(cust.period_debit || 0);
                    const pCredit = Number(cust.period_credit || 0);
                    const closeBal = Number(cust.closing_balance || 0);
                    const txList = cust.transactions || [];

                    return (
                        <div key={cust.id || cIdx} className="border-2 border-black rounded bg-white overflow-hidden shadow-xs print:border-black print:break-inside-avoid">
                            {/* Customer Header Banner */}
                            <div className="bg-slate-100 p-3 border-b-2 border-black">
                                <div className="flex flex-wrap justify-between items-center gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-bold bg-primary text-white px-2 py-0.5 rounded">
                                                #{startIndex + cIdx + 1}
                                            </span>
                                            <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">
                                                {cust.customer_name}
                                            </h3>
                                            {cust.customer_code && cust.customer_code !== '-' && (
                                                <span className="text-xs font-mono bg-white border border-slate-300 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">
                                                    {cust.customer_code}
                                                </span>
                                            )}
                                            {cust.page_no && cust.page_no !== '-' && (
                                                <span className="text-xs font-mono bg-white border border-slate-300 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                                                    {String(cust.page_no).toUpperCase().startsWith('P#') ? cust.page_no : `P# ${cust.page_no}`}
                                                </span>
                                            )}
                                            <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold uppercase">
                                                {cust.category || 'Retail / General'}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-1 font-mono flex flex-wrap gap-4">
                                            <span>📞 Phone: <b className="text-slate-800">{cust.phone || '-'}</b></span>
                                            {cust.city && (
                                                <span>🏙️ City: <b className="text-slate-800">{cust.city}</b></span>
                                            )}
                                            {cust.area && (
                                                <span>🏘️ Area: <b className="text-slate-800">{cust.area}</b></span>
                                            )}
                                            {cust.address && cust.address !== '-' && (
                                                <span>📍 Address: <b className="text-slate-800">{cust.address}</b></span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Customer Financial Quick Summary KPI */}
                                    <div className="flex items-center gap-2 text-right">
                                        <div className="bg-white border border-slate-300 rounded px-2.5 py-1 text-center font-mono">
                                            <div className="text-[9px] font-bold text-slate-500 uppercase">Opening</div>
                                            <div className="text-xs font-bold text-slate-800">
                                                Rs. {openBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <div className="bg-white border border-slate-300 rounded px-2.5 py-1 text-center font-mono">
                                            <div className="text-[9px] font-bold text-red-600 uppercase">Sales (Dr)</div>
                                            <div className="text-xs font-black text-red-600">
                                                Rs. {pDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <div className="bg-white border border-slate-300 rounded px-2.5 py-1 text-center font-mono">
                                            <div className="text-[9px] font-bold text-emerald-700 uppercase">Paid/Recv (Cr)</div>
                                            <div className="text-xs font-black text-emerald-700">
                                                Rs. {pCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <div className={`border rounded px-3 py-1 text-center font-mono ${closeBal > 0.01 ? 'bg-red-50 border-red-300 text-red-700' : closeBal < -0.01 ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-300 text-slate-700'}`}>
                                            <div className="text-[9px] font-bold uppercase">Net Closing</div>
                                            <div className="text-xs font-black">
                                                Rs. {closeBal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {closeBal > 0.01 ? '(Dr)' : closeBal < -0.01 ? '(Cr)' : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Itemized Transactions Table for this Customer */}
                            <table className="w-full table-auto border-collapse text-[11px] font-sans text-left">
                                <thead className="bg-gray-50 border-b border-black font-mono text-[9.5px] uppercase font-bold text-slate-700">
                                    <tr>
                                        <th className="p-1.5 border-r border-black text-center w-8">#</th>
                                        <th className="p-1.5 border-r border-black text-center w-24">Date</th>
                                        <th className="p-1.5 border-r border-black w-28">Ref / Doc #</th>
                                        <th className="p-1.5 border-r border-black w-36">Entry Type</th>
                                        <th className="p-1.5 border-r border-black">Particulars / Narration</th>
                                        <th className="p-1.5 border-r border-black text-right w-28 text-red-700">Debit (Sales)</th>
                                        <th className="p-1.5 border-r border-black text-right w-28 text-emerald-700">Credit (Recv)</th>
                                        <th className="p-1.5 text-right w-32 font-black pr-3">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-mono text-[10.5px]">
                                    {/* Opening Row */}
                                    <tr className="bg-amber-50/60 font-bold border-b border-slate-300">
                                        <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                                        <td className="p-1.5 border-r border-slate-300 text-center">-</td>
                                        <td className="p-1.5 border-r border-slate-300 text-slate-500">OB-INITIAL</td>
                                        <td className="p-1.5 border-r border-slate-300">
                                            <span className="bg-amber-200 text-amber-900 px-1 py-0.5 rounded text-[9px] font-bold">OPENING BALANCE</span>
                                        </td>
                                        <td className="p-1.5 border-r border-slate-300 font-sans italic text-slate-600">Initial Carried Forward Balance</td>
                                        <td className="p-1.5 border-r border-slate-300 text-right text-slate-400">-</td>
                                        <td className="p-1.5 border-r border-slate-300 text-right text-slate-400">-</td>
                                        <td className={`p-1.5 text-right pr-3 font-black ${openBal > 0.01 ? 'text-red-700' : openBal < -0.01 ? 'text-emerald-700' : 'text-slate-700'}`}>
                                            Rs. {openBal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {openBal > 0.01 ? 'Dr' : openBal < -0.01 ? 'Cr' : ''}
                                        </td>
                                    </tr>

                                    {txList.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-4 text-center text-gray-400 italic font-sans">
                                                No activity logged within selected date range.
                                            </td>
                                        </tr>
                                    ) : (
                                        txList.map((tx: any, tIdx: number) => (
                                            <tr key={tIdx} className={`hover:bg-slate-50 transition print:break-inside-avoid ${tIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                                <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">{tIdx + 1}</td>
                                                <td className="p-1.5 border-r border-slate-300 text-center whitespace-nowrap text-slate-700 font-medium">{tx.date}</td>
                                                <td className="p-1.5 border-r border-slate-300 font-bold text-primary whitespace-nowrap">{tx.refNo}</td>
                                                <td className="p-1.5 border-r border-slate-300 whitespace-nowrap">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                                        tx.type.includes('SAV') || tx.type.includes('Sale') ? 'bg-red-100 text-red-800' :
                                                        tx.type.includes('SRV') || tx.type.includes('Return') ? 'bg-purple-100 text-purple-800' :
                                                        tx.type.includes('CRV') || tx.type.includes('Receipt') ? 'bg-emerald-100 text-emerald-800' :
                                                        tx.type.includes('Discount') ? 'bg-amber-100 text-amber-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="p-1.5 border-r border-slate-300 font-sans text-slate-700 font-medium">
                                                    {tx.notes || '-'}
                                                </td>
                                                <td className="p-1.5 border-r border-slate-300 text-right font-black text-red-700">
                                                    {Number(tx.debit) > 0 ? `Rs. ${Number(tx.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                                </td>
                                                <td className="p-1.5 border-r border-slate-300 text-right font-black text-emerald-700">
                                                    {Number(tx.credit) > 0 ? `Rs. ${Number(tx.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                                </td>
                                                <td className={`p-1.5 text-right pr-3 font-black ${Number(tx.runningBalance) > 0.01 ? 'text-red-700' : Number(tx.runningBalance) < -0.01 ? 'text-emerald-700' : 'text-slate-700'}`}>
                                                    Rs. {Number(tx.runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {Number(tx.runningBalance) > 0.01 ? 'Dr' : Number(tx.runningBalance) < -0.01 ? 'Cr' : ''}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-100 font-mono font-bold text-xs border-t border-black">
                                    <tr>
                                        <td colSpan={5} className="p-1.5 border-r border-black text-right uppercase text-[10px] text-slate-700">
                                            Customer Period Total:
                                        </td>
                                        <td className="p-1.5 border-r border-black text-right font-black text-red-700">
                                            Rs. {pDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-1.5 border-r border-black text-right font-black text-emerald-700">
                                            Rs. {pCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`p-1.5 text-right pr-3 font-black text-xs ${closeBal > 0.01 ? 'text-red-700' : closeBal < -0.01 ? 'text-emerald-700' : 'text-slate-800'}`}>
                                            Rs. {closeBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    );
                })
            )}

            {/* Overall Grand Summary Footer across all customers */}
            {reportRows.length > 0 && (
                <div className="p-3 bg-slate-900 text-white rounded font-mono flex flex-wrap justify-between items-center text-xs print:border print:border-black print:bg-gray-100 print:text-black">
                    <span className="font-bold uppercase tracking-wider">
                        Grand Total ({reportRows.length} Customers):
                    </span>
                    <div className="flex gap-6 font-mono font-black text-sm">
                        <span>Total Sales (Dr): <span className="text-rose-400 print:text-rose-700">Rs. {reportRows.reduce((s, r) => s + (Number(r.period_debit) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
                        <span>Total Received (Cr): <span className="text-emerald-400 print:text-emerald-700">Rs. {reportRows.reduce((s, r) => s + (Number(r.period_credit) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
                        <span>Net Outstanding: <span className="text-amber-300 print:text-slate-900 underline decoration-double">Rs. {reportRows.reduce((s, r) => s + (Number(r.closing_balance) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
                    </div>
                </div>
            )}
        </div>
    );
};
