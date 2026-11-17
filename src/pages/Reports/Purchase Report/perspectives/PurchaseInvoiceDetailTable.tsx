import React from 'react';
import { getVendorDetails } from '../utils/purchaseReportHelpers';

interface PurchaseInvoiceDetailTableProps {
  activeViewMode: 'summary' | 'detailed';
  paginatedRows: any[];
  reportRows: any[];
  startIndex: number;
  vendorLookupMap: Record<string, any>;
}

export const PurchaseInvoiceDetailTable: React.FC<PurchaseInvoiceDetailTableProps> = ({
  activeViewMode,
  paginatedRows,
  reportRows,
  startIndex,
  vendorLookupMap
}) => {
  return (
    activeViewMode === 'summary' ? (
            <div className="w-full overflow-x-auto">
              <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans antialiased text-left print:w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                    <th className="p-1.5 border border-black text-center w-10">S#</th>
                    <th className="p-1.5 border border-black text-center w-24">Date</th>
                    <th className="p-1.5 border border-black w-32 font-mono">Purchase No</th>
                    <th className="p-1.5 border border-black min-w-[150px] max-w-[240px]">Supplier Name</th>
                    <th className="p-1.5 border border-black w-28">Warehouse</th>
                    <th className="p-1.5 border border-black text-center w-24">Items Count</th>
                    <th className="p-1.5 border border-black text-right w-28">Total Units</th>
                    <th className="p-1.5 border border-black text-right pr-3 w-36">Total Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50">
                        No purchase invoices found matching active report parameters.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((inv, idx) => {
                      const matchedVendor = getVendorDetails(inv.supplier_name, vendorLookupMap);
                      const code = inv.vendor_code || matchedVendor?.vendor_code || matchedVendor?.vendorCode || '';
                      const pageNo = inv.page_no || matchedVendor?.page_no || matchedVendor?.pageNo || '';

                      return (
                        <tr key={inv.id || inv.purchase_no} className="border-b border-black font-mono text-xs hover:bg-gray-50">
                          <td className="p-1.5 border border-black text-center text-gray-400">{startIndex + idx + 1}</td>
                          <td className="p-1.5 border border-black text-center text-slate-700">{inv.purchase_date}</td>
                          <td className="p-1.5 border border-black font-bold uppercase text-slate-900">{inv.purchase_no}</td>
                          <td className="p-1.5 border border-black font-sans font-bold text-slate-800">
                            <div>{inv.supplier_name}</div>
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
                          <td className="p-1.5 border border-black font-sans text-slate-600">{inv.warehouse}</td>
                          <td className="p-1.5 border border-black text-center font-bold text-slate-700">{inv.line_items?.length || 0}</td>
                          <td className="p-1.5 border border-black text-right font-bold text-slate-900">{Number(inv.total_units || 0).toLocaleString()}</td>
                          <td className="p-1.5 border border-black text-right pr-3 font-black text-emerald-800">
                            Rs. {Number(inv.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-gray-200 border-t-2 border-black font-black text-xs font-mono">
                  <tr>
                    <td colSpan={6} className="p-2 border border-black text-right uppercase">Total Procurement Spend:</td>
                    <td className="p-2 border border-black text-right">
                      {reportRows.reduce((s, r) => s + Number(r.total_units || 0), 0).toLocaleString()}
                    </td>
                    <td className="p-2 border border-black text-right pr-3 text-emerald-900 font-black">
                      Rs. {reportRows.reduce((s, r) => s + Number(r.total_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {paginatedRows.length === 0 ? (
                <div className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50">
                  No purchase invoices found matching active report parameters.
                </div>
              ) : (
                paginatedRows.map((inv, idx) => {
                  const invKey = inv.id || inv.purchase_no;
                  const matchedVendor = getVendorDetails(inv.supplier_name, vendorLookupMap);
                  const code = inv.vendor_code || matchedVendor?.vendor_code || matchedVendor?.vendorCode || '';
                  const pageNo = inv.page_no || matchedVendor?.page_no || matchedVendor?.pageNo || '';

                  return (
                    <div key={invKey} className="border-2 border-black rounded overflow-hidden shadow-xs print:break-inside-avoid">
                      {/* Invoice Header Banner */}
                      <div className="bg-slate-100 p-2.5 border-b border-black flex justify-between items-center font-mono">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded">
                            #{startIndex + idx + 1}
                          </span>
                          <span className="text-xs font-black uppercase text-slate-900 tracking-wide">
                            {inv.purchase_no}
                          </span>
                          <span className="text-xs font-sans font-bold text-slate-700 flex items-center gap-1.5">
                            • {inv.supplier_name}
                            {(code || pageNo) && (
                              <span className="inline-flex items-center gap-1 font-mono font-normal">
                                {code && (
                                  <span className="bg-white px-1.5 py-0.2 rounded border border-slate-300 text-[9.5px] font-bold text-slate-800 uppercase">
                                    {code}
                                  </span>
                                )}
                                {pageNo && (
                                  <span className="bg-white px-1.5 py-0.2 rounded border border-slate-300 text-[9.5px] font-semibold text-slate-600">
                                    {String(pageNo).toUpperCase().startsWith('P#') ? pageNo : `P# ${pageNo}`}
                                  </span>
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-slate-600 font-sans">Warehouse: <b>{inv.warehouse}</b></span>
                          <span className="text-slate-600">Date: <b>{inv.purchase_date}</b></span>
                          <span className="font-black text-emerald-800 text-sm">Total: Rs. {Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Line Items Table */}
                      <div className="p-3 bg-white">
                        <table className="w-full table-auto border border-collapse border-slate-300 text-[10.5px] font-sans text-left">
                          <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[9.5px] uppercase text-slate-700">
                            <tr>
                              <th rowSpan={2} className="p-1 border border-slate-300 text-center w-10">S#</th>
                              <th rowSpan={2} className="p-1 border border-slate-300">Merchandise Item / SKU Description</th>
                              <th rowSpan={2} className="p-1 border border-slate-300 w-24">Brand</th>
                              <th colSpan={3} className="p-1 border border-slate-300 text-center bg-slate-200">Category Classification</th>
                              <th rowSpan={2} className="p-1 border border-slate-300 text-center w-16">UOM</th>
                              <th rowSpan={2} className="p-1 border border-slate-300 text-right w-20">Inward Qty</th>
                              <th rowSpan={2} className="p-1 border border-slate-300 text-right w-28">Unit Cost (PKR)</th>
                              <th rowSpan={2} className="p-1 border border-slate-300 text-right pr-2 w-36">Line Total (PKR)</th>
                            </tr>
                            <tr className="bg-slate-100 border-b border-slate-300 font-mono text-[8.5px] uppercase text-slate-700">
                              <th className="p-1 border border-slate-300 text-left">Parent</th>
                              <th className="p-1 border border-slate-300 text-left">Sub</th>
                              <th className="p-1 border border-slate-300 text-left">Leaf</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.line_items.map((it: any) => (
                              <tr key={it.sno} className="border-b border-slate-200 hover:bg-slate-50 font-mono">
                                <td className="p-1 border border-slate-300 text-center text-slate-400">{it.sno}</td>
                                <td className="p-1 border border-slate-300 font-sans font-medium text-slate-900">{it.product_name}</td>
                                <td className="p-1 border border-slate-300 font-sans text-slate-600">{it.brand || '-'}</td>
                                <td className="p-1 border border-slate-300 font-sans text-slate-600">{it.parent_category || '-'}</td>
                                <td className="p-1 border border-slate-300 font-sans text-slate-600">{it.sub_category || '-'}</td>
                                <td className="p-1 border border-slate-300 font-sans text-slate-600">{it.category || '-'}</td>
                                <td className="p-1 border border-slate-300 text-center uppercase text-slate-500">{it.uom}</td>
                                <td className="p-1 border border-slate-300 text-right font-bold text-slate-900">{Number(it.qty).toLocaleString()}</td>
                                <td className="p-1 border border-slate-300 text-right text-slate-700">Rs. {Number(it.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="p-1 border border-slate-300 text-right pr-2 font-black text-emerald-800">
                                  <div>Rs. {Number(it.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                  {Number(it.discountAmt || 0) > 0 && (
                                    <div className="text-[9.5px] font-sans font-bold text-amber-800">
                                      Disc: Rs. {Number(it.discountAmt).toLocaleString()} {it.discountPer > 0 ? `(${it.discountPer}%)` : ''}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-50 font-mono font-bold text-xs border-t border-slate-300">
                            <tr>
                              <td colSpan={7} className="p-1.5 border border-slate-300 text-right uppercase text-slate-700">
                                Bill Subtotal ({inv.line_items.length} Items):
                              </td>
                              <td className="p-1.5 border border-slate-300 text-right text-slate-900 font-black">
                                {inv.total_units.toLocaleString()}
                              </td>
                              <td className="p-1.5 border border-slate-300"></td>
                              <td className="p-1.5 border border-slate-300 text-right pr-2 font-black text-emerald-800">
                                Rs. {Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )
  );
};

export default PurchaseInvoiceDetailTable;
