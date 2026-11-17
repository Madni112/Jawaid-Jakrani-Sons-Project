import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuCalendar,
  LuArrowLeft,
  LuPlus,
  LuSearch,
  LuPauseCircle,
  LuBanknote,
  LuVolume2,
  LuVolumeX,
  LuSun,
  LuMoon,
  LuChevronDown,
  LuSettings,
  LuLogOut,
} from 'react-icons/lu';
import { IoBarcodeOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { posService } from '../../../service/posService';

const resolveInitialFulfillment = (config: any) => {
  const def = config?.default_fulfillment;
  if (!def || def === 'None' || def.toLowerCase() === 'unselected') return '';
  return def;
};

interface POSTopNavbarProps {
  posConfig: any;
  currentDate: string;
  currentTime: string;
  activeView: string;
  setActiveView: (view: any) => void;
  loadCatalog: () => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
  requireOpenDrawer: () => boolean;
  setCartItems: (items: any[]) => void;
  setTicketNumber: (num: string) => void;
  activeShift: any;
  setFulfillmentType: (type: any) => void;
  cartItems: any[];
  showConfirm: (dialog: any) => void;
  handleBarcodeSubmit: (e: React.FormEvent) => void;
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  setIsHeldModalOpen: (val: boolean) => void;
  heldOrders: any[];
  handleOpenDrawerModal: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  colorMode: string;
  setColorMode: (val: any) => void;
  isDark: boolean;
  displayCashierName: string;
  currentCounterConfig: any;
  displayCashierRole: string;
  setIsPosSettingsModalOpen: (val: boolean) => void;
  currentTerminalSlug: string;
}

export const POSTopNavbar: React.FC<POSTopNavbarProps> = ({
  posConfig,
  currentDate,
  currentTime,
  activeView,
  setActiveView,
  loadCatalog,
  accentColor,
  contrastText,
  isAccentWhite,
  requireOpenDrawer,
  setCartItems,
  setTicketNumber,
  activeShift,
  setFulfillmentType,
  cartItems,
  showConfirm,
  handleBarcodeSubmit,
  barcodeInputRef,
  searchQuery,
  setSearchQuery,
  setIsHeldModalOpen,
  heldOrders,
  handleOpenDrawerModal,
  soundEnabled,
  setSoundEnabled,
  colorMode,
  setColorMode,
  isDark,
  displayCashierName,
  currentCounterConfig,
  displayCashierRole,
  setIsPosSettingsModalOpen,
  currentTerminalSlug,
}) => {
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-[#111622] border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2 sm:gap-3 z-40 relative w-full max-w-full overflow-visible">
      {/* Left: Terminal pill & Live clock */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px] sm:max-w-none">
            {posConfig.terminal_name}
          </span>
          <span className="text-slate-300 dark:text-slate-600 hidden md:inline">•</span>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 hidden md:flex items-center gap-1.5">
            <LuCalendar size={13} className="text-primary opacity-80" />
            {currentDate}
          </span>
          <span className="text-slate-300 dark:text-slate-600 hidden xl:inline">•</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold hidden xl:inline">
            {currentTime}
          </span>
        </div>

        {/* Back to Register Terminal if in Sub-view */}
        {activeView !== 'register' && (
          <button
            type="button"
            onClick={() => {
              setActiveView('register');
              loadCatalog();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer hover:opacity-90"
            style={{
              backgroundColor: accentColor,
              color: contrastText,
              border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
            }}
          >
            <LuArrowLeft size={14} />
            <span>Back to Register</span>
          </button>
        )}

        {/* Quick Action: + New Sale */}
        {activeView === 'register' && (
          <button
            type="button"
            onClick={() => {
              if (!requireOpenDrawer()) return;
              const startFresh = () => {
                setCartItems([]);
                setTicketNumber(activeShift ? posService.getNextOrderNumber(activeShift.business_date) : '');
                setFulfillmentType(resolveInitialFulfillment(posConfig));
                toast.success('New sale order started');
              };

              if (cartItems.length > 0) {
                showConfirm({
                  title: 'Start New Sale',
                  message: 'Starting a new sale will clear current items in cart. Do you want to continue?',
                  confirmLabel: 'Start New Sale',
                  isDestructive: false,
                  onConfirm: startFresh,
                });
                return;
              }
              startFresh();
            }}
            className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <LuPlus size={14} className="text-primary" />
            <span>+ New Sale</span>
          </button>
        )}
      </div>

      {/* Center: Live Barcode & Item Search Input */}
      <form onSubmit={handleBarcodeSubmit} className="flex-1 max-w-md min-w-[110px] relative">
        <div className="relative">
          <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input
            ref={barcodeInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items or scan... [F2]"
            className="w-full pl-10 pr-20 sm:pr-24 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900 dark:text-white placeholder:text-slate-400 transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-2xs"
            style={{
              backgroundColor: accentColor,
              color: contrastText,
              border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
            }}
          >
            <IoBarcodeOutline size={13} />
            <span className="hidden sm:inline">Scan [F2]</span>
            <span className="sm:hidden">Scan</span>
          </button>
        </div>
      </form>

      {/* Right: Quick Action Buttons, Sound, Mode, Cashier info */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Held Tickets Count */}
        <button
          type="button"
          onClick={() => setIsHeldModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition cursor-pointer"
          title="Held orders"
        >
          <LuPauseCircle size={15} />
          <span className="hidden sm:inline">Held</span>
          <span>({heldOrders.length})</span>
        </button>

        {/* Quick Drawer */}
        <button
          type="button"
          onClick={handleOpenDrawerModal}
          className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
            activeShift
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}
          title="Cash drawer & business day operations"
        >
          <LuBanknote size={15} />
          <span className="hidden lg:inline">Drawer</span>
          {!activeShift && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-mono font-bold">
              Closed
            </span>
          )}
        </button>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            toast.success(next ? 'Sound effects enabled' : 'Sound effects muted');
          }}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs transition cursor-pointer"
          title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
        >
          {soundEnabled ? <LuVolume2 size={16} /> : <LuVolumeX size={16} />}
        </button>

        {/* Dark / Light Toggle */}
        <button
          type="button"
          onClick={() => {
            const next = colorMode === 'dark' ? 'light' : 'dark';
            setColorMode(next);
          }}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs transition cursor-pointer"
          title="Toggle theme mode"
        >
          {isDark ? <LuSun size={16} className="text-amber-400" /> : <LuMoon size={16} />}
        </button>

        {/* Active Cashier Avatar, Name & Profile Dropdown */}
        <div ref={profileDropdownRef} className="relative z-50 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setProfileDropdownOpen((prev) => !prev);
            }}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 hover:opacity-90 transition cursor-pointer select-none text-left"
            title="Cashier Profile & POS Settings"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs shrink-0"
              style={{
                backgroundColor: accentColor,
                color: contrastText,
                border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
              }}
            >
              {displayCashierName.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden 2xl:block leading-tight text-left">
              <span className="block text-xs font-bold text-slate-900 dark:text-white capitalize truncate max-w-[120px]">
                {displayCashierName}
              </span>
              {activeShift ? (
                <span className="block text-[10px] text-emerald-500 font-semibold">
                  Shift Active
                </span>
              ) : (
                <span className="block text-[10px] text-amber-500 font-bold">
                  🔒 Day Closed
                </span>
              )}
            </div>
            <LuChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 hidden sm:block ${
                profileDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 animate-fadeIn space-y-1.5"
              style={{ zIndex: 99999 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Profile Info Card */}
              <div className="px-3.5 py-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize truncate" title={displayCashierName}>
                  {displayCashierName}
                </p>
                <p className="text-[11px] text-primary font-bold capitalize mt-0.5">
                  {currentCounterConfig?.name || 'Counter'} • {displayCashierRole}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-medium">Drawer Status:</span>
                  {activeShift ? (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleOpenDrawerModal();
                      }}
                      className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded cursor-pointer transition flex items-center gap-1"
                      title="Click to manage cash drawer or close shift"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Shift Active (Manage)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleOpenDrawerModal();
                      }}
                      className="font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded cursor-pointer transition"
                    >
                      Open Drawer
                    </button>
                  )}
                </div>
              </div>

              {/* Cash Drawer & Business Day Operations */}
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  handleOpenDrawerModal();
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <LuBanknote size={16} className={activeShift ? "text-emerald-500" : "text-amber-500"} />
                <div className="flex-1 text-left flex items-center justify-between">
                  <span>Cash Drawer & Day</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    activeShift ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {activeShift ? 'Shift Active' : 'Day Closed'}
                  </span>
                </div>
              </button>

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setIsPosSettingsModalOpen(true);
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <LuSettings size={16} className="text-primary" />
                <span>POS Settings</span>
              </button>

              {/* Exit to ERP Button */}
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  navigate('/');
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <LuArrowLeft size={16} className="text-slate-500" />
                <span>Exit to ERP</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  posService.clearLoggedInCashier(currentTerminalSlug);
                  toast.success(`Logged out ${displayCashierName}`);
                  navigate(`/${currentTerminalSlug}`);
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
              >
                <LuLogOut size={16} />
                <span>Log Out Cashier</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
