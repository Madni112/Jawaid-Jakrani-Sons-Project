export const SHOW_THEME_COLOR_PICKER = true; // Set to false to hide in dev if needed

export interface ThemeColor {
  name: string;
  hex: string;
}

export const PRESET_THEME_COLORS: ThemeColor[] = [
  // Row 1: Greens, Cyans & Blues
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Forest Green', hex: '#10B981' },
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
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Pitch Black', hex: '#000000' },
];

export const DEFAULT_THEME_COLOR = '#2563EB'; // Cobalt / Electric Blue for Modern SaaS look

export type SidebarThemeMode = 'light' | 'dark' | 'navy' | 'emerald' | 'charcoal';

export interface CuratedThemeSuite {
  id: string;
  name: string;
  urName: string;
  isRecommended?: boolean;
  badge?: string;
  tagline: string;
  urTagline: string;
  sidebarTheme: SidebarThemeMode;
  sidebarBg: string;
  sidebarBorder: string;
  sidebarTextColor: string;
  accentColor: string;
  accentName: string;
  previewBg: string;
  description: string;
  urDescription: string;
}

export const CURATED_THEME_SUITES: CuratedThemeSuite[] = [
  {
    id: 'unified-light',
    name: 'Unified Clean Light',
    urName: 'یونیفائیڈ کلین لائٹ',
    isRecommended: true,
    badge: 'Recommended • Modern Minimalist',
    tagline: 'Clean white canvas • Eliminates floating island effect',
    urTagline: 'صاف و شفاف وائٹ کینوس • جدید ترین اور واضح انداز',
    sidebarTheme: 'light',
    sidebarBg: '#FFFFFF',
    sidebarBorder: '#E2E8F0',
    sidebarTextColor: '#0F172A',
    accentColor: '#2563EB', // Cobalt Blue
    accentName: 'Electric Blue',
    previewBg: '#F8FAFC',
    description: 'Removes the dark floating island look. Clean white sidebar with subtle border and vivid electric blue accents for a modern Apple/Stripe feel.',
    urDescription: 'سائیڈبار کو خوبصورت سفید رنگ اور واضح نیلی پٹیوں کے ساتھ یکجا کرتا ہے تاکہ پورا سسٹم جدید اور پڑھنے میں آسان لگے۔',
  },
  {
    id: 'executive-navy',
    name: 'Executive Deep Navy & Ice Blue',
    urName: 'ایگزیکٹو ڈیپ نیوی اور آئس بلیو',
    badge: 'Executive Corporate',
    tagline: 'Deep corporate midnight navy with crisp ice blue accents',
    urTagline: 'کارپوریٹ گہرا نیوی نیلا اور چمکدار آئس بلیو رنگ',
    sidebarTheme: 'navy',
    sidebarBg: '#0F172A',
    sidebarBorder: '#1E293B',
    sidebarTextColor: '#F8FAFC',
    accentColor: '#0284C7', // Sky Blue
    accentName: 'Sky Blue',
    previewBg: '#F8FAFC',
    description: 'Prestigious corporate deep navy sidebar paired with bright sky blue accents for an authoritative executive look.',
    urDescription: 'باوقار اور گہرا نیوی سائیڈبار جو کہ نیلے ایکسنٹ کے ساتھ پرکشش انتظامی شکل دیتا ہے۔',
  },
  {
    id: 'emerald-pearl',
    name: 'Emerald Slate & Pearl',
    urName: 'زمرد اور پرل کلوتھ تھیم',
    badge: 'Cloth Merchant Heritage',
    tagline: 'Rich jewel-toned dark emerald with fresh green accents',
    urTagline: 'کپڑے کے تاجروں کا روایتی باوقار زمردی سبز انداز',
    sidebarTheme: 'emerald',
    sidebarBg: '#0A1A18',
    sidebarBorder: '#064E3B',
    sidebarTextColor: '#ECFDF5',
    accentColor: '#059669', // Emerald Green
    accentName: 'Emerald Green',
    previewBg: '#F8FAFC',
    description: 'Bespoke deep botanical emerald sidebar reflecting textile tradition with crisp emerald jewel tones.',
    urDescription: 'کپڑے اور پارچہ بافی کی شان کے عین مطابق گہرا زمردی سبز سائیڈبار اور شفاف موتی جیسے سفید صفحات۔',
  },
  {
    id: 'warm-charcoal',
    name: 'Warm Charcoal & Amber Gold',
    urName: 'وارم چارکول اور گولڈ تھیم',
    badge: 'Artisan Luxury',
    tagline: 'Warm stone charcoal sidebar paired with rich amber gold',
    urTagline: 'نفیس پتھریلا چارکول اور سنہرا عنبر',
    sidebarTheme: 'charcoal',
    sidebarBg: '#1C1917',
    sidebarBorder: '#292524',
    sidebarTextColor: '#FAF7F2',
    accentColor: '#D97706', // Amber Gold
    accentName: 'Amber Gold',
    previewBg: '#FAF7F2',
    description: 'Warm stone charcoal sidebar with warm gold highlights for a tailored, artisanal luxury experience.',
    urDescription: 'قدرتی گرم چارکول رنگ کا سائیڈبار اور سنہری بٹن جو کہ شاہانہ اور نفیس تاثر پیش کرتے ہیں۔',
  },
  {
    id: 'classic-midnight',
    name: 'Classic Midnight Obsidian',
    urName: 'کلاسک مڈ نائٹ ابسیڈین',
    badge: 'Original Classic',
    tagline: 'High-contrast floating dark sidebar with neon cyan accents',
    urTagline: 'اصل کلاسک سیاہ سائیڈبار اور چمکدار سیان رنگ',
    sidebarTheme: 'dark',
    sidebarBg: '#0B0F17',
    sidebarBorder: '#1E293B',
    sidebarTextColor: '#FFFFFF',
    accentColor: '#06B6D4', // Vibrant Cyan
    accentName: 'Vibrant Cyan',
    previewBg: '#F8FAFC',
    description: 'The original bold floating black sidebar with glowing vibrant cyan accents.',
    urDescription: 'شروع کا روایتی ڈارک فلوٹنگ سائیڈبار جس کے ساتھ روشن سیان رنگ کے بٹن موجود ہیں۔',
  },
];

export function getSidebarThemeMode(): SidebarThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const customBg = localStorage.getItem('jakwani_sidebar_custom_bg');
  if (customBg) {
    const lower = customBg.toLowerCase().trim();
    return (lower === '#ffffff' || lower === '#fff' || lower === 'white') ? 'light' : 'dark';
  }
  const stored = localStorage.getItem('jakwani_sidebar_theme_mode') || localStorage.getItem('uzair_jibran_sidebar_theme_mode');
  if (stored && ['light', 'dark', 'navy', 'emerald', 'charcoal'].includes(stored)) {
    return stored as SidebarThemeMode;
  }
  return 'dark';
}

export function setSidebarThemeMode(mode: SidebarThemeMode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jakwani_sidebar_theme_mode', mode);
    localStorage.setItem('uzair_jibran_sidebar_theme_mode', mode);
    window.dispatchEvent(new Event('jakwani_sidebar_theme_changed'));
  }
}

export function isSidebarBackgroundLight(isDarkMode?: boolean): boolean {
  if (typeof window !== 'undefined') {
    const customBg = localStorage.getItem('jakwani_sidebar_custom_bg');
    if (customBg) {
      const lower = customBg.toLowerCase().trim();
      if (lower === '#ffffff' || lower === '#fff' || lower === 'white' || lower.includes('rgb(255, 255, 255)')) {
        return true;
      }
      return false;
    }
  }
  const mode = getSidebarThemeMode();
  return mode === 'light';
}

export function applyThemeSuite(suiteId: string): boolean {
  const suite = CURATED_THEME_SUITES.find((s) => s.id === suiteId);
  if (!suite) return false;

  setSidebarThemeMode(suite.sidebarTheme);
  const targetColor = suite.sidebarTheme === 'light' ? suite.sidebarTextColor : '#FFFFFF';
  applySidebarColor(targetColor);
  applyAccentColor(suite.accentColor);

  if (typeof window !== 'undefined') {
    localStorage.setItem('jakwani_active_theme_suite', suiteId);
    window.dispatchEvent(new Event('jakwani_theme_suite_changed'));
    window.dispatchEvent(new Event('jakwani_sidebar_theme_changed'));
    window.dispatchEvent(new Event('uzair_jibran_sidebar_color_changed'));
    window.dispatchEvent(new Event('uzair_jibran_theme_color_changed'));
  }
  return true;
}

export function getActiveThemeSuiteId(): string {
  if (typeof window === 'undefined') return 'unified-light';
  const saved = localStorage.getItem('jakwani_active_theme_suite');
  if (saved && CURATED_THEME_SUITES.some((s) => s.id === saved)) {
    return saved;
  }
  const currentSidebarTheme = getSidebarThemeMode();
  if (currentSidebarTheme === 'light') return 'unified-light';
  if (currentSidebarTheme === 'navy') return 'executive-navy';
  if (currentSidebarTheme === 'emerald') return 'emerald-pearl';
  if (currentSidebarTheme === 'charcoal') return 'warm-charcoal';
  return 'classic-midnight';
}

export type SidebarBehaviorMode = 'opened' | 'closed'; // 'opened' = Always Keep Opened; 'closed' = Keep Closed (Auto-expand on click & collapse on mouse out)

export function getSidebarBehaviorMode(): SidebarBehaviorMode {
  if (typeof window === 'undefined') return 'opened';
  const stored = localStorage.getItem('jakwani_sidebar_behavior_mode');
  return stored === 'closed' ? 'closed' : 'opened';
}

export function setSidebarBehaviorMode(mode: SidebarBehaviorMode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jakwani_sidebar_behavior_mode', mode);
    window.dispatchEvent(new Event('jakwani_sidebar_behavior_changed'));
  }
}

export type SidebarLayoutMode = 'floating' | 'classic';

export function getSidebarLayoutMode(): SidebarLayoutMode {
  if (typeof window === 'undefined') return 'floating';
  return (localStorage.getItem('uzair_jibran_sidebar_layout_mode') as SidebarLayoutMode) || 'floating';
}

export function setSidebarLayoutMode(mode: SidebarLayoutMode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('uzair_jibran_sidebar_layout_mode', mode);
    window.dispatchEvent(new Event('uzair_jibran_sidebar_layout_changed'));
  }
}

export type NavbarLayoutMode = 'sticky' | 'normal';

export type MasterThemePreset = 'nht-1' | 'nht-2' | 'custom';

export function getMasterThemePreset(): MasterThemePreset {
  if (typeof window === 'undefined') return 'nht-1';
  const saved = localStorage.getItem('jakwani_master_theme_preset') as MasterThemePreset;
  if (saved === 'nht-1' || saved === 'nht-2' || saved === 'custom') return saved;
  const sLayout = getSidebarLayoutMode();
  const nLayout = getNavbarLayoutMode();
  const accent = (localStorage.getItem('uzair_jibran_accent_color') || '').toUpperCase();
  const customBg = localStorage.getItem('jakwani_sidebar_custom_bg') || '';
  const sTheme = getSidebarThemeMode();

  if (sLayout === 'classic' && (accent === '#800020' || sTheme === 'charcoal' || customBg === '#1A1A1A')) {
    return 'nht-2';
  }
  if (sLayout === 'floating' && (accent === '#06B6D4' || !customBg)) {
    return 'nht-1';
  }
  return 'custom';
}

export function setMasterThemePreset(preset: MasterThemePreset) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jakwani_master_theme_preset', preset);
    if (preset === 'nht-1' || preset === 'nht-2') {
      localStorage.setItem('jakwani_base_master_theme', preset);
    }
    window.dispatchEvent(new Event('jakwani_master_theme_preset_changed'));
  }
}

export function isNHTTheme2Active(): boolean {
  if (typeof window === 'undefined') return false;
  const preset = getMasterThemePreset();
  if (preset === 'nht-2') return true;
  if (preset === 'custom') {
    const base = localStorage.getItem('jakwani_base_master_theme');
    if (base === 'nht-2') return true;
    const sLayout = getSidebarLayoutMode();
    const accent = (localStorage.getItem('uzair_jibran_accent_color') || '').toUpperCase();
    const customBg = localStorage.getItem('jakwani_sidebar_custom_bg') || '';
    if (sLayout === 'classic' && (accent === '#800020' || customBg === '#1A1A1A')) {
      return true;
    }
  }
  return false;
}

export function getNavbarLayoutMode(): NavbarLayoutMode {
  if (typeof window === 'undefined') return 'sticky';
  return (localStorage.getItem('uzair_jibran_navbar_layout_mode') as NavbarLayoutMode) || 'sticky';
}

export function setNavbarLayoutMode(mode: NavbarLayoutMode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('uzair_jibran_navbar_layout_mode', mode);
    window.dispatchEvent(new Event('uzair_jibran_navbar_layout_changed'));
  }
}

export function getContrastTextColor(hexColor?: string): '#FFFFFF' | '#0F172A' {
  if (!hexColor) return '#FFFFFF';
  try {
    const hex = hexColor.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      return '#FFFFFF';
    }
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65 ? '#0F172A' : '#FFFFFF';
  } catch (_) {
    return '#FFFFFF';
  }
}

/**
 * Returns a contrast-safe accent color for text and icons.
 * In Light Mode: bright/white accents resolve to #0F172A so they are never invisible.
 * In Dark Mode: pitch-dark accents resolve to #F8FAFC so they are never invisible.
 */
export function getSafeAccentTextColor(hexColor?: string, isDarkMode?: boolean): string {
  if (!hexColor) return DEFAULT_THEME_COLOR;
  const inDark = typeof isDarkMode === 'boolean' ? isDarkMode : isDarkModeActive();
  const contrast = getContrastTextColor(hexColor);
  if (!inDark && contrast === '#0F172A') {
    return '#0F172A';
  }
  if (inDark) {
    const hex = hexColor.replace('#', '').trim();
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (lum < 0.25) return '#F8FAFC';
    }
  }
  return hexColor;
}

export function applyAccentColor(hexColor: string) {
  if (!hexColor) return;
  try {
    localStorage.setItem('uzair_jibran_accent_color', hexColor);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('uzair_jibran_theme_color_changed'));
    }
  } catch (_) {}

  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--color-primary', hexColor);
    const hex = hexColor.replace('#', '');
    let r = 6, g = 182, b = 212;
    if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
      document.documentElement.style.setProperty('--color-primary-rgb', `${r} ${g} ${b}`);
    }

    // Calculate relative luminance to determine if the color is light or dark
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const isDark = luminance < 0.55;
    const isLightAccent = luminance > 0.65;
    const isDarkAccent = luminance < 0.25;

    const safeLightText = isLightAccent ? '#0F172A' : hexColor;
    const safeDarkText = isDarkAccent ? '#F8FAFC' : hexColor;

    // Light version of the color (for dark colors): clean lighter tone of the same color
    const lightR = Math.min(255, Math.round(r + (255 - r) * 0.38));
    const lightG = Math.min(255, Math.round(g + (255 - g) * 0.38));
    const lightB = Math.min(255, Math.round(b + (255 - b) * 0.38));
    const lightHex = `rgb(${lightR}, ${lightG}, ${lightB})`;

    // Dark version of the color (for light colors): deeper shade of the same color
    const darkR = Math.max(0, Math.round(r * 0.60));
    const darkG = Math.max(0, Math.round(g * 0.60));
    const darkB = Math.max(0, Math.round(b * 0.60));
    const darkHex = `rgb(${darkR}, ${darkG}, ${darkB})`;

    // Rule: Use simple light version if dark color is selected, and dark version if light color is selected
    const companionShade = isDark ? lightHex : darkHex;

    const darkerR = Math.max(0, Math.round(r * 0.82));
    const darkerG = Math.max(0, Math.round(g * 0.82));
    const darkerB = Math.max(0, Math.round(b * 0.82));
    const darkerHex = `rgb(${darkerR}, ${darkerG}, ${darkerB})`;

    // Dynamic style tag that globally overrides brand primary classes to the active accent color
    let styleTag = document.getElementById('uj-cloth-dynamic-theme');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'uj-cloth-dynamic-theme';
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      :root {
        --color-primary: ${hexColor};
        --color-primary-rgb: ${r}, ${g}, ${b};
      }

      /* Solid Backgrounds */
      .bg-emerald-600,
      .bg-emerald-500,
      .bg-emerald-700,
      .bg-emerald-800,
      .bg-teal-600,
      .bg-teal-500,
      .bg-teal-700,
      .bg-teal-800,
      .bg-primary {
        background-color: ${hexColor} !important;
        ${isLightAccent ? 'color: #0F172A !important;' : 'color: #FFFFFF !important;'}
      }

      ${isLightAccent ? `
      .bg-primary svg,
      .bg-primary span,
      .bg-primary p,
      .bg-primary div,
      .bg-primary .text-white,
      .text-white.bg-primary {
        color: #0F172A !important;
        stroke: #0F172A !important;
      }

      html:not(.dark) .bg-primary {
        border-color: #CBD5E1 !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
      }
      ` : ''}

      /* Hover Backgrounds */
      .hover\\:bg-emerald-700:hover,
      .hover\\:bg-emerald-800:hover,
      .hover\\:bg-emerald-600:hover,
      .hover\\:bg-teal-700:hover,
      .hover\\:bg-teal-800:hover,
      .hover\\:bg-teal-600:hover,
      .hover\\:bg-primary-hover:hover {
        background-color: ${darkerHex} !important;
      }

      /* Light / Translucent Background Tints */
      .bg-emerald-50,
      .bg-emerald-50\\/80,
      .bg-emerald-600\\/10,
      .bg-emerald-500\\/10,
      .bg-emerald-500\\/20,
      .bg-teal-50,
      .bg-teal-50\\/80,
      .bg-teal-600\\/10,
      .bg-teal-500\\/10,
      .bg-teal-500\\/20,
      .bg-primary\\/10,
      .bg-primary\\/5 {
        background-color: rgba(${r}, ${g}, ${b}, 0.1) !important;
      }

      .bg-emerald-600\\/70,
      .bg-emerald-600\\/80,
      .bg-primary\\/70 {
        background-color: rgba(${r}, ${g}, ${b}, 0.75) !important;
      }

      /* Dark Mode Translucent Backgrounds */
      .dark .bg-emerald-500\\/15,
      .dark .bg-emerald-950\\/30,
      .dark .bg-emerald-900\\/30,
      .dark .bg-emerald-500\\/20,
      .dark .bg-teal-500\\/15,
      .dark .bg-teal-950\\/30,
      .dark .bg-teal-900\\/30,
      .dark .bg-teal-500\\/20,
      .dark .bg-teal-950\\/20,
      .dark .bg-primary\\/20 {
        background-color: rgba(${r}, ${g}, ${b}, 0.18) !important;
      }

      .bg-emerald-400,
      .bg-teal-400 {
        background-color: ${hexColor} !important;
        opacity: 0.75 !important;
      }

      /* Text Colors: Light Mode Contrast-Guarded */
      html:not(.dark) .text-emerald-600,
      html:not(.dark) .text-emerald-500,
      html:not(.dark) .text-emerald-700,
      html:not(.dark) .text-teal-600,
      html:not(.dark) .text-teal-500,
      html:not(.dark) .text-teal-700,
      html:not(.dark) .text-primary {
        color: ${safeLightText} !important;
      }

      /* Text Colors: Dark Mode Contrast-Guarded */
      html.dark .text-emerald-600,
      html.dark .text-emerald-500,
      html.dark .text-emerald-400,
      html.dark .text-emerald-700,
      html.dark .text-teal-600,
      html.dark .text-teal-500,
      html.dark .text-teal-400,
      html.dark .text-teal-700,
      html.dark .text-primary {
        color: ${safeDarkText} !important;
      }

      /* Hover Text Colors */
      html:not(.dark) .hover\\:text-emerald-600:hover,
      html:not(.dark) .hover\\:text-emerald-700:hover,
      html:not(.dark) .hover\\:text-teal-600:hover,
      html:not(.dark) .hover\\:text-teal-700:hover,
      html:not(.dark) .hover\\:text-primary:hover,
      html:not(.dark) .group:hover .group-hover\\:text-primary,
      html:not(.dark) .group:hover .group-hover\\:text-emerald-600 {
        color: ${safeLightText} !important;
      }

      html.dark .hover\\:text-emerald-600:hover,
      html.dark .hover\\:text-emerald-700:hover,
      html.dark .hover\\:text-teal-600:hover,
      html.dark .hover\\:text-teal-700:hover,
      html.dark .hover\\:text-primary:hover,
      html.dark .group:hover .group-hover\\:text-primary,
      html.dark .group:hover .group-hover\\:text-emerald-600 {
        color: ${safeDarkText} !important;
      }

      /* Borders */
      .border-emerald-600,
      .border-emerald-500,
      .border-emerald-500\\/20,
      .border-teal-600,
      .border-teal-500,
      .border-teal-500\\/20,
      .border-primary,
      .border-primary\\/40,
      .focus\\:border-emerald-500:focus,
      .focus\\:border-emerald-600:focus,
      .focus\\:border-teal-500:focus,
      .focus\\:border-teal-600:focus,
      .focus\\:border-primary:focus {
        border-color: ${hexColor} !important;
      }

      /* Glow / Shadows */
      .shadow-emerald-600\\/30,
      .shadow-emerald-600\\/20,
      .shadow-teal-600\\/30,
      .shadow-teal-600\\/20,
      .shadow-primary\\/30,
      .shadow-primary\\/20,
      .shadow-primary {
        box-shadow: 0 10px 15px -3px rgba(${r}, ${g}, ${b}, 0.28) !important;
      }

      /* Gradients: only override explicit primary gradient tokens */
      .from-primary {
        --tw-gradient-from: ${hexColor} var(--tw-gradient-from-position) !important;
      }
      .to-primary {
        --tw-gradient-to: ${companionShade} var(--tw-gradient-to-position) !important;
      }

      .fill-primary {
        fill: ${hexColor} !important;
      }
      .stroke-primary {
        stroke: ${hexColor} !important;
      }
    `;
  }
}

export function getSavedAccentColor(): string {
  if (typeof window === 'undefined') return DEFAULT_THEME_COLOR;
  const stored = localStorage.getItem('uzair_jibran_accent_color');
  if (!stored || stored === '#059669' || stored === '#10B981' || stored === '#6366F1') {
    return DEFAULT_THEME_COLOR;
  }
  return stored;
}

export function isThemeColorPickerEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('show_navbar_theme_color_picker');
  return stored !== 'false';
}

export function setThemeColorPickerEnabled(enabled: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('show_navbar_theme_color_picker', enabled ? 'true' : 'false');
    window.dispatchEvent(new Event('theme_color_picker_visibility_changed'));
  }
}

export const DEFAULT_SIDEBAR_COLOR = '#FFFFFF'; // Crisp white high-contrast for black sidebar

export function isDarkModeActive(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const stored = localStorage.getItem('color-theme');
    if (stored === '"dark"' || stored === 'dark') return true;
    if (stored === '"light"' || stored === 'light') return false;
  } catch (_) {}
  return document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
}

/**
 * Ensures a color has sufficient contrast against the sidebar background.
 * - In Light Mode (App): Sidebar is BLACK (#0B0F17) -> Font CAN be white! Blocks black/dark invisible colors.
 * - In Dark Mode (App): Sidebar is WHITE (#FFFFFF) -> Font CAN be black! Blocks white/light invisible colors.
 */
export function getSafeSidebarColor(hexColor: string, isDarkMode?: boolean): { safeColor: string; wasAdjusted: boolean } {
  const inDark = typeof isDarkMode === 'boolean' ? isDarkMode : isDarkModeActive();
  const isLightBg = isSidebarBackgroundLight(inDark);
  const defaultFallback = isLightBg ? '#0F172A' : '#FFFFFF';

  if (!hexColor) return { safeColor: defaultFallback, wasAdjusted: false };
  
  let cleanHex = hexColor.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return { safeColor: defaultFallback, wasAdjusted: false };
  }

  // If sidebar is NOT light (it's dark, navy, charcoal, or a custom gradient):
  // White (#FFFFFF) and light colors are ALWAYS valid and readable! Never block white!
  if (!isLightBg) {
    if (cleanHex.toUpperCase() === 'FFFFFF') {
      return { safeColor: '#FFFFFF', wasAdjusted: false };
    }
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // Block only pure pitch black or completely dark unreadable font colors on dark background
    if (luminance <= 0.08) {
      return { safeColor: '#FFFFFF', wasAdjusted: true };
    }
    return { safeColor: `#${cleanHex}`, wasAdjusted: false };
  }

  // If sidebar is LIGHT background (#FFFFFF):
  // Block white-on-white text:
  if (cleanHex.toUpperCase() === 'FFFFFF') {
    return { safeColor: '#0F172A', wasAdjusted: true };
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if (luminance >= 0.85) {
    return { safeColor: '#0F172A', wasAdjusted: true };
  }

  return { safeColor: `#${cleanHex}`, wasAdjusted: false };
}

export function getSavedSidebarColor(isDarkMode?: boolean): string {
  const inDark = typeof isDarkMode === 'boolean' ? isDarkMode : isDarkModeActive();
  const isLightBg = isSidebarBackgroundLight(inDark);
  const defaultFallback = isLightBg ? '#0F172A' : '#FFFFFF';
  if (typeof window === 'undefined') return defaultFallback;

  const raw = localStorage.getItem('uzair_jibran_sidebar_raw_color') 
    || localStorage.getItem('uzair_jibran_sidebar_color');

  // If cached value was an invisible color for current background mode, reset to proper default
  if (isLightBg && (raw === '#FFFFFF' || raw === '#F8FAFC' || raw === '#F1F5F9' || !raw)) {
    return '#0F172A';
  }
  if (!isLightBg && (raw === '#0F172A' || raw === '#1E293B' || raw === '#475569' || raw === '#000000' || !raw)) {
    return '#FFFFFF';
  }

  return getSafeSidebarColor(raw, isDarkMode).safeColor;
}

export function applySidebarColor(hexColor: string, isDarkMode?: boolean): { safeColor: string; wasAdjusted: boolean } {
  if (!hexColor) return { safeColor: DEFAULT_SIDEBAR_COLOR, wasAdjusted: false };
  const prevColor = typeof window !== 'undefined' ? localStorage.getItem('uzair_jibran_sidebar_color') : null;

  try {
    localStorage.setItem('uzair_jibran_sidebar_raw_color', hexColor);
  } catch (_) {}

  const { safeColor, wasAdjusted } = getSafeSidebarColor(hexColor, isDarkMode);
  try {
    localStorage.setItem('uzair_jibran_sidebar_color', safeColor);
    if (typeof window !== 'undefined' && prevColor !== safeColor) {
      window.dispatchEvent(new Event('uzair_jibran_sidebar_color_changed'));
    }
  } catch (_) {}

  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--sidebar-font-color', safeColor);
  }

  return { safeColor, wasAdjusted };
}
