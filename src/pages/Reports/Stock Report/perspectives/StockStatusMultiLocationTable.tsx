import React from 'react';
import { StockProductRow } from '../types/stockReportTypes';
import { formatStockWithBoxesAndPcs } from '../../../../utils/stockCalculator';

interface StockStatusMultiLocationTableProps {
    paginatedRows: StockProductRow[];
    reportRows: StockProductRow[];
    startIndex: number;
    isPrinting: boolean;
    pageSize: number | 'all';
    formatLocationName: (loc?: string) => string;
}

export const StockStatusMultiLocationTable: React.FC<StockStatusMultiLocationTableProps> = ({
    paginatedRows,
    reportRows,
    startIndex,
    isPrinting,
    pageSize,
    formatLocationName
}) => {
    return (
        <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
            <thead className="bg-slate-50 border-b border-slate-300 font-black uppercase text-black font-mono text-[10px]">
                <tr>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-12">Index</th>
                    <th rowSpan={2} className="p-2 border border-slate-300">Product Stock Asset Identifier</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Brand</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-24">Color / Shade</th>
                    <th colSpan={3} className="p-1.5 border border-slate-300 text-center bg-slate-100 font-extrabold tracking-wider">Category Classification</th>
                    <th rowSpan={2} className="p-2 border border-slate-300">Warehouse Location</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center">Stock Availability Status</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-3">Dynamic Remaining Quantity</th>
                </tr>
                <tr>
                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Parent</th>
                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Sub</th>
                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Leaf</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((row, idx) => {
                    const breakdowns: Array<{ location: string; qty: number }> = (row.locationBreakdown && row.locationBreakdown.length > 0)
                        ? row.locationBreakdown
                        : [{ location: formatLocationName(row.warehouse_location || row.location), qty: Number(row.computed_true_stock || 0) }];

                    return (
                        <tr key={row.id || idx} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                            <td className="p-2 border border-slate-300 text-center text-gray-400 align-middle">{startIndex + idx + 1}</td>
                            <td className="p-2 border border-slate-300 font-bold text-black font-sans uppercase align-middle">{row.product_name}</td>
                            <td className="p-2 border border-slate-300 font-sans text-purple-700 font-bold text-center align-middle">{row.bin || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-center text-slate-700 font-medium align-middle">{row.color || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-slate-800 align-middle">{row.sub_sub_category || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-slate-700 align-middle">{row.sub_category || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-slate-600 align-middle">{row.category || '-'}</td>

                            {/* Multi-Location Expanded Sub-Rows */}
                            <td className="p-0 border border-slate-300 align-top">
                                <div className="divide-y divide-slate-300 h-full flex flex-col justify-stretch">
                                    {breakdowns.map((b, bIdx) => (
                                        <div key={bIdx} className="p-2 font-sans text-gray-700 font-bold flex-1 flex items-center min-h-[34px]">
                                            {b.location}
                                        </div>
                                    ))}
                                </div>
                            </td>

                            <td className="p-0 border border-slate-300 align-top">
                                <div className="divide-y divide-slate-300 h-full flex flex-col justify-stretch">
                                    {breakdowns.map((b, bIdx) => {
                                        const bQty = Number(b.qty || 0);
                                        let statusBadge = (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-green-100 text-green-800 border border-green-300">
                                                In Stock
                                            </span>
                                        );
                                        if (bQty <= 0) {
                                            statusBadge = (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-300">
                                                    Out of Stock
                                                </span>
                                            );
                                        } else if (bQty <= 10) {
                                            statusBadge = (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-yellow-100 text-yellow-800 border border-yellow-300">
                                                    Low Stock
                                                </span>
                                            );
                                        }
                                        return (
                                            <div key={bIdx} className="p-2 flex-1 flex items-center justify-center min-h-[34px]">
                                                {statusBadge}
                                            </div>
                                        );
                                    })}
                                </div>
                            </td>

                            <td className="p-0 border border-slate-300 align-top">
                                <div className="divide-y divide-slate-300 h-full flex flex-col justify-stretch">
                                    {breakdowns.map((b, bIdx) => {
                                        const bQty = Number(b.qty || 0);
                                        return (
                                            <div key={bIdx} className="p-2 pr-3 text-right text-success font-black flex-1 flex items-center justify-end min-h-[34px] whitespace-nowrap">
                                                {formatStockWithBoxesAndPcs(bQty, row).inlineText}
                                            </div>
                                        );
                                    })}
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            <tfoot>
                {!isPrinting && pageSize !== 'all' && (
                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                        <td colSpan={8} className="p-2 border border-slate-300 text-right uppercase tracking-wider">Page Subtotal (This Page):</td>
                        <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black text-sm">{paginatedRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                    </tr>
                )}
                <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                    <td colSpan={8} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">Grand Total Available Units (All {reportRows.length} Records):</td>
                    <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black text-sm">{reportRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                </tr>
            </tfoot>
        </table>
    );
};
