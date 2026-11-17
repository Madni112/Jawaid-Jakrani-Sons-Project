import React from 'react';
import { MdKeyboardArrowDown, MdKeyboardArrowRight, MdLocalShipping } from 'react-icons/md';
import { QtyBadge } from '../../../../../utils/QtyBadge';
import { getQtyOptionBParts } from '../utils/holdingHelpers';
import type { GatepassSummaryItem } from '../types/holdingTypes';

interface GatepassHoldingAccordionProps {
  gatepassSummary: GatepassSummaryItem[];
  expandedGroupKeys: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
}

export const GatepassHoldingAccordion: React.FC<GatepassHoldingAccordionProps> = ({
  gatepassSummary,
  expandedGroupKeys,
  onToggleGroup
}) => {
  if (gatepassSummary.length === 0) {
    return <div className="py-12 text-center text-slate-400 italic">No gatepass holding records found.</div>;
  }

  return (
    <div className="space-y-3">
      {gatepassSummary.map((g) => {
        const groupKey = `gp-${g.gatepassNo}`;
        const isExpanded = Boolean(expandedGroupKeys[groupKey]);
        const gQtyParts = getQtyOptionBParts(g.totalHeldQty);

        return (
          <div
            key={g.gatepassNo}
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
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center">
                  <MdLocalShipping size={18} />
                </div>
                <div>
                  <h4 className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {g.gatepassNo}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Customer: <strong className="text-slate-700 dark:text-slate-200">{g.customer}</strong> • Salesman:{' '}
                    {g.salesman} • Date: {g.date}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Held Qty</span>
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {gQtyParts.main}
                    </span>
                    <span className="text-[10px] font-sans font-bold text-amber-600/70 dark:text-amber-400/70">
                      {gQtyParts.unit}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Held Value</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    Rs. {Number(g.totalHeldValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="p-3 bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full table-auto border-collapse font-sans text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold text-left text-[10px] uppercase border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2 px-3">Product Description</th>
                      <th className="py-2 px-3">Warehouse</th>
                      <th className="py-2 px-3 text-center">Order Qty</th>
                      <th className="py-2 px-3 text-center">Dispatched Qty</th>
                      <th className="py-2 px-3 text-center">Held Qty</th>
                      <th className="py-2 px-3 text-right">Held Value (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {g.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-white">{item.productName}</td>
                        <td className="py-2 px-3 text-slate-500">{item.warehouse}</td>
                        <td className="py-2 px-3 text-center font-mono">
                          <QtyBadge qty={item.orderQty} uom={item.uom} />
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-400">
                          <QtyBadge qty={item.dispatchedQty} uom={item.uom} />
                        </td>
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
