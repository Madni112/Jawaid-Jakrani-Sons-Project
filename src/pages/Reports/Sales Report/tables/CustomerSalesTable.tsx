import React from 'react';
import { extractItemNames, extractItemDetails, extractRowDiscounts } from '../services/saleReportHelpers';

interface CustomerSalesTableProps {
  activeViewMode: 'summary' | 'detailed';
  displayedRows: any[];
  isPrinting: boolean;
  pageSize: number | 'all';
  currentPage: number;
  reportRows: any[];
  resolveCustomerMeta: (custName?: string) => { code: string; pageNo: string };
  totalSoldUnits: number;
  totalReturnedUnits: number;
  totalNetUnits: number;
  totalGrossAmount: number;
  totalCustomerGrossSales: number;
  totalReturnAmount: number;
  totalInvoicesCount?: number;
  totalReturnsCount?: number;
}

export const CustomerSalesTable: React.FC<CustomerSalesTableProps> = ({
  activeViewMode,
  displayedRows,
  isPrinting,
  pageSize,
  currentPage,
  reportRows,
  resolveCustomerMeta,
  totalSoldUnits,
  totalReturnedUnits,
  totalNetUnits,
  totalGrossAmount,
  totalCustomerGrossSales,
  totalReturnAmount,
  totalInvoicesCount = 0,
  totalReturnsCount = 0,
}) => {
  return (
    <>
      {activeViewMode === 'summary' ? (
              // ── 📊 SUMMARY VIEW TABLE (1 ROW / CUSTOMER) ──
              <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans antialiased text-left print:w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[9.5px]">
                    <th className="p-1.5 border border-black text-center w-10">S#</th>
                    <th className="p-1.5 border border-black w-[22%] min-w-[160px] max-w-[300px]">Customer Name</th>
                    <th className="p-1.5 border border-black text-right w-[8%] min-w-[75px]">Sold Vol</th>
                    <th className="p-1.5 border border-black text-right w-[8%] min-w-[75px]">Return Vol</th>
                    <th className="p-1.5 border border-black text-right w-[8%] min-w-[75px]">Net Vol</th>
                    <th className="p-1.5 border border-black text-right w-[17%] min-w-[110px]">Gross Sales (PKR)</th>
                    <th className="p-1.5 border border-black text-right w-[15%] min-w-[110px] text-rose-800">Returns (PKR)</th>
                    <th className="p-1.5 border border-black text-right w-[17%] min-w-[120px]">Net Revenue (PKR)</th>
                    <th className="p-1.5 border border-black text-center w-[6%] min-w-[60px]">% Share</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                        No customer sales breakdown records discovered matching chosen selection criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((cust, idx) => {
                      const realIndex = isPrinting || pageSize === 'all' ? idx + 1 : (currentPage - 1) * (pageSize as number) + idx + 1;
                      const grossVol = Number(cust.gross_units || 0);
                      const retVol = Number(cust.returned_units || 0);
                      const netVol = Number(cust.net_units || grossVol - retVol);
                      const grossSales = Number(cust.gross_sales || 0);
                      const retAmt = Number(cust.return_amount || 0);
                      const netRev = Number(cust.net_sales || grossSales - retAmt);

                      const meta = resolveCustomerMeta(cust.customer_name);
                      const code = cust.customer_code || cust.customerCode || cust.customercode || meta.code || '';
                      const pageNo = cust.page_no || cust.pageNo || meta.pageNo || '';

                      return (
                        <tr key={idx} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs">
                          <td className="p-1.5 border border-black text-center text-gray-600 align-top">{realIndex}</td>
                          <td className="p-1.5 border border-black font-sans align-top min-w-[160px] max-w-[300px]">
                            <div className="font-bold text-black text-xs leading-tight">
                              {cust.customer_name}
                            </div>
                            {(code || pageNo) && (
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
                            )}
                          </td>
                          <td className="p-1.5 border border-black text-right text-gray-800">
                            {grossVol.toLocaleString()}
                          </td>
                          <td className="p-1.5 border border-black text-right text-rose-700">
                            {retVol > 0 ? `-${retVol.toLocaleString()}` : '0'}
                          </td>
                          <td className="p-1.5 border border-black text-right font-bold text-emerald-700">
                            {netVol.toLocaleString()}
                          </td>
                          <td className="p-1.5 border border-black text-right text-gray-800">
                            Rs. {grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1.5 border border-black text-right text-rose-700 font-bold">
                            {retAmt > 0 ? `- Rs. ${retAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Rs. 0.00'}
                          </td>
                          <td className="p-1.5 border border-black text-right text-purple-900 font-black">
                            Rs. {netRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                      <td className="p-2 border border-black text-right text-gray-800 whitespace-nowrap">
                        {displayedRows.reduce((sum, r) => sum + Number(r.gross_units || 0), 0).toLocaleString()}
                      </td>
                      <td className="p-2 border border-black text-right text-rose-700 whitespace-nowrap">
                        -{displayedRows.reduce((sum, r) => sum + Number(r.returned_units || 0), 0).toLocaleString()}
                      </td>
                      <td className="p-2 border border-black text-right text-emerald-800 font-bold whitespace-nowrap">
                        {displayedRows.reduce((sum, r) => sum + Number(r.net_units || 0), 0).toLocaleString()}
                      </td>
                      <td className="p-2 border border-black text-right text-gray-900 whitespace-nowrap">
                        Rs. {displayedRows.reduce((sum, r) => sum + Number(r.gross_sales || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border border-black text-right text-rose-800 font-bold whitespace-nowrap">
                        - Rs. {displayedRows.reduce((sum, r) => sum + Number(r.return_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border border-black text-right text-purple-900 font-black whitespace-nowrap">
                        Rs. {displayedRows.reduce((sum, r) => sum + Number(r.net_sales || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                    <td className="p-2 border border-black text-right text-gray-900 font-bold whitespace-nowrap">
                      {totalSoldUnits.toLocaleString()}
                    </td>
                    <td className="p-2 border border-black text-right text-rose-700 font-bold whitespace-nowrap">
                      -{totalReturnedUnits.toLocaleString()}
                    </td>
                    <td className="p-2 border border-black text-right text-emerald-800 font-bold whitespace-nowrap">
                      {totalNetUnits.toLocaleString()}
                    </td>
                    <td className="p-2 border border-black text-right text-gray-900 font-bold whitespace-nowrap">
                      Rs. {totalCustomerGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right text-rose-700 font-bold whitespace-nowrap">
                      - Rs. {totalReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right text-purple-900 text-sm font-black underline decoration-double whitespace-nowrap">
                      Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-center text-[10px] text-gray-600">100.0%</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              // ── 📑 DETAILED VIEW TABLE (GROUPED CUSTOMER INVOICE BREAKDOWN) ──
              <div className="space-y-6">
                {displayedRows.length === 0 ? (
                  <div className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                    No customer sales breakdown records discovered matching chosen selection criteria.
                  </div>
                ) : (
                  displayedRows.map((cust: any, cIdx: number) => {
                    const realCustomerNum = isPrinting || pageSize === 'all' ? cIdx + 1 : (currentPage - 1) * (pageSize as number) + cIdx + 1;
                    const custGrossSales = Number(cust.gross_sales || 0);
                    const custReturnAmount = Number(cust.return_amount || 0);
                    const custNetRevenue = Number(cust.net_sales || custGrossSales - custReturnAmount);
                    const custGrossUnits = Number(cust.gross_units || 0);
                    const custRetUnits = Number(cust.returned_units || 0);
                    const custNetUnits = Number(cust.net_units || custGrossUnits - custRetUnits);
                    const custTotalFreight = (cust.transactions || []).reduce(
                      (sum: number, r: any) => sum + (Number(r.transport_charges || r.freight_charges || r.freight || 0) + Number(r.additional_charges || 0)),
                      0
                    );

                    // Combine and sort all transactions
                    const combinedTx = [
                      ...(cust.transactions || []),
                      ...(cust.return_transactions || [])
                    ].sort((a: any, b: any) => {
                      const dateA = a.sale_date || a.return_date || a.created_at || '';
                      const dateB = b.sale_date || b.return_date || b.created_at || '';
                      return dateA.localeCompare(dateB);
                    });

                    return (
                      <div key={cIdx} className="border border-black rounded-xs overflow-hidden shadow-xs">
                        {/* 👤 Customer Header Banner */}
                        <div className="bg-slate-800 text-white p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-emerald-500 text-black px-2 py-0.5 rounded font-black text-[10px]">#{realCustomerNum}</span>
                            <span className="font-bold font-sans text-sm tracking-wide uppercase text-white">{cust.customer_name}</span>
                            {(() => {
                              const meta = resolveCustomerMeta(cust.customer_name);
                              const code = cust.customer_code || cust.customerCode || cust.customercode || meta.code || '';
                              const pageNo = cust.page_no || cust.pageNo || meta.pageNo || '';
                              return (
                                <>
                                  {code && (
                                    <span className="bg-slate-700 text-blue-200 border border-blue-400/40 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                                      Code: {code}
                                    </span>
                                  )}
                                  {pageNo && (
                                    <span className="bg-slate-700 text-purple-200 border border-purple-400/40 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                                      {String(pageNo).toUpperCase().startsWith('P#') ? pageNo : `Page: ${pageNo}`}
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                            <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px]">Invoices: {cust.invoices_count}</span>
                            <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px]">Returns: {cust.returns_count}</span>
                            <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px]">Net Volume: {custNetUnits.toLocaleString()} Units</span>
                            <span className="text-slate-400 text-[10px]">Share: {Number(cust.contribution_pct || 0).toFixed(1)}%</span>
                          </div>
                          <div className="text-right text-[11px] font-black font-mono flex items-center gap-3">
                            <span className="text-emerald-400">Gross: Rs. {custGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-rose-400">Returns: - Rs. {custReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-purple-300 font-extrabold underline decoration-double">Net: Rs. {custNetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        {/* Customer Transactions Sub-table */}
                        <table className="w-full table-auto border-collapse text-[11px] font-sans text-left">
                          <thead>
                            <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[9.5px]">
                              <th className="p-1.5 border border-black text-center w-10">S#</th>
                              <th className="p-1.5 border border-black text-center w-24">Date</th>
                              <th className="p-1.5 border border-black w-28">Doc / Ref #</th>
                              <th className="p-1.5 border border-black">Sales Officer</th>
                              <th className="p-1.5 border border-black">Product Line Items</th>
                              <th className="p-1.5 border border-black text-center w-24">Doc Type / Term</th>
                              <th className="p-1.5 border border-black text-right w-24 pr-2 text-amber-900">Discount</th>
                              <th className="p-1.5 border border-black text-right w-28 pr-3">Total (PKR)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {combinedTx.map((row: any, tIdx: number) => {
                              const isReturn = row.record_type === 'return';
                              const displayDocPrefixId = isReturn
                                ? (row.return_no || `RTN-${String(row.id).padStart(4, '0')}`)
                                : (row.invoice_no || `INV-${String(row.id).padStart(4, '0')}`);
                              const processingDateDisplay = row.sale_date || row.return_date || String(row.created_at || '').split('T')[0];
                              const itemDetails = extractItemDetails(row);
                              const itemNames = extractItemNames(row);
                              const rowDiscounts = extractRowDiscounts(row);
                              const isCash = String(row.payment_term || '').toLowerCase() === 'cash';
                              const rowAmount = Number(isReturn ? (row.return_amount || row.total_amount || 0) : (row.total_amount || 0));
                              const rowFreight = isReturn ? 0 : (Number(row.transport_charges || row.freight_charges || row.freight || 0) + Number(row.additional_charges || 0));

                              return (
                                <tr key={tIdx} className={`border-b border-gray-300 hover:bg-gray-50 font-mono text-xs ${isReturn ? 'bg-rose-50/40' : ''}`}>
                                  <td className="p-1.5 border border-black text-center text-gray-500 align-top">{tIdx + 1}</td>
                                  <td className="p-1.5 border border-black text-center text-gray-700 align-top">{processingDateDisplay}</td>
                                  <td className="p-1.5 border border-black font-black uppercase align-top">
                                    {isReturn ? (
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <span className="text-rose-700">{displayDocPrefixId}</span>
                                        <span className="bg-rose-100 text-rose-800 text-[9px] px-1 py-0.2 rounded font-bold border border-rose-300">RETURN</span>
                                      </div>
                                    ) : (
                                      <span className="text-primary">{displayDocPrefixId}</span>
                                    )}
                                  </td>
                                  <td className="p-1.5 border border-black font-sans font-medium text-black align-top">{row.salesman || 'Direct'}</td>
                                  <td className="p-1.5 border border-black font-sans text-gray-800 text-xs align-top">
                                    {itemDetails.length > 0 ? (
                                      <div className="flex flex-col gap-1 py-0.5">
                                        {itemDetails.map((item, idx) => (
                                          <div key={idx} className="border-b border-gray-100 last:border-b-0 pb-1 last:pb-0">
                                            <div className="font-semibold text-black leading-tight break-words text-xs">{item.name}</div>
                                            <div className="text-[10px] font-mono text-gray-700 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                                              <span className={isReturn ? "text-rose-700 font-bold" : "text-primary font-bold"}>{item.qty} {item.uom}</span>
                                              <span className="text-gray-400">×</span>
                                              <span>Rs. {Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                              <span className="font-bold text-slate-900">= Rs. {(Number(item.qty || 0) * Number(item.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                              {item.discountAmt > 0 && (
                                                <span className="text-amber-800 font-bold bg-amber-50 px-1 rounded border border-amber-200 text-[9px] whitespace-nowrap">
                                                  Disc: Rs. {item.discountAmt.toLocaleString()} ({item.discountPer}%)
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : itemNames.length > 0 ? (
                                      itemNames.map((name: string, i: number) => (
                                        <React.Fragment key={i}>
                                          {i > 0 && <span className="text-emerald-700 font-black text-sm px-1.5 font-mono">|</span>}
                                          <span>{name}</span>
                                        </React.Fragment>
                                      ))
                                    ) : (
                                      <span className="text-gray-400 italic">No Items</span>
                                    )}
                                  </td>
                                  <td className="p-1.5 border border-black text-center align-top">
                                    {isReturn ? (
                                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                        Return Credit
                                      </span>
                                    ) : (
                                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase ${isCash ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800 border border-blue-300'
                                        }`}>
                                        {row.payment_term || 'Credit'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-1.5 border border-black text-right pr-2 text-amber-900 font-mono text-xs align-top">
                                    {rowDiscounts.grandTotalDiscount > 0 ? (
                                      <div className="space-y-0.5 text-right">
                                        {rowDiscounts.totalItemDiscount > 0 && rowDiscounts.overallBillDiscount > 0 ? (
                                          <>
                                            <div className="text-[10px] text-amber-800 font-sans font-medium leading-tight">
                                              Items: Rs. {rowDiscounts.totalItemDiscount.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-amber-900 font-bold bg-amber-100/70 px-1 py-0.5 rounded border border-amber-300/70 leading-tight">
                                              Bill: Rs. {rowDiscounts.overallBillDiscount.toLocaleString()}
                                            </div>
                                            <div className="border-t border-amber-300 pt-0.5 font-black text-amber-950 text-xs leading-tight">
                                              Total: Rs. {rowDiscounts.grandTotalDiscount.toLocaleString()}
                                            </div>
                                          </>
                                        ) : rowDiscounts.totalItemDiscount > 0 ? (
                                          <div className="text-amber-800 font-bold text-xs leading-tight">
                                            Rs. {rowDiscounts.totalItemDiscount.toLocaleString()}
                                          </div>
                                        ) : (
                                          <div className="text-amber-900 font-bold text-[10px] bg-amber-100/70 px-1 py-0.5 rounded border border-amber-300/70 leading-tight">
                                            Bill: Rs. {rowDiscounts.overallBillDiscount.toLocaleString()}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 font-mono">-</span>
                                    )}
                                  </td>
                                  <td className={`p-1.5 border border-black text-right pr-3 font-black align-top font-mono text-xs ${isReturn ? 'text-rose-700' : 'text-emerald-700'}`}>
                                    <div>{isReturn ? `- Rs. ${rowAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `Rs. ${rowAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</div>
                                    {!isReturn && rowFreight > 0 && (
                                      <div className="text-[9.5px] font-sans font-medium text-slate-500 mt-0.5 leading-tight">
                                        (Inc. Freight Ch. {rowFreight.toLocaleString()})
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 border-t border-black font-black font-mono text-xs">
                              <td colSpan={4} className="p-1.5 border border-black text-right uppercase tracking-wider text-gray-600">
                                Subtotal ({cust.customer_name} : {cust.invoices_count} Inv / {cust.returns_count} Rtn):
                              </td>
                              <td className="p-1.5 border border-black text-center font-bold text-emerald-800">
                                Net Vol: {custNetUnits.toLocaleString()} Units <span className="text-[10px] text-gray-500 font-normal">({custGrossUnits.toLocaleString()} - {custRetUnits.toLocaleString()})</span>
                              </td>
                              <td colSpan={2} className="p-1.5 border border-black text-right text-[10px] font-bold text-gray-700">
                                Gross: Rs. {custGrossSales.toLocaleString()} | Ret: - Rs. {custReturnAmount.toLocaleString()}
                              </td>
                              <td className="p-1.5 border border-black text-right pr-3 text-purple-900 font-black">
                                <div>Rs. {custNetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                {custTotalFreight > 0 && (
                                  <div className="text-[9px] font-sans font-medium text-slate-500 mt-0.5 leading-tight">
                                    (Inc. Total Freight: {custTotalFreight.toLocaleString()})
                                  </div>
                                )}
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
                          <span className="text-indigo-900">Inv: {displayedRows.reduce((s: number, r: any) => s + Number(r.invoices_count || 0), 0)} | Rtn: {displayedRows.reduce((s: number, r: any) => s + Number(r.returns_count || 0), 0)}</span>
                          <span className="text-emerald-800 font-bold">Net Vol: {displayedRows.reduce((s: number, r: any) => s + Number(r.net_units || 0), 0).toLocaleString()}</span>
                          <span className="text-emerald-800">Gross: Rs. {displayedRows.reduce((s: number, r: any) => s + Number(r.gross_sales || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-rose-700">Ret: - Rs. {displayedRows.reduce((s: number, r: any) => s + Number(r.return_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-purple-900 font-black">Net: Rs. {displayedRows.reduce((s: number, r: any) => s + Number(r.net_sales || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-100 p-3.5 rounded border-2 border-black flex justify-between items-center font-mono font-black text-xs">
                      <span className="uppercase text-gray-900">
                        Grand Total Customer Breakdown Summary (All {reportRows.length} Customers):
                      </span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-indigo-900">Invoices: {totalInvoicesCount} | Returns: {totalReturnsCount}</span>
                        <span className="text-emerald-800 font-bold">Net Volume: {totalNetUnits.toLocaleString()} Units</span>
                        <span className="text-gray-900">Gross: Rs. {totalCustomerGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="text-rose-700">Returns: - Rs. {totalReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="text-purple-800 text-sm underline decoration-double">
                          Grand Net Revenue: Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
