import React from 'react';
import { extractItemNames, extractItemDetails, extractRowDiscounts } from '../services/saleReportHelpers';

interface SaleCommercialTableProps {
  activeViewMode: 'summary' | 'detailed';
  displayedRows: any[];
  isPrinting: boolean;
  pageSize: number | 'all';
  currentPage: number;
  reportRows: any[];
  resolveCustomerMeta: (custName?: string) => { code: string; pageNo: string };
  totalGrossAmount: number;
  totalCustomerGrossSales: number;
  totalReturnAmount: number;
  totalInvoicesCount?: number;
  totalReturnsCount?: number;
  cashAmount?: number;
  creditAmount?: number;
}

export const SaleCommercialTable: React.FC<SaleCommercialTableProps> = ({
  activeViewMode,
  displayedRows,
  isPrinting,
  pageSize,
  currentPage,
  reportRows,
  resolveCustomerMeta,
  totalGrossAmount,
  totalCustomerGrossSales,
  totalReturnAmount,
  totalInvoicesCount = 0,
  totalReturnsCount = 0,
  cashAmount = 0,
  creditAmount = 0,
}) => {
  return (
    <>
      {activeViewMode === 'summary' ? (
              // ── 📊 SUMMARY VIEW TABLE (1 ROW / SALESMAN) ──
              <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans antialiased text-left print:w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                    <th className="p-1.5 border border-black text-center w-10">S#</th>
                    <th className="p-1.5 border border-black">Sales Officer / Salesman Name</th>
                    <th className="p-1.5 border border-black text-center">Invoices / Returns</th>
                    <th className="p-1.5 border border-black text-center">Unique Clients</th>
                    <th className="p-1.5 border border-black text-right">Cash Sales (PKR)</th>
                    <th className="p-1.5 border border-black text-right">Credit Sales (PKR)</th>
                    <th className="p-1.5 border border-black text-right">Gross Sales (PKR)</th>
                    <th className="p-1.5 border border-black text-right text-rose-700">Returns (Dr) (PKR)</th>
                    <th className="p-1.5 border border-black text-right text-purple-900">Net Realized Revenue (PKR)</th>
                    <th className="p-1.5 border border-black text-center w-24">% Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                        No commercial sales records discovered matching chosen selection criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((sm, idx) => {
                      const realIndex = isPrinting || pageSize === 'all' ? idx + 1 : (currentPage - 1) * (pageSize as number) + idx + 1;
                      return (
                        <tr key={idx} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs">
                          <td className="p-1.5 border border-black text-center text-gray-600">{realIndex}</td>
                          <td className="p-1.5 border border-black font-sans font-bold text-black">{sm.salesman}</td>
                          <td className="p-1.5 border border-black text-center font-bold text-indigo-700">
                            {sm.invoices_count} / {sm.returns_count}
                          </td>
                          <td className="p-1.5 border border-black text-center text-gray-700 font-bold">{sm.unique_customers_count}</td>
                          <td className="p-1.5 border border-black text-right text-emerald-700 font-bold">
                            Rs. {Number(sm.cash_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1.5 border border-black text-right text-blue-700 font-bold">
                            Rs. {Number(sm.credit_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1.5 border border-black text-right text-gray-900 font-bold">
                            Rs. {Number(sm.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1.5 border border-black text-right text-rose-700 font-bold">
                            - Rs. {Number(sm.return_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1.5 border border-black text-right text-purple-800 font-black">
                            Rs. {Number(sm.net_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1.5 border border-black text-center text-slate-800 font-bold">
                            {Number(sm.contribution_pct || 0).toFixed(1)}%
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
                        Page {currentPage} Subtotal ({displayedRows.length} Sales Officers):
                      </td>
                      <td className="p-2 border border-black text-center text-indigo-900 font-bold">
                        {displayedRows.reduce((sum, r) => sum + Number(r.invoices_count || 0), 0)} / {displayedRows.reduce((sum, r) => sum + Number(r.returns_count || 0), 0)}
                      </td>
                      <td className="p-2 border border-black text-center text-gray-700 font-bold">
                        {displayedRows.reduce((sum, r) => sum + Number(r.unique_customers_count || 0), 0)}
                      </td>
                      <td className="p-2 border border-black text-right text-emerald-800 font-bold whitespace-nowrap">
                        Rs. {displayedRows.reduce((sum, r) => sum + Number(r.cash_sales || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border border-black text-right text-blue-800 font-bold whitespace-nowrap">
                        Rs. {displayedRows.reduce((sum, r) => sum + Number(r.credit_sales || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border border-black text-right text-gray-900 font-bold whitespace-nowrap">
                        Rs. {displayedRows.reduce((sum, r) => sum + Number(r.gross_sales || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border border-black text-right text-rose-700 font-bold whitespace-nowrap">
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
                      Grand Total Summary (All {reportRows.length} Sales Officers):
                    </td>
                    <td className="p-2 border border-black text-center text-indigo-900 font-bold">
                      {totalInvoicesCount} / {totalReturnsCount}
                    </td>
                    <td className="p-2 border border-black text-center text-gray-800">
                      {reportRows.reduce((sum, r) => sum + Number(r.unique_customers_count || 0), 0)}
                    </td>
                    <td className="p-2 border border-black text-right text-emerald-800 whitespace-nowrap">
                      Rs. {cashAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right text-blue-800 whitespace-nowrap">
                      Rs. {creditAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
              // ── 📑 DETAILED VIEW TABLE (GROUPED SALESMAN INVOICE BREAKDOWN) ──
              <div className="space-y-6">
                {displayedRows.length === 0 ? (
                  <div className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                    No commercial sales records discovered matching chosen selection criteria.
                  </div>
                ) : (
                  displayedRows.map((sm: any, sIdx: number) => {
                    const realSalesmanNum = isPrinting || pageSize === 'all' ? sIdx + 1 : (currentPage - 1) * (pageSize as number) + sIdx + 1;
                    const smGrossSales = Number(sm.gross_sales || 0);
                    const smReturnAmount = Number(sm.return_amount || sm.returned_amount || 0);
                    const smNetRevenue = Number(sm.net_sales || smGrossSales - smReturnAmount);
                    const smCashAmount = Number(sm.cash_sales || 0);
                    const smCreditAmount = Number(sm.credit_sales || 0);

                    const invList = (sm.transactions || []).slice().sort((a: any, b: any) => {
                      const dateA = a.sale_date || a.created_at || '';
                      const dateB = b.sale_date || b.created_at || '';
                      return dateA.localeCompare(dateB);
                    });

                    const smTotalFreight = invList.reduce(
                      (sum: number, r: any) => sum + (Number(r.transport_charges || r.freight_charges || r.freight || 0) + Number(r.additional_charges || 0)),
                      0
                    );

                    const retList = (sm.return_transactions || []).slice().sort((a: any, b: any) => {
                      const dateA = a.return_date || a.created_at || '';
                      const dateB = b.return_date || b.created_at || '';
                      return dateA.localeCompare(dateB);
                    });

                    return (
                      <div key={sIdx} className="border-2 border-black rounded-xs overflow-hidden shadow-xs">
                        {/* 👔 Salesman Master Header Banner */}
                        <div className="bg-slate-900 text-white p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-emerald-500 text-black px-2 py-0.5 rounded font-black text-[10px]">#{realSalesmanNum}</span>
                            <span className="font-bold font-sans text-sm tracking-wide uppercase text-white">{sm.salesman}</span>
                            <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px] border border-slate-700">Invoices: {sm.invoices_count}</span>
                            <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px] border border-slate-700">Returns: {sm.returns_count}</span>
                            <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px] border border-slate-700">Unique Clients: {sm.unique_customers_count}</span>
                            <span className="text-slate-400 text-[10px]">Share: {Number(sm.contribution_pct || 0).toFixed(1)}%</span>
                          </div>
                          <div className="text-right text-[11px] font-black font-mono flex items-center gap-3">
                            <span className="text-emerald-400">Gross: Rs. {smGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-rose-400">Returns: - Rs. {smReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-amber-300 font-extrabold underline decoration-double">Net Realized: Rs. {smNetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        {/* ══════════════════════════════════════════════════ */}
                        {/* 📑 SUB-SECTION 1: SALES INVOICES HEADER & TABLE   */}
                        {/* ══════════════════════════════════════════════════ */}
                        <div className="bg-slate-100 border-b border-black px-3 py-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-[11px] font-mono font-bold text-slate-900">
                          <span className="uppercase text-emerald-900 font-black flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-xs"></span>
                            1. Sales Invoices Register ({invList.length} Invoices)
                          </span>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span>Cash Sales: <b className="text-emerald-700">Rs. {smCashAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></span>
                            <span className="text-gray-400">|</span>
                            <span>Credit Sales: <b className="text-blue-700">Rs. {smCreditAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></span>
                            <span className="text-gray-400">|</span>
                            <span>Gross Invoiced: <b className="text-slate-900 font-black">Rs. {smGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></span>
                          </div>
                        </div>

                        <table className="w-full table-auto border-collapse text-[11px] font-sans text-left">
                          <thead>
                            <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[9.5px]">
                              <th className="p-1.5 border border-black text-center w-10">S#</th>
                              <th className="p-1.5 border border-black text-center w-24">Date</th>
                              <th className="p-1.5 border border-black w-28">Invoice #</th>
                              <th className="p-1.5 border border-black min-w-[140px] max-w-[220px]">Customer Name</th>
                              <th className="p-1.5 border border-black">Products / Line Items</th>
                              <th className="p-1.5 border border-black text-center w-20">Term</th>
                              <th className="p-1.5 border border-black w-28">Carrier Fleet</th>
                              <th className="p-1.5 border border-black text-right w-24 pr-2 text-amber-900">Discount</th>
                              <th className="p-1.5 border border-black text-right w-28 pr-3">Gross Amount (PKR)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invList.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="p-3 text-center text-gray-400 italic font-mono border border-black">
                                  No sales invoices booked for this salesman within chosen duration.
                                </td>
                              </tr>
                            ) : (
                              invList.map((row: any, tIdx: number) => {
                                const displayDocPrefixId = row.invoice_no || `INV-${String(row.id).padStart(4, '0')}`;
                                const processingDateDisplay = row.sale_date || String(row.created_at || '').split('T')[0];
                                const itemDetails = extractItemDetails(row);
                                const itemNames = extractItemNames(row);
                                const rowDiscounts = extractRowDiscounts(row);
                                const isCash = String(row.payment_term || '').toLowerCase() === 'cash';
                                const rowAmount = Number(row.total_amount || 0);
                                const rowFreight = Number(row.transport_charges || row.freight_charges || row.freight || 0) + Number(row.additional_charges || 0);

                                return (
                                  <tr key={tIdx} className="border-b border-gray-300 hover:bg-gray-50 font-mono text-xs">
                                    <td className="p-1.5 border border-black text-center text-gray-500 align-top">{tIdx + 1}</td>
                                    <td className="p-1.5 border border-black text-center text-gray-700 align-top">{processingDateDisplay}</td>
                                    <td className="p-1.5 border border-black font-black uppercase align-top text-primary">{displayDocPrefixId}</td>
                                    <td className="p-1.5 border border-black font-sans align-top min-w-[140px] max-w-[220px]">
                                      <div className="font-semibold text-black leading-tight break-words text-xs">
                                        {row.customer_name || 'Counter Retail Buyer'}
                                      </div>
                                      {(() => {
                                        const meta = resolveCustomerMeta(row.customer_name);
                                        const code = row.customer_code || row.customerCode || meta.code || '';
                                        const pageNo = row.page_no || row.pageNo || meta.pageNo || '';
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
                                    <td className="p-1.5 border border-black font-sans text-gray-800 text-xs align-top">
                                      {itemDetails.length > 0 ? (
                                        <div className="flex flex-col gap-1 py-0.5">
                                          {itemDetails.map((item, idx) => (
                                            <div key={idx} className="border-b border-gray-100 last:border-b-0 pb-1 last:pb-0">
                                              <div className="font-semibold text-black leading-tight break-words text-xs">{item.name}</div>
                                              <div className="text-[10.5px] font-mono text-gray-700 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                                                <span className="text-primary font-bold">{item.qty} {item.uom}</span>
                                                <span className="text-gray-400">×</span>
                                                <span>Rs. {Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                <span className="font-bold text-slate-900">= Rs. {(Number(item.qty || 0) * Number(item.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                {item.discountAmt > 0 && (
                                                  <span className="text-amber-800 font-bold bg-amber-50 px-1 rounded border border-amber-200 text-[9.5px] whitespace-nowrap">
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
                                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase ${isCash ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800 border border-blue-300'
                                        }`}>
                                        {row.payment_term || 'Credit'}
                                      </span>
                                    </td>
                                    <td className="p-1.5 border border-black font-sans text-purple-700 font-bold align-top">{row.transport_name || 'Self Pick'}</td>
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
                                    <td className="p-1.5 border border-black text-right pr-3 font-black text-emerald-700 align-top font-mono text-xs">
                                      <div>Rs. {rowAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                      {rowFreight > 0 && (
                                        <div className="text-[9.5px] font-sans font-medium text-slate-500 mt-0.5 leading-tight">
                                          (Inc. Freight Ch. {rowFreight.toLocaleString()})
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                          {invList.length > 0 && (
                            <tfoot>
                              <tr className="bg-emerald-50/70 border-t border-black font-black font-mono text-xs">
                                <td colSpan={5} className="p-1.5 border border-black text-right uppercase tracking-wider text-emerald-950">
                                  Subtotal Sales Invoiced ({sm.salesman} : {invList.length} Invoices):
                                </td>
                                <td colSpan={3} className="p-1.5 border border-black text-right text-[10px] font-bold text-gray-700">
                                  Cash: Rs. {smCashAmount.toLocaleString()} | Credit: Rs. {smCreditAmount.toLocaleString()}
                                </td>
                                <td className="p-1.5 border border-black text-right pr-3 text-emerald-900 font-black">
                                  <div>Rs. {smGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                  {smTotalFreight > 0 && (
                                    <div className="text-[9px] font-sans font-medium text-slate-500 mt-0.5 leading-tight">
                                      (Inc. Total Freight: {smTotalFreight.toLocaleString()})
                                    </div>
                                  )}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>

                        {/* ══════════════════════════════════════════════════ */}
                        {/* 🔄 SUB-SECTION 2: SALES RETURNS HEADER & TABLE     */}
                        {/* ══════════════════════════════════════════════════ */}
                        {retList.length > 0 && (
                          <>
                            <div className="bg-rose-100 border-t-2 border-b border-black px-3 py-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-[11px] font-mono font-bold text-rose-950">
                              <span className="uppercase text-rose-900 font-black flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shadow-xs"></span>
                                2. Sales Returns & Credit Adjustments ({retList.length} Return Notes)
                              </span>
                              <div className="flex items-center gap-3 text-[10px]">
                                <span>Total Return Deductions (Dr): <b className="text-rose-800 font-black">- Rs. {smReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></span>
                              </div>
                            </div>

                            <table className="w-full table-auto border-collapse text-[11px] font-sans text-left">
                              <thead>
                                <tr className="bg-rose-50/80 border-b border-black font-black uppercase text-rose-950 font-mono text-[9.5px]">
                                  <th className="p-1.5 border border-black text-center w-10">S#</th>
                                  <th className="p-1.5 border border-black text-center w-24">Date</th>
                                  <th className="p-1.5 border border-black w-28">Return Ref #</th>
                                  <th className="p-1.5 border border-black min-w-[140px] max-w-[220px]">Customer Name</th>
                                  <th className="p-1.5 border border-black">Returned Products / Remarks</th>
                                  <th className="p-1.5 border border-black text-center w-24">Doc Type</th>
                                  <th className="p-1.5 border border-black w-28">Restocked Wh</th>
                                  <th className="p-1.5 border border-black text-right w-28 pr-3 text-rose-900">Return Amount (PKR)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {retList.map((row: any, rIdx: number) => {
                                  const displayDocPrefixId = row.return_no || `RTN-${String(row.id).padStart(4, '0')}`;
                                  const processingDateDisplay = row.return_date || String(row.created_at || '').split('T')[0];
                                  const itemDetails = extractItemDetails(row);
                                  const itemNames = extractItemNames(row);
                                  const rowAmount = Number(row.return_amount || row.total_amount || 0);

                                  return (
                                    <tr key={rIdx} className="border-b border-gray-300 hover:bg-rose-50/40 bg-rose-50/20 font-mono text-xs">
                                      <td className="p-1.5 border border-black text-center text-gray-500 align-top">{rIdx + 1}</td>
                                      <td className="p-1.5 border border-black text-center text-gray-700 align-top">{processingDateDisplay}</td>
                                      <td className="p-1.5 border border-black font-black uppercase align-top">
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <span className="text-rose-700">{displayDocPrefixId}</span>
                                          <span className="bg-rose-100 text-rose-800 text-[9px] px-1 py-0.2 rounded font-bold border border-rose-300">RETURN</span>
                                        </div>
                                      </td>
                                      <td className="p-1.5 border border-black font-sans align-top min-w-[140px] max-w-[220px]">
                                        <div className="font-semibold text-black leading-tight break-words text-xs">
                                          {row.customer_name || 'Counter Retail Buyer'}
                                        </div>
                                        {(() => {
                                          const meta = resolveCustomerMeta(row.customer_name);
                                          const code = row.customer_code || row.customerCode || meta.code || '';
                                          const pageNo = row.page_no || row.pageNo || meta.pageNo || '';
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
                                          <span className="text-gray-600 italic">{row.reason || row.remarks || 'Stock Return'}</span>
                                        )}
                                      </td>
                                      <td className="p-1.5 border border-black text-center align-top">
                                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                          Return Credit
                                        </span>
                                      </td>
                                      <td className="p-1.5 border border-black font-sans text-gray-700 font-bold align-top">{row.dispatch_warehouse || row.transport_name || 'Warehouse Return'}</td>
                                      <td className="p-1.5 border border-black text-right pr-3 font-black text-rose-700 align-top">
                                        - Rs. {rowAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="bg-rose-50/90 border-t border-black font-black font-mono text-xs">
                                  <td colSpan={5} className="p-1.5 border border-black text-right uppercase tracking-wider text-rose-950">
                                    Subtotal Sales Returns ({sm.salesman} : {retList.length} Notes):
                                  </td>
                                  <td colSpan={2} className="p-1.5 border border-black text-right text-[10px] font-bold text-rose-900">
                                    Total Return Adjustments:
                                  </td>
                                  <td className="p-1.5 border border-black text-right pr-3 text-rose-900 font-black">
                                    - Rs. {smReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </>
                        )}

                        {/* ══════════════════════════════════════════════════ */}
                        {/* 🎯 FINAL SALESMAN NET RECONCILIATION BAR           */}
                        {/* ══════════════════════════════════════════════════ */}
                        <div className="bg-slate-900 text-white p-2.5 border-t-2 border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-mono font-bold">
                          <span className="uppercase text-slate-300 tracking-wider">
                            Net Realized Performance for <b className="text-emerald-400 font-sans">{sm.salesman}</b>:
                          </span>
                          <div className="flex items-center gap-3 text-xs flex-wrap">
                            <span className="text-emerald-300">Gross: Rs. {smGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-500">-</span>
                            <span className="text-rose-300">Returns: Rs. {smReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-500">=</span>
                            <span className="text-amber-300 font-black text-sm underline decoration-double">
                              Net Commercial Revenue: Rs. {smNetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Grand Summary Across All Salesmen */}
                {reportRows.length > 0 && (
                  <div className="space-y-2">
                    {!isPrinting && pageSize !== 'all' && (
                      <div className="bg-amber-50/80 p-3 rounded border border-amber-300 flex justify-between items-center font-mono font-bold text-xs text-amber-950">
                        <span className="uppercase text-amber-900">
                          Page {currentPage} Subtotal ({displayedRows.length} Sales Officers On This Page):
                        </span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-indigo-900">Inv: {displayedRows.reduce((s: number, r: any) => s + Number(r.invoices_count || 0), 0)} | Rtn: {displayedRows.reduce((s: number, r: any) => s + Number(r.returns_count || 0), 0)}</span>
                          <span className="text-emerald-800">Gross: Rs. {displayedRows.reduce((s: number, r: any) => s + Number(r.gross_sales || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-rose-700">Ret: - Rs. {displayedRows.reduce((s: number, r: any) => s + Number(r.return_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-purple-900 font-black">Net: Rs. {displayedRows.reduce((s: number, r: any) => s + Number(r.net_sales || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-100 p-3.5 rounded border-2 border-black flex justify-between items-center font-mono font-black text-xs">
                      <span className="uppercase text-gray-900">
                        Grand Total Commercial Sales Summary (All {reportRows.length} Sales Officers):
                      </span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-indigo-900">Invoices: {totalInvoicesCount} | Returns: {totalReturnsCount}</span>
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
