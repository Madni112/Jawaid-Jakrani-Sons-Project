import React from 'react';

interface PurchaseCategoryVolumeTableProps {
  activeViewMode: 'summary' | 'detailed';
  paginatedRows: any[];
  reportRows: any[];
  startIndex: number;
  categoryHierarchyTree: any[];
  expandedRowKeys: Set<string | number>;
  toggleRowExpanded: (key: string | number) => void;
  toggleAllExpanded: () => void;
}

export const PurchaseCategoryVolumeTable: React.FC<PurchaseCategoryVolumeTableProps> = ({
  activeViewMode,
  paginatedRows,
  reportRows,
  startIndex,
  categoryHierarchyTree,
  expandedRowKeys,
  toggleRowExpanded,
  toggleAllExpanded
}) => {
  return (
    <div className="w-full space-y-4">
            {activeViewMode === 'summary' ? (
              <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
                <thead className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                  <tr>
                    <th className="p-1.5 border border-black text-center w-12">S#</th>
                    <th className="p-1.5 border border-black">Parent Category</th>
                    <th className="p-1.5 border border-black">Sub-Category</th>
                    <th className="p-1.5 border border-black">Leaf Category Title</th>
                    <th className="p-1.5 border border-black text-center w-20">SKUs</th>
                    <th className="p-1.5 border border-black text-right w-24">Inward Qty</th>
                    <th className="p-1.5 border border-black text-right w-24">Return Qty</th>
                    <th className="p-1.5 border border-black text-right w-24">Net Qty</th>
                    <th className="p-1.5 border border-black text-right w-36">Gross Spend (PKR)</th>
                    <th className="p-1.5 border border-black text-right w-32">Returns (PKR)</th>
                    <th className="p-1.5 border border-black text-right w-36">Net Spend (PKR)</th>
                    <th className="p-1.5 border border-black text-right pr-2 w-20">Share %</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50">
                        No category purchase records found matching selected criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((cat, idx) => (
                      <tr key={idx} className="border-b border-black hover:bg-gray-50 font-mono text-xs">
                        <td className="p-1.5 border border-black text-center text-gray-400">{startIndex + idx + 1}</td>
                        <td className="p-1.5 border border-black font-sans uppercase font-bold text-slate-800">{cat.parent_name}</td>
                        <td className="p-1.5 border border-black font-sans text-slate-700">{cat.sub_name}</td>
                        <td className="p-1.5 border border-black font-sans font-semibold text-slate-900">{cat.category_name}</td>
                        <td className="p-1.5 border border-black text-center font-bold text-slate-600">{cat.products_count}</td>
                        <td className="p-1.5 border border-black text-right text-slate-800">{Number(cat.gross_units).toLocaleString()}</td>
                        <td className="p-1.5 border border-black text-right text-rose-700">{Number(cat.returned_units).toLocaleString()}</td>
                        <td className="p-1.5 border border-black text-right font-bold text-slate-900">{Number(cat.net_units).toLocaleString()}</td>
                        <td className="p-1.5 border border-black text-right text-slate-800">Rs. {Number(cat.gross_purchases).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-1.5 border border-black text-right text-rose-700">Rs. {Number(cat.returned_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-1.5 border border-black text-right font-black text-emerald-800">Rs. {Number(cat.net_expenditure).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-1.5 border border-black text-right pr-2 font-bold text-slate-700">{Number(cat.contribution_pct || 0).toFixed(1)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                    <td colSpan={5} className="p-2 border border-black text-right uppercase">
                      Total Spend Aggregations ({reportRows.length} Categories):
                    </td>
                    <td className="p-2 border border-black text-right font-black">{reportRows.reduce((s, r) => s + Number(r.gross_units || 0), 0).toLocaleString()}</td>
                    <td className="p-2 border border-black text-right text-rose-700 font-black">{reportRows.reduce((s, r) => s + Number(r.returned_units || 0), 0).toLocaleString()}</td>
                    <td className="p-2 border border-black text-right font-black">{reportRows.reduce((s, r) => s + Number(r.net_units || 0), 0).toLocaleString()}</td>
                    <td className="p-2 border border-black text-right font-black">Rs. {reportRows.reduce((s, r) => s + Number(r.gross_purchases || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 border border-black text-right text-rose-700 font-black">Rs. {reportRows.reduce((s, r) => s + Number(r.returned_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 border border-black text-right text-emerald-800 underline decoration-double font-black">Rs. {reportRows.reduce((s, r) => s + Number(r.net_expenditure || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 border border-black text-right pr-2 font-black">100.0%</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              /* Detailed Hierarchical Tree View */
              <div className="space-y-4">
                <div className="flex justify-end mb-2 print:hidden">
                  <button
                    type="button"
                    onClick={toggleAllExpanded}
                    className="text-[11px] font-bold px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded cursor-pointer"
                  >
                    {expandedRowKeys.size > 0 ? 'Collapse All Categories' : 'Expand All Categories'}
                  </button>
                </div>

                {categoryHierarchyTree.map((pNode, pIdx) => {
                  const pKey = `parent-${pIdx}`;
                  const isPExpanded = expandedRowKeys.has(pKey);

                  return (
                    <div key={pKey} className="border-2 border-black rounded overflow-hidden shadow-xs print:break-inside-avoid">
                      {/* Parent Category Banner */}
                      <div
                        onClick={() => toggleRowExpanded(pKey)}
                        className="bg-slate-800 text-white p-2.5 flex justify-between items-center cursor-pointer select-none hover:bg-slate-700 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-400">{isPExpanded ? '▼' : '▶'}</span>
                          <span className="font-mono font-black uppercase text-xs tracking-wider">
                            1000 • {pNode.parent_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 font-mono text-xs">
                          <span>Net Inward: <b>{pNode.net_units.toLocaleString()} Units</b></span>
                          <span className="text-emerald-300 font-black">Net Spend: Rs. {Number(pNode.net_expenditure).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Sub Categories */}
                      {isPExpanded && (
                        <div className="p-2 space-y-3 bg-slate-50">
                          {pNode.sub_categories.map((sNode: any, sIdx: number) => {
                            const sKey = `sub-${pIdx}-${sIdx}`;
                            const isSExpanded = expandedRowKeys.has(sKey);

                            return (
                              <div key={sKey} className="border border-slate-300 rounded bg-white overflow-hidden">
                                <div
                                  onClick={() => toggleRowExpanded(sKey)}
                                  className="bg-slate-100 p-2 flex justify-between items-center cursor-pointer select-none hover:bg-slate-200 transition font-mono text-xs"
                                >
                                  <div className="flex items-center gap-2 pl-2">
                                    <span className="text-slate-500">{isSExpanded ? '▼' : '▶'}</span>
                                    <span className="font-bold uppercase text-slate-800">
                                      ↳ Sub-Category: {sNode.sub_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs font-semibold">
                                    <span>{sNode.net_units.toLocaleString()} Units</span>
                                    <span className="font-bold text-slate-900">Rs. {Number(sNode.net_expenditure).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                  </div>
                                </div>

                                {isSExpanded && (
                                  <div className="p-2">
                                    {sNode.categories.map((lNode: any, lIdx: number) => (
                                      <div key={lIdx} className="mb-3 last:mb-0">
                                        <div className="text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-1 border-b border-slate-200 flex justify-between font-mono">
                                          <span>• {lNode.category_name} ({lNode.products.length} SKUs)</span>
                                          <span>Total: Rs. {Number(lNode.net_expenditure).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>

                                        <table className="w-full table-auto border border-collapse border-slate-300 text-[10.5px] font-sans text-left mt-1">
                                          <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[9.5px] text-slate-700 uppercase">
                                            <tr>
                                              <th className="p-1 border border-slate-300">Product / SKU Name</th>
                                              <th className="p-1 border border-slate-300 w-24">Brand</th>
                                              <th className="p-1 border border-slate-300 text-center w-16">UOM</th>
                                              <th className="p-1 border border-slate-300 text-right w-24">Bought Qty</th>
                                              <th className="p-1 border border-slate-300 text-right w-24">Returned</th>
                                              <th className="p-1 border border-slate-300 text-right w-24">Net Qty</th>
                                              <th className="p-1 border border-slate-300 text-right w-32">Gross Spend</th>
                                              <th className="p-1 border border-slate-300 text-right w-32">Net Spend (PKR)</th>
                                              <th className="p-1 border border-slate-300 text-right pr-2 w-20">Share %</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {lNode.products.map((p: any, pItemIdx: number) => (
                                              <tr key={pItemIdx} className="border-b border-slate-200 hover:bg-slate-50 font-mono text-[10px]">
                                                <td className="p-1 border border-slate-300 font-sans font-medium text-slate-900">{p.product_name}</td>
                                                <td className="p-1 border border-slate-300 font-sans text-slate-600">{p.brand}</td>
                                                <td className="p-1 border border-slate-300 text-center uppercase text-slate-500">{p.uom}</td>
                                                <td className="p-1 border border-slate-300 text-right">{p.bought_qty.toLocaleString()}</td>
                                                <td className="p-1 border border-slate-300 text-right text-rose-700">{p.returned_qty.toLocaleString()}</td>
                                                <td className="p-1 border border-slate-300 text-right font-bold text-slate-900">{p.net_qty.toLocaleString()}</td>
                                                <td className="p-1 border border-slate-300 text-right text-slate-700">Rs. {Number(p.gross_spend).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-1 border border-slate-300 text-right font-black text-emerald-800">Rs. {Number(p.final_net_spend).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-1 border border-slate-300 text-right pr-2 font-bold text-slate-600">{Number(p.share_of_category || 0).toFixed(1)}%</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
  );
};

export default PurchaseCategoryVolumeTable;
