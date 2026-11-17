import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LuSlidersHorizontal } from 'react-icons/lu';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import { getBrandConfig } from '../../utils/brand';
import {
  PRESET_THEME_COLORS,
  getSavedAccentColor,
  getContrastTextColor,
  isDarkModeActive,
} from '../../constant/themeConfig';
import { fetchSystemMasterConfig, SystemMasterConfig } from '../../utils/systemPermissions';

import { ProfileTab } from './tabs/ProfileTab';
import { ThemeTab } from './tabs/ThemeTab';
import { CreditLimitsTab } from './tabs/CreditLimitsTab';
import { SoundEffectsTab } from './tabs/SoundEffectsTab';
import { BackupTab } from './tabs/BackupTab';
import { SecurityDevicesTab } from './tabs/SecurityDevicesTab';
import { FactoryResetTab } from './tabs/FactoryResetTab';
import WorkflowSettingsTab from './WorkflowSettingsTab';

const SettingsPage: React.FC = () => {
  const { userEmail, role, businessName, tenantId } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const searchTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTabState] = useState<string>(searchTab || 'profile');
  const [systemConfig, setSystemConfig] = useState<SystemMasterConfig | null>(null);
  const [appliedAccentColor, setAppliedAccentColor] = useState<string>(getSavedAccentColor());
  const [masterThemePreset, setMasterThemePreset] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('jakwani_master_theme_preset') || 'custom' : 'custom';
  });

  const setActiveTab = (tabId: string) => {
    setActiveTabState(tabId);
    const newParams = new URLSearchParams(location.search);
    newParams.set('tab', tabId);
    navigate(`?${newParams.toString()}`, { replace: true });
    window.dispatchEvent(new CustomEvent('jakwani_settings_tab_changed', { detail: tabId }));
  };

  useEffect(() => {
    const p = new URLSearchParams(location.search).get('tab') || 'profile';
    if (p !== activeTab) setActiveTabState(p);
  }, [location.search]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('jakwani_settings_tab_changed', { detail: activeTab }));
  }, [activeTab]);

  useEffect(() => {
    const handleSettingsTabChange = (e: any) => {
      if (e.detail && e.detail !== activeTab) {
        setActiveTabState(e.detail);
      }
    };
    window.addEventListener('jakwani_settings_tab_changed', handleSettingsTabChange);
    return () => window.removeEventListener('jakwani_settings_tab_changed', handleSettingsTabChange);
  }, [activeTab]);

  // Keyboard Shortcut: Shift + Left / Right Arrow to cycle between Settings Tabs
  useEffect(() => {
    const tabOrder = ['profile', 'security_devices', 'theme', 'stock_control', 'credit_limits', 'sound_effects', 'backup'];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.shiftKey) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInput) return;

      e.preventDefault();

      const currentIndex = tabOrder.indexOf(activeTab);
      const total = tabOrder.length;
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % total;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + total) % total;
      }

      setActiveTab(tabOrder[nextIndex]);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Sync Master Permissions and colors
  useEffect(() => {
    fetchSystemMasterConfig().then(setSystemConfig);

    const syncColors = () => {
      setAppliedAccentColor(getSavedAccentColor());
      setMasterThemePreset(localStorage.getItem('jakwani_master_theme_preset') || 'custom');
    };

    window.addEventListener('uzair_jibran_theme_color_changed', syncColors);
    window.addEventListener('jakwani_master_theme_preset_changed', syncColors);
    return () => {
      window.removeEventListener('uzair_jibran_theme_color_changed', syncColors);
      window.removeEventListener('jakwani_master_theme_preset_changed', syncColors);
    };
  }, []);

  const brand = getBrandConfig();
  const displayCompanyName = businessName || brand.name;
  const displayEmail = userEmail || brand.adminEmail;
  const displayRole = role || 'Super Admin';
  const portalName = brand.portalName;
  const portalCode = brand.code;

  const activeAppliedPreset = PRESET_THEME_COLORS.find(
    (c) => c.hex.toLowerCase() === appliedAccentColor.toLowerCase()
  );

  return (
    <div className={`mx-auto ${activeTab === 'theme' ? 'w-full px-2 sm:px-4 pt-1 pb-2' : 'max-w-7xl px-4 py-6 sm:px-6 lg:px-8'} animate-fadeIn`}>
      {/* Top Page Header (Hidden when on Theme & Appearance tab) */}
      {activeTab !== 'theme' && (
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <LuSlidersHorizontal size={14} className="text-primary" />
              <span>Application Preferences</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1 flex flex-wrap items-center gap-2">
              <span>Settings</span>
              <span className="text-slate-300 dark:text-slate-700 font-light">/</span>
              <span className="text-primary font-bold text-xl sm:text-2xl">
                {activeTab === 'profile' && (isRTL ? 'پروفائل' : 'Profile')}
                {activeTab === 'security_devices' && (isRTL ? 'لاگ ان ڈیوائسز اور سیکیورٹی' : 'Login Devices & Security')}
                {activeTab === 'credit_limits' && (isRTL ? 'کسٹمر کریڈٹ لمٹس' : 'Customer Credit Limits')}
                {(activeTab === 'sound_effects' || activeTab === 'pos_sound') && (isRTL ? 'آواز اور آڈیو اثرات' : 'Audio & Sound Effects')}
                {activeTab === 'backup' && (isRTL ? 'ڈیٹا بیک اپ اور ایکسپورٹ' : 'Data Backup & Export')}
                {(activeTab === 'workflow_logistics' || activeTab === 'stock_control') && (isRTL ? 'گیٹ پاس اور ورک فلو' : 'Gate Pass & Logistics Workflow')}
                {activeTab === 'alm_factory_reset' && (isRTL ? 'فیکٹری ری سیٹ' : 'Factory Reset ERP')}
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your account credentials, primary brand colors, and portal appearance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs font-semibold">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs border border-slate-300 dark:border-slate-600"
                style={{ backgroundColor: appliedAccentColor }}
              />
              <span className="text-slate-700 dark:text-slate-200">
                {masterThemePreset === 'nht-1' ? 'NHT Theme 1 Active' : masterThemePreset === 'nht-2' ? 'NHT Theme 2 Active' : activeAppliedPreset ? activeAppliedPreset.name : 'Custom Active'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Settings Content Area */}
      <div className="w-full min-w-0">
        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <ProfileTab
            portalCode={portalCode}
            displayCompanyName={displayCompanyName}
            appliedAccentColor={appliedAccentColor}
            displayRole={displayRole}
            displayEmail={displayEmail}
            portalName={portalName}
            isRTL={isRTL}
            onNavigateToSecurityDevices={() => setActiveTab('security_devices')}
            getContrastTextColor={getContrastTextColor}
            isDarkModeActive={isDarkModeActive}
          />
        )}

        {/* TAB 2: THEME & APPEARANCE */}
        {activeTab === 'theme' && (
          <ThemeTab isRTL={isRTL} />
        )}

        {/* TAB 3: CUSTOMER CREDIT LIMITS */}
        {activeTab === 'credit_limits' && (
          <CreditLimitsTab
            userEmail={userEmail}
            role={role}
            systemConfig={systemConfig}
            isRTL={isRTL}
          />
        )}

        {/* TAB 4: AUDIO & SOUND EFFECTS */}
        {(activeTab === 'sound_effects' || activeTab === 'pos_sound') && (
          <SoundEffectsTab
            userEmail={userEmail}
            isRTL={isRTL}
            initialSubTab={activeTab === 'pos_sound' ? 'pos' : 'system'}
            onSubTabChange={(st) => setActiveTab(st === 'pos' ? 'pos_sound' : 'sound_effects')}
          />
        )}

        {/* TAB 5: DATA BACKUP & EXPORT */}
        {activeTab === 'backup' && (
          <BackupTab
            userEmail={userEmail}
            role={role}
            businessName={businessName}
            systemConfig={systemConfig}
            isRTL={isRTL}
          />
        )}

        {/* TAB 6: SECURITY & LOGIN DEVICES */}
        {activeTab === 'security_devices' && (
          <SecurityDevicesTab
            userEmail={userEmail}
            tenantId={tenantId}
            displayRole={displayRole}
            isRTL={isRTL}
          />
        )}

        {/* TAB 7: WORKFLOW & GATE PASS LOGISTICS / INVENTORY & STOCK GOVERNANCE */}
        {(activeTab === 'workflow_logistics' || activeTab === 'stock_control') && (
          <WorkflowSettingsTab isRTL={isRTL} />
        )}

        {/* TAB 8: AL MUHAMMADI FACTORY RESET ERP */}
        {activeTab === 'alm_factory_reset' && (
          <FactoryResetTab
            userEmail={userEmail}
            systemConfig={systemConfig}
            isRTL={isRTL}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
