import React, { useState, useEffect } from 'react';
import {
  LuVolume2,
  LuVolumeX,
  LuKeyboard,
  LuSparkles,
  LuCheck,
  LuPlay,
  LuDelete,
  LuRadio,
  LuShieldCheck,
  LuCreditCard,
  LuCpu,
  LuWrench
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import {
  POS_SOUNDPACKS,
  PosSoundPackOption,
  getSavedPosSoundPack,
  setSavedPosSoundPack,
  isPosKeypadAudioEnabled,
  setPosKeypadAudioEnabled,
  triggerPosKeypadSound,
  soundEngine
} from '../../utils/audioFeedback';

interface Props {
  isRTL?: boolean;
  accentColorClass?: string;
}

export const POSSoundSettingsTab: React.FC<Props> = ({ isRTL = false, accentColorClass = 'text-primary' }) => {
  const [enabled, setEnabled] = useState(() => isPosKeypadAudioEnabled());
  const [activePackId, setActivePackId] = useState(() => getSavedPosSoundPack());
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [testPinDisplay, setTestPinDisplay] = useState<string>('');

  useEffect(() => {
    const handleSync = () => {
      setEnabled(isPosKeypadAudioEnabled());
      setActivePackId(getSavedPosSoundPack());
    };
    window.addEventListener('alm_pos_soundpack_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('alm_pos_soundpack_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleToggleEnabled = (val: boolean) => {
    setEnabled(val);
    setPosKeypadAudioEnabled(val);
    if (val) {
      triggerPosKeypadSound('5');
      toast.success('POS Keypad Audio enabled!');
    } else {
      toast('POS Keypad Audio muted', { icon: '🔇' });
    }
  };

  const handleSelectSoundpack = (packId: string) => {
    setActivePackId(packId);
    setSavedPosSoundPack(packId);
    // Play test chord
    triggerPosKeypadSound('5', packId);
    toast.success('Soundpack updated!', { id: 'pack-changed' });
  };

  const handleTestKey = (digit: string) => {
    setPreviewKey(digit);
    triggerPosKeypadSound(digit, activePackId);
    if (digit === 'clear') {
      setTestPinDisplay('');
    } else if (digit === 'backspace') {
      setTestPinDisplay((prev) => prev.slice(0, -1));
    } else {
      setTestPinDisplay((prev) => (prev.length < 8 ? prev + digit : prev));
    }
    setTimeout(() => setPreviewKey(null), 180);
  };

  const handlePlaySampleSequence = (packId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    ['1', '3', '7', '9'].forEach((digit, i) => {
      setTimeout(() => {
        soundEngine.playPosKeypadDigit(digit, packId);
      }, i * 110);
    });
  };

  const getPackIcon = (iconType: string) => {
    switch (iconType) {
      case 'atm': return <LuCreditCard />;
      case 'keyboard': return <LuKeyboard />;
      case 'register': return <MdPointOfSale />;
      case 'bubble': return <LuSparkles />;
      case 'cyber': return <LuCpu />;
      case 'ratchet': return <LuWrench />;
      default: return <LuVolume2 />;
    }
  };

  const activePack = POS_SOUNDPACKS.find((p) => p.id === activePackId) || POS_SOUNDPACKS[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Audio Sub-Tabs Pill Navigation */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 w-fit">
        <button
          type="button"
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'sound_effects');
            window.history.pushState({}, '', url.toString());
            window.dispatchEvent(new CustomEvent('jakwani_settings_tab_changed', { detail: 'sound_effects' }));
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60 transition cursor-pointer"
        >
          <LuVolume2 size={15} />
          <span>System Chimes & Alerts</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs cursor-pointer"
        >
          <LuKeyboard size={15} className="text-primary" />
          <span>POS Keypad & PIN Sounds</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">Studio</span>
        </button>
      </div>
      {/* ── TOP HERO CARD: MASTER TOGGLE & ACTIVE SOUNDPACK BADGE ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0 shadow-inner">
            <LuKeyboard size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">POS & Terminal Audio Chimes</h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Keywise Feedback
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              Configure distinctive acoustic feedback for POS terminal PIN input, touchscreen cash register numpads, and manager authentication.
            </p>
          </div>
        </div>

        {/* Master Audio Toggle Switch */}
        <div className="flex items-center gap-3 self-start md:self-center shrink-0 bg-slate-50 dark:bg-slate-800/60 p-2 sm:p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {enabled ? 'Audio Active' : 'Audio Muted'}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleToggleEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary" />
          </label>
        </div>
      </div>

      {/* ── 2-COLUMN LAYOUT: SOUNDPACK LIST & LIVE KEYPAD TESTER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Soundpack Cards (7 Columns) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Select Soundpack Profile:
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {POS_SOUNDPACKS.length} Soundpacks Available
            </span>
          </div>

          <div className="space-y-3">
            {POS_SOUNDPACKS.map((pack) => {
              const isSelected = activePackId === pack.id;
              return (
                <div
                  key={pack.id}
                  onClick={() => handleSelectSoundpack(pack.id)}
                  className={`p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    isSelected
                      ? 'bg-primary/5 dark:bg-primary/10 border-primary shadow-sm ring-1 ring-primary/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all ${
                        isSelected
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:scale-105'
                      }`}
                    >
                      {getPackIcon(pack.iconType)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {isRTL ? pack.urName : pack.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                          {pack.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {pack.description}
                      </p>
                      <span className="text-[10px] font-mono font-medium text-slate-400 mt-1 block">
                        Features: {pack.sampleKeys}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Test Button & Radio */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handlePlaySampleSequence(pack.id, e)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Play Audio Sample"
                    >
                      <LuPlay size={12} className="text-primary fill-primary" />
                      <span>Preview</span>
                    </button>

                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-primary bg-primary text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <LuCheck size={14} className="stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Live Keypad Tester (5 Columns) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Keypad Audio Tester
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tap keys below to test the active soundpack: <strong className="text-primary">{activePack.name}</strong>
              </p>
            </div>

            {/* Simulated PIN Display */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Entered Test PIN:</span>
                <span className="font-mono text-lg font-black tracking-widest text-slate-900 dark:text-white">
                  {testPinDisplay.length > 0
                    ? testPinDisplay.split('').map(() => '●').join(' ')
                    : '○ ○ ○ ○'}
                </span>
              </div>
              {testPinDisplay.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleTestKey('clear')}
                  className="text-[10px] font-bold text-red-500 hover:text-red-600 px-2 py-1 rounded bg-red-50 dark:bg-red-950/40 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Interactive Numpad */}
            <div className="grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => {
                const isPressed = previewKey === digit;
                return (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleTestKey(digit)}
                    className={`h-13 rounded-2xl font-mono text-lg font-bold transition-all duration-100 flex items-center justify-center border shadow-2xs cursor-pointer select-none ${
                      isPressed
                        ? 'bg-primary text-white border-primary scale-95 shadow-md'
                        : 'bg-slate-100/90 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border-slate-200/90 dark:border-slate-700/80 active:scale-95'
                    }`}
                  >
                    {digit}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleTestKey('clear')}
                className="h-13 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-200/60 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 active:scale-95 cursor-pointer select-none"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleTestKey('0')}
                className={`h-13 rounded-2xl font-mono text-lg font-bold transition-all duration-100 flex items-center justify-center border shadow-2xs cursor-pointer select-none ${
                  previewKey === '0'
                    ? 'bg-primary text-white border-primary scale-95 shadow-md'
                    : 'bg-slate-100/90 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border-slate-200/90 dark:border-slate-700/80 active:scale-95'
                }`}
              >
                0
              </button>

              <button
                type="button"
                onClick={() => handleTestKey('backspace')}
                className="h-13 rounded-2xl text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 bg-slate-200/60 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 active:scale-95 cursor-pointer select-none"
                title="Backspace"
              >
                <LuDelete size={20} />
              </button>
            </div>

            {/* Note & Direct Link to POS */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Ready for Cashier POS?</span>
              <a
                href="/pos1"
                className="text-primary font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>Launch Counter #1 (/pos1)</span>
                <span className="text-xs">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSSoundSettingsTab;
