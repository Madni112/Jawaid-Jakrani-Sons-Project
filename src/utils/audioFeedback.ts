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
   */
  playSuccessChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.36);
    });
  }

  /**
   * Crisp, high-tech single blip for barcode scanning or item addition
   */
  playScanBeep(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, now); // Crisp F#6
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.05);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Gentle two-tone warning chime for credit limit alert or boundary check
   */
  playWarningTone(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const tones = [587.33, 440.0]; // D5 -> A4

    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.16, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.23);
    });
  }

  /**
   * Descending gentle tone for item deletion or cancellation
   */
  playDeleteTone(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.19);
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

/**
 * Universal sound trigger that respects the active user's audio preference
 */
export const triggerFeedbackSound = (
  type: 'success' | 'scan' | 'warning' | 'delete',
  userIdOrEmail?: string | null
): void => {
  if (!isUserAudioEnabled(userIdOrEmail)) {
    return;
  }
  try {
    switch (type) {
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
