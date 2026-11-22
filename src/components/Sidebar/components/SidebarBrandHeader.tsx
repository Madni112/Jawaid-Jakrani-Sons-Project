import React from 'react';
import { NavLink } from 'react-router-dom';
import IconDark from '../../../images/logo/icon-dark.png';
import IconLight from '../../../images/logo/icon-light.png';

interface SidebarBrandHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean | ((prev: boolean) => boolean)) => void;
  isTheme2: boolean;
  sidebarThemeMode: string;
  themeStyles: any;
  brand: any;
  isRTL: boolean;
}

export const SidebarBrandHeader: React.FC<SidebarBrandHeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  isTheme2,
  sidebarThemeMode,
  themeStyles,
  brand,
  isRTL,
}) => {
  return (
    <div
      className={`flex items-center shrink-0 border-b ${themeStyles.headerBorder} ${
        sidebarOpen ? (isTheme2 ? 'px-3 py-3.5' : 'px-5 py-4') : 'justify-center p-3'
      }`}
    >
      {sidebarOpen ? (
        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-90 min-w-0"
        >
          <div
            className={`w-9.5 h-9.5 rounded-xl ${themeStyles.brandCard} p-1 flex items-center justify-center shadow-md shrink-0 border overflow-hidden select-none`}
          >
            <img
              src={sidebarThemeMode === 'light' ? IconDark : IconLight}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col min-w-0 justify-center">
            {isRTL ? (
              <span className="font-black text-xs text-white font-sans leading-tight">
                المحمّدی ٹائل ایمپوریم
              </span>
            ) : (
              <>
                <div className="flex items-center gap-1.5 leading-none">
                  <span
                    className={`font-black tracking-wide text-xs ${themeStyles.brandText} font-cinzel whitespace-nowrap`}
                  >
                    {brand.brandWord1 && brand.brandWord2 ? `${brand.brandWord1} ${brand.brandWord2}` : 'Jawaid Jakwani & Sons'}
                  </span>
                  <span className="px-1 py-0.5 rounded text-[8px] font-mono font-black tracking-wider bg-primary/20 text-primary dark:bg-white/10 dark:text-rose-300 uppercase shrink-0">
                    ERP
                  </span>
                </div>
                <span className="text-[9.5px] font-extrabold tracking-widest text-slate-400 dark:text-slate-400 uppercase leading-none mt-1 whitespace-nowrap">
                  {brand.brandSuffix || 'COMPANY'}
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
  );
};
