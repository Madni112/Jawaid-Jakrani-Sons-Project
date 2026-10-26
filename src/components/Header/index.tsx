import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DropdownUser from './DropdownUser';
import DarkModeSwitcher from './DarkModeSwitcher';
import NotificationDropdown from './NotificationDropdown';
import { MdMenu } from 'react-icons/md';
import {
  LuSearch,
  LuPlus,
  LuClock,
  LuVolume2,
  LuVolumeX,
  LuCommand,
  LuArrowRight,
  LuX,
  LuFileText,
  LuReceipt,
  LuUsers,
  LuPackage,
  LuSlidersHorizontal,
  LuBarChart3,
  LuShield,
} from 'react-icons/lu';
import { useAuth } from '../../Context/Auth';
import {
  isUserAudioEnabled,
  setUserAudioEnabled,
  triggerFeedbackSound,
} from '../../utils/audioFeedback';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  path: string;
  icon: React.ReactNode;
}

const SEARCH_REGISTRY: SearchItem[] = [
  // Sales & Billing
  { id: 'new-invoice', title: 'New Sales Invoice', subtitle: 'Create POS sale or delivery challan', category: 'Sales', path: '/sales/invoice/add', icon: <LuPlus /> },
  { id: 'invoices-list', title: 'Sales Invoices Directory', subtitle: 'View past invoices, DC history & receipts', category: 'Sales', path: '/Sales/Invoice/List', icon: <LuReceipt /> },
  { id: 'sales-returns', title: 'Sales Return & Exchange', subtitle: 'Process return items and customer refunds', category: 'Sales', path: '/Sales/Sales-Return/List', icon: <LuFileText /> },
  { id: 'quotations', title: 'Quotations & Estimates', subtitle: 'Draft and print pricing estimates', category: 'Sales', path: '/crm/quotations', icon: <LuFileText /> },

  // Inventory & Products
  { id: 'products-list', title: 'Product Catalog & Inventory', subtitle: 'Stock balances, tile sizing & prices', category: 'Inventory', path: '/Administration/Products/List', icon: <LuPackage /> },
  { id: 'bulk-upload', title: 'Bulk Products Upload', subtitle: 'Upload products via Excel spreadsheet', category: 'Inventory', path: '/Administration/Products/Bulk-Upload', icon: <LuPlus /> },

  // Contacts & Ledgers
  { id: 'customers-dir', title: 'Customer Directory & Accounts', subtitle: 'Customer ledgers, phone & credit limits', category: 'Accounts', path: '/Sales/Customers/List', icon: <LuUsers /> },
  { id: 'suppliers-dir', title: 'Vendor & Supplier Accounts', subtitle: 'Vendor ledgers and payable bills', category: 'Accounts', path: '/Purchase/Vendor/List', icon: <LuUsers /> },
  { id: 'purchases-list', title: 'Purchase Orders & GRN', subtitle: 'Purchases, stock intake & vendor bills', category: 'Purchases', path: '/Purchase/Purchases/List', icon: <LuPackage /> },
  { id: 'vouchers-list', title: 'Cash & Bank Vouchers', subtitle: 'Receipts, payment vouchers & ledgers', category: 'Accounts', path: '/Registration/Vouchers/List', icon: <LuReceipt /> },

  // Preferences & System
  { id: 'settings-credit', title: 'Customer Credit Limits', subtitle: 'Set borrowing ceilings & check risk', category: 'Settings', path: '/settings', icon: <LuSlidersHorizontal /> },
  { id: 'settings-audio', title: 'Audio & Sound Effects', subtitle: 'Customize POS ringtones & volume', category: 'Settings', path: '/settings', icon: <LuVolume2 /> },
  { id: 'settings-backup', title: 'Data Backup & Export', subtitle: 'Export Excel snapshots & database backups', category: 'Settings', path: '/settings', icon: <LuSlidersHorizontal /> },
  { id: 'settings-theme', title: 'Theme & Brand Appearance', subtitle: 'Accent colors, dark mode & styles', category: 'Settings', path: '/settings', icon: <LuSlidersHorizontal /> },
  { id: 'dev-master', title: 'Developer Master Console', subtitle: 'Apex security governance & user tools', category: 'System', path: '/dev/master', icon: <LuShield /> },
];

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  const navigate = useNavigate();
  const { userEmail, userLocationName, businessName } = useAuth();

  // 1. Live Digital Clock State
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setDateString(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  // 2. Audio Mute / Active Fast Switch
  const [audioActive, setAudioActive] = useState<boolean>(() =>
    isUserAudioEnabled(userEmail)
  );

  useEffect(() => {
    const handleAudioPrefChange = () => {
      setAudioActive(isUserAudioEnabled(userEmail));
    };
    window.addEventListener('erp_audio_preference_changed', handleAudioPrefChange);
    return () => window.removeEventListener('erp_audio_preference_changed', handleAudioPrefChange);
  }, [userEmail]);

  const toggleSound = () => {
    const nextState = !audioActive;
    setAudioActive(nextState);
    setUserAudioEnabled(nextState, userEmail);
    if (nextState) {
      triggerFeedbackSound('notification', userEmail);
    }
  };

  // 3. Quick Command Search Modal State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  const filteredItems = SEARCH_REGISTRY.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleSelectSearchItem = (path: string) => {
    setSearchOpen(false);
    navigate(path);
  };

  // 4. Dynamic Portal Identifier
  const isAlm =
    typeof window !== 'undefined' &&
    (window.location.hostname.toLowerCase().includes('muhammadi') ||
      document.title.toLowerCase().includes('muhammadi') ||
      window.location.href.toLowerCase().includes('muhammadi'));
  const portalCode = isAlm ? 'ALM' : 'ZAC';
  const branchLabel = userLocationName || 'Portal Active';

  return (
    <>
      <header className="sticky top-0 z-999 flex w-full backdrop-blur-xl bg-white/90 dark:bg-[#0B0F17]/90 border-b border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-all duration-200">
        <div className="flex flex-grow items-center justify-between px-3.5 py-2.5 sm:px-6 2xl:px-8 gap-3">
          
          {/* Left Side: Mobile Menu + Portal/Branch Pill + New Sale Button */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Mobile Sidebar Toggle */}
            <button
              aria-controls="sidebar"
              onClick={(e) => {
                e.stopPropagation();
                props.setSidebarOpen(!props.sidebarOpen);
              }}
              className="z-99999 block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-2xs min-[751px]:hidden text-slate-700 dark:text-slate-200 hover:text-primary transition cursor-pointer"
            >
              <MdMenu size={20} />
            </button>

            {/* Dynamic Portal & Branch Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">
                {portalCode}
              </span>
              <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                {branchLabel}
              </span>
            </div>

            {/* Quick Action: New Sale Button */}
            <Link
              to="/sales/invoice/add"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:opacity-90 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
              title="Create a New Sales Invoice"
            >
              <LuPlus className="text-sm stroke-[3]" />
              <span className="hidden md:inline">New Sale</span>
            </Link>
          </div>

          {/* Center: Command Palette / Quick Search Trigger */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4 hidden lg:block">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition text-xs cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <LuSearch className="text-sm text-slate-400" />
                <span className="truncate">Search invoices, products, customers...</span>
              </div>
              <kbd className="hidden xl:inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 shadow-2xs">
                <span>Ctrl</span>
                <span>K</span>
              </kbd>
            </button>
          </div>

          {/* Right Side: Search Icon (Mobile) + Clock + Audio Toggle + Notifications + Dark Mode + User */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition lg:hidden cursor-pointer"
              title="Quick Search (Ctrl + K)"
            >
              <LuSearch size={18} />
            </button>

            {/* Live Clock & Date */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <LuClock className="text-xs text-primary shrink-0" />
              <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-100">
                {timeString}
              </span>
              <span className="text-[10px] text-slate-400">•</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {dateString}
              </span>
            </div>

            {/* Fast Sound Mute / Unmute Button */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-full border transition flex items-center justify-center cursor-pointer shadow-2xs ${
                audioActive
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title={audioActive ? 'POS Sound Effects: ON (Click to Mute)' : 'POS Sound Effects: MUTED (Click to Turn On)'}
            >
              {audioActive ? <LuVolume2 size={16} /> : <LuVolumeX size={16} />}
            </button>

            {/* Header Notifications Dropdown */}
            <NotificationDropdown />

            {/* Dark Mode Switcher */}
            <DarkModeSwitcher />

            {/* Subtle Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* User Profile Dropdown */}
            <DropdownUser />
          </div>
        </div>
      </header>

      {/* ── COMMAND PALETTE / QUICK SEARCH MODAL (Ctrl + K) ── */}
      {searchOpen && (
        <div className="fixed inset-0 z-99999 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl overflow-hidden transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Search Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <LuSearch className="text-lg text-primary shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoices, products, customers, settings..."
                className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Search Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching destinations found for "{searchQuery}".
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSearchItem(item.path)}
                    className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center text-sm shrink-0 transition">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <LuArrowRight className="text-slate-300 dark:text-slate-600 group-hover:text-primary transition shrink-0 ml-2" size={14} />
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer Hotkeys */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>Select with <kbd className="px-1 rounded-sm bg-white dark:bg-slate-800 border text-[10px]">↵ Enter</kbd></span>
                <span>Navigate with <kbd className="px-1 rounded-sm bg-white dark:bg-slate-800 border text-[10px]">↑</kbd> <kbd className="px-1 rounded-sm bg-white dark:bg-slate-800 border text-[10px]">↓</kbd></span>
              </div>
              <span>Close with <kbd className="px-1 rounded-sm bg-white dark:bg-slate-800 border text-[10px]">Esc</kbd></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;