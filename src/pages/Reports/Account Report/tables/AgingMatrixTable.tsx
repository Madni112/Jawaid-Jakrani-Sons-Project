import React from 'react';

interface AgingMatrixTableProps {
    paginatedRows: any[];
    startIndex: number;
    isPrinting: boolean;
    pageSize: number | string;
    reportRows: any[];
}

export const AgingMatrixTable: React.FC<AgingMatrixTableProps> = ({
    paginatedRows,
    startIndex,
    isPrinting,
    pageSize,
    reportRows
}) => {
    const totalDueSum = reportRows.reduce((sum, r) => sum + Number(r.total_due || 0), 0);
    const total0_30Sum = reportRows.reduce((sum, r) => sum + Number(r.days_0_30 || 0), 0);
    const total31_60Sum = reportRows.reduce((sum, r) => sum + Number(r.days_31_60 || 0), 0);
    const total61_90Sum = reportRows.reduce((sum, r) => sum + Number(r.days_61_90 || 0), 0);
    const total90PlusSum = reportRows.reduce((sum, r) => sum + Number(r.days_90_plus || 0), 0);

    return (
        <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
            <thead className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                <tr>
                    <th className="p-1.5 border border-black text-center w-12">S#</th>
                    <th className="p-1.5 border border-black min-w-[150px] max-w-[240px]">Customer Name</th>
                    <th className="p-1.5 border border-black text-center w-24">Unpaid Invoices</th>
                    <th className="p-1.5 border border-black text-right w-32">Total Outstanding Debt</th>
                    <th className="p-1.5 border border-black text-right w-28">0 - 30 Days (Current)</th>
                    <th className="p-1.5 border border-black text-right w-28">31 - 60 Days</th>
                    <th className="p-1.5 border border-black text-right w-28">61 - 90 Days</th>
                    <th className="p-1.5 border border-black text-right w-28 pr-3">90+ Days Overdue</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((row, i) => (
                    <tr key={i} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs text-black">
                        <td className="p-1.5 border border-black text-center text-gray-400">{startIndex + i + 1}</td>
                        <td className="p-1.5 border border-black font-sans uppercase font-bold text-black">{row.customer_name}</td>
                        <td className="p-1.5 border border-black text-center font-bold text-gray-600">{row.invoice_count} Invoice(s)</td>
                        <td className="p-1.5 border border-black text-right font-black text-danger">Rs. {Number(row.total_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-1.5 border border-black text-right text-success font-bold">{row.days_0_30 > 0 ? `Rs. ${Number(row.days_0_30).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}</td>
                        <td className="p-1.5 border border-black text-right text-yellow-600 font-bold">{row.days_31_60 > 0 ? `Rs. ${Number(row.days_31_60).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}</td>
                        <td className="p-1.5 border border-black text-right text-orange-600 font-bold">{row.days_61_90 > 0 ? `Rs. ${Number(row.days_61_90).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}</td>
                        <td className="p-1.5 border border-black text-right pr-3 text-red-600 font-black">{row.days_90_plus > 0 ? `Rs. ${Number(row.days_90_plus).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}</td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                {!isPrinting && pageSize !== 'all' && (
                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                        <td colSpan={3} className="p-2 border border-black text-right uppercase tracking-wider">
                            Page Subtotal (This Page):
                        </td>
                        <td className="p-2 border border-black text-right text-danger font-black text-xs">
                            Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.total_due || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right text-success font-black text-xs">
                            Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.days_0_30 || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right text-yellow-600 font-black text-xs">
                            Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.days_31_60 || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right text-orange-600 font-black text-xs">
                            Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.days_61_90 || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right pr-3 text-red-600 font-black text-xs">
                            Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.days_90_plus || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                )}
                <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                    <td colSpan={3} className="p-2 border border-black text-right uppercase tracking-wider text-black">
                        Total Aggregated Aging Receivables (All {reportRows.length} Records):
                    </td>
                    <td className="p-2 border border-black text-right text-danger font-black underline decoration-double text-sm">
                        Rs. {totalDueSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right text-success font-black text-xs">
                        Rs. {total0_30Sum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right text-yellow-600 font-black text-xs">
                        Rs. {total31_60Sum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right text-orange-600 font-black text-xs">
                        Rs. {total61_90Sum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right pr-3 text-red-600 font-black text-xs">
                        Rs. {total90PlusSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                </tr>
            </tfoot>
        </table>
    );
};
