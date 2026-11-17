import React from 'react';
import { useLanguage } from '../../../Context/LanguageContext';

interface AdminRoleSwitcherProps {
  activeView: 'executive' | 'salesman' | 'warehouse';
  onChangeView: (v: 'executive' | 'salesman' | 'warehouse') => void;
}

export const AdminRoleSwitcher: React.FC<AdminRoleSwitcherProps> = ({ activeView, onChangeView }) => {
  const { isRTL, t } = useLanguage();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        {t('role_dashboard_preview', 'Role Dashboard Preview:')}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onChangeView('executive')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeView === 'executive'
              ? 'bg-emerald-600 text-white shadow-sm scale-102'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
        >
          👑 {isRTL ? 'مرکزی جائزہ' : 'Executive Overview'}
        </button>
        <button
          onClick={() => onChangeView('salesman')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeView === 'salesman'
              ? 'bg-emerald-600 text-white shadow-sm scale-102'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
        >
          🛒 {isRTL ? 'سیلزمین ویو' : 'Salesman View'}
        </button>
        <button
          onClick={() => onChangeView('warehouse')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeView === 'warehouse'
              ? 'bg-teal-700 text-white shadow-sm scale-102'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
        >
          📦 {isRTL ? 'گودام' : 'Warehouse'}
        </button>
      </div>
    </div>
  );
};

export default AdminRoleSwitcher;
