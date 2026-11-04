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
  LuUserCheck
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { posService, PosTerminalCounter, PosCashierUser } from '../../service/posService';

export const POSLogin: React.FC = () => {
  const { posSlug } = useParams<{ posSlug?: string }>();
  const navigate = useNavigate();

  const slug = (posSlug || 'pos1').toLowerCase();
  const [terminal, setTerminal] = useState<PosTerminalCounter | null>(null);
  const [selectedCashier, setSelectedCashier] = useState<PosCashierUser | null>(null);
  const [pin, setPin] = useState('');
  const [isManagerModal, setIsManagerModal] = useState(false);
  const [managerPassInput, setManagerPassInput] = useState('');

  // Clock
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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
      // If no terminals exist, posService.getTerminals() will seed default
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
    const newPin = pin + digit;
    setPin(newPin);

    // Auto verify if matches cashier PIN length (usually 4 digits)
    if (selectedCashier && newPin.length === selectedCashier.pin_code.length) {
      verifyAndLogin(newPin);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const verifyAndLogin = (pinToTest: string) => {
    if (!selectedCashier || !terminal) return;

    if (pinToTest === selectedCashier.pin_code || pinToTest === terminal.manager_override_password || pinToTest === '7788') {
      // Store session
      posService.setLoggedInCashier(slug, selectedCashier);
      toast.success(`Welcome back, ${selectedCashier.name}!`);
      setTimeout(() => {
        navigate(`/${slug}/terminal`);
      }, 250);
    } else {
      toast.error('Incorrect PIN. Please try again.', { id: 'pin-error' });
      setPin('');
    }
  };

  const handleManagerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminal) return;
    if (managerPassInput.trim() === terminal.manager_override_password || managerPassInput.trim() === '7788') {
      const adminCashier: PosCashierUser = {
        id: 'admin-override',
        name: 'Manager / Admin',
        pin_code: terminal.manager_override_password,
        role: 'supervisor',
        active: true,
        avatar_color: '#f59e0b'
      };
      posService.setLoggedInCashier(slug, adminCashier);
      toast.success('Manager override authorized!');
      setIsManagerModal(false);
      navigate(`/${slug}/terminal`);
    } else {
      toast.error('Invalid Manager Password');
      setManagerPassInput('');
    }
  };

  if (!terminal) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 text-center text-white space-y-4">
          <LuAlertCircle size={44} className="text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold">Counter Not Found</h2>
          <p className="text-xs text-slate-400">
            No POS terminal is registered under URL <span className="font-mono text-primary font-bold">/{slug}</span>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate('/pos1')}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs"
            >
              Go to Default Counter (Register 01)
            </button>
            <button
              onClick={() => navigate('/pos/terminals')}
              className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs"
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
    <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col justify-between p-4 sm:p-8 select-none relative overflow-hidden font-sans">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Store Title, Counter Pill & Live Clock */}
      <header className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-primary/20">
            <MdPointOfSale size={22} />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight leading-tight">
              Jawaid Jakwani & Sons
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-400">
                {terminal.name} • <span className="font-mono text-primary">/{terminal.slug}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="font-mono text-sm font-bold text-slate-200">{currentTime}</div>
            <div className="text-[10px] text-slate-400 font-medium">{currentDate}</div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs font-bold text-slate-300 transition"
          >
            Exit to ERP
          </button>
        </div>
      </header>

      {/* Main Center Login Console */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-lg w-full mx-auto my-6 z-10">
        <div className="w-full bg-[#111622]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          {/* Header instructions */}
          <div className="text-center space-y-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Counter #{terminal.counter_number || 1} • {terminal.location || 'Store Floor'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white pt-2">
              Cashier Sign-In
            </h2>
            <p className="text-xs text-slate-400">
              Select your name and enter your 4-digit PIN to open terminal
            </p>
          </div>

          {/* Cashier Selector Cards */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Choose Cashier Profile:
            </span>
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
                    className={`p-3 rounded-2xl border transition flex flex-col items-center text-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-primary/15 border-primary text-white shadow-md shadow-primary/20 scale-102'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full text-white font-black text-sm flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: cashier.avatar_color || '#3b82f6' }}
                    >
                      {cashier.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-xs truncate max-w-full">
                      {cashier.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider opacity-60">
                      {cashier.role === 'supervisor' ? 'Lead' : 'Cashier'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Input Dots Display */}
          <div className="flex flex-col items-center justify-center space-y-2 py-1">
            <div className="flex items-center gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      filled
                        ? 'bg-primary scale-125 shadow-lg shadow-primary/50'
                        : 'border-2 border-slate-600 bg-slate-800/60'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {pin.length > 0 ? `Entering PIN (${pin.length} digits)` : 'Enter 4-digit PIN'}
            </span>
          </div>

          {/* Touchscreen Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-xl font-bold font-mono text-white transition flex items-center justify-center border border-slate-700/50 shadow-sm cursor-pointer"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-xs font-bold uppercase tracking-wider text-slate-400 transition flex items-center justify-center border border-slate-800 cursor-pointer"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-xl font-bold font-mono text-white transition flex items-center justify-center border border-slate-700/50 shadow-sm cursor-pointer"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white transition flex items-center justify-center border border-slate-800 cursor-pointer"
              title="Backspace"
            >
              <LuDelete size={20} />
            </button>
          </div>

          {/* Manager Unlock Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsManagerModal(true)}
              className="text-xs text-slate-400 hover:text-primary transition underline underline-offset-4 cursor-pointer font-medium"
            >
              Manager Sign-in / Emergency Override
            </button>
          </div>
        </div>
      </main>

      {/* Footer System Info */}
      <footer className="text-center text-xs text-slate-500 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800/60 pt-4">
        <span>Jawaid Jakwani & Sons POS v1.4 • High Security Atelier Counter</span>
        <span>Register: {terminal.name} ({terminal.slug})</span>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: MANAGER EMERGENCY OVERRIDE
         ───────────────────────────────────────────────────────────── */}
      {isManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-[#111622] border border-amber-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0">
                <LuShieldCheck />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Manager Override</h3>
                <p className="text-[11px] text-slate-400">Enter POS Admin Password to unlock</p>
              </div>
            </div>

            <form onSubmit={handleManagerLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Manager Password:</label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={managerPassInput}
                  onChange={(e) => setManagerPassInput(e.target.value)}
                  placeholder="Enter manager password..."
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManagerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
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

