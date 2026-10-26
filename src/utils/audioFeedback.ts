// Web Audio API Synth Engine for POS & ERP Sound Effects
// Works 100% offline with zero external audio assets or audio file dependencies

export interface ToneOption {
  id: string;
  name: string;
  duration: string; // e.g. "(1.5s)"
  description: string;
}

export interface SoundCategory {
  id: 'notification' | 'success' | 'scan' | 'warning' | 'delete';
  label: string;
  description: string;
  defaultTone: string;
  tones: ToneOption[];
}

export const SOUND_CATEGORIES: SoundCategory[] = [
  {
    id: 'notification',
    label: 'Notification Ping',
    description: 'Chimes played for system toasts, popups, and real-time alerts.',
    defaultTone: 'wind_chime_15',
    tones: [
      { id: 'wind_chime_15', name: 'Harmonic Wind Chime', duration: '(1.5s)', description: '4-note ascending bell chime with harmonic overtone shimmer.' },
      { id: 'crystal_harp_20', name: 'Crystal Harp Arpeggio', duration: '(2.0s)', description: '5-note sweeping harp arpeggio with reverberant crystal decay.' },
      { id: 'double_bell_12', name: 'Double Bell Reverberation', duration: '(1.2s)', description: 'Dual tubular bell strike with long cathedral room sustain.' },
      { id: 'cosmic_starlight_22', name: 'Cosmic Starlight Ping', duration: '(2.2s)', description: 'High-register celestial bell chime with gentle shimmer.' },
      { id: 'warm_epiano_14', name: 'Warm Electric Piano', duration: '(1.4s)', description: 'Neo-soul two-chord resolution with mellow Rhodes timbre.' },
    ],
  },
  {
    id: 'success',
    label: 'Invoice Saved (Success)',
    description: 'Triumphant celebratory chimes played on invoice completion and payment receipts.',
    defaultTone: 'triumphant_fanfare_15',
    tones: [
      { id: 'triumphant_fanfare_15', name: 'Triumphant Major Fanfare', duration: '(1.5s)', description: 'Ascending A-major chord progression with lingering acoustic resonance.' },
      { id: 'grand_achievement_20', name: 'Grand Achievement Chime', duration: '(2.0s)', description: 'Rich orchestral-style brass bell triad with warm reverberation.' },
      { id: 'royal_victory_25', name: 'Royal Victory Chords', duration: '(2.5s)', description: 'Grand 6-note celebratory cadence with deep harmonic sustain.' },
      { id: 'cash_register_12', name: 'Cash Register & Bells', duration: '(1.2s)', description: 'Tactile register mechanical click followed by bright ascending bells.' },
      { id: 'zen_crystal_18', name: 'Zen Crystal Singing Bowl', duration: '(1.8s)', description: 'Meditative Tibetan singing bowl with deep calming resonance.' },
    ],
  },
  {
    id: 'scan',
    label: 'Barcode Scan Beep',
    description: 'Crisp audible confirmations when scanning or adding items to invoices.',
    defaultTone: 'laser_ping_12',
    tones: [
      { id: 'laser_ping_12', name: 'Futuristic Laser Ping', duration: '(1.2s)', description: '3-pulse laser scanner confirmation with crystal reverberation tail.' },
      { id: 'optic_crystal_10', name: 'Optic Crystal Blip', duration: '(1.0s)', description: 'High-frequency holographic optic scan chime with warm tail.' },
      { id: 'checkout_chime_11', name: 'Supermarket Pos Chime', duration: '(1.1s)', description: 'Crisp modern cashier scanner chime with room ambiance.' },
      { id: 'digital_sparkle_14', name: 'Digital Sparkle Beam', duration: '(1.4s)', description: 'Ascending dual chirp with harmonic resonance tail.' },
    ],
  },
  {
    id: 'warning',
    label: 'Limit Warning Alert',
    description: 'Noticeable caution tones when customer reaches or exceeds credit boundaries.',
    defaultTone: 'triple_pulse_14',
    tones: [
      { id: 'triple_pulse_14', name: 'Triple Pulse Caution', duration: '(1.4s)', description: '3-beat dual-tone tension resolving to a deep warning hum.' },
      { id: 'radar_beacon_18', name: 'Radar Beacon Alert', duration: '(1.8s)', description: 'Sonar ping pulse with dual frequency sweep.' },
      { id: 'airplane_chime_15', name: 'Airplane Cabin Chime', duration: '(1.5s)', description: 'Dual resonant overhead cabin announcement chime.' },
      { id: 'amber_drone_20', name: 'Analog Amber Drone', duration: '(2.0s)', description: 'Warm analog synth caution chord with oscillating tremolo.' },
      { id: 'urgent_triple_12', name: 'Urgent Triple Chime', duration: '(1.2s)', description: 'Crisp triple-staccato warning bell with fading decay.' },
    ],
  },
  {
    id: 'delete',
    label: 'Item Removed (Delete)',
    description: 'Acoustic cancellation and removal sounds when deleting invoice line items.',
    defaultTone: 'marimba_fall_13',
    tones: [
      { id: 'marimba_fall_13', name: 'Acoustic Marimba Fall', duration: '(1.3s)', description: '3-step descending marimba chime with deep acoustic bass resonance.' },
      { id: 'sub_bass_drop_15', name: 'Sub Bass Drop Glide', duration: '(1.5s)', description: 'Smooth low sine wave downward glide with soft envelope.' },
      { id: 'wooden_block_12', name: 'Wooden Temple Bell', duration: '(1.2s)', description: 'Resonant wooden temple block chime with gentle decay.' },
      { id: 'water_droplet_14', name: 'Echoing Water Droplet', duration: '(1.4s)', description: 'Deep cave water drop pitch bend with acoustic echo.' },
    ],
  },
];

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

  // ─────────────────────────────────────────────────────────────
  // NOTIFICATION TONES
  // ─────────────────────────────────────────────────────────────

  playWindChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, start: 0.00, end: 0.95 },
      { freq: 659.25, start: 0.16, end: 1.15 },
      { freq: 783.99, start: 0.32, end: 1.30 },
      { freq: 1046.50, start: 0.48, end: 1.48 },
    ];
    notes.forEach(({ freq, start, end }) => {
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

      const harm = ctx.createOscillator();
      const hGain = ctx.createGain();
      harm.type = 'sine';
      harm.frequency.setValueAtTime(freq * 2, now + start);
      hGain.gain.setValueAtTime(0.0005, now + start);
      hGain.gain.linearRampToValueAtTime(0.04, now + start + 0.015);
      hGain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.35);
      harm.connect(hGain);
      hGain.connect(ctx.destination);
      harm.start(now + start);
      harm.stop(now + start + 0.36);
    });
  }

  playCrystalHarp(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22];
    notes.forEach((freq, idx) => {
      const start = idx * 0.14;
      const end = 1.95;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
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

  playDoubleBell(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [
      { freq: 587.33, start: 0.00, end: 1.15 },
      { freq: 880.00, start: 0.22, end: 1.20 },
    ].forEach(({ freq, start, end }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.24, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + end);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + end + 0.02);
    });
  }

  playCosmicStarlight(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [
      { freq: 1046.50, start: 0.00, end: 1.50 },
      { freq: 1318.51, start: 0.20, end: 1.80 },
      { freq: 1567.98, start: 0.40, end: 2.15 },
    ];
    notes.forEach(({ freq, start, end }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.14, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + end);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + end + 0.02);
    });
  }

  playWarmEPiano(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Chord 1 (Fmaj7: F4, A4, C5, E5) -> Chord 2 (Cmaj7: C4, G4, B4, E5)
    const chord1 = [349.23, 440.0, 523.25, 659.25];
    const chord2 = [261.63, 392.0, 493.88, 659.25];
    chord1.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.66);
    });
    chord2.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.55);
      gain.gain.setValueAtTime(0.001, now + 0.55);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.58);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.40);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.55);
      osc.stop(now + 1.41);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SUCCESS / INVOICE SAVED TONES
  // ─────────────────────────────────────────────────────────────

  playTriumphantFanfare(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [
      { freq: 440.00, start: 0.00, decay: 0.8 },
      { freq: 554.37, start: 0.14, decay: 0.9 },
      { freq: 659.25, start: 0.28, decay: 1.0 },
      { freq: 880.00, start: 0.42, decay: 1.1 },
      { freq: 1108.73, start: 0.58, decay: 1.48 },
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

  playGrandAchievement(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, start: 0.00, decay: 1.2 },
      { freq: 659.25, start: 0.18, decay: 1.4 },
      { freq: 783.99, start: 0.36, decay: 1.6 },
      { freq: 1046.50, start: 0.54, decay: 1.95 },
    ];
    notes.forEach(({ freq, start, decay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.20, now + start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + decay + 0.02);
    });
  }

  playRoyalVictory(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // C4 -> E4 -> G4 -> C5 -> E5 -> G5
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const start = idx * 0.16;
      const decay = 2.45;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.15, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + decay + 0.02);
    });
  }

  playCashRegister(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Mechanical click/ratchet followed by high register bell
    const click = ctx.createOscillator();
    const cGain = ctx.createGain();
    click.type = 'sawtooth';
    click.frequency.setValueAtTime(180, now);
    click.frequency.linearRampToValueAtTime(60, now + 0.08);
    cGain.gain.setValueAtTime(0.2, now);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    click.connect(cGain);
    cGain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.1);

    // Bell chime
    [1318.51, 1567.98, 2093.0].forEach((freq, idx) => {
      const start = 0.12 + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + 1.20);
    });
  }

  playZenCrystalBowl(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(432.0, now); // 432 Hz healing bowl fundamental
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.80);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.82);

    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(864.0, now);
    g2.gain.setValueAtTime(0.001, now);
    g2.gain.linearRampToValueAtTime(0.08, now + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 1.60);
    osc2.connect(g2);
    g2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 1.62);
  }

  // ─────────────────────────────────────────────────────────────
  // SCAN TONES
  // ─────────────────────────────────────────────────────────────

  playLaserPing(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const pulses = [
      { freq: 1174.66, start: 0.00, dur: 0.22 },
      { freq: 1479.98, start: 0.18, dur: 0.25 },
      { freq: 1760.00, start: 0.38, dur: 1.18 },
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

  playOpticCrystal(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.15);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.20, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.06);
  }

  playCheckoutChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1046.50, 1567.98].forEach((freq, idx) => {
      const start = idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + 1.14);
    });
  }

  playDigitalSparkle(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1200, 1600, 2000, 2400].forEach((freq, idx) => {
      const start = idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.12, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + 1.40);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // WARNING TONES
  // ─────────────────────────────────────────────────────────────

  playTriplePulseCaution(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const steps = [
      { f1: 466.16, f2: 622.25, start: 0.00, dur: 0.38 },
      { f1: 440.00, f2: 587.33, start: 0.40, dur: 0.40 },
      { f1: 392.00, f2: 523.25, start: 0.82, dur: 1.38 },
    ];
    steps.forEach(({ f1, f2, start, dur }) => {
      [f1, f2].forEach(freq => {
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

  playRadarBeacon(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0.0, 0.55].forEach(start => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now + start);
      osc.frequency.exponentialRampToValueAtTime(380, now + start + 0.3);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.20, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + 0.87);
    });
  }

  playAirplaneCabin(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Classic high-low cabin ding-dong (F4 -> C4) with warm bell decay
    [
      { freq: 698.46, start: 0.00, end: 0.9 }, // F5
      { freq: 523.25, start: 0.45, end: 1.5 }, // C5
    ].forEach(({ freq, start, end }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.22, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + end);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + end + 0.02);
    });
  }

  playAmberDrone(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [329.63, 392.0, 493.88].forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.95);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.96);
    });
  }

  playUrgentTriple(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0.0, 0.22, 0.44].forEach(start => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.75);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + 0.77);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // DELETE TONES
  // ─────────────────────────────────────────────────────────────

  playMarimbaFall(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [
      { freq: 440.00, start: 0.00, end: 0.55 },
      { freq: 329.63, start: 0.22, end: 0.85 },
      { freq: 220.00, start: 0.46, end: 1.28 },
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

  playSubBassDrop(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.6);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.48);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.50);
  }

  playWoodenBlock(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [480, 360, 240].forEach((freq, idx) => {
      const start = idx * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + 1.20);
    });
  }

  playWaterDroplet(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.2);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.38);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.40);
  }

  // ─────────────────────────────────────────────────────────────
  // UNIVERSAL DISPATCHER BY TONE ID
  // ─────────────────────────────────────────────────────────────

  playToneById(toneId: string): void {
    switch (toneId) {
      // Notifications
      case 'wind_chime_15': this.playWindChime(); break;
      case 'crystal_harp_20': this.playCrystalHarp(); break;
      case 'double_bell_12': this.playDoubleBell(); break;
      case 'cosmic_starlight_22': this.playCosmicStarlight(); break;
      case 'warm_epiano_14': this.playWarmEPiano(); break;

      // Success
      case 'triumphant_fanfare_15': this.playTriumphantFanfare(); break;
      case 'grand_achievement_20': this.playGrandAchievement(); break;
      case 'royal_victory_25': this.playRoyalVictory(); break;
      case 'cash_register_12': this.playCashRegister(); break;
      case 'zen_crystal_18': this.playZenCrystalBowl(); break;

      // Scan
      case 'laser_ping_12': this.playLaserPing(); break;
      case 'optic_crystal_10': this.playOpticCrystal(); break;
      case 'checkout_chime_11': this.playCheckoutChime(); break;
      case 'digital_sparkle_14': this.playDigitalSparkle(); break;

      // Warning
      case 'triple_pulse_14': this.playTriplePulseCaution(); break;
      case 'radar_beacon_18': this.playRadarBeacon(); break;
      case 'airplane_chime_15': this.playAirplaneCabin(); break;
      case 'amber_drone_20': this.playAmberDrone(); break;
      case 'urgent_triple_12': this.playUrgentTriple(); break;

      // Delete
      case 'marimba_fall_13': this.playMarimbaFall(); break;
      case 'sub_bass_drop_15': this.playSubBassDrop(); break;
      case 'wooden_block_12': this.playWoodenBlock(); break;
      case 'water_droplet_14': this.playWaterDroplet(); break;

      default:
        this.playWindChime();
        break;
    }
  }

  // Backward compatibility methods
  playSuccessChime(): void { this.playTriumphantFanfare(); }
  playScanBeep(): void { this.playLaserPing(); }
  playWarningTone(): void { this.playTriplePulseCaution(); }
  playNotificationChime(): void { this.playWindChime(); }
  playDeleteTone(): void { this.playMarimbaFall(); }
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
  window.dispatchEvent(new CustomEvent('erp_audio_preference_changed', { detail: { enabled, key } }));
};

const getToneStorageKey = (category: string, userIdOrEmail?: string | null): string => {
  const cleanId = (userIdOrEmail || 'current_user').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
  return `erp_tone_pref_${cleanId}_${category}`;
};

export const getUserTone = (category: string, userIdOrEmail?: string | null): string => {
  if (typeof window === 'undefined') return '';
  const key = getToneStorageKey(category, userIdOrEmail);
  const val = localStorage.getItem(key);
  if (val) return val;
  const cat = SOUND_CATEGORIES.find(c => c.id === category);
  return cat ? cat.defaultTone : '';
};

export const setUserTone = (category: string, toneId: string, userIdOrEmail?: string | null): void => {
  if (typeof window === 'undefined') return;
  const key = getToneStorageKey(category, userIdOrEmail);
  localStorage.setItem(key, toneId);
  window.dispatchEvent(new CustomEvent('erp_tone_preference_changed', { detail: { category, toneId, key } }));
};

let lastPlayedTime = 0;
let lastPlayedKey = '';

/**
 * Universal sound trigger that respects active user audio preference & chosen tone
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
  if (now - lastPlayedTime < 350 && lastPlayedKey === type) {
    return;
  }
  lastPlayedTime = now;
  lastPlayedKey = type;

  try {
    const toneId = getUserTone(type, userIdOrEmail);
    soundEngine.playToneById(toneId);
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
};
