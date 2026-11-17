import React from 'react';

interface MasterLedgerSummaryTableProps {
    activeTab: number;
    paginatedRows: any[];
    startIndex: number;
    isPrinting: boolean;
    pageSize: number | string;
    reportRows: any[];
}

export const MasterLedgerSummaryTable: React.FC<MasterLedgerSummaryTableProps> = ({
    activeTab,
    paginatedRows,
    startIndex,
    isPrinting,
    pageSize,
    reportRows
}) => {
    return (
        <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
            <thead className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                <tr>
                    <th className="p-1.5 border border-black text-center w-12">S#</th>
                    <th className="p-1.5 border border-black text-center w-28">Date</th>
                    <th className="p-1.5 border border-black w-36">Invoice / Ref No</th>
                    <th className="p-1.5 border border-black min-w-[150px] max-w-[260px]">{activeTab === 2 ? 'Customer Name' : 'Supplier Name'}</th>
                    <th className="p-1.5 border border-black text-center w-24">Payment Term</th>
                    <th className="p-1.5 border border-black text-right pr-3 w-40">Gross Invoice Amount</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((row, i) => (
                    <tr key={row.id || i} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs">
                        <td className="p-1.5 border border-black text-center text-gray-400">{startIndex + i + 1}</td>
                        <td className="p-1.5 border border-black text-center text-gray-600 font-mono">
                            {String(row.sale_date || row.created_at || '').split('T')[0]}
                        </td>
                        <td className="p-1.5 border border-black text-primary font-black uppercase">{row.purchase_no || row.id}</td>
                        <td className="p-1.5 border border-black text-black font-sans font-bold">{row.customer_name || row.supplier_name || 'Generic Client Agent'}</td>
                        <td className="p-1.5 border border-black text-center uppercase font-bold text-[10px]">{row.payment_term || 'Settle'}</td>
                        <td className="p-1.5 border border-black text-right pr-3 text-success font-black">Rs. {Number(row.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                {!isPrinting && pageSize !== 'all' && (
                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                        <td colSpan={5} className="p-2 border border-black text-right uppercase">Page Subtotal (This Page):</td>
                        <td className="p-2 border border-black text-right pr-3 text-success font-black">
                            Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.total_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                )}
                <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                    <td colSpan={5} className="p-2 border border-black text-right uppercase text-gray-800">Gross Account Aggregations (All {reportRows.length} Records):</td>
                    <td className="p-2 border border-black text-right pr-3 text-success underline decoration-double text-sm font-black">
                        Rs. {reportRows.reduce((sum, r) => sum + Number(r.total_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                </tr>
            </tfoot>
        </table>
    );
};
