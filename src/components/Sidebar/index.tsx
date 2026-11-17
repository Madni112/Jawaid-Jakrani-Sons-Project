import React, { useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { LuLogOut, LuSlidersHorizontal } from 'react-icons/lu';
import { useModal } from '../../Context/Modal';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import { getBrandConfig } from '../../utils/brand';
import { useSidebarTheme } from './hooks/useSidebarTheme';
import { SidebarBrandHeader } from './components/SidebarBrandHeader';
import { SidebarItem } from './components/SidebarItem';
import { SidebarBottomSection } from './components/SidebarBottomSection';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean | ((prev: boolean) => boolean)) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const { getRoleBasedRoutes, logout, userEmail } = useAuth();
  const { isRTL } = useLanguage();
  const roleRoutes = getRoleBasedRoutes();
  const location = useLocation();
  const { hideModal } = useModal();
  const { pathname } = location;
  const sidebar = useRef<HTMLDivElement>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanPrefix = '';
  const getTenantPath = (path?: string) => {
    if (!path || typeof path !== 'string') return '';
    if (!cleanPrefix) return path;
    if (path === '/') return cleanPrefix;
    const cleanSub = path.startsWith('/') ? path : `/${path}`;
    return `${cleanPrefix}${cleanSub}`;
  };

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const brand = getBrandConfig();

  const {
    isMobile,
    currentSidebarColor,
    layoutMode,
    sidebarBehaviorMode,
    sidebarThemeMode,
    customSidebarBg,
    masterPreset,
    isTheme2,
    themeStyles,
  } = useSidebarTheme();

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
      className={`flex flex-col ${customSidebarBg ? '' : themeStyles.bg} ${themeStyles.text} duration-300 ease-in-out select-none ${themeStyles.shadow} ${
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
          ? `${isTheme2 ? 'w-56' : 'w-72.5'} translate-x-0 visible ${layoutMode === 'classic' ? `border-r ${themeStyles.border}` : ''}`
          : `w-0 -translate-x-full min-[751px]:w-18 ${layoutMode === 'floating' ? 'min-[751px]:translate-x-0' : `min-[751px]:translate-x-0 min-[751px]:border-r ${themeStyles.border}`} max-[750px]:invisible`
      }`}
    >
      {/* Brand Header */}
      <SidebarBrandHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isTheme2={isTheme2}
        sidebarThemeMode={sidebarThemeMode}
        themeStyles={themeStyles}
        brand={brand}
        isRTL={isRTL}
      />

      {/* Floating Border Edge Toggle Tab */}
      {sidebarBehaviorMode !== 'closed' && !isTheme2 && (
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

          {/* Log Out Button (Only shown in standard Theme 1) */}
          {!isTheme2 && (
            <li
              className={`group relative flex items-center rounded-xl py-2.5 font-medium duration-200 ease-in-out ${themeStyles.logoutHover} cursor-pointer mt-2 border-t ${themeStyles.dividerBorder} pt-2 ${
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
          )}
        </ul>
      </div>

      {/* Theme 2: Bottom Pinned Section */}
      <SidebarBottomSection
        isTheme2={isTheme2}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        logout={logout}
        userEmail={userEmail}
        brand={brand}
        isRTL={isRTL}
        currentSidebarColor={currentSidebarColor}
        themeStyles={themeStyles}
      />
    </aside>
  );
};

export default Sidebar;
