import { supabase } from '../Context/supabaseClient';

export interface ColumnCustomStyle {
  key: string;
  label: string;
  visible: boolean;
  widthPercent: number; // e.g. 15
  align: 'left' | 'center' | 'right';
  textColor?: string;
  bgColor?: string;
  wrapText?: boolean;
}

export type DesignThemeKey = 'modern-striped' | 'classic-ledger' | 'corporate-grid' | 'minimal-clean' | 'dense-audit';
export type PaperSizeKey = 'a4-portrait' | 'a4-landscape' | 'thermal-80mm';
export type FontFamilyKey = 'Inter' | 'Roboto' | 'JetBrains Mono' | 'Merriweather' | 'Outfit';

export interface TableBorderSettings {
  mode: 'all-grid' | 'horizontal-only' | 'vertical-only' | 'outer-box' | 'accounting' | 'none';
  headerUnderline: 'none' | 'thin' | 'heavy';
  horizontalDividers: 'none' | 'subtle' | 'solid';
  verticalDividers: boolean;
  totalsDoubleRule: boolean;
  borderColor: string; // hex color e.g. '#cbd5e1'
}

export interface ReportLayoutPreset {
  id: string; // e.g. 'custom', 'custom-1', etc.
  name: string; // e.g. 'Custom', 'Custom 1', etc.
  designTheme: DesignThemeKey;
  paperSize: PaperSizeKey;
  fontFamily: FontFamilyKey;
  fontScale: number; // 80 to 120 (percent)
  tableBorder: 'none' | 'subtle' | 'full-grid';
  borderSettings?: TableBorderSettings;
  columns: ColumnCustomStyle[];
  savedBy: string; // User full name or email
  savedAt: string; // ISO date string
}

export interface ReportCustomLayoutConfig {
  hidden?: boolean;
  activeLayoutId?: string; // id of active preset, or 'default'
  layouts: ReportLayoutPreset[];
}

export interface SystemMasterConfig {
  allow_backup_global: boolean; // Master system switch for backups
  allow_backup_super_admin: boolean; // Can Super Admin perform backups
  backup_allowed_users: string[]; // Specific employee emails/slugs allowed to backup
  allow_credit_limit_super_admin: boolean; // Can Super Admin edit credit limits
  credit_limit_allowed_users: string[]; // Specific employee emails/slugs allowed to edit credit limits
  hidden_reports?: string[]; // IDs of hidden reports
  report_custom_layouts?: Record<string, ReportCustomLayoutConfig>; // reportId -> config
  allow_report_visibility_super_admin?: boolean; // Can Super Admin edit report visibility/layouts
  report_visibility_allowed_users?: string[]; // Specific employee emails allowed to edit reports
  company_ntn?: string; // Company NTN (National Tax Number)
  company_strn?: string; // Company STRN / Sales Tax Registration #
  product_colors?: string[]; // Dynamic product color list stored in DB
}

export const ALL_ADVANCE_REPORT_IDS: string[] = [
  'category-wise-sales',
  'product-sales-history',
  'sale-inv-detail',
  'commercial-sale-ledger',
  'sales-query-center',
  'sales-return-ledger',
  'customer-sales-breakdown',
  'customer-loyalty-ledger',
  'purchase-ledger',
  'category-purchases',
  'product-purchase-history',
  'purchase-invoice-detail',
  'purchase-query-center',
  'vendor-return-ledger',
  'vendor-balance-detail',
  'vendor-outstanding-report',
  'stock-activity-ledger',
  'current-stock-balance',
  'as-of-date-stock-status',
  'inter-warehouse-transfers',
  'category-wise-stock',
  'warehouse-location-report',
  'holding-stock-report',
  'customer-ledger',
  'vendor-ledger',
  'combined-ledger',
  'expense-report',
  'balance-sheet-stat',
  'executive-summary-report'
];

export const DEFAULT_SYSTEM_CONFIG: SystemMasterConfig = {
  allow_backup_global: true,
  allow_backup_super_admin: true,
  backup_allowed_users: [],
  allow_credit_limit_super_admin: true,
  credit_limit_allowed_users: [],
  hidden_reports: ALL_ADVANCE_REPORT_IDS,
  report_custom_layouts: {},
  allow_report_visibility_super_admin: true,
  report_visibility_allowed_users: [],
  company_ntn: '',
  company_strn: '',
  product_colors: [
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
  ],
};

  const LOCAL_STORAGE_KEY = 'erp_system_master_permissions_cache';
  const TENANT_CONFIG_SLUG = '__system_master_config__';

  /**
   * Fetch the master system permissions from Supabase (or fallback to localStorage cache)
   */
  export const fetchSystemMasterConfig = async (): Promise<SystemMasterConfig> => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('seller_address')
        .eq('slug', TENANT_CONFIG_SLUG)
        .maybeSingle();

      if (!error && data && data.seller_address) {
        try {
          const parsed = JSON.parse(data.seller_address);
          const merged: SystemMasterConfig = {
            ...DEFAULT_SYSTEM_CONFIG,
            ...parsed,
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        } catch (parseErr) {
          console.warn('Failed to parse system master permissions from cloud:', parseErr);
        }
      }
    } catch (err) {
      console.warn('Error fetching system permissions from Supabase:', err);
    }

    // Fallback to local storage cache
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_SYSTEM_CONFIG, ...JSON.parse(cached) };
      }
    } catch (_) {}

    return { ...DEFAULT_SYSTEM_CONFIG };
};

/**
 * Save master system permissions to both Supabase cloud and local storage
 */
export const saveSystemMasterConfig = async (
  config: SystemMasterConfig
): Promise<{ success: boolean; error?: string }> => {
  try {
    const payload = {
      name: 'System Master Permissions',
      slug: TENANT_CONFIG_SLUG,
      email: 'master@dev.erp',
      business_activity: 'CONFIG',
      seller_address: JSON.stringify(config),
    };

    const { error } = await supabase
      .from('tenants')
      .upsert([payload], { onConflict: 'slug' });

    if (error) throw error;

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('erp_system_permissions_updated', { detail: config }));
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save system permissions:', err);
    // Still save locally so dev settings work immediately
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('erp_system_permissions_updated', { detail: config }));
    return { success: false, error: err.message || 'Failed to sync to database' };
  }
};

/**
 * Check if a specific user has permission to backup/export ERP data
 */
export const canUserBackup = (
  userEmail: string | null | undefined,
  role: string | null | undefined,
  config?: SystemMasterConfig | null
): boolean => {
  const activeConfig = config || DEFAULT_SYSTEM_CONFIG;

  // 1. If global backup switch is turned off, nobody (including Super Admin) can backup
  if (!activeConfig.allow_backup_global) {
    return false;
  }

  const cleanRole = (role || '').trim().toLowerCase();
  const isSuperAdmin =
    cleanRole === 'super admin' ||
    cleanRole === 'superadmin' ||
    cleanRole === 'developer' ||
    cleanRole === 'admin';

  // 2. If user is Super Admin, check the allow_backup_super_admin toggle explicitly
  if (isSuperAdmin) {
    return Boolean(activeConfig.allow_backup_super_admin);
  }

  // 3. For any other user, check if their email or slug is in the whitelist
  if (!userEmail) return false;
  const cleanEmail = userEmail.trim().toLowerCase();
  return (activeConfig.backup_allowed_users || []).some(
    e => e.trim().toLowerCase() === cleanEmail
  );
};

/**
 * Check if a specific user has permission to edit/add customer credit limits
 */
export const canUserEditCreditLimit = (
  userEmail: string | null | undefined,
  role: string | null | undefined,
  config?: SystemMasterConfig | null
): boolean => {
  const activeConfig = config || DEFAULT_SYSTEM_CONFIG;

  const cleanRole = (role || '').trim().toLowerCase();
  const isSuperAdmin =
    cleanRole === 'super admin' ||
    cleanRole === 'superadmin' ||
    cleanRole === 'developer' ||
    cleanRole === 'admin';

  // 1. If user is Super Admin, check the allow_credit_limit_super_admin toggle explicitly
  if (isSuperAdmin) {
    return Boolean(activeConfig.allow_credit_limit_super_admin);
  }

  // 2. For any other user, check if their email or slug is in the whitelist
  if (!userEmail) return false;
  const cleanEmail = userEmail.trim().toLowerCase();
  return (activeConfig.credit_limit_allowed_users || []).some(
    e => e.trim().toLowerCase() === cleanEmail
  );
};

/**
 * Check if a specific user has permission to configure report visibility and print layouts
 */
export const canUserManageReports = (
  userEmail: string | null | undefined,
  role: string | null | undefined,
  config?: SystemMasterConfig | null
): boolean => {
  const activeConfig = config || DEFAULT_SYSTEM_CONFIG;

  const cleanRole = (role || '').trim().toLowerCase();
  const isDeveloperOrAdmin =
    cleanRole === 'developer' ||
    cleanRole === 'super admin' ||
    cleanRole === 'superadmin' ||
    cleanRole === 'admin';

  if (isDeveloperOrAdmin) {
    if (cleanRole === 'developer') return true;
    return activeConfig.allow_report_visibility_super_admin !== false;
  }

  if (!userEmail) return false;
  const cleanEmail = userEmail.trim().toLowerCase();
  return (activeConfig.report_visibility_allowed_users || []).some(
    e => e.trim().toLowerCase() === cleanEmail
  );
};

/**
 * Check whether a specific report ID is marked hidden
 */
export const isReportHidden = (
  reportId: string,
  config?: SystemMasterConfig | null
): boolean => {
  if (!config || !Array.isArray(config.hidden_reports)) return false;
  return config.hidden_reports.includes(reportId);
};

// Global Realtime listener for cross-device synchronization
if (typeof window !== 'undefined') {
  try {
    const channel = supabase
      .channel('system_master_config_realtime_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenants',
          filter: `slug=eq.${TENANT_CONFIG_SLUG}`,
        },
        (payload: any) => {
          if (payload?.new?.seller_address) {
            try {
              const updatedConfig = JSON.parse(payload.new.seller_address);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedConfig));
              window.dispatchEvent(
                new CustomEvent('erp_system_permissions_updated', { detail: updatedConfig })
              );
            } catch (err) {
              console.warn('Realtime config sync parse error:', err);
            }
          }
        }
      )
      .subscribe();

    // Check on window focus to ensure fresh state across tabs/sleep cycles
    window.addEventListener('focus', () => {
      fetchSystemMasterConfig();
    });
  } catch (err) {
    console.warn('Could not initialize Realtime config listener:', err);
  }
}

