export const SHOW_THEME_COLOR_PICKER = true; // Set to false to hide in Zohaib Ali or dev

export interface ThemeColor {
  name: string;
  hex: string;
}

export const PRESET_THEME_COLORS: ThemeColor[] = [
  // Row 1: Greens, Cyans & Blues
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Forest Green', hex: '#059669' },
  { name: 'Lime Green', hex: '#65A30D' },
  { name: 'Olive Green', hex: '#4D7C0F' },
  { name: 'Teal Cyan', hex: '#0D9488' },
  { name: 'Vibrant Cyan', hex: '#06B6D4' },
  { name: 'Sky Blue', hex: '#0284C7' },
  { name: 'Cobalt Blue', hex: '#2563EB' },

  // Row 2: Deep Blues, Purples & Pinks
  { name: 'Navy Blue', hex: '#1D4ED8' },
  { name: 'Royal Indigo', hex: '#4F46E5' },
  { name: 'Iris Violet', hex: '#6366F1' },
  { name: 'Purple Bloom', hex: '#8B5CF6' },
  { name: 'Deep Violet', hex: '#7C3AED' },
  { name: 'Fuchsia Magenta', hex: '#C026D3' },
  { name: 'Hot Pink', hex: '#DB2777' },
  { name: 'Crimson Rose', hex: '#E11D48' },

  // Row 3: Warm Reds, Oranges, Ambers & Slate
  { name: 'Scuderia Red', hex: '#DC2626' },
  { name: 'Coral Flame', hex: '#EA580C' },
  { name: 'Tangerine Orange', hex: '#F97316' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Caramel Ochre', hex: '#B45309' },
  { name: 'Bronze Cinnamon', hex: '#9A3412' },
  { name: 'Slate Blue', hex: '#475569' },
  { name: 'Dark Charcoal', hex: '#1E293B' },
];

export const DEFAULT_THEME_COLOR = '#DC2626';

export function applyAccentColor(hexColor: string) {
  if (!hexColor) return;
  try {
    localStorage.setItem('al_muhammadi_accent_color', hexColor);
  } catch (_) {}

  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--color-primary', hexColor);
    const hex = hexColor.replace('#', '');
    let r = 220, g = 38, b = 38;
    if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
      document.documentElement.style.setProperty('--color-primary-rgb', `${r} ${g} ${b}`);
    }

    // Dynamic style tag that globally overrides red brand classes to the active accent color
    let styleTag = document.getElementById('al-muhammadi-dynamic-theme');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'al-muhammadi-dynamic-theme';
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      :root {
        --color-primary: ${hexColor};
        --color-primary-rgb: ${r}, ${g}, ${b};
      }

      /* Primary & Red brand backgrounds */
      .bg-red-600,
      .bg-red-500,
      .bg-primary,
      .bg-\\[\\#DC2626\\] {
        background-color: ${hexColor} !important;
      }

      /* Light / Transparent background tints */
      .bg-red-50,
      .bg-red-50\\/80,
      .bg-red-600\\/10,
      .bg-red-500\\/10 {
        background-color: rgba(${r}, ${g}, ${b}, 0.1) !important;
      }

      .dark .bg-red-500\\/15,
      .dark .bg-red-950\\/30,
      .dark .bg-red-900\\/30 {
        background-color: rgba(${r}, ${g}, ${b}, 0.18) !important;
      }

      .bg-red-400 {
        background-color: ${hexColor} !important;
        opacity: 0.75 !important;
      }

      /* Primary & Red text colors */
      .text-red-600,
      .text-red-500,
      .text-red-700,
      .dark .text-red-400,
      .text-primary {
        color: ${hexColor} !important;
      }

      /* Borders */
      .border-red-600,
      .border-red-500,
      .border-primary {
        border-color: ${hexColor} !important;
      }

      /* Glow & box shadows */
      .shadow-red-600\\/30,
      .shadow-red-600\\/20 {
        box-shadow: 0 10px 15px -3px rgba(${r}, ${g}, ${b}, 0.28) !important;
      }

      /* Gradients (e.g. TODAY'S SALE card) */
      .from-red-600 {
        --tw-gradient-from: ${hexColor} var(--tw-gradient-from-position) !important;
        --tw-gradient-to: rgba(${r}, ${g}, ${b}, 0) var(--tw-gradient-to-position) !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
      }
      .via-red-600 {
        --tw-gradient-to: rgba(${r}, ${g}, ${b}, 0) var(--tw-gradient-to-position) !important;
        --tw-gradient-stops: var(--tw-gradient-from), ${hexColor} var(--tw-gradient-via-position), var(--tw-gradient-to) !important;
      }
      .to-rose-700 {
        --tw-gradient-to: ${hexColor} var(--tw-gradient-to-position) !important;
      }
    `;
  }
}

export function getSavedAccentColor(): string {
  if (typeof window === 'undefined') return DEFAULT_THEME_COLOR;
  return localStorage.getItem('al_muhammadi_accent_color') || DEFAULT_THEME_COLOR;
}
