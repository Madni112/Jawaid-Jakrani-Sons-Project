import { supabase, fetchAllPages } from '../Context/supabaseClient';
import { fetchSystemMasterConfig, saveSystemMasterConfig } from './systemPermissions';

export const DEFAULT_PRODUCT_COLORS: string[] = [
  'White',
  'Off White',
  'Black',
  'Matte Black',
  'Grey',
  'Dark Grey',
  'Light Grey',
  'Beige',
  'Cream',
  'Ivory',
  'Brown',
  'Walnut',
  'Oak',
  'Gold',
  'Rose Gold',
  'Silver',
  'Chrome',
  'Bronze',
  'Brass',
  'Copper',
  'Charcoal',
  'Blue',
  'Navy Blue',
  'Green',
  'Red'
];

export const COLOR_SWATCH_MAP: Record<string, string> = {
  white: '#ffffff',
  'off white': '#fafaf9',
  black: '#0f172a',
  'matte black': '#18181b',
  grey: '#64748b',
  gray: '#64748b',
  'dark grey': '#334155',
  'dark gray': '#334155',
  'light grey': '#cbd5e1',
  'light gray': '#cbd5e1',
  beige: '#f5f5dc',
  cream: '#fffdd0',
  ivory: '#fffff0',
  brown: '#78350f',
  walnut: '#451a03',
  oak: '#a16207',
  gold: '#eab308',
  'rose gold': '#b76e79',
  silver: '#94a3b8',
  chrome: '#cbd5e1',
  bronze: '#cd7f32',
  brass: '#b5a642',
  copper: '#b87333',
  charcoal: '#374151',
  blue: '#2563eb',
  'navy blue': '#1e3a8a',
  green: '#16a34a',
  red: '#dc2626',
  yellow: '#ca8a04',
  pink: '#ec4899',
  maroon: '#800000',
  wooden: '#854d0e',
};

export const getSwatchColor = (colorName: string): string => {
  const norm = String(colorName || '').trim().toLowerCase();
  return COLOR_SWATCH_MAP[norm] || '#94a3b8';
};

/**
 * Extracts a color string from a product object safely across all schema variations.
 */
export const extractProductColor = (
  product: {
    color?: string;
    product_description?: string;
    bin?: string;
    finish_type?: string;
    [key: string]: any;
  } | null | undefined
): string => {
  if (!product) return '';
  if (product.color && typeof product.color === 'string' && product.color.trim()) {
    return product.color.trim();
  }
  const desc = String(product.product_description || '');
  const match = desc.match(/Color:\s*([^|;\n\r]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return '';
};

const LOCAL_COLOR_CACHE_KEY = 'zac_product_colors_cache';

/**
 * Fetch all available product colors from:
 * 1. Cloud-stored SystemMasterConfig in tenants.seller_address
 * 2. Distinct colors parsed from all products in the database
 * 3. Default architectural colors palette
 */
export const fetchProductColors = async (): Promise<string[]> => {
  const gathered = new Set<string>(DEFAULT_PRODUCT_COLORS);

  // 1. Cloud SystemMasterConfig
  try {
    const config = await fetchSystemMasterConfig();
    if (config?.product_colors && Array.isArray(config.product_colors)) {
      config.product_colors.forEach((c) => {
        if (typeof c === 'string' && c.trim()) gathered.add(c.trim());
      });
    }
  } catch (err) {
    console.warn('Failed to load cloud product colors:', err);
  }

  // 2. Distinct colors from product_description in database
  try {
    const { data: prods } = await fetchAllPages(
      supabase
        .from('products')
        .select('product_description')
        .not('product_description', 'is', null)
    );

    if (prods && Array.isArray(prods)) {
      prods.forEach((p) => {
        const c = extractProductColor(p);
        if (c) gathered.add(c);
      });
    }
  } catch (err) {
    console.warn('Failed to query products for colors:', err);
  }

  // 3. LocalStorage fallback cache
  try {
    const cached = localStorage.getItem(LOCAL_COLOR_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        parsed.forEach((c) => {
          if (typeof c === 'string' && c.trim()) gathered.add(c.trim());
        });
      }
    }
  } catch (_) {}

  const sorted = Array.from(gathered).sort((a, b) => a.localeCompare(b));
  try {
    localStorage.setItem(LOCAL_COLOR_CACHE_KEY, JSON.stringify(sorted));
  } catch (_) {}

  return sorted;
};

/**
 * Saves a new color to the database (tenants.seller_address SystemMasterConfig)
 * and syncs across all open tabs/workstations.
 */
export const saveNewProductColor = async (
  newColor: string
): Promise<{ success: boolean; colors: string[]; error?: string }> => {
  const clean = newColor.trim();
  if (!clean) {
    return { success: false, colors: [], error: 'Color name cannot be empty' };
  }

  try {
    const config = await fetchSystemMasterConfig();
    const existingColors = new Set<string>(config.product_colors || DEFAULT_PRODUCT_COLORS);

    // Case-insensitive check
    let exists = false;
    existingColors.forEach((c) => {
      if (c.toLowerCase() === clean.toLowerCase()) exists = true;
    });

    if (!exists) {
      existingColors.add(clean);
    }

    const updatedList = Array.from(existingColors).sort((a, b) => a.localeCompare(b));
    const updatedConfig = {
      ...config,
      product_colors: updatedList,
    };

    const res = await saveSystemMasterConfig(updatedConfig);
    try {
      localStorage.setItem(LOCAL_COLOR_CACHE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(
        new CustomEvent('zac_colors_updated', { detail: { colors: updatedList, added: clean } })
      );
    } catch (_) {}

    return {
      success: res.success,
      colors: updatedList,
      error: res.error,
    };
  } catch (err: any) {
    return { success: false, colors: [], error: err.message || 'Failed to save color' };
  }
};

/**
 * Deletes a custom color from the database configuration.
 */
export const deleteProductColor = async (
  colorToDelete: string
): Promise<{ success: boolean; colors: string[]; error?: string }> => {
  try {
    const config = await fetchSystemMasterConfig();
    const current = config.product_colors || DEFAULT_PRODUCT_COLORS;
    const updatedList = current.filter(
      (c) => c.toLowerCase() !== colorToDelete.trim().toLowerCase()
    );

    const updatedConfig = {
      ...config,
      product_colors: updatedList,
    };

    const res = await saveSystemMasterConfig(updatedConfig);
    try {
      localStorage.setItem(LOCAL_COLOR_CACHE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(
        new CustomEvent('zac_colors_updated', {
          detail: { colors: updatedList, deleted: colorToDelete },
        })
      );
    } catch (_) {}

    return {
      success: res.success,
      colors: updatedList,
      error: res.error,
    };
  } catch (err: any) {
    return { success: false, colors: [], error: err.message || 'Failed to delete color' };
  }
};
