import React from 'react';
import { StockProductRow } from '../types/stockReportTypes';

interface StockBalanceTableProps {
    paginatedRows: StockProductRow[];
    reportRows: StockProductRow[];
    startIndex: number;
    isPrinting: boolean;
    pageSize: number | 'all';
}

export const StockBalanceTable: React.FC<StockBalanceTableProps> = ({
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
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-12">Index</th>
                    <th rowSpan={2} className="p-2 border border-slate-300">Product Stock Asset Identifier</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-16">Group (UOM)</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Brand</th>
                    <th colSpan={3} className="p-1.5 border border-slate-300 text-center bg-slate-100 font-extrabold tracking-wider">Category Classification</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2">Dynamic Remaining Quantity</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2">Unit Rate (Rs.)</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-3">Total Valuation (Rs.)</th>
                </tr>
                <tr>
                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Parent</th>
                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Sub</th>
                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Leaf</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((row, idx) => {
                    const qty = Number(row.computed_true_stock || 0);
                    const rate = Number(row.retail_price || row.sale_price || row.purchase_price || 0);
                    const val = Number(row.calculated_valuation ?? (qty * rate));

                    return (
                        <tr key={row.id} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                            <td className="p-2 border border-slate-300 text-center text-gray-400">{startIndex + idx + 1}</td>
                            <td className="p-2 border border-slate-300 font-bold text-black font-sans uppercase">{row.product_name}</td>
                            <td className="p-2 border border-slate-300 uppercase text-center">{row.uom || 'PC'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-purple-700 font-bold text-center">{row.bin || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-slate-800">{row.sub_sub_category || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-slate-700">{row.sub_category || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-slate-600">{row.category || '-'}</td>
                            <td className="p-2 border border-slate-300 text-right pr-2 text-success font-black">{qty.toLocaleString()}</td>
                            <td className="p-2 border border-slate-300 text-right pr-2 font-mono text-gray-700">
                                {rate > 0 ? rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="p-2 border border-slate-300 text-right pr-3 font-mono font-bold text-slate-900">
                                {val > 0 ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            <tfoot>
                {!isPrinting && pageSize !== 'all' && (
                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                        <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider">Page Subtotal (This Page):</td>
                        <td className="p-2 border border-slate-300 text-right pr-2 text-success font-black text-sm">
                            {paginatedRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}
                        </td>
                        <td className="p-2 border border-slate-300 text-right pr-2">-</td>
                        <td className="p-2 border border-slate-300 text-right pr-3 text-slate-900 font-black text-sm">
                            {paginatedRows.reduce((s, r) => s + (Number(r.calculated_valuation ?? ((r.computed_true_stock || 0) * (r.retail_price || r.sale_price || r.purchase_price || 0)))), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                )}
                <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                    <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">Grand Total Balance Sum (All {reportRows.length} Records):</td>
                    <td className="p-2 border border-slate-300 text-right pr-2 text-success font-black text-sm">
                        {reportRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}
                    </td>
                    <td className="p-2 border border-slate-300 text-right pr-2">-</td>
                    <td className="p-2 border border-slate-300 text-right pr-3 text-emerald-800 font-black text-sm">
                        Rs. {reportRows.reduce((s, r) => s + (Number(r.calculated_valuation ?? ((r.computed_true_stock || 0) * (r.retail_price || r.sale_price || r.purchase_price || 0)))), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                </tr>
            </tfoot>
        </table>
    );
};
