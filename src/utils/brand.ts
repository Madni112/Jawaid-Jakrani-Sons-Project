/**
 * Dynamic Enterprise Branding Configuration
 * 
 * Automatically detects whether the running portal is AL MUHAMMADI or ZOAIB ALI & COMPANY.
 * Guarantees zero cross-contamination so neither company's branding, codes, or credentials
 * leak into the other.
 */

export interface BrandConfig {
  isAlm: boolean;
  code: 'ALM' | 'ZAC';
  name: string;
  fullName: string;
  brandWord1: string;
  brandWord2: string;
  brandSuffix: string;
  shortName: string;
  portalName: string;
  adminEmail: string;
  supportPhone: string;
  address: string;
  tagline: string;
}

export function detectIsAlm(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Detect via Supabase URL (deterministic per project environment / .env)
    const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL || '').toLowerCase();
    if (supabaseUrl.includes('ioxsprfchcytqbyriwby')) return true; // Al Muhammadi Project Ref
    if (supabaseUrl.includes('wpzwntbgpeiiclytuuht')) return false; // Zohaib Ali Project Ref

    // 2. Detect via explicit environment variable
    const appBrand = (import.meta.env?.VITE_APP_BRAND || '').toLowerCase();
    if (appBrand.includes('muhammadi') || appBrand === 'alm' || appBrand === 'am') return true;
    if (appBrand.includes('zoaib') || appBrand.includes('zohaib') || appBrand === 'zac') return false;

    // 3. Detect via Hostname
    const hostname = (window.location.hostname || '').toLowerCase();
    if (
      hostname === 'am.noorhorizontechnologies.com' ||
      hostname.startsWith('am.') ||
      hostname.includes('muhammadi') ||
      hostname.includes('al-muhammadi')
    ) {
      return true;
    }
    if (
      hostname === 'zac.noorhorizontechnologies.com' ||
      hostname.startsWith('zac.') ||
      hostname.includes('zoaib') ||
      hostname.includes('zohaib')
    ) {
      return false;
    }

    // 4. Detect via initial document title or window URL
    const docTitle = (typeof document !== 'undefined' ? document.title : '').toLowerCase();
    if (docTitle.includes('muhammadi')) return true;
    if (docTitle.includes('zoaib') || docTitle.includes('zohaib')) return false;

    const href = (window.location.href || '').toLowerCase();
    if (href.includes('muhammadi') || href.includes('al-muhammadi')) return true;
  } catch (_) {
    // fallback gracefully
  }

  return false;
}

export function getBrandConfig(): BrandConfig {
  const isAlm = detectIsAlm();

  if (isAlm) {
    return {
      isAlm: true,
      code: 'ALM',
      name: 'AL MUHAMMADI',
      fullName: 'AL MUHAMMADI',
      brandWord1: 'AL',
      brandWord2: 'MUHAMMADI',
      brandSuffix: 'ENTERPRISE ERP',
      shortName: 'ALM',
      portalName: 'Al Muhammadi (AM)',
      adminEmail: 'admin@almuhammadi.com',
      supportPhone: '0312-8039911',
      address: 'Main Showroom & Warehouse, Pakistan',
      tagline: 'Enterprise Management Suite',
    };
  }

  return {
    isAlm: false,
    code: 'ZAC',
    name: 'Zoaib Ali & Company',
    fullName: 'ZOAIB ALI & COMPANY',
    brandWord1: 'ZOAIB',
    brandWord2: 'ALI',
    brandSuffix: '& COMPANY',
    shortName: 'ZAC',
    portalName: 'Zohaib Ali Company (ZAC)',
    adminEmail: 'admin@zoaibalicompany.com',
    supportPhone: '0312-8039911',
    address: 'Saddar Bazar, Hyderabad',
    tagline: 'Enterprise Management Suite',
  };
}

