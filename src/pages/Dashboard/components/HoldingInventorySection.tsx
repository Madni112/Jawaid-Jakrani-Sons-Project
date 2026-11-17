import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdLocalFireDepartment, MdPauseCircleFilled } from 'react-icons/md';
import { QtyBadge } from '../../../utils/QtyBadge';

interface HoldingInventorySectionProps {
  holdingTab: 'warehouse' | 'invoice';
  setHoldingTab: (tab: 'warehouse' | 'invoice') => void;
  selectedWarehouseGuy: string;
  setSelectedWarehouseGuy: (id: string) => void;
  warehouseGuysList: { id: string; name: string }[];
  selectedHoldingInvoice: string;
  setSelectedHoldingInvoice: (id: string) => void;
  holdingInvoicesList: { invoiceNo: string; customerName: string }[];
  filteredHoldingItems: any[];
  trendingProducts: any[];
}

export const HoldingInventorySection: React.FC<HoldingInventorySectionProps> = ({
  holdingTab,
  setHoldingTab,
  selectedWarehouseGuy,
  setSelectedWarehouseGuy,
  warehouseGuysList,
  selectedHoldingInvoice,
  setSelectedHoldingInvoice,
  holdingInvoicesList,
  filteredHoldingItems,
  trendingProducts,
}) => {
  const navigate = useNavigate();

  return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WIDGET 3: INTERACTIVE HOLDING INVENTORY (7 COLS) */}
        <div className="lg:col-span-7 relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs hover:shadow-xs p-5 flex flex-col justify-between overflow-hidden transition-all duration-200 group">
          {/* Linear Amber Accent Notch */}
          <span className="absolute left-0 top-3.5 bottom-3.5 w-1.25 rounded-r-full bg-amber-500 shadow-xs transition-all duration-200 group-hover:w-2" />

          <div>
            {/* Header with Dual Tabs and Dropdown Filters */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3.5 border-b border-slate-100 dark:border-slate-800/80 pb-3 pl-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <MdPauseCircleFilled size={18} />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Holding Inventory Center
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    Committed orders held at warehouse pending customer pickup
                  </p>
                </div>
              </div>

              {/* Mode Tabs & Selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
                  <button
                    onClick={() => setHoldingTab('warehouse')}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${holdingTab === 'warehouse'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
                      }`}
                  >
                    Warehouse In-Charge
                  </button>
                  <button
                    onClick={() => setHoldingTab('invoice')}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${holdingTab === 'invoice'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
                      }`}
                  >
                    Invoice-Wise
                  </button>
                </div>

                {/* Dropdown Selector based on Active Tab */}
                {holdingTab === 'warehouse' ? (
                  <select
                    value={selectedWarehouseGuy}
                    onChange={(e) => setSelectedWarehouseGuy(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none max-w-[150px] truncate shadow-2xs cursor-pointer focus:ring-1 focus:ring-amber-500"
                  >
                    {warehouseGuysList.map(guy => (
                      <option key={guy} value={guy}>{guy === 'All' ? 'All Warehouse Staff' : guy}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedHoldingInvoice}
                    onChange={(e) => setSelectedHoldingInvoice(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none max-w-[150px] truncate shadow-2xs cursor-pointer focus:ring-1 focus:ring-amber-500"
                  >
                    {holdingInvoicesList.map(inv => (
                      <option key={inv} value={inv}>{inv === 'All' ? 'All Invoices' : inv}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Holding Items Table */}
            <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-800 max-h-[295px] overflow-y-auto pr-1">
              <table className="w-full table-auto border-collapse font-sans text-xs">
                <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-800/90 backdrop-blur-xs z-10 shadow-2xs">
                  <tr className="text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-700/80 text-left text-[10.5px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Item / SKU</th>
                    <th className="py-2.5 px-3">{holdingTab === 'warehouse' ? 'Gatepass (DC)' : 'Invoice #'}</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3 text-center">Held Qty</th>
                    <th className="py-2.5 px-3 text-right">Held Value (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredHoldingItems.length > 0 ? (
                    filteredHoldingItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 duration-150 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100 max-w-[150px] truncate" title={item.productName}>
                          {item.productName}
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal font-mono mt-0.5">
                            {holdingTab === 'warehouse' ? `Staff: ${item.warehouseGuy}` : `Salesman: ${item.salesman}`}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                          {holdingTab === 'warehouse' ? item.gatepassNo : item.invoiceNo}
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{item.date}</div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate" title={item.customerName}>
                          {item.customerName}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <QtyBadge qty={item.holdQty} />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                          Rs. {item.heldAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                        No active holding items matching your selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-[11px] mt-2">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Showing {filteredHoldingItems.length} active committed holding items</span>
            <button
              onClick={() => navigate('/Reports/Holding-Report')}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Open Full Holding Report</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* WIDGET 4: TOP TRENDING PRODUCTS (5 COLS) */}
        <div className="lg:col-span-5 relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs hover:shadow-xs p-5 flex flex-col justify-between overflow-hidden transition-all duration-200 group">
          {/* Linear Orange Accent Notch */}
          <span className="absolute left-0 top-3.5 bottom-3.5 w-1.25 rounded-r-full bg-orange-500 shadow-xs transition-all duration-200 group-hover:w-2" />

          <div>
            <div className="flex justify-between items-center mb-3.5 border-b border-slate-100 dark:border-slate-800/80 pb-3 pl-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 border border-orange-200/70 dark:border-orange-800/60 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <MdLocalFireDepartment size={18} />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Top Trending Products
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    Ranked by revenue velocity & order frequency
                  </p>
                </div>
              </div>
              <span className="text-[10.5px] px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-bold font-mono border border-orange-200/70 dark:border-orange-800/60 shrink-0">
                Top Demand 🔥
              </span>
            </div>

            {/* List with 5 visible rows + scroll */}
            <div className="space-y-2.5 max-h-[295px] overflow-y-auto pr-1">
              {trendingProducts.length > 0 ? (
                trendingProducts.map((p, idx) => (
                  <div
                    key={p.name}
                    className="p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 flex items-center gap-3 transition-all duration-150 group/item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="font-mono text-slate-500 dark:text-slate-400">#{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs group-hover/item:text-orange-600 dark:group-hover/item:text-orange-400 transition-colors" title={p.name}>
                          {p.name}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs shrink-0 ml-2">
                          Rs. {(p.totalRevenue / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mb-1.5 font-medium">
                        <span className="truncate mr-2">{p.category}</span>
                        <span className="shrink-0">{p.unitsSold.toLocaleString()} units sold ({p.transactionCount} bills)</span>
                      </div>
                      {/* Mini visual velocity bar */}
                      <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                          style={{ width: `${Math.max(8, p.percentageOfTotal)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 italic">
                  No sales invoice items recorded yet.
                </div>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-right mt-2">
            <button
              onClick={() => navigate('/Reports/Sales-Report')}
              className="text-orange-600 dark:text-orange-400 font-bold hover:underline text-[11px] inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Product Sales Analytics</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

  );
};

export default HoldingInventorySection;
