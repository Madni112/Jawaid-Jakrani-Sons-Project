import React from 'react';
import { LuClock } from 'react-icons/lu';

interface PeakHoursTabProps {
  hourlyStats: {
    peakBucket?: {
      label: string;
      revenue: number;
    };
    buckets: Array<{
      id: string | number;
      label: string;
      revenue: number;
      count: number;
      share: string | number;
    }>;
  };
}

export const PeakHoursTab: React.FC<PeakHoursTabProps> = ({ hourlyStats }) => {
  return (
    <div className="space-y-6">
      {/* Peak Shopping Highlight Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10 p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
            <LuClock size={20} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Busiest Retail Shopping Window
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <strong>{hourlyStats.peakBucket?.label || 'Evening Rush'}</strong> generates the highest sales revenue.
            </p>
          </div>
        </div>
        <span className="text-sm font-black font-mono text-amber-600">
          Rs. {(hourlyStats.peakBucket?.revenue || 0).toLocaleString()}
        </span>
      </div>

      {/* Time Windows Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hourlyStats.buckets.map((b) => (
          <div
            key={b.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 shadow-sm space-y-3"
          >
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {b.label}
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              Rs. {b.revenue.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{b.count} Orders</span>
              <span className="font-bold text-primary font-mono">{b.share}% of Sales</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${b.share}%` }}
                className="h-full bg-primary transition-all duration-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
