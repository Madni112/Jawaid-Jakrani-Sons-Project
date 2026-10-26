import React, { useState, useEffect } from 'react';
import {
  LuUser,
  LuPalette,
  LuSettings,
  LuSun,
  LuMoon,
  LuCheck,
  LuBuilding2,
  LuMail,
  LuShieldCheck,
  LuPenLine,
  LuSparkles,
  LuLayers,
  LuSlidersHorizontal,
  LuLayoutDashboard,
  LuReceipt,
  LuPackage,
  LuUsers,
} from 'react-icons/lu';
import { useAuth } from '../../Context/Auth';
import useColorMode from '../../hooks/useColorMode';
import {
  PRESET_THEME_COLORS,
  applyAccentColor,
  getSavedAccentColor,
  applySidebarColor,
  getSavedSidebarColor,
  getSafeSidebarColor,
  isDarkModeActive,
} from '../../constant/themeConfig';

interface TabItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const SETTINGS_TABS: TabItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Personal info & company details',
    icon: LuUser,
  },
  {
    id: 'theme',
    label: 'Theme & Appearance',
    description: 'Accent colors, sidebar styles & mode',
    icon: LuPalette,
  },
];

const SettingsPage: React.FC = () => {
  const { userEmail, role, businessName, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [colorMode, setColorMode] = useColorMode();

  // Primary Accent Color State
  const [accentColor, setAccentColor] = useState<string>(getSavedAccentColor());
  const [customAccentHex, setCustomAccentHex] = useState<string>('');

  // Sidebar Color State
  const [sidebarColor, setSidebarColor] = useState<string>(getSavedSidebarColor());
  const [customSidebarHex, setCustomSidebarHex] = useState<string>('');
  const [wasSidebarAdjusted, setWasSidebarAdjusted] = useState<boolean>(false);

  // Sync colors from storage & listeners
  useEffect(() => {
    const syncColors = () => {
      const activeAccent = getSavedAccentColor();
      setAccentColor(activeAccent);
      setCustomAccentHex(activeAccent.replace('#', ''));

      const isDark = isDarkModeActive();
      const currentSidebar = getSavedSidebarColor(isDark);
      const safeCheck = getSafeSidebarColor(
        localStorage.getItem('zoaib_ali_sidebar_raw_color') || currentSidebar,
        isDark
      );
      setSidebarColor(safeCheck.safeColor);
      setCustomSidebarHex(safeCheck.safeColor.replace('#', ''));
      setWasSidebarAdjusted(safeCheck.wasAdjusted);
    };

    syncColors();
    window.addEventListener('zoaib_ali_theme_color_changed', syncColors);
    window.addEventListener('zoaib_ali_sidebar_color_changed', syncColors);
    window.addEventListener('color-mode-changed', syncColors);

    return () => {
      window.removeEventListener('zoaib_ali_theme_color_changed', syncColors);
      window.removeEventListener('zoaib_ali_sidebar_color_changed', syncColors);
      window.removeEventListener('color-mode-changed', syncColors);
    };
  }, [colorMode]);

  // Accent Color Handler
  const handleAccentSelect = (hex: string) => {
    setAccentColor(hex);
    setCustomAccentHex(hex.replace('#', ''));
    applyAccentColor(hex);
  };

  const handleCustomAccentSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customAccentHex.replace(/[^0-9A-Fa-f]/g, '').trim();
    if (clean.length === 3 || clean.length === 6) {
      handleAccentSelect(`#${clean}`);
    }
  };

  // Sidebar Color Handler
  const handleSidebarSelect = (hex: string) => {
    const isDark = isDarkModeActive();
    const result = applySidebarColor(hex, isDark);
    setSidebarColor(result.safeColor);
    setCustomSidebarHex(result.safeColor.replace('#', ''));
    setWasSidebarAdjusted(result.wasAdjusted);
  };

  const handleCustomSidebarSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customSidebarHex.replace(/[^0-9A-Fa-f]/g, '').trim();
    if (clean.length === 3 || clean.length === 6) {
      handleSidebarSelect(`#${clean}`);
    }
  };

  const isAlm =
    typeof window !== 'undefined' &&
    (window.location.hostname.toLowerCase().includes('muhammadi') ||
      document.title.toLowerCase().includes('muhammadi') ||
      window.location.href.toLowerCase().includes('muhammadi'));
  const fallbackCompany = isAlm ? 'AL MUHAMMADI' : 'Zoaib Ali & Company';
  const displayCompanyName = businessName || fallbackCompany;
  const displayEmail = userEmail || (isAlm ? 'admin@almuhammadi.com' : 'test@noorhorizontechnologie.com');
  const displayRole = role || 'Super Admin';
  const portalName = isAlm ? 'Al Muhammadi (AM)' : 'Zohaib Ali Company (ZAC)';

  const activeAccentPreset = PRESET_THEME_COLORS.find(
    (c) => c.hex.toLowerCase() === accentColor.toLowerCase()
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-fadeIn">
      {/* Top Page Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <LuSlidersHorizontal size={14} className="text-primary" />
            <span>Application Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
            Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your account credentials, primary brand colors, and portal appearance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs font-semibold">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-slate-700 dark:text-slate-200">
              {activeAccentPreset ? activeAccentPreset.name : 'Custom Theme'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout with Floating Settings Sidebar */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Floating Settings Sidebar */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 md:sticky md:top-20 z-10">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#111827]/95 p-3 shadow-md backdrop-blur-md">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Navigation
              </span>
            </div>

            <nav className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {SETTINGS_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center gap-3.5 w-full p-2.5 sm:p-3 rounded-xl text-left transition-all duration-150 cursor-pointer shrink-0 md:shrink select-none ${
                      isActive
                        ? 'bg-primary/10 text-primary font-bold shadow-xs border border-primary/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate leading-tight">
                        {tab.label}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate hidden lg:block mt-0.5 font-normal">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 px-2 text-[11px] text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-1.5 font-medium">
                <LuBuilding2 size={13} className="text-primary" />
                <span className="truncate">{displayCompanyName}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 w-full min-w-0">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Profile Card Header */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div
                    className="w-18 h-18 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md border-2 border-white dark:border-slate-800 shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    {displayCompanyName.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                        {displayCompanyName}
                      </h2>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${accentColor}1A`,
                          color: accentColor,
                        }}
                      >
                        {displayRole}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Session
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <LuMail size={13} className="shrink-0" />
                      <span>{displayEmail}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Account & Organization Details */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
                <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                  <LuBuilding2 className="text-primary text-lg" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Organization & Account Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Company / Organization Name
                    </span>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
                      {displayCompanyName}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Login Email Address
                    </span>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
                      {displayEmail}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Security Level & Access Role
                    </span>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1.5">
                      <LuShieldCheck className="text-primary" />
                      <span>{displayRole} (Full Permissions)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Portal Instance
                    </span>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span>{portalName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THEME & APPEARANCE */}
          {activeTab === 'theme' && (
            <div className="space-y-6 animate-fadeIn">
              {/* SECTION A: ACCENT COLOR THEME */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      <LuSparkles size={16} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Brand Accent Color
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Primary brand color applied to buttons, badges, highlights, and active indicators.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                      {accentColor.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* 24 Presets Grid */}
                <div className="mb-6">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-3">
                    Preset Palette ({PRESET_THEME_COLORS.length} Colors)
                  </span>

                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5">
                    {PRESET_THEME_COLORS.map((c) => {
                      const isSelected = accentColor.toLowerCase() === c.hex.toLowerCase();
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => handleAccentSelect(c.hex)}
                          className={`group relative h-11 rounded-xl transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center cursor-pointer border ${
                            isSelected
                              ? 'ring-3 ring-offset-2 ring-slate-900 dark:ring-white border-transparent shadow-sm'
                              : 'border-black/10 dark:border-white/10 hover:shadow-xs'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={`${c.name} (${c.hex})`}
                        >
                          {isSelected && (
                            <LuCheck className="text-white drop-shadow-md text-base stroke-[3]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Accent Color Form */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label
                      className="relative flex items-center justify-center cursor-pointer shrink-0"
                      title="Open color wheel"
                    >
                      <span
                        className="w-10 h-10 rounded-xl border border-black/15 shadow-xs block transition hover:scale-105"
                        style={{ backgroundColor: accentColor }}
                      />
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => handleAccentSelect(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>

                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <LuPenLine size={13} />
                        <span>Custom Accent Hex</span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-400">
                        Pick from the color wheel or type any hex
                      </span>
                    </div>
                  </div>

                  <form
                    onSubmit={handleCustomAccentSubmit}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <div className="flex items-center px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 shadow-2xs w-full sm:w-36">
                      <span className="text-slate-400 select-none mr-1">#</span>
                      <input
                        type="text"
                        maxLength={6}
                        value={customAccentHex}
                        onChange={(e) => setCustomAccentHex(e.target.value)}
                        placeholder="059669"
                        className="w-full bg-transparent outline-none uppercase font-mono tracking-wider text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition hover:opacity-95 active:scale-95 cursor-pointer shrink-0"
                      style={{ backgroundColor: accentColor }}
                    >
                      Apply
                    </button>
                  </form>
                </div>

                {/* Live UI Interactive Preview */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-2.5">
                    Live UI Preview
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                      style={{ backgroundColor: accentColor }}
                    >
                      Primary Button
                    </button>
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: `${accentColor}1A`,
                        color: accentColor,
                      }}
                    >
                      Badge Highlight
                    </span>
                    <div
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold border"
                      style={{
                        borderColor: `${accentColor}60`,
                        color: accentColor,
                      }}
                    >
                      Outline Element
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: SIDEBAR FONT & ICON COLOR */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: sidebarColor }}
                    >
                      <LuLayers size={16} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Sidebar Font & Icon Color
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Adjusts text and icon color for all main navigation items in the left sidebar.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {wasSidebarAdjusted ? (
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                        Contrast Protected
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                        High Contrast
                      </span>
                    )}
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs"
                      style={{ backgroundColor: sidebarColor }}
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                      {sidebarColor.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* 24 Sidebar Presets */}
                <div className="mb-6">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-3">
                    Preset Options
                  </span>

                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5">
                    {PRESET_THEME_COLORS.map((c) => {
                      const isSelected = sidebarColor.toLowerCase() === c.hex.toLowerCase();
                      return (
                        <button
                          key={`sidebar-${c.hex}`}
                          type="button"
                          onClick={() => handleSidebarSelect(c.hex)}
                          className={`group relative h-11 rounded-xl transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center cursor-pointer border ${
                            isSelected
                              ? 'ring-3 ring-offset-2 ring-slate-900 dark:ring-white border-transparent shadow-sm'
                              : 'border-black/10 dark:border-white/10 hover:shadow-xs'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={`Sidebar: ${c.name} (${c.hex})`}
                        >
                          {isSelected && (
                            <LuCheck className="text-white drop-shadow-md text-base stroke-[3]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Sidebar Color Form */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label
                      className="relative flex items-center justify-center cursor-pointer shrink-0"
                      title="Open sidebar color wheel"
                    >
                      <span
                        className="w-10 h-10 rounded-xl border border-black/15 shadow-xs block transition hover:scale-105"
                        style={{ backgroundColor: sidebarColor }}
                      />
                      <input
                        type="color"
                        value={sidebarColor}
                        onChange={(e) => handleSidebarSelect(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>

                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <LuPenLine size={13} />
                        <span>Custom Sidebar Hex</span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-400">
                        Automatic contrast safety ensures icons and text stay readable
                      </span>
                    </div>
                  </div>

                  <form
                    onSubmit={handleCustomSidebarSubmit}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <div className="flex items-center px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 shadow-2xs w-full sm:w-36">
                      <span className="text-slate-400 select-none mr-1">#</span>
                      <input
                        type="text"
                        maxLength={6}
                        value={customSidebarHex}
                        onChange={(e) => setCustomSidebarHex(e.target.value)}
                        placeholder="475569"
                        className="w-full bg-transparent outline-none uppercase font-mono tracking-wider text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition hover:opacity-95 active:scale-95 cursor-pointer shrink-0"
                      style={{ backgroundColor: sidebarColor }}
                    >
                      Apply
                    </button>
                  </form>
                </div>

                {/* Sidebar Navigation Live Preview Box */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-2.5">
                    Sidebar Navigation Preview
                  </span>
                  <div className="max-w-xs p-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                    <div
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold"
                      style={{
                        backgroundColor: `${sidebarColor}20`,
                        color: sidebarColor,
                      }}
                    >
                      <LuLayoutDashboard size={15} style={{ color: sidebarColor }} />
                      <span>Dashboard (Active)</span>
                    </div>
                    <div
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium"
                      style={{ color: sidebarColor }}
                    >
                      <LuReceipt size={15} style={{ color: sidebarColor }} />
                      <span>Sales & Invoices</span>
                    </div>
                    <div
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium"
                      style={{ color: sidebarColor }}
                    >
                      <LuPackage size={15} style={{ color: sidebarColor }} />
                      <span>Product Catalog</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION C: THEME MODE (LIGHT / DARK) */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
                <div className="pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Interface Theme Mode
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select your preferred appearance for the entire workspace.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Light Mode Card */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof setColorMode === 'function') setColorMode('light');
                    }}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      colorMode === 'light'
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
                        colorMode === 'light'
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      <LuSun size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Light Mode
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Clean, bright daylight interface with sharp contrast.
                      </div>
                    </div>
                    {colorMode === 'light' && (
                      <LuCheck className="text-primary text-lg shrink-0 stroke-[3]" />
                    )}
                  </button>

                  {/* Dark Mode Card */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof setColorMode === 'function') setColorMode('dark');
                    }}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      colorMode === 'dark'
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/10 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
                        colorMode === 'dark'
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600'
                      }`}
                    >
                      <LuMoon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Dark Mode
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Sleek low-light aesthetic reducing eye strain.
                      </div>
                    </div>
                    {colorMode === 'dark' && (
                      <LuCheck className="text-primary text-lg shrink-0 stroke-[3]" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
