import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineReceipt, MdPerson, MdWarning, MdCheckCircle } from 'react-icons/md';

interface ReceivablesAndStockSectionProps {
  receivablesList: any[];
  lowStockProducts: any[];
}

export const ReceivablesAndStockSection: React.FC<ReceivablesAndStockSectionProps> = ({
  receivablesList,
  lowStockProducts,
}) => {
  const navigate = useNavigate();

  return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WIDGET 1: CUSTOMER RECEIVABLES AGING LEDGER (7 COLS) */}
        <div className="lg:col-span-7 relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs hover:shadow-xs p-5 flex flex-col justify-between overflow-hidden transition-all duration-200 group">
          {/* Linear Indigo Accent Notch */}
          <span className="absolute left-0 top-3.5 bottom-3.5 w-1.25 rounded-r-full bg-indigo-500 shadow-xs transition-all duration-200 group-hover:w-2" />

          <div>
            <div className="flex justify-between items-center mb-3.5 border-b border-slate-100 dark:border-slate-800/80 pb-3 pl-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <MdOutlineReceipt size={18} />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Customer Receivables
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    Last 10 outstanding sales invoices with real-time aging status
                  </p>
                </div>
              </div>
              <span className="text-[10.5px] px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold font-mono border border-indigo-200/70 dark:border-indigo-800/60 shrink-0">
                {receivablesList.length} Invoices Due
              </span>
            </div>

            {/* Table Container with Exactly 5 Visible Rows Height + Scrollbar */}
            <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-800 max-h-[295px] overflow-y-auto pr-1">
              <table className="w-full table-auto border-collapse font-sans text-xs">
                <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-800/90 backdrop-blur-xs z-10 shadow-2xs">
                  <tr className="text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-700/80 text-left text-[10.5px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Inv No.</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Salesman</th>
                    <th className="py-2.5 px-3">Date & Aging</th>
                    <th className="py-2.5 px-3 text-right">Outstanding (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {receivablesList.length > 0 ? (
                    receivablesList.map((rec) => {
                      // Linear Aging Badges
                      let badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
                      if (rec.daysPending > 30) {
                        badgeClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60';
                      } else if (rec.daysPending > 7) {
                        badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60';
                      } else if (rec.daysPending === 0) {
                        badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60';
                      }

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 duration-150 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {rec.invoiceNo}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100 max-w-[140px] truncate" title={rec.customerName}>
                            {rec.customerName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-[100px] truncate" title={rec.salesman}>
                            <span className="inline-flex items-center gap-1 font-medium">
                              <MdPerson size={13} className="text-slate-400" />
                              {rec.salesman}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-[10px] text-slate-400">{rec.invoiceDate}</span>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-tight ${badgeClass}`}>
                                {rec.daysPending === 0 ? 'Today' : `${rec.daysPending} Days Old`}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-rose-600 dark:text-rose-400 text-xs">
                            Rs. {rec.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                        No outstanding customer invoices found. All receivables cleared! 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-[11px] text-slate-400 pl-2.5 mt-2">
            <span>Scroll table to see full last 10 entries</span>
            <button
              onClick={() => navigate('/Accounts/Ledgers?tab=customer-ledger')}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Open Receivables Ledger</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* WIDGET 2: LOW STOCK LIMIT ALERTS (5 COLS) */}
        <div className="lg:col-span-5 relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs hover:shadow-xs p-5 flex flex-col justify-between overflow-hidden transition-all duration-200 group">
          {/* Linear Rose Accent Notch */}
          <span className="absolute left-0 top-3.5 bottom-3.5 w-1.25 rounded-r-full bg-rose-500 shadow-xs transition-all duration-200 group-hover:w-2" />

          <div>
            <div className="flex justify-between items-center mb-3.5 border-b border-slate-100 dark:border-slate-800/80 pb-3 pl-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/60 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <MdWarning size={18} />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Low Stock Limit Alerts
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    Products at or below minimum threshold
                  </p>
                </div>
              </div>
              <span className={`text-[10.5px] px-2.5 py-1 rounded-full font-bold font-mono border shrink-0 ${
                lowStockProducts.length > 0
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60'
              }`}>
                {lowStockProducts.length > 0 ? `${lowStockProducts.length} Items Critical` : 'Stock Healthy 🛡️'}
              </span>
            </div>

            {/* List with Up to 10 Low Stock Items */}
            <div className="space-y-2 max-h-[295px] overflow-y-auto pr-1">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 flex justify-between items-center gap-2.5 duration-150 group/item transition-all"
                  >
                    <div className="min-w-0 flex-1 pl-1">
                      <div className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate group-hover/item:text-rose-600 dark:group-hover/item:text-rose-400 transition-colors" title={p.name}>
                        {p.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-100/80 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50">
                          Avail: {p.currentStock} {p.unit}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-slate-400">Min Req: {p.minLimit} {p.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono font-bold text-[10.5px] shadow-2xs">
                        -{p.deficit} {p.unit}
                      </span>
                      <button
                        onClick={() => navigate('/Purchase/Purchases/Add')}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[10.5px] font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition shadow-2xs cursor-pointer"
                        title="Create Purchase Order"
                      >
                        + Reorder
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center gap-2">
                  <MdCheckCircle size={32} />
                  <span className="font-bold text-xs">All Products are above Minimum Stock Limits</span>
                  <span className="text-[11px] text-slate-400">Inventory levels are currently optimal.</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-right mt-2">
            <button
              onClick={() => {
                navigate('/Reports/Reports-Dashboard?category=inventory', { state: { category: 'inventory' } });
              }}
              className="text-rose-600 dark:text-rose-400 font-bold hover:underline text-[11px] inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Open Inventory Audit Matrix</span>
              <span>→</span>
            </button>
          </div>
        </div>

      </div>

  );
};

export default ReceivablesAndStockSection;
