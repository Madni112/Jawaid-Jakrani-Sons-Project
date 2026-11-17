import React from 'react';

interface SalesmanCollectionTableProps {
    paginatedRows: any[];
    startIndex: number;
    isPrinting: boolean;
    pageSize: number | string;
    reportRows: any[];
}

export const SalesmanCollectionTable: React.FC<SalesmanCollectionTableProps> = ({
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
                    <th className="p-1.5 border border-black w-32">Invoice / Ref No</th>
                    <th className="p-1.5 border border-black w-36">Entry Classification</th>
                    <th className="p-1.5 border border-black w-32">Sales Officer</th>
                    <th className="p-1.5 border border-black min-w-[140px] max-w-[220px]">Customer Name</th>
                    <th className="p-1.5 border border-black text-right w-32">Sales Invoice (PKR)</th>
                    <th className="p-1.5 border border-black text-right w-32 pr-3">Cash Collected (PKR)</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((row, i) => (
                    <tr key={row.id || i} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs">
                        <td className="p-1.5 border border-black text-center text-gray-400">{startIndex + i + 1}</td>
                        <td className="p-1.5 border border-black text-center text-gray-500">{row.raw_date}</td>
                        <td className="p-1.5 border border-black text-primary font-black uppercase">{row.doc_ref}</td>
                        <td className="p-1.5 border border-black text-purple-700 font-bold uppercase text-[10px]">{row.entry_type}</td>
                        <td className="p-1.5 border border-black font-sans text-black font-bold">{row.salesman}</td>
                        <td className="p-1.5 border border-black font-sans text-gray-700">{row.customer_name}</td>
                        <td className="p-1.5 border border-black text-right text-black font-bold">Rs. {Number(row.sale_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-1.5 border border-black text-right pr-3 text-success font-black">Rs. {Number(row.collected_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                {!isPrinting && pageSize !== 'all' && (
                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                        <td colSpan={6} className="p-2 border border-black text-right uppercase tracking-wider">
                            Page Subtotal (This Page):
                        </td>
                        <td className="p-2 border border-black text-right text-black font-bold">
                            Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.sale_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right pr-3 text-success font-black">
                            Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.collected_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                )}
                <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                    <td colSpan={6} className="p-2 border border-black text-right uppercase tracking-wider text-black">
                        Total Performance Aggregations (All {reportRows.length} Records):
                    </td>
                    <td className="p-2 border border-black text-right text-black font-black text-sm">
                        Rs. {reportRows.reduce((sum, r) => sum + Number(r.sale_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right pr-3 text-success font-black underline decoration-double text-sm">
                        Rs. {reportRows.reduce((sum, r) => sum + Number(r.collected_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                </tr>
            </tfoot>
        </table>
    );
};
