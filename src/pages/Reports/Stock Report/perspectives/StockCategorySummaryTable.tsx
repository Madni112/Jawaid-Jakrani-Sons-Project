import React from 'react';
import { CategorySummaryItem, StockProductRow } from '../types/stockReportTypes';

interface StockCategorySummaryTableProps {
    paginatedCategorySummaryRows: CategorySummaryItem[];
    categorySummaryRows: CategorySummaryItem[];
    reportRows: StockProductRow[];
    startIndex: number;
    isPrinting: boolean;
    pageSize: number | 'all';
}

export const StockCategorySummaryTable: React.FC<StockCategorySummaryTableProps> = ({
    paginatedCategorySummaryRows,
    categorySummaryRows,
    reportRows,
    startIndex,
    isPrinting,
    pageSize
}) => {
    return (
        <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
            <thead className="bg-slate-100 border-b border-slate-400 font-black uppercase text-slate-800 font-mono text-[10px]">
                <tr>
                    <th className="p-2 border border-slate-300 text-center w-12">S#</th>
                    <th className="p-2 border border-slate-300">Parent Category</th>
                    <th className="p-2 border border-slate-300">Sub-Category</th>
                    <th className="p-2 border border-slate-300">Leaf Category Title</th>
                    <th className="p-2 border border-slate-300 text-center w-24 text-emerald-800">Products</th>
                    <th className="p-2 border border-slate-300 text-right w-28">Stock Units</th>
                    <th className="p-2 border border-slate-300 text-right w-36 pr-3 text-emerald-800">Asset Valuation (PKR)</th>
                    <th className="p-2 border border-slate-300 text-right pr-2 w-20">Share %</th>
                </tr>
            </thead>
            <tbody>
                {paginatedCategorySummaryRows.length === 0 ? (
                    <tr>
                        <td colSpan={8} className="text-center py-10 font-bold italic border border-slate-300 text-gray-400 bg-gray-50">
                            No category records found matching selected criteria.
                        </td>
                    </tr>
                ) : (
                    paginatedCategorySummaryRows.map((cat, idx) => {
                        const displayIdx = (!isPrinting && pageSize !== 'all') ? startIndex + idx + 1 : idx + 1;
                        return (
                            <tr key={idx} className="border-b border-slate-300 hover:bg-slate-50 font-semibold font-mono text-xs">
                                <td className="p-2 border border-slate-300 text-center text-gray-400">{displayIdx}</td>
                                <td className="p-2 border border-slate-300 font-sans uppercase font-bold text-slate-900">{cat.parent_name}</td>
                                <td className="p-2 border border-slate-300 font-sans text-slate-700">{cat.sub_name}</td>
                                <td className="p-2 border border-slate-300 font-sans font-bold text-slate-900">{cat.category_name}</td>
                                <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{cat.products_count}</td>
                                <td className="p-2 border border-slate-300 text-right font-black text-primary">{Number(cat.total_units).toLocaleString()}</td>
                                <td className="p-2 border border-slate-300 text-right pr-3 font-mono font-black text-emerald-800">
                                    Rs. {Number(cat.total_valuation).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="p-2 border border-slate-300 text-right pr-2 font-mono font-bold text-slate-600">
                                    {Number(cat.contribution_pct || 0).toFixed(1)}%
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
            <tfoot>
                {!isPrinting && pageSize !== 'all' && (
                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                        <td colSpan={4} className="p-2 border border-slate-300 text-right uppercase tracking-wider">Page Subtotal (This Page):</td>
                        <td className="p-2 border border-slate-300 text-center">{paginatedCategorySummaryRows.reduce((s, r) => s + (r.products_count || 0), 0)}</td>
                        <td className="p-2 border border-slate-300 text-right font-black text-primary">{paginatedCategorySummaryRows.reduce((s, r) => s + (r.total_units || 0), 0).toLocaleString()}</td>
                        <td className="p-2 border border-slate-300 text-right pr-3 text-emerald-800 font-black">
                            Rs. {paginatedCategorySummaryRows.reduce((s, r) => s + (r.total_valuation || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-slate-300 text-right pr-2 font-black">
                            {paginatedCategorySummaryRows.reduce((s, r) => s + (r.contribution_pct || 0), 0).toFixed(1)}%
                        </td>
                    </tr>
                )}
                <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                    <td colSpan={4} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">
                        Grand Total Summary ({categorySummaryRows.length} Categories • {reportRows.length} Products):
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-black text-slate-800">{reportRows.length}</td>
                    <td className="p-2 border border-slate-300 text-right font-black text-primary">{categorySummaryRows.reduce((s, r) => s + (r.total_units || 0), 0).toLocaleString()}</td>
                    <td className="p-2 border border-slate-300 text-right pr-3 text-emerald-800 underline decoration-double font-black text-sm">
                        Rs. {categorySummaryRows.reduce((s, r) => s + (r.total_valuation || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-slate-300 text-right pr-2 font-black">100.0%</td>
                </tr>
            </tfoot>
        </table>
    );
};
