/**
 * Dynamic Enterprise Branding Configuration for ZOHAIB ALI AND COMPANY
 */

export interface BrandConfig {
  isAlm: boolean;
  code: 'ZAC' | 'ALM';
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
    code: 'ZAC',
    name: 'Zohaib Ali Company',
    fullName: 'Zohaib Ali Company',
    brandWord1: 'ZOHAIB',
    brandWord2: 'ALI',
    brandSuffix: 'COMPANY',
    shortName: 'ZAC',
    portalName: 'Zohaib Ali Company (ZAC)',
    adminEmail: 'admin@zohaibalicompany.com',
    supportPhone: '0312-8039911',
    address: 'Main Showroom & Warehouse, Pakistan',
    tagline: 'Tile Emporium & Sanitary Management Suite',
  };
}
