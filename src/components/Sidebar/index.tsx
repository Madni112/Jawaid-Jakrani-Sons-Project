import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import SidebarLinkGroup from './SidebarLinkGroup';
import { AiOutlineUp, AiOutlineDown, AiOutlineRight, AiOutlineArrowLeft } from 'react-icons/ai';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { LuLogOut, LuSlidersHorizontal } from 'react-icons/lu';
import { useModal } from '../../Context/Modal';
import { useAuth } from '../../Context/Auth';
import { useLanguage, getUrduText } from '../../Context/LanguageContext';
import {
  PRESET_THEME_COLORS,
  applySidebarColor,
  getSavedSidebarColor,
  getSafeSidebarColor,
  SidebarLayoutMode,
  getSidebarLayoutMode,
  SidebarThemeMode,
  getSidebarThemeMode,
  isDarkModeActive,
  SidebarBehaviorMode,
  getSidebarBehaviorMode,
} from '../../constant/themeConfig';
import { getBrandConfig } from '../../utils/brand';
import IconDark from '../../images/logo/icon-dark.png';
import IconLight from '../../images/logo/icon-light.png';

const getSidebarLabel = (label: string, isRTL: boolean) => {
  if (isRTL) {
    return getUrduText(label);
  }
  return label;
};

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean | ((prev: boolean) => boolean)) => void;
}

// Collapsed hover nested flyout component
const FlyoutSubMenu = ({ item, pathname, handleLinkClick, getTenantPath, sidebarColor, sidebarThemeMode }: any) => {
  const { isRTL } = useLanguage();
  const [showSubFlyout, setShowSubFlyout] = useState(false);
  const destination = (item.path && getTenantPath ? getTenantPath(item.path) : item.path) || '#';
  const isActive = item.path && (pathname === destination || pathname === item.path);

  if (item.children) {
    return (
      <li
        className="relative"
        onMouseEnter={() => setShowSubFlyout(true)}
        onMouseLeave={() => setShowSubFlyout(false)}
      >
        <div
          className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold duration-150 ${
            sidebarThemeMode === 'light' ? 'hover:bg-slate-100/90' : 'hover:bg-white/10'
          } cursor-pointer`}
          style={{ color: sidebarColor }}
        >
          <span>{getSidebarLabel(item.label, isRTL)}</span>
          <AiOutlineRight size={10} style={{ color: sidebarColor, opacity: 0.7 }} />
        </div>

        {showSubFlyout && (
          <div
            className={`absolute left-full top-0 ml-1 min-w-[200px] rounded-xl border ${
              sidebarThemeMode === 'light'
                ? 'border-slate-200/90 bg-white/98 text-slate-800 shadow-xl'
                : 'border-slate-700/90 bg-slate-900/95 text-slate-100 shadow-2xl'
            } p-1.5 backdrop-blur-md z-99999`}
            style={{ animation: 'sidebarFlyoutFadeIn 0.15s ease-out forwards' }}
          >
            <div className="absolute top-0 -left-3 w-3 h-full bg-transparent" />
            <ul className="flex flex-col gap-1">
              {item.children.filter((child: any) => child && !child.hideFromSidebar).map((child: any, idx: number) => (
                <FlyoutSubMenu
                  key={idx}
                  item={child}
                  pathname={pathname}
                  handleLinkClick={handleLinkClick}
                  getTenantPath={getTenantPath}
                  sidebarColor={sidebarColor}
                  sidebarThemeMode={sidebarThemeMode}
                />
              ))}
            </ul>
          </div>
        )}
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={destination}
        onClick={handleLinkClick}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold duration-150 ${
          sidebarThemeMode === 'light' ? 'hover:bg-slate-100/90' : 'hover:bg-white/10'
        } ${
          isActive ? 'shadow-xs font-bold' : ''
        }`}
        style={{
          color: sidebarColor,
          backgroundColor: isActive ? `${sidebarColor}20` : undefined,
        }}
      >
        <span>{getSidebarLabel(item.label, isRTL)}</span>
      </NavLink>
    </li>
  );
};

// Reusable Multi-Level Recursive Sidebar Item Component
const SidebarItem = ({
  item,
  depth = 0,
  pathname,
  sidebarOpen,
  setSidebarOpen,
  isMobile,
  hideModal,
  openMenuId,
  setOpenMenuId,
  parentKey = 'root',
  getTenantPath,
  sidebarColor,
  layoutMode,
  sidebarThemeMode,
  sidebarBehaviorMode,
}: any) => {
  const { isRTL } = useLanguage();
  const itemRef = useRef<HTMLDivElement>(null);
  const menuUniqueKey = `${parentKey}-${item.label}`;
  const [open, setOpen] = useState(false);
  const [showFlyout, setShowFlyout] = useState(false);
  const [flyoutTop, setFlyoutTop] = useState<number>(0);
  const [flyoutLeft, setFlyoutLeft] = useState<number>(56);

  // Helper check: Recursively verifies if any nested children match the active route URL
  const checkChildActive = (node: any): boolean => {
    if (node.path) {
      const destination = getTenantPath ? getTenantPath(node.path) : node.path;
      if (pathname === destination || pathname === node.path) return true;
    }
    if (node.children && Array.isArray(node.children)) {
      return node.children.some((child: any) => checkChildActive(child));
    }
    return false;
  };

  const isChildActive = checkChildActive(item);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync active route ONLY when pathname changes
  useEffect(() => {
    if (isChildActive) {
      setOpen(true);
      if (depth === 0) setOpenMenuId(menuUniqueKey);
    }
  }, [pathname, isChildActive, depth, menuUniqueKey, setOpenMenuId]);

  // Closes other parent groups if a completely different parent node section is selected
  useEffect(() => {
    if (depth === 0 && openMenuId !== menuUniqueKey && !isChildActive) {
      setOpen(false);
    }
  }, [openMenuId, menuUniqueKey, depth, isChildActive]);

  const shouldShowLabels = sidebarOpen || isMobile;

  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    } else if (sidebarBehaviorMode === 'closed') {
      setSidebarOpen(false);
    }
    hideModal();
    setShowFlyout(false);
  };

  const handleMouseEnter = () => {
    if (!sidebarOpen && !isMobile && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const asideEl = itemRef.current.closest('aside');
      const edgeRight = asideEl ? asideEl.getBoundingClientRect().right : rect.right;
      const estimatedHeight = Math.min((item.children?.length || 4) * 36 + 50, 420);
      const maxTop = Math.max(12, window.innerHeight - estimatedHeight - 16);
      setFlyoutTop(Math.min(rect.top, maxTop));
      setFlyoutLeft(edgeRight + 2);
      setShowFlyout(true);
    }
  };

  if (item.children) {
    return (
      <div
        ref={itemRef}
        className="w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => !sidebarOpen && !isMobile && setShowFlyout(false)}
      >
        <SidebarLinkGroup activeCondition={isChildActive}>
          {(handleClick, isGroupOpen) => (
            <>
              <NavLink
                to="#"
                className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out ${
                  sidebarThemeMode === 'light' ? 'hover:bg-slate-100/90' : 'hover:bg-white/10'
                } ${
                  isChildActive && shouldShowLabels ? 'font-bold shadow-xs' : ''
                } ${shouldShowLabels ? 'px-3.5 justify-start' : 'justify-center mx-auto w-10 h-10 px-0'}`}
                style={{
                  paddingLeft: shouldShowLabels ? `${(depth + 1) * 0.85}rem` : undefined,
                  color: sidebarColor,
                  backgroundColor: isChildActive && shouldShowLabels ? `${sidebarColor}20` : undefined,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  const nextState = !open;
                  setOpen(nextState);
                  if (nextState && depth === 0) {
                    setOpenMenuId(menuUniqueKey);
                  } else if (!nextState && depth === 0 && openMenuId === menuUniqueKey) {
                    setOpenMenuId(null);
                  }
                  handleClick();
                }}
              >
                {item.icon && (
                  <item.icon
                    className="text-lg shrink-0 transition-colors"
                    style={{ color: sidebarColor }}
                  />
                )}
                {shouldShowLabels && (
                  <>
                    <span
                      className="text-xs font-semibold ml-2.5 whitespace-nowrap overflow-hidden text-ellipsis flex flex-col gap-1 tracking-wide"
                      style={{ color: sidebarColor }}
                    >
                      {getSidebarLabel(item.label, isRTL)}
                    </span>
                    <span
                      className="ml-auto transition-transform duration-200"
                      style={{ color: sidebarColor, opacity: 0.8 }}
                    >
                      {open ? <AiOutlineUp size={11} /> : <AiOutlineDown size={11} />}
                    </span>
                  </>
                )}
              </NavLink>

              {/* Collapsible Sub-item Drawer */}
              {shouldShowLabels && (
                <div
                  className="transition-all duration-300 ease-in-out overflow-hidden transform pl-3 ml-2 border-l"
                  style={{
                    maxHeight: open ? '1000px' : '0px',
                    opacity: open ? '100' : '0',
                    marginTop: open ? '4px' : '0px',
                    marginBottom: open ? '4px' : '0px',
                    pointerEvents: open ? 'auto' : 'none',
                    borderLeftColor: `${sidebarColor}30`,
                  }}
                >
                  <ul className="flex flex-col gap-1 py-1">
                    {Array.isArray(item.children) && item.children.filter((child: any) => child && !child.hideFromSidebar).map((child: any, idx: number) => (
                      <SidebarItem
                        key={idx}
                        item={child}
                        depth={depth + 1}
                        pathname={pathname}
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                        isMobile={isMobile}
                        hideModal={hideModal}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        parentKey={menuUniqueKey}
                        getTenantPath={getTenantPath}
                        sidebarColor={sidebarColor}
                        layoutMode={layoutMode}
                        sidebarThemeMode={sidebarThemeMode}
                        sidebarBehaviorMode={sidebarBehaviorMode}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </SidebarLinkGroup>

        {/* Collapsed Flyout Popover */}
        {!sidebarOpen && showFlyout && !isMobile && (
          <div
            className={`fixed z-99999 min-w-[210px] rounded-2xl border ${
              sidebarThemeMode === 'light'
                ? 'border-slate-200/90 bg-white/98 text-slate-800 shadow-xl'
                : 'border-slate-700/90 bg-slate-900/95 text-slate-100 shadow-2xl'
            } p-2 backdrop-blur-md`}
            style={{
              top: `${flyoutTop}px`,
              left: `${flyoutLeft}px`,
              animation: 'sidebarFlyoutFadeIn 0.18s ease-out forwards',
            }}
          >
            <style>{`
              @keyframes sidebarFlyoutFadeIn {
                from { opacity: 0; transform: translateX(-6px); }
                to { opacity: 1; transform: translateX(0); }
              }
            `}</style>
            <div className="absolute top-0 -left-3 w-3 h-full bg-transparent" />
            <div
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border-b border-slate-800 dark:border-slate-200/60 mb-1"
              style={{ color: sidebarColor, opacity: 0.7 }}
            >
              {getSidebarLabel(item.label, isRTL)}
            </div>
            <ul className="flex flex-col gap-1">
              {item.children.filter((child: any) => child && !child.hideFromSidebar).map((child: any, idx: number) => (
                <FlyoutSubMenu
                  key={idx}
                  item={child}
                  pathname={pathname}
                  handleLinkClick={handleLinkClick}
                  getTenantPath={getTenantPath}
                  sidebarColor={sidebarColor}
                  sidebarThemeMode={sidebarThemeMode}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const singleDestination = (item.path && getTenantPath ? getTenantPath(item.path) : item.path) || '#';
  const isDirectActive = item.path && (pathname === singleDestination || pathname === item.path);

  const handleSingleMouseEnter = () => {
    if (!sidebarOpen && !isMobile && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const asideEl = itemRef.current.closest('aside');
      const edgeRight = asideEl ? asideEl.getBoundingClientRect().right : rect.right;
      setFlyoutTop(rect.top + (rect.height / 2) - 15);
      setFlyoutLeft(edgeRight + 2);
      setShowFlyout(true);
    }
  };

  return (
    <li
      ref={itemRef}
      onClick={handleLinkClick}
      className="w-full relative"
      title={!shouldShowLabels ? getSidebarLabel(item.label, isRTL) : undefined}
      onMouseEnter={handleSingleMouseEnter}
      onMouseLeave={() => !sidebarOpen && !isMobile && setShowFlyout(false)}
    >
      <NavLink
        to={singleDestination}
        className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out ${
          sidebarThemeMode === 'light' ? 'hover:bg-slate-100/90' : 'hover:bg-white/10'
        } ${
          isDirectActive ? 'font-bold shadow-xs' : ''
        } ${shouldShowLabels ? 'px-3.5 justify-start' : 'justify-center mx-auto w-10 h-10 px-0'}`}
        style={{
          paddingLeft: shouldShowLabels ? `${(depth + 1) * 0.85}rem` : undefined,
          color: isDirectActive ? 'var(--color-primary)' : sidebarColor,
          backgroundColor: isDirectActive ? 'rgba(var(--color-primary-rgb), 0.12)' : undefined,
          borderColor: isDirectActive ? 'rgba(var(--color-primary-rgb), 0.25)' : 'transparent',
        }}
      >
        {item.icon && (
          <item.icon
            className="text-lg shrink-0 transition-colors"
            style={{ color: sidebarColor }}
          />
        )}
        {shouldShowLabels && (
          <span
            className="text-xs font-semibold ml-2.5 whitespace-nowrap overflow-hidden text-ellipsis tracking-wide"
            style={{ color: sidebarColor }}
          >
            {getSidebarLabel(item.label, isRTL)}
          </span>
        )}
      </NavLink>

      {!sidebarOpen && showFlyout && !isMobile && (
        <div
          className={`fixed z-99999 px-3 py-1.5 rounded-xl border ${
            sidebarThemeMode === 'light'
              ? 'border-slate-200/90 bg-white/98 text-slate-800 shadow-xl'
              : 'border-slate-700/90 bg-slate-900/95 text-slate-100 shadow-2xl'
          } text-xs font-bold backdrop-blur-md pointer-events-none whitespace-nowrap`}
          style={{
            top: `${flyoutTop}px`,
            left: `${flyoutLeft}px`,
            color: sidebarColor,
            animation: 'sidebarFlyoutFadeIn 0.18s ease-out forwards',
          }}
        >
          {getSidebarLabel(item.label, isRTL)}
        </div>
      )}
    </li>
  );
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const { getRoleBasedRoutes, logout, tenantId } = useAuth();
  const { isRTL } = useLanguage();
  const roleRoutes = getRoleBasedRoutes();
  const location = useLocation();
  const { hideModal } = useModal();
  const { pathname } = location;
  const sidebar = useRef<any>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  const isTenantRoute = pathname.startsWith('/tenant=') || pathname.startsWith('/tenant-');
  const rawTenant = tenantId || (isTenantRoute ? pathname.split('/')[1] : '');
  const cleanSlug = rawTenant ? rawTenant.replace(/^tenant=/, '').replace(/^tenant-/, '').toLowerCase().trim() : '';
  const reservedPrefixes = ['auth', 'dev', 'assets', 'api', 'purchase', 'sales', 'reports', 'registration', 'administration', 'dashboard', 'sales-return'];
  const cleanPrefix = '';

  const getTenantPath = (path?: string) => {
    if (!path || typeof path !== 'string') return '';
    if (!cleanPrefix) return path;
    if (path === '/') return cleanPrefix;
    const cleanSub = path.startsWith('/') ? path : `/${path}`;
    return `${cleanPrefix}${cleanSub}`;
  };

  // Master tracking ID to determine which global branch header is clicked open
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const brand = getBrandConfig();

  // Dedicated sidebar font/icon color state with contrast protection
  const [currentSidebarColor, setCurrentSidebarColor] = useState(getSavedSidebarColor());

  // Sidebar Layout Mode (Floating Modern vs Classic Edge)
  const [layoutMode, setLayoutMode] = useState<SidebarLayoutMode>(getSidebarLayoutMode());

  // Sidebar Behavior Mode ('opened' = Pinned Expanded vs 'closed' = Auto-Expand on Click & Hover-Out Collapse)
  const [sidebarBehaviorMode, setSidebarBehaviorModeState] = useState<SidebarBehaviorMode>(getSidebarBehaviorMode());
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Sidebar Theme Mode (light / navy / emerald / charcoal / dark)
  const [sidebarThemeMode, setSidebarThemeModeState] = useState<SidebarThemeMode>(getSidebarThemeMode());

  useEffect(() => {
    const updateTheme = () => {
      setSidebarThemeModeState(getSidebarThemeMode());
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

  const [wasContrastAdjusted, setWasContrastAdjusted] = useState(false);

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

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 750;

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

  return (
    <aside
      ref={sidebar}
      onClick={() => {
        if (!sidebarOpen && !isMobile && sidebarBehaviorMode === 'closed') {
          if (collapseTimeoutRef.current) {
            clearTimeout(collapseTimeoutRef.current);
            collapseTimeoutRef.current = null;
          }
          setSidebarOpen(true);
        }
      }}
      onMouseEnter={() => {
        if (collapseTimeoutRef.current) {
          clearTimeout(collapseTimeoutRef.current);
          collapseTimeoutRef.current = null;
        }
      }}
      onMouseLeave={() => {
        if (sidebarOpen && !isMobile && sidebarBehaviorMode === 'closed') {
          if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
          collapseTimeoutRef.current = setTimeout(() => {
            setSidebarOpen(false);
          }, 220);
        }
      }}
      className={`flex flex-col ${themeStyles.bg} ${themeStyles.text} duration-300 ease-in-out select-none ${themeStyles.shadow} ${
        !sidebarOpen && sidebarBehaviorMode === 'closed' ? 'cursor-pointer' : ''
      } ${
        isMobile
          ? 'fixed left-0 top-0 z-99999 h-screen block'
          : `min-[751px]:relative min-[751px]:shrink-0 min-[751px]:z-30 ${
              layoutMode === 'floating'
                ? `min-[751px]:self-start min-[751px]:my-3 min-[751px]:ml-3 min-[751px]:h-fit min-[751px]:max-h-[calc(100vh-1.5rem)] min-[751px]:rounded-3xl min-[751px]:border ${themeStyles.border}`
                : `min-[751px]:h-screen min-[751px]:rounded-none min-[751px]:border-r ${themeStyles.border}`
            }`
      } ${
        sidebarOpen
          ? `w-72.5 translate-x-0 visible ${layoutMode === 'classic' ? `border-r ${themeStyles.border}` : ''}`
          : `w-0 -translate-x-full min-[751px]:w-18 ${layoutMode === 'floating' ? 'min-[751px]:translate-x-0' : `min-[751px]:translate-x-0 min-[751px]:border-r ${themeStyles.border}`} max-[750px]:invisible`
      }`}
    >
      {/* Brand Header */}
      <div className={`flex items-center shrink-0 border-b ${themeStyles.headerBorder} ${
        sidebarOpen ? 'px-5 py-4' : 'justify-center p-3'
      }`}>
        {sidebarOpen ? (
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-90 min-w-0"
          >
            <div className={`w-10 h-10 rounded-xl ${themeStyles.brandCard} p-1 flex items-center justify-center shadow-md shrink-0 border overflow-hidden select-none`}>
              <img src={sidebarThemeMode === 'light' ? IconDark : IconLight} alt="Logo" className="w-full h-full object-contain" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className={`font-black tracking-tight text-sm ${themeStyles.brandText} leading-tight truncate ${isRTL ? 'font-sans' : 'font-cinzel'}`}>
                {isRTL ? 'جاوید جکوانی اینڈ سنز' : (brand.fullName || 'JAWAID JAKWANI & SONS')}
              </span>
              <span className={`text-[10px] font-mono tracking-wider uppercase ${themeStyles.brandSub} font-bold`}>
                {isRTL ? 'کلوتھ ERP' : 'CLOTH ERP'}
              </span>
            </div>
          </NavLink>
        ) : (
          <button
            onClick={() => setSidebarOpen(true)}
            className={`w-10 h-10 rounded-xl ${themeStyles.brandCard} p-1 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all duration-200 border overflow-hidden select-none cursor-pointer group`}
            title="Click to Open / Expand Sidebar"
          >
            <img
              src={sidebarThemeMode === 'light' ? IconDark : IconLight}
              alt="Logo"
              className="w-full h-full object-contain group-hover:scale-110 transition-transform"
            />
          </button>
        )}
      </div>

      {/* Floating Border Edge Toggle Tab (Half-circle protruding on border center) */}
      <button
        type="button"
        onClick={() => setSidebarOpen((prev) => !prev)}
        className={`absolute top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-5 h-10 ${themeStyles.toggleBg} ${themeStyles.toggleText} shadow-md cursor-pointer transition-all duration-200 hover:w-6 group ${
          isRTL
            ? `-left-3.5 rounded-l-full border-y border-l ${themeStyles.toggleBorder}`
            : `-right-3.5 rounded-r-full border-y border-r ${themeStyles.toggleBorder}`
        }`}
        title={sidebarOpen ? (isRTL ? 'سائیڈبار بند کریں' : 'Collapse Sidebar (<)') : (isRTL ? 'سائیڈبار کھولیں' : 'Expand Sidebar (>)')}
      >
        {sidebarOpen ? (
          isRTL ? (
            <FiChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          ) : (
            <FiChevronLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
          )
        ) : (
          isRTL ? (
            <FiChevronLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
          ) : (
            <FiChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          )
        )}
      </button>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-3">
        <ul className="flex flex-col gap-1.5">
          {roleRoutes.filter((item: any) => item && !item.hideFromSidebar).map((item: any, idx: number) => (
            <SidebarItem
              key={idx}
              item={item}
              pathname={pathname}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              isMobile={isMobile}
              hideModal={hideModal}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              getTenantPath={getTenantPath}
              sidebarColor={currentSidebarColor}
              layoutMode={layoutMode}
              sidebarThemeMode={sidebarThemeMode}
              sidebarBehaviorMode={sidebarBehaviorMode}
            />
          ))}

          {/* Settings Button */}
          <li className="w-full mt-2">
            <NavLink
              to={getTenantPath('/settings')}
              onClick={() => {
                if (sidebarBehaviorMode === 'closed' && !isMobile) {
                  setSidebarOpen(false);
                }
              }}
              className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out ${themeStyles.itemHover} ${
                pathname === getTenantPath('/settings') || pathname === '/settings' ? 'font-bold shadow-xs' : ''
              } ${sidebarOpen ? 'px-3.5 justify-start' : 'justify-center mx-auto w-10 h-10 px-0'}`}
              style={{
                color: currentSidebarColor,
                backgroundColor: pathname === getTenantPath('/settings') || pathname === '/settings' ? `${currentSidebarColor}20` : undefined,
              }}
              title={!sidebarOpen ? (isRTL ? 'سیٹنگز' : 'Settings') : undefined}
            >
              <LuSlidersHorizontal className="text-lg shrink-0 transition-colors" />
              {sidebarOpen && (
                <span className="text-xs font-semibold ml-2.5 whitespace-nowrap overflow-hidden text-ellipsis tracking-wide">
                  {isRTL ? 'سیٹنگز' : 'Settings'}
                </span>
              )}
            </NavLink>
          </li>

          {/* Log Out Button */}
          <li
            className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out ${themeStyles.logoutHover} cursor-pointer mt-4 border-t ${themeStyles.dividerBorder} pt-4 ${
              sidebarOpen ? 'justify-start px-3.5' : 'justify-center mx-auto w-10 h-10 px-0'
            }`}
            style={{ color: currentSidebarColor }}
            onClick={() => logout()}
            title={!sidebarOpen ? (isRTL ? 'لاگ آؤٹ' : 'Log Out') : undefined}
          >
            <LuLogOut className="text-lg shrink-0 transition-colors" />
            {sidebarOpen && (
              <span className="text-xs font-semibold ml-2.5 whitespace-nowrap overflow-hidden text-ellipsis tracking-wide">
                {isRTL ? 'لاگ آؤٹ' : 'Log Out'}
              </span>
            )}
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
