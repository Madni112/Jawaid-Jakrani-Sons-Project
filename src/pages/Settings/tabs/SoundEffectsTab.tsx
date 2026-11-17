import React, { useState, useEffect, useRef } from 'react';
import {
  LuVolume2,
  LuVolumeX,
  LuKeyboard,
  LuSparkles,
  LuCheck,
  LuPlay,
  LuChevronDown,
  LuBell,
  LuCheckCircle2,
  LuAlertTriangle,
  LuXCircle,
} from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import {
  SOUND_CATEGORIES,
  SoundCategory,
  getUserTone,
  setUserTone,
  soundEngine,
  isUserAudioEnabled,
  setUserAudioEnabled,
  triggerFeedbackSound,
} from '../../../utils/audioFeedback';
import { POSSoundSettingsTab } from '../POSSoundSettingsTab';

interface SoundToneCardProps {
  category: SoundCategory;
  userEmail?: string | null;
  icon: React.ReactNode;
  accentColorClass: string;
  btnBgClass: string;
  btnTextClass: string;
}

const SoundToneCard: React.FC<SoundToneCardProps> = ({
  category,
  userEmail,
  icon,
  accentColorClass,
  btnBgClass,
  btnTextClass,
}) => {
  const [selectedToneId, setSelectedToneId] = useState<string>(() => getUserTone(category.id, userEmail));
  const [isOpen, setIsOpen] = useState(false);
  const [playingToneId, setPlayingToneId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedToneId(getUserTone(category.id, userEmail));
  }, [category.id, userEmail]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeTone = category.tones.find((t) => t.id === selectedToneId) || category.tones[0];

  const handleSelectTone = (toneId: string) => {
    setSelectedToneId(toneId);
    setUserTone(category.id, toneId, userEmail);
    setIsOpen(false);
    soundEngine.playToneById(toneId);
    toast.success(`Active tone set to "${category.tones.find((t) => t.id === toneId)?.name}"`, {
      id: 'silent-tone-toast',
    });
  };

  const handlePreviewTone = (e: React.MouseEvent, toneId: string) => {
    e.stopPropagation();
    setPlayingToneId(toneId);
    soundEngine.playToneById(toneId);
    setTimeout(() => {
      setPlayingToneId((cur) => (cur === toneId ? null : cur));
    }, 1800);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm transition hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Icon, Category Name, Description */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${accentColorClass}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{category.label}</h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Active: {activeTone.duration}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {category.description}
          </p>
        </div>
      </div>

      {/* Right: Dropdown & Quick Test Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
        <div className="relative w-full sm:w-64 md:w-72" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition text-xs font-semibold cursor-pointer text-left shadow-2xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate">{activeTone.name}</span>
              <span className="text-[10px] font-bold text-primary shrink-0 bg-primary/10 px-1.5 py-0.5 rounded-md">
                {activeTone.duration}
              </span>
            </div>
            <LuChevronDown className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 left-0 sm:left-auto sm:w-84 top-full mt-1.5 z-50 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-2 space-y-1 animate-fadeIn max-h-72 overflow-y-auto">
              <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Select Ringtone</span>
                <span>{category.tones.length} Options</span>
              </div>
              {category.tones.map((tone) => {
                const isSelected = tone.id === selectedToneId;
                const isPlaying = playingToneId === tone.id;

                return (
                  <div
                    key={tone.id}
                    onClick={() => handleSelectTone(tone.id)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold dark:bg-primary/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <LuCheck size={10} />}
                      </div>
                      <span className="truncate text-xs">{tone.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                        isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {tone.duration}
                      </span>
                    </div>

                    <button
                      type="button"
                      title={`Preview ${tone.name} ${tone.duration}`}
                      onClick={(e) => handlePreviewTone(e, tone.id)}
                      className={`p-1.5 rounded-lg transition shrink-0 flex items-center justify-center cursor-pointer ${
                        isPlaying
                          ? 'bg-primary text-white scale-110 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <LuPlay size={11} className={isPlaying ? 'animate-bounce' : ''} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => soundEngine.playToneById(activeTone.id)}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl ${btnBgClass} ${btnTextClass} hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs`}
        >
          <LuPlay className="text-xs" />
          <span>Test Sound</span>
        </button>
      </div>
    </div>
  );
};

interface SoundEffectsTabProps {
  userEmail?: string | null;
  isRTL?: boolean;
  initialSubTab?: 'system' | 'pos';
  onSubTabChange?: (subTab: 'system' | 'pos') => void;
}

export const SoundEffectsTab: React.FC<SoundEffectsTabProps> = ({
  userEmail,
  isRTL = false,
  initialSubTab = 'system',
  onSubTabChange,
}) => {
  const [subTab, setSubTab] = useState<'system' | 'pos'>(initialSubTab);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => isUserAudioEnabled(userEmail));

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    setUserAudioEnabled(enabled, userEmail);
    if (enabled) {
      triggerFeedbackSound('success', userEmail);
      toast.success('POS sound effects enabled for your account!');
    } else {
      toast('Sound effects muted for your workstation.');
    }
  };

  const handleTabSwitch = (newSubTab: 'system' | 'pos') => {
    setSubTab(newSubTab);
    onSubTabChange?.(newSubTab);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Pill Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs w-fit">
        <button
          type="button"
          onClick={() => handleTabSwitch('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'system'
              ? 'bg-primary text-white shadow-sm ring-1 ring-primary/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LuVolume2 size={16} />
          <span>1. System Chimes & Alerts</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('pos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'pos'
              ? 'bg-primary text-white shadow-sm ring-1 ring-primary/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LuKeyboard size={16} />
          <span>2. POS & System Audio Chimes</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            subTab === 'pos' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
          }`}>
            POS Mode
          </span>
        </button>
      </div>

      {/* ── SUB-TAB 1: SYSTEM & BILLING AUDIO CHIMES ── */}
      {subTab === 'system' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
                  <LuVolume2 />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {isRTL ? "سسٹم اور بلنگ آڈیو اثرات" : "System & Billing Audio Chimes"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isRTL ? "سیلز انوائس بنانے، اسکیننگ اور الرٹس کے دوران کیشیئرز کے لیے آڈیو فیڈ بیک۔" : "Interactive sound feedback for cashiers during sales invoice creation, scanning, and alerts."}
                  </p>
                </div>
              </div>

              {/* Master Sound Switch */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isRTL ? (soundEnabled ? 'آڈیو فعال ہے' : 'آڈیو میوٹ ہے') : (soundEnabled ? 'Audio Active' : 'Audio Muted')}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleSound(!soundEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    soundEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Station Info Banner */}
            <div className="mt-5 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2.5">
              <LuSparkles className="text-base shrink-0" />
              <div>
                <strong>User-Isolated Preference:</strong> Sound effects are saved strictly for your user profile (
                <code>{userEmail || 'current_user'}</code>) on this browser workstation. Turning sound off here will not mute sounds for any other cashier.
              </div>
            </div>
          </div>

          {/* Sound Preview & Customization Cards */}
          {soundEnabled ? (
            <div className="space-y-3.5 animate-fadeIn">
              {SOUND_CATEGORIES.map((cat) => {
                const visualConfig = {
                  notification: {
                    icon: <LuBell />,
                    accentColorClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600',
                    btnBgClass: 'bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40',
                    btnTextClass: 'text-indigo-700 dark:text-indigo-300',
                  },
                  success: {
                    icon: <LuCheckCircle2 />,
                    accentColorClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600',
                    btnBgClass: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
                    btnTextClass: 'text-emerald-700 dark:text-emerald-300',
                  },
                  scan: {
                    icon: <LuSparkles />,
                    accentColorClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600',
                    btnBgClass: 'bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40',
                    btnTextClass: 'text-sky-700 dark:text-sky-300',
                  },
                  warning: {
                    icon: <LuAlertTriangle />,
                    accentColorClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600',
                    btnBgClass: 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40',
                    btnTextClass: 'text-amber-700 dark:text-amber-300',
                  },
                  delete: {
                    icon: <LuXCircle />,
                    accentColorClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600',
                    btnBgClass: 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40',
                    btnTextClass: 'text-rose-700 dark:text-rose-300',
                  },
                }[cat.id] || {
                  icon: <LuVolume2 />,
                  accentColorClass: 'bg-slate-100 text-slate-600',
                  btnBgClass: 'bg-slate-100',
                  btnTextClass: 'text-slate-700',
                };

                return (
                  <SoundToneCard
                    key={cat.id}
                    category={cat}
                    userEmail={userEmail}
                    icon={visualConfig.icon}
                    accentColorClass={visualConfig.accentColorClass}
                    btnBgClass={visualConfig.btnBgClass}
                    btnTextClass={visualConfig.btnTextClass}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center text-2xl">
                <LuVolumeX size={28} />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">System Audio Feedback Muted</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Chimes for barcode scans, invoice printing, and notifications are currently disabled. Turn on the head audio switch above to customize and test individual tones.
              </p>
              <button
                type="button"
                onClick={() => handleToggleSound(true)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:opacity-90 transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <LuVolume2 size={14} />
                <span>Enable Audio Chimes</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 2: POS KEYPAD & PIN SOUNDS ── */}
      {subTab === 'pos' && (
        <POSSoundSettingsTab isRTL={isRTL} accentColorClass="text-primary" />
      )}
    </div>
  );
};
