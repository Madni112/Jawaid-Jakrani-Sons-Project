import React from 'react';
import { LuLogOut, LuPanelLeftClose, LuPanelLeftOpen } from 'react-icons/lu';

interface SidebarBottomSectionProps {
  isTheme2: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean | ((prev: boolean) => boolean)) => void;
  logout: () => void;
  userEmail?: string;
  brand: any;
  isRTL: boolean;
  currentSidebarColor: string;
  themeStyles: any;
}

export const SidebarBottomSection: React.FC<SidebarBottomSectionProps> = ({
  isTheme2,
  sidebarOpen,
  setSidebarOpen,
  logout,
  userEmail,
  brand,
  isRTL,
  currentSidebarColor,
  themeStyles,
}) => {
  if (!isTheme2) return null;

  if (sidebarOpen) {
    return (
      <div className="shrink-0 border-t border-white/10 px-3.5 py-3 flex items-center justify-between bg-black/25">
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-[12px] font-bold text-white truncate leading-tight tracking-wide">
            {userEmail ? userEmail.split('@')[0].toUpperCase() : 'MUHAMMAD SAAD'}
          </span>
          <span className="text-[9px] text-neutral-400 truncate uppercase tracking-wider font-semibold mt-0.5">
            {brand.fullName || 'ZOHAIB ALI AND COMPANY'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            title={isRTL ? 'سائیڈبار بند کریں' : 'Collapse sidebar'}
            className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
          >
            <LuPanelLeftClose size={15} />
          </button>
          <button
            onClick={() => logout()}
            title={isRTL ? 'لاگ آؤٹ' : 'Log Out'}
            className="text-neutral-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
          >
            <LuLogOut size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-white/10 py-3 flex flex-col items-center gap-2 bg-black/25">
      {/* Pinned Gemini-style Toggle Button in Theme Color */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        style={{
          backgroundColor: 'var(--color-primary, #800020)',
          color: '#FFFFFF',
        }}
        title={isRTL ? 'سائیڈبار کھولیں' : 'Expand sidebar'}
      >
        <LuPanelLeftOpen size={18} className="shrink-0 text-white" />
      </button>

      {/* Pinned Logout Button in Collapsed Mode */}
      <button
        type="button"
        onClick={() => logout()}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${themeStyles.logoutHover}`}
        style={{ color: currentSidebarColor }}
        title={isRTL ? 'لاگ آؤٹ' : 'Log Out'}
      >
        <LuLogOut className="text-lg shrink-0 transition-colors" />
      </button>
    </div>
  );
};
