import React from 'react';
import { extractItemNames, extractItemDetails, extractRowDiscounts } from '../services/saleReportHelpers';

interface SalesQueryTableProps {
  rType: string;
  displayedRows: any[];
  isPrinting: boolean;
  pageSize: number | 'all';
  currentPage: number;
  reportRows: any[];
  customerLookup: Record<string, { code: string; pageNo: string }>;
  resolveCustomerMeta: (custName?: string) => { code: string; pageNo: string };
  totalGrossAmount: number;
  totalAllDiscounts: number;
  totalAllFreight: number;
}

export const SalesQueryTable: React.FC<SalesQueryTableProps> = ({
  rType,
  displayedRows,
  isPrinting,
  pageSize,
  currentPage,
  reportRows,
  customerLookup,
  resolveCustomerMeta,
  totalGrossAmount,
  totalAllDiscounts,
  totalAllFreight,
}) => {
  const pageAllFreight = React.useMemo(() => {
    return displayedRows.reduce((acc: number, row: any) => {
      const fr = Number(row.transport_charges || row.freight_charges || row.freight || 0) + Number(row.additional_charges || 0);
      return acc + fr;
    }, 0);
  }, [displayedRows]);

  return (
    <>
      {rType === 'sales-query' ? (
        <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans antialiased text-left print:w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[9.5px]">
                  <th className="p-1.5 border border-black text-center w-10">S#</th>
                  <th className="p-1.5 border border-black text-center w-24">Date</th>
                  <th className="p-1.5 border border-black w-28">Invoice #</th>
                  <th className="p-1.5 border border-black min-w-[140px] max-w-[220px]">Customer Name</th>
                  <th className="p-1.5 border border-black">Sales Officer</th>
                  <th className="p-1.5 border border-black w-24">Carrier</th>
                  <th className="p-1.5 border border-black">Product Items</th>
                  <th className="p-1.5 border border-black w-24">Warehouse</th>
                  <th className="p-1.5 border border-black text-center w-16">Term</th>
                  <th className="p-1.5 border border-black text-right w-24 pr-2 text-amber-900">Discount</th>
                  <th className="p-1.5 border border-black text-right pr-3 w-28">Matrix Gross</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                      No sales parameter records discovered matching chosen multi-criteria query parameters.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row, idx) => {
                    const realIndex = isPrinting || pageSize === 'all' ? idx + 1 : (currentPage - 1) * (pageSize as number) + idx + 1;
                    const displayDocPrefixId = row.invoice_no || `INV-${String(row.id).padStart(4, '0')}`;
                    const processingDateDisplay = row.sale_date || String(row.created_at || '').split('T')[0];
                    const itemNames = extractItemNames(row);
                    const itemDetails = extractItemDetails(row);
                    const rowDiscounts = extractRowDiscounts(row);
                    const isCash = String(row.payment_term || '').toLowerCase() === 'cash';
                    const freight = Number(row.transport_charges || row.freight_charges || row.freight || 0) + Number(row.additional_charges || 0);

                    return (
                      <tr key={row.id || idx} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs">
                        <td className="p-1.5 border border-black text-center text-gray-600 align-top">{realIndex}</td>
                        <td className="p-1.5 border border-black text-center text-gray-700 align-top">{processingDateDisplay}</td>
                        <td className="p-1.5 border border-black font-black text-primary uppercase whitespace-nowrap align-top">{displayDocPrefixId}</td>
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
                        <td className="p-1.5 border border-black font-sans text-gray-700 align-top">{row.salesman || 'Direct'}</td>
                        <td className="p-1.5 border border-black font-sans text-purple-700 font-bold align-top">{row.transport_name || 'Self Pick'}</td>
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
                        <td className="p-1.5 border border-black font-sans text-gray-600 align-top">{row.dispatch_warehouse || 'Main Warehouse'}</td>
                        <td className="p-1.5 border border-black text-center align-top">
                          <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase ${isCash ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                            {row.payment_term || 'Credit'}
                          </span>
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
                        <td className="p-1.5 border border-black text-right pr-3 font-black text-emerald-700 align-top font-mono text-xs">
                          <div>Rs. {Number(row.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          {freight > 0 && (
                            <div className="text-[9.5px] font-sans font-medium text-slate-500 mt-0.5 leading-tight">
                              (Inc. Freight Ch. {freight.toLocaleString()})
                            </div>
                          )}
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
                    <td colSpan={10} className="p-2 border border-black text-right uppercase tracking-wider text-amber-900">
                      Page {currentPage} Subtotal ({displayedRows.length} transactions):
                    </td>
                    <td className="p-2 border border-black text-right pr-3 text-emerald-800 font-bold whitespace-nowrap">
                      <div>Rs. {displayedRows.reduce((sum, r) => sum + Number(r.total_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      {pageAllFreight > 0 && (
                        <div className="text-[9px] font-sans font-medium text-slate-500 mt-0.5 leading-tight">
                          (Inc. Total Freight: {pageAllFreight.toLocaleString()})
                        </div>
                      )}
                    </td>
                  </tr>
                )}
                {/* 📊 Overall Grand Totals Row */}
                <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                  <td colSpan={10} className="p-2 border border-black text-right uppercase tracking-wider text-gray-900">
                    Grand Total Summary (All {reportRows.length} Parameter Records):
                  </td>
                  <td className="p-2 border border-black text-right pr-3 text-success underline decoration-double text-sm whitespace-nowrap font-black">
                    <div>Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    {totalAllFreight > 0 && (
                      <div className="text-[9.5px] font-sans font-medium text-slate-600 no-underline mt-0.5 leading-tight">
                        (Inc. Total Freight: Rs. {totalAllFreight.toLocaleString()})
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="w-full table-fixed border border-collapse border-black text-xs font-sans antialiased text-left print:w-full">
              <colgroup>
                <col style={{ width: '11%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-xs">
                  <th className="p-1.5 border border-black text-center">Date</th>
                  <th className="p-1.5 border border-black">Invoice No#</th>
                  <th className="p-1.5 border border-black">Customer</th>
                  <th className="p-1.5 border border-black">Product</th>
                  <th className="p-1.5 border border-black text-right pr-2 text-amber-900">Discount</th>
                  <th className="p-1.5 border border-black text-right pr-2.5">Total</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                      No rows fetched matching the isolated active report criteria token keys.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row) => {
                    const displayDocPrefixId = row.invoice_no || (rType === 'return' ? `RTN-${String(row.id).padStart(4, '0')}` : `INV-${String(row.id).padStart(4, '0')}`);
                    const processingDateDisplay = row.sale_date || row.return_date || String(row.created_at || '').split('T')[0];
                    const itemNames = extractItemNames(row);
                    const itemDetails = extractItemDetails(row);
                    const rowDiscounts = extractRowDiscounts(row);

                    return (
                      <tr key={row.id} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs">
                        <td className="p-1.5 border border-black text-center text-gray-700 align-top font-mono text-xs whitespace-nowrap">{processingDateDisplay}</td>
                        <td className="p-1.5 border border-black text-primary font-black uppercase align-top font-mono text-xs break-all">{displayDocPrefixId}</td>
                        <td className="p-1.5 border border-black font-sans align-top">
                          <div className="font-bold text-black leading-tight break-words text-xs">
                            {row.customer_name || 'Counter Retail Buyer'}
                          </div>
                          {(() => {
                            const rawName = String(row.customer_name || '').trim().toLowerCase();
                            const matched = customerLookup[rawName] || (rawName === 'cash' ? customerLookup['walk-in customer'] || customerLookup['cash customer'] : undefined);
                            const code = row.customer_code || row.customerCode || row.customercode || matched?.code || '';
                            const pageNo = row.page_no || row.pageNo || matched?.pageNo || '';
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
                        <td className="p-1.5 border border-black font-sans text-black text-xs align-top">
                          {rType === 'invoice' ? (
                            itemDetails.length > 0 ? (
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
                            ) : (
                              <span className="text-gray-400 italic">No Items</span>
                            )
                          ) : (
                            itemNames.length > 0 ? (
                              itemNames.map((name: string, i: number) => (
                                <React.Fragment key={i}>
                                  {i > 0 && <span className="text-emerald-700 font-black text-xs px-1 font-mono">|</span>}
                                  <span className="font-medium break-words">{name}</span>
                                </React.Fragment>
                              ))
                            ) : (
                              <span className="text-gray-400 italic">No Items</span>
                            )
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
                        <td className="p-1.5 border border-black text-right pr-2.5 text-success font-black align-top font-mono text-xs">
                          <div>
                            Rs. {Number(row.total_amount || row.return_amount || row.payout_amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          {(() => {
                            const freight = Number(row.transport_charges || row.freight_charges || row.freight || 0) + Number(row.additional_charges || 0);
                            if (freight > 0) {
                              return (
                                <div className="text-[9.5px] font-sans font-medium text-slate-500 mt-0.5 leading-tight">
                                  (Inc. Freight Ch. {freight.toLocaleString()})
                                </div>
                              );
                            }
                            return null;
                          })()}
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
                    <td colSpan={4} className="p-2 border border-black text-right uppercase tracking-wider text-amber-900">
                      Page {currentPage} Subtotal ({displayedRows.length} records):
                    </td>
                    <td className="p-2 border border-black text-right pr-2 text-amber-800 font-bold">
                      Rs. {displayedRows.reduce((sum, r) => sum + extractRowDiscounts(r).grandTotalDiscount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right pr-2.5 text-emerald-800 font-bold">
                      <div>
                        Rs. {displayedRows.reduce((sum, r) => sum + (Number(r.total_amount || r.return_amount || r.payout_amount_paid || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      {pageAllFreight > 0 && (
                        <div className="text-[9.5px] font-sans font-medium text-slate-600 mt-0.5 leading-tight">
                          (Inc. Freight: Rs. {pageAllFreight.toLocaleString()})
                        </div>
                      )}
                    </td>
                  </tr>
                )}
                {/* 📊 Overall Grand Totals Row */}
                <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                  <td colSpan={4} className="p-2 border border-black text-right uppercase tracking-wider text-gray-900">
                    Grand Total Summary (All {reportRows.length} Records):
                  </td>
                  <td className="p-2 border border-black text-right pr-2 text-amber-900 font-black">
                    Rs. {totalAllDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 border border-black text-right pr-2.5 text-success underline decoration-double font-black">
                    <div>
                      Rs. {reportRows.reduce((sum, r) => sum + (Number(r.total_amount || r.return_amount || r.payout_amount_paid || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    {totalAllFreight > 0 && (
                      <div className="text-[9.5px] font-sans font-medium text-slate-600 no-underline mt-0.5 leading-tight">
                        (Inc. Total Freight: Rs. {totalAllFreight.toLocaleString()})
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
    </>
  );
};
