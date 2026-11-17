import React from 'react';
import { MdKeyboardArrowDown, MdKeyboardArrowRight, MdPeople } from 'react-icons/md';
import { QtyBadge } from '../../../../../utils/QtyBadge';
import { getQtyOptionBParts } from '../utils/holdingHelpers';
import type { CustomerSummaryItem } from '../types/holdingTypes';

interface CustomerHoldingAccordionProps {
  customerSummary: CustomerSummaryItem[];
  expandedGroupKeys: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
}

export const CustomerHoldingAccordion: React.FC<CustomerHoldingAccordionProps> = ({
  customerSummary,
  expandedGroupKeys,
  onToggleGroup
}) => {
  if (customerSummary.length === 0) {
    return <div className="py-12 text-center text-slate-400 italic">No customer holding items found.</div>;
  }

  return (
    <div className="space-y-3">
      {customerSummary.map((c) => {
        const groupKey = `cust-${c.customer}`;
        const isExpanded = Boolean(expandedGroupKeys[groupKey]);
        const cQtyParts = getQtyOptionBParts(c.totalHeldQty);

        return (
          <div
            key={c.customer}
            className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
          >
            <div
              onClick={() => onToggleGroup(groupKey)}
              className="p-4 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-wrap items-center justify-between gap-4 cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  {isExpanded ? <MdKeyboardArrowDown size={20} /> : <MdKeyboardArrowRight size={20} />}
                </span>
                <div className="w-8 h-8 rounded-lg bg-teal-600/10 text-teal-600 font-bold flex items-center justify-center">
                  <MdPeople size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{c.customer}</h4>
                  <span className="text-[11px] text-slate-400">
                    {c.gpCount} Gatepasses • {c.invCount} Invoices • {c.itemsCount} Held Line Items
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Total Held Qty</span>
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {cQtyParts.main}
                    </span>
                    <span className="text-[10px] font-sans font-bold text-amber-600/70 dark:text-amber-400/70">
                      {cQtyParts.unit}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Total Holding Value</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    Rs. {Number(c.totalHeldValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="p-3 bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full table-auto border-collapse font-sans text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold text-left text-[10px] uppercase border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2 px-3">Gatepass</th>
                      <th className="py-2 px-3">Invoice #</th>
                      <th className="py-2 px-3">Salesman</th>
                      <th className="py-2 px-3">Product Description</th>
                      <th className="py-2 px-3 text-center">Held Qty</th>
                      <th className="py-2 px-3 text-right">Held Value (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {c.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-mono font-bold text-emerald-600">{item.gatepassNo}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">{item.invoiceNo}</td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{item.salesman}</td>
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-white">{item.productName}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-amber-600">
                          <QtyBadge qty={item.holdQty} uom={item.uom} />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                          Rs. {Number(item.heldAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
