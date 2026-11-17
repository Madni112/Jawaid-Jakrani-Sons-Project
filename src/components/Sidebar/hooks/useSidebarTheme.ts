import { useState, useEffect } from 'react';
import {
  SidebarLayoutMode,
  getSidebarLayoutMode,
  SidebarThemeMode,
  getSidebarThemeMode,
  isDarkModeActive,
  SidebarBehaviorMode,
  getSidebarBehaviorMode,
  MasterThemePreset,
  getMasterThemePreset,
  getEffectiveSidebarDesign,
  getSavedSidebarColor,
  getSafeSidebarColor
} from '../../../constant/themeConfig';

export function useSidebarTheme() {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [currentSidebarColor, setCurrentSidebarColor] = useState(getSavedSidebarColor());
  const [layoutMode, setLayoutMode] = useState<SidebarLayoutMode>(getSidebarLayoutMode());
  const [sidebarBehaviorMode, setSidebarBehaviorModeState] = useState<SidebarBehaviorMode>(getSidebarBehaviorMode());
  const [sidebarThemeMode, setSidebarThemeModeState] = useState<SidebarThemeMode>(getSidebarThemeMode());
  const [customSidebarBg, setCustomSidebarBg] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('jakwani_sidebar_custom_bg') || '' : '';
  });
  const [masterPreset, setMasterPreset] = useState<MasterThemePreset>(() => getMasterThemePreset());
  const [sidebarDesign, setSidebarDesign] = useState<'theme-1' | 'theme-2'>(() => getEffectiveSidebarDesign());
  const [, setWasContrastAdjusted] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const updateBehavior = () => {
      setSidebarBehaviorModeState(getSidebarBehaviorMode());
    };
    window.addEventListener('jakwani_sidebar_behavior_changed', updateBehavior);
    window.addEventListener('storage', updateBehavior);
    return () => {
      window.removeEventListener('jakwani_sidebar_behavior_changed', updateBehavior);
      window.removeEventListener('storage', updateBehavior);
    };
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      setSidebarThemeModeState(getSidebarThemeMode());
      setCustomSidebarBg(localStorage.getItem('jakwani_sidebar_custom_bg') || '');
    };
    window.addEventListener('jakwani_sidebar_theme_changed', updateTheme);
    window.addEventListener('jakwani_theme_suite_changed', updateTheme);
    window.addEventListener('storage', updateTheme);
    return () => {
      window.removeEventListener('jakwani_sidebar_theme_changed', updateTheme);
      window.removeEventListener('jakwani_theme_suite_changed', updateTheme);
      window.removeEventListener('storage', updateTheme);
    };
  }, []);

  useEffect(() => {
    const updateLayoutMode = () => {
      setLayoutMode(getSidebarLayoutMode());
    };
    window.addEventListener('uzair_jibran_sidebar_layout_changed', updateLayoutMode);
    window.addEventListener('storage', updateLayoutMode);
    return () => {
      window.removeEventListener('uzair_jibran_sidebar_layout_changed', updateLayoutMode);
      window.removeEventListener('storage', updateLayoutMode);
    };
  }, []);

  useEffect(() => {
    const updateMasterPreset = () => {
      setMasterPreset(getMasterThemePreset());
      setSidebarDesign(getEffectiveSidebarDesign());
    };
    window.addEventListener('jakwani_master_theme_preset_changed', updateMasterPreset);
    window.addEventListener('nht_sidebar_design_changed', updateMasterPreset);
    window.addEventListener('storage', updateMasterPreset);
    return () => {
      window.removeEventListener('jakwani_master_theme_preset_changed', updateMasterPreset);
      window.removeEventListener('nht_sidebar_design_changed', updateMasterPreset);
      window.removeEventListener('storage', updateMasterPreset);
    };
  }, []);

  useEffect(() => {
    const updateColors = () => {
      const inDark = isDarkModeActive();
      const raw = localStorage.getItem('uzair_jibran_sidebar_raw_color') || getSavedSidebarColor(inDark);
      const res = getSafeSidebarColor(raw, inDark);
      setCurrentSidebarColor(res.safeColor);
      setWasContrastAdjusted(res.wasAdjusted);
    };

    updateColors();

    window.addEventListener('uzair_jibran_sidebar_color_changed', updateColors);
    window.addEventListener('jakwani_sidebar_theme_changed', updateColors);
    window.addEventListener('jakwani_theme_suite_changed', updateColors);
    window.addEventListener('color-mode-changed', updateColors);
    window.addEventListener('storage', updateColors);

    return () => {
      window.removeEventListener('uzair_jibran_sidebar_color_changed', updateColors);
      window.removeEventListener('jakwani_sidebar_theme_changed', updateColors);
      window.removeEventListener('jakwani_theme_suite_changed', updateColors);
      window.removeEventListener('color-mode-changed', updateColors);
      window.removeEventListener('storage', updateColors);
    };
  }, []);

  const isMobile = windowWidth <= 750;
  const isTheme2 = sidebarDesign === 'theme-2';

  const themeStyles = (() => {
    switch (sidebarThemeMode) {
      case 'light':
        return {
          bg: 'bg-white',
          text: 'text-slate-800',
          border: 'border-slate-200/90 dark:border-slate-700/80',
          headerBorder: 'border-slate-100 dark:border-slate-200/80',
          dividerBorder: 'border-slate-200/90',
          toggleBg: 'bg-white',
          toggleBorder: 'border-slate-200 dark:border-slate-300',
          toggleText: 'text-slate-500 hover:text-slate-900',
          hoverBg: 'hover:bg-slate-100/90',
          itemHover: 'hover:bg-slate-100/90',
          logoutHover: 'hover:bg-rose-50 hover:text-rose-600',
          shadow: layoutMode === 'floating' ? 'shadow-xl shadow-slate-200/70 dark:shadow-2xl dark:shadow-black/60' : 'shadow-md',
          brandCard: 'bg-slate-50 border-slate-200',
          brandText: 'text-slate-900',
          brandSub: 'text-slate-500',
        };
      case 'navy':
        return {
          bg: 'bg-[#0F172A]',
          text: 'text-slate-100',
          border: 'border-slate-800/90',
          headerBorder: 'border-slate-800/80',
          dividerBorder: 'border-slate-800/90',
          toggleBg: 'bg-[#0F172A]',
          toggleBorder: 'border-slate-700',
          toggleText: 'text-slate-400 hover:text-white',
          hoverBg: 'hover:bg-slate-800/80',
          itemHover: 'hover:bg-white/10',
          logoutHover: 'hover:bg-rose-500/20 hover:text-rose-400',
          shadow: 'shadow-2xl shadow-slate-950/60',
          brandCard: 'bg-slate-900 border-slate-800',
          brandText: 'text-white',
          brandSub: 'text-slate-400',
        };
      case 'emerald':
        return {
          bg: 'bg-[#0A1A18]',
          text: 'text-slate-100',
          border: 'border-emerald-950/80',
          headerBorder: 'border-emerald-950/70',
          dividerBorder: 'border-emerald-950/80',
          toggleBg: 'bg-[#0A1A18]',
          toggleBorder: 'border-emerald-900/80',
          toggleText: 'text-emerald-300/70 hover:text-white',
          hoverBg: 'hover:bg-emerald-950/60',
          itemHover: 'hover:bg-white/10',
          logoutHover: 'hover:bg-rose-500/20 hover:text-rose-400',
          shadow: 'shadow-2xl shadow-emerald-950/50',
          brandCard: 'bg-[#061412] border-emerald-900/50',
          brandText: 'text-white',
          brandSub: 'text-emerald-400/80',
        };
      case 'charcoal':
        return {
          bg: 'bg-[#1C1917]',
          text: 'text-slate-100',
          border: 'border-stone-800/90',
          headerBorder: 'border-stone-800/70',
          dividerBorder: 'border-stone-800/90',
          toggleBg: 'bg-[#1C1917]',
          toggleBorder: 'border-stone-700',
          toggleText: 'text-stone-400 hover:text-white',
          hoverBg: 'hover:bg-stone-800/80',
          itemHover: 'hover:bg-white/10',
          logoutHover: 'hover:bg-rose-500/20 hover:text-rose-400',
          shadow: 'shadow-2xl shadow-stone-950/60',
          brandCard: 'bg-stone-900 border-stone-800',
          brandText: 'text-white',
          brandSub: 'text-stone-400',
        };
      case 'dark':
      default:
        return {
          bg: 'bg-[#0B0F17]',
          text: 'text-slate-100',
          border: 'border-slate-800/90',
          headerBorder: 'border-slate-800/80',
          dividerBorder: 'border-slate-800/90',
          toggleBg: 'bg-[#0B0F17]',
          toggleBorder: 'border-slate-700/80',
          toggleText: 'text-slate-400 hover:text-white',
          hoverBg: 'hover:bg-slate-800/80',
          itemHover: 'hover:bg-white/10',
          logoutHover: 'hover:bg-rose-500/20 hover:text-rose-400',
          shadow: 'shadow-2xl',
          brandCard: 'bg-slate-900 border-slate-800',
          brandText: 'text-white',
          brandSub: 'text-slate-400',
        };
    }
  })();

  return {
    windowWidth,
    isMobile,
    currentSidebarColor,
    layoutMode,
    sidebarBehaviorMode,
    sidebarThemeMode,
    customSidebarBg,
    masterPreset,
    sidebarDesign,
    isTheme2,
    themeStyles
  };
}
