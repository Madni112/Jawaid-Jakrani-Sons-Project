import React from 'react';
import { LuPieChart, LuTag } from 'react-icons/lu';

interface CategoryReportTabProps {
  categoryStats: {
    totalRevenue: number;
    list: Array<{
      category: string;
      percentage: string | number;
      revenue: number;
      ordersCount: number;
      quantity: number;
      averagePrice: number;
    }>;
  };
}

export const CategoryReportTab: React.FC<CategoryReportTabProps> = ({ categoryStats }) => {
  return (
    <div className="space-y-6">
      {/* Category Progress Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <LuPieChart size={16} className="text-primary" />
            <span>Category Sales Distribution (% of Total Business)</span>
          </span>
          <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
            Total: Rs. {categoryStats.totalRevenue.toLocaleString()}
          </span>
        </div>

        {/* Multi-colored Visual Distribution Bar */}
        <div className="h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
          {categoryStats.list.map((c, i) => {
            const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-purple-500'];
            return (
              <div
                key={c.category}
                style={{ width: `${c.percentage}%` }}
                className={`${colors[i % colors.length]} transition-all duration-500`}
                title={`${c.category}: ${c.percentage}% (Rs. ${c.revenue.toLocaleString()})`}
              />
            );
          })}
        </div>

        {/* Category Badges Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {categoryStats.list.map((c, i) => {
            const dotColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-purple-500'];
            return (
              <div key={c.category} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span className={`w-2.5 h-2.5 rounded-full ${dotColors[i % dotColors.length]}`} />
                <span>{c.category}</span>
                <strong className="text-slate-900 dark:text-white font-mono">{c.percentage}%</strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryStats.list.map((c, i) => (
          <div
            key={c.category}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 shadow-sm space-y-4 hover:border-primary/40 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  #{i + 1}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {c.category}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {c.ordersCount} sales ticket(s)
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {c.percentage}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Sales</span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                  Rs. {c.revenue.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Suits Sold</span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                  {c.quantity} Suits
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>Average Selling Price:</span>
              <strong className="font-mono text-slate-900 dark:text-white">Rs. {c.averagePrice.toLocaleString()}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Category Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <LuTag className="text-primary" />
            <span>Detailed Category Sales Breakdown</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {categoryStats.list.length} Categories Analyzed
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4"># Rank</th>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Suits / Pieces Sold</th>
                <th className="py-3 px-4">Gross Revenue (PKR)</th>
                <th className="py-3 px-4">% Share of Sales</th>
                <th className="py-3 px-4">Average Price / Suit</th>
                <th className="py-3 px-4 text-right">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {categoryStats.list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No category sales recorded for this period.
                  </td>
                </tr>
              ) : (
                categoryStats.list.map((c, i) => (
                  <tr key={c.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold font-mono">#{i + 1}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                      {c.category}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">{c.quantity} Suits</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Rs. {c.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {c.percentage}%
                    </td>
                    <td className="py-3 px-4 font-mono">Rs. {c.averagePrice.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        i === 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {i === 0 ? '🏆 Top Category' : 'Active'}
                      </span>
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
