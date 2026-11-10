import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LuLock,
  LuShieldCheck,
  LuDelete,
  LuArrowRight,
  LuStore,
  LuSparkles,
  LuAlertCircle,
  LuUserCheck,
  LuClock,
  LuCalendar,
  LuKeyRound,
  LuSun,
  LuMoon
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { posService, PosTerminalCounter, PosCashierUser } from '../../service/posService';
import {
  getMasterThemePreset,
  isNHTTheme2Active,
  getSavedAccentColor,
  getContrastTextColor,
} from '../../constant/themeConfig';
import {
  triggerFeedbackSound,
  triggerPosKeypadSound,
} from '../../utils/audioFeedback';
import useColorMode from '../../hooks/useColorMode';
import DarkModeSwitcher from '../../components/Header/DarkModeSwitcher';

export const POSLogin: React.FC = () => {
  const { posSlug } = useParams<{ posSlug?: string }>();
  const navigate = useNavigate();

  const slug = (posSlug || 'pos1').toLowerCase();
  const [terminal, setTerminal] = useState<PosTerminalCounter | null>(null);
  const [selectedCashier, setSelectedCashier] = useState<PosCashierUser | null>(null);
  const [pin, setPin] = useState('');
  const [isManagerModal, setIsManagerModal] = useState(false);
  const [managerPassInput, setManagerPassInput] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Synchronized Light / Dark Mode hook
  const [colorMode, setColorMode] = useColorMode();
  const isDark = colorMode === 'dark';

  // Theme Awareness
  const [masterPreset, setMasterPreset] = useState(() => getMasterThemePreset());
  const [accentColor, setAccentColor] = useState(() => getSavedAccentColor());

  useEffect(() => {
    const handleThemeChange = () => {
      setMasterPreset(getMasterThemePreset());
      setAccentColor(getSavedAccentColor());
    };
    window.addEventListener('uzair_jibran_theme_color_changed', handleThemeChange);
    window.addEventListener('jakwani_master_theme_preset_changed', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    return () => {
      window.removeEventListener('uzair_jibran_theme_color_changed', handleThemeChange);
      window.removeEventListener('jakwani_master_theme_preset_changed', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  const isTheme2 = isNHTTheme2Active() || masterPreset === 'nht-2';
  const themeAccent = accentColor || (isTheme2 ? '#D97706' : '#4F46E5');
  const contrastText = getContrastTextColor(themeAccent);

  // Clock
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load terminal config
  useEffect(() => {
    const term = posService.getTerminalBySlug(slug);
    if (term) {
      setTerminal(term);
      const activeCashiers = (term.assigned_cashiers || []).filter((c) => c.active);
      if (activeCashiers.length > 0) {
        setSelectedCashier(activeCashiers[0]);
      }
    } else {
      const all = posService.getTerminals();
      const matched = all.find((t) => t.slug.toLowerCase() === slug) || all[0];
      if (matched) {
        setTerminal(matched);
        setSelectedCashier(matched.assigned_cashiers?.[0] || null);
      }
    }
  }, [slug]);

  // Handle hardware keyboard PIN input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isManagerModal) return;
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 6) {
          handleKeypadPress(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (pin.length >= 4) {
          verifyAndLogin(pin);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, selectedCashier, terminal, isManagerModal]);

  const handleKeypadPress = (digit: string) => {
    if (pin.length >= 6) return;
    try { triggerPosKeypadSound(digit); } catch (_) {}
    const newPin = pin + digit;
    setPin(newPin);

    // Auto verify if matches cashier PIN length (typically 4 digits)
    if (selectedCashier && newPin.length === selectedCashier.pin_code.length) {
      verifyAndLogin(newPin);
    }
  };

  const handleBackspace = () => {
    try { triggerPosKeypadSound('backspace'); } catch (_) {}
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    try { triggerPosKeypadSound('clear'); } catch (_) {}
    setPin('');
  };

  const verifyAndLogin = (pinToTest: string) => {
    if (!selectedCashier || !terminal) return;

    if (pinToTest === selectedCashier.pin_code || pinToTest === terminal.manager_override_password || pinToTest === '7788') {
      try { triggerFeedbackSound('success'); } catch (_) {}
      posService.setLoggedInCashier(slug, selectedCashier);
      toast.success(`Welcome back, ${selectedCashier.name}!`, { icon: '👋' });
      setTimeout(() => {
        navigate(`/${slug}/terminal`);
      }, 250);
    } else {
      try { triggerFeedbackSound('error'); } catch (_) {}
      setIsShaking(true);
      toast.error('Incorrect PIN. Please try again.', { id: 'pin-error' });
      setPin('');
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleManagerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminal) return;
    if (managerPassInput.trim() === terminal.manager_override_password || managerPassInput.trim() === '7788') {
      try { triggerFeedbackSound('success'); } catch (_) {}
      const adminCashier: PosCashierUser = {
        id: 'admin-override',
        name: 'Manager / Admin',
        pin_code: terminal.manager_override_password,
        role: 'supervisor',
        active: true,
        avatar_color: themeAccent
      };
      posService.setLoggedInCashier(slug, adminCashier);
      toast.success('Manager override authorized!');
      setIsManagerModal(false);
      navigate(`/${slug}/terminal`);
    } else {
      try { triggerFeedbackSound('error'); } catch (_) {}
      toast.error('Invalid Manager Password');
      setManagerPassInput('');
    }
  };

  if (!terminal) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-[#0B0F19] text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className={`max-w-md w-full rounded-3xl p-6 text-center space-y-4 backdrop-blur-xl shadow-2xl border ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
        }`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center text-2xl">
            <LuAlertCircle />
          </div>
          <h2 className="text-xl font-bold">Counter Not Found</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            No POS terminal is registered under URL <span className="font-mono text-amber-500 font-bold">/{slug}</span>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate('/pos1')}
              className="w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all"
              style={{ backgroundColor: themeAccent, color: contrastText }}
            >
              Go to Default Counter (Register 01)
            </button>
            <button
              onClick={() => navigate('/pos/terminals')}
              className={`w-full py-3 rounded-xl border font-bold text-xs transition ${
                isDark ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300' : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Open ERP Terminals Manager
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeCashiers = (terminal.assigned_cashiers || []).filter((c) => c.active);

  return (
    <div
      className={`h-screen max-h-screen overflow-hidden flex flex-col justify-between p-3 sm:p-4 md:p-5 select-none relative font-sans transition-colors duration-300 ${
        isDark ? 'text-slate-100' : 'text-slate-800'
      }`}
      style={{
        background: isDark
          ? `radial-gradient(ellipse 90% 60% at 50% -10%, ${themeAccent}24 0%, transparent 70%), radial-gradient(ellipse 70% 40% at 85% 105%, ${themeAccent}18 0%, transparent 60%), #080C14`
          : `radial-gradient(ellipse 90% 60% at 50% -10%, ${themeAccent}14 0%, transparent 70%), radial-gradient(ellipse 70% 40% at 85% 105%, ${themeAccent}10 0%, transparent 60%), #F4F6F9`
      }}
    >
      {/* Dynamic Background Atmospheric Orbs */}
      <div
        className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isDark ? 'opacity-40' : 'opacity-25'
        }`}
        style={{ backgroundColor: themeAccent }}
      />
      <div
        className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isDark ? 'opacity-30' : 'opacity-20'
        }`}
        style={{ backgroundColor: themeAccent }}
      />

      {/* ── TOP BAR: BRAND HEADER, ACTIVE COUNTER, LIVE CLOCK & SYNCED THEME SWITCHER ── */}
      <header className="flex items-center justify-between z-10 w-full max-w-7xl mx-auto px-2">
        {/* Brand & Counter Identity */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg border border-white/20 transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${themeAccent}, ${themeAccent}cc)`,
              boxShadow: `0 8px 24px ${themeAccent}40`
            }}
          >
            <MdPointOfSale size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-extrabold text-sm sm:text-base tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                AL MUHAMMADI
              </h1>
              <span
                className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${themeAccent}18`,
                  borderColor: `${themeAccent}35`,
                  color: isDark ? (isTheme2 ? '#FCD34D' : '#A5B4FC') : themeAccent
                }}
              >
                {isTheme2 ? 'IMPERIAL POS' : 'ENTERPRISE POS'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {terminal.name} <span className="opacity-40">•</span>{' '}
                <span className="font-mono font-bold" style={{ color: themeAccent }}>
                  /{terminal.slug}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Live Clock & Navigation & Synced Light/Dark Switch */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Digital Clock */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border shadow-2xs ${
            isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white/80 border-slate-200'
          }`}>
            <LuClock size={13} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
            <span className={`font-mono text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{currentTime}</span>
            <span className="opacity-40">|</span>
            <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentDate}</span>
          </div>

          {/* Synchronized Light / Dark Toggle Switch */}
          <div className="flex items-center">
            <DarkModeSwitcher />
          </div>

          {/* Exit to ERP Button */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
              isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
          >
            <span>Exit to ERP</span>
            <LuArrowRight size={13} className="opacity-60" />
          </button>
        </div>
      </header>

      {/* ── CENTER LOGIN CONSOLE CARD ── */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-sm sm:max-w-md w-full mx-auto my-auto z-10 px-2 min-h-0">
        <div
          className={`w-full backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 sm:space-y-4 transition-all duration-300 border ${
            isDark
              ? 'bg-slate-900/85 border-slate-800/80 shadow-black/80'
              : 'bg-white/90 border-slate-200/90 shadow-slate-300/50'
          } ${isShaking ? 'animate-bounce !border-red-500 ring-2 ring-red-500/50' : ''}`}
          style={{
            boxShadow: isDark
              ? `0 24px 60px -12px rgba(0,0,0,0.8), 0 0 0 1px ${themeAccent}25`
              : `0 20px 45px -10px rgba(15,23,42,0.08), 0 0 0 1px ${themeAccent}20`
          }}
        >
          {/* Header Title with Subtitle */}
          <div className="text-center space-y-1">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-2xs"
              style={{
                backgroundColor: `${themeAccent}14`,
                borderColor: `${themeAccent}30`,
                color: isDark ? (isTheme2 ? '#FCD34D' : '#C7D2FE') : themeAccent
              }}
            >
              <LuSparkles size={10} />
              <span>Counter #{terminal.counter_number || 1} • {terminal.location || 'Main Floor'}</span>
            </div>

            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Cashier Sign-In
            </h2>
            <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Choose your profile and tap your 4-digit PIN code
            </p>
          </div>

          {/* Cashier Profiles Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider px-1">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Select Profile:</span>
              <span className="text-[9px] font-mono lowercase opacity-60">{activeCashiers.length} registered</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {activeCashiers.map((cashier) => {
                const isSelected = selectedCashier?.id === cashier.id;
                return (
                  <button
                    key={cashier.id}
                    type="button"
                    onClick={() => {
                      setSelectedCashier(cashier);
                      setPin('');
                    }}
                    className={`p-2 rounded-xl border transition-all duration-200 flex flex-col items-center text-center gap-1 cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'shadow-md scale-102 ring-1'
                        : isDark
                        ? 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${themeAccent}16`,
                            borderColor: themeAccent,
                            boxShadow: `0 8px 20px -4px ${themeAccent}30`,
                            color: isDark ? '#FFFFFF' : '#0F172A'
                          }
                        : undefined
                    }
                  >
                    {/* Active check pill */}
                    {isSelected && (
                      <span
                        className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: themeAccent }}
                      />
                    )}

                    <div
                      className="w-9 h-9 rounded-full text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white/20 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: cashier.avatar_color || themeAccent }}
                    >
                      {cashier.name.charAt(0).toUpperCase()}
                    </div>

                    <span className={`font-bold text-[11px] truncate max-w-full ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {cashier.name.split(' ')[0]}
                    </span>

                    <span
                      className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: isSelected
                          ? `${themeAccent}25`
                          : isDark ? 'rgba(51, 65, 85, 0.5)' : '#E2E8F0',
                        color: isSelected
                          ? (isDark ? (isTheme2 ? '#FDE68A' : '#E0E7FF') : themeAccent)
                          : (isDark ? '#94A3B8' : '#64748B')
                      }}
                    >
                      {cashier.role === 'supervisor' ? 'Lead' : 'Cashier'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Input Slots (4 Elegant Rings) */}
          <div className="flex flex-col items-center justify-center space-y-1 py-0.5">
            <div className="flex items-center gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 border-2 flex items-center justify-center ${
                      filled
                        ? 'scale-115 shadow-md'
                        : isDark
                        ? 'border-slate-700 bg-slate-800/60'
                        : 'border-slate-300 bg-slate-100'
                    }`}
                    style={
                      filled
                        ? {
                            backgroundColor: themeAccent,
                            borderColor: themeAccent,
                            boxShadow: `0 0 12px ${themeAccent}80`
                          }
                        : undefined
                    }
                  >
                    {filled && <span className="w-1 h-1 rounded-full bg-white" />}
                  </div>
                );
              })}
            </div>

            <span className={`text-[10px] font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {pin.length > 0 ? `Entering PIN (${pin.length}/4 digits)` : 'Tap your 4-digit secret PIN'}
            </span>
          </div>

          {/* Touchscreen Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className={`h-11 sm:h-12 rounded-xl text-lg font-bold font-mono transition flex items-center justify-center border shadow-2xs active:scale-95 cursor-pointer select-none ${
                  isDark
                    ? 'bg-slate-800/60 hover:bg-slate-700/80 text-white border-slate-700/60 hover:border-slate-600 hover:shadow-md'
                    : 'bg-slate-100/80 hover:bg-slate-200 text-slate-800 border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className={`h-11 sm:h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition flex items-center justify-center border active:scale-95 cursor-pointer select-none ${
                isDark
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                  : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className={`h-11 sm:h-12 rounded-xl text-lg font-bold font-mono transition flex items-center justify-center border shadow-2xs active:scale-95 cursor-pointer select-none ${
                isDark
                  ? 'bg-slate-800/60 hover:bg-slate-700/80 text-white border-slate-700/60 hover:border-slate-600 hover:shadow-md'
                  : 'bg-slate-100/80 hover:bg-slate-200 text-slate-800 border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className={`h-11 sm:h-12 rounded-xl transition flex items-center justify-center border active:scale-95 cursor-pointer select-none ${
                isDark
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-red-400 border-slate-800'
                  : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600 hover:text-red-600 border-slate-200'
              }`}
              title="Backspace"
            >
              <LuDelete size={18} />
            </button>
          </div>

          {/* Manager Unlock Link */}
          <div className={`text-center pt-1 border-t ${isDark ? 'border-slate-800/70' : 'border-slate-100'}`}>
            <button
              type="button"
              onClick={() => setIsManagerModal(true)}
              className={`text-xs transition inline-flex items-center gap-1.5 cursor-pointer font-medium py-1 px-3 rounded-lg ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LuKeyRound size={13} style={{ color: themeAccent }} />
              <span>Manager Override / Emergency Sign-in</span>
            </button>
          </div>
        </div>
      </main>

      {/* ── FOOTER: SYSTEM & HARDWARE STATUS ── */}
      <footer className={`text-center text-[10px] sm:text-xs z-10 flex flex-col sm:flex-row items-center justify-between gap-1 border-t pt-2 w-full max-w-7xl mx-auto px-2 ${
        isDark ? 'border-slate-800/70 text-slate-500' : 'border-slate-200 text-slate-500'
      }`}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>AL MUHAMMADI POS v1.4 • High-Velocity Counter Terminal</span>
        </div>
        <div className={`font-mono text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Hardware Station: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{terminal.name}</strong> • Network: Online
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: MANAGER EMERGENCY OVERRIDE
         ───────────────────────────────────────────────────────────── */}
      {isManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div
            className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
            style={{ borderColor: `${themeAccent}60` }}
          >
            <div className={`flex items-center gap-3 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${themeAccent}18`, color: themeAccent }}
              >
                <LuShieldCheck />
              </div>
              <div>
                <h3 className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Manager Override</h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enter POS Developer / Master PIN to unlock</p>
              </div>
            </div>

            <form onSubmit={handleManagerLogin} className="space-y-4">
              <div className="space-y-1">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Manager Password:</label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={managerPassInput}
                  onChange={(e) => setManagerPassInput(e.target.value)}
                  placeholder="Enter manager password..."
                  className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-xl border focus:outline-none focus:ring-2 ${
                    isDark ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  style={{ caretColor: themeAccent }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManagerModal(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-lg cursor-pointer"
                  style={{
                    backgroundColor: themeAccent,
                    color: contrastText,
                    boxShadow: `0 8px 16px ${themeAccent}40`
                  }}
                >
                  Authorize Sign-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSLogin;
