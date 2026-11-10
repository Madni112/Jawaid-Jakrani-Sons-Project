import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import SidebarLinkGroup from './SidebarLinkGroup';
import { AiOutlineUp, AiOutlineDown, AiOutlineRight, AiOutlineArrowLeft } from 'react-icons/ai';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  LuLogOut,
  LuSlidersHorizontal,
  LuHome,
  LuBox,
  LuLayers,
  LuDollarSign,
  LuShoppingCart,
  LuBarChart3,
  LuMonitor,
  LuArrowDownToLine,
  LuArrowUpFromLine,
  LuBookOpen,
  LuSettings,
  LuStore,
  LuFileText,
} from 'react-icons/lu';
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
  MasterThemePreset,
  getMasterThemePreset,
  isNHTTheme2Active,
  getEffectiveSidebarDesign,
  getReportLayoutMode,
  ReportLayoutMode,
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
          className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold duration-150 ${sidebarThemeMode === 'light' ? 'hover:bg-slate-100/90' : 'hover:bg-white/10'
            } cursor-pointer`}
          style={{ color: sidebarColor }}
        >
          <span>{getSidebarLabel(item.label, isRTL)}</span>
          <AiOutlineRight size={10} style={{ color: sidebarColor, opacity: 0.7 }} />
        </div>

        {showSubFlyout && (
          <div
            className={`absolute left-full top-0 ml-1 min-w-[200px] rounded-xl border ${sidebarThemeMode === 'light'
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
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold duration-150 ${sidebarThemeMode === 'light' ? 'hover:bg-slate-100/90' : 'hover:bg-white/10'
          } ${isActive ? 'shadow-xs font-bold' : ''
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

// Amal ERP style outline icon mapping for NHT Theme 2
const getTheme2Icon = (item: any): React.ElementType | null => {
  const label = (item?.label || '').toLowerCase().trim();
  const path = (item?.path || '').toLowerCase().trim();

  // Dashboard (Amal: Home icon)
  if (label.includes('dashboard') || path.includes('dashboard')) {
    return LuHome;
  }
  // POS
  if (label.includes('point of sale') || label.includes('pos') || path.includes('/pos')) {
    return LuStore;
  }
  // Maintain / Accounts / Financials (Amal: Maintain stacked layers)
  if (label.includes('maintain') || label.includes('account') || path.includes('chart') || path.includes('account')) {
    return LuLayers;
  }
  // Purchases (Amal: Shopping cart)
  if (label.includes('purchase') || path.includes('purchase')) {
    return LuShoppingCart;
  }
  // Sales (Amal: Dollar sign)
  if (label.includes('sale') || path.includes('sale') || path.includes('invoice')) {
    return LuDollarSign;
  }
  // Store / Inventory / Products / Categories (Amal: Store 3D box)
  if (
    label.includes('store') ||
    label.includes('inventory') ||
    label.includes('product') ||
    label.includes('item') ||
    path.includes('product') ||
    path.includes('categories')
  ) {
    return LuBox;
  }
  // Receipts (Amal: Download tray)
  if (label.includes('receipt') || path.includes('receipt')) {
    return LuArrowDownToLine;
  }
  // Payments / Vouchers (Amal: Upload tray)
  if (label.includes('payment') || label.includes('voucher') || path.includes('voucher') || path.includes('payment')) {
    return LuArrowUpFromLine;
  }
  // Journal (Amal: Open book)
  if (label.includes('journal') || path.includes('journal')) {
    return LuBookOpen;
  }
  // Salary / Human Resources / Employees (Amal: Salary screen/monitor)
  if (
    label.includes('salary') ||
    label.includes('human resource') ||
    label.includes('hr') ||
    label.includes('employee') ||
    path.includes('human-resources') ||
    path.includes('employee')
  ) {
    return LuMonitor;
  }
  // Fixed Assets / Locations / Machinery / BOM (Amal: Sliders)
  if (
    label.includes('fixed asset') ||
    label.includes('location') ||
    label.includes('machinery') ||
    label.includes('manufacturing') ||
    label.includes('bom') ||
    path.includes('location') ||
    path.includes('manufacturing')
  ) {
    return LuSlidersHorizontal;
  }
  // Reports (Amal: Bar chart 3 bars)
  if (label.includes('report') || path.includes('report')) {
    return LuBarChart3;
  }
  // Quotations
  if (label.includes('quotation') || path.includes('quotation')) {
    return LuFileText;
  }
  // Settings / Administration (Amal: Gear/cog)
  if (label.includes('setting') || label.includes('administration') || path.includes('setting')) {
    return LuSettings;
  }

  return item?.icon || null;
};

// Reusable Multi-Level Recursive Sidebar Item Component
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

// 2nd Tier Hover Component for Theme 2
const Theme2FlyoutItem = ({
  child,
  pathname,
  handleLinkClick,
  getTenantPath,
  setOpenMenuId,
  activeChildKey,
  setActiveChildKey,
}: any) => {
  const subDest = (child.path && getTenantPath ? getTenantPath(child.path) : child.path) || '#';
  const hasSubChildren = Boolean(child.children && child.children.length > 0);
  const isSubActive = child.path && (pathname === subDest || pathname === child.path);
  const isHovered = activeChildKey === child.label;

  const handleMouseEnter = () => {
    setActiveChildKey(child.label);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLLIElement>) => {
    const relatedTarget = e.relatedTarget as Node | null;
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return;
    }
    setActiveChildKey((prev: string | null) => (prev === child.label ? null : prev));
  };

  return (
    <li
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <NavLink
        to={hasSubChildren ? (child.children[0]?.path || subDest) : subDest}
        onClick={() => {
          setOpenMenuId(null);
          handleLinkClick();
        }}
        className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${isHovered
          ? 'bg-[#800020] text-white shadow-xs font-semibold'
          : isSubActive
            ? 'bg-[#800020]/40 dark:text-[#E0A899] font-semibold'
            : 'text-neutral-300 hover:bg-white/10 hover:text-white'
          }`}
      >
        <span className="truncate">{child.label}</span>
        {hasSubChildren && (
          <FiChevronRight size={12} className={`shrink-0 ml-2 transition-transform ${isHovered ? 'text-white' : 'text-neutral-400'}`} />
        )}
      </NavLink>

      {/* 2nd Tier Nested Sub-Flyout (pops out to the right) */}
      {hasSubChildren && isHovered && (
        <div
          className="absolute left-full top-0 pl-1.5 min-w-[210px] max-w-[250px] z-99999"
          style={{ animation: 'sidebarFlyoutFadeIn 0.12s ease-out forwards' }}
        >
          {/* Invisible safe bridge covering the gap seamlessly */}
          <div className="absolute top-0 -left-2 w-3 h-full bg-transparent pointer-events-auto" />
          <div className="rounded-xl border border-[#2D2D2D] bg-[#161618] text-slate-100 shadow-2xl ring-1 ring-white/5 p-1.5">
            <ul className="flex flex-col gap-0.5">
              {child.children.map((grandChild: any, gIdx: number) => {
                const gDest = (grandChild.path && getTenantPath ? getTenantPath(grandChild.path) : grandChild.path) || '#';
                const isGActive = grandChild.path && (pathname === gDest || pathname === grandChild.path);
                return (
                  <li key={gIdx}>
                    <NavLink
                      to={gDest}
                      onClick={() => {
                        setOpenMenuId(null);
                        handleLinkClick();
                      }}
                      className={`flex items-center rounded-lg px-3 py-1.5 text-[12.5px] font-normal transition-all duration-150 ${isGActive
                        ? 'bg-[#800020] text-white font-semibold shadow-xs'
                        : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      <span className="truncate">{grandChild.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
};

const SidebarItem = ({
  item: rawItem,
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
  masterPreset,
}: any) => {
  const isTheme2 = masterPreset === 'nht-2' || (masterPreset !== 'nht-1' && isNHTTheme2Active());
  const reportMode = getReportLayoutMode();
  const isReportsItem = (rawItem?.label || '').toLowerCase().trim() === 'reports';
  const effectiveChildren = isReportsItem
    ? (reportMode === 'classic' ? NHT2_REPORTS_CHILDREN : undefined)
    : rawItem?.children;
  const item = {
    ...rawItem,
    path: isReportsItem ? '/Reports/Reports-Dashboard' : rawItem?.path,
    children: effectiveChildren,
  };
  const EffectiveIcon = isTheme2 ? (getTheme2Icon(item) || item.icon) : item.icon;
  const { isRTL } = useLanguage();
  const itemRef = useRef<HTMLDivElement>(null);
  const flyoutPanelRef = useRef<HTMLDivElement>(null);
  const menuUniqueKey = `${parentKey}-${item.label}`;
  const [open, setOpen] = useState(false);
  const [showFlyout, setShowFlyout] = useState(false);
  const [activeChildKey, setActiveChildKey] = useState<string | null>(null);
  const [flyoutTop, setFlyoutTop] = useState<number>(0);
  const [flyoutLeft, setFlyoutLeft] = useState<number>(56);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close opened flyout container on outside click (Theme 2)
  useEffect(() => {
    if (isTheme2 && sidebarOpen && openMenuId === menuUniqueKey) {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          itemRef.current && !itemRef.current.contains(e.target as Node) &&
          flyoutPanelRef.current && !flyoutPanelRef.current.contains(e.target as Node)
        ) {
          setOpenMenuId(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [masterPreset, sidebarOpen, openMenuId, menuUniqueKey, setOpenMenuId]);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setShowFlyout(false);
    }, 120);
  };

  useEffect(() => {
    return () => clearHideTimeout();
  }, []);

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

  // Sync active route ONLY when pathname changes (Theme 1 expands drawer; Theme 2 popover opens only on explicit user click!)
  useEffect(() => {
    if (isChildActive) {
      setOpen(true);
      if (depth === 0 && (!isTheme2 || isMobile)) {
        setOpenMenuId(menuUniqueKey);
      }
    }
  }, [pathname, isChildActive, depth, menuUniqueKey, setOpenMenuId, isTheme2, isMobile]);

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
    clearHideTimeout();
    if (!sidebarOpen && !isMobile && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const asideEl = itemRef.current.closest('aside');
      const asideRect = asideEl ? asideEl.getBoundingClientRect() : null;
      const estimatedHeight = Math.min((item.children?.length || 4) * 36 + 50, 420);
      const maxTop = Math.max(12, window.innerHeight - estimatedHeight - 16);
      setFlyoutTop(Math.min(rect.top, maxTop));
      if (isRTL) {
        const edgeLeft = asideRect ? asideRect.left : rect.left;
        setFlyoutLeft(edgeLeft);
      } else {
        const edgeRight = asideRect ? asideRect.right : rect.right;
        setFlyoutLeft(edgeRight);
      }
      setShowFlyout(true);
    }
  };

  if (item.children) {
    return (
      <div
        ref={itemRef}
        className="w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={scheduleHide}
      >
        <SidebarLinkGroup activeCondition={isChildActive}>
          {(handleClick, isGroupOpen) => (
            <>
              <NavLink
                to="#"
                className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out ${sidebarThemeMode === 'light' ? 'hover:bg-slate-100/90' : 'hover:bg-white/10'
                  } ${isChildActive && shouldShowLabels ? 'font-bold shadow-xs' : ''
                  } ${shouldShowLabels ? 'px-3.5 justify-start' : 'justify-center mx-auto w-10 h-10 px-0'}`}
                style={{
                  paddingLeft: shouldShowLabels ? `${(depth + 1) * 0.85}rem` : undefined,
                  color: isTheme2 && isChildActive ? '#FFFFFF' : sidebarColor,
                  backgroundColor: isTheme2 && isChildActive
                    ? 'var(--color-primary, #800020)'
                    : isChildActive && shouldShowLabels ? `${sidebarColor}20` : undefined,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  // In NHT Theme 2 when opened on desktop: Clicking opens the side flyout container!
                  if (isTheme2 && sidebarOpen && !isMobile) {
                    const isCurrentlyOpen = openMenuId === menuUniqueKey;
                    if (isCurrentlyOpen) {
                      setOpenMenuId(null);
                    } else {
                      if (itemRef.current) {
                        const rect = itemRef.current.getBoundingClientRect();
                        const asideEl = itemRef.current.closest('aside');
                        const asideRect = asideEl ? asideEl.getBoundingClientRect() : null;
                        const estimatedHeight = Math.min((item.children?.length || 4) * 38 + 50, 480);
                        const maxTop = Math.max(12, window.innerHeight - estimatedHeight - 16);
                        setFlyoutTop(Math.min(rect.top, maxTop));
                        if (isRTL) {
                          setFlyoutLeft(asideRect ? asideRect.left : rect.left);
                        } else {
                          setFlyoutLeft(asideRect ? asideRect.right : rect.right);
                        }
                      }
                      setOpenMenuId(menuUniqueKey);
                    }
                    return;
                  }

                  // Default Theme 1 accordion expansion
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
                {EffectiveIcon && (
                  <EffectiveIcon
                    className="text-lg shrink-0 transition-colors"
                    style={{ color: isTheme2 && isChildActive ? '#FFFFFF' : sidebarColor }}
                  />
                )}
                {shouldShowLabels && (
                  <>
                    <span
                      className="text-xs font-semibold ml-2.5 whitespace-nowrap overflow-hidden text-ellipsis flex flex-col gap-1 tracking-wide"
                      style={{ color: isTheme2 && isChildActive ? '#FFFFFF' : sidebarColor }}
                    >
                      {getSidebarLabel(item.label, isRTL)}
                    </span>
                    <span
                      className="ml-auto transition-transform duration-200"
                      style={{ color: isTheme2 && isChildActive ? '#FFFFFF' : sidebarColor, opacity: 0.8 }}
                    >
                      {isTheme2 && !isMobile ? (
                        <FiChevronRight size={13} className={`transition-transform duration-200 ${openMenuId === menuUniqueKey ? (isRTL ? '-rotate-90' : 'rotate-90') : ''}`} />
                      ) : open ? (
                        <AiOutlineUp size={11} />
                      ) : (
                        <AiOutlineDown size={11} />
                      )}
                    </span>
                  </>
                )}
              </NavLink>

              {/* Collapsible Sub-item Drawer (Theme 1 Accordion Mode) */}
              {shouldShowLabels && (!isTheme2 || isMobile) && (
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
                        masterPreset={masterPreset}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </SidebarLinkGroup>

        {/* NHT Theme 2: Opened Side Flyout Container on Click (Amal-style pure text menu) */}
        {isTheme2 && sidebarOpen && openMenuId === menuUniqueKey && !isMobile && typeof document !== 'undefined' && createPortal(
          <div
            ref={flyoutPanelRef}
            className={`fixed z-99999 min-w-[210px] max-w-[260px] rounded-xl border ${sidebarThemeMode === 'light'
              ? 'border-slate-200 bg-white text-slate-800 shadow-2xl'
              : 'border-[#2D2D2D] bg-[#1A1A1A] text-slate-100 shadow-2xl ring-1 ring-white/5'
              } p-1.5 backdrop-blur-xl animate-fadeIn`}
            style={{
              top: `${flyoutTop}px`,
              ...(isRTL ? { right: `${Math.max(0, window.innerWidth - flyoutLeft)}px` } : { left: `${flyoutLeft}px` }),
              overflow: 'visible',
            }}
          >
            <ul className="flex flex-col gap-0.5">
              {item.children.filter((child: any) => child && !child.hideFromSidebar).map((child: any, idx: number) => (
                <Theme2FlyoutItem
                  key={child.label || idx}
                  child={child}
                  pathname={pathname}
                  handleLinkClick={handleLinkClick}
                  getTenantPath={getTenantPath}
                  setOpenMenuId={setOpenMenuId}
                  activeChildKey={activeChildKey}
                  setActiveChildKey={setActiveChildKey}
                  clearHideTimeout={clearHideTimeout}
                  scheduleHide={scheduleHide}
                />
              ))}
            </ul>
          </div>,
          document.body
        )}

        {/* Collapsed Flyout Popover */}
        {!sidebarOpen && showFlyout && !isMobile && typeof document !== 'undefined' && createPortal(
          <div
            className={`fixed z-99999 min-w-[210px] rounded-2xl border ${sidebarThemeMode === 'light'
              ? 'border-slate-200/90 bg-white/98 text-slate-800 shadow-xl'
              : 'border-slate-700/90 bg-slate-900/95 text-slate-100 shadow-2xl'
              } p-2 backdrop-blur-md`}
            style={{
              top: `${flyoutTop}px`,
              ...(isRTL ? { right: `${Math.max(0, window.innerWidth - flyoutLeft)}px` } : { left: `${flyoutLeft}px` }),
              animation: 'sidebarFlyoutFadeIn 0.18s ease-out forwards',
            }}
            onMouseEnter={clearHideTimeout}
            onMouseLeave={scheduleHide}
          >
            <style>{`
              @keyframes sidebarFlyoutFadeIn {
                from { opacity: 0; transform: ${isRTL ? 'translateX(6px)' : 'translateX(-6px)'}; }
                to { opacity: 1; transform: translateX(0); }
              }
            `}</style>
            <div className={`absolute top-0 ${isRTL ? '-right-3' : '-left-3'} w-3 h-full bg-transparent`} />
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
          </div>,
          document.body
        )}
      </div>
    );
  }

  const singleDestination = (item.path && getTenantPath ? getTenantPath(item.path) : item.path) || '#';
  const isDirectActive = item.path && (pathname === singleDestination || pathname === item.path);

  const handleSingleMouseEnter = () => {
    clearHideTimeout();
    if (!sidebarOpen && !isMobile && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const asideEl = itemRef.current.closest('aside');
      const asideRect = asideEl ? asideEl.getBoundingClientRect() : null;
      setFlyoutTop(rect.top + (rect.height / 2) - 15);
      if (isRTL) {
        const edgeLeft = asideRect ? asideRect.left : rect.left;
        setFlyoutLeft(edgeLeft);
      } else {
        const edgeRight = asideRect ? asideRect.right : rect.right;
        setFlyoutLeft(edgeRight);
      }
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
      onMouseLeave={scheduleHide}
    >
      <NavLink
        to={singleDestination}
        className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out ${sidebarThemeMode === 'light' ? 'hover:bg-slate-100/90' : 'hover:bg-white/10'
          } ${isDirectActive ? 'font-bold shadow-xs' : ''
          } ${shouldShowLabels ? 'px-3.5 justify-start' : 'justify-center mx-auto w-10 h-10 px-0'}`}
        style={{
          paddingLeft: shouldShowLabels ? `${(depth + 1) * 0.85}rem` : undefined,
          color: isTheme2 && isDirectActive ? '#FFFFFF' : (isDirectActive ? 'var(--color-primary)' : sidebarColor),
          backgroundColor: isTheme2 && isDirectActive
            ? 'var(--color-primary, #800020)'
            : isDirectActive ? 'rgba(var(--color-primary-rgb), 0.12)' : undefined,
          borderColor: isDirectActive && !isTheme2 ? 'rgba(var(--color-primary-rgb), 0.25)' : 'transparent',
        }}
      >
        {EffectiveIcon && (
          <EffectiveIcon
            className="text-lg shrink-0 transition-colors"
            style={{ color: isTheme2 && isDirectActive ? '#FFFFFF' : sidebarColor }}
          />
        )}
        {shouldShowLabels && (
          <span
            className="text-xs font-semibold ml-2.5 whitespace-nowrap overflow-hidden text-ellipsis tracking-wide"
            style={{ color: isTheme2 && isDirectActive ? '#FFFFFF' : sidebarColor }}
          >
            {getSidebarLabel(item.label, isRTL)}
          </span>
        )}
      </NavLink>

      {!sidebarOpen && showFlyout && !isMobile && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed z-99999 px-3 py-1.5 rounded-xl border ${sidebarThemeMode === 'light'
            ? 'border-slate-200/90 bg-white/98 text-slate-800 shadow-xl'
            : 'border-slate-700/90 bg-slate-900/95 text-slate-100 shadow-2xl'
            } text-xs font-bold backdrop-blur-md pointer-events-none whitespace-nowrap`}
          style={{
            top: `${flyoutTop}px`,
            ...(isRTL ? { right: `${Math.max(0, window.innerWidth - flyoutLeft + 4)}px` } : { left: `${flyoutLeft + 4}px` }),
            color: sidebarColor,
            animation: 'sidebarFlyoutFadeIn 0.18s ease-out forwards',
          }}
        >
          {getSidebarLabel(item.label, isRTL)}
        </div>,
        document.body
      )}
    </li>
  );
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const { getRoleBasedRoutes, logout, tenantId, userEmail } = useAuth();
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
  const [customSidebarBg, setCustomSidebarBg] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('jakwani_sidebar_custom_bg') || '' : '';
  });

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

  // Master Theme Preset State (NHT Theme 1 vs NHT Theme 2 vs Custom)
  const [masterPreset, setMasterPreset] = useState<MasterThemePreset>(() => getMasterThemePreset());
  const [sidebarDesign, setSidebarDesign] = useState<'theme-1' | 'theme-2'>(() => getEffectiveSidebarDesign());

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

  const isTheme2 = sidebarDesign === 'theme-2';

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
      style={{
        background: customSidebarBg || undefined,
      }}
      className={`flex flex-col ${customSidebarBg ? '' : themeStyles.bg} ${themeStyles.text} duration-300 ease-in-out select-none ${themeStyles.shadow} ${!sidebarOpen && sidebarBehaviorMode === 'closed' ? 'cursor-pointer' : ''
        } ${isMobile
          ? 'fixed left-0 top-0 z-99999 h-screen block'
          : `min-[751px]:relative min-[751px]:shrink-0 min-[751px]:z-30 ${layoutMode === 'floating'
            ? `min-[751px]:self-start min-[751px]:my-3 min-[751px]:ml-3 min-[751px]:h-fit min-[751px]:max-h-[calc(100vh-1.5rem)] min-[751px]:rounded-3xl min-[751px]:border ${themeStyles.border}`
            : `min-[751px]:h-screen min-[751px]:rounded-none min-[751px]:border-r ${themeStyles.border}`
          }`
        } ${sidebarOpen
          ? `${isTheme2 ? 'w-56' : 'w-72.5'} translate-x-0 visible ${layoutMode === 'classic' ? `border-r ${themeStyles.border}` : ''}`
          : `w-0 -translate-x-full min-[751px]:w-18 ${layoutMode === 'floating' ? 'min-[751px]:translate-x-0' : `min-[751px]:translate-x-0 min-[751px]:border-r ${themeStyles.border}`} max-[750px]:invisible`
        }`}
    >
      {/* Brand Header */}
      <div className={`flex items-center shrink-0 border-b ${themeStyles.headerBorder} ${sidebarOpen ? (isTheme2 ? 'px-3 py-3.5' : 'px-5 py-4') : 'justify-center p-3'
        }`}>
        {sidebarOpen ? (
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-90 min-w-0"
          >
            <div className={`w-9.5 h-9.5 rounded-xl ${themeStyles.brandCard} p-1 flex items-center justify-center shadow-md shrink-0 border overflow-hidden select-none`}>
              <img src={sidebarThemeMode === 'light' ? IconDark : IconLight} alt="Logo" className="w-full h-full object-contain" />
            </div>

            <div className="flex flex-col min-w-0 justify-center">
              {isRTL ? (
                <span className="font-black text-xs text-white font-sans leading-tight">
                  المحمّدی ٹائل ایمپوریم
                </span>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className={`font-black tracking-wide text-xs ${themeStyles.brandText} font-cinzel whitespace-nowrap`}>
                      {brand.brandWord1 && brand.brandWord2 ? `${brand.brandWord1} ${brand.brandWord2}` : 'AL MUHAMMADI'}
                    </span>
                    <span className="px-1 py-0.5 rounded text-[8px] font-mono font-black tracking-wider bg-primary/20 text-primary dark:bg-white/10 dark:text-rose-300 uppercase shrink-0">
                      ERP
                    </span>
                  </div>
                  <span className="text-[9.5px] font-extrabold tracking-widest text-slate-400 dark:text-slate-400 uppercase leading-none mt-1 whitespace-nowrap">
                    {brand.brandSuffix || 'TILE EMPORIUM'}
                  </span>
                </>
              )}
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

      {/* Floating Border Edge Toggle Tab (Half-circle protruding on border center) - Hidden when in NHT Theme 2 or Keep Closed */}
      {sidebarBehaviorMode !== 'closed' && !isTheme2 && (
        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className={`absolute top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-5 h-10 ${themeStyles.toggleBg} ${themeStyles.toggleText} shadow-md cursor-pointer transition-all duration-200 hover:w-6 group ${isRTL
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
      )}

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
              masterPreset={masterPreset}
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
              className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out ${themeStyles.itemHover} ${pathname === getTenantPath('/settings') || pathname === '/settings' ? 'font-bold shadow-xs' : ''
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

          {/* Log Out Button (Only shown in standard Theme 1 or when collapsed) */}
          {(!isTheme2 || !sidebarOpen) && (
            <li
              className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out ${themeStyles.logoutHover} cursor-pointer mt-4 border-t ${themeStyles.dividerBorder} pt-4 ${sidebarOpen ? 'justify-start px-3.5' : 'justify-center mx-auto w-10 h-10 px-0'
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
          )}
        </ul>
      </div>

      {/* User Profile Footer (Amal ERP Style for Theme 2) */}
      {isTheme2 && sidebarOpen && (
        <div className="shrink-0 border-t border-white/10 px-3.5 py-3 flex items-center justify-between bg-black/25">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[12px] font-bold text-white truncate leading-tight tracking-wide">
              {userEmail ? userEmail.split('@')[0].toUpperCase() : 'MUHAMMAD SAAD'}
            </span>
            <span className="text-[9px] text-neutral-400 truncate uppercase tracking-wider font-semibold mt-0.5">
              {brand.fullName || 'AL MUHAMMADI TILE EMPORIUM'}
            </span>
          </div>
          <button
            onClick={() => logout()}
            title="Log Out"
            className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 shrink-0"
          >
            <LuLogOut size={15} />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
