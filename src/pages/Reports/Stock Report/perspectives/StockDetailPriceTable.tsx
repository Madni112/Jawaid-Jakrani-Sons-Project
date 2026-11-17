import React from 'react';
import { StockProductRow, StockReportFilter } from '../types/stockReportTypes';

interface StockDetailPriceTableProps {
    paginatedRows: StockProductRow[];
    reportRows: StockProductRow[];
    startIndex: number;
    isPrinting: boolean;
    pageSize: number | 'all';
    filters: StockReportFilter;
}

export const StockDetailPriceTable: React.FC<StockDetailPriceTableProps> = ({
    paginatedRows,
    reportRows,
    startIndex,
    isPrinting,
    pageSize,
    filters
}) => {
    return (
        <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
            <thead className="bg-slate-50 border-b border-slate-300 font-black uppercase text-black font-mono text-[10px]">
                <tr>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-12">Index</th>
                    <th rowSpan={2} className="p-2 border border-slate-300">Product Stock Asset Name</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-16">Group (UOM)</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Brand</th>
                    <th colSpan={3} className="p-1.5 border border-slate-300 text-center bg-slate-100 font-extrabold tracking-wider">Category Classification</th>
                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-16">Bal Qty</th>
                    {filters.showSalePrice && <th rowSpan={2} className="p-2 border border-slate-300 text-right w-28">Retail Sale (PKR)</th>}
                    {filters.showPurchasePrice && <th rowSpan={2} className="p-2 border border-slate-300 text-right w-28">Purchase Cost (PKR)</th>}
                    {filters.showFinalPrice && <th rowSpan={2} className="p-2 border border-slate-300 text-right w-32 pr-3">Net Asset Valuation</th>}
                    {filters.showSpecifications && <th rowSpan={2} className="p-2 border border-slate-300 font-sans text-gray-500">Technical Specifications Sheet Overview</th>}
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
                    const pPrice = Number(row.purchase_price ?? row.cost_price ?? row.buy_price ?? row.cost ?? row.tp ?? 0);
                    const netValue = qty * sPrice;

                    return (
                        <tr key={row.id} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                            <td className="p-2 border border-slate-300 text-center text-gray-400">{startIndex + idx + 1}</td>
                            <td className="p-2 border border-slate-300 font-bold text-black font-sans uppercase">{row.product_name}</td>
                            <td className="p-2 border border-slate-300 uppercase text-center">{row.uom || 'PC'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-purple-700 font-bold text-center">{row.bin || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-slate-800">{row.sub_sub_category || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-slate-700">{row.sub_category || '-'}</td>
                            <td className="p-2 border border-slate-300 font-sans text-slate-600">{row.category || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center text-primary font-black">{qty.toLocaleString()}</td>
                            {filters.showSalePrice && <td className="p-2 border border-slate-300 text-right text-gray-600">Rs. {sPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>}
                            {filters.showPurchasePrice && <td className="p-2 border border-slate-300 text-right text-purple-700">Rs. {pPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>}
                            {filters.showFinalPrice && <td className="p-2 border border-slate-300 text-right text-success font-black pr-3">Rs. {netValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>}
                            {filters.showSpecifications && (
                                <td className="p-2 border border-slate-300 font-sans text-[10px] text-gray-500 whitespace-normal break-words leading-relaxed max-w-sm">
                                    {row.product_description || row.specifications || row.description || (row.hs_code ? `HS: ${row.hs_code}` : 'N/A')}
                                </td>
                            )}
                        </tr>
                    );
                })}
            </tbody>
            <tfoot>
                {!isPrinting && pageSize !== 'all' && (
                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                        <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider">Page Subtotal (This Page):</td>
                        <td className="p-2 border border-slate-300 text-center text-primary font-black">{paginatedRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                        {filters.showSalePrice && <td className="p-2 border border-slate-300"></td>}
                        {filters.showPurchasePrice && <td className="p-2 border border-slate-300"></td>}
                        {filters.showFinalPrice && (
                            <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black text-sm">
                                Rs. {paginatedRows.reduce((s, r) => {
                                    const q = Number(r.computed_true_stock || 0);
                                    const sp = Number(r.sale_price ?? r.retail_price ?? r.price ?? r.unit_price ?? r.mrp ?? r.rp ?? 0);
                                    return s + (q * sp);
                                }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                        )}
                        {filters.showSpecifications && <td className="p-2 border border-slate-300"></td>}
                    </tr>
                )}
                <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                    <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">Grand Total Assets Valuation (All {reportRows.length} Records):</td>
                    <td className="p-2 border border-slate-300 text-center text-primary font-black">{reportRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                    {filters.showSalePrice && <td className="p-2 border border-slate-300"></td>}
                    {filters.showPurchasePrice && <td className="p-2 border border-slate-300"></td>}
                    {filters.showFinalPrice && (
                        <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black text-sm">
                            Rs. {reportRows.reduce((s, r) => {
                                const q = Number(r.computed_true_stock || 0);
                                const sp = Number(r.sale_price ?? r.retail_price ?? r.price ?? r.unit_price ?? r.mrp ?? r.rp ?? 0);
                                return s + (q * sp);
                            }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                    )}
                    {filters.showSpecifications && <td className="p-2 border border-slate-300"></td>}
                </tr>
            </tfoot>
        </table>
    );
};
