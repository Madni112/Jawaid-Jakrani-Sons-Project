import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { AiOutlineUp, AiOutlineDown } from 'react-icons/ai';
import { FiChevronRight } from 'react-icons/fi';
import SidebarLinkGroup from '../SidebarLinkGroup';
import { useLanguage } from '../../../Context/LanguageContext';
import { getReportLayoutMode } from '../../../constant/themeConfig';
import {
  getSidebarLabel,
  getTheme2Icon,
  NHT2_ACCOUNTS_CHILDREN,
  NHT2_REPORTS_CHILDREN,
} from '../data/sidebarConstants';
import { FlyoutSubMenu } from './FlyoutSubMenu';
import { Theme2FlyoutItem } from './Theme2FlyoutItem';

interface SidebarItemProps {
  item: any;
  depth?: number;
  pathname: string;
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean | ((prev: boolean) => boolean)) => void;
  isMobile: boolean;
  hideModal: () => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  parentKey?: string;
  getTenantPath?: (path?: string) => string;
  sidebarColor: string;
  layoutMode: string;
  sidebarThemeMode: string;
  sidebarBehaviorMode: string;
  masterPreset: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
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
}) => {
  const isTheme2 = masterPreset === 'nht-2';
  const reportMode = getReportLayoutMode();
  const isAccountsItem = (rawItem?.label || '').toLowerCase().trim() === 'accounts';
  const isReportsItem = (rawItem?.label || '').toLowerCase().trim() === 'reports';
  const effectiveChildren = isAccountsItem
    ? NHT2_ACCOUNTS_CHILDREN
    : isReportsItem
      ? (reportMode === 'classic' ? NHT2_REPORTS_CHILDREN : undefined)
      : rawItem?.children;
  const item = {
    ...rawItem,
    path: isAccountsItem
      ? '/Registration/Chart-of-Account/List'
      : isReportsItem
        ? (reportMode === 'classic' ? '/Reports/Main-Reports?tab=profit-loss' : '/Reports/Reports-Dashboard')
        : rawItem?.path,
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
    if (isTheme2 && openMenuId === menuUniqueKey) {
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
  }, [masterPreset, sidebarOpen, openMenuId, menuUniqueKey, setOpenMenuId, isTheme2]);

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
    const isLedgersPath = pathname.toLowerCase().includes('/accounts/ledgers');
    if (isAccountsItem) {
      if (isLedgersPath) return false;
      return (
        pathname.toLowerCase().includes('/registration/chart-of-account') ||
        pathname.toLowerCase().includes('/registration/vouchers') ||
        pathname.toLowerCase().includes('/registration/bank-account') ||
        pathname.toLowerCase().includes('/inventory/openingstock') ||
        (pathname.toLowerCase().startsWith('/accounts') && !isLedgersPath)
      );
    }
    if (isReportsItem && (pathname.toLowerCase().includes('/reports') || isLedgersPath)) return true;
    if (node.path) {
      const destination = getTenantPath ? getTenantPath(node.path) : node.path;
      const cleanDest = destination.split('?')[0].toLowerCase();
      const cleanPath = pathname.split('?')[0].toLowerCase();
      if (cleanPath === cleanDest || cleanPath === node.path.split('?')[0].toLowerCase()) return true;
    }
    if (node.children && Array.isArray(node.children)) {
      return node.children.some((child: any) => checkChildActive(child));
    }
    return false;
  };

  const isChildActive = checkChildActive(item);

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
    // Only show flyout on hover when the sidebar is collapsed in Theme 1 (!isTheme2)
    if (!isTheme2 && !sidebarOpen && !isMobile && itemRef.current) {
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
          {(handleClick) => (
            <>
              <NavLink
                to="#"
                className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out ${
                  sidebarThemeMode === 'light' ? 'hover:bg-slate-100/90' : 'hover:bg-white/10'
                } ${isChildActive && shouldShowLabels ? 'font-bold shadow-xs' : ''} ${
                  shouldShowLabels ? 'px-3.5 justify-start' : 'justify-center mx-auto w-10 h-10 px-0'
                }`}
                style={{
                  paddingLeft: shouldShowLabels ? `${(depth + 1) * 0.85}rem` : undefined,
                  color: isTheme2 && isChildActive ? '#FFFFFF' : sidebarColor,
                  backgroundColor: isTheme2 && isChildActive
                    ? 'var(--color-primary, #800020)'
                    : isChildActive && shouldShowLabels ? `${sidebarColor}20` : undefined,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  // In NHT Theme 2 (both opened and collapsed on desktop): Clicking opens/toggles the side flyout container!
                  if (isTheme2 && !isMobile) {
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

        {/* NHT Theme 2: Opened Side Flyout Container on Click */}
        {isTheme2 && openMenuId === menuUniqueKey && !isMobile && typeof document !== 'undefined' && createPortal(
          <div
            ref={flyoutPanelRef}
            onMouseEnter={clearHideTimeout}
            onMouseLeave={scheduleHide}
            className={`fixed z-99999 min-w-[210px] max-w-[260px] rounded-xl border ${
              sidebarThemeMode === 'light'
                ? 'border-slate-200 bg-white text-slate-800 shadow-2xl'
                : 'border-[#2D2D2D] bg-[#1A1A1A] text-slate-100 shadow-2xl ring-1 ring-white/5'
            } p-1.5 backdrop-blur-xl animate-fadeIn`}
            style={{
              top: `${flyoutTop}px`,
              ...(isRTL ? { right: `${Math.max(0, window.innerWidth - flyoutLeft)}px` } : { left: `${flyoutLeft}px` }),
              overflow: 'visible',
            }}
          >
            <div className={`absolute top-0 ${isRTL ? '-right-3' : '-left-3'} w-3 h-full bg-transparent pointer-events-auto`} />
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

        {/* Collapsed Flyout Popover (Only for Theme 1) */}
        {!isTheme2 && !sidebarOpen && showFlyout && !isMobile && typeof document !== 'undefined' && createPortal(
          <div
            className={`fixed z-99999 min-w-[210px] rounded-2xl border ${
              sidebarThemeMode === 'light'
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
        className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out ${
          sidebarThemeMode === 'light' ? 'hover:bg-slate-100/90' : 'hover:bg-white/10'
        } ${isDirectActive ? 'font-bold shadow-xs' : ''} ${
          shouldShowLabels ? 'px-3.5 justify-start' : 'justify-center mx-auto w-10 h-10 px-0'
        }`}
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
          className={`fixed z-99999 px-3 py-1.5 rounded-xl border ${
            sidebarThemeMode === 'light'
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
