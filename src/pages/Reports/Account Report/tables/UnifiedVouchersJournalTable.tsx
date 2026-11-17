import React from 'react';

interface UnifiedVouchersJournalTableProps {
    paginatedRows: any[];
    startIndex: number;
    filters: any;
    isPrinting: boolean;
    pageSize: number | string;
    reportRows: any[];
}

export const UnifiedVouchersJournalTable: React.FC<UnifiedVouchersJournalTableProps> = ({
    paginatedRows,
    startIndex,
    filters,
    isPrinting,
    pageSize,
    reportRows
}) => {
    return (
        <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
            <thead className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                <tr>
                    <th className="p-1.5 border border-black text-center w-12">S#</th>
                    <th className="p-1.5 border border-black text-center w-28">Voucher Date</th>
                    <th className="p-1.5 border border-black w-32">Voucher / Ref No</th>
                    <th className="p-1.5 border border-black w-36">Voucher Type</th>
                    <th className="p-1.5 border border-black">Beneficiary / Particulars / Remarks</th>
                    <th className="p-1.5 border border-black text-right pr-3 w-36">Voucher Amount (PKR)</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((row, i) => {
                    const displayVoucherNo = row.voucher_no || row.voucherNo || row.purchase_no || `VCH-00${row.id}`;
                    const displayVoucherType = row.voucher_type || row.voucherType || filters.saleType || 'Voucher Entry';
                    const displayDate = row.voucher_date || row.voucherDate || row.processing_date || row.sale_date || String(row.created_at || '').split('T')[0];
                    const displayAmount = row.total_amount || row.amount_paid || row.net_collected_amount || row.amountReceived || row.amount || 0;
                    const displayRemarks = row.narration || row.notes || row.remarks || row.scenario_type || 'System verified log';

                    return (
                        <tr key={row.id || i} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs">
                            <td className="p-1.5 border border-black text-center text-gray-400">{startIndex + i + 1}</td>
                            <td className="p-1.5 border border-black text-center text-gray-500">{displayDate}</td>
                            <td className="p-1.5 border border-black text-primary font-black uppercase">{displayVoucherNo}</td>
                            <td className="p-1.5 border border-black font-sans text-purple-700 font-bold uppercase">{displayVoucherType}</td>
                            <td className="p-1.5 border border-black font-sans text-gray-600 truncate max-w-xs">{displayRemarks}</td>
                            <td className="p-1.5 border border-black text-right pr-3 text-success font-black">Rs. {Number(displayAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    );
                })}
            </tbody>
            <tfoot>
                {!isPrinting && pageSize !== 'all' && (
                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                        <td colSpan={5} className="p-2 border border-black text-right uppercase">Page Subtotal (This Page):</td>
                        <td className="p-2 border border-black text-right pr-3 text-success font-black">
                            Rs. {paginatedRows.reduce((sum, r) => {
                                const amt = r.total_amount || r.amount_paid || r.net_collected_amount || r.amountReceived || r.amount || 0;
                                return sum + Number(amt);
                            }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                )}
                <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                    <td colSpan={5} className="p-2 border border-black text-right uppercase text-gray-800">Gross Transacted Total (All {reportRows.length} Records):</td>
                    <td className="p-2 border border-black text-right pr-3 text-success underline decoration-double text-sm font-black">
                        Rs. {reportRows.reduce((sum, r) => {
                            const amt = r.total_amount || r.amount_paid || r.net_collected_amount || r.amountReceived || r.amount || 0;
                            return sum + Number(amt);
                        }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                </tr>
            </tfoot>
        </table>
    );
};
