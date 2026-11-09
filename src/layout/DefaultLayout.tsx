import React, { useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header/index';
import Sidebar from '../components/Sidebar/index';
import Footer from '../components/Footer/index';
import { getSidebarBehaviorMode, getMasterThemePreset, MasterThemePreset } from '../constant/themeConfig';

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isSettingsPage = /(^|\/)settings\/?$/i.test(location.pathname);
  const [masterPreset, setMasterPreset] = useState<MasterThemePreset>(() => getMasterThemePreset());

  useEffect(() => {
    const updatePreset = () => setMasterPreset(getMasterThemePreset());
    window.addEventListener('al_muhammad_theme_preset_changed', updatePreset);
    window.addEventListener('storage', updatePreset);
    return () => {
      window.removeEventListener('al_muhammad_theme_preset_changed', updatePreset);
      window.removeEventListener('storage', updatePreset);
    };
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const behavior = getSidebarBehaviorMode();
      if (behavior === 'closed') {
        return false;
      }
      const saved = localStorage.getItem('sidebar_expanded');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.innerWidth > 750;
    }
    return false;
  });

  const handleSetSidebarOpen = (arg: boolean | ((prev: boolean) => boolean)) => {
    setSidebarOpen((prev) => {
      const nextVal = typeof arg === 'function' ? arg(prev) : arg;
      if (typeof window !== 'undefined' && window.innerWidth > 750) {
        localStorage.setItem('sidebar_expanded', String(nextVal));
      }
      return nextVal;
    });
  };

  useEffect(() => {
    const handleBehaviorChange = () => {
      const behavior = getSidebarBehaviorMode();
      if (behavior === 'closed') {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('al_muhammad_sidebar_behavior_changed', handleBehaviorChange);
    return () => window.removeEventListener('al_muhammad_sidebar_behavior_changed', handleBehaviorChange);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 750) {
        setSidebarOpen(false);
      } else {
        const saved = localStorage.getItem('sidebar_expanded');
        if (saved !== null) {
          setSidebarOpen(saved === 'true');
        } else {
          setSidebarOpen(true);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-700 dark:text-slate-200 min-h-screen font-sans selection:bg-emerald-600 selection:text-white">
      <div className="flex h-screen overflow-hidden relative w-full">
        
        {/* Hide Main ERP Sidebar when in Settings page */}
        {!isSettingsPage && (
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={handleSetSidebarOpen} />
        )}

        {/* Content Column: Fixed Header on top, scrollable content underneath */}
        <div className="relative flex flex-1 flex-col h-screen overflow-hidden duration-300 ease-in-out w-full min-w-0">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={handleSetSidebarOpen} />

          <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden w-full">
            <main className="flex-1 bg-[#F8FAFC] dark:bg-[#0B0F17] w-full relative pb-4">
              {/* Subtle top ambient emerald glow */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-emerald-500/5 via-teal-500/5 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent" />
              
              <div className={`relative mx-auto p-4 md:p-6 2xl:p-8 w-full ${
                masterPreset === 'nht-2' ? 'w-full max-w-full 2xl:max-w-full px-4 md:px-8 2xl:px-12' : 'max-w-screen-2xl'
              }`}>
                {children}
              </div>
            </main>

            <Footer />
          </div>
        </div>

      </div>
    </div>
  );
};

export default DefaultLayout;
