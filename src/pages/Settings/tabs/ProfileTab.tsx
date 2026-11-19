import React, { useState, useEffect } from 'react';
import { LuMail, LuBuilding2, LuShieldCheck, LuReceipt, LuSave, LuFileText } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import {
  SystemMasterConfig,
  saveSystemMasterConfig,
  fetchSystemMasterConfig
} from '../../../utils/systemPermissions';

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
  systemConfig?: SystemMasterConfig | null;
  onUpdateSystemConfig?: (cfg: SystemMasterConfig) => void;
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
  systemConfig,
  onUpdateSystemConfig,
}) => {
  const [ntn, setNtn] = useState<string>(systemConfig?.company_ntn || '');
  const [strn, setStrn] = useState<string>(systemConfig?.company_strn || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (systemConfig) {
      if (systemConfig.company_ntn !== undefined) setNtn(systemConfig.company_ntn);
      if (systemConfig.company_strn !== undefined) setStrn(systemConfig.company_strn);
    }
  }, [systemConfig]);

  const handleSaveTaxIdentifiers = async () => {
    try {
      setIsSaving(true);
      const currentConfig = systemConfig || (await fetchSystemMasterConfig());
      const updatedConfig: SystemMasterConfig = {
        ...currentConfig,
        company_ntn: ntn.trim(),
        company_strn: strn.trim()
      };
      await saveSystemMasterConfig(updatedConfig);
      if (onUpdateSystemConfig) {
        onUpdateSystemConfig(updatedConfig);
      }
      window.dispatchEvent(new CustomEvent('erp_system_permissions_updated', { detail: updatedConfig }));
      toast.success(
        isRTL
          ? "ٹیکس اور تجارتی نمبر کامیابی سے محفوظ ہو گئے!"
          : "Tax identifiers saved! Synced with all custom report print headers."
      );
    } catch (err: any) {
      toast.error('Failed to save tax identifiers: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

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

      {/* Official Tax & Commercial Registration Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <LuFileText className="text-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isRTL ? "ٹیکس اور کمرشل رجسٹریشن" : "Official Tax & Commercial Registration"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRTL
                  ? "یہ نمبرز کسٹم رپورٹ ہیڈرز اور پرنٹ آؤٹس پر ظاہر ہوں گے جب فعال کیا جائے"
                  : "These identifiers automatically print in Custom Report Headers & statements when enabled"}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 shrink-0 self-start sm:self-auto">
            <LuReceipt size={14} />
            <span>Synced to Reports Studio</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* NTN Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              {isRTL ? "قومی ٹیکس نمبر (NTN)" : "National Tax Number (NTN)"}
            </label>
            <input
              type="text"
              value={ntn}
              onChange={(e) => setNtn(e.target.value)}
              placeholder="e.g. 7392014-9"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-[10px] text-slate-400 block font-mono">
              Format: 7 digits with check-digit (e.g. 7392014-9)
            </span>
          </div>

          {/* STRN / Sales Tax */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              {isRTL ? "سیلز ٹیکس رجسٹریشن نمبر (STRN / Sales Tax)" : "Sales Tax Registration # (STRN / GST)"}
            </label>
            <input
              type="text"
              value={strn}
              onChange={(e) => setStrn(e.target.value)}
              placeholder="e.g. 32-77-8761-234-56"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-[10px] text-slate-400 block font-mono">
              Format: Official sales tax registration (e.g. 32-77-8761-234-56)
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {systemConfig?.company_ntn || systemConfig?.company_strn ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                ✓ Currently configured: {systemConfig.company_ntn ? `NTN: ${systemConfig.company_ntn}` : ''}{' '}
                {systemConfig.company_ntn && systemConfig.company_strn ? '• ' : ''}
                {systemConfig.company_strn ? `STRN: ${systemConfig.company_strn}` : ''}
              </span>
            ) : (
              <span>No custom tax numbers saved yet (using system default demo values).</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveTaxIdentifiers}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-md transition cursor-pointer disabled:opacity-60 shrink-0 self-end sm:self-auto"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <LuSave size={15} />
                <span>Save Tax Identifiers</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
