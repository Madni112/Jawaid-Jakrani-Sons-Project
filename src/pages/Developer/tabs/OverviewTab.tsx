import React from 'react';
import { MdPeople, MdLayers, MdSecurity } from 'react-icons/md';

interface OverviewTabProps {
  totalEmployees: number;
  totalProducts: number;
  totalInvoices: number;
  ROLE_PRESETS: Record<string, any>;
  applyRolePresetToNew: (presetKey: string) => void;
  setActiveTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  totalEmployees,
  totalProducts,
  totalInvoices,
  ROLE_PRESETS,
  applyRolePresetToNew,
  setActiveTab
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-boxdark p-6 rounded-2xl border border-stroke dark:border-strokedark shadow-default transition-colors duration-200">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Employee Accounts</span>
            <MdPeople className="text-emerald-600 text-xl" />
          </div>
          <div className="text-3xl font-black text-black dark:text-white">{totalEmployees}</div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Configured company user profiles</p>
        </div>

        <div className="bg-white dark:bg-boxdark p-6 rounded-2xl border border-stroke dark:border-strokedark shadow-default transition-colors duration-200">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Products</span>
            <MdLayers className="text-teal-600 text-xl" />
          </div>
          <div className="text-3xl font-black text-black dark:text-white">{totalProducts}</div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Inventory master catalog</p>
        </div>

        <div className="bg-white dark:bg-boxdark p-6 rounded-2xl border border-stroke dark:border-strokedark shadow-default transition-colors duration-200">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Processed Invoices</span>
            <MdSecurity className="text-emerald-600 text-xl" />
          </div>
          <div className="text-3xl font-black text-black dark:text-white">{totalInvoices}</div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Total sales transactions recorded</p>
        </div>
      </div>

      {/* ROLE PRESET QUICK TEMPLATES */}
      <div className="bg-white dark:bg-boxdark p-6 rounded-2xl border border-stroke dark:border-strokedark shadow-default transition-colors duration-200">
        <h3 className="text-sm font-bold text-black dark:text-white mb-2 uppercase tracking-wider">Predefined Employee Role Templates</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Click any template below to create a new employee with pre-configured screen permissions:</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
            <div
              key={key}
              onClick={() => {
                applyRolePresetToNew(key);
                setActiveTab('create');
              }}
              className="bg-gray-50 dark:bg-meta-4/20 p-4 rounded-xl border border-stroke dark:border-strokedark hover:border-emerald-500 dark:hover:border-emerald-500 transition cursor-pointer flex flex-col justify-between space-y-2 group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{preset.icon}</span>
                  <h4 className="font-bold text-black dark:text-white text-sm group-hover:text-emerald-600 transition">{preset.name}</h4>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{preset.description}</p>
              </div>
              <div className="pt-2 flex justify-between items-center border-t border-stroke/50 dark:border-strokedark/50">
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  {preset.modules.length} Permitted Pages
                </span>
                <span className="text-xs text-emerald-600 font-bold group-hover:translate-x-1 transition-transform">
                  Use Role →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
