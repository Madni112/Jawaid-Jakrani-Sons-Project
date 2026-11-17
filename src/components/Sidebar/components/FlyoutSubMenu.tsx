import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AiOutlineRight } from 'react-icons/ai';
import { useLanguage } from '../../../Context/LanguageContext';
import { getSidebarLabel } from '../data/sidebarConstants';

interface FlyoutSubMenuProps {
  item: any;
  pathname: string;
  handleLinkClick: () => void;
  getTenantPath?: (path?: string) => string;
  sidebarColor: string;
  sidebarThemeMode: string;
}

export const FlyoutSubMenu: React.FC<FlyoutSubMenuProps> = ({
  item,
  pathname,
  handleLinkClick,
  getTenantPath,
  sidebarColor,
  sidebarThemeMode,
}) => {
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
        } ${isActive ? 'shadow-xs font-bold' : ''}`}
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
