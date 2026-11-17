import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { MdShowChart, MdBarChart } from 'react-icons/md';

interface DashboardChartsSectionProps {
  salesVsPurchasesChartOptions: any;
  salesVsPurchasesChartSeries: any[];
  customerSalesChartOptions: any;
  customerSalesChartSeries: any[];
  chartViewTab: 'daily' | 'monthly';
  setChartViewTab: (tab: 'daily' | 'monthly') => void;
}

export const DashboardChartsSection: React.FC<DashboardChartsSectionProps> = ({
  salesVsPurchasesChartOptions,
  salesVsPurchasesChartSeries,
  customerSalesChartOptions,
  customerSalesChartSeries,
  chartViewTab,
  setChartViewTab,
}) => {
  return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: SALES VS PROCUREMENT */}
        <div className="relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs hover:shadow-xs p-5 sm:p-6 overflow-hidden transition-all duration-200 group">
          {/* Linear Blue Accent Notch */}
          <span className="absolute left-0 top-3.5 bottom-3.5 w-1.25 rounded-r-full bg-blue-500 shadow-xs transition-all duration-200 group-hover:w-2" />

          <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3 pl-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/60 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <MdShowChart size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Sales vs Purchases
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Monthly comparative velocity & margins</p>
              </div>
            </div>
            <span className="text-[10.5px] px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold font-mono border border-blue-200/70 dark:border-blue-800/60 shrink-0">
              Live Sync
            </span>
          </div>
          <ReactApexChart options={salesVsPurchasesChartOptions} series={salesVsPurchasesChartSeries} type="area" height={300} />
        </div>

        {/* CHART 2: CUSTOMER SALES VOLUME GRAPH (TABS: DAILY / MONTHLY) */}
        <div className="relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs hover:shadow-xs p-5 sm:p-6 overflow-hidden transition-all duration-200 group">
          {/* Linear Purple Accent Notch */}
          <span className="absolute left-0 top-3.5 bottom-3.5 w-1.25 rounded-r-full bg-purple-500 shadow-xs transition-all duration-200 group-hover:w-2" />

          <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3 pl-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200/70 dark:border-purple-800/60 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <MdBarChart size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Customer Sales Trend
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Interactive timeframe aggregation</p>
              </div>
            </div>
            {/* Tab Switcher: Daily vs Monthly */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 font-bold text-xs">
              <button
                onClick={() => setChartViewTab('daily')}
                className={`px-3 py-1 rounded-md text-[11px] transition-all cursor-pointer ${chartViewTab === 'daily'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
                  }`}
              >
                📅 Daily (Last 14d)
              </button>
              <button
                onClick={() => setChartViewTab('monthly')}
                className={`px-3 py-1 rounded-md text-[11px] transition-all cursor-pointer ${chartViewTab === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
                  }`}
              >
                📆 Monthly
              </button>
            </div>
          </div>
          <ReactApexChart options={customerSalesChartOptions} series={customerSalesChartSeries} type="bar" height={300} />
        </div>
      </div>

  );
};

export default DashboardChartsSection;
