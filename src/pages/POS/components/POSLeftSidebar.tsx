import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuPauseCircle,
  LuReceipt,
  LuBanknote,
  LuShoppingBag,
  LuRotateCcw,
  LuBarChart3,
  LuLock,
  LuArrowLeft,
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';

interface POSLeftSidebarProps {
  accentColor: string;
  contrastText: string;
  safeAccentText: string;
  activeSidebarBg: string;
  isAccentWhite: boolean;
  displayBrand: string;
  posConfig: any;
  activeView: string;
  setActiveView: (view: any) => void;
  loadCatalog: () => void;
  setIsHeldModalOpen: (val: boolean) => void;
  heldOrders: any[];
  handleOpenDrawerModal: () => void;
  activeShift: any;
  setIsLocked: (val: boolean) => void;
}

export const POSLeftSidebar: React.FC<POSLeftSidebarProps> = ({
  accentColor,
  contrastText,
  safeAccentText,
  activeSidebarBg,
  isAccentWhite,
  displayBrand,
  posConfig,
  activeView,
  setActiveView,
  loadCatalog,
  setIsHeldModalOpen,
  heldOrders,
  handleOpenDrawerModal,
  activeShift,
  setIsLocked,
}) => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-white dark:bg-[#111622] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 z-20 shadow-sm">
      {/* Top Brand Logo */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md transition-all duration-300 ${isAccentWhite ? 'border border-slate-300 dark:border-slate-700' : ''}`}
              style={{ backgroundColor: accentColor, color: contrastText }}
            >
              <MdPointOfSale size={22} />
            </div>
            <div className="leading-tight">
              <h1 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>{displayBrand}</span>
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {posConfig.terminal_name} • POS
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <button
            type="button"
            onClick={() => {
              setActiveView('register');
              loadCatalog();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 cursor-pointer ${
              activeView === 'register'
                ? 'shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            style={
              activeView === 'register'
                ? { backgroundColor: activeSidebarBg, color: safeAccentText }
                : undefined
            }
          >
            <div className="flex items-center gap-3">
              <MdPointOfSale size={17} />
              <span>Register Terminal</span>
            </div>
            {activeView === 'register' && (
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: safeAccentText }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsHeldModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <LuPauseCircle size={17} className="text-amber-500" />
              <span>Held Orders</span>
            </div>
            {heldOrders.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {heldOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView('transactions')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 cursor-pointer ${
              activeView === 'transactions'
                ? 'shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            style={
              activeView === 'transactions'
                ? { backgroundColor: activeSidebarBg, color: safeAccentText }
                : undefined
            }
          >
            <div className="flex items-center gap-3">
              <LuReceipt size={17} className="text-sky-500" />
              <span>Transactions</span>
            </div>
            {activeView === 'transactions' && (
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: safeAccentText }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenDrawerModal}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <LuBanknote size={17} className="text-emerald-500" />
              <span>Cash Drawer</span>
            </div>
            <span className={`text-[10px] font-mono font-bold ${activeShift ? 'text-slate-400' : 'text-amber-500'}`}>
              {activeShift ? `Rs. ${(activeShift.expected_cash || 0).toLocaleString()}` : 'Day Closed'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('catalog')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 cursor-pointer ${
              activeView === 'catalog'
                ? 'shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            style={
              activeView === 'catalog'
                ? { backgroundColor: activeSidebarBg, color: safeAccentText }
                : undefined
            }
          >
            <div className="flex items-center gap-3">
              <LuShoppingBag size={17} className="text-purple-500" />
              <span>POS Store Catalog</span>
            </div>
            {activeView === 'catalog' && (
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: safeAccentText }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView('returns')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 cursor-pointer ${
              activeView === 'returns'
                ? 'shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            style={
              activeView === 'returns'
                ? { backgroundColor: activeSidebarBg, color: safeAccentText }
                : undefined
            }
          >
            <div className="flex items-center gap-3">
              <LuRotateCcw size={17} className="text-rose-500" />
              <span>Returns & Refunds</span>
            </div>
            {activeView === 'returns' && (
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: safeAccentText }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView('summary')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 cursor-pointer ${
              activeView === 'summary'
                ? 'shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            style={
              activeView === 'summary'
                ? { backgroundColor: activeSidebarBg, color: safeAccentText }
                : undefined
            }
          >
            <div className="flex items-center gap-3">
              <LuBarChart3 size={17} className="text-indigo-500" />
              <span>Reports & Daily Summary</span>
            </div>
            {activeView === 'summary' && (
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: safeAccentText }}
              />
            )}
          </button>
        </nav>
      </div>

      {/* Bottom Lock & Exit Buttons */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
        {/* Lock Terminal Button */}
        <button
          type="button"
          onClick={() => setIsLocked(true)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LuLock size={15} className="text-amber-500" />
            <span>Lock Terminal</span>
          </div>
          <span className="text-[10px] text-slate-400 uppercase">Screen Lock</span>
        </button>

        {/* Exit to ERP Dashboard Button */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
        >
          <LuArrowLeft size={14} />
          <span>Exit to ERP System</span>
        </button>

        {/* System status pill */}
        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>99.8% Online</span>
          </div>
          <span className="font-mono text-[10px]">v1.4 POS</span>
        </div>
      </div>
    </aside>
  );
};
