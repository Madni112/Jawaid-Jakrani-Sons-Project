// Web Audio API Synth Engine for POS & ERP Sound Effects
// Works 100% offline with zero external audio assets or audio file dependencies

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Harmonious ascending chord for successful invoice creation / completion
   * Duration: ~1.5 seconds with warm lingering major chord resonance
   */
  playSuccessChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Triumphant ascending A-major progression: A4, C#5, E5, A5, C#6
    const notes = [
      { freq: 440.00, start: 0.00, decay: 0.8 },
      { freq: 554.37, start: 0.14, decay: 0.9 },
      { freq: 659.25, start: 0.28, decay: 1.0 },
      { freq: 880.00, start: 0.42, decay: 1.1 },
      { freq: 1108.73, start: 0.58, decay: 1.45 },
    ];

    notes.forEach(({ freq, start, decay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + decay + 0.02);
    });
  }

  /**
   * High-tech 3-pulse futuristic scanner confirmation with crystal reverberation tail
   * Duration: ~1.15 seconds
   */
  playScanBeep(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // 3 pulses ascending with extended crystal ring tail: D6, F#6, A6
    const pulses = [
      { freq: 1174.66, start: 0.00, dur: 0.22 },
      { freq: 1479.98, start: 0.18, dur: 0.25 },
      { freq: 1760.00, start: 0.38, dur: 1.15 },
    ];

    pulses.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.16, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + dur + 0.02);
    });
  }

  /**
   * Distinct 3-beat caution alert for credit limits and critical boundaries
   * Duration: ~1.35 seconds
   */
  playWarningTone(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // 3-step dual-tone caution pulses (dissonance to resolution)
    const steps = [
      { f1: 466.16, f2: 622.25, start: 0.00, dur: 0.38 },
      { f1: 440.00, f2: 587.33, start: 0.40, dur: 0.40 },
      { f1: 392.00, f2: 523.25, start: 0.82, dur: 1.35 },
    ];

    steps.forEach(({ f1, f2, start, dur }) => {
      [f1, f2].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.linearRampToValueAtTime(0.14, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + dur + 0.02);
      });
    });
  }

  /**
   * Harmonious multi-tone bell chime for notifications and real-time alerts
   * Duration: ~1.45 seconds
   */
  playNotificationChime(): void {
    this.playSynthesizedNotification();
  }

  /**
   * Pure Web Audio API synthesized 4-note ascending bell chime
   * Notes: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz) with rich decay
   * Duration: ~1.45 seconds
   */
  playSynthesizedNotification(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bellNotes = [
      { freq: 523.25, start: 0.00, end: 0.95 },
      { freq: 659.25, start: 0.16, end: 1.15 },
      { freq: 783.99, start: 0.32, end: 1.30 },
      { freq: 1046.50, start: 0.48, end: 1.45 },
    ];

    bellNotes.forEach(({ freq, start, end }) => {
      // Fundamental oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + end);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + end + 0.02);

      // Subtle second harmonic for rich bell shimmer
      const harmOsc = ctx.createOscillator();
      const harmGain = ctx.createGain();

      harmOsc.type = 'sine';
      harmOsc.frequency.setValueAtTime(freq * 2, now + start);

      harmGain.gain.setValueAtTime(0.0005, now + start);
      harmGain.gain.linearRampToValueAtTime(0.04, now + start + 0.015);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.35);

      harmOsc.connect(harmGain);
      harmGain.connect(ctx.destination);

      harmOsc.start(now + start);
      harmOsc.stop(now + start + 0.36);
    });
  }

  /**
   * Warm 3-step descending marimba/gong tone for item removal or draft cancellation
   * Duration: ~1.25 seconds
   */
  playDeleteTone(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // 3 descending notes with acoustic resonance: A4 (440Hz), E4 (330Hz), A3 (220Hz)
    const notes = [
      { freq: 440.00, start: 0.00, end: 0.55 },
      { freq: 329.63, start: 0.22, end: 0.85 },
      { freq: 220.00, start: 0.46, end: 1.25 },
    ];

    notes.forEach(({ freq, start, end }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.16, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + end);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + end + 0.02);
    });
  }
}

export const soundEngine = new SoundEngine();

/**
 * Storage helpers for per-user audio preference
 * Stored strictly per-user so one cashier's workstation doesn't impact others
 */
const getStorageKey = (userIdOrEmail?: string | null): string => {
  const cleanId = (userIdOrEmail || 'current_user').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
  return `erp_sound_effects_enabled_${cleanId}`;
};

export const isUserAudioEnabled = (userIdOrEmail?: string | null): boolean => {
  if (typeof window === 'undefined') return true;
  const key = getStorageKey(userIdOrEmail);
  const val = localStorage.getItem(key);
  // Default to enabled (true) if not set yet
  return val === null ? true : val === 'true';
};

export const setUserAudioEnabled = (enabled: boolean, userIdOrEmail?: string | null): void => {
  if (typeof window === 'undefined') return;
  const key = getStorageKey(userIdOrEmail);
  localStorage.setItem(key, String(enabled));
  // Dispatch custom window event so reactive UI components can update instantly
  window.dispatchEvent(new CustomEvent('erp_audio_preference_changed', { detail: { enabled, key } }));
};

let lastPlayedTime = 0;
let lastPlayedType = '';

/**
 * Universal sound trigger that respects the active user's audio preference
 */
export const triggerFeedbackSound = (
  type: 'success' | 'scan' | 'warning' | 'delete' | 'notification',
  userIdOrEmail?: string | null
): void => {
  if (!isUserAudioEnabled(userIdOrEmail)) {
    return;
  }
  const now = Date.now();
  // Prevent duplicate sounds overlapping within 350ms
  if (now - lastPlayedTime < 350 && lastPlayedType === type) {
    return;
  }
  lastPlayedTime = now;
  lastPlayedType = type;

  try {
    switch (type) {
      case 'notification':
        soundEngine.playNotificationChime();
        break;
      case 'success':
        soundEngine.playSuccessChime();
        break;
      case 'scan':
        soundEngine.playScanBeep();
        break;
      case 'warning':
        soundEngine.playWarningTone();
        break;
      case 'delete':
        soundEngine.playDeleteTone();
        break;
    }
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
};
