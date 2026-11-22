/**
 * Dynamic Enterprise Branding Configuration for Jawaid Jakwani & Sons
 */

export interface BrandConfig {
  isAlm: boolean;
  code: 'J.J.S' | 'ALM';
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
    code: 'J.J.S',
    name: 'Jawaid Jakwani & Sons',
    fullName: 'Jawaid Jakwani & Sons',
    brandWord1: 'JAWAID',
    brandWord2: 'JAKWANI',
    brandSuffix: '& SONS',
    shortName: 'J.J.S',
    portalName: 'Jawaid Jakwani & Sons (J.J.S)',
    adminEmail: 'admin@jawaidjakwani.com',
    supportPhone: '0312-8039911',
    address: 'Main Showroom & Warehouse, Pakistan',
    tagline: 'Cloth Retail & Wholesale Management Suite',
  };
}
