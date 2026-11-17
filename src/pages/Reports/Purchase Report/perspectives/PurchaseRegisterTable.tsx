import React from 'react';
import {
  parseItems,
  getVendorDetails,
  getRowDiscounts,
  formatItemLineQty,
  getConsignmentQtyBreakdown
} from '../utils/purchaseReportHelpers';

interface PurchaseRegisterTableProps {
  rType: string;
  paginatedRows: any[];
  reportRows: any[];
  startIndex: number;
  currentPage: number;
  pageSize: number | 'all';
  isPrinting: boolean;
  productLookupMap: Record<string, any>;
  vendorLookupMap: Record<string, any>;
}

export const PurchaseRegisterTable: React.FC<PurchaseRegisterTableProps> = ({
  rType,
  paginatedRows,
  reportRows,
  startIndex,
  currentPage,
  pageSize,
  isPrinting,
  productLookupMap,
  vendorLookupMap
}) => {
  return (
    <div className="w-full overflow-x-auto">
            <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans antialiased text-left print:w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                  <th className="p-1.5 border border-black text-center w-10">S#</th>
                  <th className="p-1.5 border border-black text-center w-24">Date</th>
                  <th className="p-1.5 border border-black w-24">{rType === 'return' ? 'Return No' : 'Purchase No'}</th>
                  <th className="p-1.5 border border-black w-[18%] min-w-[140px] max-w-[220px]">Supplier Name</th>
                  <th className="p-1.5 border border-black">{rType === 'return' ? 'Returned Merchandise / Line Items' : 'Purchased Product Details / Line Items'}</th>
                  <th className="p-1.5 border border-black text-right w-24">Total Qty</th>
                  <th className="p-1.5 border border-black text-right w-24 pr-2">Discount</th>
                  <th className="p-1.5 border border-black text-center w-24">{rType === 'return' ? 'Adjustment Term' : 'Payment Term'}</th>
                  <th className="p-1.5 border border-black text-right pr-3 w-36">{rType === 'return' ? 'Debit Amount' : 'Net Amount'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                      No rows matching active report criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    const displayDocRef = row.purchase_no || row.return_no || `ID: ${row.id}`;
                    const displayAccountTitle = row.supplier_name || row.vendor_name || 'Generic Wholesaler';
                    const displayProcessingDate = String(row.purchase_date || row.return_date || row.created_at || '').split('T')[0];
                    const items = parseItems(row.items || row.returned_items);
                    const matchedVendor = getVendorDetails(displayAccountTitle, vendorLookupMap);
                    const code = row.vendor_code || row.supplier_code || matchedVendor?.vendor_code || matchedVendor?.vendorCode || '';
                    const pageNo = row.page_no || row.pageNo || matchedVendor?.page_no || matchedVendor?.pageNo || '';
                    const rowDiscounts = getRowDiscounts(row, items);
                    const freight = Number(row.additional_charges || row.freight_charges || row.transport_charges || 0);

                    return (
                      <tr key={row.id || idx} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs">
                        <td className="p-1.5 border border-black text-center text-gray-400 align-top">{startIndex + idx + 1}</td>
                        <td className="p-1.5 border border-black text-center text-gray-600 whitespace-nowrap text-[10.5px] align-top">{displayProcessingDate}</td>
                        <td className="p-1.5 border border-black text-primary font-black uppercase whitespace-nowrap align-top">{displayDocRef}</td>
                        <td className="p-1.5 border border-black text-black font-sans font-bold align-top">
                          <div>{displayAccountTitle}</div>
                          {(code || pageNo) && (
                            <div className="text-[10px] font-mono text-slate-700 flex flex-wrap items-center gap-1 mt-0.5 font-normal">
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
                        <td className="p-1.5 border border-black font-sans align-top">
                          {items.length === 0 ? (
                            <span className="text-gray-400 italic text-[10px]">No line items recorded</span>
                          ) : (
                            <div className="space-y-1">
                              {items.map((it: any, iIdx: number) => {
                                const pName = (it.itemName || it.product_name || it.name || `Item ${iIdx + 1}`).trim();
                                const qtyFormatted = formatItemLineQty(pName, Number(it.qty || it.quantity || 1), productLookupMap, it.uom);
                                const rate = Number(it.purchase_price ?? it.cost_price ?? it.unit_price ?? it.rate ?? it.price ?? 0);
                                const itemWh = it.warehouse || it.target_warehouse || row.target_warehouse;
                                const grossLine = Number(it.qty || it.quantity || 1) * rate;
                                const dPer = Number(it.discountPer ?? it.discount_per ?? 0);
                                const dAmt = Number(it.discountAmt ?? it.discount_amt ?? (dPer > 0 ? (grossLine * dPer) / 100 : 0));

                                return (
                                  <div
                                    key={iIdx}
                                    className="flex items-center justify-between gap-3 text-[10.5px] border-b border-slate-100 last:border-0 pb-0.5 last:pb-0 font-mono"
                                  >
                                    <span className="font-sans font-semibold text-slate-900 truncate flex items-center gap-1">
                                      {pName}
                                      {itemWh && (
                                        <span className="ml-1 text-[9.5px] text-teal-800 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                          [{itemWh}]
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-slate-700 whitespace-nowrap text-[10px] font-bold flex items-center gap-1.5">
                                      <span>{qtyFormatted}</span>
                                      {rate > 0 && <span className="text-slate-400 font-medium">× Rs. {rate.toLocaleString()}</span>}
                                      {rate > 0 && <span className="text-slate-900 font-bold">= Rs. {grossLine.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>}
                                      {dAmt > 0 && (
                                        <span className="text-amber-800 font-bold bg-amber-50 px-1 rounded border border-amber-200 text-[9.5px]">
                                          Disc: Rs. {dAmt.toLocaleString()} {dPer > 0 ? `(${dPer}%)` : ''}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="p-1.5 border border-black text-right font-black font-mono text-slate-900 whitespace-nowrap text-[11px] align-top">
                          <div className="flex flex-col items-end space-y-0.5">
                            {getConsignmentQtyBreakdown(items, productLookupMap).map((qLine, qIdx) => (
                              <span key={qIdx} className="leading-tight">
                                {qLine}
                              </span>
                            ))}
                          </div>
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
                        <td className="p-2 border border-black text-center uppercase text-[10px] font-black whitespace-nowrap align-top">{row.payment_term || 'Settled'}</td>
                        <td className="p-1.5 border border-black text-right pr-3 text-success font-black whitespace-nowrap align-top">
                          <div>
                            Rs. {Number(row.total_amount || row.return_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
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
                {!isPrinting && pageSize !== 'all' && (
                  <tr className="bg-amber-50/80 border-t border-black font-bold font-mono text-xs text-amber-950">
                    <td colSpan={8} className="p-2 border border-black text-right uppercase tracking-wider text-amber-900">
                      Page {currentPage} Subtotal ({paginatedRows.length} records):
                    </td>
                    <td className="p-2 border border-black text-right pr-3 text-emerald-800 font-bold whitespace-nowrap">
                      Rs. {paginatedRows.reduce((sum, r) => sum + Number(r.total_amount || r.return_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                  <td colSpan={8} className="p-2 border border-black text-right uppercase tracking-wider text-gray-900">
                    Grand Total Summary (All {reportRows.length} Records):
                  </td>
                  <td className="p-2 border border-black text-right pr-3 text-success underline decoration-double text-sm whitespace-nowrap">
                    Rs. {reportRows.reduce((sum, r) => sum + Number(r.total_amount || r.return_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
  );
};

export default PurchaseRegisterTable;
