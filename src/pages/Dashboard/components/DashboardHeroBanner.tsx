import React from 'react';
import {
  LuPlus,
  LuShoppingCart,
  LuFileText,
  LuArrowDownToLine,
  LuSearch,
  LuMoon,
  LuBell,
} from 'react-icons/lu';
import { getContrastTextColor } from '../../../constant/themeConfig';

interface DashboardHeroBannerProps {
  accentColor: string;
  currentTime: string;
  currentDate: string;
  greeting: string;
  displayName: string;
  navigate: (path: string) => void;
}

export const DashboardHeroBanner: React.FC<DashboardHeroBannerProps> = ({
  accentColor,
  currentTime,
  currentDate,
  greeting,
  displayName,
  navigate,
}) => {
  const bannerBg = accentColor || '#800020';
  const isLightBanner = getContrastTextColor(bannerBg) === '#0F172A';

  return (
    <div
      className="rounded-2xl p-5 md:p-6 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-300"
      style={{ backgroundColor: bannerBg, color: isLightBanner ? '#0F172A' : '#FFFFFF' }}
    >
      <div>
        <div className="flex items-baseline gap-3">
          <span className={`text-3xl md:text-4xl font-extrabold tracking-tight font-mono ${isLightBanner ? 'text-slate-900' : 'text-white'}`}>
            {currentTime}
          </span>
          <span className={`text-sm font-medium ${isLightBanner ? 'text-slate-700' : 'text-white/80'}`}>
            {currentDate}
          </span>
        </div>
        <p className={`text-base md:text-lg font-bold mt-1 tracking-tight ${isLightBanner ? 'text-slate-900' : 'text-white/95'}`}>
          {greeting}, {displayName}!
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => navigate('/sales/invoice/new')}
          className={`font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
            isLightBanner
              ? 'bg-slate-900 text-white hover:bg-black'
              : 'bg-white text-gray-900 hover:bg-slate-100'
          }`}
        >
          <LuPlus size={14} />
          <span>New Sale</span>
        </button>
        <button
          onClick={() => navigate('/Purchase/Purchases/list')}
          className={`border font-medium px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            isLightBanner
              ? 'bg-black/10 hover:bg-black/20 border-black/20 text-slate-900'
              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
          }`}
        >
          <LuShoppingCart size={14} />
          <span>Purchase</span>
        </button>
        <button
          onClick={() => navigate('/Reports/Reports-Dashboard')}
          className={`border font-medium px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            isLightBanner
              ? 'bg-black/10 hover:bg-black/20 border-black/20 text-slate-900'
              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
          }`}
        >
          <LuFileText size={14} />
          <span>Reports</span>
        </button>
        <button
          onClick={() => window.print()}
          className={`border font-medium px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            isLightBanner
              ? 'bg-black/10 hover:bg-black/20 border-black/20 text-slate-900'
              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
          }`}
        >
          <LuArrowDownToLine size={14} />
          <span>Export</span>
        </button>
        <button
          onClick={() => navigate('/sales/invoice/list')}
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            isLightBanner
              ? 'bg-black/10 hover:bg-black/20 text-slate-900'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title="Search"
        >
          <LuSearch size={14} />
        </button>
        <button
          onClick={() => window.dispatchEvent(new Event('toggle-dark-mode'))}
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            isLightBanner
              ? 'bg-black/10 hover:bg-black/20 text-slate-900'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title="Toggle Dark Mode"
        >
          <LuMoon size={14} />
        </button>
        <button
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            isLightBanner
              ? 'bg-black/10 hover:bg-black/20 text-slate-900'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title="Notifications"
        >
          <LuBell size={14} />
        </button>
      </div>
    </div>
  );
};

export default DashboardHeroBanner;
