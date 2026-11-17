import React from 'react';
import { LuMail, LuBuilding2, LuShieldCheck } from 'react-icons/lu';

interface ProfileTabProps {
  portalCode: string;
  displayCompanyName: string;
  appliedAccentColor: string;
  displayRole: string;
  displayEmail: string;
  portalName: string;
  isRTL?: boolean;
  onNavigateToSecurityDevices: () => void;
  getContrastTextColor: (hex: string) => string;
  isDarkModeActive: () => boolean;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  portalCode,
  displayCompanyName,
  appliedAccentColor,
  displayRole,
  displayEmail,
  portalName,
  isRTL = false,
  onNavigateToSecurityDevices,
  getContrastTextColor,
  isDarkModeActive,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Profile Card Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div
            className="w-18 h-18 rounded-2xl flex items-center justify-center text-2xl font-black shadow-md border-2 border-slate-200 dark:border-slate-700 shrink-0"
            style={{
              backgroundColor: appliedAccentColor,
              color: getContrastTextColor(appliedAccentColor),
            }}
          >
            {portalCode}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                {displayCompanyName}
              </h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor:
                    getContrastTextColor(appliedAccentColor) === '#0F172A' && !isDarkModeActive()
                      ? '#F1F5F9'
                      : `${appliedAccentColor}1A`,
                  color:
                    getContrastTextColor(appliedAccentColor) === '#0F172A' && !isDarkModeActive()
                      ? '#0F172A'
                      : appliedAccentColor,
                  border:
                    getContrastTextColor(appliedAccentColor) === '#0F172A' && !isDarkModeActive()
                      ? '1px solid #CBD5E1'
                      : undefined,
                }}
              >
                {displayRole}
              </span>
              <button
                type="button"
                onClick={onNavigateToSecurityDevices}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition cursor-pointer"
                title="View connected login devices and session security"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isRTL ? "فعال سیشن • ڈیوائسز کا انتظام ←" : "Active Session • Manage Devices →"}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <LuMail size={13} className="shrink-0" />
              <span>{displayEmail}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Account & Organization Details */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
          <LuBuilding2 className="text-primary text-lg" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isRTL ? "تنظیم اور کھاتہ کی معلومات" : "Organization & Account Information"}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              {isRTL ? "کمپنی / ادارے کا نام" : "Company / Organization Name"}
            </span>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
              {displayCompanyName}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              {isRTL ? "لاگ ان ای میل ایڈریس" : "Login Email Address"}
            </span>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
              {displayEmail}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              {isRTL ? "سیکیورٹی لیول اور رسائی کا کردار" : "Security Level & Access Role"}
            </span>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1.5">
              <LuShieldCheck className="text-primary" />
              <span>{displayRole} {isRTL ? "(مکمل اختیارات)" : "(Full Permissions)"}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              {isRTL ? "پورٹل انسٹینس" : "Portal Instance"}
            </span>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary border border-slate-300 dark:border-slate-600 shrink-0" />
              <span>{portalName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
