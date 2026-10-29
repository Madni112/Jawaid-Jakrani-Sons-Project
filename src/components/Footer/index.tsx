import React, { useState, useEffect } from 'react';
import {
  MdPhone,
  MdWhatsapp,
  MdEmail,
  MdShield,
} from 'react-icons/md';
import { useAuth } from '../../Context/Auth';
import { getBrandConfig } from '../../utils/brand';
import {
  NavbarLayoutMode,
  getNavbarLayoutMode,
  getSavedAccentColor,
  getSafeAccentTextColor,
  isDarkModeActive,
} from '../../constant/themeConfig';

const Footer: React.FC = () => {
  const { businessName } = useAuth();
  const brand = getBrandConfig();
  const currentYear = new Date().getFullYear();

  const [navbarMode, setNavbarMode] = useState<NavbarLayoutMode>(getNavbarLayoutMode());
  const [accentColor, setAccentColor] = useState<string>(getSavedAccentColor());

  useEffect(() => {
    const handleNavbarMode = () => setNavbarMode(getNavbarLayoutMode());
    const handleThemeChange = () => setAccentColor(getSavedAccentColor());

    window.addEventListener('zoaib_ali_navbar_layout_changed', handleNavbarMode);
    window.addEventListener('zoaib_ali_theme_color_changed', handleThemeChange);

    return () => {
      window.removeEventListener('zoaib_ali_navbar_layout_changed', handleNavbarMode);
      window.removeEventListener('zoaib_ali_theme_color_changed', handleThemeChange);
    };
  }, []);

  const isDark = isDarkModeActive();
  const safeAccent = getSafeAccentTextColor(accentColor, isDark);
  const isFloating = navbarMode === 'floating';

  return (
    <footer
      className={`print:hidden shrink-0 transition-all duration-300 select-none ${
        isFloating
          ? 'mx-3 sm:mx-4 mb-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/95 dark:bg-[#111827]/95 shadow-md px-4 py-2.5 sm:px-5 sm:py-3'
          : 'w-full border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md bg-white/90 dark:bg-[#0B0F17]/90 px-4 py-2.5 sm:px-6 sm:py-3'
      }`}
    >
      <div className="mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs">
        {/* Left: Client Enterprise & System Status */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-center md:text-left">
          <div className="flex items-center gap-1.5 font-black text-slate-800 dark:text-slate-100 text-[11px] uppercase tracking-wide">
            <span
              className="w-2 h-2 rounded-full shadow-2xs shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            <span>{brand.fullName}</span>
          </div>

          {businessName && (
            <span className="hidden sm:inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[9.5px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {businessName}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Cloud Synced Active
          </span>

          <span className="hidden lg:inline-flex items-center gap-1 text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">
            <MdShield size={11} className="text-emerald-500" /> Enterprise Secure
          </span>
        </div>

        {/* Right: Developer Contact Suite (Email, Phone, WhatsApp) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-[11px]">
          {/* Email */}
          <a
            href="mailto:nht@noorhorizontechnologies.com"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/80 transition cursor-pointer"
            title="Email NHT Support"
          >
            <MdEmail size={12} className="text-slate-400" />
            <span className="text-[10px] font-medium">nht@noorhorizontechnologies.com</span>
          </a>

          {/* Phone */}
          <a
            href="tel:+923128039911"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/80 font-bold transition cursor-pointer"
            title="Call Developer Support"
          >
            <MdPhone size={12} style={{ color: safeAccent }} />
            <span className="text-[10.5px] font-mono tracking-tight">+92 312 8039911</span>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/923128039911"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-[#25D366]/10 px-2.5 py-1 text-[10.5px] font-bold text-[#25D366] hover:bg-[#25D366] hover:text-white transition duration-150 border border-[#25D366]/20 shadow-2xs"
            title="Chat on WhatsApp"
          >
            <MdWhatsapp size={13} />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Bottom Sub-line: Engineering & Copyright Signature */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-1 text-[9.5px] text-slate-400 dark:text-slate-500">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1">
          <span>© {currentYear}</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">NHT ENTERPRISES</span>
          <span>• Developed by</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">ABDUL SATTAR</span>
          <span className="hidden sm:inline">• All rights reserved.</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] text-slate-400 dark:text-slate-500">
          <span>v1.3.9</span>
          <span>•</span>
          <span>Noor Horizon Technologies</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
