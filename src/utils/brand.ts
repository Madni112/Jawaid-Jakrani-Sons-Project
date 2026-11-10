/**
 * Dynamic Enterprise Branding Configuration for AL MUHAMMADI
 */

export interface BrandConfig {
  isAlm: boolean;
  code: 'AM' | 'ALM';
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
  return true;
}

export function getBrandConfig(): BrandConfig {
  return {
    isAlm: true,
    code: 'AM',
    name: 'AL MUHAMMADI TILE EMPORIUM',
    fullName: 'AL MUHAMMADI TILE EMPORIUM',
    brandWord1: 'AL',
    brandWord2: 'MUHAMMADI',
    brandSuffix: 'TILE EMPORIUM',
    shortName: 'AM',
    portalName: 'Al Muhammadi Tile Emporium (AM)',
    adminEmail: 'admin@almuhammadi.com',
    supportPhone: '0312-8039911',
    address: 'Main Showroom & Warehouse, Pakistan',
    tagline: 'Tile Emporium & Sanitary Management Suite',
  };
}
