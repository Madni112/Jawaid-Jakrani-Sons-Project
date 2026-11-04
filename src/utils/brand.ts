/**
 * Dynamic Enterprise Branding Configuration for Jawaid Jakwani & Sons
 * 
 * Guarantees zero cross-contamination so brand name, codes, and credentials
 * remain strictly scoped to JAWAID JAKWANI & SONS.
 */

export interface BrandConfig {
  isAlm: boolean;
  code: 'UJC' | 'ALM' | 'ZAC';
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
  return false;
}

export function getBrandConfig(): BrandConfig {
  return {
    isAlm: false,
    code: 'UJC',
    name: 'Jawaid Jakwani & Sons',
    fullName: 'JAWAID JAKWANI & SONS',
    brandWord1: 'JAWAID',
    brandWord2: 'JAKWANI',
    brandSuffix: '& SONS',
    shortName: 'JJS',
    portalName: 'Jawaid Jakwani & Sons (JJS)',
    adminEmail: 'jawaidjakwani@nht.com',
    supportPhone: '0312-8039911',
    address: 'Cloth Market, Pakistan',
    tagline: 'Retail & Wholesale Textile Management Infrastructure',
  };
}

