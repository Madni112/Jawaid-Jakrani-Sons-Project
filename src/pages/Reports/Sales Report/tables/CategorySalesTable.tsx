import React from 'react';

interface CategorySalesTableProps {
  activeViewMode: 'summary' | 'detailed';
  displayedRows: any[];
  isPrinting: boolean;
  pageSize: number | 'all';
  currentPage: number;
  reportRows: any[];
  isMultiWarehouse: boolean;
  renderWhBreakdown: (whMap: Record<string, number> | undefined, colorType: 'sold' | 'return' | 'net') => React.ReactNode;
  totalSoldUnits: number;
  totalReturnedUnits: number;
  totalNetUnits: number;
  totalGrossAmount: number;
  displayedHierarchy?: any[];
  resolveCustomerMeta?: (custName?: string) => { code: string; pageNo: string };
}

export const CategorySalesTable: React.FC<CategorySalesTableProps> = ({
  activeViewMode,
  displayedRows,
  isPrinting,
  pageSize,
  currentPage,
  reportRows,
  isMultiWarehouse,
  renderWhBreakdown,
  totalSoldUnits,
  totalReturnedUnits,
  totalNetUnits,
  totalGrossAmount,
  displayedHierarchy = [],
  resolveCustomerMeta = () => ({ code: '', pageNo: '' }),
}) => {
  return (
    <>
      {activeViewMode === 'summary' ? (
              // ── 📂 CATEGORY-WISE PRODUCT SUMMARY VIEW (CATEGORY HEADER WITH PARENT & SUB -> DIRECT PRODUCTS TABLE) ──
              <div className="space-y-6">
                {displayedRows.length === 0 ? (
                  <div className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                    No product category sales records discovered matching chosen selection criteria.
                  </div>
                ) : (
                  displayedRows.map((cat: any, cIdx: number) => {
                    const realIndex = isPrinting || pageSize === 'all' ? cIdx + 1 : (currentPage - 1) * (pageSize as number) + cIdx + 1;
                    return (
                      <div key={cIdx} className="border-2 border-slate-900 rounded-sm overflow-hidden shadow-2xs bg-white space-y-0">
                        {/* 🏷️ CATEGORY HEADER BANNER (WITH PARENT & SUB CATEGORY MENTIONED) */}
                        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-sm border-b-2 border-slate-900">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-emerald-500 text-black px-2.5 py-0.5 rounded font-black text-sm print:text-sm">#{realIndex}</span>
                            <span className="font-black font-sans text-base tracking-wide uppercase text-white flex items-center gap-1.5 print:text-[15px]">
                              🏷️ CATEGORY: {cat.category_name}
                            </span>
                            <span className="bg-slate-800 text-slate-200 text-xs px-2 py-0.5 rounded border border-slate-700 print:text-xs">
                              📁 Parent: <b className="text-white font-sans">{cat.parent_name}</b>
                            </span>
                            <span className="bg-slate-800 text-slate-200 text-xs px-2 py-0.5 rounded border border-slate-700 print:text-xs">
                              📂 Sub: <b className="text-white font-sans">{cat.sub_name}</b>
                            </span>
                            <span className="bg-indigo-900/70 text-indigo-200 text-xs px-2 py-0.5 rounded border border-indigo-700 print:text-xs">
                              {cat.products_count || (cat.products || []).length} Products
                            </span>
                          </div>
                          <div className="text-right text-xs sm:text-sm print:text-[13.5px] font-black font-mono flex items-center gap-2 flex-wrap">
                            <span className="text-emerald-400 font-extrabold whitespace-nowrap">Sold: {Number(cat.gross_units || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-rose-400 font-extrabold whitespace-nowrap">Ret: {Number(cat.returned_units || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-emerald-300 font-black whitespace-nowrap">Net: {Number(cat.net_units || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} Units</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-amber-300 font-black underline decoration-double whitespace-nowrap">
                              Net Rev: Rs. {Number(cat.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-black whitespace-nowrap">
                              {Number(cat.contribution_pct || 0).toFixed(1)}% Share
                            </span>
                          </div>
                        </div>

                        {/* 📦 PRODUCTS TABLE DIRECTLY UNDER CATEGORY HEADER */}
                        <table className="w-full table-fixed border-collapse text-[11px] font-sans antialiased text-left print:w-full">
                          <colgroup>
                            <col style={{ width: '3%' }} />
                            <col style={{ width: isMultiWarehouse ? '18.5%' : '22%' }} />
                            <col style={{ width: isMultiWarehouse ? '10.5%' : '13%' }} />
                            <col style={{ width: '4%' }} />
                            <col style={{ width: isMultiWarehouse ? '8.5%' : '6.5%' }} />
                            <col style={{ width: isMultiWarehouse ? '6.5%' : '5.5%' }} />
                            <col style={{ width: isMultiWarehouse ? '8.5%' : '6.5%' }} />
                            <col style={{ width: isMultiWarehouse ? '12%' : '13%' }} />
                            <col style={{ width: '8.5%' }} />
                            <col style={{ width: isMultiWarehouse ? '12%' : '13%' }} />
                            <col style={{ width: '5%' }} />
                          </colgroup>
                          <thead>
                            <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                              <th className="p-1 border border-black text-center">S#</th>
                              <th className="p-1 border border-black text-left">Product / Item Name</th>
                              <th className="p-1 border border-black text-center">SKU / Code</th>
                              <th className="p-1 border border-black text-center">UOM</th>
                              <th className="p-1 border border-black text-right">Gross Sold</th>
                              <th className="p-1 border border-black text-right">Ret Qty</th>
                              <th className="p-1 border border-black text-right">Net Qty</th>
                              <th className="p-1 border border-black text-right">Gross Sales (PKR)</th>
                              <th className="p-1 border border-black text-right">Ret Amount</th>
                              <th className="p-1 border border-black text-right">Net Rev (PKR)</th>
                              <th className="p-1 border border-black text-center">% Share</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(cat.products || []).length === 0 ? (
                              <tr>
                                <td colSpan={11} className="p-4 text-center italic text-gray-500 font-mono text-xs">
                                  No product items configured or sold under this category in selected period.
                                </td>
                              </tr>
                            ) : (
                              (cat.products || []).map((p: any, pIdx: number) => (
                                <tr key={pIdx} className="border-b border-gray-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                                  <td className="p-1.5 border border-gray-300 text-center text-gray-500">{pIdx + 1}</td>
                                  <td className="p-1.5 border border-gray-300 font-sans font-bold text-black">{p.product_name}</td>
                                  <td className="p-1.5 border border-gray-300 text-center text-gray-600 text-[10.5px] font-mono break-all">{p.sku || '-'}</td>
                                  <td className="p-1.5 border border-gray-300 text-center text-gray-700 font-bold">{p.uom}</td>
                                  <td className="p-1.5 border border-gray-300 text-right text-black font-bold overflow-hidden">
                                    <div>{Number(p.sold_qty || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    {renderWhBreakdown(p.sold_by_wh, 'sold')}
                                  </td>
                                  <td className="p-1.5 border border-gray-300 text-right text-rose-700 font-bold overflow-hidden">
                                    <div>{Number(p.returned_qty || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    {renderWhBreakdown(p.ret_by_wh, 'return')}
                                  </td>
                                  <td className="p-1.5 border border-gray-300 text-right text-primary font-black overflow-hidden">
                                    <div>{Number(p.net_qty || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    {renderWhBreakdown(p.net_by_wh, 'net')}
                                  </td>
                                  <td className="p-1.5 border border-gray-300 text-right text-gray-800 font-bold whitespace-nowrap">
                                    Rs. {Number(p.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-1.5 border border-gray-300 text-right text-rose-700 font-bold whitespace-nowrap">
                                    Rs. {Number(p.returned_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-1.5 border border-gray-300 text-right text-emerald-700 font-black whitespace-nowrap">
                                    Rs. {Number(p.final_net_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-1.5 border border-gray-300 text-center text-purple-900 font-bold text-[10px] whitespace-nowrap">
                                    {Number(p.share_of_category || 0).toFixed(1)}%
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                              <td colSpan={4} className="p-1.5 border border-black text-right uppercase tracking-wider text-gray-800 truncate">
                                Subtotal ({cat.category_name} : {(cat.products || []).length} Products):
                              </td>
                              <td className="p-1.5 border border-black text-right font-bold text-black overflow-hidden">
                                <div>{Number(cat.gross_units || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                {renderWhBreakdown(cat.sold_by_wh, 'sold')}
                              </td>
                              <td className="p-1.5 border border-black text-right font-bold text-rose-700 overflow-hidden">
                                <div>{Number(cat.returned_units || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                {renderWhBreakdown(cat.ret_by_wh, 'return')}
                              </td>
                              <td className="p-1.5 border border-black text-right font-black text-primary overflow-hidden">
                                <div>{Number(cat.net_units || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                {renderWhBreakdown(cat.net_by_wh, 'net')}
                              </td>
                              <td className="p-1.5 border border-black text-right font-bold text-gray-900 whitespace-nowrap">
                                Rs. {Number(cat.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-1.5 border border-black text-right font-bold text-rose-700 whitespace-nowrap">
                                Rs. {Number(cat.returned_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-1.5 border border-black text-right text-purple-900 font-black whitespace-nowrap">
                                Rs. {Number(cat.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-1.5 border border-black text-center text-gray-400 font-bold text-[10px] whitespace-nowrap">-</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    );
                  })
                )}

                {/* Grand Total Summary Box across All Categories */}
                {reportRows.length > 0 && (
                  <div className="space-y-2">
                    {!isPrinting && pageSize !== 'all' && (
                      <div className="bg-amber-50/80 p-3 rounded border border-amber-300 flex justify-between items-center font-mono font-bold text-xs text-amber-950">
                        <span className="uppercase text-amber-900">
                          Page {currentPage} Subtotal ({displayedRows.length} Categories On This Page):
                        </span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-black">Sold: {displayedRows.reduce((s: number, r: any) => s + Number(r.gross_units || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-rose-700">Ret: {displayedRows.reduce((s: number, r: any) => s + Number(r.returned_units || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-primary font-black">Net Vol: {displayedRows.reduce((s: number, r: any) => s + Number(r.net_units || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-purple-900 font-black">Page Revenue: Rs. {displayedRows.reduce((s: number, r: any) => s + Number(r.net_revenue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-100 p-3.5 rounded border-2 border-black flex justify-between items-center font-mono font-black text-xs">
                      <span className="uppercase text-gray-900">
                        Grand Total Category Sales Summary (All {reportRows.length} Categories):
                      </span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-black">Gross Sold: {totalSoldUnits.toLocaleString(undefined, { minimumFractionDigits: 2 })} Units</span>
                        <span className="text-rose-700">Returned: {totalReturnedUnits.toLocaleString(undefined, { minimumFractionDigits: 2 })} Units</span>
                        <span className="text-emerald-700">Net Volume: {totalNetUnits.toLocaleString(undefined, { minimumFractionDigits: 2 })} Units</span>
                        <span className="text-purple-800 text-sm underline decoration-double">
                          Grand Net Revenue: Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // ── 📑 3-TIER CATEGORY HIERARCHY TRANSACTIONS DETAILED VIEW ──
              <div className="space-y-8">
                {displayedHierarchy.length === 0 ? (
                  <div className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                    No product category sales transactions discovered matching chosen selection criteria.
                  </div>
                ) : (
                  displayedHierarchy.map((parent: any, pIdx: number) => {
                    const realParentIndex = isPrinting || pageSize === 'all' ? pIdx + 1 : (currentPage - 1) * (pageSize as number) + pIdx + 1;
                    return (
                      <div key={pIdx} className="border-2 border-slate-900 rounded-md overflow-hidden shadow-sm bg-white space-y-4 pb-4">
                        {/* 🏢 TIER 1: PARENT CATEGORY HEADER BANNER */}
                        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-xs border-b-2 border-slate-900">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="bg-amber-400 text-black px-2.5 py-0.5 rounded font-black text-xs print:text-xs">#{realParentIndex}</span>
                            <span className="font-black font-sans text-sm tracking-wide uppercase text-white flex items-center gap-1.5 print:text-sm">
                              🏢 PARENT CATEGORY: {parent.parent_name}
                            </span>
                            <span className="bg-slate-800 text-slate-300 text-[10px] px-2.5 py-0.5 rounded border border-slate-700 print:text-xs">
                              {parent.sub_categories?.length || 0} Sub-Categories
                            </span>
                          </div>
                          <div className="text-right text-xs sm:text-sm print:text-[13px] font-black font-mono flex items-center gap-2.5 flex-wrap">
                            <span className="text-emerald-400 font-extrabold whitespace-nowrap">Sold: {Number(parent.gross_units || 0).toLocaleString()}</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-rose-400 font-extrabold whitespace-nowrap">Ret: {Number(parent.returned_units || 0).toLocaleString()}</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-emerald-300 font-black whitespace-nowrap">Net: {Number(parent.net_units || 0).toLocaleString()} Units</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-amber-300 font-black underline decoration-double whitespace-nowrap">
                              Net Revenue: Rs. {Number(parent.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* 📂 TIER 2: SUB-CATEGORIES CONTAINER */}
                        <div className="px-4 space-y-6">
                          {(parent.sub_categories || []).map((sub: any, sIdx: number) => (
                            <div key={sIdx} className="border border-slate-300 rounded-sm overflow-hidden bg-slate-50/50 space-y-3 p-3">
                              {/* SUB-CATEGORY HEADER */}
                              <div className="bg-slate-200/90 text-slate-900 p-2.5 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-xs border border-slate-300">
                                <div className="flex items-center gap-2">
                                  <span className="bg-indigo-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Sub {sIdx + 1}</span>
                                  <span className="font-black font-sans text-xs tracking-wide uppercase text-slate-900 flex items-center gap-1">
                                    📂 SUB-CATEGORY: {sub.sub_name}
                                  </span>
                                  <span className="bg-white text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-300">
                                    {sub.categories?.length || 0} Categories
                                  </span>
                                </div>
                                <div className="text-right text-xs print:text-[12px] font-black font-mono flex items-center gap-2 flex-wrap">
                                  <span className="text-slate-700 whitespace-nowrap">Sold: {Number(sub.gross_units || 0).toLocaleString()}</span>
                                  <span className="text-slate-400">|</span>
                                  <span className="text-rose-700 whitespace-nowrap">Ret: {Number(sub.returned_units || 0).toLocaleString()}</span>
                                  <span className="text-slate-400">|</span>
                                  <span className="text-emerald-800 whitespace-nowrap">Net: {Number(sub.net_units || 0).toLocaleString()} Units</span>
                                  <span className="text-slate-400">|</span>
                                  <span className="text-purple-900 font-extrabold whitespace-nowrap">
                                    Sub Revenue: Rs. {Number(sub.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>

                              {/* 🏷️ TIER 3: LEAF CATEGORIES & TRANSACTIONS */}
                              <div className="space-y-4 pl-2">
                                {(sub.categories || []).map((leafCat: any, lcIdx: number) => (
                                  <div key={lcIdx} className="border border-slate-300 rounded overflow-hidden bg-white shadow-2xs">
                                    <div className="bg-slate-100 p-2 flex justify-between items-center text-xs font-mono border-b border-slate-200">
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-500 font-bold">🏷️ Category:</span>
                                        <span className="font-bold font-sans text-slate-900">{leafCat.category_name}</span>
                                        <span className="text-slate-400 text-[10px]">({(leafCat.transactions || []).length} Records)</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] font-bold">
                                        <span className="text-slate-700">Net Vol: {Number(leafCat.net_units || 0).toLocaleString()}</span>
                                        <span className="text-slate-300">|</span>
                                        <span className="text-purple-800">Net: Rs. {Number(leafCat.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    </div>

                                    {/* Transactions Table */}
                                    <table className="w-full table-auto border-collapse text-[11px] font-sans antialiased text-left print:w-full">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-300 font-black uppercase text-slate-800 font-mono text-[9px]">
                                          <th className="p-1.5 border border-slate-200 text-center w-8">S#</th>
                                          <th className="p-1.5 border border-slate-200 text-center w-20">Date</th>
                                          <th className="p-1.5 border border-slate-200 w-24">Doc / Ref #</th>
                                          <th className="p-1.5 border border-slate-200 min-w-[130px] max-w-[200px]">Customer Name</th>
                                          <th className="p-1.5 border border-slate-200 w-24">Sales Officer</th>
                                          <th className="p-1.5 border border-slate-200">Product Item</th>
                                          <th className="p-1.5 border border-slate-200 text-right w-16">Qty</th>
                                          <th className="p-1.5 border border-slate-200 text-center w-12">UOM</th>
                                          <th className="p-1.5 border border-slate-200 text-right w-20">Rate</th>
                                          <th className="p-1.5 border border-slate-200 text-center w-20">Term</th>
                                          <th className="p-1.5 border border-slate-200 text-right w-28 pr-3">Net Amount (PKR)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(leafCat.transactions || []).length === 0 ? (
                                          <tr>
                                            <td colSpan={11} className="p-3 text-center italic text-gray-400 font-mono text-xs">
                                              No transaction records found for this category.
                                            </td>
                                          </tr>
                                        ) : (
                                          (leafCat.transactions || []).map((tx: any, tIdx: number) => {
                                            const isRet = tx.record_type === 'return';
                                            return (
                                              <tr key={tIdx} className={`border-b border-slate-200 hover:bg-slate-50/80 font-semibold font-mono text-xs ${isRet ? 'bg-rose-50/40 text-rose-900' : ''}`}>
                                                <td className="p-1.5 border border-slate-200 text-center text-gray-500">{tIdx + 1}</td>
                                                <td className="p-1.5 border border-slate-200 text-center text-gray-600 text-[10px]">{tx.date}</td>
                                                <td className="p-1.5 border border-slate-200 text-black font-bold text-[10px]">
                                                  <span className={isRet ? 'text-rose-700 font-black' : 'text-indigo-900'}>{tx.doc_no}</span>
                                                </td>
                                                <td className="p-1.5 border border-slate-200 font-sans align-top min-w-[130px] max-w-[200px]">
                                                  <div className="font-bold text-black text-xs leading-tight">
                                                    {tx.customer_name}
                                                  </div>
                                                  {(() => {
                                                    const meta = resolveCustomerMeta(tx.customer_name);
                                                    const code = meta.code || '';
                                                    const pageNo = meta.pageNo || '';
                                                    if (!code && !pageNo) return null;
                                                    return (
                                                      <div className="text-[9.5px] font-mono text-slate-700 flex flex-wrap items-center gap-1 mt-0.5">
                                                        {code && (
                                                          <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-300 font-bold uppercase text-slate-800 text-[9px]">
                                                            {code}
                                                          </span>
                                                        )}
                                                        {code && pageNo && <span className="text-slate-400 font-bold">|</span>}
                                                        {pageNo && (
                                                          <span className="text-slate-600 font-semibold text-[9px]">
                                                            {String(pageNo).toUpperCase().startsWith('P#') ? pageNo : `P# ${pageNo}`}
                                                          </span>
                                                        )}
                                                      </div>
                                                    );
                                                  })()}
                                                </td>
                                                <td className="p-1.5 border border-slate-200 text-gray-700 text-[10px]">{tx.salesman}</td>
                                                <td className="p-1.5 border border-slate-200 font-sans font-medium text-black">{tx.product_name}</td>
                                                <td className={`p-1.5 border border-slate-200 text-right font-bold ${isRet ? 'text-rose-700' : 'text-black'}`}>
                                                  {isRet ? `-${Number(tx.qty || 0).toLocaleString()}` : Number(tx.qty || 0).toLocaleString()}
                                                </td>
                                                <td className="p-1.5 border border-slate-200 text-center text-gray-600 font-bold">{tx.uom}</td>
                                                <td className="p-1.5 border border-slate-200 text-right text-gray-700">
                                                  Rs. {Number(tx.rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-1.5 border border-slate-200 text-center text-[10px]">
                                                  <span className={`px-1.5 py-0.5 rounded font-bold ${isRet ? 'bg-rose-200 text-rose-800' : tx.payment_term === 'Cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {tx.payment_term}
                                                  </span>
                                                </td>
                                                <td className={`p-1.5 border border-slate-200 text-right pr-3 font-black ${isRet ? 'text-rose-700' : 'text-emerald-700'}`}>
                                                  {isRet ? `-Rs. ${Number(tx.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `Rs. ${Number(tx.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                                </td>
                                              </tr>
                                            );
                                          })
                                        )}
                                      </tbody>
                                      <tfoot>
                                        <tr className="bg-slate-50 border-t border-slate-300 font-black font-mono text-xs">
                                          <td colSpan={6} className="p-1.5 border border-slate-200 text-right uppercase tracking-wider text-gray-600">
                                            Category Subtotal ({leafCat.category_name}):
                                          </td>
                                          <td className="p-1.5 border border-slate-200 text-right font-black text-primary">
                                            {Number(leafCat.net_units || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                          </td>
                                          <td colSpan={3} className="p-1.5 border border-slate-200 text-right text-[10px] text-gray-600">
                                            Sold: {Number(leafCat.gross_units || 0).toLocaleString()} | Ret: {Number(leafCat.returned_units || 0).toLocaleString()}
                                          </td>
                                          <td className="p-1.5 border border-slate-200 text-right pr-3 text-purple-900 font-black">
                                            Rs. {Number(leafCat.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Grand Total Detailed Summary */}
                {reportRows.length > 0 && (
                  <div className="bg-gray-100 p-3.5 rounded border-2 border-black flex justify-between items-center font-mono font-black text-xs">
                    <span className="uppercase text-gray-900">
                      Grand Total Category Sales Summary (All {reportRows.length} Categories):
                    </span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-black">Gross Sold: {totalSoldUnits.toLocaleString(undefined, { minimumFractionDigits: 2 })} Units</span>
                      <span className="text-rose-700">Returned: {totalReturnedUnits.toLocaleString(undefined, { minimumFractionDigits: 2 })} Units</span>
                      <span className="text-emerald-700">Net Volume: {totalNetUnits.toLocaleString(undefined, { minimumFractionDigits: 2 })} Units</span>
                      <span className="text-purple-800 text-sm underline decoration-double">
                        Grand Net Revenue: Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
    </>
  );
};
