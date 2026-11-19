import React from 'react';
import { StockProductRow } from '../types/stockReportTypes';

interface LocationLedgerTableProps {
    paginatedRows: StockProductRow[];
    reportRows: StockProductRow[];
    startIndex: number;
    isPrinting: boolean;
    pageSize: number | 'all';
    formatLocationName: (loc?: string) => string;
}

export const LocationLedgerTable: React.FC<LocationLedgerTableProps> = ({
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
                    <th rowSpan={2} className="p-2 border border-slate-300">Warehouse Location</th>
                    <th rowSpan={2} className="p-2 border border-slate-300">Product Stock Asset Name</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-16">Group (UOM)</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Brand</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-24">Color / Shade</th>
                    <th colSpan={3} className="p-1.5 border border-slate-300 text-center bg-slate-100 font-extrabold tracking-wider">Category Classification</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-24">Available Stock</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-right w-28">Unit Sale Rate</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-right w-36 pr-3 text-success">Location Asset Valuation</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-24">Stock Availability</th>
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
                    const sPrice = Number(row.sale_price ?? row.retail_price ?? row.price ?? row.unit_price ?? row.mrp ?? row.rp ?? 0);
                    const netValue = qty * sPrice;
                    const locName = formatLocationName(row.warehouse_location || row.location);

                    let statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-green-100 text-green-800 border border-green-300">
                            In Stock
                        </span>
                    );
                    if (qty <= 0) {
                        statusBadge = (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-300">
                                Out of Stock
                            </span>
                        );
                    } else if (qty <= 10) {
                        statusBadge = (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-yellow-100 text-yellow-800 border border-yellow-300">
                                Low Stock
                            </span>
                        );
                    }

                    return (
                        <tr key={row.id || idx} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                            <td className="p-2 border border-slate-300 text-center text-gray-400">{startIndex + idx + 1}</td>
                            <td className="p-2 border border-slate-300 font-sans font-bold text-purple-800 uppercase bg-purple-50/40">{locName}</td>
                            <td className="p-2 border border-slate-300 font-bold text-black font-sans uppercase">{row.product_name}</td>
                            <td className="p-2 border border-slate-300 uppercase text-center">{row.uom || 'PC'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-purple-700 font-bold text-center">{row.bin || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-center text-slate-700 font-medium">{row.color || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-slate-800">{row.sub_sub_category || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-slate-700">{row.sub_category || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-slate-600">{row.category || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center text-primary font-black text-sm">{qty.toLocaleString()}</td>
                            <td className="p-2 border border-slate-300 text-right text-gray-600">Rs. {sPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="p-2 border border-slate-300 text-right text-success font-black pr-3 bg-success/5">Rs. {netValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="p-2 border border-slate-300 text-center">{statusBadge}</td>
                        </tr>
                    );
                })}
            </tbody>
            <tfoot>
                {!isPrinting && pageSize !== 'all' && (
                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                        <td colSpan={8} className="p-2 border border-slate-300 text-right uppercase tracking-wider">Page Subtotal (This Page):</td>
                        <td className="p-2 border border-slate-300 text-center text-primary font-black text-sm">{paginatedRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                        <td className="p-2 border border-slate-300"></td>
                        <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black text-sm bg-success/10">
                            Rs. {paginatedRows.reduce((sum, r) => {
                                const q = Number(r.computed_true_stock || 0);
                                const sp = Number(r.sale_price ?? r.retail_price ?? r.price ?? r.unit_price ?? r.mrp ?? r.rp ?? 0);
                                return sum + (q * sp);
                            }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-slate-300"></td>
                    </tr>
                )}
                <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                    <td colSpan={8} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">Grand Total Location Summary (All {reportRows.length} Records):</td>
                    <td className="p-2 border border-slate-300 text-center text-primary font-black text-sm">{reportRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                    <td className="p-2 border border-slate-300"></td>
                    <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black text-sm bg-success/10">
                        Rs. {reportRows.reduce((sum, r) => {
                            const q = Number(r.computed_true_stock || 0);
                            const sp = Number(r.sale_price ?? r.retail_price ?? r.price ?? r.unit_price ?? r.mrp ?? r.rp ?? 0);
                            return sum + (q * sp);
                        }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-slate-300"></td>
                </tr>
            </tfoot>
        </table>
    );
};
