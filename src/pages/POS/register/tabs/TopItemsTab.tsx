import React from 'react';
import { LuTrendingUp } from 'react-icons/lu';

interface TopItemsTabProps {
  topProductsStats: Array<{
    id: string | number;
    name: string;
    code: string;
    category: string;
    quantity: number;
    unitPrice: number;
    revenue: number;
    share: string | number;
  }>;
}

export const TopItemsTab: React.FC<TopItemsTabProps> = ({ topProductsStats }) => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <LuTrendingUp className="text-emerald-500" />
            <span>Top Fast-Moving Boutique Items</span>
          </h3>
          <span className="text-xs text-slate-400">Ranked by volume & revenue</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Article / Product Name</th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Suits Sold</th>
                <th className="py-3 px-4">Retail Price</th>
                <th className="py-3 px-4">Total Revenue</th>
                <th className="py-3 px-4 text-right">Revenue Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {topProductsStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No product sales recorded in this period.
                  </td>
                </tr>
              ) : (
                topProductsStats.map((p, i) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold font-mono">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs ${
                        i === 0 ? 'bg-amber-500 text-white font-black' : i === 1 ? 'bg-slate-300 text-slate-800 font-bold' : i === 2 ? 'bg-amber-700 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.code}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {p.quantity} Suits
                    </td>
                    <td className="py-3 px-4 font-mono">Rs. {p.unitPrice.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Rs. {p.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                      {p.share}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
