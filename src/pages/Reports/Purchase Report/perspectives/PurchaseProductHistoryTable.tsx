import React from 'react';
import { getVendorDetails } from '../utils/purchaseReportHelpers';

interface PurchaseProductHistoryTableProps {
  activeViewMode: 'summary' | 'detailed';
  paginatedRows: any[];
  reportRows: any[];
  startIndex: number;
  expandedRowKeys: Set<string | number>;
  vendorLookupMap: Record<string, any>;
}

export const PurchaseProductHistoryTable: React.FC<PurchaseProductHistoryTableProps> = ({
  activeViewMode,
  paginatedRows,
  reportRows,
  startIndex,
  expandedRowKeys,
  vendorLookupMap
}) => {
  return (
    <div className="w-full space-y-4">
            <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
              <thead className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                <tr>
                  <th rowSpan={2} className="p-1.5 border border-black text-center w-12">S#</th>
                  <th rowSpan={2} className="p-1.5 border border-black">Target Product Description / SKU</th>
                  <th rowSpan={2} className="p-1.5 border border-black w-24">Brand</th>
                  <th colSpan={3} className="p-1 border border-black text-center bg-gray-200">Category Classification</th>
                  <th rowSpan={2} className="p-1.5 border border-black text-center w-16">UOM</th>
                  <th rowSpan={2} className="p-1.5 border border-black text-right w-24">Inward Qty</th>
                  <th rowSpan={2} className="p-1.5 border border-black text-right w-28">Min Rate (PKR)</th>
                  <th rowSpan={2} className="p-1.5 border border-black text-right w-28">Max Rate (PKR)</th>
                  <th rowSpan={2} className="p-1.5 border border-black text-right w-28">Avg Rate (PKR)</th>
                  <th rowSpan={2} className="p-1.5 border border-black text-right pr-3 w-36">Total Spend (PKR)</th>
                </tr>
                <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[9px]">
                  <th className="p-1 border border-black text-left">Parent</th>
                  <th className="p-1 border border-black text-left">Sub</th>
                  <th className="p-1 border border-black text-left">Leaf</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50">
                      No product purchase history records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((prod, idx) => {
                    const isExpanded = activeViewMode === 'detailed' || expandedRowKeys.has(prod.product_name);

                    return (
                      <React.Fragment key={prod.product_name || idx}>
                        <tr className={`border-b border-black font-mono text-xs ${isExpanded ? 'bg-slate-100 font-bold' : 'hover:bg-gray-50'}`}>
                          <td className="p-1.5 border border-black text-center text-gray-400">{startIndex + idx + 1}</td>
                          <td className="p-1.5 border border-black font-sans uppercase font-bold text-slate-900">
                            {prod.product_name}
                            {prod.sku && prod.sku !== '-' && <span className="ml-2 text-[10px] text-slate-500 font-mono">[{prod.sku}]</span>}
                          </td>
                          <td className="p-1.5 border border-black font-sans text-slate-600">{prod.brand || '-'}</td>
                          <td className="p-1.5 border border-black font-sans text-slate-700">{prod.parent_category || '-'}</td>
                          <td className="p-1.5 border border-black font-sans text-slate-700">{prod.sub_category || '-'}</td>
                          <td className="p-1.5 border border-black font-sans text-slate-700">{prod.category || '-'}</td>
                          <td className="p-1.5 border border-black text-center uppercase text-slate-500">{prod.uom}</td>
                          <td className="p-1.5 border border-black text-right font-bold text-slate-900">{Number(prod.total_purchased_qty).toLocaleString()}</td>
                          <td className="p-1.5 border border-black text-right text-slate-700">Rs. {Number(prod.min_unit_rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-1.5 border border-black text-right text-slate-700">Rs. {Number(prod.max_unit_rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-1.5 border border-black text-right font-bold text-slate-800">Rs. {Number(prod.avg_unit_rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-1.5 border border-black text-right pr-3 font-black text-emerald-800">Rs. {Number(prod.total_procurement_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>

                        {/* Expandable batch transaction history */}
                        {isExpanded && (
                          <tr className="bg-slate-50 border-b-2 border-black">
                            <td colSpan={12} className="p-3 border border-black">
                              <div className="text-[11px] font-black uppercase text-slate-800 mb-2 font-mono flex justify-between">
                                <span>Batch Inward Procurement Audit for {prod.product_name}</span>
                                <span>{prod.transactions.length} Inward Batch(es) Logged</span>
                              </div>

                              <table className="w-full table-auto border border-collapse border-slate-300 text-[10px] font-sans text-left bg-white">
                                <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[9.5px] uppercase text-slate-700">
                                  <tr>
                                    <th className="p-1 border border-slate-300 text-center w-10">S#</th>
                                    <th className="p-1 border border-slate-300 w-24 text-center">Date</th>
                                    <th className="p-1 border border-slate-300 w-28">Purchase No</th>
                                    <th className="p-1 border border-slate-300 min-w-[130px] max-w-[200px]">Supplier Name</th>
                                    <th className="p-1 border border-slate-300 w-32">Warehouse</th>
                                    <th className="p-1 border border-slate-300 text-right w-20">Batch Qty</th>
                                    <th className="p-1 border border-slate-300 text-right w-24">Unit Rate</th>
                                    <th className="p-1 border border-slate-300 text-right pr-2 w-32">Total Value</th>
                                    <th className="p-1 border border-slate-300 text-center w-20">Payment Term</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {prod.transactions.map((tx: any, tIdx: number) => {
                                    const matchedVendor = getVendorDetails(tx.supplier_name, vendorLookupMap);
                                    const code = tx.vendor_code || matchedVendor?.vendor_code || matchedVendor?.vendorCode || '';
                                    const pageNo = tx.page_no || matchedVendor?.page_no || matchedVendor?.pageNo || '';

                                    return (
                                      <tr key={tIdx} className="border-b border-slate-200 hover:bg-slate-50 font-mono">
                                        <td className="p-1 border border-slate-300 text-center text-slate-400">{tIdx + 1}</td>
                                        <td className="p-1 border border-slate-300 text-center text-slate-600">{tx.date}</td>
                                        <td className="p-1 border border-slate-300 font-bold text-primary">{tx.purchase_no}</td>
                                        <td className="p-1 border border-slate-300 font-sans font-semibold text-slate-800">
                                          <div>{tx.supplier_name}</div>
                                          {(code || pageNo) && (
                                            <div className="text-[9.5px] font-mono text-slate-700 flex flex-wrap items-center gap-1 mt-0.5 font-normal">
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
                                          )}
                                        </td>
                                        <td className="p-1 border border-slate-300 font-sans text-slate-600">{tx.warehouse}</td>
                                        <td className="p-1 border border-slate-300 text-right font-bold text-slate-900">{tx.qty.toLocaleString()} {tx.uom}</td>
                                        <td className="p-1 border border-slate-300 text-right font-semibold text-slate-700">Rs. {Number(tx.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="p-1 border border-slate-300 text-right pr-2 font-black text-emerald-800">Rs. {Number(tx.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="p-1 border border-slate-300 text-center uppercase text-[9px] font-bold text-slate-600">{tx.payment_term}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                  <td colSpan={7} className="p-2 border border-black text-right uppercase">
                    Grand Total ({reportRows.length} Products):
                  </td>
                  <td className="p-2 border border-black text-right font-black">
                    {reportRows.reduce((s, r) => s + Number(r.total_purchased_qty || 0), 0).toLocaleString()}
                  </td>
                  <td colSpan={3} className="p-2 border border-black"></td>
                  <td className="p-2 border border-black text-right pr-3 text-emerald-800 underline decoration-double font-black text-sm">
                    Rs. {reportRows.reduce((s, r) => s + Number(r.total_procurement_cost || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 border border-black print-hidden-element print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>
  );
};

export default PurchaseProductHistoryTable;
