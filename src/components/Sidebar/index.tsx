import React, { useRef, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import SidebarLinkGroup from './SidebarLinkGroup';
import { AiOutlineUp, AiOutlineDown, AiOutlineRight, AiOutlineArrowLeft } from 'react-icons/ai';
import { LuLogOut, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { useModal } from '../../Context/Modal';
import { useAuth } from '../../Context/Auth';
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
  MasterThemePreset,
  getMasterThemePreset,
  getReportLayoutMode,
  ReportLayoutMode,
  isNHTTheme2Active,
  getSavedAccentColor,
  getContrastTextColor,
} from '../../constant/themeConfig';
import LogoDark from '../../images/logo/logo-dark.png';
import LogoLight from '../../images/logo/logo-light.png';
import IconDark from '../../images/logo/icon-dark.png';
import IconLight from '../../images/logo/icon-light.png';
import { Weight } from 'lucide-react';
import { getBrandConfig } from '../../utils/brand';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}


// 6 Core Classic Reports for NHT Theme 2 / Classic Tree View
const NHT2_REPORTS_CHILDREN = [
  {
    path: '/Reports/Reports-Dashboard?tab=combined-ledger',
    label: 'Main Reports',
    children: [
      { path: '/Reports/Reports-Dashboard?tab=combined-ledger', label: 'All Parties' },
      { path: '/Reports/Reports-Dashboard?tab=profit-loss', label: 'Profit & Loss' },
      { path: '/Reports/Reports-Dashboard?tab=expense-report', label: 'Expense Report' },
      { path: '/Reports/Reports-Dashboard?tab=daily-book', label: 'DailyBook' },
    ],
  },
  {
    path: '/Reports/Reports-Dashboard?tab=customer-ledger',
    label: 'Sale Reports',
    children: [
      { path: '/Reports/Reports-Dashboard?tab=customer-ledger', label: 'Customer Ledger' },
    ],
  },
  {
    path: '/Reports/Reports-Dashboard?tab=vendor-ledger',
    label: 'Purchase Reports',
    children: [
      { path: '/Reports/Reports-Dashboard?tab=vendor-ledger', label: 'Vendor Ledger' },
    ],
  },
];

const FlyoutSubMenu = ({ item, pathname, handleLinkClick, getTenantPath, sidebarColor }: any) => {
  const [showSubFlyout, setShowSubFlyout] = useState(false);

  if (item && item.children && Array.isArray(item.children)) {
    return (
      <li
        className="relative"
        onMouseEnter={() => setShowSubFlyout(true)}
        onMouseLeave={() => setShowSubFlyout(false)}
      >
        <div
          className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer pr-4"
          style={{ color: sidebarColor }}
        >
          <span className="truncate">{item.label}</span>
          <AiOutlineRight size={10} className="shrink-0" style={{ color: sidebarColor }} />
        </div>

        {showSubFlyout && (
          <div
            className="absolute left-full top-0 -ml-1.5 z-99999 w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1E293B]/95 p-2 shadow-2xl backdrop-blur-md"
            style={{ animation: 'sidebarFlyoutFadeIn 0.15s ease-out forwards' }}
          >
            <div className="absolute top-0 -left-3 w-3 h-full bg-transparent" />
            <ul className="flex flex-col gap-1">
              {item.children.map((child: any, idx: number) => (
                <FlyoutSubMenu
                  key={idx}
                  item={child}
                  pathname={pathname}
                  handleLinkClick={handleLinkClick}
                  getTenantPath={getTenantPath}
                  sidebarColor={sidebarColor}
                />
              ))}
            </ul>
          </div>
        )}
      </li>
    );
  }

  const destination = (item.path && getTenantPath ? getTenantPath(item.path) : item.path) || '#';
  const isActive = pathname === destination || pathname === item.path;

  return (
    <li>
      <NavLink
        to={destination}
        onClick={handleLinkClick}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 ${
          isActive ? 'shadow-xs font-bold' : ''
        }`}
        style={{
          color: sidebarColor,
          backgroundColor: isActive ? `${sidebarColor}20` : undefined,
        }}
      >
        {item.label}
      </NavLink>
    </li>
  );
};

const SidebarItem = ({
  item,
  pathname,
  depth = 0,
  sidebarOpen,
  setSidebarOpen,
  hideModal,
  openMenuId,
  setOpenMenuId,
  menuUniqueKey,
  getTenantPath,
  sidebarColor,
  layoutMode,
}: any) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showFlyout, setShowFlyout] = useState(false);
  const [flyoutTop, setFlyoutTop] = useState<number>(0);
  const [flyoutLeft, setFlyoutLeft] = useState<number>(56);

  // Helper check: Recursively verifies if any nested children match the active route URL
  const checkHasActiveChild = (routeItem: any): boolean => {
    if (!routeItem) return false;
    if (!routeItem.children || !Array.isArray(routeItem.children)) return false;

    return routeItem.children.some((child: any) => {
      const dest = child.path && getTenantPath ? getTenantPath(child.path) : child.path;
      const cleanChildPath = String(child.path || '').toLowerCase();
      const cleanDest = String(dest || '').toLowerCase();
      const cleanPathname = String(pathname || '').toLowerCase();

      if (cleanChildPath && (cleanPathname === cleanChildPath || cleanPathname === cleanDest)) return true;

      // Match sub-routes (e.g., /Add, /Edit, /Print, /customer-details) of this child
      const baseChild = cleanChildPath.replace(/\/(list|customer-details|add)$/i, '');
      if (baseChild && baseChild.length > 2 && cleanPathname.includes(baseChild)) {
        return true;
      }

      if (child.children) return checkHasActiveChild(child);
      return false;
    });
  };

  const itemDestination = item?.path && getTenantPath ? getTenantPath(item.path) : (item?.path || '');
  const isChildActive = checkHasActiveChild(item) || Boolean(item?.path && (pathname === item.path || pathname === itemDestination));

  // Local toggle state initializes accurately based on the active path to support hard refreshes
  const [open, setOpen] = useState(isChildActive);

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

  const isMobile = windowWidth <= 750;
  const shouldShowLabels = sidebarOpen || isMobile;

  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
    hideModal();
    setShowFlyout(false);
  };

  const handleMouseEnter = () => {
    if (!sidebarOpen && !isMobile && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min((item.children?.length || 4) * 36 + 50, 420);
      const maxTop = Math.max(12, window.innerHeight - estimatedHeight - 16);
      setFlyoutTop(Math.min(rect.top, maxTop));
      setFlyoutLeft(rect.right + 8);
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
                className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
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
                      {item.label}
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
                    {Array.isArray(item.children) && item.children.map((child: any, idx: number) => (
                      <SidebarItem
                        key={idx}
                        item={child}
                        pathname={pathname}
                        depth={depth + 1}
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                        hideModal={hideModal}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        menuUniqueKey={`${menuUniqueKey}-${idx}`}
                        getTenantPath={getTenantPath}
                        sidebarColor={sidebarColor}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </SidebarLinkGroup>

        {!sidebarOpen && showFlyout && !isMobile && (
          <div
            className="fixed z-99999 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1E293B]/95 p-2.5 shadow-2xl backdrop-blur-md"
            style={{
              top: `${flyoutTop}px`,
              left: `${flyoutLeft}px`,
              animation: 'sidebarFlyoutFadeIn 0.18s ease-out forwards'
            }}
          >
            <div className="absolute top-0 -left-3 w-3 h-full bg-transparent" />
            <style>{`
              @keyframes sidebarFlyoutFadeIn {
                from { opacity: 0; transform: translateX(-6px); }
                to { opacity: 1; transform: translateX(0); }
              }
            `}</style>
            <div
              className="px-3 py-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase tracking-wider text-left"
              style={{ color: sidebarColor }}
            >
              {item.label}
            </div>
            <ul className="flex flex-col gap-1">
              {item.children.map((child: any, idx: number) => (
                <FlyoutSubMenu
                  key={idx}
                  item={child}
                  pathname={pathname}
                  handleLinkClick={handleLinkClick}
                  getTenantPath={getTenantPath}
                  sidebarColor={sidebarColor}
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
      setFlyoutTop(rect.top + (rect.height / 2) - 15);
      setFlyoutLeft(rect.right + 8);
      setShowFlyout(true);
    }
  };

  return (
    <li
      ref={itemRef}
      onClick={handleLinkClick}
      className="w-full relative"
      title={!shouldShowLabels ? item.label : undefined}
      onMouseEnter={handleSingleMouseEnter}
      onMouseLeave={() => !sidebarOpen && !isMobile && setShowFlyout(false)}
    >
      <NavLink
        to={singleDestination}
        className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
          isDirectActive ? 'font-bold shadow-xs' : ''
        } ${shouldShowLabels ? 'px-3.5 justify-start' : 'justify-center mx-auto w-10 h-10 px-0'}`}
        style={{
          paddingLeft: shouldShowLabels ? `${(depth + 1) * 0.85}rem` : undefined,
          color: sidebarColor,
          backgroundColor: isDirectActive ? `${sidebarColor}20` : undefined,
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
            {item.label}
          </span>
        )}
      </NavLink>

      {!sidebarOpen && showFlyout && !isMobile && (
        <div
          className="fixed z-99999 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#1E293B]/95 text-xs font-bold shadow-2xl backdrop-blur-md pointer-events-none whitespace-nowrap"
          style={{
            top: `${flyoutTop}px`,
            left: `${flyoutLeft}px`,
            color: sidebarColor,
            animation: 'sidebarFlyoutFadeIn 0.18s ease-out forwards'
          }}
        >
          {item.label}
        </div>
      )}
    </li>
  );
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const { getRoleBasedRoutes, logout, tenantId } = useAuth();
  const roleRoutes = getRoleBasedRoutes();
  const location = useLocation();
  const { hideModal } = useModal();
  const { pathname } = location;
  const sidebar = useRef<any>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const isTenantRoute = pathname.startsWith('/tenant=') || pathname.startsWith('/tenant-');
  const rawTenant = tenantId || (isTenantRoute ? pathname.split('/')[1] : '');
  const cleanSlug = rawTenant ? rawTenant.replace(/^tenant=/, '').replace(/^tenant-/, '').toLowerCase().trim() : '';
  const reservedPrefixes = ['auth', 'dev', 'assets', 'api', 'purchase', 'sales', 'reports', 'registration', 'administration', 'dashboard', 'sales-return'];
  const cleanPrefix = cleanSlug && !reservedPrefixes.includes(cleanSlug) ? `/${cleanSlug}` : '';

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
  const [sidebarThemeMode, setSidebarThemeMode] = useState<SidebarThemeMode>(() => getSidebarThemeMode());
  const [customSidebarBg, setCustomSidebarBg] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('alm_sidebar_custom_bg') || '' : '';
  });
  const [sidebarBehaviorMode, setSidebarBehaviorMode] = useState<SidebarBehaviorMode>(() => getSidebarBehaviorMode());
  const [masterPreset, setMasterPreset] = useState<MasterThemePreset>(() => getMasterThemePreset());

  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateLayoutMode = () => {
      setLayoutMode(getSidebarLayoutMode());
    };
    window.addEventListener('al_muhammad_sidebar_layout_changed', updateLayoutMode);
    window.addEventListener('storage', updateLayoutMode);
    return () => {
      window.removeEventListener('al_muhammad_sidebar_layout_changed', updateLayoutMode);
      window.removeEventListener('storage', updateLayoutMode);
    };
  }, []);

  useEffect(() => {
    const updateMasterPreset = () => {
      setMasterPreset(getMasterThemePreset());
    };
    window.addEventListener('al_muhammad_theme_preset_changed', updateMasterPreset);
    window.addEventListener('storage', updateMasterPreset);
    return () => {
      window.removeEventListener('al_muhammad_theme_preset_changed', updateMasterPreset);
      window.removeEventListener('storage', updateMasterPreset);
    };
  }, []);

  useEffect(() => {
    const updateSidebarTheme = () => {
      setSidebarThemeMode(getSidebarThemeMode());
      setCustomSidebarBg(localStorage.getItem('alm_sidebar_custom_bg') || '');
    };
    window.addEventListener('al_muhammad_sidebar_theme_changed', updateSidebarTheme);
    window.addEventListener('al_muhammad_theme_suite_changed', updateSidebarTheme);
    window.addEventListener('storage', updateSidebarTheme);
    return () => {
      window.removeEventListener('al_muhammad_sidebar_theme_changed', updateSidebarTheme);
      window.removeEventListener('al_muhammad_theme_suite_changed', updateSidebarTheme);
      window.removeEventListener('storage', updateSidebarTheme);
    };
  }, []);

  useEffect(() => {
    const updateBehavior = () => {
      setSidebarBehaviorMode(getSidebarBehaviorMode());
    };
    window.addEventListener('al_muhammad_sidebar_behavior_changed', updateBehavior);
    window.addEventListener('storage', updateBehavior);
    return () => {
      window.removeEventListener('al_muhammad_sidebar_behavior_changed', updateBehavior);
      window.removeEventListener('storage', updateBehavior);
    };
  }, []);

  useEffect(() => {
    const updateColors = () => {
      const inDark = isDarkModeActive();
      const raw = localStorage.getItem('alm_sidebar_raw_color') || getSavedSidebarColor(inDark);
      const res = getSafeSidebarColor(raw, inDark);
      setCurrentSidebarColor(res.safeColor);
    };

    updateColors();

    window.addEventListener('al_muhammad_sidebar_color_changed', updateColors);
    window.addEventListener('al_muhammad_sidebar_theme_changed', updateColors);
    window.addEventListener('al_muhammad_theme_suite_changed', updateColors);
    window.addEventListener('color-mode-changed', updateColors);
    window.addEventListener('storage', updateColors);

    // Observe both body and documentElement for dark class changes
    const observer = new MutationObserver(() => {
      updateColors();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('al_muhammad_sidebar_color_changed', updateColors);
      window.removeEventListener('al_muhammad_sidebar_theme_changed', updateColors);
      window.removeEventListener('al_muhammad_theme_suite_changed', updateColors);
      window.removeEventListener('color-mode-changed', updateColors);
      window.removeEventListener('storage', updateColors);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
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

  const isTheme2 = masterPreset === 'nht-2' || (masterPreset !== 'nht-1' && isNHTTheme2Active());
  const isMobile = windowWidth <= 750;

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-9999 backdrop-blur-xs transition-opacity duration-300" onClick={() => setSidebarOpen(false)} />
      )}

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
        style={{
          background: customSidebarBg || undefined,
        }}
        className={`flex flex-col ${customSidebarBg ? '' : themeStyles.bg} ${themeStyles.text} duration-300 ease-in-out select-none ${themeStyles.shadow} ${!sidebarOpen && sidebarBehaviorMode === 'closed' ? 'cursor-pointer' : ''} ${
          isMobile
            ? 'fixed left-0 top-0 z-99999 h-screen block'
            : `min-[751px]:relative min-[751px]:shrink-0 min-[751px]:z-30 ${
                layoutMode === 'floating'
                  ? `min-[751px]:self-start min-[751px]:my-3 min-[751px]:ml-3 min-[751px]:h-fit min-[751px]:max-h-[calc(100vh-1.5rem)] min-[751px]:rounded-2xl min-[751px]:border min-[751px]:border-transparent min-[751px]:shadow-2xl min-[751px]:overflow-visible`
                  : 'min-[751px]:h-screen min-[751px]:rounded-none min-[751px]:border-r min-[751px]:border-transparent'
              }`
        } ${
          sidebarOpen
            ? `${isTheme2 ? 'w-56' : 'w-72.5'} translate-x-0 visible ${layoutMode === 'classic' ? 'border-r border-slate-200/80 dark:border-slate-800/80' : ''}`
            : `w-0 -translate-x-full min-[751px]:w-18 ${layoutMode === 'floating' ? 'min-[751px]:transform-none' : 'min-[751px]:translate-x-0'} max-[750px]:invisible ${layoutMode === 'classic' ? 'min-[751px]:border-r min-[751px]:border-transparent' : ''}`
        }`}
      >

        {/* Brand Header */}
        <div className={`flex items-center justify-between gap-2 py-5 border-b ${themeStyles.headerBorder} min-h-[76px] duration-300 ${sidebarOpen ? 'px-6' : 'px-0 min-[751px]:px-2 justify-center'}`} >
          {(sidebarOpen || isMobile) ? (
            <div className="flex items-center justify-between w-full">
              <NavLink className="flex items-center gap-3.5 group" to="/">
                <div className="w-13 h-13 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-all duration-200 border border-slate-300/80 dark:border-slate-700/80 relative overflow-hidden select-none shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />
                  <span className="relative z-10 font-cinzel font-black tracking-widest text-[16px] text-white dark:text-[#111827] leading-none pl-0.5">
                    {brand.code}
                  </span>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="text-[20px] font-black text-primary tracking-tight">{brand.brandWord1}</span>
                    <span className={`text-[20px] font-black tracking-tight ${themeStyles.brandText}`}>{brand.brandWord2}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">{brand.brandSuffix}</span>
                  </div>
                </div>
              </NavLink>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(false);
                }}
                className="max-[750px]:block min-[751px]:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                title="Collapse Sidebar"
              >
                <AiOutlineArrowLeft size={18} />
              </button>
            </div>
          ) : (
            <div
              className="w-full flex justify-center cursor-pointer py-1"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(true);
              }}
              title="Open Sidebar"
            >
              <div className="w-13 h-13 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-all duration-200 border border-slate-300/80 dark:border-slate-700/80 relative overflow-hidden select-none">
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />
                <span className="relative z-10 font-cinzel font-black tracking-widest text-[16px] text-white dark:text-[#111827] leading-none pl-0.5">
                  {brand.code}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className={`no-scrollbar flex flex-col flex-1 ${sidebarOpen || layoutMode === 'classic' ? 'overflow-y-auto overflow-x-hidden' : 'min-[751px]:overflow-visible'}`}>
          <nav className={`py-4 duration-300 ${sidebarOpen ? 'px-3' : 'px-0 min-[751px]:px-2'}`}>
            <ul className="mb-6 flex flex-col gap-1.5 w-full">
              {(Array.isArray(roleRoutes) ? roleRoutes : [])
                .filter((route: any) => route && !route.hideFromSidebar)
                .map((route: any, index: number) => (
                  <SidebarItem
                    key={index}
                    item={route}
                    pathname={pathname}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    hideModal={hideModal}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    menuUniqueKey={`root-${index}`}
                    getTenantPath={getTenantPath}
                    sidebarColor={currentSidebarColor}
                    layoutMode={layoutMode}
                  />
                ))
              }

              {/* Log Out Button */}
              <li 
                className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 cursor-pointer mt-4 border-t border-slate-200/80 dark:border-slate-800 pt-4 ${sidebarOpen ? 'justify-start px-3.5' : 'justify-center mx-auto w-10 h-10 px-0'}`} 
                style={{ color: currentSidebarColor }}
                onClick={() => logout()} 
                title={!sidebarOpen ? 'LogOut' : undefined} 
              >
                <LuLogOut
                  className="text-lg shrink-0 transition-colors group-hover:text-rose-600 dark:group-hover:text-rose-400"
                  style={{ color: currentSidebarColor }}
                />
                {(sidebarOpen || isMobile) && (
                  <span className="ml-3 text-xs font-semibold" style={{ color: currentSidebarColor }}>
                    Log Out
                  </span>
                )}
              </li>
            </ul>
          </nav>
        </div>
        {/* Modern D-Shaped Protruding Tab (> or < with rounded right arch) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen(!sidebarOpen);
          }}
          className="hidden min-[751px]:flex absolute left-full -ml-[1px] top-1/2 -translate-y-1/2 z-50 w-5 h-14 rounded-r-full rounded-l-none bg-white dark:bg-[#111827] border border-l-0 border-slate-200/90 dark:border-slate-700/80 shadow-[3px_0_6px_rgba(0,0,0,0.06)] dark:shadow-[3px_0_6px_rgba(0,0,0,0.3)] items-center justify-center text-slate-400 hover:text-primary dark:text-slate-400 dark:hover:text-primary hover:w-6 transition-all duration-150 cursor-pointer group select-none"
          title={sidebarOpen ? "Collapse sidebar (<)" : "Expand sidebar (>)"}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <LuChevronLeft size={14} className="stroke-[2.5] -ml-0.5 group-hover:-translate-x-0.5 transition-transform" />
          ) : (
            <LuChevronRight size={14} className="stroke-[2.5] -ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
