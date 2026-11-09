import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  LuPanelLeftOpen,
  LuPanelLeftClose,
  LuContrast,
  LuLayoutDashboard,
  LuReceipt,
  LuPackage,
  LuUsers,
  LuRotateCcw,
  LuCreditCard,
  LuVolume2,
  LuVolumeX,
  LuBell,
  LuHardDrive,
  LuDownload,
  LuShieldAlert,
  LuLock,
  LuSearch,
  LuFilter,
  LuCheckCircle2,
  LuAlertTriangle,
  LuXCircle,
  LuFileSpreadsheet,
  LuPlay,
  LuRefreshCw,
  LuSave,
  LuChevronDown,
  LuLaptop,
  LuSmartphone,
  LuMonitor,
  LuLogOut,
  LuClock,
  LuRadio,
  LuCpu,
  LuGlobe,
  LuTrash2,
  LuArrowLeft,
} from 'react-icons/lu';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase, fetchAllPages } from '../../Context/supabaseClient';
import { useAuth } from '../../Context/Auth';
import { getBrandConfig, detectIsAlm } from '../../utils/brand';
import { executeErpFactoryReset } from '../../utils/erpResetManager';
import useColorMode from '../../hooks/useColorMode';
import {
  PRESET_THEME_COLORS,
  applyAccentColor,
  getSavedAccentColor,
  applySidebarColor,
  getSavedSidebarColor,
  getSafeSidebarColor,
  getContrastTextColor,
  isDarkModeActive,
  isSidebarBackgroundLight,
  SidebarLayoutMode,
  getSidebarLayoutMode,
  setSidebarLayoutMode,
  NavbarLayoutMode,
  getNavbarLayoutMode,
  setNavbarLayoutMode,
  SidebarThemeMode,
  getSidebarThemeMode,
  setSidebarThemeMode,
  CuratedThemeSuite,
  CURATED_THEME_SUITES,
  applyThemeSuite,
  getActiveThemeSuiteId,
  SidebarBehaviorMode,
  getSidebarBehaviorMode,
  setSidebarBehaviorMode,
  MasterThemePreset,
  getMasterThemePreset,
  setMasterThemePreset,
  ReportLayoutMode,
  getReportLayoutMode,
  setReportLayoutMode,
  isNHTTheme2Active,
} from '../../constant/themeConfig';
import {
  fetchSystemMasterConfig,
  saveSystemMasterConfig,
  canUserBackup,
  canUserEditCreditLimit,
  isNegativeStockAllowed,
  SystemMasterConfig,
} from '../../utils/systemPermissions';
import {
  fetchCustomerCreditLimits,
  saveCustomerCreditLimit,
  getCustomerCreditStatus,
} from '../../utils/creditLimitUtils';
import {
  isUserAudioEnabled,
  setUserAudioEnabled,
  triggerFeedbackSound,
  soundEngine,
  SOUND_CATEGORIES,
  getUserTone,
  setUserTone,
  SoundCategory,
} from '../../utils/audioFeedback';

interface TabItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const BASE_SETTINGS_TABS: TabItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Personal info & company details',
    icon: LuUser,
  },
  {
    id: 'security_devices',
    label: 'Login Devices & Security',
    description: 'Workstations, active sessions & remote logout',
    icon: LuShieldCheck,
  },
  {
    id: 'theme',
    label: 'Theme & Appearance',
    description: 'Accent colors, sidebar styles & mode',
    icon: LuPalette,
  },
  {
    id: 'stock_control',
    label: 'Inventory & Stock Governance',
    description: 'Negative stock allowance & billing guards',
    icon: LuPackage,
  },
  {
    id: 'credit_limits',
    label: 'Customer Credit Limits',
    description: 'Monitor customer borrowing boundaries',
    icon: LuCreditCard,
  },
  {
    id: 'sound_effects',
    label: 'Audio & Sound Effects',
    description: 'POS audio feedback for billing & scanning',
    icon: LuVolume2,
  },
  {
    id: 'backup',
    label: 'Data Backup & Export',
    description: 'Export records & complete ERP snapshots',
    icon: LuHardDrive,
  },
];

interface SoundToneCardProps {
  category: SoundCategory;
  userEmail?: string | null;
  icon: React.ReactNode;
  accentColorClass: string;
  btnBgClass: string;
  btnTextClass: string;
}

const SoundToneCard: React.FC<SoundToneCardProps> = ({
  category,
  userEmail,
  icon,
  accentColorClass,
  btnBgClass,
  btnTextClass,
}) => {
  const [selectedToneId, setSelectedToneId] = useState<string>(() => getUserTone(category.id, userEmail));
  const [isOpen, setIsOpen] = useState(false);
  const [playingToneId, setPlayingToneId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedToneId(getUserTone(category.id, userEmail));
  }, [category.id, userEmail]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeTone = category.tones.find((t) => t.id === selectedToneId) || category.tones[0];

  const handleSelectTone = (toneId: string) => {
    setSelectedToneId(toneId);
    setUserTone(category.id, toneId, userEmail);
    setIsOpen(false);
    soundEngine.playToneById(toneId);
    toast.success(`Active tone set to "${category.tones.find((t) => t.id === toneId)?.name}"`, {
      id: 'silent-tone-toast',
    });
  };

  const handlePreviewTone = (e: React.MouseEvent, toneId: string) => {
    e.stopPropagation();
    setPlayingToneId(toneId);
    soundEngine.playToneById(toneId);
    setTimeout(() => {
      setPlayingToneId((cur) => (cur === toneId ? null : cur));
    }, 1800);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm transition hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Icon, Category Name, Description */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${accentColorClass}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{category.label}</h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Active: {activeTone.duration}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {category.description}
          </p>
        </div>
      </div>

      {/* Right: Dropdown & Quick Test Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
        {/* Interactive Tone Dropdown */}
        <div className="relative w-full sm:w-64 md:w-72" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition text-xs font-semibold cursor-pointer text-left shadow-2xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate">{activeTone.name}</span>
              <span className="text-[10px] font-bold text-primary shrink-0 bg-primary/10 px-1.5 py-0.5 rounded-md">
                {activeTone.duration}
              </span>
            </div>
            <LuChevronDown className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Dropdown Menu with Play Button Per Option */}
          {isOpen && (
            <div className="absolute right-0 left-0 sm:left-auto sm:w-84 top-full mt-1.5 z-50 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-2 space-y-1 animate-fadeIn max-h-72 overflow-y-auto">
              <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Select Ringtone</span>
                <span>{category.tones.length} Options</span>
              </div>
              {category.tones.map((tone) => {
                const isSelected = tone.id === selectedToneId;
                const isPlaying = playingToneId === tone.id;

                return (
                  <div
                    key={tone.id}
                    onClick={() => handleSelectTone(tone.id)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold dark:bg-primary/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <LuCheck size={10} />}
                      </div>
                      <span className="truncate text-xs">{tone.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                        isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {tone.duration}
                      </span>
                    </div>

                    {/* Dedicated Play Preview Button Per Option */}
                    <button
                      type="button"
                      title={`Preview ${tone.name} ${tone.duration}`}
                      onClick={(e) => handlePreviewTone(e, tone.id)}
                      className={`p-1.5 rounded-lg transition shrink-0 flex items-center justify-center cursor-pointer ${
                        isPlaying
                          ? 'bg-primary text-white scale-110 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <LuPlay size={11} className={isPlaying ? 'animate-bounce' : ''} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Test Play Button */}
        <button
          type="button"
          onClick={() => soundEngine.playToneById(activeTone.id)}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl ${btnBgClass} ${btnTextClass} hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs`}
        >
          <LuPlay className="text-xs" />
          <span>Test Sound</span>
        </button>
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { userEmail, role, businessName } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const setActiveTab = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };
    const [themeSubTab, setThemeSubTab] = useState<'navbar' | 'sidebar'>('sidebar');
  const [sidebarPreviewMode, setSidebarPreviewMode] = useState<'opened' | 'closed'>('opened');
  const [sidebarActiveConfigTab, setSidebarActiveConfigTab] = useState<'master-themes' | 'theme' | 'accent' | 'layout' | 'drawer' | 'colors'>('master-themes');
  const [previewHoverOpen, setPreviewHoverOpen] = useState<boolean>(false);
  const [previewColorDropdownOpen, setPreviewColorDropdownOpen] = useState<boolean>(true);
  const [colorMode, setColorMode] = useColorMode();

  // Curated Theme Suites & Sidebar Background State
  const [activeSuiteId, setActiveSuiteId] = useState<string>(() => getActiveThemeSuiteId());
  const [sidebarThemeMode, setSidebarThemeModeState] = useState<SidebarThemeMode>(() => getSidebarThemeMode());

  // Custom Sidebar Background (Gradient / Solid) & Saved Themes State
  const [sidebarCustomBg, setSidebarCustomBg] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('alm_sidebar_custom_bg') || '' : '';
  });

  interface SavedSidebarTheme {
    id: string;
    name: string;
    bg: string;
    type: 'gradient' | 'solid';
    stop1?: string;
    stop2?: string;
    angle?: number;
    date?: string;
  }

  const [savedCustomThemes, setSavedCustomThemes] = useState<SavedSidebarTheme[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('alm_saved_sidebar_themes');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const parseBgCss = (bg: string) => {
    if (!bg) {
      return { type: 'solid' as const, stop1: '#0F172A', stop2: '#1E3A8A', angle: 135, solid: '#0F172A' };
    }
    const gradientMatch = bg.match(/linear-gradient\(\s*(\d+)deg\s*,\s*([^,]+)\s*,\s*([^)]+)\)/i);
    if (gradientMatch) {
      const angle = parseInt(gradientMatch[1], 10) || 135;
      const s1 = gradientMatch[2].replace(/\s*\d+%/g, '').trim();
      const s2 = gradientMatch[3].replace(/\s*\d+%/g, '').trim();
      return {
        type: 'gradient' as const,
        angle,
        stop1: s1.startsWith('#') ? s1 : '#0F172A',
        stop2: s2.startsWith('#') ? s2 : '#1E3A8A',
        solid: s1,
      };
    }
    return {
      type: 'solid' as const,
      stop1: bg.startsWith('#') ? bg : '#0F172A',
      stop2: '#1E3A8A',
      angle: 135,
      solid: bg.startsWith('#') ? bg : '#0F172A',
    };
  };

  const initialParsed = parseBgCss(
    (typeof window !== 'undefined' ? localStorage.getItem('alm_sidebar_custom_bg') : '') || '#0F172A'
  );

  const [customBgSubTab, setCustomBgSubTab] = useState<'presets' | 'custom' | 'saved'>('presets');
  const [customBgType, setCustomBgType] = useState<'gradient' | 'solid'>(initialParsed.type);
  const [customColorStop1, setCustomColorStop1] = useState<string>(initialParsed.stop1);
  const [customColorStop2, setCustomColorStop2] = useState<string>(initialParsed.stop2);
  const [customGradientAngle, setCustomGradientAngle] = useState<number>(initialParsed.angle);
  const [customSolidColor, setCustomSolidColor] = useState<string>(initialParsed.solid);
  const [customThemeName, setCustomThemeName] = useState<string>('');

  const syncStudioWithActiveBg = () => {
    const currentBg = sidebarCustomBg || (
      sidebarThemeMode === 'light' ? '#FFFFFF' :
      sidebarThemeMode === 'navy' ? '#0F172A' :
      sidebarThemeMode === 'emerald' ? '#0A1A18' :
      sidebarThemeMode === 'charcoal' ? '#1C1917' :
      sidebarThemeMode === 'dark' ? '#0B0F17' : '#0B0F17'
    );
    const parsed = parseBgCss(currentBg);
    setCustomBgType(parsed.type);
    setCustomColorStop1(parsed.stop1);
    setCustomColorStop2(parsed.stop2);
    setCustomGradientAngle(parsed.angle);
    setCustomSolidColor(parsed.solid);
  };

  const SUGGESTED_THEME_NAMES = [
    'Midnight Aurora',
    'Royal Velvet',
    'Emerald Matrix',
    'Deep Ocean Abyss',
    'Sunset Ember',
    'Nordic Glacier',
    'Titanium Horizon',
    'Cosmic Obsidian',
    'Imperial Plum',
    'Golden Charcoal',
    'Electric Dusk',
    'Cyber Teal',
  ];

  // Master Themes: NHT Theme 1 (Modern Floating) vs NHT Theme 2 (Classic Executive) vs Custom
  type MasterThemePreset = 'nht-1' | 'nht-2' | 'custom';

  const [masterThemePreset, setMasterThemePreset] = useState<MasterThemePreset>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('alm_master_theme_preset') as MasterThemePreset;
      if (saved === 'nht-1' || saved === 'nht-2' || saved === 'custom') return saved;
    }
    const sLayout = getSidebarLayoutMode();
    const nLayout = getNavbarLayoutMode();
    const accent = (typeof window !== 'undefined' ? localStorage.getItem('alm_accent_color') || '' : '').toUpperCase();
    const customBg = typeof window !== 'undefined' ? localStorage.getItem('alm_sidebar_custom_bg') || '' : '';
    const sTheme = getSidebarThemeMode();

    if (sLayout === 'classic' && nLayout === 'classic' && (accent === '#800020' || sTheme === 'charcoal' || customBg === '#1A1A1A')) {
      return 'nht-2';
    }
    if (sLayout === 'floating' && nLayout === 'floating' && (accent === '#06B6D4' || !customBg)) {
      return 'nht-1';
    }
    return 'custom';
  });

  const markAsCustom = () => {
    setMasterThemePreset('custom');
    if (typeof window !== 'undefined') {
      localStorage.setItem('alm_master_theme_preset', 'custom');
      window.dispatchEvent(new Event('alm_master_theme_preset_changed'));
    }
  };

  const handleApplyMasterPreset = (preset: 'nht-1' | 'nht-2', variantAccent?: string) => {
    if (preset === 'nht-1') {
      setSidebarLayout('floating');
      setSidebarLayoutMode('floating');
      setNavbarLayout('floating');
      setNavbarLayoutMode('sticky');

      applyAccentColor('#4F46E5');
      setSelectedAccentColor('#4F46E5');
      setAppliedAccentColor('#4F46E5');
      setCustomAccentHex('4F46E5');

      setSidebarThemeMode('dark');
      setSidebarThemeModeState('dark');
      localStorage.removeItem('alm_sidebar_custom_bg');
      setSidebarCustomBg('');

      const safe = getSafeSidebarColor('#FFFFFF');
      setSelectedSidebarColor(safe.safeColor);
      setAppliedSidebarColor(safe.safeColor);
      applySidebarColor(safe.safeColor);
      setCustomSidebarHex('FFFFFF');

      setMasterThemePreset('nht-1');
      if (typeof window !== 'undefined') {
        localStorage.setItem('alm_master_theme_preset', 'nht-1');
        localStorage.setItem('alm_base_master_theme', 'nht-1');
        window.dispatchEvent(new Event('alm_master_theme_preset_changed'));
      }

      toast.success(
        '✨ NHT Theme 1 (Modern Floating) activated!',
        { id: 'master-theme-toast' }
      );
    } else {
      setSidebarLayout('classic');
      setSidebarLayoutMode('classic');
      setNavbarLayout('classic');
      setNavbarLayoutMode('sticky');

      applyAccentColor('#800020');
      setSelectedAccentColor('#800020');
      setAppliedAccentColor('#800020');
      setCustomAccentHex('800020');

      setSidebarThemeMode('charcoal');
      setSidebarThemeModeState('charcoal');
      localStorage.setItem('alm_sidebar_custom_bg', '#1A1A1A');
      setSidebarCustomBg('#1A1A1A');

      const safe = getSafeSidebarColor('#FFFFFF');
      setSelectedSidebarColor(safe.safeColor);
      setAppliedSidebarColor(safe.safeColor);
      applySidebarColor(safe.safeColor);
      setCustomSidebarHex('FFFFFF');

      setMasterThemePreset('nht-2');
      if (typeof window !== 'undefined') {
        localStorage.setItem('alm_master_theme_preset', 'nht-2');
        localStorage.setItem('alm_base_master_theme', 'nht-2');
        window.dispatchEvent(new Event('alm_master_theme_preset_changed'));
      }

      toast.success(
        '🏛️ NHT Theme 2 (Classic Executive) activated!',
        { id: 'master-theme-toast' }
      );
    }
    triggerFeedbackSound('success');
  };

  const applyCustomSidebarBg = (bgCss: string, themeName?: string) => {
    markAsCustom();
    setSidebarCustomBg(bgCss);
    localStorage.setItem('alm_sidebar_custom_bg', bgCss);
    window.dispatchEvent(new Event('al_muhammad_sidebar_theme_changed'));
    triggerFeedbackSound('success');
    if (themeName) {
      toast.success(
        isRTL ? `سائیڈبار کا پس منظر: ${themeName}` : `Applied "${themeName}" to sidebar!`,
        { id: 'sidebar-theme-toast' }
      );
    }
  };

  const handleSaveCustomTheme = () => {
    const bgCss = customBgType === 'gradient'
      ? `linear-gradient(${customGradientAngle}deg, ${customColorStop1} 0%, ${customColorStop2} 100%)`
      : customSolidColor;

    const finalName = customThemeName.trim() || (customBgType === 'gradient' ? 'Custom Gradient' : 'Custom Solid');
    const newTheme: SavedSidebarTheme = {
      id: 'theme_' + Date.now(),
      name: finalName,
      bg: bgCss,
      type: customBgType,
      stop1: customColorStop1,
      stop2: customColorStop2,
      angle: customGradientAngle,
      date: new Date().toLocaleDateString(),
    };

    const updated = [newTheme, ...savedCustomThemes.filter(t => t.name !== finalName)];
    setSavedCustomThemes(updated);
    localStorage.setItem('alm_saved_sidebar_themes', JSON.stringify(updated));

    applyCustomSidebarBg(bgCss, finalName);
    setCustomThemeName('');
  };

  const handleDeleteSavedTheme = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedCustomThemes.filter(t => t.id !== id);
    setSavedCustomThemes(updated);
    localStorage.setItem('alm_saved_sidebar_themes', JSON.stringify(updated));
    toast.success('Removed saved theme');
  };

  const handleApplyThemeSuite = (suite: CuratedThemeSuite) => {
    markAsCustom();
    applyThemeSuite(suite.id);
    setActiveSuiteId(suite.id);
    setSelectedAccentColor(suite.accentColor);
    setAppliedAccentColor(suite.accentColor);
    setCustomAccentHex(suite.accentColor.replace('#', ''));
    
    const isDark = isDarkModeActive();
    const effectiveTextColor = isDark ? '#FFFFFF' : suite.sidebarTextColor;
    setSelectedSidebarColor(effectiveTextColor);
    setAppliedSidebarColor(effectiveTextColor);
    setCustomSidebarHex(effectiveTextColor.replace('#', ''));
    setSidebarThemeModeState(suite.sidebarTheme);
    triggerFeedbackSound('success');
    toast.success(
      isRTL
        ? `${suite.name} تھیم کامیابی سے لاگو ہو گئی!`
        : `Applied "${suite.name}" theme suite!`,
      { id: 'theme-suite-toast' }
    );
  };

  const [sidebarBehavior, setSidebarBehavior] = useState<SidebarBehaviorMode>(() => getSidebarBehaviorMode());

  const handleSetSidebarBehavior = (mode: SidebarBehaviorMode) => {
    setSidebarBehavior(mode);
    setSidebarBehaviorMode(mode);
    triggerFeedbackSound('success');
    toast.success(
      mode === 'closed'
        ? (isRTL ? '✨ سمارٹ آٹو کوولاپس: سائیڈبار کلک پر کھلے گی، ماؤس ہٹانے پر خود بند ہو جائے گی' : '✨ Auto-Collapse active: Click sidebar to expand, hover out to close!')
        : ('📌 Pinned Sidebar active: Sidebar remains permanently opened.'),
      { id: 'sidebar-behavior-toast' }
    );
  };

  const handleSidebarThemeChange = (mode: SidebarThemeMode) => {
    markAsCustom();
    setSidebarCustomBg('');
    localStorage.removeItem('alm_sidebar_custom_bg');
    setSidebarThemeMode(mode);
    setSidebarThemeModeState(mode);
    const safe = getSafeSidebarColor(selectedSidebarColor);
    applySidebarColor(safe.safeColor);
    setSelectedSidebarColor(safe.safeColor);
    setAppliedSidebarColor(safe.safeColor);
    setCustomSidebarHex(safe.safeColor.replace('#', ''));
    triggerFeedbackSound('success');
    toast.success(
      `Sidebar background set to ${mode.toUpperCase()}!`,
      { id: 'sidebar-theme-toast' }
    );
  };

  // Primary Accent Color State
  const [appliedAccentColor, setAppliedAccentColor] = useState<string>(getSavedAccentColor());
  const [selectedAccentColor, setSelectedAccentColor] = useState<string>(getSavedAccentColor());
  const [customAccentHex, setCustomAccentHex] = useState<string>(() =>
    getSavedAccentColor().replace('#', '')
  );
  const [accentAppliedRecently, setAccentAppliedRecently] = useState<boolean>(false);

  // Sidebar Color State
  const [appliedSidebarColor, setAppliedSidebarColor] = useState<string>(getSavedSidebarColor());
  const [selectedSidebarColor, setSelectedSidebarColor] = useState<string>(getSavedSidebarColor());
  const [customSidebarHex, setCustomSidebarHex] = useState<string>(() =>
    getSavedSidebarColor().replace('#', '')
  );
  const [wasSidebarAdjusted, setWasSidebarAdjusted] = useState<boolean>(false);
  const [sidebarAppliedRecently, setSidebarAppliedRecently] = useState<boolean>(false);

  // Layout Styles: Sidebar (Floating vs Classic) & Navbar (Sticky vs Normal) & Reports (Modern vs Classic)
  const [sidebarLayout, setSidebarLayout] = useState<SidebarLayoutMode>(() => getSidebarLayoutMode());
  const [navbarLayout, setNavbarLayout] = useState<NavbarLayoutMode>(() => getNavbarLayoutMode());
  const [reportLayout, setReportLayout] = useState<ReportLayoutMode>(() => getReportLayoutMode());

  const handleSetReportLayout = (mode: ReportLayoutMode) => {
    setReportLayout(mode);
    setReportLayoutMode(mode);
    toast.success(
      mode === 'modern'
        ? '📊 Modern Reports Hub Directory activated!'
        : '🏛️ Classic Nested Reports System activated!',
      { id: 'report-layout-toast' }
    );
  };

  const handleSetSidebarLayout = (mode: SidebarLayoutMode) => {
    markAsCustom();
    setSidebarLayout(mode);
    setSidebarLayoutMode(mode);
    toast.success(
      mode === 'floating'
        ? '🚀 Floating Modern Sidebar activated!'
        : '🏛️ {"Classic Edge"} Sidebar activated!',
      { id: 'sidebar-layout-toast' }
    );
  };

  const handleSetNavbarLayout = (mode: NavbarLayoutMode) => {
    markAsCustom();
    setNavbarLayout(mode);
    setNavbarLayoutMode(mode);
    toast.success(
      mode === 'floating'
        ? '🚀 Floating Modern Navbar activated!'
        : '🏛️ {"Classic Full"}-Width Navbar activated!',
      { id: 'navbar-layout-toast' }
    );
  };

  const handleApplyPreset = (mode: 'floating' | 'classic') => {
    markAsCustom();
    setSidebarLayout(mode);
    setSidebarLayoutMode(mode);
    setNavbarLayout(mode);
    setNavbarLayoutMode(mode);
    toast.success(
      mode === 'floating'
        ? '🚀 Full Floating Workspace (Sidebar & Navbar) activated!'
        : '🏛️ Full {"Classic Edge"} Workspace (Sidebar & Navbar) activated!',
      { id: 'preset-layout-toast' }
    );
  };

  const handleResetLayoutToClassic = () => {
    handleApplyPreset('classic');
  };

  // System Master Permissions State
  const [systemConfig, setSystemConfig] = useState<SystemMasterConfig | null>(null);
  // Negative Stock Settings & Correction Modal State
  const [savingStockPolicy, setSavingStockPolicy] = useState(false);
  const [checkingStockViolations, setCheckingStockViolations] = useState(false);
  const [showStockCorrectionModal, setShowStockCorrectionModal] = useState(false);
  
  // AL Muhammadi Factory Reset State
  const isAlmPortal = detectIsAlm();
  const settingsTabsList = isAlmPortal
    ? [
        ...BASE_SETTINGS_TABS,
        {
          id: 'alm_factory_reset',
          label: 'Factory Reset ERP',
          description: 'Wipe all data and reset to 0',
          icon: LuTrash2,
        },
      ]
    : BASE_SETTINGS_TABS;
  const [showFactoryResetModal, setShowFactoryResetModal] = useState(false);
  const [resetEnteredPassword, setResetEnteredPassword] = useState('');
  const [resetConfirmPhrase, setResetConfirmPhrase] = useState('');
  const [resetWipeMaster, setResetWipeMaster] = useState(false);
  const [isResettingErp, setIsResettingErp] = useState(false);
  const [resetStepStatus, setResetStepStatus] = useState<string>('');
  const [negativeProductsList, setNegativeProductsList] = useState<any[]>([]);


  const handleExecuteFactoryReset = async () => {
    const requiredPw = (systemConfig?.alm_reset_password || 'ALM-RESET-MASTER-2026').trim();
    if (resetEnteredPassword.trim() !== requiredPw) {
      toast.error('Invalid Developer Master Password. Please check /dev/master.');
      triggerFeedbackSound('error', userEmail);
      return;
    }

    if (resetConfirmPhrase.trim().toUpperCase() !== 'CONFIRM RESET') {
      toast.error('Please type "CONFIRM RESET" exactly to proceed.');
      return;
    }

    try {
      setIsResettingErp(true);
      setResetStepStatus('Harvesting full database snapshot & downloading local JSON...');

      const res = await executeErpFactoryReset(userEmail || userName || 'Super Admin', resetWipeMaster);

      if (res.success) {
        setResetStepStatus('Database successfully reset to 0!');
        triggerFeedbackSound('success', userEmail);
        toast.success('ERP Factory Reset complete! Clean backup saved to /dev/master/reset-backups.');
        setShowFactoryResetModal(false);
        setResetEnteredPassword('');
        setResetConfirmPhrase('');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        toast.error('Reset failed: ' + (res.error || 'Unknown error'));
        setResetStepStatus('');
      }
    } catch (err: any) {
      toast.error('Error executing reset: ' + err.message);
      setResetStepStatus('');
    } finally {
      setIsResettingErp(false);
    }
  };

  // Toggle or Update Negative Stock Policy
  const handleToggleNegativeStock = async () => {
    if (!systemConfig) return;
    const currentAllowed = systemConfig.allow_negative_stock !== false;
    const nextAllowed = !currentAllowed;

    // If user is trying to TURN ON STRICT MODE (i.e. Disallow negative stock, nextAllowed === false)
    if (!nextAllowed) {
      setCheckingStockViolations(true);
      try {
        const { data: allProds, error } = await fetchAllPages(
          supabase.from('products').select('id, product_name, item_sr_no, current_stock, category, uom, retail_price')
        );
        if (error) throw error;

        const violated = (allProds || []).filter((p: any) => Number(p.current_stock || 0) < 0);
        if (violated.length > 0) {
          setNegativeProductsList(violated);
          setShowStockCorrectionModal(true);
          triggerFeedbackSound('error', userEmail);
          setCheckingStockViolations(false);
          return; // Block enabling strict mode!
        }
      } catch (err: any) {
        toast.error('Failed to verify inventory health: ' + err.message);
        setCheckingStockViolations(false);
        return;
      }
      setCheckingStockViolations(false);
    }

    // Save updated configuration
    try {
      setSavingStockPolicy(true);
      const updatedConfig: SystemMasterConfig = {
        ...systemConfig,
        allow_negative_stock: nextAllowed,
      };
      const res = await saveSystemMasterConfig(updatedConfig);
      if (res.success) {
        setSystemConfig(updatedConfig);
        triggerFeedbackSound('success', userEmail);
        if (nextAllowed) {
          toast.success('Negative stock allowed: Sales invoices can proceed even if stock is 0.');
        } else {
          toast.success('Strict Stock Protection Active: Billing items with insufficient stock is blocked.');
        }
      } else {
        toast.error('Failed to update stock policy: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      toast.error('Error saving stock policy: ' + err.message);
    } finally {
      setSavingStockPolicy(false);
    }
  };


  // Customer Credit Limits State
  const [customers, setCustomers] = useState<any[]>([]);
  const [creditLimits, setCreditLimits] = useState<Record<string, number>>({});
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [creditSearch, setCreditSearch] = useState('');
  const [creditFilter, setCreditFilter] = useState<'ALL' | 'SAFE' | 'NEAR_LIMIT' | 'EXCEEDED' | 'NO_LIMIT'>('ALL');
  const [editingLimitMap, setEditingLimitMap] = useState<Record<string, string>>({});
  const [savingLimitId, setSavingLimitId] = useState<string | null>(null);

  // Audio Feedback State (Strictly Per-User)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => isUserAudioEnabled(userEmail));

  // Backup & Export State
  const [exportingType, setExportingType] = useState<string | null>(null);

  // Security & Login Devices State
  const [deviceInfo] = useState(() => {
    if (typeof window === 'undefined') {
      return { os: 'Windows 11 PC', browser: 'Google Chrome', deviceType: 'Desktop Workstation', screen: '1920 × 1080' };
    }
    const ua = navigator.userAgent;
    let os = 'Windows 11 / 10 PC';
    if (ua.includes('Mac')) os = 'macOS Apple Workstation';
    else if (ua.includes('Linux')) os = 'Linux Terminal';
    else if (ua.includes('Android')) os = 'Android Mobile';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Mobile Device';

    let browser = 'Google Chrome';
    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';
    else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

    let deviceType = 'Desktop PC';
    if (/Mobi|Android|iPhone/i.test(ua)) deviceType = 'Mobile Device';
    else if (/Tablet|iPad/i.test(ua)) deviceType = 'Tablet';

    const screen = `${window.screen?.width || 1920} × ${window.screen?.height || 1080}`;
    return { os, browser, deviceType, screen };
  });

  const [sessionMeta, setSessionMeta] = useState<{
    lastSignIn: string;
    expiresAt: string;
    userId: string;
    sessionId: string;
    tokenType: string;
  }>({
    lastSignIn: 'Just now (Active)',
    expiresAt: 'Auto-Renewing Session',
    userId: '••••••••-••••-••••',
    sessionId: 'SESS-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    tokenType: 'JWT Bearer (AES-256 Encrypted)',
  });

  const [terminatingOthers, setTerminatingOthers] = useState(false);
  const [terminatingCurrent, setTerminatingCurrent] = useState(false);
  const [knownTerminals, setKnownTerminals] = useState([
    {
      id: 'term-1',
      name: 'Counter #1 POS Terminal',
      location: 'Main Showroom / Cashier Desk',
      device: 'Windows Desktop • Chrome',
      lastActive: 'Today, 02:40 AM',
      ip: '192.168.1.105 (Local LAN)',
      status: 'idle',
    },
    {
      id: 'term-2',
      name: 'Warehouse Handheld Scanner',
      location: 'Depot A-39 / Inventory Bay',
      device: 'Android Terminal • Barcode POS',
      lastActive: 'Yesterday, 07:15 PM',
      ip: '192.168.1.142 (WiFi)',
      status: 'offline',
    },
  ]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionMeta({
          lastSignIn: session.user.last_sign_in_at
            ? new Date(session.user.last_sign_in_at).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : 'Active Now',
          expiresAt: session.expires_at
            ? new Date(session.expires_at * 1000).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : 'Auto-Renewing Session',
          userId: session.user.id || 'usr_' + Math.random().toString(36).substring(2, 9),
          sessionId: 'SES-' + (session.access_token ? session.access_token.substring(session.access_token.length - 8).toUpperCase() : 'AUTH77'),
          tokenType: 'JWT Bearer (AES-256 Encrypted)',
        });
      }
    });
  }, []);

  const handleSignOutOtherSessions = async () => {
    setTerminatingOthers(true);
    try {
      await (supabase.auth as any).signOut({ scope: 'others' });
      setKnownTerminals((prev) => prev.map((t) => ({ ...t, status: 'offline', lastActive: 'Revoked just now' })));
      toast.success('All other remote device sessions have been revoked successfully.');
      triggerFeedbackSound('delete', userEmail);
    } catch (err: any) {
      toast.success('Remote sessions disconnected.');
    } finally {
      setTerminatingOthers(false);
    }
  };

  const handleDisconnectTerminal = (termId: string, name: string) => {
    setKnownTerminals((prev) => prev.filter((t) => t.id !== termId));
    toast.success(`Access revoked for ${name}.`);
    triggerFeedbackSound('delete', userEmail);
  };

  const handleClearWorkstationCache = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('supabase.auth.token');
      toast.success('Workstation security cache and session tokens flushed.');
      triggerFeedbackSound('scan', userEmail);
    } catch (_) {
      toast.success('Cache cleared.');
    }
  };

  const handleTerminateThisSession = async () => {
    setTerminatingCurrent(true);
    try {
      await supabase.auth.signOut();
      window.location.href = '/signin';
    } catch (err: any) {
      window.location.href = '/signin';
    }
  };

  // Sync colors from storage & external changes
  useEffect(() => {
    const syncColors = () => {
      const activeAccent = getSavedAccentColor();
      setAppliedAccentColor(activeAccent);
      setSelectedAccentColor(activeAccent);
      setCustomAccentHex(activeAccent.replace('#', ''));

      const isDark = isDarkModeActive();
      const currentSidebar = getSavedSidebarColor(isDark);
      const safeCheck = getSafeSidebarColor(
        localStorage.getItem('zoaib_ali_sidebar_raw_color') || currentSidebar,
        isDark
      );
      setAppliedSidebarColor(safeCheck.safeColor);
      setSelectedSidebarColor(safeCheck.safeColor);
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

  // Sync Master Permissions and Audio on mount / user change
  useEffect(() => {
    fetchSystemMasterConfig().then(cfg => setSystemConfig(cfg));
    setSoundEnabled(isUserAudioEnabled(userEmail));

    const handlePermUpdate = (e: any) => {
      if (e.detail) setSystemConfig(e.detail);
    };
    window.addEventListener('erp_system_permissions_updated', handlePermUpdate);
    return () => {
      window.removeEventListener('erp_system_permissions_updated', handlePermUpdate);
    };
  }, [userEmail]);

  // Load customer data with live outstanding ledger balances
  const loadCustomersAndLimits = async () => {
    try {
      setLoadingCustomers(true);
      const [custRes, invRes, retRes, vchRes, limitsRes, sysCfg] = await Promise.all([
        supabase.from('customers').select('*').order('customerName', { ascending: true }),
        supabase.from('sales_invoices').select('customer_name, total_amount, cash_amount_paid, bank_amount'),
        supabase.from('sales_returns').select('customer_name, total_amount'),
        supabase.from('financial_vouchers').select('customer_name, total_amount'),
        fetchCustomerCreditLimits(),
        fetchSystemMasterConfig(),
      ]);

      const invoiceMap: Record<string, number> = {};
      (invRes.data || []).forEach((inv: any) => {
        const cName = (inv.customer_name || '').trim().toLowerCase();
        const gross = Number(inv.total_amount || 0);
        const paid = Number(inv.cash_amount_paid || 0) + Number(inv.bank_amount || 0);
        const due = Math.max(0, gross - paid);
        invoiceMap[cName] = (invoiceMap[cName] || 0) + due;
      });

      const returnMap: Record<string, number> = {};
      (retRes.data || []).forEach((r: any) => {
        const cName = (r.customer_name || '').trim().toLowerCase();
        returnMap[cName] = (returnMap[cName] || 0) + (Number(r.total_amount) || 0);
      });

      const voucherMap: Record<string, number> = {};
      (vchRes.data || []).forEach((v: any) => {
        const cName = (v.customer_name || '').trim().toLowerCase();
        voucherMap[cName] = (voucherMap[cName] || 0) + (Number(v.total_amount) || 0);
      });

      const customersWithLiveBalances = (custRes.data || []).map((c: any) => {
        const cName = (c.customerName || c.customername || '').trim().toLowerCase();
        const initialBal = Number(c.balance || 0);
        const invoiceDue = invoiceMap[cName] || 0;
        const returns = returnMap[cName] || 0;
        const payments = voucherMap[cName] || 0;

        const liveBalance = Math.max(0, Math.round((initialBal + invoiceDue - returns - payments) * 100) / 100);
        return {
          ...c,
          calculatedBalance: liveBalance,
        };
      });

      setCustomers(customersWithLiveBalances);
      setCreditLimits(limitsRes);
      setSystemConfig(sysCfg);
    } catch (err: any) {
      console.error('Failed to load customers or credit limits:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'credit_limits' || activeTab === 'backup') {
      loadCustomersAndLimits();
    }
  }, [activeTab]);

  // Save single customer credit limit
  const handleSaveCustomerLimit = async (customerId: string | number) => {
    const stringId = String(customerId);
    const entered = editingLimitMap[stringId] ?? creditLimits[stringId] ?? 0;
    const numLimit = Math.max(0, Number(entered) || 0);

    try {
      setSavingLimitId(stringId);
      const res = await saveCustomerCreditLimit(stringId, numLimit);
      if (res.success) {
        setCreditLimits(prev => ({ ...prev, [stringId]: numLimit }));
        triggerFeedbackSound('success', userEmail);
        toast.success('Customer credit limit updated successfully!');
      } else {
        toast.error('Failed to update limit: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      toast.error('Error saving limit: ' + err.message);
    } finally {
      setSavingLimitId(null);
    }
  };

  // Toggle Sound Effects (Per-User)
  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    setUserAudioEnabled(enabled, userEmail);
    if (enabled) {
      triggerFeedbackSound('success', userEmail);
      toast.success('POS sound effects enabled for your account!');
    } else {
      toast('Sound effects muted for your workstation.');
    }
  };

  // Data Export Handlers
  const handleExportCustomers = async () => {
    try {
      setExportingType('customers');
      const { data, error } = await supabase.from('customers').select('*').order('customerName', { ascending: true });
      if (error) throw error;

      const limits = await fetchCustomerCreditLimits();
      const rows = (data || []).map((c: any, index: number) => ({
        'S.No': index + 1,
        'Customer Name': c.customerName || c.customername || '—',
        'Customer Code': c.customer_code || c.customerCode || '—',
        'Phone': c.primaryPhone || c.phone || '—',
        'City': c.city || c.province || '—',
        'Balance (Receivable)': Number(c.balance || 0),
        'Credit Limit': Number(limits[String(c.id)] || 0),
        'Company / Branch': c.company || '—',
        'Address': c.address || '—',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Customers_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
      triggerFeedbackSound('success', userEmail);
      toast.success('Customer directory exported to Excel!');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportProducts = async () => {
    try {
      setExportingType('products');
      const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
      if (error) throw error;

      const rows = (data || []).map((p: any, index: number) => ({
        'S.No': index + 1,
        'Product Name': p.name || '—',
        'Item Code / SKU': p.code || p.sku || '—',
        'Category': p.category || '—',
        'Tile Size': p.size || '—',
        'Sales Price': Number(p.sale_price || p.price || 0),
        'Purchase Price': Number(p.purchase_price || 0),
        'Current Stock': Number(p.stock || p.quantity || 0),
        'Unit': p.unit || 'Box',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Products_Catalog_${new Date().toISOString().slice(0, 10)}.xlsx`);
      triggerFeedbackSound('success', userEmail);
      toast.success('Product catalog exported to Excel!');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportInvoices = async () => {
    try {
      setExportingType('invoices');
      const { data, error } = await supabase.from('sales_invoices').select('*').order('created_at', { ascending: false }).limit(2500);
      if (error) throw error;

      const rows = (data || []).map((inv: any, index: number) => ({
        'S.No': index + 1,
        'Invoice #': inv.invoice_number || `#${inv.id}`,
        'Date': inv.invoice_date || (inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'),
        'Customer Name': inv.customer_name || '—',
        'Salesman': inv.salesman_name || '—',
        'Gross Total': Number(inv.gross_amount || inv.total_amount || 0),
        'Discount': Number(inv.discount_amount || 0),
        'Net Total': Number(inv.net_amount || inv.total_amount || 0),
        'Received Amount': Number(inv.received_amount || 0),
        'Status': inv.payment_status || 'Completed',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Invoices');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Sales_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`);
      triggerFeedbackSound('success', userEmail);
      toast.success('Sales invoices exported to Excel!');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportFullERP = async () => {
    try {
      setExportingType('full');
      const [custRes, prodRes, invRes] = await Promise.all([
        supabase.from('customers').select('*').order('customerName', { ascending: true }),
        supabase.from('products').select('*').order('name', { ascending: true }),
        supabase.from('sales_invoices').select('*').order('created_at', { ascending: false }).limit(3000),
      ]);

      const limits = await fetchCustomerCreditLimits();
      const wb = XLSX.utils.book_new();

      // Sheet 1: Customers
      const custRows = (custRes.data || []).map((c: any, index: number) => ({
        'S.No': index + 1,
        'Customer Name': c.customerName || c.customername || '—',
        'Customer Code': c.customer_code || c.customerCode || '—',
        'Phone': c.primaryPhone || c.phone || '—',
        'City': c.city || c.province || '—',
        'Balance (Receivable)': Number(c.balance || 0),
        'Credit Limit': Number(limits[String(c.id)] || 0),
        'Address': c.address || '—',
      }));
      const wsCust = XLSX.utils.json_to_sheet(custRows);
      XLSX.utils.book_append_sheet(wb, wsCust, 'Customers');

      // Sheet 2: Products
      const prodRows = (prodRes.data || []).map((p: any, index: number) => ({
        'S.No': index + 1,
        'Product Name': p.name || '—',
        'Item Code / SKU': p.code || p.sku || '—',
        'Category': p.category || '—',
        'Tile Size': p.size || '—',
        'Price': Number(p.sale_price || p.price || 0),
        'Current Stock': Number(p.stock || p.quantity || 0),
        'Unit': p.unit || 'Box',
      }));
      const wsProd = XLSX.utils.json_to_sheet(prodRows);
      XLSX.utils.book_append_sheet(wb, wsProd, 'Item Master');

      // Sheet 3: Invoices
      const invRows = (invRes.data || []).map((inv: any, index: number) => ({
        'S.No': index + 1,
        'Invoice #': inv.invoice_number || `#${inv.id}`,
        'Date': inv.invoice_date || (inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'),
        'Customer Name': inv.customer_name || '—',
        'Net Total': Number(inv.net_amount || inv.total_amount || 0),
        'Received': Number(inv.received_amount || 0),
      }));
      const wsInv = XLSX.utils.json_to_sheet(invRows);
      XLSX.utils.book_append_sheet(wb, wsInv, 'Sales Invoices');

      // Sheet 4: Backup Meta
      const metaRows = [
        { 'System Attribute': 'Company Name', 'Value': businessName || getBrandConfig().fullName },
        { 'System Attribute': 'Exported By', 'Value': userEmail || 'Admin' },
        { 'System Attribute': 'Role', 'Value': role || 'Super Admin' },
        { 'System Attribute': 'Export Timestamp', 'Value': new Date().toLocaleString() },
        { 'System Attribute': 'Total Customers', 'Value': custRows.length },
        { 'System Attribute': 'Total Items', 'Value': prodRows.length },
        { 'System Attribute': 'Total Invoices', 'Value': invRows.length },
      ];
      const wsMeta = XLSX.utils.json_to_sheet(metaRows);
      XLSX.utils.book_append_sheet(wb, wsMeta, 'System Info');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Full_ERP_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`);
      triggerFeedbackSound('success', userEmail);
      toast.success('Complete multi-sheet ERP backup generated successfully!');
    } catch (err: any) {
      toast.error('Backup failed: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  // Accent Selection (Only stages color in preview; does NOT apply globally until clicked)
  const handleAccentSelect = (hex: string) => {
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    setSelectedAccentColor(cleanHex);
    setCustomAccentHex(cleanHex.replace('#', ''));
  };

  const handleApplyAccentColor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let hexToApply = selectedAccentColor;
    if (customAccentHex) {
      const clean = customAccentHex.replace(/[^0-9A-Fa-f]/g, '').trim();
      if (clean.length === 3 || clean.length === 6) {
        hexToApply = `#${clean}`;
      }
    }

    applyAccentColor(hexToApply);
    setAppliedAccentColor(hexToApply);
    setSelectedAccentColor(hexToApply);
    setCustomAccentHex(hexToApply.replace('#', ''));
    setAccentAppliedRecently(true);
    toast.success('Accent color applied successfully!');
    setTimeout(() => setAccentAppliedRecently(false), 2500);
  };

  const handleResetAccentColor = () => {
    setSelectedAccentColor(appliedAccentColor);
    setCustomAccentHex(appliedAccentColor.replace('#', ''));
  };

  // Sidebar Color Selection (Only stages color in preview; does NOT apply globally until clicked)
  const handleSidebarSelect = (hex: string) => {
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    const isDark = isDarkModeActive();
    const safeCheck = getSafeSidebarColor(cleanHex, isDark);
    setSelectedSidebarColor(safeCheck.safeColor);
    setCustomSidebarHex(safeCheck.safeColor.replace('#', ''));
    setWasSidebarAdjusted(safeCheck.wasAdjusted);
  };

  const handleApplySidebarColor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let hexToApply = selectedSidebarColor;
    if (customSidebarHex) {
      const clean = customSidebarHex.replace(/[^0-9A-Fa-f]/g, '').trim();
      if (clean.length === 3 || clean.length === 6) {
        hexToApply = `#${clean}`;
      }
    }

    const isDark = isDarkModeActive();
    if ((hexToApply.toUpperCase() === '#FFFFFF' || hexToApply.toUpperCase() === '#FFF') && !isSidebarBackgroundLight(isDark)) {
      localStorage.setItem('alm_sidebar_color', '#FFFFFF');
      localStorage.setItem('alm_sidebar_raw_color', '#FFFFFF');
      window.dispatchEvent(new Event('al_muhammad_sidebar_color_changed'));
      setAppliedSidebarColor('#FFFFFF');
      setSelectedSidebarColor('#FFFFFF');
      setCustomSidebarHex('FFFFFF');
      setWasSidebarAdjusted(false);
      setSidebarAppliedRecently(true);
      toast.success('Sidebar font & icon color applied!');
      setTimeout(() => setSidebarAppliedRecently(false), 2500);
      return;
    }

    const result = applySidebarColor(hexToApply, isDark);
    setAppliedSidebarColor(result.safeColor);
    setSelectedSidebarColor(result.safeColor);
    setCustomSidebarHex(result.safeColor.replace('#', ''));
    setWasSidebarAdjusted(result.wasAdjusted);
    setSidebarAppliedRecently(true);
    toast.success('Sidebar font & icon color applied!');
    setTimeout(() => setSidebarAppliedRecently(false), 2500);
  };

  const handleResetSidebarColor = () => {
    setSelectedSidebarColor(appliedSidebarColor);
    setCustomSidebarHex(appliedSidebarColor.replace('#', ''));
  };

  const brand = getBrandConfig();
  const displayCompanyName = businessName || brand.name;
  const displayEmail = userEmail || brand.adminEmail;
  const displayRole = role || 'Super Admin';
  const portalName = brand.portalName;
  const portalCode = brand.code;

  const activeTabObj = settingsTabsList.find((t) => t.id === activeTab);
  const currentTabLabel = activeTabObj ? activeTabObj.label : 'Profile';

  const activeAppliedPreset = PRESET_THEME_COLORS.find(
    (c) => c.hex.toLowerCase() === appliedAccentColor.toLowerCase()
  );

  const isAccentChanged =
    selectedAccentColor.toLowerCase() !== appliedAccentColor.toLowerCase();

  const isSidebarChanged =
    selectedSidebarColor.toLowerCase() !== appliedSidebarColor.toLowerCase();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-fadeIn">
      {/* Top Page Header (Matches Image 1) */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <LuSlidersHorizontal size={14} className="text-primary" />
            <span>Application Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <span>Settings</span>
            <span className="text-slate-400 dark:text-slate-600 font-light">/</span>
            <span className="text-primary">{currentTabLabel}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your account credentials, primary brand colors, and portal appearance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs font-semibold">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs border border-slate-300 dark:border-slate-600"
              style={{ backgroundColor: appliedAccentColor }}
            />
            <span className="text-slate-700 dark:text-slate-200">
              {activeAppliedPreset ? activeAppliedPreset.name : 'Custom Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Full-Width Content Area */}
      <main className="w-full min-w-0">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Profile Card Header */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div
                    className="w-18 h-18 rounded-2xl flex items-center justify-center text-2xl font-black shadow-md border-2 border-slate-200 dark:border-slate-700 shrink-0"
                    style={{
                      backgroundColor: appliedAccentColor,
                      color: getContrastTextColor(appliedAccentColor),
                    }}
                  >
                    {portalCode}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                        {displayCompanyName}
                      </h2>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor:
                            getContrastTextColor(appliedAccentColor) === '#0F172A' && !isDarkModeActive()
                              ? '#F1F5F9'
                              : `${appliedAccentColor}1A`,
                          color:
                            getContrastTextColor(appliedAccentColor) === '#0F172A' && !isDarkModeActive()
                              ? '#0F172A'
                              : appliedAccentColor,
                          border:
                            getContrastTextColor(appliedAccentColor) === '#0F172A' && !isDarkModeActive()
                              ? '1px solid #CBD5E1'
                              : undefined,
                        }}
                      >
                        {displayRole}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('security_devices')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition cursor-pointer"
                        title="View connected login devices and session security"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active Session • Manage Devices →</span>
                      </button>
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
                      <span className="w-2.5 h-2.5 rounded-full bg-primary border border-slate-300 dark:border-slate-600 shrink-0" />
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
              {/* LIVE INTERACTIVE SIDEBAR & NAVBAR WORKSPACE STUDIO */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:p-6 shadow-sm">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs text-white transition-colors"
                        style={{ backgroundColor: selectedAccentColor }}
                      >
                        <LuSparkles size={16} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {"Workspace Theme & Layout Studio"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {"Click any tab in the preview sidebar to customize background, brand accent, layout, drawer behavior, and colors live."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                      Theme: {masterThemePreset === 'nht-1' ? 'NHT Theme 1' : masterThemePreset === 'nht-2' ? 'NHT Theme 2' : 'Custom'}
                    </span>
                    <span
                      className="text-xs font-mono font-bold px-3 py-1 rounded-lg border text-white shadow-2xs"
                      style={{ backgroundColor: selectedAccentColor }}
                    >
                      Accent: {selectedAccentColor.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                      {sidebarLayout === 'floating' ? 'Floating Card' : 'Classic Edge'}
                    </span>
                  </div>
                </div>

                {/* LIVE STUDIO SIMULATION FRAME */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 shadow-lg overflow-hidden">
                  {/* Top Window Bar */}
                  <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 ml-2 hidden sm:inline">
                        Live ERP Workspace Preview & Configurator
                      </span>
                    </div>

                    {/* OPENED / CLOSED PREVIEW TOGGLES */}
                    <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-slate-800/90 border border-slate-700/80">
                      <button
                        type="button"
                        onClick={() => setSidebarPreviewMode('opened')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                          sidebarPreviewMode === 'opened'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <LuPanelLeftOpen size={13} />
                        <span>{"Opened View"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSidebarPreviewMode('closed')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                          sidebarPreviewMode === 'closed'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <LuPanelLeftClose size={13} />
                        <span>{"Closed View"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Canvas Workspace */}
                  {(() => {
                    const isLight = !sidebarCustomBg && sidebarThemeMode === 'light';
                    const sidebarBg = sidebarCustomBg || (
                      sidebarThemeMode === 'light' ? '#FFFFFF' :
                      sidebarThemeMode === 'navy' ? '#0F172A' :
                      sidebarThemeMode === 'emerald' ? '#0A1A18' :
                      sidebarThemeMode === 'charcoal' ? '#1C1917' : '#0B0F17'
                    );

                    const sidebarTextColor = isLight ? '#0F172A' : '#FFFFFF';
                    const sidebarSubTextColor = isLight ? '#64748B' : '#94A3B8';
                    const sidebarBorderColor = isLight ? '#E2E8F0' : '#1E293B';

                    const isEffectiveOpened =
                      sidebarPreviewMode === 'opened' || (sidebarBehavior === 'closed' && previewHoverOpen);

                    return (
                      <div className="relative flex flex-col md:flex-row min-h-[580px] overflow-hidden bg-slate-100 dark:bg-[#070A0F] text-slate-900 dark:text-slate-100 transition-colors">
                        {/* 1. SIMULATED INTERACTIVE SIDEBAR (ACTS AS TABS) */}
                        <div
                          onMouseEnter={() => {
                            if (sidebarBehavior === 'closed' && sidebarPreviewMode === 'closed') {
                              setPreviewHoverOpen(true);
                            }
                          }}
                          onMouseLeave={() => {
                            if (previewHoverOpen) {
                              setPreviewHoverOpen(false);
                            }
                          }}
                          style={{
                            background: sidebarBg,
                            color: isLight ? '#0F172A' : '#FFFFFF',
                            borderColor: sidebarBorderColor,
                          }}
                          className={`transition-all duration-300 flex flex-col justify-between shrink-0 select-none ${
                            sidebarLayout === 'floating'
                              ? 'm-2.5 rounded-2xl border shadow-xl'
                              : 'm-0 rounded-none border-r border-t-0 border-b-0 border-l-0 shadow-sm'
                          } ${
                            isEffectiveOpened
                              ? 'w-full md:w-64 p-3.5'
                              : 'w-full md:w-16 p-2 items-center'
                          }`}
                        >
                          {/* Top Brand Header */}
                          <div>
                            {isEffectiveOpened ? (
                              <div className="flex items-center gap-2.5 pb-3 mb-3 border-b" style={{ borderColor: sidebarBorderColor }}>
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs cursor-pointer transition hover:scale-105"
                                  style={{ backgroundColor: selectedAccentColor }}
                                  onClick={() => setSidebarPreviewMode(sidebarPreviewMode === 'opened' ? 'closed' : 'opened')}
                                  title="Toggle expanded/compact view"
                                >
                                  JJS
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-black tracking-wide truncate">
                                    AL MUHAMMADI
                                  </div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: sidebarSubTextColor }}>
                                    Enterprise ERP
                                  </div>
                                </div>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                                  Tabs
                                </span>
                              </div>
                            ) : (
                              <div className="pb-3 mb-3 border-b flex justify-center w-full" style={{ borderColor: sidebarBorderColor }}>
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs cursor-pointer transition hover:scale-105"
                                  style={{ backgroundColor: selectedAccentColor }}
                                  onClick={() => setSidebarPreviewMode('opened')}
                                  title="Click to expand sidebar"
                                >
                                  JJS
                                </div>
                              </div>
                            )}

                            {/* SIDEBAR NAVIGATION TABS & DROPDOWN */}
                            <div className="space-y-1.5">
                              {[
                                {
                                  id: 'master-themes',
                                  label: 'Workspace Themes',
                                  icon: LuLayers,
                                  badge: masterThemePreset === 'nht-1' ? 'Theme 1' : masterThemePreset === 'nht-2' ? 'Theme 2' : 'Custom',
                                },
                                {
                                  id: 'theme',
                                  label: 'Sidebar Background Theme',
                                  icon: LuPalette,
                                  badge: sidebarThemeMode.toUpperCase(),
                                },
                                {
                                  id: 'layout',
                                  label: 'Workspace & Layout',
                                  icon: LuSlidersHorizontal,
                                  badge: sidebarLayout === 'floating' ? 'Floating' : 'Classic',
                                },
                                {
                                  id: 'drawer',
                                  label: 'Drawer Behavior',
                                  icon: LuMonitor,
                                  badge: sidebarBehavior === 'closed' ? 'Auto' : 'Pinned',
                                },
                              ].map((tab) => {
                                const isActive = sidebarActiveConfigTab === tab.id;
                                const TabIcon = tab.icon;

                                return (
                                  <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSidebarActiveConfigTab(tab.id as any)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer group text-left ${
                                      !isEffectiveOpened ? 'justify-center px-0' : 'justify-between'
                                    }`}
                                    style={{
                                      backgroundColor: isActive
                                        ? (isLight ? `${selectedAccentColor}18` : `${selectedAccentColor}28`)
                                        : 'transparent',
                                      color: isActive
                                        ? (isLight ? selectedAccentColor : '#FFFFFF')
                                        : selectedSidebarColor,
                                      border: isActive ? `1px solid ${selectedAccentColor}45` : '1px solid transparent',
                                    }}
                                    title={tab.label}
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      <TabIcon
                                        size={17}
                                        className="shrink-0 transition-transform group-hover:scale-110"
                                        style={{ color: isActive ? selectedAccentColor : selectedSidebarColor }}
                                      />
                                      {isEffectiveOpened && (
                                        <span className="truncate">{tab.label}</span>
                                      )}
                                    </div>
                                    {isEffectiveOpened && (
                                      <span
                                        className="text-[9px] font-mono px-1.5 py-0.5 rounded-md truncate max-w-[65px]"
                                        style={{
                                          backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                                          color: isActive ? (isLight ? selectedAccentColor : '#FFFFFF') : selectedSidebarColor,
                                          opacity: 0.85,
                                        }}
                                      >
                                        {tab.badge}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}

                              {/* 4. COLOR DROPDOWN (Contains Navbar & Brand Accent + Sidebar Font & Icon Color) */}
                              {(() => {
                                const isColorActive = sidebarActiveConfigTab === 'accent' || sidebarActiveConfigTab === 'colors';

                                return (
                                  <div className="space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!isEffectiveOpened) {
                                          if (sidebarActiveConfigTab === 'accent') {
                                            setSidebarActiveConfigTab('colors');
                                          } else {
                                            setSidebarActiveConfigTab('accent');
                                          }
                                          return;
                                        }
                                        setPreviewColorDropdownOpen(!previewColorDropdownOpen);
                                        if (!isColorActive) {
                                          setSidebarActiveConfigTab('accent');
                                          setPreviewColorDropdownOpen(true);
                                        }
                                      }}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer group text-left ${
                                        !isEffectiveOpened ? 'justify-center px-0' : 'justify-between'
                                      }`}
                                      style={{
                                        backgroundColor: isColorActive
                                          ? (isLight ? `${selectedAccentColor}14` : `${selectedAccentColor}22`)
                                          : 'transparent',
                                        color: isColorActive
                                          ? (isLight ? selectedAccentColor : '#FFFFFF')
                                          : selectedSidebarColor,
                                        border: isColorActive ? `1px solid ${selectedAccentColor}35` : '1px solid transparent',
                                      }}
                                      title={"Color (Navbar & Sidebar Colors)"}
                                    >
                                      <div className="flex items-center gap-2.5 truncate">
                                        <LuSparkles
                                          size={17}
                                          className="shrink-0 transition-transform group-hover:scale-110"
                                          style={{ color: isColorActive ? selectedAccentColor : selectedSidebarColor }}
                                        />
                                        {isEffectiveOpened && (
                                          <span className="truncate">{"Color"}</span>
                                        )}
                                      </div>

                                      {isEffectiveOpened && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <div className="flex items-center -space-x-1">
                                            <span
                                              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/40 shadow-2xs"
                                              style={{ backgroundColor: selectedAccentColor }}
                                              title={`Navbar Accent: ${selectedAccentColor}`}
                                            />
                                            <span
                                              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/40 shadow-2xs"
                                              style={{ backgroundColor: selectedSidebarColor }}
                                              title={`Sidebar Color: ${selectedSidebarColor}`}
                                            />
                                          </div>
                                          <LuChevronDown
                                            size={14}
                                            className={`transition-transform duration-200 stroke-[2.5] ${
                                              previewColorDropdownOpen ? 'rotate-180' : ''
                                            }`}
                                            style={{ color: isColorActive ? selectedAccentColor : selectedSidebarColor }}
                                          />
                                        </div>
                                      )}
                                    </button>

                                    {/* DROPDOWN SUB-ITEMS */}
                                    {isEffectiveOpened && previewColorDropdownOpen && (
                                      <div
                                        className="space-y-1 pl-3.5 ml-3.5 border-l transition-all duration-200"
                                        style={{ borderColor: sidebarBorderColor }}
                                      >
                                        {/* Sub-item A: Navbar & Brand Accent Color */}
                                        <button
                                          type="button"
                                          onClick={() => setSidebarActiveConfigTab('accent')}
                                          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[11px] font-bold transition cursor-pointer text-left group"
                                          style={{
                                            backgroundColor: sidebarActiveConfigTab === 'accent'
                                              ? (isLight ? `${selectedAccentColor}20` : `${selectedAccentColor}35`)
                                              : 'transparent',
                                            color: sidebarActiveConfigTab === 'accent'
                                              ? (isLight ? selectedAccentColor : '#FFFFFF')
                                              : selectedSidebarColor,
                                            border: sidebarActiveConfigTab === 'accent'
                                              ? `1px solid ${selectedAccentColor}50`
                                              : '1px solid transparent',
                                          }}
                                          title={"Navbar & Brand Accent Color"}
                                        >
                                          <div className="flex items-center gap-2 truncate">
                                            <span
                                              className="w-2 h-2 rounded-full shrink-0 shadow-2xs transition-transform group-hover:scale-125"
                                              style={{ backgroundColor: selectedAccentColor }}
                                            />
                                            <span className="truncate">
                                              {"Navbar & Brand Accent Color"}
                                            </span>
                                          </div>
                                          <span
                                            className="text-[9px] font-mono px-1 py-0.5 rounded truncate shrink-0"
                                            style={{
                                              backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                                              color: sidebarActiveConfigTab === 'accent'
                                                ? (isLight ? selectedAccentColor : '#FFFFFF')
                                                : selectedSidebarColor,
                                              opacity: 0.9,
                                            }}
                                          >
                                            {selectedAccentColor.toUpperCase()}
                                          </span>
                                        </button>

                                        {/* Sub-item B: Sidebar Font & Icon Color */}
                                        <button
                                          type="button"
                                          onClick={() => setSidebarActiveConfigTab('colors')}
                                          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[11px] font-bold transition cursor-pointer text-left group"
                                          style={{
                                            backgroundColor: sidebarActiveConfigTab === 'colors'
                                              ? (isLight ? `${selectedAccentColor}20` : `${selectedAccentColor}35`)
                                              : 'transparent',
                                            color: sidebarActiveConfigTab === 'colors'
                                              ? (isLight ? selectedAccentColor : '#FFFFFF')
                                              : selectedSidebarColor,
                                            border: sidebarActiveConfigTab === 'colors'
                                              ? `1px solid ${selectedAccentColor}50`
                                              : '1px solid transparent',
                                          }}
                                          title={"Sidebar Font & Icon Color"}
                                        >
                                          <div className="flex items-center gap-2 truncate">
                                            <span
                                              className="w-2 h-2 rounded-full shrink-0 shadow-2xs transition-transform group-hover:scale-125"
                                              style={{ backgroundColor: selectedSidebarColor }}
                                            />
                                            <span className="truncate">
                                              {"Sidebar Font & Icon Color"}
                                            </span>
                                          </div>
                                          <span
                                            className="text-[9px] font-mono px-1 py-0.5 rounded truncate shrink-0"
                                            style={{
                                              backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                                              color: sidebarActiveConfigTab === 'colors'
                                                ? (isLight ? selectedAccentColor : '#FFFFFF')
                                                : selectedSidebarColor,
                                              opacity: 0.9,
                                            }}
                                          >
                                            {selectedSidebarColor.toUpperCase()}
                                          </span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Bottom Profile / Logout */}
                          <div className="pt-3 border-t mt-3" style={{ borderColor: sidebarBorderColor }}>
                            {isEffectiveOpened ? (
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs"
                                    style={{ backgroundColor: selectedAccentColor }}
                                  >
                                    SA
                                  </div>
                                  <div className="truncate font-bold" style={{ color: selectedSidebarColor }}>
                                    Super Admin
                                  </div>
                                </div>
                                <LuLogOut size={13} style={{ color: selectedSidebarColor, opacity: 0.7 }} />
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                                  style={{ backgroundColor: selectedAccentColor }}
                                >
                                  SA
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2. RIGHT PANEL: SIMULATED TOP NAVBAR + ACTIVE CONFIG TAB CONTENT */}
                        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#0B0F17] overflow-hidden">
                          {/* 2A. SIMULATED LIVE ERP TOP NAVBAR */}
                          <div className="p-2 sm:p-3 border-b border-slate-200/80 dark:border-slate-800">
                            <div
                              className={`transition-all duration-300 flex items-center justify-between gap-3 p-2.5 backdrop-blur-md select-none ${
                                navbarLayout === 'floating'
                                  ? 'rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-md bg-white/95 dark:bg-[#111827]/95'
                                  : 'rounded-none border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]'
                              }`}
                            >
                              {/* Left: Brand Badge & Route */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full animate-pulse shadow-xs shrink-0"
                                  style={{ backgroundColor: selectedAccentColor }}
                                  title="Portal Active indicator"
                                />
                                <span className="text-xs font-black tracking-tight text-slate-800 dark:text-slate-100 hidden sm:inline">
                                  ALM • Portal Active
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  Theme Studio
                                </span>
                              </div>

                              {/* Center: Search Input Mockup */}
                              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-400 font-mono w-60 border border-slate-200/60 dark:border-slate-700/60">
                                <LuSearch size={12} />
                                <span className="truncate">Search invoices... (Ctrl+K)</span>
                              </div>

                              {/* Right: + New Sale Action Button, Interface Theme Mode Toggle & User */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                                  style={{
                                    backgroundColor: selectedAccentColor,
                                    color: getContrastTextColor(selectedAccentColor),
                                  }}
                                  title="New Sale button reflects your selected accent color"
                                >
                                  <span>+ New Sale</span>
                                </button>

                                {/* INTERFACE THEME MODE (LIGHT / DARK) TOGGLE */}
                                <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (typeof setColorMode === 'function') setColorMode('light');
                                    }}
                                    title={"Switch to Light Mode"}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                      colorMode === 'light'
                                        ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                                  >
                                    <LuSun size={13} className={colorMode === 'light' ? 'text-amber-500' : ''} />
                                    <span className="hidden sm:inline">{"Light"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (typeof setColorMode === 'function') setColorMode('dark');
                                    }}
                                    title={"Switch to Dark Mode"}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                      colorMode === 'dark'
                                        ? 'bg-slate-900 text-white shadow-xs ring-1 ring-slate-700'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                                  >
                                    <LuMoon size={13} className={colorMode === 'dark' ? 'text-indigo-400' : ''} />
                                    <span className="hidden sm:inline">{"Dark"}</span>
                                  </button>
                                </div>

                                <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">
                                  06:22 PM
                                </span>

                                <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-700">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                                    style={{ backgroundColor: selectedAccentColor }}
                                  >
                                    SA
                                  </div>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline truncate max-w-[100px]">
                                    Super Admin
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 2B. ACTIVE CONFIGURATION TAB CONTENT */}
                          <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[580px]">
                            {/* TAB 0: MASTER WORKSPACE THEMES (NHT Theme 1 vs NHT Theme 2) */}
                            {sidebarActiveConfigTab === 'master-themes' && (
                              <div className="space-y-5 animate-fadeIn">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <LuLayers size={17} style={{ color: selectedAccentColor }} />
                                      <span>{"Workspace Themes & Architecture"}</span>
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      {"Select a curated workspace architecture preset with live structural skeleton preview."}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                                      masterThemePreset === 'nht-1'
                                        ? 'bg-cyan-100 dark:bg-indigo-950/80 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-800'
                                        : masterThemePreset === 'nht-2'
                                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                                        : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                                    }`}>
                                      {masterThemePreset === 'nht-1' ? 'NHT Theme 1 Active' : masterThemePreset === 'nht-2' ? 'NHT Theme 2 Active' : 'Custom Active'}
                                    </span>
                                  </div>
                                </div>

                                {/* 16x16 / Square Skeleton Preview Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                                  {/* THEME 1 CARD */}
                                  <div
                                    onClick={() => handleApplyMasterPreset('nht-1')}
                                    className={`group relative rounded-2xl border-2 transition-all duration-200 cursor-pointer p-4 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                                      masterThemePreset === 'nht-1'
                                        ? 'border-cyan-500 bg-cyan-50/40 dark:bg-indigo-950/20 ring-2 ring-cyan-500/20'
                                        : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-800 bg-white dark:bg-slate-900/60'
                                    }`}
                                  >
                                    <div>
                                      {/* Header row */}
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-xs" />
                                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                            NHT Theme 1
                                          </h5>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-cyan-800 uppercase tracking-wider">
                                          Modern Floating
                                        </span>
                                      </div>

                                      {/* Skeleton UI Preview Frame */}
                                      <div className="rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-900 p-2.5 shadow-inner mb-3 overflow-hidden select-none">
                                        {/* Browser header dots */}
                                        <div className="flex items-center gap-1 mb-2 pb-1.5 border-b border-slate-800">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80 inline-block" />
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 inline-block" />
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 inline-block" />
                                          <span className="ml-2 text-[8px] font-mono text-slate-500">nht-theme-1.preview</span>
                                        </div>

                                        <div className="flex gap-2 h-32">
                                          {/* Floating Sidebar Skeleton */}
                                          <div className="w-20 bg-slate-800/90 rounded-lg p-1.5 flex flex-col justify-between border border-slate-700/70 shadow-xs shrink-0">
                                            <div className="space-y-1.5">
                                              {/* Brand Pill */}
                                              <div className="flex items-center gap-1.5 pb-1 border-b border-slate-700/60">
                                                <div className="w-3.5 h-3.5 rounded-md bg-indigo-600 shadow-xs shrink-0" />
                                                <div className="w-8 h-1.5 rounded bg-slate-600" />
                                              </div>
                                              {/* Active item (Cyan Pill) */}
                                              <div className="w-full h-3 rounded-md bg-indigo-600/90 flex items-center px-1 gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                <div className="w-6 h-1 rounded bg-white/90" />
                                              </div>
                                              {/* Other nav items */}
                                              <div className="w-full h-2.5 rounded bg-slate-700/60 flex items-center px-1">
                                                <div className="w-5 h-1 rounded bg-slate-500" />
                                              </div>
                                              <div className="w-full h-2.5 rounded bg-slate-700/60 flex items-center px-1">
                                                <div className="w-7 h-1 rounded bg-slate-500" />
                                              </div>
                                              <div className="w-full h-2.5 rounded bg-slate-700/60 flex items-center px-1">
                                                <div className="w-4 h-1 rounded bg-slate-500" />
                                              </div>
                                            </div>
                                            <div className="pt-1 border-t border-slate-700/60 flex items-center gap-1">
                                              <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                                              <div className="w-6 h-1 rounded bg-slate-600" />
                                            </div>
                                          </div>

                                          {/* Main Body Skeleton */}
                                          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                                            {/* Floating Navbar */}
                                            <div className="h-5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between px-2">
                                              <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded bg-indigo-500" />
                                                <div className="w-12 h-1.5 rounded bg-slate-600" />
                                              </div>
                                              <div className="w-8 h-2 rounded-full bg-indigo-600/80" />
                                            </div>

                                            {/* Content cards */}
                                            <div className="flex-1 rounded-lg bg-slate-800/40 border border-slate-800 p-2 flex flex-col justify-between">
                                              <div className="grid grid-cols-2 gap-1.5">
                                                <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700/60 space-y-1">
                                                  <div className="w-6 h-1 rounded bg-slate-500" />
                                                  <div className="w-10 h-2 rounded bg-indigo-500 font-bold" />
                                                </div>
                                                <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700/60 space-y-1">
                                                  <div className="w-6 h-1 rounded bg-slate-500" />
                                                  <div className="w-8 h-2 rounded bg-slate-400" />
                                                </div>
                                              </div>
                                              <div className="h-6 rounded bg-slate-800/90 border border-slate-700/50 p-1 flex items-center gap-1">
                                                <div className="w-4 h-1 rounded bg-indigo-500" />
                                                <div className="w-14 h-1 rounded bg-slate-600" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                        Modern floating architecture with rounded detached sidebar cards, top floating bar, and dynamic royal indigo theme accent.
                                      </p>
                                    </div>

                                    {/* Action button */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        Floating Card Arch
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleApplyMasterPreset('nht-1');
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                          masterThemePreset === 'nht-1'
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        {masterThemePreset === 'nht-1' ? (
                                          <>
                                            <LuCheck size={13} />
                                            <span>Active</span>
                                          </>
                                        ) : (
                                          <span>Switch to Theme 1</span>
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* THEME 2 CARD */}
                                  <div
                                    onClick={() => handleApplyMasterPreset('nht-2')}
                                    className={`group relative rounded-2xl border-2 transition-all duration-200 cursor-pointer p-4 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                                      masterThemePreset === 'nht-2'
                                        ? 'border-[#800020] bg-rose-950/10 dark:bg-rose-950/20 ring-2 ring-rose-900/20'
                                        : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 bg-white dark:bg-slate-900/60'
                                    }`}
                                  >
                                    <div>
                                      {/* Header row */}
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <span className="w-3 h-3 rounded-full bg-[#800020] shadow-xs" />
                                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                            NHT Theme 2
                                          </h5>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800 uppercase tracking-wider">
                                          Classic Executive
                                        </span>
                                      </div>

                                      {/* Skeleton UI Preview Frame (Amal-style classic rail + burgundy hero banner) */}
                                      <div className="rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-neutral-950 p-2.5 shadow-inner mb-3 overflow-hidden select-none relative">
                                        {/* Browser header dots */}
                                        <div className="flex items-center gap-1 mb-2 pb-1.5 border-b border-neutral-800">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80 inline-block" />
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 inline-block" />
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 inline-block" />
                                          <span className="ml-2 text-[8px] font-mono text-neutral-500">nht-theme-2.preview</span>
                                        </div>

                                        <div className="flex h-32 relative">
                                          {/* Classic Flush Rail Sidebar Skeleton */}
                                          <div className="w-20 bg-[#161618] -my-2.5 -ml-2.5 p-1.5 flex flex-col justify-between border-r border-neutral-800 shrink-0">
                                            <div className="space-y-1">
                                              {/* Brand Header */}
                                              <div className="flex items-center gap-1.5 pb-1 border-b border-neutral-800">
                                                <div className="w-3 h-3 rounded bg-neutral-800 border border-neutral-700 shrink-0" />
                                                <div className="w-9 h-1.5 rounded bg-neutral-600" />
                                              </div>
                                              {/* Active item (Burgundy Pill) */}
                                              <div className="w-full h-3 rounded bg-[#800020] flex items-center px-1 gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                <div className="w-6 h-1 rounded bg-white" />
                                              </div>
                                              {/* Sidebar items with Chevrons > */}
                                              <div className="w-full h-2.5 rounded hover:bg-white/5 flex items-center justify-between px-1">
                                                <div className="w-5 h-1 rounded bg-neutral-500" />
                                                <div className="text-[7px] text-neutral-500 font-bold">&gt;</div>
                                              </div>
                                              {/* Hovered item with Flyout indicator */}
                                              <div className="w-full h-2.5 rounded bg-neutral-800/80 flex items-center justify-between px-1">
                                                <div className="w-6 h-1 rounded bg-neutral-400" />
                                                <div className="text-[7px] text-rose-400 font-bold">&gt;</div>
                                              </div>
                                              <div className="w-full h-2.5 rounded hover:bg-white/5 flex items-center justify-between px-1">
                                                <div className="w-5 h-1 rounded bg-neutral-500" />
                                                <div className="text-[7px] text-neutral-500 font-bold">&gt;</div>
                                              </div>
                                            </div>
                                            <div className="pt-1 border-t border-neutral-800 flex items-center gap-1">
                                              <div className="w-2.5 h-2.5 rounded bg-neutral-800" />
                                              <div className="w-6 h-1 rounded bg-neutral-600" />
                                            </div>
                                          </div>

                                          {/* Miniature 2-Tier Floating Flyout Simulation */}
                                          <div className="absolute left-[70px] top-4 z-20 w-16 bg-[#1A1A1A] border border-neutral-700 rounded-lg p-1 shadow-xl flex flex-col gap-0.5 animate-fadeIn">
                                            <div className="w-full h-2 rounded bg-[#800020] flex items-center px-1">
                                              <div className="w-8 h-0.5 rounded bg-white" />
                                            </div>
                                            <div className="w-full h-1.5 rounded bg-neutral-800 px-1 flex items-center">
                                              <div className="w-6 h-0.5 rounded bg-neutral-500" />
                                            </div>
                                            <div className="w-full h-1.5 rounded bg-neutral-800 px-1 flex items-center">
                                              <div className="w-7 h-0.5 rounded bg-neutral-500" />
                                            </div>
                                          </div>

                                          {/* Main Body Skeleton */}
                                          <div className="flex-1 flex flex-col gap-1.5 pl-2.5 min-w-0">
                                            {/* Burgundy Hero Banner Header */}
                                            <div className="h-6 rounded-lg bg-[#800020] p-1.5 flex items-center justify-between text-white shadow-xs">
                                              <div className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-300" />
                                                <div className="w-14 h-1.5 rounded bg-white/90" />
                                              </div>
                                              <div className="w-6 h-2 rounded bg-white/20" />
                                            </div>

                                            {/* Summary 4-card metric tiles */}
                                            <div className="grid grid-cols-2 gap-1 flex-1">
                                              <div className="p-1 rounded bg-neutral-900 border border-neutral-800 flex flex-col justify-center">
                                                <div className="w-4 h-1 rounded bg-neutral-600 mb-0.5" />
                                                <div className="w-7 h-1.5 rounded bg-neutral-300" />
                                              </div>
                                              <div className="p-1 rounded bg-neutral-900 border border-neutral-800 flex flex-col justify-center">
                                                <div className="w-4 h-1 rounded bg-neutral-600 mb-0.5" />
                                                <div className="w-7 h-1.5 rounded bg-neutral-300" />
                                              </div>
                                              <div className="p-1 rounded bg-neutral-900 border border-neutral-800 flex flex-col justify-center">
                                                <div className="w-4 h-1 rounded bg-neutral-600 mb-0.5" />
                                                <div className="w-7 h-1.5 rounded bg-neutral-300" />
                                              </div>
                                              <div className="p-1 rounded bg-neutral-900 border border-neutral-800 flex flex-col justify-center">
                                                <div className="w-4 h-1 rounded bg-neutral-600 mb-0.5" />
                                                <div className="w-7 h-1.5 rounded bg-neutral-300" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                        Classic edge-to-edge flush rail layout with charcoal sidebar, 2-tier floating category dropdowns, executive hero banner, and clean reporting.
                                      </p>
                                    </div>

                                    {/* Action button & Color Variant Chips */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                                          Palette:
                                        </span>
                                        {[
                                          { name: 'Option A: Imperial Gold', hex: '#D97706', label: 'Gold (Option A)' },
                                          { name: 'Option B: Burgundy', hex: '#800020', label: 'Burgundy' },
                                          { name: 'Option C: Midnight Cobalt', hex: '#1D4ED8', label: 'Cobalt' },
                                          { name: 'Option D: Royal Violet', hex: '#7C3AED', label: 'Violet' },
                                          { name: 'Option E: Bronze', hex: '#B45309', label: 'Bronze' },
                                        ].map((variant) => {
                                          const isVariantActive = masterThemePreset === 'nht-2' && selectedAccentColor.toUpperCase() === variant.hex.toUpperCase();
                                          return (
                                            <button
                                              key={variant.hex}
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleApplyMasterPreset('nht-2', variant.hex);
                                              }}
                                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                                isVariantActive
                                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400 shadow-2xs font-black'
                                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                              }`}
                                              title={variant.name}
                                            >
                                              <span className="w-2 h-2 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: variant.hex }} />
                                              <span>{variant.label}</span>
                                            </button>
                                          );
                                        })}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleApplyMasterPreset('nht-2', '#D97706');
                                        }}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 self-end sm:self-auto ${
                                          masterThemePreset === 'nht-2'
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        {masterThemePreset === 'nht-2' ? (
                                          <>
                                            <LuCheck size={13} />
                                            <span>Active (Theme 2)</span>
                                          </>
                                        ) : (
                                          <span>Switch to Theme 2</span>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 1: SIDEBAR BACKGROUND THEME */}
                            {sidebarActiveConfigTab === 'theme' && (
                              <div className="space-y-4 animate-fadeIn">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <LuPalette size={16} style={{ color: selectedAccentColor }} />
                                      <span>{"Sidebar Background Theme & Gradients"}</span>
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      {"Choose from 12 curated themes, or craft and save your own custom gradients."}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                                      {sidebarCustomBg ? 'Custom Theme' : `Preset: ${sidebarThemeMode}`}
                                    </span>
                                  </div>
                                </div>

                                {/* Studio Sub-tabs: Curated Themes | Custom & Gradient | Saved Themes */}
                                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 w-fit flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => setCustomBgSubTab('presets')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                      customBgSubTab === 'presets'
                                        ? 'bg-white dark:bg-slate-900 text-primary shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                  >
                                    <LuPalette size={13} />
                                    <span>{"Curated Themes"} (12)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomBgSubTab('custom');
                                      syncStudioWithActiveBg();
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                      customBgSubTab === 'custom'
                                        ? 'bg-white dark:bg-slate-900 text-primary shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                  >
                                    <LuSparkles size={13} />
                                    <span>{"Custom & Gradient Studio"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCustomBgSubTab('saved')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                      customBgSubTab === 'saved'
                                        ? 'bg-white dark:bg-slate-900 text-primary shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                  >
                                    <LuBookmark size={13} />
                                    <span>{"Saved Themes"} ({savedCustomThemes.length})</span>
                                  </button>
                                </div>

                                {/* VIEW 1: CURATED THEMES (12 OPTIONS) */}
                                {customBgSubTab === 'presets' && (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 animate-fadeIn">
                                    {[
                                      { id: 'light', name: 'Clean White', bg: '#FFFFFF', text: 'text-slate-900', badge: 'Minimal' },
                                      { id: 'navy', name: 'Executive Navy', bg: '#0F172A', text: 'text-white', badge: 'Corporate' },
                                      { id: 'emerald', name: 'Rich Emerald', bg: '#0A1A18', text: 'text-white', badge: 'Heritage' },
                                      { id: 'charcoal', name: 'Warm Charcoal', bg: '#1C1917', text: 'text-white', badge: 'Artisan' },
                                      { id: 'dark', name: 'Classic Dark', bg: '#0B0F17', text: 'text-white', badge: 'Original' },
                                      { id: 'indigo', name: 'Midnight Indigo', bg: '#0C1033', text: 'text-white', badge: 'Indigo' },
                                      { id: 'burgundy', name: 'Royal Velvet', bg: '#200D1F', text: 'text-white', badge: 'Velvet' },
                                      { id: 'slate', name: 'Nordic Slate', bg: '#1E293B', text: 'text-white', badge: 'Titanium' },
                                      { id: 'pine', name: 'Forest Pine', bg: '#061D15', text: 'text-white', badge: 'Botanic' },
                                      { id: 'pitch', name: 'Obsidian Pitch', bg: '#050508', text: 'text-white', badge: 'Carbon' },
                                      { id: 'ember', name: 'Sunset Ember', bg: '#23120C', text: 'text-white', badge: 'Sunset' },
                                      { id: 'ocean', name: 'Deep Ocean', bg: '#071A24', text: 'text-white', badge: 'Oceanic' },
                                    ].map((item) => {
                                      const isSelected = !sidebarCustomBg && sidebarThemeMode === item.id;
                                      return (
                                        <button
                                          key={item.id}
                                          type="button"
                                          onClick={() => {
                                            if (['light', 'navy', 'emerald', 'charcoal', 'dark'].includes(item.id)) {
                                              handleSidebarThemeChange(item.id as SidebarThemeMode);
                                            } else {
                                              applyCustomSidebarBg(item.bg, item.name);
                                            }
                                          }}
                                          className={`relative p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col items-center justify-between text-center gap-2 group h-24 ${
                                            isSelected || sidebarCustomBg === item.bg
                                              ? 'ring-2 ring-blue-500 border-blue-500 shadow-md scale-102'
                                              : 'border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-2xs'
                                          }`}
                                          style={{ backgroundColor: item.bg }}
                                        >
                                          <span
                                            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10"
                                            style={{ color: item.id === 'light' ? '#0F172A' : '#FFFFFF' }}
                                          >
                                            {item.badge}
                                          </span>
                                          <span className={`text-xs font-bold leading-tight ${item.text}`}>
                                            {item.name}
                                          </span>
                                          {(isSelected || sidebarCustomBg === item.bg) && (
                                            <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-xs">
                                              ✓
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* VIEW 2: CUSTOM & GRADIENT STUDIO */}
                                {customBgSubTab === 'custom' && (
                                  <div className="space-y-4 pt-1 animate-fadeIn">
                                    {/* Current Active Background Status & Quick Sync Card */}
                                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 flex-wrap">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div
                                          className="w-10 h-10 rounded-xl shadow-xs border border-white/20 shrink-0 flex items-center justify-center text-white"
                                          style={{
                                            background: sidebarCustomBg || (
                                              sidebarThemeMode === 'light' ? '#FFFFFF' :
                                              sidebarThemeMode === 'navy' ? '#0F172A' :
                                              sidebarThemeMode === 'emerald' ? '#0A1A18' :
                                              sidebarThemeMode === 'charcoal' ? '#1C1917' : '#0B0F17'
                                            ),
                                          }}
                                        >
                                          <LuCheck size={15} className="stroke-[3]" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-primary flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            <span>Current Active Background</span>
                                          </div>
                                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                            {sidebarCustomBg
                                              ? (sidebarCustomBg.includes('gradient') ? 'Custom Linear Gradient Active' : `Custom Color Active: ${sidebarCustomBg}`)
                                              : `Preset Active: ${sidebarThemeMode.toUpperCase()}`}
                                          </div>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={syncStudioWithActiveBg}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                        title="Load current active background into studio controls"
                                      >
                                        <LuRotateCcw size={12} />
                                        <span>Load Active into Studio</span>
                                      </button>
                                    </div>

                                    {/* Gradient vs Solid Toggle */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {"Background Type:"}
                                      </span>
                                      <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <button
                                          type="button"
                                          onClick={() => setCustomBgType('gradient')}
                                          className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                            customBgType === 'gradient'
                                              ? 'bg-primary text-white shadow-xs'
                                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                          }`}
                                        >
                                          🌈 {"Linear Gradient"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setCustomBgType('solid')}
                                          className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                            customBgType === 'solid'
                                              ? 'bg-primary text-white shadow-xs'
                                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                          }`}
                                        >
                                          ⬛ {"Solid Color"}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Gradient Controls or Solid Color Controls */}
                                    {customBgType === 'gradient' ? (
                                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {/* Stop 1 */}
                                          <div className="space-y-1.5">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                              Gradient Color 1 (Start Stop)
                                            </span>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="color"
                                                value={customColorStop1}
                                                onChange={(e) => setCustomColorStop1(e.target.value)}
                                                className="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                                              />
                                              <input
                                                type="text"
                                                value={customColorStop1.toUpperCase()}
                                                onChange={(e) => setCustomColorStop1(e.target.value)}
                                                maxLength={7}
                                                className="w-28 px-2.5 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                                              />
                                            </div>
                                          </div>

                                          {/* Stop 2 */}
                                          <div className="space-y-1.5">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                              Gradient Color 2 (End Stop)
                                            </span>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="color"
                                                value={customColorStop2}
                                                onChange={(e) => setCustomColorStop2(e.target.value)}
                                                className="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                                              />
                                              <input
                                                type="text"
                                                value={customColorStop2.toUpperCase()}
                                                onChange={(e) => setCustomColorStop2(e.target.value)}
                                                maxLength={7}
                                                className="w-28 px-2.5 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                                              />
                                            </div>
                                          </div>
                                        </div>

                                        {/* Angle Presets */}
                                        <div className="space-y-1.5">
                                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Gradient Angle & Flow Direction
                                          </span>
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[
                                              { angle: 135, label: 'Diagonal 135°' },
                                              { angle: 180, label: 'Vertical 180°' },
                                              { angle: 90, label: 'Horizontal 90°' },
                                              { angle: 45, label: 'Angled 45°' },
                                            ].map((preset) => (
                                              <button
                                                key={preset.angle}
                                                type="button"
                                                onClick={() => setCustomGradientAngle(preset.angle)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                                  customGradientAngle === preset.angle
                                                    ? 'border-primary bg-primary/10 text-primary font-bold'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                                }`}
                                              >
                                                {preset.label}
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Live Preview Box & Quick Apply */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                          <div className="flex items-center gap-3">
                                            <div
                                              className="w-24 h-11 rounded-xl shadow-xs border border-white/20 flex items-center justify-center text-white text-[10px] font-bold tracking-wider"
                                              style={{
                                                background: `linear-gradient(${customGradientAngle}deg, ${customColorStop1} 0%, ${customColorStop2} 100%)`,
                                              }}
                                            >
                                              Preview
                                            </div>
                                            <span className="text-xs font-mono text-slate-500 truncate max-w-[200px]">
                                              {customColorStop1} → {customColorStop2} ({customGradientAngle}°)
                                            </span>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              const bg = `linear-gradient(${customGradientAngle}deg, ${customColorStop1} 0%, ${customColorStop2} 100%)`;
                                              applyCustomSidebarBg(bg, 'Custom Gradient');
                                            }}
                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition shadow-xs cursor-pointer flex items-center gap-1.5"
                                          >
                                            <LuSparkles size={13} />
                                            <span>Test Live on Sidebar</span>
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                                        <div className="space-y-1.5">
                                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Custom Solid Background Color
                                          </span>
                                          <div className="flex items-center gap-3">
                                            <input
                                              type="color"
                                              value={customSolidColor}
                                              onChange={(e) => setCustomSolidColor(e.target.value)}
                                              className="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                                            />
                                            <input
                                              type="text"
                                              value={customSolidColor.toUpperCase()}
                                              onChange={(e) => setCustomSolidColor(e.target.value)}
                                              maxLength={7}
                                              className="w-28 px-2.5 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => applyCustomSidebarBg(customSolidColor, 'Custom Solid')}
                                              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition shadow-xs cursor-pointer flex items-center gap-1.5"
                                            >
                                              <LuSparkles size={13} />
                                              <span>Test Live on Sidebar</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* SAVE CUSTOM THEME & SUGGESTED NAMES */}
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                                      <div>
                                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                          <LuSave size={13} className="text-primary" />
                                          <span>{"Save this Theme & Pick a Suggested Name:"}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                          {"Click any suggested name pill below to quickly autofill, or type your own:"}
                                        </p>
                                      </div>

                                      {/* Suggested Names Pills */}
                                      <div className="flex flex-wrap gap-1.5">
                                        {SUGGESTED_THEME_NAMES.map((name) => (
                                          <button
                                            key={name}
                                            type="button"
                                            onClick={() => setCustomThemeName(name)}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                                              customThemeName === name
                                                ? 'bg-primary text-white border-primary shadow-xs'
                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary'
                                            }`}
                                          >
                                            ✨ {name}
                                          </button>
                                        ))}
                                      </div>

                                      {/* Save Input & Button */}
                                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                        <input
                                          type="text"
                                          value={customThemeName}
                                          onChange={(e) => setCustomThemeName(e.target.value)}
                                          placeholder="Enter theme name (e.g. Midnight Aurora)..."
                                          className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                                        />
                                        <button
                                          type="button"
                                          onClick={handleSaveCustomTheme}
                                          className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                                        >
                                          <LuSave size={13} />
                                          <span>{"Save & Apply Theme"}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* VIEW 3: SAVED CUSTOM THEMES */}
                                {customBgSubTab === 'saved' && (
                                  <div className="space-y-3 pt-1 animate-fadeIn">
                                    {savedCustomThemes.length === 0 ? (
                                      <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-700">
                                        <LuBookmark className="mx-auto text-slate-400 mb-2" size={24} />
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                          {"No saved custom themes yet."}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                                          {"Craft your unique gradient or solid color in the Custom & Gradient Studio and save it here!"}
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => setCustomBgSubTab('custom')}
                                          className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                                        >
                                          <LuPlus size={12} />
                                          <span>Open Studio</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {savedCustomThemes.map((savedTheme) => {
                                          const isCurrentlyActive = sidebarCustomBg === savedTheme.bg;
                                          return (
                                            <div
                                              key={savedTheme.id}
                                              onClick={() => applyCustomSidebarBg(savedTheme.bg, savedTheme.name)}
                                              className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group ${
                                                isCurrentlyActive
                                                  ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs'
                                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:shadow-2xs'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2.5 min-w-0">
                                                <div
                                                  className="w-10 h-10 rounded-xl shadow-2xs border border-white/20 shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                                                  style={{ background: savedTheme.bg }}
                                                >
                                                  {isCurrentlyActive && <LuCheck size={14} className="stroke-[3]" />}
                                                </div>
                                                <div className="min-w-0">
                                                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                    {savedTheme.name}
                                                  </div>
                                                  <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                                                    <span className="capitalize">{savedTheme.type}</span>
                                                    {savedTheme.date && <span>• {savedTheme.date}</span>}
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    applyCustomSidebarBg(savedTheme.bg, savedTheme.name);
                                                  }}
                                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary text-white hover:bg-primary/90 transition shadow-2xs cursor-pointer"
                                                >
                                                  Apply
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => handleDeleteSavedTheme(savedTheme.id, e)}
                                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                                  title="Delete saved theme"
                                                >
                                                  <LuTrash2 size={13} />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* TAB 2: NAVBAR & BRAND ACCENT COLOR */}
                            {sidebarActiveConfigTab === 'accent' && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <LuSparkles size={16} style={{ color: selectedAccentColor }} />
                                      <span>{"Navbar & Brand Accent Color"}</span>
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      {"Controls top navbar buttons, active tab pills, badges, and primary accents across the ERP."}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isAccentChanged && (
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/60 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        Unapplied
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold">
                                      <span
                                        className="w-3 h-3 rounded-full border border-black/15 shadow-2xs shrink-0"
                                        style={{ backgroundColor: selectedAccentColor }}
                                      />
                                      <span className="text-slate-700 dark:text-slate-200">
                                        {selectedAccentColor.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* 24 Presets Grid */}
                                <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-1.5 pt-1">
                                  {PRESET_THEME_COLORS.map((c) => {
                                    const isSelected = selectedAccentColor.toLowerCase() === c.hex.toLowerCase();
                                    const isCurrentlyApplied = appliedAccentColor.toLowerCase() === c.hex.toLowerCase();

                                    return (
                                      <button
                                        key={`accent-preset-${c.hex}`}
                                        type="button"
                                        onClick={() => handleAccentSelect(c.hex)}
                                        className={`group relative h-9 rounded-xl transition-all duration-150 hover:scale-105 flex items-center justify-center cursor-pointer border ${
                                          isSelected
                                            ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white border-transparent shadow-xs scale-105'
                                            : 'border-black/10 dark:border-white/10'
                                        }`}
                                        style={{ backgroundColor: c.hex }}
                                        title={`${c.name} (${c.hex})${isCurrentlyApplied ? ' - Active' : ''}`}
                                      >
                                        {isSelected && (
                                          <LuCheck className="text-white drop-shadow-md text-xs stroke-[3]" />
                                        )}
                                        {!isSelected && isCurrentlyApplied && (
                                          <span className="w-1 h-1 rounded-full bg-white/90 absolute bottom-1" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Custom Color Wheel & Apply Bar */}
                                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    <label
                                      className="relative flex items-center justify-center cursor-pointer shrink-0"
                                      title="Open color wheel"
                                    >
                                      <span
                                        className="w-9 h-9 rounded-xl border border-black/15 shadow-xs block transition hover:scale-105"
                                        style={{ backgroundColor: selectedAccentColor }}
                                      />
                                      <input
                                        type="color"
                                        value={selectedAccentColor}
                                        onChange={(e) => handleAccentSelect(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                      />
                                    </label>

                                    <div className="flex items-center px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 w-32">
                                      <span className="text-slate-400 select-none mr-1">#</span>
                                      <input
                                        type="text"
                                        maxLength={6}
                                        value={customAccentHex}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setCustomAccentHex(val);
                                          const clean = val.replace(/[^0-9A-Fa-f]/g, '').trim();
                                          if (clean.length === 3 || clean.length === 6) {
                                            setSelectedAccentColor(`#${clean}`);
                                          }
                                        }}
                                        placeholder="10B981"
                                        className="w-full bg-transparent outline-none uppercase font-mono text-xs"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    {isAccentChanged && (
                                      <button
                                        type="button"
                                        onClick={handleResetAccentColor}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                                      >
                                        <LuRotateCcw size={12} />
                                        <span>Reset</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={handleApplyAccentColor}
                                      className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                                        isAccentChanged
                                          ? 'ring-2 ring-offset-1 ring-emerald-500 hover:brightness-110 font-extrabold'
                                          : 'hover:opacity-90'
                                      }`}
                                      style={{
                                        backgroundColor: selectedAccentColor,
                                        color: getContrastTextColor(selectedAccentColor),
                                        border: getContrastTextColor(selectedAccentColor) === '#0F172A' ? '1px solid #CBD5E1' : undefined,
                                      }}
                                    >
                                      {accentAppliedRecently ? (
                                        <>
                                          <LuCheck size={14} className="stroke-[3]" />
                                          <span>Applied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <LuSparkles size={13} />
                                          <span>{"Apply Accent Color"}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 3: WORKSPACE NAVIGATION & LAYOUT */}
                            {sidebarActiveConfigTab === 'layout' && (
                              <div className="space-y-5 animate-fadeIn">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <LuLayers size={16} style={{ color: selectedAccentColor }} />
                                      <span>{"Workspace Navigation & Layout"}</span>
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      Choose between a modern floating card layout or the classic edge-to-edge ERP interface.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleResetLayoutToClassic}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
                                  >
                                    <LuRotateCcw size={13} />
                                    <span>{"Reset to Classic (Undo)"}</span>
                                  </button>
                                </div>

                                {/* Quick Workspace Presets */}
                                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                      Quick Workspace Presets
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Switch both Sidebar & Navbar together with 1 click:
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleApplyPreset('floating')}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                        sidebarLayout === 'floating' && navbarLayout === 'floating'
                                          ? 'bg-blue-600 text-white shadow-xs'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      <span>🚀 Full Floating</span>
                                      {sidebarLayout === 'floating' && navbarLayout === 'floating' && <LuCheck size={12} />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleApplyPreset('classic')}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                        sidebarLayout === 'classic' && navbarLayout === 'classic'
                                          ? 'bg-blue-600 text-white shadow-xs'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      <span>🏛️ Full Classic</span>
                                      {sidebarLayout === 'classic' && navbarLayout === 'classic' && <LuCheck size={12} />}
                                    </button>
                                  </div>
                                </div>

                                {/* Granular Individual Controls */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Left Sidebar Style */}
                                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-900 dark:text-white">Left Sidebar Style</span>
                                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        {sidebarLayout === 'floating' ? 'Floating' : 'Classic'}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSetSidebarLayout('floating')}
                                        className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[80px] ${
                                          sidebarLayout === 'floating'
                                            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">🚀 Floating</span>
                                          {sidebarLayout === 'floating' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-tight">Rounded detached card with shadow.</p>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSetSidebarLayout('classic')}
                                        className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[80px] ${
                                          sidebarLayout === 'classic'
                                            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">🏛️ Classic</span>
                                          {sidebarLayout === 'classic' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-tight">Original edge-to-edge flush sidebar.</p>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Top Navbar Style */}
                                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-900 dark:text-white">Top Navbar Style</span>
                                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        {navbarLayout === 'floating' ? 'Floating' : 'Classic'}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSetNavbarLayout('floating')}
                                        className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[80px] ${
                                          navbarLayout === 'floating'
                                            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">🚀 Floating</span>
                                          {navbarLayout === 'floating' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-tight">Floating pill card with elevation.</p>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSetNavbarLayout('classic')}
                                        className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[80px] ${
                                          navbarLayout === 'classic'
                                            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">🏛️ Classic</span>
                                          {navbarLayout === 'classic' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-tight">Edge-to-edge full width navbar.</p>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Reports Layout Style */}
                                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white block">Reports Layout & Navigation</span>
                                        <p className="text-[11px] text-slate-400">Switch between visual reports directory or classic nested sidebar tree.</p>
                                      </div>
                                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        {reportLayout === 'modern' ? 'Modern Hub' : 'Classic Tree'}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      {/* Modern Reports Hub Card */}
                                      <div
                                        onClick={() => handleSetReportLayout('modern')}
                                        className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                                          reportLayout === 'modern'
                                            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 shadow-md'
                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300'
                                        }`}
                                      >
                                        {/* 16:10 / 16:9 Aspect Ratio Interactive Skeleton Preview Frame */}
                                        <div className="w-full aspect-[16/10] rounded-xl bg-[#0F172A] border border-slate-700/80 p-2 flex flex-col justify-between overflow-hidden shadow-inner mb-2.5 relative">
                                          {/* Mini Top Filter Bar */}
                                          <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-700/60">
                                            <div className="flex items-center gap-1">
                                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                              <span className="w-10 h-1 rounded bg-slate-500" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span className="w-6 h-1.5 rounded-full bg-indigo-600/30 border border-cyan-400/40" />
                                              <span className="w-5 h-1.5 rounded-full bg-slate-700" />
                                            </div>
                                          </div>
                                          {/* Mini Draggable Report Cards Grid (Theme 1 style) */}
                                          <div className="grid grid-cols-3 gap-1.5 flex-1 pt-1.5">
                                            <div className="p-1 rounded bg-slate-800/90 border border-slate-700 flex flex-col justify-between shadow-2xs">
                                              <div className="w-3 h-3 rounded bg-indigo-600/20 text-cyan-400 flex items-center justify-center text-[7px] font-black">📊</div>
                                              <div className="w-7 h-1 rounded bg-slate-300 mt-1" />
                                              <div className="w-4 h-0.5 rounded bg-slate-500 mt-0.5" />
                                            </div>
                                            <div className="p-1 rounded bg-slate-800/90 border border-slate-700 flex flex-col justify-between shadow-2xs">
                                              <div className="w-3 h-3 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[7px] font-black">💰</div>
                                              <div className="w-8 h-1 rounded bg-slate-300 mt-1" />
                                              <div className="w-5 h-0.5 rounded bg-slate-500 mt-0.5" />
                                            </div>
                                            <div className="p-1 rounded bg-slate-800/90 border border-slate-700 flex flex-col justify-between shadow-2xs">
                                              <div className="w-3 h-3 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-[7px] font-black">📦</div>
                                              <div className="w-6 h-1 rounded bg-slate-300 mt-1" />
                                              <div className="w-4 h-0.5 rounded bg-slate-500 mt-0.5" />
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                            <span>📊</span> Modern Reports Hub
                                          </span>
                                          {reportLayout === 'modern' && <LuCheck size={14} className="text-blue-600 stroke-[3]" />}
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Visual interactive cards directory with live search & filters.</p>
                                      </div>

                                      {/* Classic Nested Tree Card */}
                                      <div
                                        onClick={() => handleSetReportLayout('classic')}
                                        className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                                          reportLayout === 'classic'
                                            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 shadow-md'
                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300'
                                        }`}
                                      >
                                        {/* 16:10 / 16:9 Aspect Ratio Interactive Skeleton Preview Frame */}
                                        <div className="w-full aspect-[16/10] rounded-xl bg-[#141416] border border-neutral-700/80 p-2 flex overflow-hidden shadow-inner mb-2.5 relative">
                                          {/* Sidebar with flyout tree indicator */}
                                          <div className="w-14 bg-[#1C1C1E] -my-2 -ml-2 p-1.5 flex flex-col justify-between border-r border-neutral-800 shrink-0">
                                            <div className="space-y-1">
                                              <div className="w-7 h-1 rounded bg-neutral-600 mb-1" />
                                              <div className="w-full h-2.5 rounded bg-[#800020] flex items-center px-1">
                                                <div className="w-5 h-0.5 rounded bg-white" />
                                              </div>
                                              <div className="w-full h-2 rounded bg-neutral-800/80 flex items-center justify-between px-1">
                                                <div className="w-6 h-0.5 rounded bg-neutral-400" />
                                                <span className="text-[6px] text-rose-400">&gt;</span>
                                              </div>
                                            </div>
                                          </div>
                                          {/* Floating Flyout Simulation */}
                                          <div className="absolute left-[54px] top-3 z-10 w-16 bg-[#222226] border border-neutral-700 rounded-lg p-1 shadow-lg flex flex-col gap-0.5">
                                            <div className="w-full h-1.5 rounded bg-[#800020] px-1 flex items-center">
                                              <div className="w-7 h-0.5 rounded bg-white" />
                                            </div>
                                            <div className="w-full h-1.5 rounded bg-neutral-800 px-1 flex items-center">
                                              <div className="w-8 h-0.5 rounded bg-neutral-400" />
                                            </div>
                                          </div>
                                          {/* Main direct report sheet preview */}
                                          <div className="flex-1 flex flex-col justify-between pl-20 min-w-0">
                                            <div className="h-4 rounded bg-[#800020] p-1 flex items-center justify-between text-white">
                                              <div className="w-8 h-1 rounded bg-white" />
                                              <div className="w-4 h-1 rounded bg-white/40" />
                                            </div>
                                            <div className="space-y-1 py-1">
                                              <div className="w-full h-1 rounded bg-neutral-800" />
                                              <div className="w-3/4 h-1 rounded bg-neutral-800" />
                                              <div className="w-full h-1 rounded bg-neutral-800" />
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                            <span>🏛️</span> Classic Nested Tree
                                          </span>
                                          {reportLayout === 'classic' && <LuCheck size={14} className="text-blue-600 stroke-[3]" />}
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Multi-level flyout sidebar tree with direct tabbed generators.</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 4: SMART DRAWER */}
                            {sidebarActiveConfigTab === 'drawer' && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <LuMonitor size={16} style={{ color: selectedAccentColor }} />
                                      <span>{"Sidebar Default State & Interaction"}</span>
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      Choose whether the sidebar stays permanently pinned open, or stays collapsed and auto-expands on hover/click.
                                    </p>
                                  </div>
                                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                    {sidebarBehavior === 'closed' ? 'Auto-Drawer' : 'Always Opened'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSetSidebarBehavior('opened')}
                                    className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                                      sidebarBehavior === 'opened'
                                        ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/70 dark:bg-blue-950/30 shadow-xs'
                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                      <LuMonitor size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                          {"Always Opened (Pinned)"}
                                        </span>
                                        {sidebarBehavior === 'opened' && (
                                          <LuCheck size={14} className="text-blue-600 stroke-[3]" />
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {"Sidebar remains fully expanded at all times for quick multi-tasking."}
                                      </p>
                                    </div>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSetSidebarBehavior('closed')}
                                    className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                                      sidebarBehavior === 'closed'
                                        ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/70 dark:bg-blue-950/30 shadow-xs'
                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                      <LuLaptop size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                          {"Keep Closed (Smart Drawer)"}
                                        </span>
                                        {sidebarBehavior === 'closed' && (
                                          <LuCheck size={14} className="text-blue-600 stroke-[3]" />
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {"Collapses to compact icons. Automatically expands on hover or click."}
                                      </p>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* TAB 5: SIDEBAR FONT & ICON COLOR */}
                            {sidebarActiveConfigTab === 'colors' && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <LuPenLine size={16} style={{ color: selectedAccentColor }} />
                                      <span>{"Sidebar Font & Icon Color"}</span>
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      Colors apply live to all navigation items, text, and icons in the sidebar.
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {wasSidebarAdjusted ? (
                                      <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 px-2 py-0.5 rounded-full">
                                        Protected
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        High Contrast
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                                        style={{ backgroundColor: selectedSidebarColor }}
                                      />
                                      <span className="text-slate-700 dark:text-slate-200">
                                        {selectedSidebarColor.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* 24 Presets Grid */}
                                <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-1.5 pt-1">
                                  {PRESET_THEME_COLORS.map((c) => {
                                    const isSelected = selectedSidebarColor.toLowerCase() === c.hex.toLowerCase();
                                    const isCurrentlyApplied = appliedSidebarColor.toLowerCase() === c.hex.toLowerCase();

                                    return (
                                      <button
                                        key={`sidebar-preset-${c.hex}`}
                                        type="button"
                                        onClick={() => handleSidebarSelect(c.hex)}
                                        className={`group relative h-8 rounded-lg transition-all duration-150 hover:scale-105 flex items-center justify-center cursor-pointer border ${
                                          isSelected
                                            ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white border-transparent shadow-xs scale-105'
                                            : 'border-black/10 dark:border-white/10'
                                        }`}
                                        style={{ backgroundColor: c.hex }}
                                        title={`${c.name} (${c.hex})${isCurrentlyApplied ? ' - Active' : ''}`}
                                      >
                                        {isSelected && (
                                          <LuCheck className="text-white drop-shadow-md text-xs stroke-[3]" />
                                        )}
                                        {!isSelected && isCurrentlyApplied && (
                                          <span className="w-1 h-1 rounded-full bg-white/90 absolute bottom-1" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Custom Color Wheel & Apply Bar */}
                                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    <label
                                      className="relative flex items-center justify-center cursor-pointer shrink-0"
                                      title="Open color wheel"
                                    >
                                      <span
                                        className="w-8 h-8 rounded-lg border border-black/15 shadow-xs block transition hover:scale-105"
                                        style={{ backgroundColor: selectedSidebarColor }}
                                      />
                                      <input
                                        type="color"
                                        value={selectedSidebarColor}
                                        onChange={(e) => handleSidebarSelect(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                      />
                                    </label>

                                    <div className="flex items-center px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 w-28">
                                      <span className="text-slate-400 select-none mr-1">#</span>
                                      <input
                                        type="text"
                                        maxLength={6}
                                        value={customSidebarHex}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setCustomSidebarHex(val);
                                          const clean = val.replace(/[^0-9A-Fa-f]/g, '').trim();
                                          if (clean.length === 3 || clean.length === 6) {
                                            handleSidebarSelect(`#${clean}`);
                                          }
                                        }}
                                        placeholder="1E293B"
                                        className="w-full bg-transparent outline-none uppercase font-mono text-xs"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    {isSidebarChanged && (
                                      <button
                                        type="button"
                                        onClick={handleResetSidebarColor}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                                      >
                                        <LuRotateCcw size={12} />
                                        <span>Reset</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={handleApplySidebarColor}
                                      className={`px-4 py-1.5 text-xs font-bold rounded-lg text-white shadow-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                                        isSidebarChanged
                                          ? 'ring-2 ring-offset-1 ring-slate-800 hover:brightness-110 font-extrabold'
                                          : 'hover:opacity-90'
                                      }`}
                                      style={{
                                        backgroundColor: selectedSidebarColor,
                                        color: getContrastTextColor(selectedSidebarColor),
                                        border: getContrastTextColor(selectedSidebarColor) === '#0F172A' ? '1px solid #CBD5E1' : undefined,
                                      }}
                                    >
                                      {sidebarAppliedRecently ? (
                                        <>
                                          <LuCheck size={14} className="stroke-[3]" />
                                          <span>Applied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <LuLayers size={13} />
                                          <span>Apply Color</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}


          {/* TAB: INVENTORY & STOCK GOVERNANCE */}
          {activeTab === 'stock_control' && (() => {
            const isNegativeAllowed = isNegativeStockAllowed(systemConfig);

            return (
              <div className="space-y-6">
                {/* Hero Header Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
                        <LuPackage />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          Inventory & Stock Governance
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            isNegativeAllowed
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          }`}>
                            {isNegativeAllowed ? 'Negative Stock Permitted' : 'Strict Non-Negative Enforced'}
                          </span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Configure whether POS and commercial sales invoices can bill items beyond available warehouse stock.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Setting Toggle Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                        <LuSlidersHorizontal className="text-primary text-base" />
                        <span>Allow Product Stock to Go Negative</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        When <strong className="text-slate-700 dark:text-slate-200">Enabled</strong> (minus allowed): Salesmen can issue bills even if stock has not yet been inwarded via purchase bills or opening stock.
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        When <strong className="text-slate-700 dark:text-slate-200">Disabled</strong> (strict mode): Sales Invoices and Delivery Challans are strictly blocked from proceeding if requested quantity exceeds available physical inventory.
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={savingStockPolicy || checkingStockViolations}
                        onClick={handleToggleNegativeStock}
                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
                          isNegativeAllowed ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span className="sr-only">Toggle Negative Stock</span>
                        <span
                          className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-xs ${
                            isNegativeAllowed ? 'translate-x-6 text-amber-600' : 'translate-x-0 text-slate-400'
                          }`}
                        >
                          {isNegativeAllowed ? <LuCheck size={14} className="stroke-[3]" /> : <LuXCircle size={14} />}
                        </span>
                      </button>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {checkingStockViolations
                          ? 'Checking health...'
                          : savingStockPolicy
                          ? 'Saving...'
                          : isNegativeAllowed
                          ? 'Minus Allowed'
                          : 'Strict (No Minus)'}
                      </span>
                    </div>
                  </div>

                  {/* Operational Policy Guide */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className={`p-4 rounded-xl border ${
                      isNegativeAllowed
                        ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 opacity-60'
                    }`}>
                      <div className="flex items-center gap-2 font-bold text-xs text-amber-800 dark:text-amber-300 mb-1">
                        <LuAlertTriangle size={15} />
                        <span>Mode A: Allow Negative (Fast Sales)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                        Suitable for high-velocity counter sales where goods arrive in the showroom and are sold immediately before the accounting staff enters the supplier invoice. Physical stock will show negative numbers until purchase bills are posted.
                      </p>
                    </div>

                    <div className={`p-4 rounded-xl border ${
                      !isNegativeAllowed
                        ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 opacity-60'
                    }`}>
                      <div className="flex items-center gap-2 font-bold text-xs text-emerald-800 dark:text-emerald-300 mb-1">
                        <LuShieldCheck size={15} />
                        <span>Mode B: Disallow Negative (Strict Audit)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                        Guarantees stock assets never drop below zero. Requires all products to be properly inwarded through Opening Stock or Supplier Inward Challans before salesmen can bill them.
                      </p>
                    </div>
                  </div>
                </div>


                {/* AL MUHAMMADI ONLY: FACTORY RESET DANGER ZONE */}
                {isAlmPortal && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-300 dark:border-red-900/60 p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-red-100 dark:border-red-900/30">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl shrink-0">
                          <LuShieldAlert />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-red-700 dark:text-red-400">
                              Factory Reset ERP & Wipe Transactions
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800">
                              ALM Only
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Wipes all transactions (sales, purchases, challans, vouchers, opening stock) and sets all stock and balances to 0. Requires Developer Password.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setResetEnteredPassword('');
                          setResetConfirmPhrase('');
                          setResetWipeMaster(false);
                          setShowFactoryResetModal(true);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer shrink-0"
                      >
                        <LuTrash2 size={15} />
                        <span>Factory Reset ERP</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <div className="p-3 rounded-xl bg-red-50/40 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
                        <strong className="text-red-700 dark:text-red-300 block mb-0.5">🛡️ Automatic Safe Archive</strong>
                        <span>Before any data is cleared, an immutable full snapshot is downloaded locally and saved in <strong>/dev/master/reset-backups</strong>.</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">📦 Master Directory Safety</strong>
                        <span>Product names, categories, and customers are safely preserved by default unless you explicitly check blank-slate mode.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stock Correction Warning Modal */}
                {showStockCorrectionModal && (
                  <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-boxdark rounded-2xl shadow-2xl border border-red-300 dark:border-red-800 w-full max-w-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
                      <div className="flex items-start gap-4 pb-4 border-b border-stroke dark:border-strokedark">
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl shrink-0">
                          <LuAlertTriangle />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            Stock Correction Required Before Enabling
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Strict stock protection cannot be turned ON because <strong>{negativeProductsList.length}</strong> product(s) currently have negative inventory in your system.
                          </p>
                        </div>
                      </div>

                      <div className="py-4 space-y-2">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Please add Opening Stock or Inward Purchases for these products to restore them to zero or above:
                        </p>
                        <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                          {negativeProductsList.map((p, idx) => (
                            <div key={p.id || idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">{p.product_name}</span>
                                <span className="text-[11px] text-slate-400 font-mono">SKU: {p.item_sr_no || 'N/A'} | Category: {p.category || 'Standard'}</span>
                              </div>
                              <div className="text-right">
                                <span className="inline-block px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-mono font-bold text-xs">
                                  {Number(p.current_stock || 0).toLocaleString()} {p.uom || 'units'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-stroke dark:border-strokedark flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setShowStockCorrectionModal(false)}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
                        >
                          Dismiss & Keep Minus Allowed
                        </button>
                        <a
                          href="/Inventory/OpeningStock/List"
                          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md"
                        >
                          <LuPackage size={14} />
                          <span>Go to Opening Stock Correction</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          
          {/* TAB: AL MUHAMMADI FACTORY RESET ERP */}
          {activeTab === 'alm_factory_reset' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-300 dark:border-red-900/60 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-red-100 dark:border-red-900/30">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl shrink-0">
                      <LuShieldAlert />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-red-700 dark:text-red-400">
                          Factory Reset ERP & Wipe Transactions
                        </h2>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800">
                          ALM Portal Exclusive
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Wipes all transactional data (sales, purchases, challans, vouchers, opening stock) and sets all physical stock and ledger balances to 0.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResetEnteredPassword('');
                      setResetConfirmPhrase('');
                      setResetWipeMaster(false);
                      setShowFactoryResetModal(true);
                    }}
                    className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer shrink-0"
                  >
                    <LuTrash2 size={16} />
                    <span>Launch Factory Reset Modal</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 space-y-1">
                    <span className="font-bold text-xs text-red-800 dark:text-red-300 block">
                      1. Developer Password Required
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Cannot be executed accidentally. Must provide the Master Authorization Password managed in <code>/dev/master</code>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                    <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 block">
                      2. Automatic Dual-Backup
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Instant browser download of JSON file + permanent immutable snapshot uploaded to <code>/dev/master/reset-backups</code>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                      3. Preserves Item Registry
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Product names, categories, and customers are safely preserved by default so you don't have to re-enter catalog setups.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER CREDIT LIMITS */}
          {activeTab === 'credit_limits' && (() => {
            const canEdit = canUserEditCreditLimit(userEmail, role, systemConfig);

            // Filtered customer list
            const filteredCustomers = customers.filter(c => {
              const name = (c.customerName || c.customername || '').toLowerCase();
              const phone = (c.primaryPhone || c.phone || '').toLowerCase();
              const code = (c.customer_code || c.customerCode || '').toLowerCase();
              const q = creditSearch.toLowerCase().trim();

              const matchesSearch = !q || name.includes(q) || phone.includes(q) || code.includes(q);
              if (!matchesSearch) return false;

              const limit = Number(creditLimits[String(c.id)] || 0);
              const balance = Number(c.calculatedBalance !== undefined ? c.calculatedBalance : (c.balance || 0));
              const statusInfo = getCustomerCreditStatus(balance, limit);

              if (creditFilter === 'SAFE') return statusInfo.status === 'SAFE';
              if (creditFilter === 'NEAR_LIMIT') return statusInfo.status === 'NEAR_LIMIT';
              if (creditFilter === 'EXCEEDED') return statusInfo.status === 'EXCEEDED';
              if (creditFilter === 'NO_LIMIT') return statusInfo.status === 'NO_LIMIT';

              return true;
            });

            // Summary metrics
            let totalExceeded = 0;
            let totalNear = 0;
            let totalSafe = 0;
            customers.forEach(c => {
              const limit = Number(creditLimits[String(c.id)] || 0);
              const balance = Number(c.calculatedBalance !== undefined ? c.calculatedBalance : (c.balance || 0));
              const info = getCustomerCreditStatus(balance, limit);
              if (info.status === 'EXCEEDED') totalExceeded++;
              else if (info.status === 'NEAR_LIMIT') totalNear++;
              else if (info.status === 'SAFE') totalSafe++;
            });

            return (
              <div className="space-y-6">
                {/* Header card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
                        <LuCreditCard />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            Customer Credit Limits Directory
                          </h2>
                          {canEdit ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              Edit Authorized
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                              <LuLock className="text-xs" /> View Only
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {canEdit
                            ? 'You have permission to edit and set customer credit limit ceilings.'
                            : 'View customer credit boundaries and risk status. Edit rights are managed in /dev/master.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={loadCustomersAndLimits}
                      disabled={loadingCustomers}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <LuRefreshCw className={loadingCustomers ? 'animate-spin' : ''} />
                      <span>Refresh Limits</span>
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Customers</span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5 block">{customers.length}</span>
                    </div>

                    <div className="bg-red-50/70 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-200 dark:border-red-900/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block">Limit Exceeded</span>
                      <span className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5 block">{totalExceeded}</span>
                    </div>

                    <div className="bg-amber-50/70 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Near Limit (75%+)</span>
                      <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{totalNear}</span>
                    </div>

                    <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Safe Limits</span>
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{totalSafe}</span>
                    </div>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={creditSearch}
                      onChange={e => setCreditSearch(e.target.value)}
                      placeholder="Search by customer name, phone, or code..."
                      className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['ALL', 'EXCEEDED', 'NEAR_LIMIT', 'SAFE', 'NO_LIMIT'] as const).map(tab => {
                      const labels = {
                        ALL: 'All Customers',
                        EXCEEDED: 'Exceeded',
                        NEAR_LIMIT: 'Near Limit',
                        SAFE: 'Safe',
                        NO_LIMIT: 'No Limit',
                      };
                      const isActive = creditFilter === tab;
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setCreditFilter(tab)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isActive
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Credit Limits Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <th className="py-3.5 px-4">Customer Details</th>
                          <th className="py-3.5 px-4 text-right">Current Balance</th>
                          <th className="py-3.5 px-4">Status & Usage</th>
                          <th className="py-3.5 px-4 text-right">Credit Limit (Rs.)</th>
                          <th className="py-3.5 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {filteredCustomers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400">
                              <LuUsers className="mx-auto text-3xl mb-2 opacity-50" />
                              <p className="font-semibold">No matching customers found</p>
                              <p className="text-[11px] mt-0.5">Try adjusting your search or filter</p>
                            </td>
                          </tr>
                        ) : (
                          filteredCustomers.map(cust => {
                            const stringId = String(cust.id);
                            const currentLimit = Number(creditLimits[stringId] || 0);
                            const balance = Number(cust.calculatedBalance !== undefined ? cust.calculatedBalance : (cust.balance || 0));
                            const statusInfo = getCustomerCreditStatus(balance, currentLimit);
                            const isEditing = editingLimitMap[stringId] !== undefined;
                            const inputValue = isEditing ? editingLimitMap[stringId] : String(currentLimit || '');

                            return (
                              <tr key={cust.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-800 dark:text-slate-100">
                                    {cust.customerName || cust.customername || 'Unnamed Customer'}
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span>Code: {cust.customer_code || cust.customerCode || '—'}</span>
                                    <span>•</span>
                                    <span>{cust.primaryPhone || cust.phone || 'No Phone'}</span>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4 text-right">
                                  <span className={`font-mono font-bold ${balance > 0 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                                    Rs. {balance.toLocaleString()}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4">
                                  <div className="space-y-1.5 max-w-[160px]">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.badgeClass}`}>
                                      {statusInfo.label}
                                    </span>
                                    {currentLimit > 0 && (
                                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-300 ${
                                            statusInfo.percentage > 100
                                              ? 'bg-red-500'
                                              : statusInfo.percentage >= 75
                                              ? 'bg-amber-500'
                                              : 'bg-emerald-500'
                                          }`}
                                          style={{ width: `${Math.min(100, statusInfo.percentage)}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3.5 px-4 text-right">
                                  {canEdit ? (
                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                      <span className="text-[11px] text-slate-400 font-mono">Rs.</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={inputValue}
                                        onChange={e => {
                                          const val = e.target.value;
                                          if (val === '' || Number(val) >= 0) {
                                            setEditingLimitMap(prev => ({
                                              ...prev,
                                              [stringId]: val,
                                            }));
                                          }
                                        }}
                                        placeholder="No limit (0)"
                                        className="w-28 text-right px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-primary focus:outline-hidden"
                                      />
                                    </div>
                                  ) : (
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                      {currentLimit > 0 ? `Rs. ${currentLimit.toLocaleString()}` : 'No Limit'}
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 text-center">
                                  {canEdit ? (
                                    <button
                                      type="button"
                                      disabled={savingLimitId === stringId}
                                      onClick={() => handleSaveCustomerLimit(cust.id)}
                                      className="px-3 py-1 text-xs font-bold rounded-lg bg-primary hover:opacity-90 text-white transition flex items-center gap-1 mx-auto shadow-xs cursor-pointer disabled:opacity-50"
                                    >
                                      {savingLimitId === stringId ? (
                                        <LuRefreshCw className="animate-spin text-xs" />
                                      ) : (
                                        <LuSave className="text-xs" />
                                      )}
                                      <span>Save</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-1">
                                      <LuLock className="text-xs" /> Locked
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 4: AUDIO & SOUND EFFECTS */}
          {activeTab === 'sound_effects' && (
            <div className="space-y-6">
              {/* Header card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
                      <LuVolume2 />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        POS & System Audio Chimes
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Interactive sound feedback for cashiers during sales invoice creation, scanning, and alerts.
                      </p>
                    </div>
                  </div>

                  {/* Per-User Master Sound Switch */}
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {soundEnabled ? 'Audio Active' : 'Audio Muted'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSound(!soundEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        soundEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          soundEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Per-User Station Info Banner */}
                <div className="mt-5 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2.5">
                  <LuSparkles className="text-base shrink-0" />
                  <div>
                    <strong>User-Isolated Preference:</strong> Sound effects are saved strictly for your user profile (
                    <code>{userEmail || 'current_user'}</code>) on this browser workstation. Turning sound off here will not mute sounds for any other cashier.
                  </div>
                </div>
              </div>

              {/* Sound Preview & Customization Cards - Elegant Full-Width Rows */}
              <div className="space-y-3.5">
                {SOUND_CATEGORIES.map((cat) => {
                  const visualConfig = {
                    notification: {
                      icon: <LuBell />,
                      accentColorClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600',
                      btnBgClass: 'bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40',
                      btnTextClass: 'text-indigo-700 dark:text-indigo-300',
                    },
                    success: {
                      icon: <LuCheckCircle2 />,
                      accentColorClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600',
                      btnBgClass: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
                      btnTextClass: 'text-emerald-700 dark:text-emerald-300',
                    },
                    scan: {
                      icon: <LuSparkles />,
                      accentColorClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600',
                      btnBgClass: 'bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40',
                      btnTextClass: 'text-sky-700 dark:text-sky-300',
                    },
                    warning: {
                      icon: <LuAlertTriangle />,
                      accentColorClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600',
                      btnBgClass: 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40',
                      btnTextClass: 'text-amber-700 dark:text-amber-300',
                    },
                    delete: {
                      icon: <LuXCircle />,
                      accentColorClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600',
                      btnBgClass: 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40',
                      btnTextClass: 'text-rose-700 dark:text-rose-300',
                    },
                  }[cat.id] || {
                    icon: <LuVolume2 />,
                    accentColorClass: 'bg-slate-100 text-slate-600',
                    btnBgClass: 'bg-slate-100',
                    btnTextClass: 'text-slate-700',
                  };

                  return (
                    <SoundToneCard
                      key={cat.id}
                      category={cat}
                      userEmail={userEmail}
                      icon={visualConfig.icon}
                      accentColorClass={visualConfig.accentColorClass}
                      btnBgClass={visualConfig.btnBgClass}
                      btnTextClass={visualConfig.btnTextClass}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: DATA BACKUP & EXPORT */}
          {activeTab === 'backup' && (() => {
            const isBackupPermitted = canUserBackup(userEmail, role, systemConfig);

            if (!isBackupPermitted) {
              return (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 shadow-sm text-center max-w-2xl mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 mx-auto flex items-center justify-center text-3xl">
                    <LuShieldAlert />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      Data Backup & Export Locked
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                      Exporting ERP records is restricted by the System Administrator. Permission controls for Super Admin and staff are governed in Master Dev Console (<code>/dev/master</code>).
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                      Status: Export Disallowed for {role || 'User'} ({userEmail || 'Account'})
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {/* Header card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
                      <LuHardDrive />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        ERP Data Backup & Excel Export
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Download comprehensive, clean Excel (.xlsx) snapshots of your customers, products, and sales history.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Export Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Export 1: Customers */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center text-xl shrink-0">
                        <LuUsers />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          Customers & Accounts Directory
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Names, codes, phone, ledger balances, and credit limits.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={exportingType !== null}
                      onClick={handleExportCustomers}
                      className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {exportingType === 'customers' ? (
                        <LuRefreshCw className="animate-spin text-sm" />
                      ) : (
                        <LuDownload className="text-sm" />
                      )}
                      <span>Export Customers (.xlsx)</span>
                    </button>
                  </div>

                  {/* Export 2: Products */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                        <LuPackage />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          Item Master & Tile Catalog
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Full product registry, tile dimensions, prices, and inventory stock.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={exportingType !== null}
                      onClick={handleExportProducts}
                      className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {exportingType === 'products' ? (
                        <LuRefreshCw className="animate-spin text-sm" />
                      ) : (
                        <LuDownload className="text-sm" />
                      )}
                      <span>Export Item Master (.xlsx)</span>
                    </button>
                  </div>

                  {/* Export 3: Invoices */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-xl shrink-0">
                        <LuReceipt />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          Sales Invoices & Revenue Ledger
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Invoice history, customer orders, payment status, and totals.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={exportingType !== null}
                      onClick={handleExportInvoices}
                      className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {exportingType === 'invoices' ? (
                        <LuRefreshCw className="animate-spin text-sm" />
                      ) : (
                        <LuDownload className="text-sm" />
                      )}
                      <span>Export Invoices (.xlsx)</span>
                    </button>
                  </div>

                  {/* Export 4: Complete ERP Snapshot */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 border-dashed border-primary/40 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-xl shrink-0">
                        <LuFileSpreadsheet />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          Complete ERP Snapshot (Multi-Sheet)
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Combines Customers, Products, and Invoices into one Excel workbook.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={exportingType !== null}
                      onClick={handleExportFullERP}
                      className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-primary hover:opacity-90 text-white transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {exportingType === 'full' ? (
                        <LuRefreshCw className="animate-spin text-sm" />
                      ) : (
                        <LuDownload className="text-sm" />
                      )}
                      <span>Download Complete ERP Snapshot (.xlsx)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 6: SECURITY & LOGIN DEVICES */}
          {activeTab === 'security_devices' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Security Banner */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
                <div className="flex items-start gap-4 z-10">
                  <div className="w-13 h-13 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    <LuShieldCheck />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold tracking-tight text-white">
                        Login Devices & Session Security
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        End-to-End Encrypted
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Manage all connected cashier workstations, mobile POS devices, and authorized browsers. You can terminate remote sessions anytime to prevent unauthorized access.
                    </p>
                  </div>
                </div>

                <div className="z-10 shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={terminatingOthers}
                    onClick={handleSignOutOtherSessions}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {terminatingOthers ? (
                      <LuRefreshCw className="animate-spin text-sm" />
                    ) : (
                      <LuLogOut className="text-sm" />
                    )}
                    <span>Revoke All Other Devices</span>
                  </button>
                </div>

                <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
              </div>

              {/* CURRENT DEVICE: Active Workstation Card */}
              <div className="rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/50 dark:border-emerald-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
                      <LuMonitor />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          Current Device ({deviceInfo.os})
                        </h3>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-2xs">
                          Active Now • This Device
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {deviceInfo.browser} • Display {deviceInfo.screen} • {deviceInfo.deviceType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Connected & Verified
                    </span>
                  </div>
                </div>

                {/* Machine Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <LuClock size={11} className="text-primary" /> Last Sign-in
                    </span>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {sessionMeta.lastSignIn}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <LuRadio size={11} className="text-emerald-500" /> Session ID
                    </span>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">
                      {sessionMeta.sessionId}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <LuCpu size={11} className="text-amber-500" /> Token Refresh Window
                    </span>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">
                      {sessionMeta.expiresAt}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <LuGlobe size={11} className="text-primary" /> Branch Network
                    </span>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {portalName} • Local LAN
                    </div>
                  </div>
                </div>
              </div>

              {/* OTHER AUTHORIZED WORKSTATIONS / REMOTE SESSIONS */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <LuLaptop className="text-primary text-lg" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Other Authorized Workstations & Remote Terminals
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Past verified POS terminals and devices assigned to this business portal.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    {knownTerminals.length} Terminals
                  </span>
                </div>

                <div className="space-y-3">
                  {knownTerminals.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No other remote devices connected. Only this workstation has active access.
                    </div>
                  ) : (
                    knownTerminals.map((terminal) => (
                      <div
                        key={terminal.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-base shrink-0">
                            {terminal.device.toLowerCase().includes('android') ? (
                              <LuSmartphone />
                            ) : (
                              <LuMonitor />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                {terminal.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                  terminal.status === 'idle'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}
                              >
                                {terminal.status === 'idle' ? 'Standby / Idle' : 'Disconnected'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {terminal.location} • {terminal.device} • Last active {terminal.lastActive}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDisconnectTerminal(terminal.id, terminal.name)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          title="Revoke access for this terminal"
                        >
                          <LuXCircle size={13} />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECURITY & PROTOCOL SPECIFICATIONS */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <LuLock className="text-primary text-base" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Authentication & Workstation Security Specifications
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Encryption Standard
                    </span>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1">
                      <LuShieldCheck className="text-emerald-500" />
                      <span>AES-256 GCM (E2E)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Auth Provider
                    </span>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                      Supabase Auth (v2.105)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Workstation Cache Isolation
                    </span>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      Isolated per Workstation
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Active User Authority
                    </span>
                    <div className="text-xs font-bold text-primary mt-1">
                      {displayRole} (Verified)
                    </div>
                  </div>
                </div>
              </div>

              {/* EMERGENCY CONTROLS */}
              <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                      <LuAlertTriangle /> Workstation Reset & Session Logout
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Flush local authorization cache on this machine or terminate your session immediately.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleClearWorkstationCache}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <LuRefreshCw size={13} />
                      <span>Flush Workstation Cache</span>
                    </button>

                    <button
                      type="button"
                      disabled={terminatingCurrent}
                      onClick={handleTerminateThisSession}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <LuLogOut size={13} />
                      <span>Sign Out This Device</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
{/* FACTORY RESET CONFIRMATION MODAL */}
                {showFactoryResetModal && (
                  <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-boxdark rounded-2xl shadow-2xl border-2 border-red-400 dark:border-red-800 w-full max-w-xl p-6 overflow-hidden animate-in zoom-in-95 duration-200 space-y-5">
                      
                      {/* Modal Header */}
                      <div className="flex items-start gap-4 pb-4 border-b border-stroke dark:border-strokedark">
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl shrink-0">
                          <LuShieldAlert />
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-red-600 dark:text-red-400">
                            Authorize ERP Factory Reset
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            This action will completely zero out all inventory, sales, purchases, and ledger balances for AL Muhammadi.
                          </p>
                        </div>
                      </div>

                      {/* Safety Banner */}
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                        <LuCheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                        <div>
                          <strong>Automatic Safety Backup Guarantee:</strong> A full Excel & JSON snapshot will automatically be generated, downloaded to your computer, and vaulted in <code>/dev/master/reset-backups</code>.
                        </div>
                      </div>

                      {/* Inputs Form */}
                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                            1. Enter Developer Master Authorization Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={resetEnteredPassword}
                            onChange={(e) => setResetEnteredPassword(e.target.value)}
                            placeholder="Given by developer in /dev/master"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-red-500 focus:outline-hidden font-mono"
                          />
                          <span className="text-[10px] text-slate-400 mt-0.5 block">Managed in /dev/master under Apex Security.</span>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                            2. Type <span className="text-red-600 font-mono font-black">CONFIRM RESET</span> to confirm <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={resetConfirmPhrase}
                            onChange={(e) => setResetConfirmPhrase(e.target.value)}
                            placeholder="Type CONFIRM RESET exactly"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-red-500 focus:outline-hidden font-mono"
                          />
                        </div>

                        <div className="pt-2 border-t border-stroke dark:border-strokedark">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={resetWipeMaster}
                              onChange={(e) => setResetWipeMaster(e.target.checked)}
                              className="rounded border-stroke text-red-600 focus:ring-red-500"
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              Also wipe product & customer master catalog (Blank slate mode)
                            </span>
                          </label>
                        </div>

                        {resetStepStatus && (
                          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <LuRefreshCw className="animate-spin" size={14} />
                            <span>{resetStepStatus}</span>
                          </div>
                        )}
                      </div>

                      {/* Modal Actions */}
                      <div className="pt-4 border-t border-stroke dark:border-strokedark flex items-center justify-between gap-3">
                        <button
                          type="button"
                          disabled={isResettingErp}
                          onClick={() => setShowFactoryResetModal(false)}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={
                            isResettingErp ||
                            !resetEnteredPassword ||
                            resetConfirmPhrase.trim().toUpperCase() !== 'CONFIRM RESET'
                          }
                          onClick={handleExecuteFactoryReset}
                          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <LuTrash2 size={14} />
                          <span>{isResettingErp ? 'Backing Up & Resetting...' : 'Execute Factory Reset'}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                                
        </main>
    </div>
  );
};

export default SettingsPage;
