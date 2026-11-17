import React from 'react';

interface RecoveryCollectionTableProps {
    paginatedRows: any[];
    startIndex: number;
    reportRows: any[];
    isPrinting: boolean;
    pageSize: number | string;
}

export const RecoveryCollectionTable: React.FC<RecoveryCollectionTableProps> = ({
    paginatedRows,
    startIndex,
    reportRows,
    isPrinting,
    pageSize
}) => {
    return (
        <div className="max-w-full overflow-x-auto mt-4">
            <table className="w-full table-auto border-collapse border border-black text-left text-[11px]">
                <thead>
                    <tr className="bg-gray-100 font-bold uppercase tracking-wider text-black border-b border-black font-mono text-[10px]">
                        <th className="p-2 border border-black text-center w-12">S#</th>
                        <th className="p-2 border border-black text-center w-28">Voucher No</th>
                        <th className="p-2 border border-black text-center w-24">Recovery Date</th>
                        <th className="p-2 border border-black min-w-[150px] max-w-[240px]">Customer Name</th>
                        <th className="p-2 border border-black">Original Invoice Ref</th>
                        <th className="p-2 border border-black">Narration / Notes</th>
                        <th className="p-2 border border-black text-right w-36 pr-3">Recovered Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedRows.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center py-8 text-gray-400 font-medium italic">
                                No customer cash recovery collections logged within chosen selection parameters.
                            </td>
                        </tr>
                    ) : (
                        paginatedRows.map((row, idx) => (
                            <tr key={row.id || idx} className="hover:bg-slate-50 border-b border-gray-300 font-medium text-black">
                                <td className="p-1.5 border border-black text-center font-mono">{startIndex + idx + 1}</td>
                                <td className="p-1.5 border border-black text-center font-bold text-primary tracking-wide font-mono uppercase">
                                    {row.voucher_no}
                                </td>
                                <td className="p-1.5 border border-black text-center text-gray-600 font-mono">
                                    {String(row.voucher_date || '').split('T')[0]}
                                </td>
                                <td className="p-1.5 border border-black font-bold uppercase">
                                    {row.customer_name || row.customerName || 'Walking Client'}
                                </td>
                                <td className="p-1.5 border border-black font-mono text-center text-gray-600">
                                    {row.original_invoice_no || '-'}
                                </td>
                                <td className="p-1.5 border border-black text-gray-500 italic text-[10px]">
                                    {row.narration || row.notes || 'Recovery Logged'}
                                </td>
                                <td className="p-1.5 border border-black text-right font-black font-mono pr-3 text-success">
                                    Rs. {Number(row.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
                {reportRows.length > 0 && (
                    <tfoot>
                        {!isPrinting && pageSize !== 'all' && (
                            <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                                <td colSpan={6} className="p-2 border border-black text-right uppercase text-[10px]">
                                    Page Subtotal (This Page):
                                </td>
                                <td className="p-2 border border-black text-right pr-3 text-success text-xs font-black">
                                    Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.total_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        )}
                        <tr className="bg-gray-100 font-black border-t-2 border-black text-black font-mono">
                            <td colSpan={6} className="p-2 border border-black text-right uppercase text-[10px]">
                                Total Cash Receipts Collected (All {reportRows.length} Records):
                            </td>
                            <td className="p-2 border border-black text-right pr-3 text-success text-xs underline decoration-double">
                                Rs. {reportRows.reduce((sum, r) => sum + Number(r.total_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};
