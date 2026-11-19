import React from 'react';

interface ProductSalesHistoryTableProps {
  activeViewMode: 'summary' | 'detailed';
  displayedRows: any[];
  isPrinting: boolean;
  pageSize: number | 'all';
  currentPage: number;
  reportRows: any[];
  totalSoldUnits: number;
  totalReturnedUnits: number;
  totalNetUnits: number;
  totalGrossAmount: number;
  resolveCustomerMeta?: (custName?: string) => { code: string; pageNo: string };
}

export const ProductSalesHistoryTable: React.FC<ProductSalesHistoryTableProps> = ({
  activeViewMode,
  displayedRows,
  isPrinting,
  pageSize,
  currentPage,
  reportRows,
  totalSoldUnits,
  totalReturnedUnits,
  totalNetUnits,
  totalGrossAmount,
  resolveCustomerMeta = () => ({ code: '', pageNo: '' }),
}) => {
  return (
    <>
      {activeViewMode === 'summary' ? (
              // ── 📊 SUMMARY VIEW TABLE (1 ROW / PRODUCT) ──
              <table className="w-full table-auto border-2 border-black border-collapse text-xs font-sans antialiased text-left print:w-full print:border-2 print:border-black">
                <thead>
                  <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[11px]">
                    <th rowSpan={2} className="p-1.5 border border-black text-center w-8">S#</th>
                    <th rowSpan={2} className="p-1.5 border border-black">Product / Item Name</th>
                    <th rowSpan={2} className="p-1.5 border border-black whitespace-nowrap">SKU / Code</th>
                    <th rowSpan={2} className="p-1.5 border border-black">Brand</th>
                    <th rowSpan={2} className="p-1.5 border border-black text-center whitespace-nowrap">Color / Shade</th>
                    <th colSpan={3} className="p-1 border border-black text-center bg-gray-200">Category Classification</th>
                    <th rowSpan={2} className="p-1.5 border border-black text-center w-10">UOM</th>
                    <th rowSpan={2} className="p-1.5 border border-black text-right whitespace-nowrap">Sold Qty</th>
                    <th rowSpan={2} className="p-1.5 border border-black text-right whitespace-nowrap">Return Qty</th>
                    <th rowSpan={2} className="p-1.5 border border-black text-right whitespace-nowrap">Net Qty</th>
                    <th rowSpan={2} className="p-1.5 border border-black text-right whitespace-nowrap">Avg. Rate (PKR)</th>
                    <th rowSpan={2} className="p-1.5 border border-black text-right whitespace-nowrap">Net Sales Revenue (PKR)</th>
                    <th rowSpan={2} className="p-1.5 border border-black text-center whitespace-nowrap border-r-2 border-r-black">Last Sold Date</th>
                  </tr>
                  <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                    <th className="p-1 border border-black text-left">Parent</th>
                    <th className="p-1 border border-black text-left">Sub</th>
                    <th className="p-1 border border-black text-left">Leaf</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                        No product sales history records discovered matching chosen selection criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row, idx) => {
                      const realIndex = isPrinting ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr key={idx} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs">
                          <td className="p-1.5 border border-black text-center text-gray-600">{realIndex}</td>
                          <td className="p-1.5 border border-black font-sans font-bold text-black">{row.product_name}</td>
                          <td className="p-1.5 border border-black text-gray-700 text-[11px] whitespace-nowrap">{row.sku || '-'}</td>
                          <td className="p-1.5 border border-black font-sans text-gray-600 text-[11px]">{row.brand || '-'}</td>
                          <td className="p-1.5 border border-black font-sans text-center text-gray-700 text-[11px]">{row.color || '-'}</td>
                          <td className="p-1.5 border border-black font-sans text-gray-600 text-[11px]">{row.parentCategory || '-'}</td>
                          <td className="p-1.5 border border-black font-sans text-gray-600 text-[11px]">{row.subCategory || '-'}</td>
                          <td className="p-1.5 border border-black font-sans text-gray-600 text-[11px]">{row.category || '-'}</td>
                          <td className="p-1.5 border border-black text-center text-gray-700 font-bold whitespace-nowrap">{row.uom}</td>
                          <td className="p-1.5 border border-black text-right text-black font-bold whitespace-nowrap">
                            {Number(row.sold_qty || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1.5 border border-black text-right text-rose-700 font-bold whitespace-nowrap">
                            {Number(row.returned_qty || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1.5 border border-black text-right text-primary font-black whitespace-nowrap">
                            {Number(row.net_qty || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1.5 border border-black text-right text-gray-800 whitespace-nowrap font-mono">
                            Rs. {Number(row.avg_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1.5 border border-black text-right text-emerald-700 font-black whitespace-nowrap font-mono">
                            Rs. {Number(row.final_net_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1.5 border border-black text-center text-gray-600 text-[11px] whitespace-nowrap font-mono border-r-2 border-r-black">
                            {row.last_sale_date || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  {/* 📄 Page Subtotal Row */}
                  {!isPrinting && pageSize !== 'all' && (
                    <tr className="bg-amber-50/80 border-t border-black font-bold font-mono text-xs text-amber-950">
                      <td colSpan={9} className="p-2 border border-black text-right uppercase tracking-wider text-amber-900">
                        Page {currentPage} Subtotal ({displayedRows.length} products):
                      </td>
                      <td className="p-2 border border-black text-right text-black font-bold">
                        {displayedRows.reduce((sum, r) => sum + Number(r.sold_qty || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border border-black text-right text-rose-700 font-bold">
                        {displayedRows.reduce((sum, r) => sum + Number(r.returned_qty || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border border-black text-right text-primary font-bold">
                        {displayedRows.reduce((sum, r) => sum + Number(r.net_qty || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border border-black text-right text-gray-400">-</td>
                      <td className="p-2 border border-black text-right text-emerald-800 font-bold whitespace-nowrap">
                        Rs. {displayedRows.reduce((sum, r) => sum + Number(r.final_net_sales || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border border-black text-center text-[10px] font-bold text-amber-800 border-r-2 border-r-black">Page {currentPage} of {Math.ceil(reportRows.length / (typeof pageSize === 'number' ? pageSize : 1))}</td>
                    </tr>
                  )}
                  {/* 📊 Overall Grand Totals Row */}
                  <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                    <td colSpan={9} className="p-2 border border-black text-right uppercase tracking-wider text-gray-900">
                      Grand Total Summary (All {reportRows.length} Products):
                    </td>
                    <td className="p-2 border border-black text-right text-black">
                      {totalSoldUnits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right text-rose-700">
                      {totalReturnedUnits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right text-primary">
                      {totalNetUnits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right text-gray-400">-</td>
                    <td className="p-2 border border-black text-right text-emerald-800 text-sm font-black underline decoration-double whitespace-nowrap">
                      Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-center text-[10px] text-gray-500 border-r-2 border-r-black">{reportRows.length} SKUs</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              // ── 📑 DETAILED VIEW TABLE (GROUPED INVOICE BREAKDOWN) ──
              <div className="space-y-6">
                {displayedRows.length === 0 ? (
                  <div className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                    No product sales history records discovered matching chosen selection criteria.
                  </div>
                ) : (
                  displayedRows.map((prod, pIdx) => {
                    const realProdNum = isPrinting ? pIdx + 1 : (currentPage - 1) * pageSize + pIdx + 1;
                    const prodSubtotal = (prod.transactions || []).reduce((acc: number, t: any) => acc + Number(t.total || 0), 0);
                    const prodTotalQty = (prod.transactions || []).reduce((acc: number, t: any) => acc + Number(t.qty || 0), 0);

                    return (
                      <div key={pIdx} className="border border-black rounded-xs overflow-hidden shadow-xs">
                        {/* Product Banner */}
                        <div className="bg-slate-800 text-white p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-emerald-500 text-black px-2 py-0.5 rounded font-black text-[10px]">#{realProdNum}</span>
                            <span className="font-bold font-sans text-sm">{prod.product_name}</span>
                            <span className="text-slate-400 text-[10px]">SKU: {prod.sku || 'N/A'}</span>
                            <span className="text-slate-400 text-[10px]">Category: {prod.category}</span>
                            <span className="text-slate-400 text-[10px]">UOM: {prod.uom}</span>
                          </div>
                          <div className="text-right text-[11px] font-black font-mono">
                            <span className="text-emerald-400">Total Sold: {prodTotalQty} {prod.uom}</span>
                            <span className="text-slate-500 mx-1.5">|</span>
                            <span className="text-emerald-300">Revenue: Rs. {prodSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        {/* Transactions Sub-table */}
                        <table className="w-full table-auto border-collapse text-[11px] font-sans text-left">
                          <thead>
                            <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[9.5px]">
                              <th className="p-1.5 border border-black text-center w-24">Date</th>
                              <th className="p-1.5 border border-black w-28">Invoice #</th>
                              <th className="p-1.5 border border-black min-w-[140px] max-w-[220px]">Customer Name</th>
                              <th className="p-1.5 border border-black">Salesman</th>
                              <th className="p-1.5 border border-black">Warehouse</th>
                              <th className="p-1.5 border border-black text-right w-20">Qty</th>
                              <th className="p-1.5 border border-black text-right w-24">Unit Rate</th>
                              <th className="p-1.5 border border-black text-right w-20">Discount</th>
                              <th className="p-1.5 border border-black text-right w-28">Net Amount (PKR)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(prod.transactions || []).map((tx: any, tIdx: number) => (
                              <tr key={tIdx} className="border-b border-gray-300 hover:bg-gray-50 font-mono text-xs">
                                <td className="p-1.5 border border-black text-center text-gray-700 whitespace-nowrap">{tx.date}</td>
                                <td className="p-1.5 border border-black font-black text-primary uppercase whitespace-nowrap">{tx.invoice_no}</td>
                                <td className="p-1.5 border border-black font-sans align-top min-w-[140px] max-w-[220px]">
                                  <div className="font-semibold text-black leading-tight break-words text-xs">
                                    {tx.customer_name}
                                  </div>
                                  {(() => {
                                    const meta = resolveCustomerMeta(tx.customer_name);
                                    const code = meta.code || '';
                                    const pageNo = meta.pageNo || '';
                                    if (!code && !pageNo) return null;
                                    return (
                                      <div className="text-[10px] font-mono text-slate-700 flex flex-wrap items-center gap-1 mt-0.5">
                                        {code && (
                                          <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-300 font-bold uppercase text-slate-800 text-[9.5px]">
                                            {code}
                                          </span>
                                        )}
                                        {code && pageNo && <span className="text-slate-400 font-bold">|</span>}
                                        {pageNo && (
                                          <span className="text-slate-600 font-semibold text-[9.5px]">
                                            {String(pageNo).toUpperCase().startsWith('P#') ? pageNo : `P# ${pageNo}`}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="p-1.5 border border-black font-sans text-gray-600">{tx.salesman}</td>
                                <td className="p-1.5 border border-black font-sans text-gray-600">{tx.warehouse}</td>
                                <td className="p-1.5 border border-black text-right font-bold text-black whitespace-nowrap">{tx.qty} {tx.uom}</td>
                                <td className="p-1.5 border border-black text-right text-gray-800 whitespace-nowrap">Rs. {Number(tx.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="p-1.5 border border-black text-right text-rose-600 font-semibold whitespace-nowrap">{tx.discount > 0 ? `Rs. ${Number(tx.discount).toLocaleString()}` : '-'}</td>
                                <td className="p-1.5 border border-black text-right text-emerald-700 font-bold whitespace-nowrap">Rs. {Number(tx.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 border-t border-black font-black font-mono text-xs">
                              <td colSpan={5} className="p-1.5 border border-black text-right uppercase tracking-wider text-gray-600">
                                Subtotal ({prod.product_name}):
                              </td>
                              <td className="p-1.5 border border-black text-right text-primary font-black">
                                {prodTotalQty} {prod.uom}
                              </td>
                              <td colSpan={2} className="p-1.5 border border-black text-right text-gray-400">-</td>
                              <td className="p-1.5 border border-black text-right text-emerald-800 font-black">
                                Rs. {prodSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    );
                  })
                )}

                {/* Grand Summary Across All Products */}
                {reportRows.length > 0 && (
                  <div className="bg-gray-100 p-3 rounded border-2 border-black flex justify-between items-center font-mono font-black text-xs">
                    <span className="uppercase text-gray-800">Grand Total Net Sales Velocity Across All {reportRows.length} Products:</span>
                    <span className="text-emerald-800 text-sm underline decoration-double">
                      Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            )}
    </>
  );
};
