import React from 'react';
import { extractItemNames, extractItemDetails } from '../services/saleReportHelpers';

interface ReturnReportTableProps {
  activeViewMode: 'summary' | 'detailed';
  displayedRows: any[];
  isPrinting: boolean;
  pageSize: number | 'all';
  currentPage: number;
  reportRows: any[];
  resolveCustomerMeta: (custName?: string) => { code: string; pageNo: string };
  totalReturnedUnits: number;
  totalGrossAmount: number;
  totalInvoicesCount?: number;
}

export const ReturnReportTable: React.FC<ReturnReportTableProps> = ({
  activeViewMode,
  displayedRows,
  isPrinting,
  pageSize,
  currentPage,
  reportRows,
  resolveCustomerMeta,
  totalReturnedUnits,
  totalGrossAmount,
  totalInvoicesCount = 0,
}) => {
  return (
    <>
      {activeViewMode === 'summary' ? (
              // ── 📊 SUMMARY VIEW TABLE (1 ROW / CUSTOMER) ──
              <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans antialiased text-left print:w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                    <th className="p-1.5 border border-black text-center w-10">S#</th>
                    <th className="p-1.5 border border-black w-[30%] min-w-[180px] max-w-[320px]">Customer Name</th>
                    <th className="p-1.5 border border-black text-center w-[15%] min-w-[120px]">Return Notes Booked</th>
                    <th className="p-1.5 border border-black text-right w-[20%] min-w-[140px]">Total Returned Units</th>
                    <th className="p-1.5 border border-black text-right w-[22%] min-w-[160px]">Total Credit Adjusted (PKR)</th>
                    <th className="p-1.5 border border-black text-center w-[9%] min-w-[90px]">% Share of Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                        No sales return records discovered matching chosen selection criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((cust, idx) => {
                      const realIndex = isPrinting || pageSize === 'all' ? idx + 1 : (currentPage - 1) * (pageSize as number) + idx + 1;
                      return (
                        <tr key={idx} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs">
                          <td className="p-1.5 border border-black text-center text-gray-600 align-top">{realIndex}</td>
                          <td className="p-1.5 border border-black font-sans align-top min-w-[180px] max-w-[320px]">
                            <div className="font-bold text-black text-xs leading-tight">
                              {cust.customer_name}
                            </div>
                            {(() => {
                              const meta = resolveCustomerMeta(cust.customer_name);
                              const code = cust.customer_code || cust.customerCode || meta.code || '';
                              const pageNo = cust.page_no || cust.pageNo || meta.pageNo || '';
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
                          <td className="p-1.5 border border-black text-center font-bold text-indigo-700">{cust.returns_count}</td>
                          <td className="p-1.5 border border-black text-right font-bold text-rose-700">
                            {Number(cust.total_returned_qty || 0).toLocaleString()}
                          </td>
                          <td className="p-1.5 border border-black text-right text-purple-800 font-black">
                            Rs. {Number(cust.total_return_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1.5 border border-black text-center text-slate-800 font-bold">
                            {Number(cust.contribution_pct || 0).toFixed(1)}%
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
                      <td colSpan={2} className="p-2 border border-black text-right uppercase tracking-wider text-amber-900">
                        Page {currentPage} Subtotal ({displayedRows.length} Customers):
                      </td>
                      <td className="p-2 border border-black text-center text-indigo-900 font-bold">
                        {displayedRows.reduce((sum, r) => sum + Number(r.returns_count || 0), 0)}
                      </td>
                      <td className="p-2 border border-black text-right text-rose-800 font-bold whitespace-nowrap">
                        {displayedRows.reduce((sum, r) => sum + Number(r.total_returned_qty || 0), 0).toLocaleString()}
                      </td>
                      <td className="p-2 border border-black text-right text-purple-900 font-black whitespace-nowrap">
                        Rs. {displayedRows.reduce((sum, r) => sum + Number(r.total_return_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border border-black text-center text-[10px] font-bold text-amber-800">
                        {displayedRows.reduce((sum, r) => sum + Number(r.contribution_pct || 0), 0).toFixed(1)}%
                      </td>
                    </tr>
                  )}
                  {/* 📊 Overall Grand Totals Row */}
                  <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                    <td colSpan={2} className="p-2 border border-black text-right uppercase tracking-wider text-gray-900">
                      Grand Total Summary (All {reportRows.length} Customers):
                    </td>
                    <td className="p-2 border border-black text-center text-indigo-900">
                      {totalInvoicesCount}
                    </td>
                    <td className="p-2 border border-black text-right text-rose-800 font-bold whitespace-nowrap">
                      {totalReturnedUnits.toLocaleString()}
                    </td>
                    <td className="p-2 border border-black text-right text-purple-900 text-sm font-black underline decoration-double whitespace-nowrap">
                      Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-center text-[10px] text-gray-600">100.0%</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              // ── 📑 DETAILED VIEW TABLE (GROUPED CUSTOMER RETURN BREAKDOWN) ──
              <div className="space-y-6">
                {displayedRows.length === 0 ? (
                  <div className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                    No sales return records discovered matching chosen selection criteria.
                  </div>
                ) : (
                  displayedRows.map((cust: any, cIdx: number) => {
                    const realCustomerNum = isPrinting || pageSize === 'all' ? cIdx + 1 : (currentPage - 1) * (pageSize as number) + cIdx + 1;
                    const custTotalAmount = Number(cust.total_return_amount || 0);
                    const custTotalUnits = Number(cust.total_returned_qty || 0);

                    return (
                      <div key={cIdx} className="border border-black rounded-xs overflow-hidden shadow-xs">
                        {/* 👤 Customer Header Banner */}
                        <div className="bg-slate-800 text-white p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-rose-500 text-white px-2 py-0.5 rounded font-black text-[10px]">#{realCustomerNum}</span>
                            <span className="font-bold font-sans text-sm tracking-wide uppercase text-white">{cust.customer_name}</span>
                            <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px]">Return Notes: {cust.returns_count}</span>
                            <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px]">Units Returned: {custTotalUnits.toLocaleString()}</span>
                            <span className="text-slate-400 text-[10px]">Share: {Number(cust.contribution_pct || 0).toFixed(1)}%</span>
                          </div>
                          <div className="text-right text-[11px] font-black font-mono flex items-center gap-3">
                            <span className="text-purple-300 font-extrabold underline decoration-double">
                              Total Credit Adjusted: Rs. {custTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Customer Return Transactions Sub-table */}
                        <table className="w-full table-auto border-collapse text-[11px] font-sans text-left">
                          <thead>
                            <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[9.5px]">
                              <th className="p-1.5 border border-black text-center w-10">S#</th>
                              <th className="p-1.5 border border-black text-center w-24">Date</th>
                              <th className="p-1.5 border border-black w-28">Return Ref #</th>
                              <th className="p-1.5 border border-black w-28">Original Inv #</th>
                              <th className="p-1.5 border border-black">Sales Officer</th>
                              <th className="p-1.5 border border-black">Returned Line Items</th>
                              <th className="p-1.5 border border-black w-28">Restocked Warehouse</th>
                              <th className="p-1.5 border border-black w-28">Reason / Remarks</th>
                              <th className="p-1.5 border border-black text-right w-28 pr-3">Credit Amount (PKR)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(cust.transactions || []).map((row: any, tIdx: number) => {
                              const displayDocPrefixId = row.return_no || `RTN-${String(row.id).padStart(4, '0')}`;
                              const processingDateDisplay = row.return_date || String(row.created_at || '').split('T')[0];
                              const originalInvDisplay = row.original_invoice_no || '-';
                              const itemDetails = extractItemDetails(row);
                              const itemNames = extractItemNames(row);

                              return (
                                <tr key={tIdx} className="border-b border-gray-300 hover:bg-gray-50 font-mono text-xs">
                                  <td className="p-1.5 border border-black text-center text-gray-500 align-top">{tIdx + 1}</td>
                                  <td className="p-1.5 border border-black text-center text-gray-700 align-top">{processingDateDisplay}</td>
                                  <td className="p-1.5 border border-black font-black text-rose-700 uppercase align-top">{displayDocPrefixId}</td>
                                  <td className="p-1.5 border border-black font-bold text-primary uppercase align-top">{originalInvDisplay}</td>
                                  <td className="p-1.5 border border-black font-sans font-medium text-black align-top">{row.salesman || 'Direct'}</td>
                                  <td className="p-1.5 border border-black font-sans text-gray-800 text-xs align-top">
                                    {itemDetails.length > 0 ? (
                                      <div className="flex flex-col gap-1 py-0.5">
                                        {itemDetails.map((item, idx) => (
                                          <div key={idx} className="border-b border-rose-100 last:border-b-0 pb-1 last:pb-0">
                                            <div className="font-semibold text-black leading-tight break-words text-xs">{item.name}</div>
                                            <div className="text-[10.5px] font-mono text-gray-700 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                                              <span className="text-rose-700 font-bold">{item.qty} {item.uom}</span>
                                              <span className="text-gray-400">×</span>
                                              <span>Rs. {Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                              <span className="font-bold text-rose-900">= Rs. {(Number(item.qty || 0) * Number(item.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : itemNames.length > 0 ? (
                                      itemNames.map((name: string, i: number) => (
                                        <React.Fragment key={i}>
                                          {i > 0 && <span className="text-rose-700 font-black text-sm px-1.5 font-mono">|</span>}
                                          <span>{name}</span>
                                        </React.Fragment>
                                      ))
                                    ) : (
                                      <span className="text-gray-400 italic">No Items Listed</span>
                                    )}
                                  </td>
                                  <td className="p-1.5 border border-black font-sans text-gray-700 align-top">{row.dispatch_warehouse || row.location || 'Main Warehouse'}</td>
                                  <td className="p-1.5 border border-black font-sans text-gray-600 text-[10px] align-top">{row.reason || row.remarks || 'Standard Return'}</td>
                                  <td className="p-1.5 border border-black text-right pr-3 font-black text-purple-900 align-top">
                                    Rs. {Number(row.return_amount || row.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 border-t border-black font-black font-mono text-xs">
                              <td colSpan={5} className="p-1.5 border border-black text-right uppercase tracking-wider text-gray-600">
                                Subtotal ({cust.customer_name} : {cust.returns_count} Return Notes):
                              </td>
                              <td colSpan={3} className="p-1.5 border border-black text-right text-[10px] font-bold text-rose-800">
                                Units Returned: {custTotalUnits.toLocaleString()}
                              </td>
                              <td className="p-1.5 border border-black text-right pr-3 text-purple-900 font-black">
                                Rs. {custTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    );
                  })
                )}

                {/* Grand Summary Across All Customers */}
                {reportRows.length > 0 && (
                  <div className="space-y-2">
                    {!isPrinting && pageSize !== 'all' && (
                      <div className="bg-amber-50/80 p-3 rounded border border-amber-300 flex justify-between items-center font-mono font-bold text-xs text-amber-950">
                        <span className="uppercase text-amber-900">
                          Page {currentPage} Subtotal ({displayedRows.length} Customers On This Page):
                        </span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-indigo-900">Return Notes: {displayedRows.reduce((s: number, r: any) => s + Number(r.returns_count || 0), 0)}</span>
                          <span className="text-rose-800 font-bold">Units Returned: {displayedRows.reduce((s: number, r: any) => s + Number(r.total_returned_qty || 0), 0).toLocaleString()}</span>
                          <span className="text-purple-900 font-black">Page Credit Total: Rs. {displayedRows.reduce((s: number, r: any) => s + Number(r.total_return_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-100 p-3.5 rounded border-2 border-black flex justify-between items-center font-mono font-black text-xs">
                      <span className="uppercase text-gray-900">
                        Grand Total Customer Return Breakdown Summary (All {reportRows.length} Customers):
                      </span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-indigo-900">Total Return Notes: {totalInvoicesCount}</span>
                        <span className="text-rose-800 font-bold">Total Units Returned: {totalReturnedUnits.toLocaleString()}</span>
                        <span className="text-purple-800 text-sm underline decoration-double">
                          Grand Credit Adjusted: Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
    </>
  );
};
