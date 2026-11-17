import React from 'react';

interface LoyaltyReportTableProps {
  displayedRows: any[];
  isPrinting: boolean;
  pageSize: number | 'all';
  currentPage: number;
  reportRows: any[];
  resolveCustomerMeta: (custName?: string) => { code: string; pageNo: string };
}

export const LoyaltyReportTable: React.FC<LoyaltyReportTableProps> = ({
  displayedRows,
  isPrinting,
  pageSize,
  currentPage,
  reportRows,
  resolveCustomerMeta,
}) => {
  return (
    <>
      <div className="space-y-6">
              {displayedRows.length === 0 ? (
                <div className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">
                  No customer financial invoice transactions discovered matching chosen selection criteria.
                </div>
              ) : (
                displayedRows.map((cust: any, cIdx: number) => {
                  const realCustNum = isPrinting || pageSize === 'all' ? cIdx + 1 : (currentPage - 1) * (pageSize as number) + cIdx + 1;
                  const custTotalBilled = Number(cust.total_billed || 0);
                  const custTotalPaid = Number(cust.total_paid || 0);
                  const custNetDue = Number(cust.net_balance || 0);

                  return (
                    <div key={cIdx} className="border border-black rounded-xs overflow-hidden shadow-xs">
                      {/* 👤 Customer Header Banner */}
                      <div className="bg-slate-800 text-white p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-emerald-500 text-black px-2 py-0.5 rounded font-black text-[10px]">#{realCustNum}</span>
                          <span className="font-bold font-sans text-sm tracking-wide uppercase text-white">{cust.customer_name}</span>
                          {(() => {
                            const meta = resolveCustomerMeta(cust.customer_name);
                            const code = cust.customer_code || cust.customerCode || meta.code || '';
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
                        </div>
                        <div className="text-right text-[11px] font-black font-mono flex items-center gap-3">
                          <span className="text-indigo-300">Billed: Rs. {custTotalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-slate-500">|</span>
                          <span className="text-emerald-400">Paid: Rs. {custTotalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-slate-500">|</span>
                          <span className={`font-extrabold underline decoration-double ${custNetDue > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                            Balance: Rs. {custNetDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Customer Transactions Sub-table */}
                      <table className="w-full table-auto border-collapse text-[11px] font-sans text-left">
                        <thead>
                          <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[9.5px]">
                            <th className="p-1.5 border border-black text-center w-10">S#</th>
                            <th className="p-1.5 border border-black text-center w-24">Date</th>
                            <th className="p-1.5 border border-black w-32">Invoice Ref #</th>
                            <th className="p-1.5 border border-black">Sales Officer</th>
                            <th className="p-1.5 border border-black">Narration / Particulars</th>
                            <th className="p-1.5 border border-black text-right w-28 text-indigo-900">Billed / Dr (PKR)</th>
                            <th className="p-1.5 border border-black text-right w-28 text-emerald-800">Paid / Cr (PKR)</th>
                            <th className="p-1.5 border border-black text-right w-28 pr-3">Balance Dues (PKR)</th>
                            <th className="p-1.5 border border-black text-center w-20">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(cust.transactions || []).map((tx: any, tIdx: number) => (
                            <tr key={tIdx} className="border-b border-gray-300 hover:bg-gray-50 font-mono text-xs">
                              <td className="p-1.5 border border-black text-center text-gray-500">{tIdx + 1}</td>
                              <td className="p-1.5 border border-black text-center text-gray-700">{tx.date}</td>
                              <td className="p-1.5 border border-black font-black text-primary uppercase">{tx.invoice_no}</td>
                              <td className="p-1.5 border border-black font-sans text-gray-600">{tx.salesman}</td>
                              <td className="p-1.5 border border-black font-sans text-gray-700">{tx.narration}</td>
                              <td className="p-1.5 border border-black text-right font-bold text-gray-900">
                                Rs. {Number(tx.billed_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-1.5 border border-black text-right text-emerald-700 font-bold">
                                Rs. {Number(tx.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-1.5 border border-black text-right pr-3 font-black text-slate-900">
                                Rs. {Number(tx.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-1.5 border border-black text-center font-sans">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${tx.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                    tx.status === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 border-t border-black font-black font-mono text-xs">
                            <td colSpan={5} className="p-1.5 border border-black text-right uppercase tracking-wider text-gray-600">
                              Subtotal ({cust.customer_name}):
                            </td>
                            <td className="p-1.5 border border-black text-right text-indigo-900 font-black">
                              Rs. {custTotalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-1.5 border border-black text-right text-emerald-800 font-black">
                              Rs. {custTotalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td colSpan={2} className="p-1.5 border border-black text-right pr-3 text-purple-900 font-black">
                              Rs. {custNetDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                        <span className="text-indigo-900 font-bold">Billed: Rs. {displayedRows.reduce((s: number, c: any) => s + Number(c.total_billed || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="text-emerald-800 font-bold">Paid: Rs. {displayedRows.reduce((s: number, c: any) => s + Number(c.total_paid || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="text-purple-900 font-black">Page Balance: Rs. {displayedRows.reduce((s: number, c: any) => s + Number(c.net_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-100 p-3.5 rounded border-2 border-black flex justify-between items-center font-mono font-black text-xs">
                    <span className="uppercase text-gray-900">
                      Grand Total Ledger Statement (All {reportRows.length} Customers):
                    </span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-indigo-950 font-black">Total Billed: Rs. {reportRows.reduce((s: number, c: any) => s + Number(c.total_billed || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-emerald-800 font-black">Total Paid: Rs. {reportRows.reduce((s: number, c: any) => s + Number(c.total_paid || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-purple-800 text-sm underline decoration-double">
                        Grand Net Dues: Rs. {reportRows.reduce((s: number, c: any) => s + Number(c.net_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
    </>
  );
};
