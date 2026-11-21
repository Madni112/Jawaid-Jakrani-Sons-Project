import React from 'react';
import { CategoryHierarchyParent, StockProductRow } from '../types/stockReportTypes';
import { formatStockWithBoxesAndPcs } from '../../../../utils/stockCalculator';

interface StockHierarchyTreeTableProps {
    paginatedCategoryTree: CategoryHierarchyParent[];
    categoryHierarchyTree: CategoryHierarchyParent[];
    reportRows: StockProductRow[];
    currentPage: number;
}

export const StockHierarchyTreeTable: React.FC<StockHierarchyTreeTableProps> = ({
    paginatedCategoryTree,
    categoryHierarchyTree,
    reportRows,
    currentPage
}) => {
    return (
        <div className="space-y-6">
            {/* Aggregation Summary Indicator */}
            <div className="flex justify-between items-center mb-2 print:hidden">
                <div className="text-xs text-slate-700 font-mono font-bold bg-slate-100 border border-slate-200 px-3 py-1.5 rounded">
                    Showing <b>{paginatedCategoryTree.reduce((sum, p) => sum + p.total_skus, 0)}</b> of <b>{reportRows.length}</b> Products (Across <b>{paginatedCategoryTree.length}</b> Categories on Page {currentPage})
                </div>
            </div>

            {paginatedCategoryTree.map((pNode, pIdx) => {
                const pKey = `parent-${pNode.parent_id || pNode.parent_name || pIdx}`;

                return (
                    <div key={pKey} className="border-2 border-slate-700 rounded-lg overflow-hidden shadow-sm bg-white print:break-inside-avoid print:mb-6">
                        {/* Parent Category Banner (Permanently Visible) */}
                        <div className="bg-slate-800 text-white p-2.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 select-none">
                            <div className="flex items-center gap-2.5">
                                <span className="font-sans font-black uppercase text-xs tracking-wider">
                                    {pNode.parent_name}
                                </span>
                                <span className="bg-slate-700 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-600 font-bold">
                                    {pNode.total_skus} {pNode.total_skus === 1 ? 'Product' : 'Products'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 font-mono text-xs flex-wrap">
                                <span>Total Stock: <b>{pNode.total_units.toLocaleString()} Units</b></span>
                                <span className="text-emerald-300 font-black">
                                    Valuation: Rs. {pNode.total_valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="bg-emerald-900/60 text-emerald-200 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded font-black">
                                    {pNode.grand_share_pct.toFixed(1)}% Share
                                </span>
                            </div>
                        </div>

                        {/* Sub Categories (Permanently Open) */}
                        <div className="p-3 space-y-4 bg-slate-50">
                            {pNode.sub_categories.map((sNode, sIdx) => {
                                const sKey = `sub-${pIdx}-${sIdx}`;

                                return (
                                    <div key={sKey} className="border border-slate-300 rounded-md bg-white overflow-hidden shadow-2xs">
                                        {/* Sub-Category Banner */}
                                        <div className="bg-slate-100 p-2 flex justify-between items-center font-mono text-xs border-b border-slate-200">
                                            <div className="flex items-center gap-2 pl-2">
                                                <span className="font-bold uppercase text-slate-800 font-sans text-xs">
                                                    ↳ Sub-Category: {sNode.sub_name}
                                                </span>
                                                <span className="text-slate-500 text-[10px] font-bold">
                                                    ({sNode.total_skus} {sNode.total_skus === 1 ? 'Product' : 'Products'})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-semibold">
                                                <span className="text-slate-700 font-bold">{sNode.total_units.toLocaleString()} Units</span>
                                                <span className="font-black text-slate-900">
                                                    Rs. {sNode.total_valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Leaf Categories (Permanently Open) */}
                                        <div className="p-2.5 space-y-3">
                                            {sNode.categories.map((lNode, lIdx) => (
                                                <div key={lIdx} className="border border-slate-200 rounded overflow-hidden">
                                                    <div className="text-[11px] font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 border-b border-slate-200 flex justify-between items-center font-mono">
                                                        <span className="font-sans font-bold text-slate-900">• {lNode.category_name} ({lNode.products.length} {lNode.products.length === 1 ? 'Product' : 'Products'})</span>
                                                        <span className="text-emerald-800 font-black">
                                                            Leaf Valuation: Rs. {lNode.total_valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>

                                                    <table className="w-full table-auto border border-collapse border-slate-200 text-[11px] font-sans text-left">
                                                        <thead className="bg-slate-100 border-b border-slate-300 font-black uppercase text-slate-700 font-mono text-[9.5px]">
                                                            <tr>
                                                                <th className="p-1.5 border border-slate-300 text-center w-10">S#</th>
                                                                <th className="p-1.5 border border-slate-300">Product Stock Asset Identifier</th>
                                                                <th className="p-1.5 border border-slate-300 text-center w-20">Brand</th>
                                                                <th className="p-1.5 border border-slate-300 text-center w-16">UOM</th>
                                                                <th className="p-1.5 border border-slate-300 text-right w-24">Balance Units</th>
                                                                <th className="p-1.5 border border-slate-300 text-right w-28">Unit Rate (Rs.)</th>
                                                                <th className="p-1.5 border border-slate-300 text-right w-36 pr-3 text-emerald-800">Asset Valuation (Rs.)</th>
                                                                <th className="p-1.5 border border-slate-300 text-right pr-2 w-16">Share %</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {lNode.products.map((p, pItemIdx) => (
                                                                <tr key={p.id || pItemIdx} className="border-b border-slate-200 hover:bg-slate-50 font-semibold font-mono text-xs">
                                                                    <td className="p-1.5 border border-slate-300 text-center text-gray-400">{pItemIdx + 1}</td>
                                                                    <td className="p-1.5 border border-slate-300 font-bold text-black font-sans uppercase">{p.product_name}</td>
                                                                    <td className="p-1.5 border border-slate-300 font-sans text-purple-700 font-bold text-center">{p.bin || '-'}</td>
                                                                    <td className="p-1.5 border border-slate-300 uppercase text-center text-slate-600">{p.uom || 'PC'}</td>
                                                                    <td className="p-1.5 border border-slate-300 text-right font-black text-primary whitespace-nowrap">
                                                                        {formatStockWithBoxesAndPcs(p.stock_qty, p).inlineText}
                                                                    </td>
                                                                    <td className="p-1.5 border border-slate-300 text-right font-mono text-gray-700">
                                                                        {p.unit_rate > 0 ? `Rs. ${p.unit_rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                                                    </td>
                                                                    <td className="p-1.5 border border-slate-300 text-right pr-3 font-mono font-bold text-slate-900">
                                                                        {p.line_valuation > 0 ? `Rs. ${p.line_valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                                                    </td>
                                                                    <td className="p-1.5 border border-slate-300 text-right pr-2 font-mono text-slate-600">
                                                                        {p.share_of_category.toFixed(1)}%
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="bg-slate-50 border-t border-slate-300 font-black font-mono text-xs">
                                                                <td colSpan={4} className="p-1.5 border border-slate-300 text-right uppercase text-slate-700">
                                                                    Subtotal for {lNode.category_name}:
                                                                </td>
                                                                <td className="p-1.5 border border-slate-300 text-right font-black text-primary">
                                                                    {lNode.total_units.toLocaleString()}
                                                                </td>
                                                                <td className="p-1.5 border border-slate-300 text-right">-</td>
                                                                <td className="p-1.5 border border-slate-300 text-right pr-3 text-emerald-800 font-black">
                                                                    Rs. {lNode.total_valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </td>
                                                                <td className="p-1.5 border border-slate-300 text-right pr-2 font-black">100.0%</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Detailed View Grand Total Summary Banner */}
            <div className="bg-slate-900 text-white p-3.5 rounded-lg border-2 border-black flex flex-col md:flex-row justify-between items-start md:items-center gap-2 font-mono mt-4 shadow-sm">
                <div>
                    <span className="font-black uppercase tracking-wider text-xs">Grand Inventory Stock Valuation Summary:</span>
                    <span className="text-slate-400 text-xs ml-2">({categoryHierarchyTree.length} Parent Categories • {reportRows.length} Total Products)</span>
                </div>
                <div className="flex items-center gap-6 text-xs font-mono font-bold flex-wrap">
                    <span>Total Physical Units: <b className="text-emerald-400">{reportRows.reduce((sum, r) => sum + Number(r.computed_true_stock !== undefined ? r.computed_true_stock : r.current_stock || 0), 0).toLocaleString()}</b></span>
                    <span className="text-emerald-300 font-black text-sm underline decoration-double">
                        Grand Valuation: Rs. {reportRows.reduce((sum, r) => sum + Number(r.calculated_valuation !== undefined ? r.calculated_valuation : ((r.computed_true_stock || 0) * (r.retail_price || r.sale_price || 0))), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
};
