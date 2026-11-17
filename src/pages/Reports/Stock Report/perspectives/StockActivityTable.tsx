import React from 'react';
import { StockProductRow } from '../types/stockReportTypes';

interface StockActivityTableProps {
    paginatedRows: StockProductRow[];
    reportRows: StockProductRow[];
    startIndex: number;
    isPrinting: boolean;
    pageSize: number | 'all';
}

export const StockActivityTable: React.FC<StockActivityTableProps> = ({
    paginatedRows,
    reportRows,
    startIndex,
    isPrinting,
    pageSize
}) => {
    return (
        <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
            <thead className="bg-slate-50 border-b border-slate-300 font-black uppercase text-black font-mono text-[10px]">
                <tr>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-10">Index</th>
                    <th rowSpan={2} className="p-2 border border-slate-300">Product Stock Asset Identifier</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-16">Group (UOM)</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Brand</th>
                    <th colSpan={3} className="p-1.5 border border-slate-300 text-center bg-slate-100 font-extrabold tracking-wider">Category Classification</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2">Opening Stock</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2 text-emerald-700">Stock In</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2 text-rose-700">Stock Out</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2">Net Movement</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-3 font-bold">Remaining Stock</th>
                </tr>
                <tr>
                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Parent</th>
                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Sub</th>
                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Leaf</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((row, idx) => (
                    <tr key={row.id} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                        <td className="p-2 border border-slate-300 text-center text-gray-400">{startIndex + idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-bold text-black font-sans uppercase">{row.product_name}</td>
                        <td className="p-2 border border-slate-300 uppercase text-center">{row.uom || 'PC'}</td>
                        <td className="p-2 border border-slate-300 font-sans text-purple-700 font-bold text-center">{row.bin || '-'}</td>
                        <td className="p-2 border border-slate-300 font-sans text-slate-800">{row.sub_sub_category || '-'}</td>
                        <td className="p-2 border border-slate-300 font-sans text-slate-700">{row.sub_category || '-'}</td>
                        <td className="p-2 border border-slate-300 font-sans text-slate-600">{row.category || '-'}</td>
                        <td className="p-2 border border-slate-300 text-right pr-2 font-mono text-gray-700">{Number(row.computed_opening || 0).toLocaleString()}</td>
                        <td className="p-2 border border-slate-300 text-right pr-2 font-mono text-emerald-700 font-bold">+{Number(row.period_stock_in || 0).toLocaleString()}</td>
                        <td className="p-2 border border-slate-300 text-right pr-2 font-mono text-rose-700 font-bold">-{Number(row.period_stock_out || 0).toLocaleString()}</td>
                        <td className={`p-2 border border-slate-300 text-right pr-2 font-mono font-bold ${(row.net_activity || 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {(row.net_activity || 0) > 0 ? `+${(row.net_activity || 0).toLocaleString()}` : (row.net_activity || 0).toLocaleString()}
                        </td>
                        <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black font-mono">{Number(row.computed_true_stock || 0).toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                {!isPrinting && pageSize !== 'all' && (
                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                        <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider">Page Subtotal (This Page):</td>
                        <td className="p-2 border border-slate-300 text-right pr-2 text-gray-700">{paginatedRows.reduce((s, r) => s + (r.computed_opening || 0), 0).toLocaleString()}</td>
                        <td className="p-2 border border-slate-300 text-right pr-2 text-emerald-700">+{paginatedRows.reduce((s, r) => s + (r.period_stock_in || 0), 0).toLocaleString()}</td>
                        <td className="p-2 border border-slate-300 text-right pr-2 text-red-700">-{paginatedRows.reduce((s, r) => s + (r.period_stock_out || 0), 0).toLocaleString()}</td>
                        <td className="p-2 border border-slate-300 text-right pr-2 text-purple-700">{paginatedRows.reduce((s, r) => s + (r.net_activity || 0), 0).toLocaleString()}</td>
                        <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black">{paginatedRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                    </tr>
                )}
                <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                    <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">Grand Total Summary (All {reportRows.length} Records):</td>
                    <td className="p-2 border border-slate-300 text-right pr-2 text-gray-700">{reportRows.reduce((s, r) => s + (r.computed_opening || 0), 0).toLocaleString()}</td>
                    <td className="p-2 border border-slate-300 text-right pr-2 text-emerald-700">+{reportRows.reduce((s, r) => s + (r.period_stock_in || 0), 0).toLocaleString()}</td>
                    <td className="p-2 border border-slate-300 text-right pr-2 text-red-700">-{reportRows.reduce((s, r) => s + (r.period_stock_out || 0), 0).toLocaleString()}</td>
                    <td className="p-2 border border-slate-300 text-right pr-2 text-purple-700">{reportRows.reduce((s, r) => s + (r.net_activity || 0), 0).toLocaleString()}</td>
                    <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black">{reportRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                </tr>
            </tfoot>
        </table>
    );
};
