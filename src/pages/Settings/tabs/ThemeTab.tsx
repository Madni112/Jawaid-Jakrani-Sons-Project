import React, { useState, useEffect, useRef } from 'react';
import {
  LuBookmark,
  LuCheck,
  LuChevronDown,
  LuChevronRight,
  LuLaptop,
  LuLayers,
  LuLogOut,
  LuMonitor,
  LuMoon,
  LuPalette,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuPenLine,
  LuPlus,
  LuRotateCcw,
  LuSave,
  LuSearch,
  LuSlidersHorizontal,
  LuSparkles,
  LuSun,
  LuTrash2,
  LuX,
} from 'react-icons/lu';
import toast from 'react-hot-toast';
import useColorMode from '../../../hooks/useColorMode';
import { triggerFeedbackSound } from '../../../utils/audioFeedback';
import { getBrandConfig } from '../../../utils/brand';
import {
  PRESET_THEME_COLORS,
  applyAccentColor,
  getSavedAccentColor,
  applySidebarColor,
  getSavedSidebarColor,
  getSafeSidebarColor,
  getContrastTextColor,
  isDarkModeActive,
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
  applyThemeSuite,
  getActiveThemeSuiteId,
  SidebarBehaviorMode,
  getSidebarBehaviorMode,
  setSidebarBehaviorMode,
  ReportLayoutMode,
  getReportLayoutMode,
  setReportLayoutMode,
  FooterLayoutMode,
  getFooterLayoutMode,
  setFooterLayoutMode,
  ComponentDesignMode,
  getFooterDesignMode,
  setFooterDesignMode,
  getSidebarDesignMode,
  setSidebarDesignMode,
  getNavbarDesignMode,
  setNavbarDesignMode,
} from '../../../constant/themeConfig';

interface ThemeTabProps {
  isRTL?: boolean;
}

export const ThemeTab: React.FC<ThemeTabProps> = ({ isRTL = false }) => {
  const [colorMode, setColorMode] = useColorMode();
  const brand = getBrandConfig();
  const portalCode = brand.code;
  const [themeSubTab, setThemeSubTab] = useState<'navbar' | 'sidebar'>('sidebar');
  const [sidebarPreviewMode, setSidebarPreviewMode] = useState<'opened' | 'closed'>('opened');
  const [sidebarActiveConfigTab, setSidebarActiveConfigTab] = useState<'master-themes' | 'theme' | 'accent' | 'layout' | 'drawer' | 'colors'>('master-themes');
  const [previewHoverOpen, setPreviewHoverOpen] = useState<boolean>(false);
  const [previewColorDropdownOpen, setPreviewColorDropdownOpen] = useState<boolean>(false);
  const colorFlyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorFlyoutRef.current && !colorFlyoutRef.current.contains(event.target as Node)) {
        setPreviewColorDropdownOpen(false);
      }
    };

    if (previewColorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [previewColorDropdownOpen]);

  // Curated Theme Suites & Sidebar Background State
  const [activeSuiteId, setActiveSuiteId] = useState<string>(() => getActiveThemeSuiteId());
  const [sidebarThemeMode, setSidebarThemeModeState] = useState<SidebarThemeMode>(() => getSidebarThemeMode());

  // Custom Sidebar Background (Gradient / Solid) & Saved Themes State
  const [sidebarCustomBg, setSidebarCustomBg] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('jakwani_sidebar_custom_bg') || '' : '';
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
      const raw = localStorage.getItem('jakwani_saved_sidebar_themes');
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
    (typeof window !== 'undefined' ? localStorage.getItem('jakwani_sidebar_custom_bg') : '') || '#0F172A'
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
      const saved = localStorage.getItem('jakwani_master_theme_preset') as MasterThemePreset;
      if (saved === 'nht-1' || saved === 'nht-2' || saved === 'custom') return saved;
    }
    const sLayout = getSidebarLayoutMode();
    const nLayout = getNavbarLayoutMode();
    const accent = (typeof window !== 'undefined' ? localStorage.getItem('uzair_jibran_accent_color') || '' : '').toUpperCase();
    const customBg = typeof window !== 'undefined' ? localStorage.getItem('jakwani_sidebar_custom_bg') || '' : '';
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
      localStorage.setItem('jakwani_master_theme_preset', 'custom');
      window.dispatchEvent(new Event('jakwani_master_theme_preset_changed'));
    }
  };

  const handleApplyMasterPreset = (preset: 'nht-1' | 'nht-2') => {
    if (preset === 'nht-1') {
      // 1. Layout Geometries: Floating for Theme 1
      setSidebarLayout('floating');
      setSidebarLayoutMode('floating');
      setNavbarLayout('floating');
      setNavbarLayoutMode('floating');
      setFooterLayout('floating');
      setFooterLayoutMode('floating');

      // 2. Preferred Component Design Presets for Theme 1
      setSidebarDesign('theme-1');
      setSidebarDesignMode('theme-1');
      setNavbarDesign('theme-1');
      setNavbarDesignMode('theme-1');
      setFooterDesign('theme-1');
      setFooterDesignMode('theme-1');

      // 3. Cyber Teal / Cyan Theme 1 Accents
      applyAccentColor('#06B6D4');
      setSelectedAccentColor('#06B6D4');
      setAppliedAccentColor('#06B6D4');
      setCustomAccentHex('06B6D4');

      setSidebarThemeMode('dark');
      setSidebarThemeModeState('dark');
      localStorage.removeItem('jakwani_sidebar_custom_bg');
      setSidebarCustomBg('');

      const safe = getSafeSidebarColor('#FFFFFF');
      setSelectedSidebarColor(safe.safeColor);
      setAppliedSidebarColor(safe.safeColor);
      applySidebarColor(safe.safeColor);
      setCustomSidebarHex('FFFFFF');

      setMasterThemePreset('nht-1');
      if (typeof window !== 'undefined') {
        localStorage.setItem('jakwani_master_theme_preset', 'nht-1');
        localStorage.setItem('jakwani_base_master_theme', 'nht-1');
        window.dispatchEvent(new Event('jakwani_master_theme_preset_changed'));
      }

      toast.success(
        isRTL ? '✨ NHT تھیم 1 (جدید فلوٹنگ لے آؤٹ) فعال ہو گئی!' : '✨ NHT Theme 1 (Modern Floating Architecture) activated!',
        { id: 'master-theme-toast' }
      );
    } else {
      // 1. Layout Geometries: Classic for Theme 2
      setSidebarLayout('classic');
      setSidebarLayoutMode('classic');
      setNavbarLayout('classic');
      setNavbarLayoutMode('classic');
      setFooterLayout('classic');
      setFooterLayoutMode('classic');

      // 2. Preferred Component Design Presets for Theme 2
      setSidebarDesign('theme-2');
      setSidebarDesignMode('theme-2');
      setNavbarDesign('theme-2');
      setNavbarDesignMode('theme-2');
      setFooterDesign('theme-2');
      setFooterDesignMode('theme-2');

      // 3. Burgundy Wine Theme 2 Accents
      applyAccentColor('#800020');
      setSelectedAccentColor('#800020');
      setAppliedAccentColor('#800020');
      setCustomAccentHex('800020');

      setSidebarThemeMode('charcoal');
      setSidebarThemeModeState('charcoal');
      localStorage.setItem('jakwani_sidebar_custom_bg', '#1A1A1A');
      setSidebarCustomBg('#1A1A1A');

      const safe = getSafeSidebarColor('#FFFFFF');
      setSelectedSidebarColor(safe.safeColor);
      setAppliedSidebarColor(safe.safeColor);
      applySidebarColor(safe.safeColor);
      setCustomSidebarHex('FFFFFF');

      setMasterThemePreset('nht-2');
      if (typeof window !== 'undefined') {
        localStorage.setItem('jakwani_master_theme_preset', 'nht-2');
        localStorage.setItem('jakwani_base_master_theme', 'nht-2');
        window.dispatchEvent(new Event('jakwani_master_theme_preset_changed'));
      }

      toast.success(
        isRTL ? '🏛️ NHT تھیم 2 (کلاسک ایگزیکٹو لے آؤٹ) فعال ہو گئی!' : '🏛️ NHT Theme 2 (Classic Executive Architecture) activated!',
        { id: 'master-theme-toast' }
      );
    }
    triggerFeedbackSound('success');
  };

  const applyCustomSidebarBg = (bgCss: string, themeName?: string) => {
    markAsCustom();
    setSidebarCustomBg(bgCss);
    localStorage.setItem('jakwani_sidebar_custom_bg', bgCss);
    window.dispatchEvent(new Event('jakwani_sidebar_theme_changed'));
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
    localStorage.setItem('jakwani_saved_sidebar_themes', JSON.stringify(updated));

    applyCustomSidebarBg(bgCss, finalName);
    setCustomThemeName('');
  };

  const handleDeleteSavedTheme = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedCustomThemes.filter(t => t.id !== id);
    setSavedCustomThemes(updated);
    localStorage.setItem('jakwani_saved_sidebar_themes', JSON.stringify(updated));
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
        ? `${suite.urName} تھیم کامیابی سے لاگو ہو گئی!`
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
        : (isRTL ? '📌 مستقل کھلی سائیڈبار لاگو کر دی گئی' : '📌 Pinned Sidebar active: Sidebar remains permanently opened.'),
      { id: 'sidebar-behavior-toast' }
    );
  };

  const handleSidebarThemeChange = (mode: SidebarThemeMode) => {
    markAsCustom();
    setSidebarCustomBg('');
    localStorage.removeItem('jakwani_sidebar_custom_bg');
    setSidebarThemeMode(mode);
    setSidebarThemeModeState(mode);
    const safe = getSafeSidebarColor(selectedSidebarColor);
    applySidebarColor(safe.safeColor);
    setSelectedSidebarColor(safe.safeColor);
    setAppliedSidebarColor(safe.safeColor);
    setCustomSidebarHex(safe.safeColor.replace('#', ''));
    triggerFeedbackSound('success');
    toast.success(
      isRTL ? 'سائیڈبار کا پس منظر تبدیل کر دیا گیا' : `Sidebar background set to ${mode.toUpperCase()}!`,
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

  const isAccentChanged = selectedAccentColor.toLowerCase() !== appliedAccentColor.toLowerCase();
  const isSidebarChanged = selectedSidebarColor.toLowerCase() !== appliedSidebarColor.toLowerCase();

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
    triggerFeedbackSound('success');
    toast.success('Accent color applied successfully!');
    setTimeout(() => setAccentAppliedRecently(false), 2500);
  };

  const handleResetAccentColor = () => {
    setSelectedAccentColor(appliedAccentColor);
    setCustomAccentHex(appliedAccentColor.replace('#', ''));
  };

  const handleSidebarSelect = (hex: string) => {
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    setSelectedSidebarColor(cleanHex);
    setCustomSidebarHex(cleanHex.replace('#', ''));
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

    applySidebarColor(hexToApply);
    setAppliedSidebarColor(hexToApply);
    setSelectedSidebarColor(hexToApply);
    setCustomSidebarHex(hexToApply.replace('#', ''));
    setSidebarAppliedRecently(true);
    triggerFeedbackSound('success');
    toast.success('Sidebar color applied successfully!');
    setTimeout(() => setSidebarAppliedRecently(false), 2500);
  };

  const handleResetSidebarColor = () => {
    setSelectedSidebarColor(appliedSidebarColor);
    setCustomSidebarHex(appliedSidebarColor.replace('#', ''));
  };

  // Layout Styles: Sidebar, Navbar, Footer (Floating vs Classic) & Component Designs (Theme 1 vs Theme 2)
  const [sidebarLayout, setSidebarLayout] = useState<SidebarLayoutMode>(() => getSidebarLayoutMode());
  const [navbarLayout, setNavbarLayout] = useState<NavbarLayoutMode>(() => getNavbarLayoutMode());
  const [footerLayout, setFooterLayout] = useState<FooterLayoutMode>(() => getFooterLayoutMode());
  const [reportLayout, setReportLayout] = useState<ReportLayoutMode>(() => getReportLayoutMode());

  // Component Design Overrides (Auto / Theme 1 / Theme 2)
  const [sidebarDesign, setSidebarDesign] = useState<ComponentDesignMode>(() => getSidebarDesignMode());
  const [navbarDesign, setNavbarDesign] = useState<ComponentDesignMode>(() => getNavbarDesignMode());
  const [footerDesign, setFooterDesign] = useState<ComponentDesignMode>(() => getFooterDesignMode());

  const effectiveSidebarDesign = sidebarDesign === 'theme-1' ? 'theme-1' : sidebarDesign === 'theme-2' ? 'theme-2' : (masterThemePreset === 'nht-2' ? 'theme-2' : 'theme-1');
  const effectiveNavbarDesign = navbarDesign === 'theme-1' ? 'theme-1' : navbarDesign === 'theme-2' ? 'theme-2' : (masterThemePreset === 'nht-2' ? 'theme-2' : 'theme-1');
  const effectiveFooterDesign = footerDesign === 'theme-1' ? 'theme-1' : footerDesign === 'theme-2' ? 'theme-2' : (masterThemePreset === 'nht-2' ? 'theme-2' : 'theme-1');

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
        : '🏛️ Classic Edge Sidebar activated!',
      { id: 'sidebar-layout-toast' }
    );
  };

  const handleSetSidebarDesign = (mode: ComponentDesignMode) => {
    markAsCustom();
    setSidebarDesign(mode);
    setSidebarDesignMode(mode);
    toast.success(
      mode === 'theme-1'
        ? '🌟 Sidebar Theme 1 Design activated!'
        : mode === 'theme-2'
        ? '⚡ Sidebar Theme 2 (Modern Flyout) activated!'
        : '🔄 Sidebar Design synced with Master Theme!',
      { id: 'sidebar-design-toast' }
    );
  };

  const handleSetNavbarLayout = (mode: NavbarLayoutMode) => {
    markAsCustom();
    setNavbarLayout(mode);
    setNavbarLayoutMode(mode);
    toast.success(
      mode === 'floating'
        ? '🚀 Floating Modern Navbar activated!'
        : '🏛️ Classic Full-Width Navbar activated!',
      { id: 'navbar-layout-toast' }
    );
  };

  const handleSetNavbarDesign = (mode: ComponentDesignMode) => {
    markAsCustom();
    setNavbarDesign(mode);
    setNavbarDesignMode(mode);
    toast.success(
      mode === 'theme-1'
        ? '🌟 Navbar Theme 1 Design activated!'
        : mode === 'theme-2'
        ? '⚡ Navbar Theme 2 (Command Strip) activated!'
        : '🔄 Navbar Design synced with Master Theme!',
      { id: 'navbar-design-toast' }
    );
  };

  const handleSetFooterLayout = (mode: FooterLayoutMode) => {
    markAsCustom();
    setFooterLayout(mode);
    setFooterLayoutMode(mode);
    toast.success(
      mode === 'floating'
        ? '🚀 Floating Modern Footer activated!'
        : '🏛️ Classic Full-Width Footer activated!',
      { id: 'footer-layout-toast' }
    );
  };

  const handleSetFooterDesign = (mode: ComponentDesignMode) => {
    markAsCustom();
    setFooterDesign(mode);
    setFooterDesignMode(mode);
    toast.success(
      mode === 'theme-1'
        ? '🌟 Footer Theme 1 (Executive Card Dock) activated!'
        : mode === 'theme-2'
        ? '⚡ Footer Theme 2 (Sleek Command Strip) activated!'
        : '🔄 Footer Design synced with Master Theme!',
      { id: 'footer-design-toast' }
    );
  };

  const handleApplyPreset = (mode: 'floating' | 'classic') => {
    markAsCustom();
    setSidebarLayout(mode);
    setSidebarLayoutMode(mode);
    setNavbarLayout(mode);
    setNavbarLayoutMode(mode);
    setFooterLayout(mode);
    setFooterLayoutMode(mode);
    toast.success(
      mode === 'floating'
        ? '🚀 Full Floating Workspace (Sidebar, Navbar & Footer) activated!'
        : '🏛️ Full Classic Workspace (Sidebar, Navbar & Footer) activated!',
      { id: 'preset-layout-toast' }
    );
  };

  const handleResetLayoutToClassic = () => {
    handleApplyPreset('classic');
  };

  // System Master Permissions State
  const [systemConfig, setSystemConfig] = useState<SystemMasterConfig | null>(null);


  useEffect(() => {
    const syncColors = () => {
      const activeAccent = getSavedAccentColor();
      setAppliedAccentColor(activeAccent);
      setSelectedAccentColor(activeAccent);
      setCustomAccentHex(activeAccent.replace('#', ''));

      const isDark = isDarkModeActive();
      const currentSidebar = getSavedSidebarColor(isDark);
      const safeCheck = getSafeSidebarColor(
        localStorage.getItem('uzair_jibran_sidebar_raw_color') || currentSidebar,
        isDark
      );
      setAppliedSidebarColor(safeCheck.safeColor);
      setSelectedSidebarColor(safeCheck.safeColor);
      setCustomSidebarHex(safeCheck.safeColor.replace('#', ''));
      setWasSidebarAdjusted(safeCheck.wasAdjusted);
    };

    syncColors();
    window.addEventListener('uzair_jibran_theme_color_changed', syncColors);
    window.addEventListener('uzair_jibran_sidebar_color_changed', syncColors);
    window.addEventListener('color-mode-changed', syncColors);

    return () => {
      window.removeEventListener('uzair_jibran_theme_color_changed', syncColors);
      window.removeEventListener('uzair_jibran_sidebar_color_changed', syncColors);
      window.removeEventListener('color-mode-changed', syncColors);
    };
  }, [colorMode]);

  return (
            <div className="w-full animate-fadeIn">
              {/* LIVE STUDIO SIMULATION FRAME - FULL PAGE SIZE */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 shadow-xl overflow-hidden flex flex-col w-full h-[calc(100vh-80px)] min-h-[680px]">
                {/* Top Window Bar */}
                <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-300 font-semibold ml-2 hidden sm:inline">
                      Live ERP Workspace Preview & Configurator
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 uppercase">
                        Theme: {masterThemePreset === 'nht-1' ? 'NHT 1' : masterThemePreset === 'nht-2' ? 'NHT 2' : 'Custom'}
                      </span>
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border text-white shadow-2xs"
                        style={{ backgroundColor: selectedAccentColor }}
                      >
                        Accent: {selectedAccentColor.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800 uppercase">
                        {sidebarLayout === 'floating' ? 'Floating Card' : 'Classic Edge'}
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
                        <span>{isRTL ? "کھلی حالت" : "Opened View"}</span>
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
                        <span>{isRTL ? "بند حالت" : "Closed View"}</span>
                      </button>
                    </div>
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
                    const isSidebarTheme2 = effectiveSidebarDesign === 'theme-2';

                    return (
                      <div className="relative flex flex-col md:flex-row flex-1 h-[calc(100%-42px)] overflow-hidden bg-slate-100 dark:bg-[#070A0F] text-slate-900 dark:text-slate-100 transition-colors">
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
                          className={`transition-all duration-300 flex flex-col justify-between shrink-0 select-none h-full overflow-visible z-20 ${
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
                                  AM
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-black tracking-wide truncate">
                                    {brand.brandWord1 && brand.brandWord2 ? `${brand.brandWord1} ${brand.brandWord2}` : 'AL MUHAMMADI'}
                                  </div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: sidebarSubTextColor }}>
                                    {brand.brandSuffix || 'TILE EMPORIUM'}
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
                                  AM
                                </div>
                              </div>
                            )}

                            {/* SIDEBAR NAVIGATION TABS & DROPDOWN */}
                            <div className="space-y-1.5">
                              {[
                                {
                                  id: 'master-themes',
                                  label: isRTL ? 'ورک اسپیس تھیمز' : 'Workspace Themes',
                                  icon: LuLayers,
                                  badge: masterThemePreset === 'nht-1' ? 'Theme 1' : masterThemePreset === 'nht-2' ? 'Theme 2' : 'Custom',
                                },
                                {
                                  id: 'theme',
                                  label: isRTL ? 'سائیڈبار پس منظر تھیم' : 'Sidebar Background Theme',
                                  icon: LuPalette,
                                  badge: sidebarThemeMode.toUpperCase(),
                                },
                                {
                                  id: 'layout',
                                  label: isRTL ? 'ورک اسپیس و لے آؤٹ' : 'Workspace & Layout',
                                  icon: LuSlidersHorizontal,
                                  badge: sidebarLayout === 'floating' ? 'Floating' : 'Classic',
                                },
                                {
                                  id: 'drawer',
                                  label: isRTL ? 'کھلنے بند رہنے کا انداز' : 'Drawer Behavior',
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
                                    onClick={() => {
                                      setSidebarActiveConfigTab(tab.id as any);
                                      setPreviewColorDropdownOpen(false);
                                    }}
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

                              {/* 4. COLOR DROPDOWN (Theme 1 Accordion vs Theme 2 Flyout Popover) */}
                              {(() => {
                                const isColorActive = sidebarActiveConfigTab === 'accent' || sidebarActiveConfigTab === 'colors';
                                const isSidebarTheme2 = effectiveSidebarDesign === 'theme-2';

                                return (
                                  <div ref={colorFlyoutRef} className="relative space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!isEffectiveOpened && !isSidebarTheme2) {
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
                                      title={isRTL ? "رنگ و ایکسنٹ" : "Color (Navbar & Sidebar Colors)"}
                                    >
                                      <div className="flex items-center gap-2.5 truncate">
                                        <LuSparkles
                                          size={17}
                                          className="shrink-0 transition-transform group-hover:scale-110"
                                          style={{ color: isColorActive ? selectedAccentColor : selectedSidebarColor }}
                                        />
                                        {isEffectiveOpened && (
                                          <span className="truncate">{isRTL ? "رنگ و اسٹائل" : "Color"}</span>
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
                                          {isSidebarTheme2 ? (
                                            <LuChevronRight
                                              size={14}
                                              className={`transition-transform duration-200 stroke-[2.5] ${
                                                previewColorDropdownOpen ? (isRTL ? '-rotate-90' : 'rotate-90') : ''
                                              }`}
                                              style={{ color: isColorActive ? selectedAccentColor : selectedSidebarColor }}
                                            />
                                          ) : (
                                            <LuChevronDown
                                              size={14}
                                              className={`transition-transform duration-200 stroke-[2.5] ${
                                                previewColorDropdownOpen ? 'rotate-180' : ''
                                              }`}
                                              style={{ color: isColorActive ? selectedAccentColor : selectedSidebarColor }}
                                            />
                                          )}
                                        </div>
                                      )}
                                    </button>

                                    {/* THEME 2: FLOATING SIDE FLYOUT POPOVER */}
                                    {isSidebarTheme2 && previewColorDropdownOpen && (
                                      <div
                                        className={`absolute ${isRTL ? 'right-full mr-2' : 'left-full ml-2'} top-0 z-50 min-w-[230px] rounded-xl border p-1.5 backdrop-blur-xl animate-fadeIn shadow-2xl ${
                                          isLight
                                            ? 'border-slate-200 bg-white/95 text-slate-800'
                                            : 'border-[#2D2D2D] bg-[#1A1A1A]/95 text-slate-100 ring-1 ring-white/5'
                                        }`}
                                        style={{
                                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                                        }}
                                      >
                                        {/* Bridge to prevent pointer loss */}
                                        <div className={`absolute top-0 ${isRTL ? '-right-3' : '-left-3'} w-3 h-full bg-transparent`} />

                                        {/* Flyout Header */}
                                        <div
                                          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-b mb-1 flex items-center justify-between"
                                          style={{
                                            borderColor: isLight ? '#E2E8F0' : '#2D2D2D',
                                            color: isLight ? '#64748B' : '#94A3B8',
                                          }}
                                        >
                                          <span>{isRTL ? "رنگ و پیلٹ" : "Color Palette"}</span>
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold"
                                              style={{ backgroundColor: `${selectedAccentColor}20`, color: selectedAccentColor }}
                                            >
                                              Theme 2 Flyout
                                            </span>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewColorDropdownOpen(false);
                                              }}
                                              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                                              title="Close flyout"
                                            >
                                              <LuX size={12} />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Flyout Items */}
                                        <div className="flex flex-col gap-1">
                                          {/* Sub-item A: Navbar & Brand Accent Color */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSidebarActiveConfigTab('accent');
                                              setPreviewColorDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left group"
                                            style={{
                                              backgroundColor: sidebarActiveConfigTab === 'accent'
                                                ? (isLight ? `${selectedAccentColor}20` : `${selectedAccentColor}35`)
                                                : 'transparent',
                                              color: sidebarActiveConfigTab === 'accent'
                                                ? (isLight ? selectedAccentColor : '#FFFFFF')
                                                : (isLight ? '#1E293B' : '#E2E8F0'),
                                              border: sidebarActiveConfigTab === 'accent'
                                                ? `1px solid ${selectedAccentColor}50`
                                                : '1px solid transparent',
                                            }}
                                            title={isRTL ? "نیوبار و برانڈ ایکسنٹ کلر" : "Navbar & Brand Accent Color"}
                                          >
                                            <div className="flex items-center gap-2 truncate">
                                              <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs transition-transform group-hover:scale-125"
                                                style={{ backgroundColor: selectedAccentColor }}
                                              />
                                              <span className="truncate">
                                                {isRTL ? "نیوبار و برانڈ ایکسنٹ کلر" : "Navbar & Brand Accent"}
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
                                            onClick={() => {
                                              setSidebarActiveConfigTab('colors');
                                              setPreviewColorDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left group"
                                            style={{
                                              backgroundColor: sidebarActiveConfigTab === 'colors'
                                                ? (isLight ? `${selectedAccentColor}20` : `${selectedAccentColor}35`)
                                                : 'transparent',
                                              color: sidebarActiveConfigTab === 'colors'
                                                ? (isLight ? selectedAccentColor : '#FFFFFF')
                                                : (isLight ? '#1E293B' : '#E2E8F0'),
                                              border: sidebarActiveConfigTab === 'colors'
                                                ? `1px solid ${selectedAccentColor}50`
                                                : '1px solid transparent',
                                            }}
                                            title={isRTL ? "سائیڈبار فونٹ و آئکن کلر" : "Sidebar Font & Icon Color"}
                                          >
                                            <div className="flex items-center gap-2 truncate">
                                              <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs transition-transform group-hover:scale-125"
                                                style={{ backgroundColor: selectedSidebarColor }}
                                              />
                                              <span className="truncate">
                                                {isRTL ? "سائیڈبار فونٹ و آئکن کلر" : "Sidebar Font & Icon"}
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
                                      </div>
                                    )}

                                    {/* THEME 1: INLINE ACCORDION DRAWER */}
                                    {!isSidebarTheme2 && isEffectiveOpened && previewColorDropdownOpen && (
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
                                          title={isRTL ? "نیوبار و برانڈ ایکسنٹ کلر" : "Navbar & Brand Accent Color"}
                                        >
                                          <div className="flex items-center gap-2 truncate">
                                            <span
                                              className="w-2 h-2 rounded-full shrink-0 shadow-2xs transition-transform group-hover:scale-125"
                                              style={{ backgroundColor: selectedAccentColor }}
                                            />
                                            <span className="truncate">
                                              {isRTL ? "نیوبار و برانڈ ایکسنٹ کلر" : "Navbar & Brand Accent Color"}
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
                                          title={isRTL ? "سائیڈبار فونٹ و آئکن کلر" : "Sidebar Font & Icon Color"}
                                        >
                                          <div className="flex items-center gap-2 truncate">
                                            <span
                                              className="w-2 h-2 rounded-full shrink-0 shadow-2xs transition-transform group-hover:scale-125"
                                              style={{ backgroundColor: selectedSidebarColor }}
                                            />
                                            <span className="truncate">
                                              {isRTL ? "سائیڈبار فونٹ و آئکن کلر" : "Sidebar Font & Icon Color"}
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
                          <div className="pt-2 border-t mt-2" style={{ borderColor: sidebarBorderColor }}>
                            {/* Theme 2: Gemini-style Sidebar Collapse / Expand Toggle Option (Above Logout) */}
                            {isSidebarTheme2 && (
                              <button
                                type="button"
                                onClick={() => setSidebarPreviewMode(sidebarPreviewMode === 'opened' ? 'closed' : 'opened')}
                                className={`w-full flex items-center rounded-xl transition cursor-pointer text-left group ${
                                  isEffectiveOpened
                                    ? `justify-between px-2.5 p-2 mb-2 ${
                                        isLight
                                          ? 'hover:bg-slate-200/70 text-slate-700'
                                          : 'hover:bg-white/10 text-slate-300'
                                      }`
                                    : 'justify-center mx-auto w-10 h-10 p-0 mb-2 shadow-md hover:scale-105 active:scale-95'
                                }`}
                                style={{
                                  backgroundColor: !isEffectiveOpened ? selectedAccentColor : undefined,
                                  color: !isEffectiveOpened ? '#FFFFFF' : selectedSidebarColor,
                                }}
                                title={isEffectiveOpened ? (isRTL ? "سائیڈبار بند کریں" : "Collapse sidebar") : (isRTL ? "سائیڈبار کھولیں" : "Expand sidebar")}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <div className={`transition-all duration-200 ${
                                    !isEffectiveOpened
                                      ? 'flex items-center justify-center text-white'
                                      : `p-1.5 rounded-lg border ${
                                          isLight
                                            ? 'border-slate-300/80 bg-slate-100/80 text-slate-700 group-hover:border-slate-400 group-hover:bg-white'
                                            : 'border-white/15 bg-white/5 text-slate-200 group-hover:border-white/30 group-hover:bg-white/10'
                                        }`
                                  }`}>
                                    {isEffectiveOpened ? (
                                      <LuPanelLeftClose size={15} className="shrink-0" />
                                    ) : (
                                      <LuPanelLeftOpen size={18} className="shrink-0 text-white" />
                                    )}
                                  </div>
                                  {isEffectiveOpened && (
                                    <span className="text-xs font-semibold truncate">
                                      {isRTL ? "سائیڈبار بند کریں" : "Collapse sidebar"}
                                    </span>
                                  )}
                                </div>
                                {isEffectiveOpened && (
                                  <span className="text-[10px] font-mono opacity-50 px-1 py-0.5 rounded bg-black/10 dark:bg-white/10">
                                    {sidebarPreviewMode === 'opened' ? (isRTL ? 'بند' : 'Close') : (isRTL ? 'کھولیں' : 'Open')}
                                  </span>
                                )}
                              </button>
                            )}

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
                                <div className="flex items-center gap-1.5">
                                  <LuLogOut size={13} style={{ color: selectedSidebarColor, opacity: 0.7 }} />
                                </div>
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
                                  {portalCode || 'AM'} • Portal Active
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
                                    title={isRTL ? "لائٹ موڈ" : "Switch to Light Mode"}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                      colorMode === 'light'
                                        ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                                  >
                                    <LuSun size={13} className={colorMode === 'light' ? 'text-amber-500' : ''} />
                                    <span className="hidden sm:inline">{isRTL ? "لائٹ" : "Light"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (typeof setColorMode === 'function') setColorMode('dark');
                                    }}
                                    title={isRTL ? "ڈارک موڈ" : "Switch to Dark Mode"}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                      colorMode === 'dark'
                                        ? 'bg-slate-900 text-white shadow-xs ring-1 ring-slate-700'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                                  >
                                    <LuMoon size={13} className={colorMode === 'dark' ? 'text-indigo-400' : ''} />
                                    <span className="hidden sm:inline">{isRTL ? "ڈارک" : "Dark"}</span>
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
                          <div className="flex-1 p-4 sm:p-6 overflow-y-auto h-[calc(100%-65px)]">
                            {/* TAB 0: MASTER WORKSPACE THEMES (NHT Theme 1 vs NHT Theme 2) */}
                            {sidebarActiveConfigTab === 'master-themes' && (
                              <div className="space-y-5 animate-fadeIn">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <LuLayers size={17} style={{ color: selectedAccentColor }} />
                                      <span>{isRTL ? "ورک اسپیس تھیمز اور فن تعمیر" : "Workspace Themes & Architecture"}</span>
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      {isRTL
                                        ? "کیوریٹڈ ورک اسپیس لے آؤٹ میں سے انتخاب کریں یا ہر ایک کا لائیو اسٹرکچر دیکھیں۔"
                                        : "Select a curated workspace architecture preset with live structural skeleton preview."}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                                      masterThemePreset === 'nht-1'
                                        ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-800'
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
                                        ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20 ring-2 ring-cyan-500/20'
                                        : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-800 bg-white dark:bg-slate-900/60'
                                    }`}
                                  >
                                    <div>
                                      {/* Header row */}
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-xs" />
                                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                            NHT Theme 1
                                          </h5>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 uppercase tracking-wider">
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
                                                <div className="w-3.5 h-3.5 rounded-md bg-cyan-500 shadow-xs shrink-0" />
                                                <div className="w-8 h-1.5 rounded bg-slate-600" />
                                              </div>
                                              {/* Active item (Cyan Pill) */}
                                              <div className="w-full h-3 rounded-md bg-cyan-500/90 flex items-center px-1 gap-1">
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
                                                <div className="w-2 h-2 rounded bg-cyan-400" />
                                                <div className="w-12 h-1.5 rounded bg-slate-600" />
                                              </div>
                                              <div className="w-8 h-2 rounded-full bg-cyan-500/80" />
                                            </div>

                                            {/* Content cards */}
                                            <div className="flex-1 rounded-lg bg-slate-800/40 border border-slate-800 p-2 flex flex-col justify-between">
                                              <div className="grid grid-cols-2 gap-1.5">
                                                <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700/60 space-y-1">
                                                  <div className="w-6 h-1 rounded bg-slate-500" />
                                                  <div className="w-10 h-2 rounded bg-cyan-400 font-bold" />
                                                </div>
                                                <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700/60 space-y-1">
                                                  <div className="w-6 h-1 rounded bg-slate-500" />
                                                  <div className="w-8 h-2 rounded bg-slate-400" />
                                                </div>
                                              </div>
                                              <div className="h-6 rounded bg-slate-800/90 border border-slate-700/50 p-1 flex items-center gap-1">
                                                <div className="w-4 h-1 rounded bg-cyan-400" />
                                                <div className="w-14 h-1 rounded bg-slate-600" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                        Modern floating architecture with rounded detached sidebar cards, top floating bar, and dynamic cyan theme accent.
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
                                            ? 'bg-cyan-500 text-white shadow-xs'
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
                                        Classic edge-to-edge flush rail layout with charcoal sidebar, 2-tier floating category dropdowns, burgundy hero banner, and clean reporting.
                                      </p>
                                    </div>

                                    {/* Action button */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        Classic Edge Rail
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleApplyMasterPreset('nht-2');
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                          masterThemePreset === 'nht-2'
                                            ? 'bg-[#800020] text-white shadow-xs'
                                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        {masterThemePreset === 'nht-2' ? (
                                          <>
                                            <LuCheck size={13} />
                                            <span>Active</span>
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
                                      <span>{isRTL ? "سائیڈبار کا پس منظر انداز و گریڈینٹ" : "Sidebar Background Theme & Gradients"}</span>
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      {isRTL ? "12 کیوریٹڈ تھیمز، یا کسٹم لینیئر گریڈینٹ بنا کر محفوظ کریں۔" : "Choose from 12 curated themes, or craft and save your own custom gradients."}
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
                                    <span>{isRTL ? "کیوریٹڈ تھیمز" : "Curated Themes"} (12)</span>
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
                                    <span>{isRTL ? "کسٹم گریڈینٹ اسٹوڈیو" : "Custom & Gradient Studio"}</span>
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
                                    <span>{isRTL ? "محفوظ شدہ تھیمز" : "Saved Themes"} ({savedCustomThemes.length})</span>
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
                                        {isRTL ? "بیک گراؤنڈ ٹائپ:" : "Background Type:"}
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
                                          🌈 {isRTL ? "لینیئر گریڈینٹ" : "Linear Gradient"}
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
                                          ⬛ {isRTL ? "سولڈ رنگ" : "Solid Color"}
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
                                          <span>{isRTL ? "تھیم محفوظ کریں اور مجوزہ نام منتخب کریں:" : "Save this Theme & Pick a Suggested Name:"}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                          {isRTL ? "کسی بھی مجوزہ نام پر کلک کریں تاکہ خودکار طور پر نام داخل ہو جائے:" : "Click any suggested name pill below to quickly autofill, or type your own:"}
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
                                          <span>{isRTL ? "تھیم محفوظ کریں" : "Save & Apply Theme"}</span>
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
                                          {isRTL ? "ابھی تک کوئی کسٹم تھیم محفوظ نہیں کی گئی۔" : "No saved custom themes yet."}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                                          {isRTL ? "کسٹم گریڈینٹ اسٹوڈیو میں جا کر اپنی پسند کا نیا گریڈینٹ بنا کر محفوظ کریں۔" : "Craft your unique gradient or solid color in the Custom & Gradient Studio and save it here!"}
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
                                      <span>{isRTL ? "برانڈ کا بنیادی رنگ" : "Navbar & Brand Accent Color"}</span>
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      {isRTL ? "پیش نظارہ کریں اور ایکسنٹ رنگ محفوظ کرنے کے لیے کلک کریں۔" : "Controls top navbar buttons, active tab pills, badges, and primary accents across the ERP."}
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
                                          <span>{isRTL ? "رنگ لاگو کریں" : "Apply Accent Color"}</span>
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
                                      <span>{isRTL ? "ورک اسپیس نیویگیشن اور لے آؤٹ" : "Workspace Navigation & Layout"}</span>
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
                                    <span>{isRTL ? "کلاسک موڈ پر واپس جائیں" : "Reset to Classic (Undo)"}</span>
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
                                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white block">Left Sidebar Style</span>
                                        <p className="text-[10px] text-slate-400">Configure layout geometry and visual architecture.</p>
                                      </div>
                                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        {sidebarLayout === 'floating' ? 'Floating' : 'Classic'} • {effectiveSidebarDesign === 'theme-2' ? 'Theme 2' : 'Theme 1'}
                                      </span>
                                    </div>

                                    {/* Layout Geometry */}
                                    <div>
                                      <span className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                                        Layout Geometry (Select 1 of 2):
                                      </span>
                                      <div className="grid grid-cols-2 gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSetSidebarLayout('floating')}
                                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[68px] ${
                                            sidebarLayout === 'floating'
                                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">🚀 Floating</span>
                                            {sidebarLayout === 'floating' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                          </div>
                                          <p className="text-[9.5px] text-slate-400 leading-tight">Rounded detached card with shadow.</p>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleSetSidebarLayout('classic')}
                                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[68px] ${
                                            sidebarLayout === 'classic'
                                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">🏛️ Classic</span>
                                            {sidebarLayout === 'classic' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                          </div>
                                          <p className="text-[9.5px] text-slate-400 leading-tight">Edge-to-edge flush sidebar.</p>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Design Preset */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                      <span className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                                        Design Preset (Select 1 of 2):
                                      </span>
                                      <div className="grid grid-cols-2 gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSetSidebarDesign('theme-1')}
                                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[65px] ${
                                            effectiveSidebarDesign === 'theme-1'
                                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Theme 1 Design</span>
                                            {effectiveSidebarDesign === 'theme-1' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                          </div>
                                          <p className="text-[9.5px] text-slate-400 leading-tight">Hierarchical tree with accent badges.</p>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleSetSidebarDesign('theme-2')}
                                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[65px] ${
                                            effectiveSidebarDesign === 'theme-2'
                                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Theme 2 Design</span>
                                            {effectiveSidebarDesign === 'theme-2' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                          </div>
                                          <p className="text-[9.5px] text-slate-400 leading-tight">Amal multi-tier flyout with micro-dock.</p>
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Top Navbar Style */}
                                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white block">Top Navbar Style</span>
                                        <p className="text-[10px] text-slate-400">Configure top header geometry and styling.</p>
                                      </div>
                                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        {navbarLayout === 'floating' ? 'Floating' : 'Classic'} • {effectiveNavbarDesign === 'theme-2' ? 'Theme 2' : 'Theme 1'}
                                      </span>
                                    </div>

                                    {/* Layout Geometry */}
                                    <div>
                                      <span className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                                        Layout Geometry (Select 1 of 2):
                                      </span>
                                      <div className="grid grid-cols-2 gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSetNavbarLayout('floating')}
                                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[68px] ${
                                            navbarLayout === 'floating'
                                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">🚀 Floating</span>
                                            {navbarLayout === 'floating' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                          </div>
                                          <p className="text-[9.5px] text-slate-400 leading-tight">Floating pill card with elevation.</p>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleSetNavbarLayout('classic')}
                                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[68px] ${
                                            navbarLayout === 'classic'
                                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">🏛️ Classic</span>
                                            {navbarLayout === 'classic' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                          </div>
                                          <p className="text-[9.5px] text-slate-400 leading-tight">Edge-to-edge full width navbar.</p>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Design Preset */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                      <span className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                                        Design Preset (Select 1 of 2):
                                      </span>
                                      <div className="grid grid-cols-2 gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSetNavbarDesign('theme-1')}
                                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[65px] ${
                                            effectiveNavbarDesign === 'theme-1'
                                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Theme 1 Design</span>
                                            {effectiveNavbarDesign === 'theme-1' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                          </div>
                                          <p className="text-[9.5px] text-slate-400 leading-tight">Executive portal bar with quick actions.</p>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleSetNavbarDesign('theme-2')}
                                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[65px] ${
                                            effectiveNavbarDesign === 'theme-2'
                                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Theme 2 Design</span>
                                            {effectiveNavbarDesign === 'theme-2' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                          </div>
                                          <p className="text-[9.5px] text-slate-400 leading-tight">Streamlined dark command strip.</p>
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Footer Style & Architecture (NEW option after Top Navbar Style) */}
                                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white block">Footer Style & Architecture</span>
                                        <p className="text-[10px] text-slate-400">Configure bottom footer geometry and corporate styling.</p>
                                      </div>
                                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        {footerLayout === 'floating' ? 'Floating' : 'Classic'} • {effectiveFooterDesign === 'theme-2' ? 'Theme 2' : 'Theme 1'}
                                      </span>
                                    </div>

                                    {/* Layout Geometry */}
                                    <div>
                                      <span className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                                        Layout Geometry (Select 1 of 2):
                                      </span>
                                      <div className="grid grid-cols-2 gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSetFooterLayout('floating')}
                                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[68px] ${
                                            footerLayout === 'floating'
                                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">🚀 Floating</span>
                                            {footerLayout === 'floating' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                          </div>
                                          <p className="text-[9.5px] text-slate-400 leading-tight">Rounded detached card with elevation.</p>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleSetFooterLayout('classic')}
                                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[68px] ${
                                            footerLayout === 'classic'
                                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">🏛️ Classic</span>
                                            {footerLayout === 'classic' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                          </div>
                                          <p className="text-[9.5px] text-slate-400 leading-tight">Edge-to-edge full width flush footer.</p>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Design Preset */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                      <span className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                                        Design Preset (Select 1 of 2):
                                      </span>
                                      <div className="grid grid-cols-2 gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSetFooterDesign('theme-1')}
                                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[65px] ${
                                            effectiveFooterDesign === 'theme-1'
                                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Theme 1 Design</span>
                                            {effectiveFooterDesign === 'theme-1' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                          </div>
                                          <p className="text-[9.5px] text-slate-400 leading-tight">Executive card dock with developer telemetry.</p>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleSetFooterDesign('theme-2')}
                                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[65px] ${
                                            effectiveFooterDesign === 'theme-2'
                                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Theme 2 Design</span>
                                            {effectiveFooterDesign === 'theme-2' && <LuCheck size={13} className="text-blue-600 stroke-[3]" />}
                                          </div>
                                          <p className="text-[9.5px] text-slate-400 leading-tight">Sleek dark high-density command strip.</p>
                                        </button>
                                      </div>
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
                                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                              <span className="w-10 h-1 rounded bg-slate-500" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span className="w-6 h-1.5 rounded-full bg-cyan-500/30 border border-cyan-400/40" />
                                              <span className="w-5 h-1.5 rounded-full bg-slate-700" />
                                            </div>
                                          </div>
                                          {/* Mini Draggable Report Cards Grid (Theme 1 style) */}
                                          <div className="grid grid-cols-3 gap-1.5 flex-1 pt-1.5">
                                            <div className="p-1 rounded bg-slate-800/90 border border-slate-700 flex flex-col justify-between shadow-2xs">
                                              <div className="w-3 h-3 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[7px] font-black">📊</div>
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
                                      <span>{isRTL ? "سائیڈبار کھلنے اور بند رہنے کا انداز" : "Sidebar Default State & Interaction"}</span>
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
                                          {isRTL ? "مستقل کھلی رکھیں (پنڈ)" : "Always Opened (Pinned)"}
                                        </span>
                                        {sidebarBehavior === 'opened' && (
                                          <LuCheck size={14} className="text-blue-600 stroke-[3]" />
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {isRTL ? "سائیڈبار ہر وقت پوری چوڑائی کے ساتھ کھلی رہتی ہے۔" : "Sidebar remains fully expanded at all times for quick multi-tasking."}
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
                                          {isRTL ? "بند رکھیں (آٹو ڈراور)" : "Keep Closed (Smart Drawer)"}
                                        </span>
                                        {sidebarBehavior === 'closed' && (
                                          <LuCheck size={14} className="text-blue-600 stroke-[3]" />
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {isRTL ? "عام طور پر بند، ہوور یا کلک کرنے پر خود بخود کھلے۔" : "Collapses to compact icons. Automatically expands on hover or click."}
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
                                      <span>{isRTL ? "سائیڈبار فونٹس اور آئکنز کا رنگ" : "Sidebar Font & Icon Color"}</span>
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

  );
};
