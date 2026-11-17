import React from 'react';

interface StockTransferTableProps {
    paginatedRows: any[];
    startIndex: number;
}

export const StockTransferTable: React.FC<StockTransferTableProps> = ({
    paginatedRows,
    startIndex
}) => {
    return (
        <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
            <thead className="bg-slate-50 border-b border-slate-300 font-black uppercase text-black font-mono text-[10px]">
                <tr>
                    <th className="p-2 border border-slate-300 text-center w-12">Index</th>
                    <th className="p-2 border border-slate-300">Transfer Slip #</th>
                    <th className="p-2 border border-slate-300">Transfer Date</th>
                    <th className="p-2 border border-slate-300">From Location</th>
                    <th className="p-2 border border-slate-300">To Location</th>
                    <th className="p-2 border border-slate-300">Items Transferred</th>
                    <th className="p-2 border border-slate-300 text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((tr, idx) => {
                    const itemsArray = Array.isArray(tr.items) ? tr.items : JSON.parse(tr.items || '[]');
                    const itemSummary = itemsArray.map((i: any) => `${i.itemName || i.product_name} (${i.qty || 1} ${i.uom || ''})`).join(', ');

                    return (
                        <tr key={tr.id} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                            <td className="p-2 border border-slate-300 text-center text-gray-400">{startIndex + idx + 1}</td>
                            <td className="p-2 border border-slate-300 font-bold text-primary font-sans">{tr.transfer_no || `TRF-${tr.id}`}</td>
                            <td className="p-2 border border-slate-300">{tr.transfer_date || tr.created_at?.split('T')[0]}</td>
                            <td className="p-2 border border-slate-300 font-sans text-red-700 font-bold">{tr.from_location}</td>
                            <td className="p-2 border border-slate-300 font-sans text-green-700 font-bold">{tr.to_location}</td>
                            <td className="p-2 border border-slate-300 font-sans text-gray-700">{itemSummary || 'N/A'}</td>
                            <td className="p-2 border border-slate-300 text-center font-bold text-purple-700 uppercase">{tr.status || 'Confirmed'}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};
