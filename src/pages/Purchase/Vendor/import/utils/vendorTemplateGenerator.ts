import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

export const normalizeVendorText = (s: string) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ة]/g, 'ہ')
    .replace(/[أإآ]/g, 'ا')
    .replace(/\s+/g, ' ');

export const handleDownloadVendorTemplate = () => {
  const templateData = [
    [
      'Vendor Name *',
      'Company / Mill Name',
      'Primary Contact Phone',
      'City *',
      'Area',
      'Office / Mill Address',
      'Province',
      'Opening Balance',
      'Balance Nature (Cr / Dr)',
      'Page #'
    ],
    [
      'Al-Karam Textile Mills',
      'Al-Karam Studio',
      '0300-1122334',
      'Karachi',
      'SITE Area',
      'Plot # 45, Industrial Zone, SITE',
      'Sindh',
      450000,
      'Credit',
      '101'
    ],
    [
      'Gul Ahmed Fabrics',
      'Gul Ahmed Group',
      '0321-9988776',
      'Karachi',
      'Landhi Industrial',
      'Sector 12, Landhi Industrial Area',
      'Sindh',
      820000,
      'Credit',
      '102'
    ],
    [
      'Kohinoor Textile Traders',
      'Kohinoor Mills',
      '0333-5566778',
      'Faisalabad',
      'Clock Tower Market',
      'Shop 18, Main Cloth Market, Faisalabad',
      'Punjab',
      125000,
      'Credit',
      '103'
    ],
    [
      'Sindh Yarn & Dyeing',
      'Sindh Yarn Corp',
      '0303-3344556',
      'ماتلی',
      'مین بازار',
      'نزد ریلوے روڈ، ماتلی',
      'Sindh',
      65000,
      'Credit',
      '104'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 28 }, // Vendor Name
    { wch: 24 }, // Company Name
    { wch: 22 }, // Phone
    { wch: 18 }, // City
    { wch: 20 }, // Area
    { wch: 38 }, // Address
    { wch: 16 }, // Province
    { wch: 18 }, // Opening Balance
    { wch: 24 }, // Balance Nature
    { wch: 12 }, // Page #
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vendors Format');
  XLSX.writeFile(wb, 'Vendor_Upload_Format.xlsx');
  toast.success('Downloaded Vendor_Upload_Format.xlsx!');
};
