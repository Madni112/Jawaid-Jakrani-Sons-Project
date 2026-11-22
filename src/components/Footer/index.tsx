import React, { useState, useEffect } from 'react';
import { MdPhone, MdShield, MdStorefront, MdVerified } from 'react-icons/md';
import { LuCode2, LuTerminal, LuCpu, LuActivity, LuCheckCircle2 } from 'react-icons/lu';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import {
  getEffectiveFooterDesign,
  getFooterLayoutMode,
  FooterLayoutMode,
} from '../../constant/themeConfig';

const Footer: React.FC = () => {
  const { businessName } = useAuth();
  const { isRTL } = useLanguage();
  const currentYear = new Date().getFullYear();

  const [footerDesign, setFooterDesign] = useState<'theme-1' | 'theme-2'>(() => getEffectiveFooterDesign());
  const [layoutMode, setLayoutMode] = useState<FooterLayoutMode>(() => getFooterLayoutMode());

  useEffect(() => {
    const handleFooterConfigChange = () => {
      setFooterDesign(getEffectiveFooterDesign());
      setLayoutMode(getFooterLayoutMode());
    };

    window.addEventListener('nht_footer_settings_changed', handleFooterConfigChange);
    window.addEventListener('jakwani_master_theme_preset_changed', handleFooterConfigChange);
    window.addEventListener('zoaib_ali_sidebar_layout_changed', handleFooterConfigChange);
    window.addEventListener('storage', handleFooterConfigChange);

    return () => {
      window.removeEventListener('nht_footer_settings_changed', handleFooterConfigChange);
      window.removeEventListener('jakwani_master_theme_preset_changed', handleFooterConfigChange);
      window.removeEventListener('zoaib_ali_sidebar_layout_changed', handleFooterConfigChange);
      window.removeEventListener('storage', handleFooterConfigChange);
    };
  }, []);

  const clientName = isRTL ? 'المحمّدی ٹائل ایمپوریم' : (businessName || 'Jawaid Jakwani & Sons');
  const developerName = 'Abdul Sattar';
  const companyName = 'NHT ENTERPRISES';
  const phoneFormatted = '0312-8039911';
  const phoneIntl = '+923128039911';
  const whatsappUrl = `https://wa.me/923128039911?text=${encodeURIComponent('Hello Abdul Sattar, reaching out from Jawaid Jakwani & Sons ERP Portal.')}`;

  const containerClasses = layoutMode === 'floating'
    ? 'mx-3 sm:mx-4.5 mb-3 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg shadow-slate-200/40 dark:shadow-black/50'
    : 'w-full border-t border-slate-200/90 dark:border-white/10';

  // ══════════════════════════════════════════════════════════════════════
  // THEME 1 DESIGN: MODERN CORPORATE EXECUTIVE DOCK
  // ══════════════════════════════════════════════════════════════════════
  if (footerDesign === 'theme-1') {
    return (
      <footer
        className={`print:hidden ${containerClasses} bg-white/95 dark:bg-[#070B14]/95 backdrop-blur-xl px-4 py-3.5 md:px-6 2xl:px-8 transition-all duration-200 relative z-20`}
      >
        <div className="mx-auto flex flex-col lg:flex-row items-center justify-between gap-3.5 text-xs">
          
          {/* Left: Client & Developer Architecture */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
            {/* Client Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <MdStorefront size={13} />
              </span>
              <span className="font-extrabold tracking-tight text-[11px] sm:text-xs uppercase font-cinzel">
                {clientName}
              </span>
            </div>

            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

            {/* Software Developer & Company Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent dark:from-blue-500/15 dark:via-indigo-500/10 border border-blue-200/80 dark:border-blue-900/60 text-slate-800 dark:text-slate-200 shadow-2xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                <LuCode2 size={12} />
              </span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  {isRTL ? 'ڈویلپر:' : 'Dev:'}
                </span>
                <strong className="font-black text-blue-600 dark:text-blue-400 font-mono">
                  {developerName}
                </strong>
                <MdVerified className="text-blue-500 text-xs" title="Verified Software Engineer" />
                <span className="text-slate-400 dark:text-slate-500">|</span>
                <span className="font-extrabold tracking-wider text-slate-900 dark:text-white font-mono text-[10px]">
                  {companyName}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Live Telemetry & Security Enclave */}
          <div className="flex flex-wrap items-center justify-center gap-2 font-medium text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{isRTL ? 'کلاؤڈ ڈیٹا بیس سنکڈ' : 'PostgreSQL Cloud Synced'}</span>
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <MdShield size={12} className="text-blue-500" />
              <span>{isRTL ? '256-بٹ ایس ایس ایل محفوظ' : '256-Bit SSL Enclave'}</span>
            </span>
          </div>

          {/* Right: Direct Developer Hotline & WhatsApp Actions */}
          <div className="flex items-center gap-2.5">
            {/* Phone Call */}
            <a
              href={`tel:${phoneIntl}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs border border-slate-200 dark:border-slate-700 transition duration-150 shadow-2xs cursor-pointer"
              title="Call Developer Support Hotline"
            >
              <MdPhone size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>{phoneFormatted}</span>
            </a>
          </div>

        </div>

        {/* Bottom Sub-strip (Pure Copyright & Build Telemetry, Zero Buttons) */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <span>© {currentYear}</span>
            <strong className="text-slate-800 dark:text-slate-200 font-bold">{companyName}</strong>
            <span>by</span>
            <strong className="text-blue-600 dark:text-blue-400 font-bold">{developerName}</strong>.
            <span>{isRTL ? 'جملہ حقوق محفوظ ہیں۔' : 'All rights reserved.'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-400">
              v1.3.9 • {isRTL ? 'محفوظ کاروباری کلاؤڈ نظام' : 'Mission-Critical Cloud Infrastructure'}
            </span>
          </div>
        </div>
      </footer>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // THEME 2 DESIGN: SLEEK EXECUTIVE COMMAND STRIP (Amal Dark High-Density)
  // ══════════════════════════════════════════════════════════════════════
  return (
    <footer
      className={`print:hidden ${containerClasses} bg-[#161618]/95 backdrop-blur-xl px-4 py-3 md:px-6 2xl:px-8 transition-all duration-200 text-xs text-slate-200 relative z-20`}
    >
      <div className="mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        
        {/* Left: Terminal Prompt Pill & Client/Developer Tag */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-emerald-400 font-mono text-[10px] font-bold border border-white/5">
            <LuTerminal size={11} />
            <span>ZAC_PORTAL</span>
          </span>

          <span className="font-extrabold text-white font-cinzel tracking-tight">
            {clientName}
          </span>

          <span className="text-neutral-600">|</span>

          <div className="inline-flex items-center gap-1.5 text-neutral-300 text-[10.5px]">
            <span>Engineered by</span>
            <strong className="text-blue-400 font-mono font-bold">{companyName}</strong>
            <span className="text-neutral-500">•</span>
            <strong className="text-neutral-100 font-semibold">{developerName}</strong>
          </div>
        </div>

        {/* Center: High-Density Telemetry Chips */}
        <div className="flex items-center gap-2.5 font-mono text-[10px] text-neutral-400">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>CLOUD SYNCED</span>
          </span>
          <span className="text-neutral-700">•</span>
          <span className="inline-flex items-center gap-1 text-neutral-300">
            <MdShield size={11} className="text-cyan-400" />
            <span>256-BIT SSL</span>
          </span>
          <span className="text-neutral-700">•</span>
          <span className="text-neutral-500">v1.3.9</span>
        </div>

        {/* Right: Hotline Action Strip */}
        <div className="flex items-center gap-2">
          <a
            href={`tel:${phoneIntl}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10 font-mono font-bold text-[11px] transition cursor-pointer"
            title="Call Developer Support"
          >
            <MdPhone size={12} className="text-emerald-400" />
            <span>{phoneFormatted}</span>
          </a>
        </div>

      </div>

      {/* Micro Copyright Strip */}
      <div className="mt-2 pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[9.5px] text-neutral-500 gap-1.5">
        <div>
          <span>© {currentYear} </span>
          <strong className="text-neutral-400">{companyName}</strong>
          <span> by {developerName}. All rights reserved.</span>
        </div>
        <div className="text-neutral-600 font-mono text-[9px]">
          Mission-Critical High-Availability Database
        </div>
      </div>
    </footer>
  );
};

export default Footer;
